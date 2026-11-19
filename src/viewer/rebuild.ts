// Rebuild driver (spec 2.3.1, AR-10 to AR-16, BG-51 to BG-55): a store
// subscription fills the queue on every time change and restarts the 120 ms
// settle timer; a useFrame callback at priority -1 drains the queue under the
// slice of AR-13, applies each build, and runs the visual pass. No callback
// here calls setState; the settle timer is the one writer (setTessellation).
//
// Four rules keep the loop cheap (WP-H1, spec 2.9, docs/perf/README.md):
//   1. A rebuild request only raises a flag. `driverFrame` walks the handles
//      once per rendered frame, however many callers asked (WP-H1 fix 1).
//   2. The visual pass runs when a field it reads changed, not on every store
//      write, so an orbit drag costs no pass (WP-H1 fix 2).
//   3. A structure with no mesh at t gives its buffers back once time settles
//      (WP-H1 fix 3), so a 180 dpf fish holds no embryo geometry.
//   4. The 8 ms slice of AR-13 grows on a machine whose frame costs far more
//      than the 16.7 ms it assumes (WP-H1 fix 4), so the geometry never falls
//      more than the 5 frames of QP-18 behind the time the user set.
// `window.__atlasPerf` (QP-40) publishes the frame and drain times.
import { useFrame, useThree } from '@react-three/fiber'
import { BufferGeometry, Frustum, InstancedMesh, Matrix4, Sphere, Vector3 } from 'three'
import type { WebGLRenderer } from 'three'
import { useEffect } from 'react'
import { hasMeshAt } from '../core/presence.ts'
import { SETTLE_DELAY_MS, sliceBudget } from '../core/rebuildQueue.ts'
import type { QueuedJob, RebuildJob } from '../core/rebuildQueue.ts'
import type { Lod } from '../core/primitives/types.ts'
import { settingsStore } from '../state/slices/settings.ts'
import { atlasStore, readAtlas } from '../state/store.ts'
import type { AtlasState } from '../state/store.ts'
import { applyInstancedBuild, applyMeshBuild, syncOutlines } from './applyBuild.ts'
import { applyVisualPass } from './materials.ts'
import type { VisualInput } from './materials.ts'
import { bindData, frameAt, getRuntime, markReady } from './runtime.ts'
import type { StructureHandle, ViewerRuntime } from './runtime.ts'
import { documentTheme, readThemeTokens, variantFor } from './tokens.ts'

/** Frames of render time kept for the slice estimate. */
const BUDGET_WINDOW = 16

const frustum = new Frustum()
const projView = new Matrix4()
const sphere = new Sphere()
const tmp = new Vector3()

function inFrustum(center: Vector3, radius: number): boolean {
  sphere.set(tmp.copy(center), radius)
  return frustum.intersectsSphere(sphere)
}

/**
 * Binds the store's data to the runtime when a caller runs before the driver's effect (child
 * effects first). Idempotent: `useStructureHandle` calls it at every handle mount and the camera
 * rig at its own, and a second call with the same data does nothing.
 */
export function ensureBound(rt: ViewerRuntime): void {
  const data = readAtlas().data
  if (data && rt.data !== data) bindData(rt, data)
}

/** Replaces the queue with one job per present structure at `lod` (AR-12, AR-13). */
export function enqueueAll(rt: ViewerRuntime, lod: Lod): void {
  ensureBound(rt)
  const s = readAtlas()
  const frame = frameAt(rt, s.time)
  if (!frame) return
  const camera = rt.camera
  if (camera) {
    camera.updateMatrixWorld()
    projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(projView)
  }
  const jobs: RebuildJob[] = []
  for (const h of rt.handles.values()) {
    if (h.failed || !hasMeshAt(h.record, s.time, { sex: s.sex })) continue
    let priority = 2
    if (h.isSkin) priority = 0
    else if ((s.selection as readonly string[]).includes(h.id) || s.hover === h.id) priority = 1
    else if (camera && h.bounds && !inFrustum(h.center, h.radius)) priority = 3
    jobs.push({ id: h.id, hpf: s.time, lod, priority, volume: h.volume })
  }
  rt.queue.replace(jobs, rt.frameNo)
  rt.finalDrained = false
  rt.visualDirty = true
  rt.invalidate()
}

