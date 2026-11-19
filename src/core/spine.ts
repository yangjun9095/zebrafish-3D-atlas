// Spine curve of the body model (BG-01 to BG-04): a centripetal Catmull-Rom
// through the keyframe control points, resampled by arc length at 128
// stations, with a parallel-transport frame seeded near u = 0.4.
// The spine lies in the sagittal plane (z = 0) in version 1 (BG-02).
import { cross, dot, length, lerp, normalize, orthogonalize, rotateAbout, sub, type Vec3 } from './primitives/vec3.ts'

export const STATION_COUNT = 128
export const SEED_U = 0.4
const SUBSTEPS = 24

/** Coefficients of one cubic segment, the form three uses for `centripetal`. */
interface Cubic { c0: Vec3; c1: Vec3; c2: Vec3; c3: Vec3 }

function nonuniformCatmullRom(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, dt0: number, dt1: number, dt2: number): Cubic {
  const c0: Vec3 = [0, 0, 0]
  const c1: Vec3 = [0, 0, 0]
  const c2: Vec3 = [0, 0, 0]
  const c3: Vec3 = [0, 0, 0]
  for (let k = 0; k < 3; k++) {
    let t1 = (p1[k] - p0[k]) / dt0 - (p2[k] - p0[k]) / (dt0 + dt1) + (p2[k] - p1[k]) / dt1
    let t2 = (p2[k] - p1[k]) / dt1 - (p3[k] - p1[k]) / (dt1 + dt2) + (p3[k] - p2[k]) / dt2
    t1 *= dt1
    t2 *= dt1
    c0[k] = p1[k]
    c1[k] = t1
    c2[k] = -3 * p1[k] + 3 * p2[k] - 2 * t1 - t2
    c3[k] = 2 * p1[k] - 2 * p2[k] + t1 + t2
  }
  return { c0, c1, c2, c3 }
}

const evalCubic = (c: Cubic, t: number): Vec3 => [
  c.c0[0] + t * (c.c1[0] + t * (c.c2[0] + t * c.c3[0])),
  c.c0[1] + t * (c.c1[1] + t * (c.c2[1] + t * c.c3[1])),
  c.c0[2] + t * (c.c1[2] + t * (c.c2[2] + t * c.c3[2])),
]
const evalCubicDerivative = (c: Cubic, t: number): Vec3 => [
  c.c1[0] + t * (2 * c.c2[0] + 3 * t * c.c3[0]),
  c.c1[1] + t * (2 * c.c2[1] + 3 * t * c.c3[1]),
  c.c1[2] + t * (2 * c.c2[2] + 3 * t * c.c3[2]),
]

/** Squared-distance power 0.25, guarded as in three's CatmullRomCurve3. */
function knot(a: Vec3, b: Vec3): number {
  const d = sub(a, b)
  const dt = Math.pow(d[0] * d[0] + d[1] * d[1] + d[2] * d[2], 0.25)
  return dt < 1e-4 ? 1 : dt
}

/** Build the open centripetal Catmull-Rom segments through the points. */
export function catmullRomSegments(points: Vec3[]): Cubic[] {
  if (points.length < 2) throw new Error('catmullRomSegments needs at least 2 points')
  const n = points.length
  const segs: Cubic[] = []
  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p0: Vec3 = i > 0 ? points[i - 1]! : [2 * p1[0] - p2[0], 2 * p1[1] - p2[1], 2 * p1[2] - p2[2]]
    const p3: Vec3 = i + 2 < n ? points[i + 2]! : [2 * p2[0] - p1[0], 2 * p2[1] - p1[1], 2 * p2[2] - p1[2]]
    let dt0 = knot(p0, p1)
    const dt1 = knot(p1, p2)
    let dt2 = knot(p2, p3)
    if (dt1 < 1e-4) { dt0 = 1; dt2 = 1 }
    if (dt0 < 1e-4) dt0 = dt1
    if (dt2 < 1e-4) dt2 = dt1
    segs.push(nonuniformCatmullRom(p0, p1, p2, p3, dt0, dt1, dt2))
  }
  return segs
}

export interface SampledCurve {
  positions: Vec3[]
  tangents: Vec3[]
  /** Arc length in mm. */
  length: number
}

/**
 * Sample a curve through `points` at `count` stations spaced by arc length.
 * Station i sits at arc fraction i / (count - 1).
 */
