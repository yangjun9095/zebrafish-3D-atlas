// Performance measurement (QP-40 to QP-42, spec 2.9 and 6.5, WP-H1).
//
// Every test reads `window.__atlasPerf`, the ring buffer the rebuild driver publishes: the
// frame-to-frame times, the milliseconds each frame spent draining the rebuild queue, and the
// wall time of each completed rebuild. The budgets below are the SwiftShader budgets of
// docs/perf/README.md, measured on a shared compute node with no GPU. They are loose enough
// that a software rasteriser passes and tight enough that a lost time slice, a job that stops
// fitting in its slice, or a queue that falls behind the timeline fails. A laptop with a GPU
// beats them by an order of magnitude, so a pass here says nothing about the presenter's
// machine; QP-41 records that separately in docs/perf/<date>-<machine>.md.
//
// The assertions are about the drain, the part of the frame this package owns. Frame time under
// SwiftShader is rasterisation of a scene four times over the triangle budget of spec 2.9, so it
// is reported and bounded loosely, never asserted against the 16.7 ms frame of that budget.
//
// `PERF=1 npx playwright test tests/e2e/perf.spec.ts` runs the whole file. Without PERF the
// timing tests skip, because numbers from a shared CI node are numbers nobody can act on (QP-42).

import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { AtlasPerfStats } from '../../src/viewer/rebuild.ts'
import { openReady } from './helpers.ts'

/** Structure builds run at these times: a segmenting embryo, a larva, the adult. */
const TIMES = [48, 120, 4320]

/** Longest total drain for one time change, over the frames AR-12 slices it into. */
const MAX_REBUILD_CPU_MS = 250
/** Frames one time change may take to reach a consistent view (QP-18). */
const MAX_REBUILD_FRAMES = 5
/** Longest single drain: the `MAX_FRAME_BUDGET_MS` ceiling of `sliceBudget` plus room for the job that overruns it. */
const MAX_DRAIN_MS = 250
/** Draw calls per frame (spec 2.9). */
const MAX_DRAW_CALLS = 200
/** Loose ceiling on one frame under a software rasteriser; a machine with a GPU stays under 20 ms. */
const MAX_FRAME_MS = 2500

interface Step { wallMs: number; drainMs: number; frames: number }
interface ScrubResult { frames: number[]; drains: number[]; rebuilds: number[]; stats: AtlasPerfStats }

const PERF_ONLY = 'set PERF=1: SwiftShader numbers from a shared node mean nothing otherwise (QP-42)'
const NO_HOOK = 'window.__atlasPerf or window.__atlasDebug is missing'

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.length === 0 ? 0 : (sorted[Math.floor(sorted.length / 2)] ?? 0)
}

const line = (name: string, values: number[]): string =>
  values.length === 0 ? `${name} none` : `${name} n=${values.length} median=${median(values).toFixed(1)} max=${Math.max(...values).toFixed(1)}`

/** Five single time steps from a settled view, each waited out until the queue empties. */
async function steps(page: Page, hpf: number): Promise<Step[] | null> {
  return page.evaluate(async (hpf) => {
    const perf = window.__atlasPerf
    const debug = window.__atlasDebug
    if (!perf || !debug) return null
    const setTime = debug.state().setTime as (t: number) => void
    const out: Step[] = []
    for (let k = 0; k < 5; k++) {
      await new Promise((r) => setTimeout(r, 400))
      perf.reset()
      const start = performance.now()
      setTime(hpf + (k + 1) * 0.25)
      for (let i = 0; i < 400; i++) {
        await new Promise((r) => requestAnimationFrame(() => r(null)))
        if (perf.stats().queue === 0) break
      }
      const drains = perf.drains()
      out.push({ wallMs: performance.now() - start, drainMs: drains.reduce((a, b) => a + b, 0), frames: drains.filter((d) => d > 0).length })
    }
    return out
  }, hpf)
}

/** Twenty-four time steps around `hpf`, one per animation frame, with the rings emptied first. */
async function scrub(page: Page, hpf: number): Promise<ScrubResult | null> {
  return page.evaluate(async (hpf) => {
    const perf = window.__atlasPerf
    const debug = window.__atlasDebug
    if (!perf || !debug) return null
    const setTime = debug.state().setTime as (t: number) => void
    await new Promise((r) => setTimeout(r, 400))
    perf.reset()
    const span = Math.max(1, hpf * 0.05)
    for (let i = 0; i < 24; i++) {
      setTime(hpf + span * Math.sin((i / 24) * Math.PI * 2))
      await new Promise((r) => requestAnimationFrame(() => r(null)))
    }
    return { frames: perf.frames(), drains: perf.drains(), rebuilds: perf.rebuilds(), stats: perf.stats() }
  }, hpf)
}

