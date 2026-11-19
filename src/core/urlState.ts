// URL state (AR-45 to AR-49, QP-14): every parameter is optional; an absent one means the default.
import { z } from 'zod'
import { MAX_FLUORESCENCE_TOKEN_CHARS } from './fluorescence.ts'
import { AXIS_END_HPF } from './timeAxis.ts'

const flag = z.coerce.number().int().min(0).max(1)

export const VIEW_PARAM_VALUES = ['lat', 'dor', 'ven', 'ant', 'pos', 'tq'] as const
export type ViewParam = (typeof VIEW_PARAM_VALUES)[number]

export const UrlState = z.object({
  /** hpf (D1); out of range clamps with a warning (AR-46) */
  t: z.coerce
    .number()
    .transform((n) => Math.min(Math.max(n, 0), AXIS_END_HPF))
    .default(24),
  /** ZFA numbers, no prefix, max 12 */
  sel: z.string().regex(/^\d{7}(,\d{7}){0,11}$/).optional(),
  /**
   * ZFA number of the selected vocabulary term (D17), no prefix. A term the atlas does not draw
   * has no record, so it cannot ride `sel`; `sel` carries its stand-in record instead. The
   * vocabulary chunk validates the number, so parseUrl checks only the shape.
   */
  term: z.string().regex(/^\d{7}$/).optional(),
  /** D4 presets; 'pos' added for posterior */
  v: z.enum(VIEW_PARAM_VALUES).default('lat'),
  /** position xyz, target xyz in mm; implies a free camera */
  cam: z
    .string()
    .regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){5}$/)
    .optional(),
  /** system ids (D5) or ZFA numbers */
  hide: z
    .string()
    .regex(/^([a-z_]+|\d{7})(,([a-z_]+|\d{7}))*$/)
    .optional(),
  xr: z.coerce.number().int().min(0).max(100).default(60),
  /** dissect percent (D17); 0 leaves the structures in the body */
  x: z.coerce.number().int().min(0).max(100).default(0),
  /** axis:position[:f] */
  sec: z
    .string()
    .regex(/^(sag|fro|tra):-?(0(\.\d+)?|1(\.0+)?)(:f)?$/)
    .optional(),
  iso: flag.default(0),
  /** absent: stored choice, then prefers-color-scheme */
  theme: z.enum(['dark', 'light']).optional(),
  u: z.enum(['hpf', 'dpf', 'auto']).default('auto'),
  /** absent: 1 in presentation mode, else 0 */
  snap: flag.optional(),
  /** absent: 0 */
  labels: flag.optional(),
  /** incubation temperature for the relabel (UI-13) */
  temp: z.coerce.number().min(24).max(33).default(28.5),
  /** gonad handoff target (D9, UI-27): female, male, or both records */
  sex: z.enum(['f', 'm', 'b']).default('f'),
  embed: flag.default(0),
  present: flag.default(0),
  /** timeline strip pinned in presentation mode (UI-37) */
  pin: flag.default(0),
  /** projector scale (UI-36) */
  ps: z.enum(['1', '1.5', '2']).default('1'),
  /** base64url kit or a localStorage kit id */
  kit: z.string().max(2048).optional(),
  /** Experimental ZFA fluorescence controls and versioned base64url configuration (D18). */
  lab: flag.optional(),
  fp: z.string().regex(/^[A-Za-z0-9_-]+$/).max(MAX_FLUORESCENCE_TOKEN_CHARS).optional(),
})
export type UrlState = z.infer<typeof UrlState>
export type UrlKey = keyof UrlState

/** Parameter order in a serialised URL. */
export const URL_KEYS = Object.keys(UrlState.shape) as UrlKey[]

/** The state every key falls back to. */
export const URL_DEFAULTS: UrlState = UrlState.parse({})

export interface ParseUrlOptions {
  /** structure ids known to the atlas, as "ZFA:0000114" or "0000114"; unknown sel and hide ids are dropped (AR-47) */
  structureIds?: Iterable<string>
  /** system ids known to the atlas (D5) */
  systemIds?: Iterable<string>
}

export interface ParseUrlResult {
  state: UrlState
  /** one entry per dropped or clamped parameter; the UI turns them into toasts (AR-50, AR-69) */
  warnings: string[]
}

export const TIME_CLAMPED_WARNING = 'Time clamped to 180 dpf'

function stripZfa(id: string): string {
  return id.startsWith('ZFA:') ? id.slice(4) : id
}

/**
 * Parses each key on its own with safeParse (AR-46). A key that fails falls back to its
 * default and adds one warning. Unknown keys are ignored. Accepts a search string with or
 * without the leading "?".
 */
