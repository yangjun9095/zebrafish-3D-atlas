// Rebuild queue (AR-12, AR-13, BG-52, BG-53, QP-18). A pure priority queue
// with no timers and no three import. `replace(jobs, frame)` swaps the queue
// for a new time and keeps the age of every job that was still waiting.
// `drain(budgetMs, now, frame, run)` serves jobs until the budget is spent.
//
// Order per drain:
//   1. jobs whose age is at least `ageLimitFrames` (default 4), oldest first;
//   2. the skin and the selected or hovered structures (priority 0 and 1);
//   3. the remaining jobs, oldest first, then by priority, then by volume.
// Lane 3 is oldest-first on purpose: a lane ordered by priority alone serves
// the same top jobs every frame and the tail starves until the age rule
// fires in one burst, which breaks the 5-frame bound of QP-18.
import type { Lod } from './primitives/types.ts'

export interface RebuildJob {
  id: string
  /** The time the job was made for. */
  hpf: number
  lod: Lod
  /** 0 skin, 1 selected or hovered, 2 visible, 3 outside the frustum (AR-13). */
  priority: number
  /** Bounding-box volume from the last build; larger first inside a lane. */
  volume?: number
}

export interface QueuedJob extends RebuildJob {
  /** Frame at which the structure entered the queue without being served. */
  enteredFrame: number
}

export interface DrainResult {
  served: string[]
  elapsedMs: number
  remaining: number
}

export interface RebuildQueue {
  replace(jobs: readonly RebuildJob[], frame: number): void
  drain(budgetMs: number, now: () => number, frame: number, run: (job: QueuedJob) => void): DrainResult
  /** Jobs in drain order for `frame`. */
  ordered(frame: number): QueuedJob[]
  size(): number
  oldestAge(frame: number): number
  clear(): void
}

export const DEFAULT_AGE_LIMIT_FRAMES = 4
export const FRAME_BUDGET_MS = 8
/**
 * Longest slice `sliceBudget` returns, whatever the frame costs. The cap bounds how long one
 * frame keeps the main thread from a pointer or a key event, so it stays near the 16.7 ms target
 * frame of AR-10 rather than far above it: 32 ms is two target frames.
 */
export const MAX_FRAME_BUDGET_MS = 32
/** Render time above which the fixed slice is too small a share of the frame. */
export const SLOW_RENDER_MS = 2 * FRAME_BUDGET_MS

/**
 * Milliseconds one frame gives the drain (AR-13, QP-18). AR-13 fixes the slice at 8 ms because
 * the target frame is 16.7 ms. Where a frame costs much more than that (software WebGL, a phone,
 * a scene over the triangle budget) 8 ms is under two percent of the frame, and one time change
 * takes a dozen frames to serve: the view then trails the timeline by seconds. Above 16 ms of
 * render the slice takes half of the render time instead, up to MAX_FRAME_BUDGET_MS.
 *
 * `renderMs` is render time, not frame time, so a longer slice cannot feed itself. The caller in
 * src/viewer/rebuild.ts passes the median of the last 16 back-to-back frames, so the slice
 * follows a change in render cost about a second late. Pass 0 while no measurement exists yet.
 */
export function sliceBudget(renderMs: number): number {
  if (!Number.isFinite(renderMs) || renderMs <= SLOW_RENDER_MS) return FRAME_BUDGET_MS
  return Math.min(MAX_FRAME_BUDGET_MS, renderMs / 2)
}

export function createRebuildQueue(options: { ageLimitFrames?: number } = {}): RebuildQueue {
  const ageLimit = options.ageLimitFrames ?? DEFAULT_AGE_LIMIT_FRAMES
  let jobs = new Map<string, QueuedJob>()

  const compare = (frame: number) => (a: QueuedJob, b: QueuedJob): number => {
    const ageA = frame - a.enteredFrame
    const ageB = frame - b.enteredFrame
    const oldA = ageA >= ageLimit ? 1 : 0
    const oldB = ageB >= ageLimit ? 1 : 0
    if (oldA !== oldB) return oldB - oldA
    if (oldA) return ageB - ageA || a.priority - b.priority || (b.volume ?? 0) - (a.volume ?? 0)
    const firstA = a.priority <= 1 ? 1 : 0
    const firstB = b.priority <= 1 ? 1 : 0
    if (firstA !== firstB) return firstB - firstA
    if (firstA) return a.priority - b.priority || ageB - ageA
    return ageB - ageA || a.priority - b.priority || (b.volume ?? 0) - (a.volume ?? 0)
  }

  return {
    replace(next, frame) {
      const fresh = new Map<string, QueuedJob>()
      for (const job of next) {
        const prev = jobs.get(job.id)
        fresh.set(job.id, { ...job, enteredFrame: prev ? prev.enteredFrame : frame })
      }
      jobs = fresh
    },
    ordered(frame) {
      return [...jobs.values()].sort(compare(frame))
    },
    drain(budgetMs, now, frame, run) {
      const start = now()
      const served: string[] = []
      for (const job of this.ordered(frame)) {
        if (served.length > 0 && now() - start >= budgetMs) break
        run(job)
        jobs.delete(job.id)
        served.push(job.id)
      }
      return { served, elapsedMs: now() - start, remaining: jobs.size }
    },
    size() { return jobs.size },
    oldestAge(frame) {
      let age = 0
      for (const job of jobs.values()) age = Math.max(age, frame - job.enteredFrame)
      return age
    },
    clear() { jobs.clear() },
  }
}

/** Settle tracking (BG-51, BG-52): `final` is due once t has been stable for `delayMs`. */
export interface SettleTracker {
  /** Record a time change at `nowMs`. */
  touch(nowMs: number): void
  /** True when the final rebuild is due and not yet taken. */
  isDue(nowMs: number): boolean
  /** Mark the final rebuild as taken; `isDue` stays false until the next touch. */
  take(): void
  dueAt(): number | null
}

export const SETTLE_DELAY_MS = 120

export function createSettleTracker(delayMs = SETTLE_DELAY_MS): SettleTracker {
  let last: number | null = null
  let taken = true
  return {
    touch(nowMs) { last = nowMs; taken = false },
    isDue(nowMs) { return last !== null && !taken && nowMs - last >= delayMs },
    take() { taken = true },
    dueAt() { return last === null || taken ? null : last + delayMs },
  }
}
