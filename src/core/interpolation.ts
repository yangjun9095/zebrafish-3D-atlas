// Keyframe interpolation (D3, BG-41 to BG-43, QP-13): bracketing, smoothstep,
// per-leaf inheritance to any depth, one rule per parameter type, and the
// sizeRefSl rescale with its NaN guard. No three import.
import { smoothstep } from './primitives/vec3.ts'

export type ParamType = 'length' | 'dimensionless' | 'angle' | 'count' | 'step'

/** Classifies a leaf by name; the default follows the suffix rule of DM-35. */
export interface ParamSpec {
  classify(leafName: string, path: string[]): ParamType
  /** Keys of a keyframe that are metadata, not parameters. */
  metaKeys?: ReadonlySet<string>
}

const DIMENSIONLESS = new Set(['u', 'v', 'w', 's0', 's1', 'e1', 'e2', 'ellipticity', 'exponent', 'uStart', 'uEnd', 'scale', 'lensProtrusion', 'pillarLength', 'wFold', 'apexU', 'loops', 'lobes'])

export function classifyLeaf(name: string): ParamType {
  if (name.endsWith('Mm') || name.endsWith('MmPerHour')) return 'length'
  if (name.endsWith('Deg')) return 'angle'
  if (name.startsWith('count')) return 'count'
  if (DIMENSIONLESS.has(name) || name.endsWith('Fraction') || /[a-z0-9][UVW]$/.test(name)) return 'dimensionless'
  return 'dimensionless'
}

export const defaultParamSpec: ParamSpec = {
  classify: (name) => classifyLeaf(name),
  metaKeys: new Set(['hpf', 'sizeRefSl']),
}

export interface Keyframe { hpf: number; sizeRefSl?: number; [key: string]: unknown }

/** Indices (i, i + 1) with k[i].hpf <= t < k[i + 1].hpf; (0, 0) before the first, (n - 1, n - 1) at or after the last. */
export function bracket(keyframes: readonly { hpf: number }[], t: number): [number, number] {
  const n = keyframes.length
  if (n === 0) throw new Error('bracket: no keyframes')
  if (!Number.isFinite(t) || t < keyframes[0]!.hpf) return [0, 0]
  if (t >= keyframes[n - 1]!.hpf) return [n - 1, n - 1]
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (keyframes[mid]!.hpf <= t) lo = mid
    else hi = mid
  }
  return [lo, lo + 1]
}

/** Smoothstep weight between two keyframes; 0 when they coincide. */
export function weightBetween(aHpf: number, bHpf: number, t: number): number {
  const span = bHpf - aHpf
  if (!(span > 0)) return 0
  return smoothstep((t - aHpf) / span)
}

export { smoothstep }

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Deep merge per leaf; arrays replace whole (BG-41). */
export function mergeParams(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue
    const prev = out[k]
    out[k] = isPlainObject(v) && isPlainObject(prev) ? mergeParams(prev, v) : isPlainObject(v) ? mergeParams({}, v) : v
  }
  return out
}

/** Effective parameters of keyframe `index`: static block plus keyframes 0..index merged per leaf. */
export function resolveKeyframe(staticParams: Record<string, unknown>, keyframes: readonly Keyframe[], index: number, spec: ParamSpec = defaultParamSpec): Record<string, unknown> {
  const meta = spec.metaKeys ?? defaultParamSpec.metaKeys!
  let acc = mergeParams({}, staticParams)
  for (let i = 0; i <= index && i < keyframes.length; i++) {
    const patch: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(keyframes[i]!)) if (!meta.has(k)) patch[k] = v
    acc = mergeParams(acc, patch)
  }
  return acc
}

const lerpNum = (a: number, b: number, s: number): number => a + (b - a) * s

export function lerpAngleDeg(a: number, b: number, s: number): number {
  let d = ((b - a + 180) % 360 + 360) % 360 - 180
  if (d === -180) d = 180
  let r = a + d * s
  r = ((r + 180) % 360 + 360) % 360 - 180
  return r === -180 ? 180 : r
}