export function sampleByArcLength(points: Vec3[], count = STATION_COUNT): SampledCurve {
  const segs = catmullRomSegments(points)
  const params: number[] = [0]
  const cum: number[] = [0]
  const pts: Vec3[] = [evalCubic(segs[0]!, 0)]
  let total = 0
  for (let s = 0; s < segs.length; s++) {
    for (let k = 1; k <= SUBSTEPS; k++) {
      const t = k / SUBSTEPS
      const p = evalCubic(segs[s]!, t)
      total += length(sub(p, pts[pts.length - 1]!))
      pts.push(p)
      params.push(s + t)
      cum.push(total)
    }
  }
  const positions: Vec3[] = []
  const tangents: Vec3[] = []
  let j = 0
  for (let i = 0; i < count; i++) {
    const target = (total * i) / (count - 1)
    while (j < cum.length - 2 && cum[j + 1]! < target) j++
    const span = cum[j + 1]! - cum[j]!
    const f = span > 1e-12 ? (target - cum[j]!) / span : 0
    const param = params[j]! + f * (params[j + 1]! - params[j]!)
    const seg = Math.min(segs.length - 1, Math.floor(param))
    const local = param - seg
    positions.push(evalCubic(segs[seg]!, local))
    tangents.push(normalize(evalCubicDerivative(segs[seg]!, local), [1, 0, 0]))
  }
  return { positions, tangents, length: total }
}

export interface FrameSet {
  t: Vec3[]
  n: Vec3[]
  b: Vec3[]
}

/**
 * Parallel-transport frames (BG-03). The seed station is the one nearest
 * `seedU`; its normal is `up` made orthogonal to the tangent. `b = n x t`
 * points to the right side (-z at rest, D4).
 */
export function parallelTransportFrames(tangents: Vec3[], seedU = SEED_U, up: Vec3 = [0, 1, 0]): FrameSet {
  const count = tangents.length
  const k = Math.round(seedU * (count - 1))
  const t: Vec3[] = tangents.map((v) => normalize(v, [1, 0, 0]))
  const n: Vec3[] = new Array<Vec3>(count)
  const b: Vec3[] = new Array<Vec3>(count)
  n[k] = orthogonalize(up, t[k]!, [0, 1, 0])
  b[k] = cross(n[k]!, t[k]!)
  const step = (i: number, j: number): void => {
    const c = cross(t[j]!, t[i]!)
    const cl = length(c)
    if (cl < 1e-9) {
      n[i] = orthogonalize(n[j]!, t[i]!, [0, 1, 0])
    } else {
      const axis: Vec3 = [c[0] / cl, c[1] / cl, c[2] / cl]
      const angle = Math.atan2(cl, dot(t[j]!, t[i]!))
      n[i] = orthogonalize(rotateAbout(n[j]!, axis, angle), t[i]!, [0, 1, 0])
    }
    b[i] = cross(n[i]!, t[i]!)
  }
  for (let i = k + 1; i < count; i++) step(i, i - 1)
  for (let i = k - 1; i >= 0; i--) step(i, i + 1)
  return { t, n, b }
}

/** Sequentially unwrap angles so that consecutive differences stay within (-pi, pi]. */
function unwrap(angles: number[]): number[] {
  const out: number[] = [angles[0]!]
  for (let i = 1; i < angles.length; i++) {
    let d = angles[i]! - angles[i - 1]!
    while (d > Math.PI) d -= 2 * Math.PI
    while (d <= -Math.PI) d += 2 * Math.PI
    out.push(out[i - 1]! + d)
  }
  return out
}

/**
 * One keyframe's spine (control points as [u, x, y]), sampled once: chord lengths and chord angles between
 * the 128 stations, tangent angles, and the seed position. The runtime blends
 * keyframes in this heading space (chord angle, chord length, tangent angle),
 * so a curled spine unwinds without folding; an element-wise blend of
 * control points folds between the 30 hpf curl and the 36 hpf posture.
 */
export interface SpineSample { chordLen: number[]; chordAng: number[]; tanAng: number[]; seed: Vec3 }
const SEED_INDEX = Math.round(0.4 * (STATION_COUNT - 1))

export function sampleSpine(controlPoints: readonly (readonly [number, number, number])[]): SpineSample {
  const curve = sampleByArcLength(controlPoints.map((p) => [p[1], p[2], 0] as Vec3), STATION_COUNT)
  const chordLen: number[] = []
  const chordAng: number[] = []
  for (let i = 0; i < STATION_COUNT - 1; i++) {
    const d = sub(curve.positions[i + 1]!, curve.positions[i]!)
    chordLen.push(Math.hypot(d[0], d[1]))
    chordAng.push(Math.atan2(d[1], d[0]))
  }
  return {
    chordLen,
    chordAng: unwrap(chordAng),
    tanAng: unwrap(curve.tangents.map((t) => Math.atan2(t[1], t[0]))),
    seed: curve.positions[SEED_INDEX]!,
  }
}

/** Shift b by whole turns so that its seed tangent angle is within pi of a's. */
function alignTurns(a: number[], b: number[]): number[] {
  const d = b[SEED_INDEX]! - a[SEED_INDEX]!
  const k = Math.round(d / (2 * Math.PI))
  return k === 0 ? b : b.map((x) => x - k * 2 * Math.PI)
}