export function parseUrl(search: string, opts: ParseUrlOptions = {}): ParseUrlResult {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const warnings: string[] = []
  const state: Record<string, unknown> = { ...URL_DEFAULTS }
  for (const key of URL_KEYS) {
    const raw = params.get(key)
    if (raw === null) continue
    const result = UrlState.shape[key].safeParse(raw)
    if (!result.success) {
      warnings.push(`${key}: ignored value "${raw}"`)
      continue
    }
    state[key] = result.data
    if (key === 't') {
      const n = Number(raw)
      if (n < 0 || n > AXIS_END_HPF) warnings.push(TIME_CLAMPED_WARNING)
    }
  }
  const known = opts.structureIds ? new Set(Array.from(opts.structureIds, stripZfa)) : null
  if (known && typeof state.sel === 'string') {
    const kept = state.sel.split(',').filter((id) => {
      if (known.has(id)) return true
      warnings.push(`Structure ZFA:${id} is not in this atlas`)
      return false
    })
    state.sel = kept.length > 0 ? kept.join(',') : undefined
  }
  const systems = opts.systemIds ? new Set(opts.systemIds) : null
  if ((known || systems) && typeof state.hide === 'string') {
    const kept = state.hide.split(',').filter((tok) => {
      const ok = /^\d{7}$/.test(tok) ? (known ? known.has(tok) : true) : systems ? systems.has(tok) : true
      if (!ok) warnings.push(`hide: unknown token "${tok}"`)
      return ok
    })
    state.hide = kept.length > 0 ? kept.join(',') : undefined
  }
  return { state: state as UrlState, warnings }
}

function formatNumber(value: number, decimals: number): string {
  const s = value.toFixed(decimals)
  return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s
}

/** Formats one value for the URL: t to 2 decimals, cam to 3 (AR-49). */
export function formatUrlValue(key: UrlKey, value: unknown): string {
  if (key === 't') return String(Number((value as number).toFixed(2)))
  if (key === 'cam') {
    return String(value)
      .split(',')
      .map((n) => formatNumber(Number(n), 3))
      .join(',')
  }
  return String(value)
}

/**
 * Serialises a state as a query string without the leading "?". Omits every parameter at
 * its default, so the default state serialises to "". Values contain no "ZFA:" prefix and
 * no whitespace. The store decides how `cam` and `v` combine (AR-47, AR-49).
 */
export function serializeUrl(state: UrlState): string {
  const parts: string[] = []
  for (const key of URL_KEYS) {
    const value = state[key]
    if (value === undefined || value === null) continue
    const formatted = formatUrlValue(key, value)
    const dflt = URL_DEFAULTS[key]
    if (dflt !== undefined && formatUrlValue(key, dflt) === formatted) continue
    parts.push(`${key}=${key === 'kit' ? encodeURIComponent(formatted) : formatted}`)
  }
  return parts.join('&')
}

/** "0000114,0000471" from ZFA ids, capped at the 12 of the `sel` regex (AR-20); the inverse of selIds. */
export function selParam(ids: readonly string[]): string | undefined {
  if (ids.length === 0) return undefined
  return ids.slice(0, 12).map(stripZfa).join(',')
}

/** The `hide` token list from system ids and ZFA ids: no cap, so every hidden system and structure survives a reload. */
export function hideParam(tokens: readonly string[]): string | undefined {
  if (tokens.length === 0) return undefined
  return tokens.map(stripZfa).join(',')
}

/** ZFA ids from a sel or hide token list. */
export function selIds(sel: string | undefined): string[] {
  if (!sel) return []
  return sel.split(',').map((n) => (/^\d{7}$/.test(n) ? `ZFA:${n}` : n))
}

export interface CamParam {
  position: [number, number, number]
  target: [number, number, number]
}

export function parseCam(cam: string | undefined): CamParam | null {
  if (!cam) return null
  const n = cam.split(',').map(Number)
  if (n.length !== 6 || n.some((x) => !Number.isFinite(x))) return null
  return { position: [n[0], n[1], n[2]], target: [n[3], n[4], n[5]] }
}

export function camParam(cam: CamParam): string {
  return [...cam.position, ...cam.target].map((x) => formatNumber(x, 3)).join(',')
}

export interface SecParam {
  axis: 'sagittal' | 'frontal' | 'transverse'
  position: number
  flip: boolean
}

const SEC_AXES = { sag: 'sagittal', fro: 'frontal', tra: 'transverse' } as const
const SEC_CODES = { sagittal: 'sag', frontal: 'fro', transverse: 'tra' } as const

export function parseSec(sec: string | undefined): SecParam | null {
  if (!sec) return null
  const [axis, pos, flip] = sec.split(':')
  const key = axis as keyof typeof SEC_AXES
  if (!(key in SEC_AXES)) return null
  return { axis: SEC_AXES[key], position: Number(pos), flip: flip === 'f' }
}

export function secParam(sec: SecParam): string {
  return `${SEC_CODES[sec.axis]}:${formatNumber(sec.position, 2)}${sec.flip ? ':f' : ''}`
}
