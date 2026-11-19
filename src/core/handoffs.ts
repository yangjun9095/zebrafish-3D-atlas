// Handoff windows, lookup and cross-fade weights (D9, BG-48 to BG-50, DM-06). The SL to hpf
// mapping is growth.ts; nothing here stores a second one (DM-06).
import { hpfAtSlFrom, slAtFrom } from './growth.ts'
import type { GrowthPoint, HandoffRecord } from './schema.ts'

export interface HpfWindow {
  startHpf: number
  endHpf: number
}

/** Standard length at hpf from the growth table, linear in hpf (D6); null before the first SL row. */
export function slAtHpf(growth: readonly GrowthPoint[], hpf: number): number | null {
  return slAtFrom(growth, hpf)
}

/**
 * The hpf at which the growth table reaches a standard length, by linear interpolation
 * (BG-27). The table is monotone, so the inverse is unique. Null below the first SL row or
 * above the last.
 */
export function hpfAtSl(growth: readonly GrowthPoint[], slMm: number): number | null {
  return hpfAtSlFrom(growth, slMm)
}

/** The window in hpf; an SL window resolves through the growth table (DM-06). Throws when SL is outside the table. */
export function resolveWindow(handoff: HandoffRecord, growth: readonly GrowthPoint[]): HpfWindow {
  const w = handoff.window
  if ('startHpf' in w) return { startHpf: w.startHpf, endHpf: w.endHpf }
  const startHpf = hpfAtSl(growth, w.startSl)
  const endHpf = hpfAtSl(growth, w.endSl)
  if (startHpf === null || endHpf === null) {
    throw new RangeError(`handoff ${handoff.id}: SL window ${w.startSl} to ${w.endSl} mm is outside the growth table`)
  }
  return { startHpf, endHpf }
}

/** The window of segment i of a per-segment handoff, from that segment's formation time (BG-49). */
export function perSegmentWindow(handoff: HandoffRecord, segmentFormationHpf: number): HpfWindow {
  const p = handoff.perSegment
  if (!p) throw new RangeError(`handoff ${handoff.id} has no perSegment rule`)
  const startHpf = segmentFormationHpf + p.delayHpf
  return { startHpf, endHpf: startHpf + p.lengthHpf }
}

export interface CrossfadeWeights {
  /** 1 before the window, 0 after: multiply into the `from` opacity */
  from: number
  /** 0 before the window, 1 after: multiply into the `to` opacity */
  to: number
  /** 0 to 1 inside the window */
  progress: number
  active: boolean
}

/** Linear cross-fade over a window: from fades out as to fades in (BG-48). */
export function crossfadeInWindow(win: HpfWindow, hpf: number): CrossfadeWeights {
  const span = win.endHpf - win.startHpf
  const progress = span <= 0 ? (hpf >= win.endHpf ? 1 : 0) : Math.min(Math.max((hpf - win.startHpf) / span, 0), 1)
  return { from: 1 - progress, to: progress, progress, active: progress > 0 && progress < 1 }
}

export function crossfadeAt(handoff: HandoffRecord, hpf: number, growth: readonly GrowthPoint[]): CrossfadeWeights {
  return crossfadeInWindow(resolveWindow(handoff, growth), hpf)
}

export interface HandoffsForRecord {
  asFrom: HandoffRecord[]
  asTo: HandoffRecord[]
  asDriver: HandoffRecord[]
}

/** Every handoff that names the record. */
export function handoffsFor(handoffs: readonly HandoffRecord[], id: string): HandoffsForRecord {
  return {
    asFrom: handoffs.filter((h) => h.from.includes(id)),
    asTo: handoffs.filter((h) => h.to.includes(id)),
    asDriver: handoffs.filter((h) => h.driver === id),
  }
}

export function handoffById(handoffs: readonly HandoffRecord[], id: string): HandoffRecord | undefined {
  return handoffs.find((h) => h.id === id)
}

/** The handoff that seeds a target record, when one exists (BG-50). */
export function seedingHandoff(handoffs: readonly HandoffRecord[], targetId: string): HandoffRecord | undefined {
  return handoffs.find((h) => h.to.includes(targetId) && !h.withinRecord)
}

/**
 * The seed time of a target: its visibleFromHpf, which is the window start unless the
 * target's ZFA start precedes the window (DM-33, BG-50).
 */
export function seedTime(target: { visibleFromHpf: number }): number {
  return target.visibleFromHpf
}
