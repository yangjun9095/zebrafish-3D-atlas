// QP-18: replace keeps the age of a waiting job, drain serves old jobs first,
// a simulated playback serves every job at least once per 5 frames, and the
// slice of AR-13 grows on a machine whose frame costs far more than 16.7 ms.
import { describe, expect, it } from 'vitest'
import {
  FRAME_BUDGET_MS, MAX_FRAME_BUDGET_MS, SLOW_RENDER_MS, createRebuildQueue, createSettleTracker, sliceBudget,
} from '../../src/core/rebuildQueue.ts'
import type { RebuildJob } from '../../src/core/rebuildQueue.ts'

const job = (id: string, priority = 2, volume = 1): RebuildJob => ({ id, hpf: 24, lod: 'interactive', priority, volume })

describe('replace', () => {
  it('keeps the age of a job whose id was already queued and gives a new job age 0', () => {
    const q = createRebuildQueue()
    q.replace([job('a'), job('b')], 0)
    q.replace([job('a'), job('c')], 3)
    const order = q.ordered(3)
    expect(order.find((j) => j.id === 'a')?.enteredFrame).toBe(0)
    expect(order.find((j) => j.id === 'c')?.enteredFrame).toBe(3)
    expect(order.find((j) => j.id === 'b')).toBeUndefined()
    expect(q.oldestAge(3)).toBe(3)
    expect(q.size()).toBe(2)
  })
})

describe('drain order', () => {
  it('serves every job with age 4 or more before any younger job, oldest first, then skin and selection', () => {
    const q = createRebuildQueue()
    q.replace([job('old6'), job('old4'), job('skin', 0), job('sel', 1), job('big', 2, 9), job('small', 2, 1)], 0)
    // Age the two old jobs: keep them waiting through replacements.
    q.replace([job('old6')], 2)
    q.replace([job('old6'), job('old4'), job('skin', 0), job('sel', 1), job('big', 2, 9), job('small', 2, 1)], 4)
    // At frame 8: old6 entered 0 (age 8), old4 entered 4 (age 4), the rest entered 4 (age 4) too.
    // So use frame 6: old6 age 6, others age 2.
    const ids = q.ordered(6).map((j) => j.id)
    expect(ids[0]).toBe('old6')
    expect(ids.slice(1, 3)).toEqual(['skin', 'sel'])
    expect(ids.indexOf('big')).toBeLessThan(ids.indexOf('small'))
  })

  it('stops once the budget is spent but always serves at least one job', () => {
    const q = createRebuildQueue()
    q.replace([job('a'), job('b'), job('c')], 0)
    let clock = 0
    const now = (): number => clock
    const served: string[] = []
    const r = q.drain(1, now, 0, (j) => { served.push(j.id); clock += 0.6 })
    expect(r.served).toEqual(['a', 'b'])
    expect(r.remaining).toBe(1)
    const r2 = q.drain(0, now, 1, (j) => { served.push(j.id); clock += 5 })
    expect(r2.served).toEqual(['c'])
  })
})

describe('simulated playback', () => {
  it('serves every one of 150 jobs at least once in any window of 5 frames with a budget of 40', () => {
    const q = createRebuildQueue()
    const jobs: RebuildJob[] = []
    for (let i = 0; i < 150; i++) jobs.push(job(`s${i}`, i === 0 ? 0 : i < 3 ? 1 : 2, 150 - i))
    const lastServed = new Map<string, number>()
    const frames = 60
    const servedAt: string[][] = []
    for (let f = 0; f < frames; f++) {
      q.replace(jobs, f)
      let clock = 0
      const r = q.drain(8, () => clock, f, () => { clock += 0.2 })
      expect(r.served.length).toBe(40)
      servedAt.push(r.served)
      for (const id of r.served) lastServed.set(id, f)
    }
    for (let f = 4; f < frames; f++) {
      const window = new Set(servedAt.slice(f - 4, f + 1).flat())
      for (const j of jobs) expect(window.has(j.id), `${j.id} missed frames ${f - 4}..${f}`).toBe(true)
    }
    // The skin is rebuilt every frame.
    for (const s of servedAt) expect(s).toContain('s0')
  })

  it('serves every job, the skin included, within 8 frames when 150 jobs share a budget of 20', () => {
    // Under overload the age lane of AR-13 comes before the skin lane, so the skin waits its
    // turn like any other structure: measured, the skin is served every 7 frames and the body
    // outline lags by the same number of frames as the smallest organ (phase 1 report, F16).
    const q = createRebuildQueue()
    const jobs: RebuildJob[] = []
    for (let i = 0; i < 150; i++) jobs.push(job(`s${i}`, i === 0 ? 0 : i < 3 ? 1 : 2, 150 - i))
    const frames = 80
    const servedAt: string[][] = []
    for (let f = 0; f < frames; f++) {
      q.replace(jobs, f)
      let clock = 0
      const r = q.drain(8, () => clock, f, () => { clock += 0.4 })
      expect(r.served.length).toBe(20)
      servedAt.push(r.served)
    }
    for (let f = 7; f < frames; f++) {
      const window = new Set(servedAt.slice(f - 7, f + 1).flat())
      for (const j of jobs) expect(window.has(j.id), `${j.id} missed frames ${f - 7}..${f}`).toBe(true)
    }
    const skinFrames = servedAt.flatMap((s, f) => (s.includes('s0') ? [f] : []))
    for (let i = 1; i < skinFrames.length; i++) expect(skinFrames[i] - skinFrames[i - 1]).toBeLessThanOrEqual(8)
  })
})