// ---- request coalescing (WP-H1) ---------------------------------------------------------------
// Every caller that wants a rebuild raises this flag instead of walking the handles itself. The
// driver reads it at the top of the next frame. Mounting the 215 structures of Structures.tsx
// called scheduleRebuild once per handle, and each call ran hasMeshAt over every handle mounted
// so far: about 23,000 presence evaluations before the first frame. Now it runs once.
let requestedLod: Lod | null = null
let settleTimer: ReturnType<typeof setTimeout> | null = null

/** Asks for a rebuild at `lod` on the next frame; the last request of a frame wins. */
export function requestRebuild(rt: ViewerRuntime, lod: Lod): void {
  requestedLod = lod
  rt.invalidate()
}

/** A time change: interactive jobs now, final jobs 120 ms after the last change (AR-11). */
export function scheduleRebuild(rt: ViewerRuntime): void {
  requestRebuild(rt, 'interactive')
  if (settleTimer !== null) clearTimeout(settleTimer)
  settleTimer = setTimeout(() => {
    settleTimer = null
    readAtlas().setTessellation('final')
    requestRebuild(rt, 'final')
  }, SETTLE_DELAY_MS)
}

function runJob(rt: ViewerRuntime, job: QueuedJob): void {
  const handle = rt.handles.get(job.id)
  if (!handle || handle.failed || !rt.bodyModel) return
  const frame = rt.bodyModel(job.hpf)
  try {
    if (handle.instanced) applyInstancedBuild(rt, handle, frame, job.hpf, job.lod)
    else applyMeshBuild(rt, handle, frame, job.hpf, job.lod)
    // The world box of this structure may have moved: the dissect caches key on this counter.
    rt.buildVersion++
  } catch (err) {
    // AR-71: one console error per structure, the structure hides, the drain continues.
    handle.failed = true
    handle.group.visible = false
    console.error(`[atlas] build failed for ${job.id}`, err)
  }
}

function visualInput(): VisualInput {
  const s = readAtlas()
  const theme = documentTheme(s.theme)
  // The ghost colour follows the ground the scene draws on, so a ghost over the preview keeps the
  // dark-theme grey whatever the page theme.
  const tokens = readThemeTokens(variantFor(theme, s.fluorescence.enabled))
  return {
    t: s.time,
    sex: s.sex,
    theme,
    palette: settingsStore.getState().palette,
    xray: s.xray,
    isolate: s.isolate,
    presentation: s.presentation,
    selection: s.selection,
    hover: s.hover,
    hiddenSystems: s.hiddenSystems,
    hiddenStructures: s.hiddenStructures,
    textMutedHex: tokens.textMuted,
    fluorescence: s.fluorescence,
  }
}

/**
 * The store fields the visual pass reads, as one comparable string (AR-74). The driver used to
 * run a pass over every handle on any store write, so an orbit drag, which writes the camera
 * pose per pointer move, paid for a full pass per frame.
 */
function visualKey(s: AtlasState): string {
  return [
    s.time, s.sex, s.theme, s.xray, s.isolate ? 1 : 0, s.presentation ? 1 : 0,
    s.hover ?? '', s.selection.join('~'), s.hiddenSystems.join('~'), s.hiddenStructures.join('~'),
  ].join('|')
}

/** True when every structure with a mesh at t has a final build (or failed). */
function allFinal(rt: ViewerRuntime): boolean {
  const s = readAtlas()
  for (const h of rt.handles.values()) {
    if (h.failed) continue
    if (!hasMeshAt(h.record, s.time, { sex: s.sex })) continue
    if (h.builtLod !== 'final' || h.builtHpf !== s.time) return false
  }
  return true
}

// ---- geometry retirement (WP-H1, BG-55) -------------------------------------------------------

/**
 * Frees both tessellation levels of a handle and clears its build state, so the next build
 * makes fresh buffers. The mesh keeps an empty geometry: three needs one, and `writeGeometry`
 * disposes it on the next build.
 */
