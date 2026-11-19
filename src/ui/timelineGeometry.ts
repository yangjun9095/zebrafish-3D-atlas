// Pure layout helpers of the timeline bar (spec 5.2): bar metrics per layout, period band boxes,
// headline label placement, event marker clusters and the slider value text. No React, no store.
import type { EventRecord, PeriodRecord, StageRecord } from '../core/schema.ts'
import type { AxisAnchor, DrawnTick } from '../core/timeAxis.ts'
import { AXIS_END_HPF, hpfToTrack } from '../core/timeAxis.ts'
import { capitalizeLabel, formatTime, relabelHours, resolveUnits } from '../core/format.ts'
import type { Units } from '../core/format.ts'
import { lightnessOf } from '../core/palette.ts'

export type BarLayout = 'desktop' | 'tablet' | 'phone' | 'presentation'

/** Row heights and sizes of spec 5.2.1. The fill sits at the top of the track row; ticks and headline labels follow below. */
export interface BarMetrics {
  barHeight: number
  padX: number
  labelRow: number
  labelPx: number
  trackRow: number
  fill: number
  eventRow: number
  /** Extra hit area above and below the track block, so the phone slider meets the 44 px target (UI-44). */
  hitPad: number
  transportRow: number
  handlePx: number
  thumbLinePx: number
  headlineLabels: boolean
  ticks: 'all' | 'headlinePeriod' | 'none'
}

export const BAR_METRICS: Record<BarLayout, BarMetrics> = {
  // The event row is 24 px so the diamonds sit 12 px below the headline label baseline (fillBottom + 16) instead of on it.
  // The transport row is 44 px: the play button is 44 px and every 36 px button carries a 4 px hit halo (UX-AC-10),
  // so nothing reaches past the row and focusing a control never scrolls the shell. styles.css --time-h equals barHeight.
  desktop: { barHeight: 136, padX: 24, labelRow: 28, labelPx: 12, trackRow: 40, fill: 24, eventRow: 24, hitPad: 0, transportRow: 44, handlePx: 16, thumbLinePx: 2, headlineLabels: true, ticks: 'all' },
  tablet: { barHeight: 108, padX: 16, labelRow: 24, labelPx: 11, trackRow: 40, fill: 22, eventRow: 0, hitPad: 0, transportRow: 44, handlePx: 16, thumbLinePx: 2, headlineLabels: true, ticks: 'headlinePeriod' },
  phone: { barHeight: 88, padX: 16, labelRow: 0, labelPx: 10, trackRow: 32, fill: 32, eventRow: 0, hitPad: 6, transportRow: 44, handlePx: 0, thumbLinePx: 4, headlineLabels: false, ticks: 'none' },
  presentation: { barHeight: 64, padX: 32, labelRow: 28, labelPx: 20, trackRow: 36, fill: 28, eventRow: 0, hitPad: 0, transportRow: 0, handlePx: 20, thumbLinePx: 3, headlineLabels: false, ticks: 'all' },
}

export const MIN_LABEL_BAND_PX = 28
export const LABEL_INSET_PX = 6
export const HEADLINE_LABEL_PX = 10
export const EVENT_MERGE_PX = 8

const FONT_STACK = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

let ctx: CanvasRenderingContext2D | null | undefined

/** Text width in CSS px through a cached canvas context; a 0.6 em estimate without a document. */
export function textWidth(text: string, px: number, weight = 500): number {
  if (ctx === undefined) ctx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')
  if (!ctx) return text.length * px * 0.6
  ctx.font = `${weight} ${px}px ${FONT_STACK}`
  return ctx.measureText(text).width
}

export interface BandBox {
  period: PeriodRecord
  x: number
  width: number
  /** null when the band is under 28 px (UI-04) or neither the name nor the abbreviation fits. */
  label: string | null
  fullLabel: string
  abbreviated: boolean
  /** true when a label inside the band must use --bg (UI-04): a light ramp colour in the dark theme. */
  darkText: boolean
}

/** Band label text: the adult band reads "Adult (90 dpf+)" (UX-TL-05). */
export function periodLabel(period: PeriodRecord): string {
  return period.id === 'adult' ? 'Adult (90 dpf+)' : period.displayName
}

/** Period bands with a 1 px gap between neighbours; labels abbreviate when the full name overflows. */
export function bandBoxes(
  periods: readonly PeriodRecord[],
  trackWidthPx: number,
  anchors: readonly AxisAnchor[],
  labelPx: number,
  theme: 'dark' | 'light',
  labelsInside = false,
): BandBox[] {
  return periods.map((period, i) => {
    const x0 = hpfToTrack(period.startHpf, anchors) * trackWidthPx
    const x1 = hpfToTrack(Math.min(period.endHpf, AXIS_END_HPF), anchors) * trackWidthPx
    const width = Math.max(0, x1 - x0 - (i < periods.length - 1 ? 1 : 0))
    const fullLabel = periodLabel(period)
    const room = width - 2 * LABEL_INSET_PX
    let label: string | null = null
    let abbreviated = false
    if (width >= MIN_LABEL_BAND_PX) {
      // Full label, then the plain period name, then the 3-letter abbreviation of stages.json.
      for (const candidate of [fullLabel, period.displayName, period.abbrev]) {
        if (textWidth(candidate, labelPx) > room) continue
        label = candidate
        abbreviated = candidate !== fullLabel
        break
      }
    }
    const darkText = labelsInside && theme === 'dark' && lightnessOf(period.color) > 60
    return { period, x: x0, width, label, fullLabel, abbreviated, darkText }
  })
}