describe('settle tracker', () => {
  it('is due 120 ms after the last time change and once only', () => {
    const s = createSettleTracker()
    expect(s.isDue(1000)).toBe(false)
    s.touch(1000)
    expect(s.isDue(1100)).toBe(false)
    expect(s.dueAt()).toBe(1120)
    s.touch(1050)
    expect(s.isDue(1150)).toBe(false)
    expect(s.isDue(1170)).toBe(true)
    s.take()
    expect(s.isDue(1500)).toBe(false)
    expect(s.dueAt()).toBeNull()
  })
})

describe('slice budget', () => {
  it('keeps the fixed 8 ms slice while a frame renders inside the 16.7 ms target', () => {
    expect(sliceBudget(0)).toBe(FRAME_BUDGET_MS)
    expect(sliceBudget(6)).toBe(FRAME_BUDGET_MS)
    expect(sliceBudget(SLOW_RENDER_MS)).toBe(FRAME_BUDGET_MS)
    expect(sliceBudget(Number.NaN)).toBe(FRAME_BUDGET_MS)
  })

  it('takes half of the render time on a slower machine, up to the cap', () => {
    expect(sliceBudget(40)).toBe(20)
    expect(sliceBudget(2 * MAX_FRAME_BUDGET_MS)).toBe(MAX_FRAME_BUDGET_MS)
    expect(sliceBudget(200)).toBe(MAX_FRAME_BUDGET_MS)
    expect(sliceBudget(670)).toBe(MAX_FRAME_BUDGET_MS)
    expect(sliceBudget(1e6)).toBe(MAX_FRAME_BUDGET_MS)
  })

  it('keeps the cap near the 16.7 ms target frame, so one drain never blocks input for long', () => {
    expect(MAX_FRAME_BUDGET_MS).toBeLessThanOrEqual(32)
  })

  it('never returns less than the fixed slice', () => {
    for (const render of [0, 1, 15, 16, 17, 32, 500]) expect(sliceBudget(render)).toBeGreaterThanOrEqual(FRAME_BUDGET_MS)
  })
})

describe('drain under a slow render', () => {
  // The measured case of docs/perf/README.md: 169 jobs, 0.6 ms of build each, a 670 ms frame.
  // At the fixed slice the queue needs 13 frames; at the adaptive slice it stays inside the bound.
  const run = (budgetMs: number): number => {
    const q = createRebuildQueue()
    const jobs: RebuildJob[] = []
    for (let i = 0; i < 169; i++) jobs.push(job(`s${i}`, i === 0 ? 0 : i < 3 ? 1 : 2, 169 - i))
    q.replace(jobs, 0)
    let frames = 0
    for (let f = 0; f < 40 && q.size() > 0; f++) {
      let clock = 0
      q.drain(budgetMs, () => clock, f, () => { clock += 0.6 })
      frames++
    }
    return frames
  }

  it('serves one time change inside the 5-frame bound of QP-18 at the adaptive slice', () => {
    expect(run(FRAME_BUDGET_MS)).toBeGreaterThan(5)
    expect(run(sliceBudget(670))).toBeLessThanOrEqual(5)
  })
})
