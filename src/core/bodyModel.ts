// Body model runtime (D3, BG-09, BG-10, BG-28). `createBodyModel(body,
// growth)` returns `bodyModel(hpf)`, a pure function of hpf and the two
// tables. It interpolates body.json linearly in hpf, samples the spine at
// 128 stations, wraps the ventral skin around the yolk ball (BG-18 as
// revised in phase 2), and exposes `frameAt(u)` and `toWorld(u, v, w)`.
import { bodyLengthAtFrom, slAtFrom, type GrowthPoint } from './growth.ts'
import { cross, dot, lerp, madd, normalize, orthogonalize, smoothstep, sub, type Vec3 } from './primitives/vec3.ts'
import { STATION_COUNT, blendSpine, monotoneCubic, parallelTransportFrames, sampleSpine, type SpineSample } from './spine.ts'

export type { Vec3 } from './primitives/vec3.ts'
export type Regime = 'R0' | 'R1' | 'R2' | 'R3' | 'R4'

/** The 9 profile stations of BG-05. */
export const PROFILE_U: readonly number[] = [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1.0]

export interface ProfileStation { u: number; hD: number; hV: number; hW: number; exponent: number }
export interface YolkBallKey { u: number; depthMm: number; radiusMm: number }
export interface YolkExtensionKey { u0: number; u1: number; r0Mm: number; r1Mm: number }
export interface ChorionKey { centre: Vec3; radiusMm: number }

/** One row of body.json (BG-24). Mirrors the zod schema of WP-02 structurally. */
export interface BodyKeyframe {
  hpf: number
  stage: string
  regime: Regime
  bodyLengthMm: number
  slMm: number | null
  axisLengthMm: number | null
  headTrunkAngleDeg: number | null
  notochordFlexionDeg: number
  ventU: number
  epibolyFraction: number
  somiteCount: number
  cellCount: number | null
  cap: { baseRadiusMm: number; heightMm: number } | null
  shellThicknessMm: number | null
  yolkRadiusMm: number | null
  yolkDomeMm: number
  yolkBall: YolkBallKey | null
  yolkExtension: YolkExtensionKey | null
  chorion: ChorionKey | null
  spine: [number, number, number][]
  profile: ProfileStation[]
  estimate: string[]
  sources: string[]
}
export interface BodyFile { generatedBy: string; keyframes: BodyKeyframe[] }

export interface BodyStation {
  u: number; p: Vec3; t: Vec3; n: Vec3; b: Vec3
  hD: number; hV: number; hW: number; exponent: number
}
export interface LocalFrame { p: Vec3; t: Vec3; n: Vec3; b: Vec3; hD: number; hV: number; hW: number; exponent: number }

export interface BodyFrame {
  hpf: number
  regime: Regime
  stations: BodyStation[]
  axisLengthMm: number
  bodyLengthMm: number
  slMm: number | null
  headTrunkAngleDeg: number | null
  notochordFlexionDeg: number
  ventU: number
  epibolyFraction: number
  somiteCount: number
  cellCount: number | null
  cap: { baseRadiusMm: number; heightMm: number } | null
  shellThicknessMm: number | null
  yolkDomeMm: number
  yolk: {
    ball: { centre: Vec3; radiusMm: number; u: number; depthMm: number } | null
    extension: { u0: number; u1: number; r0Mm: number; r1Mm: number } | null
  } | null
  chorion: { centre: Vec3; radiusMm: number } | null
  frameAt(u: number): LocalFrame
  toWorld(u: number, v: number, w: number): Vec3
}
export type BodyModel = (hpf: number) => BodyFrame

export const REGIME_BOUNDS_HPF = { R0: 4.66, R1: 10, R2: 19, R3: 72 } as const

/** The ventral skin runs this far outside the yolk ball it wraps (BG-18 as revised). */
export const YOLK_SKIN_MARGIN_MM = 0.01
/**
 * The belly skin wraps the yolk ball as the D8 curl unwinds: no wrap through 30 hpf, where
 * the ball fills the coil and the trunk already faces it, full wrap from 36 hpf (the Kimmel
 * posture). The chorion enclosure of D8 is therefore unchanged.
 */
export const BALL_WRAP_HPF: readonly [number, number] = [30, 36]
/**
 * The wrap leaves the ball's circle at this angle from its bottom and continues on the tangent
 * (a cone) to the equator depth: the circle is vertical at the equator, where a chord between
 * two stations would cut it. The tangent line lies outside the circle everywhere.
 */
