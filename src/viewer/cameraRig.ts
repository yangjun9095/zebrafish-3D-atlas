// Camera rig controller (AR-38 to AR-42, D4, UX-IN-10 to UX-IN-15): the
// imperative half of CameraRig.tsx. The 18 degree field of view (presets.ts) puts the
// fit distance near 7 body radii, so the zoom-out limit is 12 body lengths rather than
// the 8 of UX-IN-08. Presets keep `camera.up` at +y; the dorsal
// and ventral presets sit 0.001 rad off the pole with the azimuth that puts the
// snout on the screen left (presets.ts). Fit is the projected-box fit of fit.ts inside
// the free rectangle of AR-42 (the fish fills about 70 percent of the free width);
// follow growth refits for the current view direction and filters the target and
// distance toward the body on each t change (UX-IN-12).
import { Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import type { BodyFrame } from '../core/bodyModel.ts'
import { atlasStore, readAtlas } from '../state/store.ts'
import type { CameraPose, ViewPreset } from '../state/store.ts'
import { DISSECT_SPREAD_END, dissectLayout } from '../core/dissect.ts'
import { dissectExtent, dissectReachMm, extentCorners, sameExtent } from './dissectFit.ts'
import type { DissectExtent } from './dissectFit.ts'
import { bodyBallFitPoints, bodyFitPoints, fitPose } from './fit.ts'
import {
  FOLLOW_TAU_S, FOV_DEG, PRESET_DIRECTIONS, PRESET_TWEEN_MS, bodyBoundingSphere, presetEase, slerpDir, viewOffsetFor,
} from './presets.ts'
import type { FitSphere, PresetName } from './presets.ts'
import { ensureBound } from './rebuild.ts'
import { frameAt, getRuntime } from './runtime.ts'

/** The subset of three-stdlib OrbitControls the rig touches. */
export interface ControlsLike {
  target: Vector3
  enabled: boolean
  minPolarAngle: number
  maxPolarAngle: number
  minDistance: number
  maxDistance: number
  update(): void
}

export interface RigDeps {
  camera: PerspectiveCamera
  controls(): ControlsLike | null
  size: { width: number; height: number }
  invalidate(): void
}

interface Pose { target: Vector3; dir: Vector3; dist: number }
interface Tween { from: Pose; to: Pose; start: number; duration: number; onDone(): void }

const POLAR_CLAMP = 0.05 * Math.PI
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function reducedMotion(): boolean {
  if (readAtlas().reducedMotion) return true
  return typeof matchMedia === 'function' && matchMedia(REDUCED_MOTION_QUERY).matches
}

function toPose(pose: CameraPose): Pose {
  const target = new Vector3(...pose.target)
  const dir = new Vector3(...pose.position).sub(target)
  const dist = Math.max(dir.length(), 1e-4)
  return { target, dir: dir.divideScalar(dist), dist }
}

const v3 = (a: readonly number[]): Vector3 => new Vector3(a[0], a[1], a[2])

export interface CameraRigController {
  mount(deps: RigDeps): void
  setSize(size: { width: number; height: number }): void
  unmount(): void
  frame(dt: number): void
  onStart(): void
  onEnd(): void
  onChange(): void
}

export function createCameraRig(): CameraRigController {
  let deps: RigDeps | null = null
  let tween: Tween | null = null
  let interacting = false
  /** Pose at the last `start` event; an `end` without movement (a click) is not a manual orbit. */
  let startPose: { position: Vector3; target: Vector3 } | null = null
  let bodyLength = 0
  let appliedOffset: { x: number; y: number } | null = null
  const follow = { goalTarget: new Vector3(), goalDist: 1, zoomFactor: 1, fitDist: 1, lastHpf: null as number | null, active: false }
  /** The dissect box the last fit enclosed (D17); a new box refits. */
  let fittedExtent: DissectExtent | null = null
  const unsubs: (() => void)[] = []

  const viewport = (d: RigDeps) => ({ width: d.size.width, height: d.size.height, reserved: getRuntime().reserved })
  /** The projected-box fit of fit.ts for a view direction (unit vector from the target toward the camera). */
  const fitFor = (d: RigDeps, frame: BodyFrame, dir: Vector3, extent = dissectExtent(getRuntime())): { target: Vector3; dist: number } => {
    // D17: above a dissect value of 0 the fit also encloses the box the slider moved the
    // structures into, so the spread and the inventory grid stay on screen. Past the end of the
    // spread the skin has faded out, so the body contributes only its yolk ball and its chorion
    // and an adult, which has neither, gives the whole frame to the grid (UI-65).
    fittedExtent = extent
    const body = dissectLayout.value >= DISSECT_SPREAD_END ? bodyBallFitPoints(frame) : bodyFitPoints(frame)
    const points = [...body, ...extentCorners(extent)]
    const pose = fitPose(points, [dir.x, dir.y, dir.z], viewport(d), FOV_DEG)
    return { target: v3(pose.target), dist: pose.distance }
  }
  /** The bounding sphere of AR-41, kept for the pan limit of UX-IN-08. */
  const fitOf = (frame: BodyFrame): FitSphere => bodyBoundingSphere(frame)

  const currentPose = (d: RigDeps): Pose => {
    const c = d.controls()
    const target = c ? c.target.clone() : new Vector3()
    const dir = d.camera.position.clone().sub(target)
    const dist = Math.max(dir.length(), 1e-4)
    return { target, dir: dir.divideScalar(dist), dist }
  }

  const applyPose = (d: RigDeps, pose: Pose): void => {
    const c = d.controls()
    if (c) c.target.copy(pose.target)
    d.camera.position.copy(pose.target).addScaledVector(pose.dir, pose.dist)
    d.camera.lookAt(pose.target)
    c?.update()
    d.invalidate()
  }

  const writePose = (d: RigDeps, manual: boolean): void => {
    const c = d.controls()
    const t = c ? c.target : new Vector3()
    const p = d.camera.position
    readAtlas().setCameraPose({ position: [p.x, p.y, p.z], target: [t.x, t.y, t.z] }, { manual })
  }

  const applyClamps = (d: RigDeps): void => {
    const c = d.controls()
    if (!c) return
    const s = readAtlas()
    const lifted = s.viewPreset === 'dorsal' || s.viewPreset === 'ventral' || !s.keepDorsalUp
    c.minPolarAngle = lifted ? 0 : POLAR_CLAMP
    c.maxPolarAngle = lifted ? Math.PI : Math.PI - POLAR_CLAMP
  }

  /**
   * Near, far and the orbit distance limits. They follow the body length and the fit distance:
   * the dissect grid of D17 needs a further zoom-out limit than the 12 body lengths of the fish
   * alone, and `applyDistanceLimits` is called again whenever a fit produces a new distance.
   */
  const applyDistanceLimits = (d: RigDeps): void => {
    const L = bodyLength > 0 ? bodyLength : 1
    const far = Math.max(50 * L, 4 * follow.fitDist)
    if (d.camera.far !== far) {
      d.camera.far = far
      d.camera.updateProjectionMatrix()
    }
    const c = d.controls()
    if (c) {
      c.minDistance = 0.4 * L
      c.maxDistance = Math.max(12 * L, 1.6 * follow.fitDist)
    }
  }

  const applyLimits = (d: RigDeps, frame: BodyFrame): void => {
    const L = frame.bodyLengthMm
    if (L === bodyLength) return
    bodyLength = L
    d.camera.near = 0.01 * L
    applyDistanceLimits(d)
  }

  /** Moves to a preset direction, or keeps the current one for 'free', at the fit distance. */
  const goTo = (d: RigDeps, preset: ViewPreset, animate: boolean): void => {
    const frame = frameAt(getRuntime(), readAtlas().time)
    if (!frame) return
    const from = currentPose(d)
    const dirArr = preset === 'free' ? null : PRESET_DIRECTIONS[preset as PresetName]
    const dir = dirArr ? v3(dirArr) : from.dir.clone()
    const fit = fitFor(d, frame, dir)
    follow.fitDist = fit.dist
    follow.zoomFactor = 1
    follow.lastHpf = frame.hpf
    follow.active = false
    applyDistanceLimits(d)
    const to: Pose = { target: fit.target, dir, dist: fit.dist }
    follow.goalTarget.copy(to.target)
    follow.goalDist = to.dist
    const c = d.controls()
    if (!animate || reducedMotion() || !c) {
      tween = null
      applyPose(d, to)
      if (c) c.enabled = true
      writePose(d, false)
      return
    }
    c.enabled = false
    tween = {
      from,
      to,
      start: performance.now(),
      duration: PRESET_TWEEN_MS,
      onDone() {
        c.enabled = true
        c.update()
        writePose(d, false)
      },
    }
    d.invalidate()
  }

  const applyViewOffset = (d: RigDeps): void => {
    const offset = viewOffsetFor(viewport(d))
    if (offset === null) {
      if (appliedOffset !== null) {
        d.camera.clearViewOffset()
        appliedOffset = null
      }
      return
    }
    if (!appliedOffset || appliedOffset.x !== offset.x || appliedOffset.y !== offset.y) {
      d.camera.setViewOffset(d.size.width, d.size.height, offset.x, offset.y, d.size.width, d.size.height)
      appliedOffset = offset
    }
  }

  return {
    mount(next) {
      deps = next
      const d = next
      const s = readAtlas()
      const rt = getRuntime()
      ensureBound(rt)
      const frame = frameAt(rt, s.time)
      if (frame) applyLimits(d, frame)
      applyClamps(d)
      if (s.viewPreset === 'free' && s.camera) applyPose(d, toPose(s.camera))
      else goTo(d, s.viewPreset, false)
      getRuntime().cameraPlaced = true
      d.invalidate()

      let lastFit = s.fitRequest
      unsubs.push(
        atlasStore.subscribe(
          (st) => [st.fitRequest, st.viewPreset] as const,
          ([fitRequest, preset]) => {
            applyClamps(d)
            if (preset !== 'free') goTo(d, preset, true)
            else if (fitRequest !== lastFit) goTo(d, 'free', true)
            lastFit = fitRequest
          },
          { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] },
        ),
        atlasStore.subscribe((st) => st.camera, (pose) => {
          if (!pose || readAtlas().viewPreset !== 'free') return
          if (v3(pose.position).distanceTo(d.camera.position) < 1e-4) return
          tween = null
          applyPose(d, toPose(pose))
        }),
        atlasStore.subscribe((st) => st.keepDorsalUp, () => applyClamps(d)),
      )
    },
    setSize(size) {
      // Mutate in place: the store subscriptions of mount() hold the same object.
      if (deps) deps.size = size
    },
    unmount() {
      for (const u of unsubs) u()
      unsubs.length = 0
      deps = null
      tween = null
    },
    frame(dt) {
      const d = deps
      if (!d) return
      const rt = getRuntime()
      const s = readAtlas()
      const frame = rt.lastFrame ?? frameAt(rt, s.time)
      if (frame) applyLimits(d, frame)
      applyViewOffset(d)

      const tw = tween
      if (tw) {
        const k = presetEase(Math.min(1, (performance.now() - tw.start) / tw.duration))
        const from = tw.from.dir.toArray() as [number, number, number]
        const to = tw.to.dir.toArray() as [number, number, number]
        applyPose(d, {
          target: tw.from.target.clone().lerp(tw.to.target, k),
          dir: v3(slerpDir(from, to, k)),
          dist: tw.from.dist + (tw.to.dist - tw.from.dist) * k,
        })
        if (k >= 1) {
          tween = null
          tw.onDone()
        } else d.invalidate()
        return
      }

      // Follow growth (UX-IN-12): new goals on a time change (a refit for the current view
      // direction, scaled by the user's zoom), a first-order filter toward them. A dissect
      // change refits the same way whatever `followGrowth` says (D17): without it the inventory
      // grid opens off screen. The box keeps changing while the 200 ms follow of Structures.tsx
      // runs and while the builds land, so this repeats until both settle.
      const grew = frame !== null && s.followGrowth && frame.hpf !== follow.lastHpf
      const extent = dissectExtent(rt)
      const dissected = !sameExtent(extent, fittedExtent)
      if (frame && (grew || dissected) && !interacting) {
        const fit = fitFor(d, frame, currentPose(d).dir, extent)
        follow.fitDist = fit.dist
        follow.lastHpf = frame.hpf
        follow.goalTarget.copy(fit.target)
        follow.goalDist = fit.dist * follow.zoomFactor
        follow.active = true
        applyDistanceLimits(d)
      }
      if (follow.active && !interacting) {
        const pose = currentPose(d)
        // Real elapsed time, bounded at half a second. The frame loop runs on demand, so two
        // frames can sit 400 ms apart on a software renderer; a clamp at one frame's worth of
        // time would make the filter crawl instead of following in FOLLOW_TAU_S.
        const k = 1 - Math.exp(-Math.min(dt, 0.5) / FOLLOW_TAU_S)
        pose.target.lerp(follow.goalTarget, k)
        pose.dist += (follow.goalDist - pose.dist) * k
        applyPose(d, pose)
        const tol = 1e-4
        const done =
          pose.target.distanceTo(follow.goalTarget) < tol * Math.max(1, follow.fitDist) &&
          Math.abs(pose.dist - follow.goalDist) < tol * Math.max(1, follow.goalDist)
        if (done) {
          follow.active = false
          // The store, the URL `cam` and a Ctrl+B bookmark carry the pose on screen (manual false keeps the preset).
          writePose(d, false)
        } else d.invalidate()
      }
    },
    onStart() {
      interacting = true
      if (tween && deps) {
        tween = null
        const c = deps.controls()
        if (c) c.enabled = true
      }
      const c = deps?.controls()
      startPose = deps && c ? { position: deps.camera.position.clone(), target: c.target.clone() } : null
    },
    onEnd() {
      interacting = false
      const d = deps
      if (!d) return
      const c = d.controls()
      const moved =
        !startPose || !c || startPose.position.distanceToSquared(d.camera.position) > 1e-14 || startPose.target.distanceToSquared(c.target) > 1e-14
      startPose = null
      if (!moved) return
      const pose = currentPose(d)
      follow.zoomFactor = pose.dist / Math.max(follow.fitDist, 1e-6)
      follow.goalTarget.copy(pose.target)
      follow.goalDist = pose.dist
      follow.active = false
      writePose(d, true)
    },
    onChange() {
      // UX-IN-08: keep the pan target within 1.5 times the body bounding sphere.
      const d = deps
      const frame = getRuntime().lastFrame
      const c = d?.controls()
      if (!d || !c || !frame || !interacting) return
      const fit = fitOf(frame)
      const centre = v3(fit.center)
      // The dissect grid sits outside the body sphere, so the pan limit grows with the largest
      // displacement the viewer drew (D17).
      const limit = 1.5 * fit.radius + dissectReachMm()
      const dist = c.target.distanceTo(centre)
      if (dist > limit) c.target.sub(centre).multiplyScalar(limit / dist).add(centre)
    },
  }
}
