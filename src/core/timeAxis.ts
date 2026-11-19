// Time axis mapping (D7, UI-03), stage lookup, stepping, tick filtering and snapping (5.2).
import type { HeadlineTick, PeriodRecord, StageRecord, TimeAxis, TimeAxisSegment } from './schema.ts'

export interface AxisAnchor {
  hpf: number
  fraction: number
}

/** The axis ends at 180 dpf (D1). */
export const AXIS_END_HPF = 4320

/** The D7 segment shares as cumulative fractions. `anchorsFromSegments` derives the same list from stages.json. */
export const AXIS_ANCHORS: readonly AxisAnchor[] = [
  { hpf: 0, fraction: 0.0 },
  { hpf: 10, fraction: 0.18 },
  { hpf: 24, fraction: 0.3 },
  { hpf: 72, fraction: 0.52 },
  { hpf: 168, fraction: 0.62 },
  { hpf: 720, fraction: 0.78 },
  { hpf: 2160, fraction: 0.92 },
  { hpf: 4320, fraction: 1.0 },
]

/** Cumulative anchors from the segment table. Throws when the segments are not contiguous or do not sum to 1. */
export function anchorsFromSegments(segments: readonly TimeAxisSegment[]): AxisAnchor[] {
  if (segments.length === 0) throw new RangeError('timeAxis.segments is empty')
  const anchors: AxisAnchor[] = [{ hpf: segments[0].startHpf, fraction: 0 }]
  let sum = 0
  segments.forEach((s, i) => {
    if (i > 0 && s.startHpf !== segments[i - 1].endHpf) {
      throw new RangeError(`segment ${s.id} starts at ${s.startHpf}, previous ends at ${segments[i - 1].endHpf}`)
    }
    if (!(s.endHpf > s.startHpf)) throw new RangeError(`segment ${s.id} has no length`)
    sum += s.share
    anchors.push({ hpf: s.endHpf, fraction: sum })
  })
  if (Math.abs(sum - 1) > 1e-6) throw new RangeError(`segment shares sum to ${sum}, expected 1`)
  anchors[anchors.length - 1].fraction = 1
  return anchors
}

/** Maps hpf to a track fraction in [0, 1]. Linear in hpf inside each segment. Clamps outside the domain. */
export function hpfToTrack(hpf: number, anchors: readonly AxisAnchor[] = AXIS_ANCHORS): number {
  const last = anchors[anchors.length - 1]
  const h = Math.min(Math.max(hpf, anchors[0].hpf), last.hpf)
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1]
    const b = anchors[i]
    if (h <= b.hpf) return a.fraction + ((b.fraction - a.fraction) * (h - a.hpf)) / (b.hpf - a.hpf)
  }
  return 1
}

/** Inverse of hpfToTrack. Reads the same table by fraction. */
export function trackToHpf(fraction: number, anchors: readonly AxisAnchor[] = AXIS_ANCHORS): number {
  const x = Math.min(Math.max(fraction, 0), 1)
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1]
    const b = anchors[i]
    if (x <= b.fraction) return a.hpf + ((b.hpf - a.hpf) * (x - a.fraction)) / (b.fraction - a.fraction)
  }
  return anchors[anchors.length - 1].hpf
}

/** Track pixel position of a time at a given track width. */
export function hpfToPx(hpf: number, trackWidthPx: number, anchors: readonly AxisAnchor[] = AXIS_ANCHORS): number {
  return hpfToTrack(hpf, anchors) * trackWidthPx
}

// Stage and period lookup ---------------------------------------------------------

/** Index of the stage that contains hpf: start <= hpf < end. Above the last start the last stage. Below 0 the first. */
export function stageIndexAt(stages: readonly StageRecord[], hpf: number): number {
  if (stages.length === 0) throw new RangeError('stages is empty')
  let lo = 0
  let hi = stages.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (stages[mid].startHpf <= hpf) lo = mid
    else hi = mid - 1
  }
  return lo
}

export function stageAt(stages: readonly StageRecord[], hpf: number): StageRecord {
  return stages[stageIndexAt(stages, hpf)]
}

/** The period that contains hpf: start <= hpf < end; the last period above its start. */
export function periodAt(periods: readonly PeriodRecord[], hpf: number): PeriodRecord {
  if (periods.length === 0) throw new RangeError('periods is empty')
  let found = periods[0]
  for (const p of periods) if (p.startHpf <= hpf) found = p
  return found
}

/** Stage starts plus the axis end, ascending: the step targets of ArrowLeft and ArrowRight. */
export function stepTargets(stages: readonly StageRecord[], axisEndHpf = AXIS_END_HPF): number[] {
  const starts = stages.map((s) => s.startHpf).filter((h) => h < axisEndHpf)
  starts.push(axisEndHpf)
  return starts
}