export const BALL_WRAP_TANGENT_DEG = 60
/**
 * Past the cone the wrap blends back to the profile over this fraction of the radius plus
 * 0.02 mm. Zero: the cone ends at the ball's equator depth, which the generator already bakes
 * into the profile as the belt line (gen-body.ts envelopeProfile), so the wrap adds nothing
 * beyond the ball's own span and structures placed against the phase 1 belly stay put.
 */
export const BALL_WRAP_FILLET = 0

export function regimeAt(hpf: number): Regime {
  if (hpf < REGIME_BOUNDS_HPF.R0) return 'R0'
  if (hpf < REGIME_BOUNDS_HPF.R1) return 'R1'
  if (hpf < REGIME_BOUNDS_HPF.R2) return 'R2'
  if (hpf < REGIME_BOUNDS_HPF.R3) return 'R3'
  return 'R4'
}

/**
 * Somite count from the Kimmel rates (BG-58): 3 per hour to 6 somites, then
 * 2 per hour to 30, then 31 from 26 hpf. A 0.05 somite tolerance absorbs
 * the rounding of the ZFS start times (11.66 h is 11 h 40 min).
 */
export function somiteCountAt(hpf: number): number {
  if (hpf < 10.33) return 0
  let c: number
  if (hpf < 12) c = Math.min(6, 1 + 3 * (hpf - 10.33))
  else if (hpf < 26) c = Math.min(30, 6 + 2 * (hpf - 12))
  else return 31
  return Math.floor(c + 0.05)
}

/** Cell count of the cleavage stages (BG-11); null from 4.66 hpf. */
export function cellCountAt(hpf: number): number | null {
  if (hpf >= 4.66) return null
  if (hpf < 0.75) return 1
  if (hpf < 3.0) return 2 ** (1 + Math.floor((hpf - 0.75) / 0.25 + 1e-9))
  if (hpf < 4.0) return 2048
  return 4096
}

const lerpNullable = (a: number | null, b: number | null, s: number): number | null => {
  if (a === null && b === null) return null
  if (a === null) return s >= 1 ? b : null
  if (b === null) return a
  return lerp(a, b, s)
}

function lerpObject<T extends object>(a: T | null, b: T | null, s: number): T | null {
  if (a === null && b === null) return null
  if (a === null) return s >= 1 ? b : null
  if (b === null) return a
  const out: Record<string, number> = {}
  const ra = a as Record<string, number>
  const rb = b as Record<string, number>
  for (const key of Object.keys(ra)) out[key] = lerp(ra[key]!, rb[key] ?? ra[key]!, s)
  return out as T
}

function lerpChorion(a: ChorionKey | null, b: ChorionKey | null, s: number): ChorionKey | null {
  if (a === null && b === null) return null
  if (a === null) return s >= 1 ? b : null
  if (b === null) return a
  return {
    centre: [lerp(a.centre[0], b.centre[0], s), lerp(a.centre[1], b.centre[1], s), lerp(a.centre[2], b.centre[2], s)],
    radiusMm: lerp(a.radiusMm, b.radiusMm, s),
  }
}

function bracketKeyframes(keys: BodyKeyframe[], hpf: number): { a: BodyKeyframe; b: BodyKeyframe; s: number } {
  const n = keys.length
  if (hpf <= keys[0]!.hpf) return { a: keys[0]!, b: keys[0]!, s: 0 }
  if (hpf >= keys[n - 1]!.hpf) return { a: keys[n - 1]!, b: keys[n - 1]!, s: 0 }
  let i = 0
  while (i < n - 2 && keys[i + 1]!.hpf <= hpf) i++
  const a = keys[i]!
  const b = keys[i + 1]!
  const span = b.hpf - a.hpf
  return { a, b, s: span > 0 ? (hpf - a.hpf) / span : 0 }
}

function lerpProfile(a: BodyKeyframe, b: BodyKeyframe, s: number): ProfileStation[] {
  return a.profile.map((p, i) => {
    const q = b.profile[i] ?? p
    return {
      u: p.u,
      hD: lerp(p.hD, q.hD, s),
      hV: lerp(p.hV, q.hV, s),
      hW: lerp(p.hW, q.hW, s),
      exponent: lerp(p.exponent ?? 2, q.exponent ?? 2, s),
    }
  })
}