export interface HeadlineLabelBox {
  tick: DrawnTick
  x: number
  width: number
  anchor: 'start' | 'middle' | 'end'
  visible: boolean
}

/** Headline labels centred on their ticks; the first is left-aligned, the last right-aligned; overlaps hide the shorter stage (UX-TL-09). */
export function headlineLabelBoxes(
  ticks: readonly DrawnTick[],
  stages: readonly StageRecord[],
  trackWidthPx: number,
  px = HEADLINE_LABEL_PX,
  gapPx = 4,
): HeadlineLabelBox[] {
  const durationAt = (hpf: number) => {
    const s = stages.find((st) => st.startHpf === hpf)
    return s ? s.endHpf - s.startHpf : Infinity
  }
  const boxes = ticks.map((tick, i) => {
    const width = textWidth(tick.label, px)
    const anchor: HeadlineLabelBox['anchor'] = i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'
    const x = anchor === 'start' ? tick.xPx : anchor === 'end' ? tick.xPx - width : tick.xPx - width / 2
    return { tick, x: Math.min(Math.max(x, 0), Math.max(0, trackWidthPx - width)), width, anchor, visible: false }
  })
  const order = boxes.map((_, i) => i).sort((a, b) => durationAt(boxes[b].tick.hpf) - durationAt(boxes[a].tick.hpf))
  const kept: HeadlineLabelBox[] = []
  for (const i of order) {
    const b = boxes[i]
    const clear = kept.every((k) => b.x + b.width + gapPx <= k.x || k.x + k.width + gapPx <= b.x)
    if (clear) {
      b.visible = true
      kept.push(b)
    }
  }
  return boxes
}

export interface EventMarker {
  x: number
  hpf: number
  events: EventRecord[]
  /** true when every merged event is an estimate: the marker renders hollow (UI-08) */
  estimate: boolean
}

/** Events inside the axis as markers; markers within 8 px merge into one with a count (UI-08). */
export function eventMarkers(
  events: readonly EventRecord[],
  trackWidthPx: number,
  anchors: readonly AxisAnchor[],
  mergePx = EVENT_MERGE_PX,
): EventMarker[] {
  const inside = events
    .filter((e) => e.hpf <= AXIS_END_HPF)
    .map((e) => ({ e, x: hpfToTrack(e.hpf, anchors) * trackWidthPx }))
    .sort((a, b) => a.x - b.x)
  const out: EventMarker[] = []
  let group: typeof inside = []
  const flush = () => {
    if (group.length === 0) return
    const x = group.reduce((s, g) => s + g.x, 0) / group.length
    const evs = group.map((g) => g.e)
    out.push({ x, hpf: evs[0].hpf, events: evs, estimate: evs.every((e) => e.hpfIsEstimate) })
    group = []
  }
  for (const item of inside) {
    if (group.length > 0 && item.x - group[0].x > mergePx) flush()
    group.push(item)
  }
  flush()
  return out
}

/** Events whose marker lies within `withinPx` of a track position; the tooltip lists them (UI-09). */
export function eventsNear(
  events: readonly EventRecord[],
  hpf: number,
  trackWidthPx: number,
  anchors: readonly AxisAnchor[],
  withinPx = EVENT_MERGE_PX,
): EventRecord[] {
  const x = hpfToTrack(hpf, anchors) * trackWidthPx
  return events.filter((e) => e.hpf <= AXIS_END_HPF && Math.abs(hpfToTrack(e.hpf, anchors) * trackWidthPx - x) <= withinPx)
}

/** "24 hours post fertilization, Prim-5, Pharyngula period" (UX-AC-01). */
export function sliderValueText(hpf: number, stage: StageRecord | null, period: PeriodRecord | null, units: Units = 'auto'): string {
  const unit = resolveUnits(hpf, units)
  const time = formatTime(hpf, units)
  const number = time.replace(/\s*(hpf|dpf)$/, '')
  const parts = [`${number} ${unit === 'hpf' ? 'hours' : 'days'} post fertilization`]
  if (stage) parts.push(capitalizeLabel(stage.shortLabel))
  if (period) parts.push(`${period.displayName} period`)
  return parts.join(', ')
}

/** Time at a pointer x on the track, from the track's client rectangle. */
export function fractionAt(clientX: number, rect: { left: number; width: number }): number {
  if (rect.width <= 0) return 0
  return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
}

export interface TimeText {
  text: string
  /** "at 25 C" or "28.5 C values" when the incubation temperature differs from 28.5 C (UI-14). */
  chip: string | null
}

/** The readout time with the temperature relabel: the label changes, the model keeps 28.5 C hours. */
export function timeText(hpf: number, units: Units, snap: boolean, temperatureC: number): TimeText {
  const rel = relabelHours(hpf, temperatureC)
  if (!rel.relabelled) return { text: formatTime(hpf, units, { snap }), chip: rel.chip }
  return { text: formatTime(rel.hours, units === 'dpf' ? 'dpf' : 'hpf', { snap }), chip: rel.chip }
}

/** A transport control blurs itself after a pointer click, so a later Space reaches the global handler once (UX-TL-17). */
export function blurAfterPointer(e: { detail: number; currentTarget: { blur(): void } }): void {
  if (e.detail > 0) e.currentTarget.blur()
}