/** The largest step target strictly below hpf, or null at the axis start. */
export function prevStage(stages: readonly StageRecord[], hpf: number): number | null {
  let out: number | null = null
  for (const h of stepTargets(stages)) {
    if (h < hpf - 1e-9) out = h
    else break
  }
  return out
}

/** The smallest step target strictly above hpf, or null at the axis end. */
export function nextStage(stages: readonly StageRecord[], hpf: number): number | null {
  for (const h of stepTargets(stages)) if (h > hpf + 1e-9) return h
  return null
}

/** Period starts plus the axis end, for PageUp and PageDown. */
export function prevPeriod(periods: readonly PeriodRecord[], hpf: number): number | null {
  let out: number | null = null
  for (const p of periods) if (p.startHpf < hpf - 1e-9) out = p.startHpf
  return out
}

export function nextPeriod(periods: readonly PeriodRecord[], hpf: number, axisEndHpf = AXIS_END_HPF): number | null {
  for (const p of periods) if (p.startHpf > hpf + 1e-9 && p.startHpf < axisEndHpf) return p.startHpf
  return hpf < axisEndHpf - 1e-9 ? axisEndHpf : null
}

// Ticks --------------------------------------------------------------------------

export type TickRank = 'headline' | 'period' | 'stage'

export interface TickCandidate {
  hpf: number
  rank: TickRank
  label: string
  zfs: string | null
}

export interface DrawnTick extends TickCandidate {
  xPx: number
}

const RANK_ORDER: Record<TickRank, number> = { headline: 0, period: 1, stage: 2 }

/** The 44 stage starts plus the axis end, ranked headline, period start, stage start (UI-05). */
export function tickCandidates(
  stages: readonly StageRecord[],
  periods: readonly PeriodRecord[],
  headline: readonly HeadlineTick[],
  axisEndHpf = AXIS_END_HPF,
): TickCandidate[] {
  const headlineByHpf = new Map(headline.map((t) => [t.hpf, t]))
  const periodStarts = new Set(periods.map((p) => p.startHpf))
  const out: TickCandidate[] = stages
    .filter((s) => s.startHpf < axisEndHpf)
    .map((s) => {
      const h = headlineByHpf.get(s.startHpf)
      const rank: TickRank = h ? 'headline' : periodStarts.has(s.startHpf) ? 'period' : 'stage'
      return { hpf: s.startHpf, rank, label: h?.label ?? s.shortLabel, zfs: s.zfs }
    })
  const end = headlineByHpf.get(axisEndHpf)
  out.push({ hpf: axisEndHpf, rank: end ? 'headline' : 'period', label: end?.label ?? `${axisEndHpf} hpf`, zfs: null })
  return out
}

/**
 * The 8 px rule (D7, UI-05): walks the candidates by rank and draws one only when it lies at
 * least `minGapPx` from every tick already drawn. Returns the drawn ticks in time order.
 */
export function filterTicks(
  candidates: readonly TickCandidate[],
  trackWidthPx: number,
  anchors: readonly AxisAnchor[] = AXIS_ANCHORS,
  minGapPx = 8,
): DrawnTick[] {
  const ranked = candidates
    .map((c) => ({ ...c, xPx: hpfToPx(c.hpf, trackWidthPx, anchors) }))
    .sort((a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank] || a.hpf - b.hpf)
  const drawn: DrawnTick[] = []
  for (const c of ranked) {
    if (drawn.every((d) => Math.abs(d.xPx - c.xPx) >= minGapPx)) drawn.push(c)
  }
  return drawn.sort((a, b) => a.hpf - b.hpf)
}

/** Headline ticks with pixel positions after the 8 px rule; the tick list of the label row. */
export function headlineTicksAt(axis: TimeAxis, trackWidthPx: number, anchors?: readonly AxisAnchor[]): DrawnTick[] {
  const a = anchors ?? anchorsFromSegments(axis.segments)
  const candidates: TickCandidate[] = axis.headlineTicks.map((t) => ({ ...t, rank: 'headline' }))
  return filterTicks(candidates, trackWidthPx, a, axis.minTickGapPx)
}

// Snap -----------------------------------------------------------------------------

/**
 * The nearest stage start within `windowPx` of hpf at the given track width (UX-TL-21), or
 * null when none lies inside the window.
 */
export function snapTarget(
  stages: readonly StageRecord[],
  hpf: number,
  trackWidthPx: number,
  anchors: readonly AxisAnchor[] = AXIS_ANCHORS,
  windowPx = 6,
): number | null {
  const x = hpfToPx(hpf, trackWidthPx, anchors)
  let best: number | null = null
  let bestDist = Infinity
  for (const h of stepTargets(stages)) {
    const d = Math.abs(hpfToPx(h, trackWidthPx, anchors) - x)
    if (d <= windowPx && d < bestDist) {
      best = h
      bestDist = d
    }
  }
  return best
}