function buildStations(curve: { positions: Vec3[]; tangents: Vec3[] }, profile: ProfileStation[]): BodyStation[] {
  const frames = parallelTransportFrames(curve.tangents)
  const us: number[] = []
  for (let i = 0; i < STATION_COUNT; i++) us.push(i / (STATION_COUNT - 1))
  const xs = profile.map((p) => p.u)
  const floor = (v: number[]): number[] => v.map((x) => Math.max(x, 1e-4))
  const hD = floor(monotoneCubic(xs, profile.map((p) => p.hD), us))
  const hV = floor(monotoneCubic(xs, profile.map((p) => p.hV), us))
  const hW = floor(monotoneCubic(xs, profile.map((p) => p.hW), us))
  const ex = monotoneCubic(xs, profile.map((p) => p.exponent), us)
  const stations: BodyStation[] = []
  for (let i = 0; i < STATION_COUNT; i++) {
    stations.push({
      u: us[i]!, p: curve.positions[i]!, t: frames.t[i]!, n: frames.n[i]!, b: frames.b[i]!,
      hD: hD[i]!, hV: hV[i]!, hW: hW[i]!, exponent: Math.max(1, ex[i]!),
    })
  }
  return stations
}

/**
 * Raises hV wherever a station's ventral ray meets the ball, to the ball's far surface plus
 * the margin, and blends back to the profile over a fillet past the equator. The 128 stations
 * follow the ball's circle, which the 9-station profile cannot (phase 1 screenshots at 72 and
 * 120 hpf showed the ball hanging under the belly). `weight` is the wrap ramp of BALL_WRAP_HPF.
 */
export function wrapStationsAroundBall(stations: BodyStation[], centre: Vec3, radiusMm: number, weight: number): void {
  if (weight <= 0 || radiusMm <= 1e-6) return
  const r = radiusMm
  const theta = (BALL_WRAP_TANGENT_DEG * Math.PI) / 180
  const arcEnd = r * Math.sin(theta)
  const coneEnd = r / Math.sin(theta)
  const fillet = BALL_WRAP_FILLET * r + 0.02
  for (const s of stations) {
    const d = sub(s.p, centre)
    const along = dot(d, s.n)
    if (along <= 0) continue
    const perp = Math.sqrt(Math.max(0, dot(d, d) - along * along))
    let target: number
    if (perp <= arcEnd) target = along + Math.sqrt(r * r - perp * perp) + YOLK_SKIN_MARGIN_MM
    else if (perp < coneEnd) target = along + r * Math.cos(theta) - (perp - arcEnd) * Math.tan(theta) + YOLK_SKIN_MARGIN_MM
    else if (perp < coneEnd + fillet) target = lerp(s.hV, along + YOLK_SKIN_MARGIN_MM, smoothstep((coneEnd + fillet - perp) / fillet))
    else continue
    if (target > s.hV) s.hV += (target - s.hV) * weight
  }
}

function makeFrameAt(stations: BodyStation[], axisLength: number): (u: number) => LocalFrame {
  const last = stations[stations.length - 1]!
  return (u: number): LocalFrame => {
    if (u > 1) {
      // BG-08: extend along the tangent at u = 1 for fins.
      return { p: madd(last.p, last.t, (u - 1) * axisLength), t: last.t, n: last.n, b: last.b, hD: last.hD, hV: last.hV, hW: last.hW, exponent: last.exponent }
    }
    const x = Math.max(0, u) * (stations.length - 1)
    const i = Math.min(stations.length - 2, Math.floor(x))
    const f = x - i
    const a = stations[i]!
    const b = stations[i + 1]!
    const t = normalize([lerp(a.t[0], b.t[0], f), lerp(a.t[1], b.t[1], f), lerp(a.t[2], b.t[2], f)], a.t)
    const n = orthogonalize([lerp(a.n[0], b.n[0], f), lerp(a.n[1], b.n[1], f), lerp(a.n[2], b.n[2], f)], t, a.n)
    return {
      p: [lerp(a.p[0], b.p[0], f), lerp(a.p[1], b.p[1], f), lerp(a.p[2], b.p[2], f)],
      t, n, b: cross(n, t),
      hD: lerp(a.hD, b.hD, f), hV: lerp(a.hV, b.hV, f), hW: lerp(a.hW, b.hW, f), exponent: lerp(a.exponent, b.exponent, f),
    }
  }
}