test.describe('performance', () => {
  test('the perf hook exists in every build (QP-40)', async ({ page }) => {
    await openReady(page, '/?t=48&v=lat')
    const shape = await page.evaluate(() => {
      const perf = window.__atlasPerf
      return perf ? { frames: Array.isArray(perf.frames()), drains: Array.isArray(perf.drains()), stats: perf.stats() } : null
    })
    expect(shape, NO_HOOK).not.toBeNull()
    expect(shape?.frames).toBe(true)
    expect(shape?.drains).toBe(true)
    expect(shape?.stats.frameNo).toBeGreaterThan(0)
    expect(shape?.stats.ready).toBe(true)
  })

  test('the first frame is marked for the time-to-first-frame procedure (spec 6.5)', async ({ page }) => {
    await openReady(page, '/?t=48&v=lat')
    const marks = await page.evaluate(() => performance.getEntriesByType('mark').map((m) => ({ name: m.name, start: m.startTime })))
    const boot = marks.find((m) => m.name === 'atlas:boot')
    const first = marks.find((m) => m.name === 'atlas:first-frame')
    expect(boot, 'the atlas:boot mark is missing').toBeDefined()
    expect(first, 'the atlas:first-frame mark is missing').toBeDefined()
    expect(first!.start).toBeGreaterThan(boot!.start)
  })

  for (const hpf of TIMES) {
    test(`one time change at ${hpf} hpf rebuilds inside its budget`, async ({ page }) => {
      test.skip(!process.env.PERF, PERF_ONLY)
      test.setTimeout(240_000)
      await openReady(page, `/?t=${hpf}&v=lat`)
      const measured = await steps(page, hpf)
      expect(measured, NO_HOOK).not.toBeNull()
      const drains = measured!.map((s) => s.drainMs)
      const frames = measured!.map((s) => s.frames)
      console.log(`${hpf} hpf  ${line('rebuild cpu ms', drains)}  ${line('frames', frames)}`)
      expect(Math.max(...drains), `a rebuild spent over ${MAX_REBUILD_CPU_MS} ms of CPU`).toBeLessThanOrEqual(MAX_REBUILD_CPU_MS)
      expect(Math.max(...frames), `a rebuild took over ${MAX_REBUILD_FRAMES} frames (QP-18)`).toBeLessThanOrEqual(MAX_REBUILD_FRAMES)
    })
  }

  for (const hpf of TIMES) {
    test(`a scrub at ${hpf} hpf keeps the queue with the timeline`, async ({ page }) => {
      test.skip(!process.env.PERF, PERF_ONLY)
      test.setTimeout(240_000)
      await openReady(page, `/?t=${hpf}&v=lat`)
      const result = await scrub(page, hpf)
      expect(result, NO_HOOK).not.toBeNull()
      const { frames, drains, stats } = result!
      console.log(`${hpf} hpf  ${line('frames', frames)}  ${line('drains', drains)}  ${JSON.stringify(stats)}`)
      expect(drains.length, 'the scrub rendered no frame').toBeGreaterThan(4)
      expect(Math.max(...drains), `a single drain ran over ${MAX_DRAIN_MS} ms`).toBeLessThanOrEqual(MAX_DRAIN_MS)
      expect(Math.max(...frames), `a single frame ran over ${MAX_FRAME_MS} ms`).toBeLessThanOrEqual(MAX_FRAME_MS)
      expect(stats.calls, `over ${MAX_DRAW_CALLS} draw calls`).toBeLessThanOrEqual(MAX_DRAW_CALLS)
      // The slice grows with the render time, so the last frame of a scrub carries no backlog.
      expect(stats.queue, 'jobs were still waiting when the scrub ended').toBe(0)
      expect(stats.oldestAge, 'a job waited past the age limit of AR-12').toBeLessThanOrEqual(MAX_REBUILD_FRAMES)
    })
  }

  test('a structure with no mesh at t gives its buffers back (BG-55)', async ({ page }) => {
    test.setTimeout(240_000)
    await openReady(page, '/?t=24&v=lat')
    const counts = await page.evaluate(async () => {
      const perf = window.__atlasPerf
      const debug = window.__atlasDebug
      if (!perf || !debug) return null
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
      const survey = (): { slots: number; visible: number } => {
        let slots = 0
        let visible = 0
        for (const handle of debug.runtime.handles.values()) {
          if (handle.group.visible) visible++
          for (const slot of handle.lodGeometries) {
            if (slot.interactive) slots++
            if (slot.final) slots++
          }
        }
        return { slots, visible }
      }
      const setTime = debug.state().setTime as (t: number) => void
      await sleep(1500)
      const embryo = survey()
      setTime(4320)
      await sleep(8000)
      const adult = { ...survey(), retired: perf.stats().retired }
      setTime(24)
      await sleep(8000)
      return { embryo, adult, back: survey() }
    })
    expect(counts, NO_HOOK).not.toBeNull()
    const { embryo, adult, back } = counts!
    console.log(`geometry slots: 24 hpf ${embryo.slots}, 4320 hpf ${adult.slots} (retired ${adult.retired}), back at 24 hpf ${back.slots}`)
    expect(adult.retired, 'no embryo structure was retired at 180 dpf').toBeGreaterThan(0)
    // Coming back rebuilds what the embryo draws; the count must not carry both stages at once.
    expect(back.visible, 'the embryo did not come back after a round trip').toBe(embryo.visible)
    expect(back.slots, 'geometry from both stages is still held').toBeLessThan(embryo.slots + adult.slots)
  })
})