/** Count rule (BG-42): floor(c) full instances plus one at scale c - floor(c). */
export function countInstances(c: number): { full: number; partialScale: number; visible: number } {
  const v = Math.max(0, c)
  const full = Math.floor(v + 1e-9)
  const partial = v - full
  const partialScale = partial < 1e-9 ? 0 : partial
  return { full, partialScale, visible: full + (partialScale > 0 ? 1 : 0) }
}

/** Multiply an `Mm` leaf by the rescale factor; the fraction form of Size skips it (DM-17). */
function rescaleLength(v: unknown, factor: number): unknown {
  if (typeof v === 'number') return v * factor
  if (isPlainObject(v) && typeof v.value === 'number') return v.unit === 'bodyHeightFraction' ? v : { ...v, value: v.value * factor }
  if (Array.isArray(v)) return v.map((x) => rescaleLength(x, factor))
  return v
}

function blendLeaf(a: unknown, b: unknown, s: number, type: ParamType, name: string, path: string[], spec: ParamSpec): unknown {
  if (a === undefined) return b
  if (b === undefined) return a
  if (typeof a === 'number' && typeof b === 'number') {
    if (!Number.isFinite(a)) return b
    if (!Number.isFinite(b)) return a
    if (type === 'angle') return lerpAngleDeg(a, b, s)
    if (type === 'step') return s >= 1 ? b : a
    return lerpNum(a, b, s)
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return s >= 1 ? b : a
    return a.map((x, i) => blendLeaf(x, b[i], s, type, name, path, spec))
  }
  if (isPlainObject(a) && isPlainObject(b)) return blendObjects(a, b, s, path, spec)
  return s >= 1 ? b : a                                   // boolean, enum, string, mixed
}

function blendObjects(a: Record<string, unknown>, b: Record<string, unknown>, s: number, path: string[], spec: ParamSpec): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const type = spec.classify(k, path)
    out[k] = blendLeaf(a[k], b[k], s, type, k, [...path, k], spec)
  }
  return out
}

function rescaleTree(v: Record<string, unknown>, factor: number, spec: ParamSpec, path: string[]): Record<string, unknown> {
  if (factor === 1) return v
  const out: Record<string, unknown> = {}
  for (const [k, x] of Object.entries(v)) {
    if (spec.classify(k, path) === 'length') out[k] = rescaleLength(x, factor)
    else if (isPlainObject(x)) out[k] = rescaleTree(x, factor, spec, [...path, k])
    else if (Array.isArray(x) && x.every(isPlainObject)) out[k] = x.map((e) => rescaleTree(e as Record<string, unknown>, factor, spec, [...path, k]))
    else out[k] = x
  }
  return out
}

/** `SL(max(t, 72)) / sizeRefSl`, or 1 when either side is missing or not positive (BG-43 guard). */
export function rescaleFactor(sizeRefSl: number | undefined, sl: number | null | undefined): number {
  if (sizeRefSl === undefined) return 1
  if (!Number.isFinite(sizeRefSl) || sizeRefSl <= 0) return 1
  if (sl === null || sl === undefined || !Number.isFinite(sl) || sl <= 0) return 1
  return sl / sizeRefSl
}

/**
 * Interpolated parameters at `t`. `sl` is the standard length at
 * max(t, 72) from the growth table (null when the table carries none).
 */
export function interpolateParams(
  staticParams: Record<string, unknown>,
  keyframes: readonly Keyframe[],
  t: number,
  sl: number | null,
  spec: ParamSpec = defaultParamSpec,
): Record<string, unknown> {
  if (keyframes.length === 0) return mergeParams({}, staticParams)
  const [i, j] = bracket(keyframes, t)
  const a = rescaleTree(resolveKeyframe(staticParams, keyframes, i, spec), rescaleFactor(keyframes[i]!.sizeRefSl, sl), spec, [])
  if (i === j) return a
  const b = rescaleTree(resolveKeyframe(staticParams, keyframes, j, spec), rescaleFactor(keyframes[j]!.sizeRefSl, sl), spec, [])
  const s = weightBetween(keyframes[i]!.hpf, keyframes[j]!.hpf, t)
  return blendObjects(a, b, s, [], spec)
}