export function retireHandle(rt: ViewerRuntime, handle: StructureHandle): boolean {
  let freed = false
  for (const [i, mesh] of handle.meshes.entries()) {
    const slot = handle.lodGeometries[i]
    if (slot) {
      for (const level of ['interactive', 'final'] as const) {
        const geometry = slot[level]
        if (!geometry) continue
        if (!rt.disposeLater.includes(geometry)) rt.disposeLater.push(geometry)
        slot[level] = null
        freed = true
      }
    }
    const previous = mesh.geometry
    mesh.geometry = new BufferGeometry()
    if (previous && !rt.disposeLater.includes(previous)) rt.disposeLater.push(previous)
    if (mesh instanceof InstancedMesh) mesh.count = 0
    syncOutlines(mesh)
  }
  if (!freed) return false
  rt.buildVersion++
  handle.builtLod = null
  handle.builtHpf = null
  handle.paramHash = null
  handle.bounds = null
  return true
}

/**
 * Gives back the buffers of every structure that draws nothing at t (AR-70, BG-55). It runs
 * once per settle, never during a scrub, so a pass over a stage boundary never frees a
 * structure the next frame needs. Returns the number of handles freed.
 */
export function retireAbsent(rt: ViewerRuntime): number {
  const s = readAtlas()
  let freed = 0
  for (const handle of rt.handles.values()) {
    if (handle.builtLod === null) continue
    if (hasMeshAt(handle.record, s.time, { sex: s.sex })) continue
    if (retireHandle(rt, handle)) freed++
  }
  return freed
}

// ---- the slice budget (AR-13, QP-18, WP-H1) ---------------------------------------------------
// `sliceBudget` in src/core/rebuildQueue.ts holds the policy; this window holds the measurement.

const renderRing = new Float64Array(BUDGET_WINDOW)
let renderAt = 0
let renderCount = 0
/** True when the queue still held jobs at the end of the previous frame (frames run back to back). */
let busyLast = false

function recordRender(ms: number): void {
  renderRing[renderAt] = ms
  renderAt = (renderAt + 1) % BUDGET_WINDOW
  if (renderCount < BUDGET_WINDOW) renderCount++
}

/** Median render time of the last frames that ran back to back, or 0 with too few samples. */
export function medianRenderMs(): number {
  if (renderCount < 4) return 0
  const sample = Array.from(renderRing.slice(0, renderCount)).sort((a, b) => a - b)
  return sample[Math.floor(sample.length / 2)] ?? 0
}

/** Milliseconds this frame gives the drain. */
export function sliceBudgetMs(): number {
  return sliceBudget(medianRenderMs())
}

// ---- the performance hook (QP-40) -------------------------------------------------------------

const RING = 600

export interface AtlasPerfStats {
  /** Jobs still waiting after the last drain. */
  queue: number
  /** Age in frames of the oldest waiting job (AR-12 bounds this at 4). */
  oldestAge: number
  /** Jobs served and milliseconds spent in the last drain. */
  served: number
  drainMs: number
  /** Wall milliseconds of the last completed rebuild, across its sliced frames. */
  rebuildMs: number
  /** Milliseconds the last frame gave the drain, and the median render time behind it. */
  budgetMs: number
  renderMs: number
  /** Handles whose buffers the last settle gave back. */
  retired: number
  /** three's counters for the last render. */
  calls: number
  triangles: number
  /** Driver frames since the page loaded. */
  frameNo: number
  ready: boolean
}

export interface AtlasPerf {
  /** Frame-to-frame times in ms, oldest first, at most 600 (QP-40). */
  frames(): number[]
  /** Milliseconds spent draining the queue per frame, oldest first, at most 600. */
  drains(): number[]
  /**
   * Wall milliseconds of each completed rebuild, from the frame that filled the queue to the
   * frame that emptied it, oldest first, at most 600. This is the number spec 2.9 calls the
   * full interactive rebuild; it spans the sliced frames of AR-12.
   */
  rebuilds(): number[]
  stats(): AtlasPerfStats
  /** Empties the ring buffers; call it before a measurement. */
  reset(): void
}

declare global {
  interface Window { __atlasPerf?: AtlasPerf }
}

