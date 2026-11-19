// Readout strings (UX-TL-23, UX-TL-24, UI-12) and the temperature relabel (UI-14).
import type { GrowthPoint } from './schema.ts'

export type Units = 'hpf' | 'dpf' | 'auto'

/** Hours per day post fertilization. */
export const HOURS_PER_DPF = 24
/** Below this the auto unit is hpf; from it dpf (UX-TL-24). */
export const DPF_SWITCH_HPF = 72

function trimNumber(value: number, decimals: number): string {
  const rounded = Number(value.toFixed(decimals))
  return String(rounded)
}

/** Which unit `auto` resolves to at hpf. */
export function resolveUnits(hpf: number, units: Units): 'hpf' | 'dpf' {
  if (units === 'auto') return hpf < DPF_SWITCH_HPF ? 'hpf' : 'dpf'
  return units
}

/**
 * "24 hpf", "26.5 hpf" (one decimal only when t is not an integer and snap is off),
 * "4.5 dpf" under 10 dpf, "21 dpf" above.
 */
export function formatTime(hpf: number, units: Units = 'auto', opts: { snap?: boolean } = {}): string {
  const unit = resolveUnits(hpf, units)
  if (unit === 'hpf') {
    const isInt = Math.abs(hpf - Math.round(hpf)) < 1e-9
    return isInt || opts.snap ? `${Math.round(hpf)} hpf` : `${trimNumber(hpf, 1)} hpf`
  }
  const dpf = hpf / HOURS_PER_DPF
  return dpf < 10 ? `${trimNumber(dpf, 1)} dpf` : `${Math.round(dpf)} dpf`
}

/** Both units after 72 hpf for the stage tooltip: "72 hpf, 3 dpf". */
export function formatTimeBoth(hpf: number): string {
  if (hpf < DPF_SWITCH_HPF) return formatTime(hpf, 'hpf')
  return `${formatTime(hpf, 'hpf')}, ${formatTime(hpf, 'dpf')}`
}

/** The readout time without spaces, for the export file name (AR-57): "24hpf", "4.5dpf". */
export function formatTimeForFileName(hpf: number, units: Units = 'auto'): string {
  return formatTime(hpf, units).replace(/\s+/g, '')
}

/** "Prim-5" from "prim-5"; "Days 7-13" from "days 7-13" (UI-12). */
export function capitalizeLabel(label: string): string {
  return label.length === 0 ? label : label[0].toUpperCase() + label.slice(1)
}

/**
 * The measures a growth row can state. ED is the egg diameter of the rows before the embryonic
 * axis exists; the readout named those rows "embryo length" until review B10. The rows carry the
 * measure in `lengthMeasure`; `measure` is the older field and states EL, TL or SL only.
 */
export const LENGTH_MEASURES = ['ED', 'EL', 'TL', 'SL'] as const
export type LengthMeasureCode = (typeof LENGTH_MEASURES)[number]

export const MEASURE_NAMES: Record<LengthMeasureCode, string> = {
  ED: 'egg diameter',
  EL: 'embryo length',
  TL: 'total length',
  SL: 'standard length',
}

/** The measure of a growth row: `lengthMeasure` when the row states one, else `measure`. */
export function measureOf(point: GrowthPoint): LengthMeasureCode {
  const stated = (point as { lengthMeasure?: unknown }).lengthMeasure
  if (typeof stated === 'string' && (LENGTH_MEASURES as readonly string[]).includes(stated)) return stated as LengthMeasureCode
  return point.measure
}

export interface LengthReadout {
  valueMm: number
  measure: LengthMeasureCode
  /** The standard length of the same row, when the table states one beside the length. */
  standardLengthMm: number | null
  /** true between two table rows (UI-12 appends "~") */
  interpolated: boolean
}

/** Linear between two growth rows; null when either row states no standard length. */
function mixSl(a: GrowthPoint, b: GrowthPoint, s: number): number | null {
  if (a.standardLengthMm === null || b.standardLengthMm === null) return null
  return a.standardLengthMm + s * (b.standardLengthMm - a.standardLengthMm)
}

