// Tube sweep shared by tube, heartLoop, gutLoop and primordiumMover (BG-29,
// BG-31). Each row has a centre, a parallel-transport frame (t, n, b with
// b = n x t), the half-axes a (along n, split dorsal/ventral) and b (along
// b), and a superellipse exponent. The normal is the closed form
// dP/dtheta x dP/ds with alpha = 1 - k1 x - k2 y from the frame curvature,
// so the inner side of a bend stays outward while r * kappa < 1.
import { createWriter, gridIndices, type MeshWriter } from './mesh.ts'
import { cross, dot, madd, normalize, sub, type Vec3 } from './vec3.ts'

export const RADIUS_FLOOR = 0.004

export interface SweepRow {
  p: Vec3
  t: Vec3
  n: Vec3
  b: Vec3
  /** Half-axis along +n (dorsal). */
  aD: number
  /** Half-axis along -n (ventral). */
  aV: number
  /** Half-axis along b. */
  bw: number
  /** Superellipse exponent; 2 is an ellipse. */
  exponent: number
}

/**
 * Sweep statistics for rule E036 (BG-31). `product` is the largest half-axis times
 * curvature at one station, the quantity that keeps the inner side of a bend from crossing
 * the axis (the normal is valid while r x kappa < 1 there); the two maxima are for the message.
 */
export interface SweepStats {
  maxRadiusMm: number
  maxCurvature: number
  product: number
}

export type CapStyle = 'none' | 'round' | 'flat'
/** Cap rows including the ring shared with the tube end: round 0, 30, 60, 90 degrees; flat 0 and 90. */
export const ROUND_CAP_ROWS = 4
export const FLAT_CAP_ROWS = 2

export function sweepVertexCount(rows: number, radial: number, caps: CapStyle): number {
  const capRows = caps === 'round' ? ROUND_CAP_ROWS : caps === 'flat' ? FLAT_CAP_ROWS : 0
  return (rows + 1) * (radial + 1) + 2 * capRows * (radial + 1)
}

const spow = (x: number, m: number): number => Math.sign(x) * Math.pow(Math.abs(x), m)
/** d/dtheta of sign(f) |f|^m with f' given; guarded near f = 0 for m < 1. */
const dspow = (f: number, fPrime: number, m: number): number => m * Math.pow(Math.max(Math.abs(f), 1e-6), m - 1) * fPrime

/** Cross-section offset (x along n, y along b) and its theta derivative. */
function section(row: SweepRow, theta: number): { x: number; y: number; dx: number; dy: number } {
  const m = 2 / row.exponent
  const s = Math.sin(theta)
  const c = Math.cos(theta)
  const a = Math.max(s >= 0 ? row.aD : row.aV, RADIUS_FLOOR)
  const b = Math.max(row.bw, RADIUS_FLOOR)
  return { x: a * spow(s, m), y: b * spow(c, m), dx: a * dspow(s, c, m), dy: b * dspow(c, -s, m) }
}

/**
 * Sweep the rows into `out`. `uv.u` runs along the sweep, `uv.v` around it.
 * Returns the vertex range of the side surface.
 */