const frameRing = new Float64Array(RING)
const drainRing = new Float64Array(RING)
const rebuildRing = new Float64Array(RING)
let ringAt = 0
let ringCount = 0
let rebuildAt = 0
let rebuildCount = 0
/** Start of the rebuild in flight, or null when the queue is empty. */
let rebuildStart: number | null = null
let lastRebuildMs = 0
let lastFrameAt = 0
let lastDrainMs = 0
let lastServed = 0
let lastRetired = 0
let renderer: WebGLRenderer | null = null

function ringToArray(ring: Float64Array, at: number, count: number): number[] {
  const out: number[] = []
  const start = count < RING ? 0 : at
  for (let i = 0; i < count; i++) out.push(ring[(start + i) % RING]!)
  return out
}

/** True while `?perf=1` asks for the User Timing entries of spec 6.5; off by default. */
const perfMarks =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('perf') === '1'

/** Closes the rebuild in flight at `now` and records its wall time. */
function endRebuild(now: number): void {
  if (rebuildStart === null) return
  lastRebuildMs = now - rebuildStart
  rebuildRing[rebuildAt] = lastRebuildMs
  rebuildAt = (rebuildAt + 1) % RING
  if (rebuildCount < RING) rebuildCount++
  if (perfMarks) performance.measure('atlas:rebuild', { start: rebuildStart, end: now })
  rebuildStart = null
}

function record(frameMs: number, drainMs: number): void {
  frameRing[ringAt] = frameMs
  drainRing[ringAt] = drainMs
  ringAt = (ringAt + 1) % RING
  if (ringCount < RING) ringCount++
}

function makePerf(rt: ViewerRuntime): AtlasPerf {
  return {
    frames: () => ringToArray(frameRing, ringAt, ringCount),
    drains: () => ringToArray(drainRing, ringAt, ringCount),
    rebuilds: () => ringToArray(rebuildRing, rebuildAt, rebuildCount),
    stats: () => ({
      queue: rt.queue.size(),
      oldestAge: rt.queue.oldestAge(rt.frameNo),
      served: lastServed,
      drainMs: lastDrainMs,
      rebuildMs: lastRebuildMs,
      budgetMs: sliceBudgetMs(),
      renderMs: medianRenderMs(),
      retired: lastRetired,
      calls: renderer ? renderer.info.render.calls : 0,
      triangles: renderer ? renderer.info.render.triangles : 0,
      frameNo: rt.frameNo,
      ready: rt.ready,
    }),
    // The render window survives a reset: it sets the slice budget, so emptying it would make
    // the next frames measure a driver that is warming up again.
    reset: () => {
      ringAt = 0
      ringCount = 0
      rebuildAt = 0
      rebuildCount = 0
      lastFrameAt = 0
      if (perfMarks) performance.clearMeasures('atlas:rebuild')
    },
  }
}

// ---- the driver -------------------------------------------------------------------------------