/** Body length at hpf from the growth table, linear in hpf (D6). Null outside the table. */
export function lengthAt(growth: readonly GrowthPoint[], hpf: number): LengthReadout | null {
  if (growth.length === 0) return null
  const first = growth[0]
  const last = growth[growth.length - 1]
  if (hpf < first.hpf || hpf > last.hpf) return null
  for (let i = 0; i < growth.length; i++) {
    const g = growth[i]
    if (Math.abs(g.hpf - hpf) < 1e-9) {
      return { valueMm: g.lengthMm, measure: measureOf(g), standardLengthMm: g.standardLengthMm, interpolated: false }
    }
    if (g.hpf > hpf) {
      const a = growth[i - 1]
      const s = (hpf - a.hpf) / (g.hpf - a.hpf)
      return {
        valueMm: a.lengthMm + s * (g.lengthMm - a.lengthMm),
        measure: measureOf(a),
        standardLengthMm: mixSl(a, g, s),
        interpolated: true,
      }
    }
  }
  return null
}

/** "1.9 mm", or "2.2 mm~" between table rows (UI-12). */
export function formatLength(read: LengthReadout | null): string | null {
  if (!read) return null
  return `${read.valueMm.toFixed(1)} mm${read.interpolated ? '~' : ''}`
}

/**
 * The length with the measure it is stated in, and the standard length beside it when the row
 * gives both: "30.0 mm TL (25.0 mm SL)". A number without its measure is the one a reader
 * screenshots and is then corrected on (review B09).
 */
export function formatLengthWithMeasure(read: LengthReadout | null): string | null {
  const text = formatLength(read)
  if (!read || text === null) return null
  const sl = read.measure === 'SL' || read.standardLengthMm === null ? '' : ` (${read.standardLengthMm.toFixed(1)} mm SL)`
  return `${text} ${read.measure}${sl}`
}

export interface ReadoutInput {
  hpf: number
  stageShortLabel: string
  length?: LengthReadout | null
  units?: Units
  snap?: boolean
}

/** "24 hpf | Prim-5 | 1.9 mm EL"; the length field is omitted when the table has no value. */
export function formatReadout(input: ReadoutInput): string {
  const parts = [formatTime(input.hpf, input.units ?? 'auto', { snap: input.snap }), capitalizeLabel(input.stageShortLabel)]
  const len = formatLengthWithMeasure(input.length ?? null)
  if (len) parts.push(len)
  return parts.join(' | ')
}

// Temperature relabel (UI-13, UI-14; research 02 section 1) ---------------------------

export const DEFAULT_TEMPERATURE_C = 28.5
export const TEMPERATURE_MIN_C = 24
export const TEMPERATURE_MAX_C = 33
/** The Kimmel calibration covers embryogenesis; above this the label keeps 28.5 C hours. */
export const RELABEL_MAX_HPF = 72

/** Kimmel et al. 1995: H_T = h / (0.055 T - 0.57), h at 28.5 C. */
export function hoursAtTemperature(hoursAt28: number, temperatureC: number): number {
  return hoursAt28 / (0.055 * temperatureC - 0.57)
}

export interface RelabelResult {
  hours: number
  /** false above 72 hpf or at 28.5 C: the label keeps the 28.5 C value */
  relabelled: boolean
  /** "at 25 C" or "28.5 C values"; null at the default temperature */
  chip: string | null
}

/** Relabels a 28.5 C hour for the readout at temperature T. The model keeps 28.5 C hours. */
export function relabelHours(hpf: number, temperatureC: number): RelabelResult {
  if (Math.abs(temperatureC - DEFAULT_TEMPERATURE_C) < 1e-9) return { hours: hpf, relabelled: false, chip: null }
  if (hpf > RELABEL_MAX_HPF) return { hours: hpf, relabelled: false, chip: `${DEFAULT_TEMPERATURE_C} C values` }
  return { hours: hoursAtTemperature(hpf, temperatureC), relabelled: true, chip: `at ${trimNumber(temperatureC, 1)} C` }
}
