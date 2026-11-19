// The unit suffix rule of DM-35 and the draft-to-schema conversions of spec 3.5.4.
// interpolation.ts derives each leaf's interpolation type from classifyParam (BG-47).

export type ParamClass = 'length' | 'angle' | 'count' | 'dimensionless'

/** Exact names that are dimensionless (DM-35, plus the u-range and per-index names). */
export const DIMENSIONLESS_NAMES: ReadonlySet<string> = new Set([
  'u',
  'v',
  'w',
  's0',
  's1',
  'e1',
  'e2',
  'ellipticity',
  'exponent',
  'uStart',
  'uEnd',
  'scale',
])

/** Keyframe metadata that sits beside the parameters and is not interpolated. */
export const KEYFRAME_META_KEYS: ReadonlySet<string> = new Set(['hpf', 'sizeRefSl'])

/** Geometry block keys that are not parameters. */
export const GEOMETRY_META_KEYS: ReadonlySet<string> = new Set([
  'kind',
  'builder',
  'part',
  'sourceId',
  'keyframes',
  'geometryEndHpf',
  'handoffOut',
  'lodHint',
  'boundsMarginMm',
  'estimate',
  'sources',
])

/**
 * Classifies a numeric parameter name. `*Mm` and `*MmPerHour` are lengths (rescaled by
 * BG-43), `*Deg` angles, `count*` counts; `u`, `v`, `w`, `s0`, `s1`, `e1`, `e2`,
 * `ellipticity`, `exponent`, `*Fraction`, `*U`, `*V`, `*W` and the placement fields are
 * dimensionless. Returns null for a name outside the rule.
 */
export function classifyParam(name: string): ParamClass | null {
  if (name.endsWith('Mm') || name.endsWith('MmPerHour')) return 'length'
  if (name.endsWith('Deg')) return 'angle'
  if (name.startsWith('count')) return 'count'
  if (DIMENSIONLESS_NAMES.has(name)) return 'dimensionless'
  if (name.endsWith('Fraction')) return 'dimensionless'
  if (/[a-z0-9][UVW]$/.test(name)) return 'dimensionless'
  return null
}

/** A Size in the fraction form skips the SL rescale (DM-17). */
export function isRescaledLength(name: string, value: unknown): boolean {
  if (classifyParam(name) !== 'length') return false
  if (typeof value === 'object' && value !== null && 'unit' in value) {
    return (value as { unit?: unknown }).unit !== 'bodyHeightFraction'
  }
  return true
}

/** Documented defaults of the optional parameter leaves (spec 3.2.3). Applied after the keyframe merge. */
export const PARAM_DEFAULTS = {
  mirror: false,
  ellipticity: 1,
  caps: 'round',
  flexionDeg: 0,
  segmented: false,
  phiLengthDeg: 360,
  rakeDeg: 0,
  azimuthDeg: 360,
} as const

// Conversions from the research drafts (spec 3.5.1, 3.5.4) --------------------

export function umToMm(um: number): number {
  return um / 1000
}

export function mmToUm(mm: number): number {
  return mm * 1000
}

/** u may exceed 1.0 only in the fins system, and never 1.25 (DM-12). */
export const U_MAX_BODY = 1
export const U_MAX_FINS = 1.25

/**
 * `u = apFraction x L_source(t) / axisLengthMm(t)` (spec 3.5.4), clamped to [0, 1], or to
 * [0, 1.25] for a record in the fins system.
 */
export function apFractionToU(
  apFraction: number,
  sourceLengthMm: number,
  axisLengthMm: number,
  opts: { fins?: boolean } = {},
): number {
  if (!(axisLengthMm > 0)) throw new RangeError('axisLengthMm must be positive')
  const u = (apFraction * sourceLengthMm) / axisLengthMm
  const max = opts.fins ? U_MAX_FINS : U_MAX_BODY
  return Math.min(Math.max(u, 0), max)
}

/** Keyword table of spec 3.5.1 for the draft `spatial.dv` field. Longest match wins. */
const DV_KEYWORDS: ReadonlyArray<readonly [string, number]> = [
  ['dorsal surface', 1],
  ['ventral surface', -1],
  ['surface', 1],
  ['dorsal', 0.6],
  ['ventral', -0.6],
  ['midline', 0],
  ['spine', 0],
]

/** Maps a draft dorsoventral phrase to v; null when no keyword matches. */
export function dvKeywordToV(text: string): number | null {
  const t = text.toLowerCase()
  for (const [key, v] of DV_KEYWORDS) if (t.startsWith(key)) return v
  for (const [key, v] of DV_KEYWORDS) if (t.includes(key)) return v
  return null
}

export type LateralityValue = 'midline' | 'paired' | 'left' | 'right'

/** Prefix rule of spec 3.5.1 for the draft `spatial.laterality` field. */
export function lateralityFrom(text: string): { laterality: LateralityValue; mirror: boolean } {
  const t = text.trim().toLowerCase()
  if (/^(paired|bilateral|bilobed|two)/.test(t)) return { laterality: 'paired', mirror: true }
  if (t.startsWith('left')) return { laterality: 'left', mirror: false }
  if (t.startsWith('right')) return { laterality: 'right', mirror: false }
  return { laterality: 'midline', mirror: false }
}