/** Mounts the driver inside the Canvas: data binding, the time subscription, the frame loop. */
export function useRebuildDriver(): void {
  const invalidate = useThree((s) => s.invalidate)
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const setDpr = useThree((s) => s.setDpr)
  const size = useThree((s) => s.size)

  useEffect(() => {
    const rt = getRuntime()
    rt.invalidate = invalidate
    rt.camera = camera
    renderer = gl
  }, [invalidate, camera, gl])

  // Interactive dpr cap while time moves, full dpr once settled (AR-21).
  useEffect(() => {
    const dprFor = (level: Lod): number => {
      const device = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
      return level === 'final' ? Math.min(device, 2) : Math.min(device, 2560 / Math.max(1, size.width), 2)
    }
    let last: number | null = null
    return atlasStore.subscribe(
      (s) => s.tessellation,
      (level) => {
        const dpr = dprFor(level)
        if (dpr !== last) {
          last = dpr
          setDpr(dpr)
        }
      },
      { fireImmediately: true },
    )
  }, [setDpr, size.width])

  useEffect(() => {
    const rt = getRuntime()
    appliedVersion = 0
    bindData(rt, readAtlas().data)
    scheduleRebuild(rt)
    if (typeof window !== 'undefined') window.__atlasPerf = makePerf(rt)
    const unsubData = atlasStore.subscribe((s) => s.data, (data) => {
      bindData(rt, data)
      scheduleRebuild(rt)
    })
    const unsubTime = atlasStore.subscribe((s) => [s.time, s.sex] as const, () => scheduleRebuild(rt), {
      equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1],
    })
    // Any write may move the camera or a panel, so every write asks for a frame; only a write the
    // visual pass reads bumps the version that makes the driver run the pass (AR-74).
    const bump = (): void => {
      rt.storeVersion++
      rt.invalidate()
    }
    const unsubAny = atlasStore.subscribe(() => rt.invalidate())
    const unsubVisual = atlasStore.subscribe(visualKey, bump)
    const unsubFluorescence = atlasStore.subscribe((s) => s.fluorescence, bump)
    const unsubSettings = settingsStore.subscribe(bump)
    return () => {
      unsubData()
      unsubTime()
      unsubAny()
      unsubVisual()
      unsubFluorescence()
      unsubSettings()
      if (settleTimer !== null) clearTimeout(settleTimer)
      settleTimer = null
      requestedLod = null
      // The renderer holds the GL context and the whole scene graph; a remount sets it again.
      renderer = null
      // A remount (context recovery, a StrictMode re-run) marks its own first frame (spec 6.5).
      markedFirstFrame = false
      if (typeof window !== 'undefined') delete window.__atlasPerf
    }
  }, [])

  useFrame(() => driverFrame(getRuntime()), -1)
}

let appliedVersion = 0
let markedFirstFrame = false

/** One frame of the driver (AR-10 to AR-14): dispose, enqueue, drain, visual pass, ready check. */
function driverFrame(rt: ViewerRuntime): void {
  const start = performance.now()
  const frameMs = lastFrameAt === 0 ? 0 : start - lastFrameAt
  lastFrameAt = start
  // Frames that follow a frame with work left run back to back, so the gap minus that frame's
  // slice is the render time. An idle gap never lands in the window.
  if (busyLast && frameMs > 0) recordRender(Math.max(0, frameMs - lastDrainMs))
  rt.frameNo++
  for (const g of rt.disposeLater) g.dispose()
  rt.disposeLater.length = 0

  // One walk of the handles per frame, whatever the number of callers (WP-H1).
  if (requestedLod !== null) {
    const lod = requestedLod
    requestedLod = null
    enqueueAll(rt, lod)
    // A new queue restarts the clock: the measure is the time from the last time change to a
    // view that matches it, across however many frames AR-12 slices the work over.
    rebuildStart = rt.queue.size() > 0 ? start : null
  }

  let drainMs = 0
  if (rt.queue.size() > 0) {
    let finalServed = false
    const result = rt.queue.drain(sliceBudgetMs(), () => performance.now(), rt.frameNo, (job) => {
      if (job.lod === 'final') finalServed = true
      runJob(rt, job)
    })
    drainMs = result.elapsedMs
    lastServed = result.served.length
    rt.visualDirty = true
    if (result.remaining > 0) rt.invalidate()
    else {
      endRebuild(performance.now())
    }
    if (result.remaining === 0 && finalServed) {
      rt.finalDrained = true
      // The queue is empty at the final level: nothing the user can see needs the buffers of a
      // structure that draws nothing at t, so give them back (BG-55).
      lastRetired = retireAbsent(rt)
    }
  }
  // An idle frame drains nothing, so `stats().drainMs` reports 0 instead of the last busy frame.
  lastDrainMs = drainMs

  if (rt.visualDirty || rt.storeVersion !== appliedVersion) {
    applyVisualPass(rt, visualInput())
    appliedVersion = rt.storeVersion
    rt.visualDirty = false
  }

  busyLast = rt.queue.size() > 0
  record(frameMs, drainMs)

  if (!rt.ready && rt.cameraPlaced && rt.data && rt.queue.size() === 0 && readAtlas().tessellation === 'final' && allFinal(rt)) {
    // The frame that follows this callback renders the final geometry; mark ready after it paints (QP-31).
    if (!markedFirstFrame) {
      markedFirstFrame = true
      performance.mark('atlas:first-frame')
    }
    requestAnimationFrame(() => markReady(rt))
  }
}