export function sweepTube(rows: SweepRow[], radial: number, caps: CapStyle, out: MeshWriter = createWriter()): { out: MeshWriter; start: number; count: number; stats: SweepStats } {
  const nRows = rows.length - 1
  const start = out.vertexCount()
  let maxRadiusMm = 0
  let maxCurvature = 0
  let maxProduct = 0
  // Arc length per row and curvature components from finite differences of t.
  const s: number[] = [0]
  for (let i = 1; i <= nRows; i++) s.push(s[i - 1]! + Math.hypot(...sub(rows[i]!.p, rows[i - 1]!.p)))
  const total = s[nRows]! || 1
  for (let i = 0; i <= nRows; i++) {
    const row = rows[i]!
    const prev = rows[Math.max(0, i - 1)]!
    const next = rows[Math.min(nRows, i + 1)]!
    const ds = Math.max(1e-9, s[Math.min(nRows, i + 1)]! - s[Math.max(0, i - 1)]!)
    const dT = sub(next.t, prev.t)
    const k1 = dot(dT, row.n) / ds
    const k2 = dot(dT, row.b) / ds
    const daD = (next.aD - prev.aD) / ds
    const daV = (next.aV - prev.aV) / ds
    const dbw = (next.bw - prev.bw) / ds
    const radius = Math.max(row.aD, row.aV, row.bw)
    const kappa = Math.hypot(k1, k2)
    maxRadiusMm = Math.max(maxRadiusMm, radius)
    maxCurvature = Math.max(maxCurvature, kappa)
    maxProduct = Math.max(maxProduct, radius * kappa)
    for (let j = 0; j <= radial; j++) {
      const theta = (2 * Math.PI * j) / radial
      const sec = section(row, theta)
      const m = 2 / row.exponent
      const sinT = Math.sin(theta)
      const cosT = Math.cos(theta)
      const da = sinT >= 0 ? daD : daV
      const p: Vec3 = madd(madd(row.p, row.n, sec.x), row.b, sec.y)
      const dTheta: Vec3 = madd([row.n[0] * sec.dx, row.n[1] * sec.dx, row.n[2] * sec.dx], row.b, sec.dy)
      const alpha = 1 - k1 * sec.x - k2 * sec.y
      const dS: Vec3 = madd(madd([row.t[0] * alpha, row.t[1] * alpha, row.t[2] * alpha], row.n, da * spow(sinT, m)), row.b, dbw * spow(cosT, m))
      let nrm = cross(dTheta, dS)
      const radial3 = normalize(madd([row.n[0] * sec.x, row.n[1] * sec.x, row.n[2] * sec.x], row.b, sec.y))
      if (dot(nrm, radial3) < 0) nrm = [-nrm[0], -nrm[1], -nrm[2]]
      out.vertex(p, normalize(nrm, radial3), [s[i]! / total, j / radial])
    }
  }
  gridIndices(out, start, nRows, radial)
  const count = out.vertexCount() - start
  if (caps !== 'none') {
    cap(out, rows[0]!, radial, caps, -1)
    cap(out, rows[nRows]!, radial, caps, +1)
  }
  return { out, start, count, stats: { maxRadiusMm, maxCurvature, product: maxProduct } }
}

/**
 * End cap. `round` adds rows at polar angles 0, 30, 60 and 90 degrees that
 * end in one pole ring with the normal +-t; `flat` adds the ring plus a pole
 * ring, all with the pole normal (BG-31). The 0 degree row repeats the tube
 * end ring so that the cap strip has its own seam.
 */
function cap(out: MeshWriter, row: SweepRow, radial: number, style: CapStyle, sign: 1 | -1): void {
  const rMean = Math.max(RADIUS_FLOOR, (row.aD + row.aV) / 4 + row.bw / 2)
  const tip: Vec3 = [row.t[0] * sign, row.t[1] * sign, row.t[2] * sign]
  const base = out.vertexCount()
  const angles = style === 'round' ? [0, 30, 60, 90] : [0, 90]
  for (let k = 0; k < angles.length; k++) {
    const phi = (angles[k]! * Math.PI) / 180
    for (let j = 0; j <= radial; j++) {
      const theta = (2 * Math.PI * j) / radial
      const sec = section(row, theta)
      const x = sec.x * Math.cos(phi)
      const y = sec.y * Math.cos(phi)
      const p: Vec3 = madd(madd(madd(row.p, row.n, x), row.b, y), tip, rMean * Math.sin(phi))
      let n: Vec3
      if (style === 'flat' || k === angles.length - 1) n = tip
      else {
        const a = Math.max(Math.sin(theta) >= 0 ? row.aD : row.aV, RADIUS_FLOOR)
        const b = Math.max(row.bw, RADIUS_FLOOR)
        // Ellipsoidal cap normal: (cos phi sin theta / a, cos phi cos theta / b, sin phi / r).
        const nx = (Math.cos(phi) * Math.sin(theta)) / a
        const ny = (Math.cos(phi) * Math.cos(theta)) / b
        n = normalize(madd(madd([row.n[0] * nx, row.n[1] * nx, row.n[2] * nx], row.b, ny), tip, Math.sin(phi) / rMean), tip)
      }
      out.vertex(p, n, [sign > 0 ? 1 : 0, j / radial])
    }
  }
  // The start cap faces -t, so its winding is reversed relative to the end cap.
  gridIndices(out, base, angles.length - 1, radial, sign < 0)
}
