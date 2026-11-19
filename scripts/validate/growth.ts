// Growth-table access for the rules: thin wrappers over src/core/growth.ts, so the
// validator and the viewer share one SL to hpf mapping (D6, DM-06).
import { hpfAtSlFrom, slAtFrom } from '../../src/core/growth.ts'
import type { GrowthPoint as CoreGrowthPoint } from '../../src/core/growth.ts'
import type { GrowthPoint, HandoffWindow, TimeAxis } from './types.ts'

const core = (growth: GrowthPoint[]): CoreGrowthPoint[] => growth as unknown as CoreGrowthPoint[]

/** Standard length at `hpf`, linear in hpf between rows (D6); null before the first SL row. */
export function slAt(growth: GrowthPoint[], hpf: number): number | null {
  return slAtFrom(core(growth), hpf)
}

/** The hpf at which the growth table reaches `sl`, or null outside the table's SL range. */
export function slToHpf(growth: GrowthPoint[], sl: number): number | null {
  return hpfAtSlFrom(core(growth), sl)
}

/** Resolves a handoff window to hpf through the growth table (DM-06). */
export function windowHpf(
  growth: GrowthPoint[],
  window: HandoffWindow,
): { startHpf: number; endHpf: number } | null {
  if ('startHpf' in window) return { startHpf: window.startHpf, endHpf: window.endHpf }
  const startHpf = slToHpf(growth, window.startSl)
  const endHpf = slToHpf(growth, window.endSl)
  if (startHpf === null || endHpf === null) return null
  return { startHpf, endHpf }
}

/** Index of the time-axis segment that contains `hpf`; the last segment includes its end. */
export function segmentIndex(axis: TimeAxis, hpf: number): number {
  const segs = axis.segments
  for (let i = 0; i < segs.length; i++) {
    const last = i === segs.length - 1
    if (hpf >= segs[i].startHpf && (hpf < segs[i].endHpf || (last && hpf <= segs[i].endHpf))) return i
  }
  return hpf < 0 ? 0 : segs.length - 1
}