/** Build the model. `body` and `growth` are the parsed data files; nothing is imported here (BG-10). */
export function createBodyModel(body: BodyFile, growth: GrowthPoint[]): BodyModel {
  const keys = [...body.keyframes].sort((x, y) => x.hpf - y.hpf)
  if (keys.length < 2) throw new Error('body.json needs at least 2 keyframes')
  const samples = new Map<BodyKeyframe, SpineSample>()
  const sampleOf = (k: BodyKeyframe): SpineSample => {
    let v = samples.get(k)
    if (!v) { v = sampleSpine(k.spine); samples.set(k, v) }
    return v
  }
  let cache: { key: number; frame: BodyFrame } | null = null

  return (hpfIn: number): BodyFrame => {
    const hpf = Number.isFinite(hpfIn) ? hpfIn : 0
    const key = Math.round(hpf * 1000) / 1000
    if (cache && cache.key === key) return cache.frame
    const { a, b, s } = bracketKeyframes(keys, key)
    const stations = buildStations(blendSpine(sampleOf(a), sampleOf(b), s), lerpProfile(a, b, s))
    let arc = 0
    for (let i = 1; i < stations.length; i++) arc += Math.hypot(...sub(stations[i]!.p, stations[i - 1]!.p))
    const axisLengthMm = lerpNullable(a.axisLengthMm, b.axisLengthMm, s) ?? arc
    const frameAt = makeFrameAt(stations, axisLengthMm)
    const toWorld = (u: number, v: number, w: number): Vec3 => {
      const f = frameAt(u)
      const h = v >= 0 ? f.hD : f.hV
      return [
        f.p[0] + v * h * f.n[0] + w * f.hW * f.b[0],
        f.p[1] + v * h * f.n[1] + w * f.hW * f.b[1],
        f.p[2] + v * h * f.n[2] + w * f.hW * f.b[2],
      ]
    }
    const ballKey = lerpObject(a.yolkBall, b.yolkBall, s)
    const extKey = lerpObject(a.yolkExtension, b.yolkExtension, s)
    let ball: NonNullable<BodyFrame['yolk']>['ball'] = null
    if (ballKey && ballKey.radiusMm > 1e-6) {
      const f = frameAt(ballKey.u)
      ball = { centre: madd(f.p, f.n, -ballKey.depthMm), radiusMm: ballKey.radiusMm, u: ballKey.u, depthMm: ballKey.depthMm }
      const wrap = smoothstep((key - BALL_WRAP_HPF[0]) / (BALL_WRAP_HPF[1] - BALL_WRAP_HPF[0]))
      wrapStationsAroundBall(stations, ball.centre, ball.radiusMm, wrap)
    }
    const extension = extKey && (extKey.r0Mm > 1e-6 || extKey.r1Mm > 1e-6) ? extKey : null
    const chorionKey = lerpChorion(a.chorion, b.chorion, s)
    const frame: BodyFrame = {
      hpf: key,
      regime: regimeAt(key),
      stations,
      axisLengthMm,
      bodyLengthMm: bodyLengthAtFrom(growth, key),
      slMm: slAtFrom(growth, key),
      headTrunkAngleDeg: lerpNullable(a.headTrunkAngleDeg, b.headTrunkAngleDeg, s),
      notochordFlexionDeg: lerp(a.notochordFlexionDeg, b.notochordFlexionDeg, s),
      ventU: lerp(a.ventU, b.ventU, s),
      epibolyFraction: lerp(a.epibolyFraction, b.epibolyFraction, s),
      somiteCount: somiteCountAt(key),
      cellCount: cellCountAt(key),
      cap: lerpObject(a.cap, b.cap, s),
      shellThicknessMm: lerpNullable(a.shellThicknessMm, b.shellThicknessMm, s),
      yolkDomeMm: lerp(a.yolkDomeMm ?? 0, b.yolkDomeMm ?? 0, s),
      yolk: ball || extension ? { ball, extension } : null,
      chorion: chorionKey && chorionKey.radiusMm > 1e-6 ? { centre: chorionKey.centre, radiusMm: chorionKey.radiusMm } : null,
      frameAt,
      toWorld,
    }
    cache = { key, frame }
    return frame
  }
}