export function blendSpine(a: SpineSample, b: SpineSample, s: number): { positions: Vec3[]; tangents: Vec3[] } {
  const tanB = alignTurns(a.tanAng, b.tanAng)
  const chordB = alignTurns(a.chordAng, b.chordAng)
  const positions: Vec3[] = new Array<Vec3>(STATION_COUNT)
  positions[SEED_INDEX] = [lerp(a.seed[0], b.seed[0], s), lerp(a.seed[1], b.seed[1], s), 0]
  for (let i = SEED_INDEX; i < STATION_COUNT - 1; i++) {
    const len = lerp(a.chordLen[i]!, b.chordLen[i]!, s)
    const ang = lerp(a.chordAng[i]!, chordB[i]!, s)
    positions[i + 1] = [positions[i]![0] + len * Math.cos(ang), positions[i]![1] + len * Math.sin(ang), 0]
  }
  for (let i = SEED_INDEX; i > 0; i--) {
    const len = lerp(a.chordLen[i - 1]!, b.chordLen[i - 1]!, s)
    const ang = lerp(a.chordAng[i - 1]!, chordB[i - 1]!, s)
    positions[i - 1] = [positions[i]![0] - len * Math.cos(ang), positions[i]![1] - len * Math.sin(ang), 0]
  }
  const tangents: Vec3[] = []
  for (let i = 0; i < STATION_COUNT; i++) {
    const ang = lerp(a.tanAng[i]!, tanB[i]!, s)
    tangents.push([Math.cos(ang), Math.sin(ang), 0])
  }
  return { positions, tangents }
}

/**
 * Fritsch-Carlson monotone cubic through (xs, ys), evaluated at `xq`.
 * Used for the 9-station profile (BG-05): a half-height never undershoots.
 */
export function monotoneCubic(xs: number[], ys: number[], xq: number[]): number[] {
  const n = xs.length
  const d: number[] = []
  const h: number[] = []
  for (let i = 0; i < n - 1; i++) {
    h.push(xs[i + 1]! - xs[i]!)
    d.push((ys[i + 1]! - ys[i]!) / h[i]!)
  }
  const m: number[] = new Array<number>(n).fill(0)
  m[0] = d[0]!
  m[n - 1] = d[n - 2]!
  for (let i = 1; i < n - 1; i++) {
    m[i] = d[i - 1]! * d[i]! <= 0 ? 0 : (d[i - 1]! + d[i]!) / 2
  }
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue }
    const a = m[i]! / d[i]!
    const bb = m[i + 1]! / d[i]!
    const s = a * a + bb * bb
    if (s > 9) {
      const tau = 3 / Math.sqrt(s)
      m[i] = tau * a * d[i]!
      m[i + 1] = tau * bb * d[i]!
    }
  }
  return xq.map((x) => {
    let i = 0
    while (i < n - 2 && x > xs[i + 1]!) i++
    const t = Math.min(1, Math.max(0, (x - xs[i]!) / h[i]!))
    const t2 = t * t
    const t3 = t2 * t
    const h00 = 2 * t3 - 3 * t2 + 1
    const h10 = t3 - 2 * t2 + t
    const h01 = -2 * t3 + 3 * t2
    const h11 = t3 - t2
    return h00 * ys[i]! + h10 * h[i]! * m[i]! + h01 * ys[i + 1]! + h11 * h[i]! * m[i + 1]!
  })
}

/**
 * Approximate minimal enclosing sphere (Badoiu-Clarkson iteration). Each
 * point may carry its own radius, so a yolk ball counts as one entry.
 */
export function enclosingSphere(points: Vec3[], radii?: number[], iterations = 400): { centre: Vec3; radius: number } {
  if (points.length === 0) return { centre: [0, 0, 0], radius: 0 }
  let c: Vec3 = [0, 0, 0]
  for (const p of points) c = [c[0] + p[0] / points.length, c[1] + p[1] / points.length, c[2] + p[2] / points.length]
  const r = (i: number): number => (radii ? radii[i] ?? 0 : 0)
  const reach = (centre: Vec3): { idx: number; dist: number } => {
    let idx = 0
    let dist = -1
    for (let i = 0; i < points.length; i++) {
      const d = length(sub(points[i]!, centre)) + r(i)
      if (d > dist) { dist = d; idx = i }
    }
    return { idx, dist }
  }
  for (let it = 1; it <= iterations; it++) {
    const { idx } = reach(c)
    const p = points[idx]!
    const dir = sub(p, c)
    const dl = length(dir)
    if (dl < 1e-12) break
    // Move toward the far surface point, not the centre of a radius-bearing entry.
    const far: Vec3 = [p[0] + (dir[0] / dl) * r(idx), p[1] + (dir[1] / dl) * r(idx), p[2] + (dir[2] / dl) * r(idx)]
    const step = 1 / (it + 1)
    c = [c[0] + (far[0] - c[0]) * step, c[1] + (far[1] - c[1]) * step, c[2] + (far[2] - c[2]) * step]
  }
  return { centre: c, radius: reach(c).dist }
}
