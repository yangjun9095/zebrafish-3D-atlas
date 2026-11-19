// Tube (BG-29 to BG-31): a sweep along a u range of the body frame or along
// its own spline. `radiusMm: 'body'` sweeps the body's own cross-section
// (hD, hV, hW, exponent) and uses the bodyTube counts of BG-30.
// Vertices: (rows + 1)(radial + 1) plus 4 (radial + 1) per round cap or
// 2 (radial + 1) per flat cap: 225 / 637 without caps, 297 / 741 with round
// caps; the body sweep 1825 / 4521 with round caps.
import type { BodyFrame } from '../bodyModel.ts'
import { parallelTransportFrames, sampleByArcLength } from '../spine.ts'
import { createWriter, finish } from './mesh.ts'
import { RADIUS_FLOOR, sweepTube, sweepVertexCount, type CapStyle, type SweepRow } from './sweep.ts'
import { countsFor } from './tessellation.ts'
import { sizeMm, type GeometryOut, type Lod, type Placement, type PrimitiveBuilder, type Size } from './types.ts'
import { cross, degToRad, dot, lerp, madd, rotateAbout, sub, type Vec3 } from './vec3.ts'

/** The flexed notochord tip stays this fraction of the body's dorsal half-height inside the skin. */
const FLEXION_SKIN_FRACTION = 0.9

export type TubePath =
  | { type: 'spine'; uStart: number; uEnd: number; v: number; w: number }
  | { type: 'spline'; points: Placement[] }

export interface TubeParams {
  path: TubePath
  radiusMm: Size | { r0Mm: Size; r1Mm: Size } | 'body'
  /** v radius divided by w radius. */
  ellipticity?: number
  caps?: CapStyle
  /** Notochord: the taper from r0 to r1 starts here. */
  taperFromU?: number
  /** Notochord: dorsal bend of the part past flexionFromU. */
  flexionDeg?: number
  flexionFromU?: number
  segmented?: boolean
}

export function tubeCounts(params: TubeParams, lod: Lod): { rows: number; radial: number } {
  return countsFor(params.radiusMm === 'body' ? 'bodyTube' : 'tube', lod)
}

/** Rows of a spine path: centres offset by (v, w), frames from the body. */
function spineRows(params: TubeParams, frame: BodyFrame, rows: number): SweepRow[] {
  if (params.path.type !== 'spine') throw new Error('spineRows needs a spine path')
  const { uStart, uEnd, v, w } = params.path
  const out: SweepRow[] = []
  for (let i = 0; i <= rows; i++) {
    const u = lerp(uStart, uEnd, i / rows)
    const f = frame.frameAt(u)
    const p = frame.toWorld(u, v, w)
    const radii = radiiAt(params, frame, u, i / rows, f)
    out.push({ p, t: f.t, n: f.n, b: f.b, ...radii })
  }
  return applyFlexion(params, out, rows, frame)
}

/** Rows of a spline path through body-coordinate points with parallel-transport frames. */
function splineRows(params: TubeParams, frame: BodyFrame, rows: number): SweepRow[] {
  if (params.path.type !== 'spline') throw new Error('splineRows needs a spline path')
  const pts: Vec3[] = params.path.points.map((q) => frame.toWorld(q.u, q.v, q.w))
  const curve = sampleByArcLength(pts, rows + 1)
  const first = params.path.points[0]!
  const frames = parallelTransportFrames(curve.tangents, 0, frame.frameAt(first.u).n)
  const uSpan = params.path.points[params.path.points.length - 1]!.u - first.u
  const out: SweepRow[] = []
  for (let i = 0; i <= rows; i++) {
    const u = first.u + uSpan * (i / rows)
    const radii = radiiAt(params, frame, u, i / rows, frame.frameAt(u))
    out.push({ p: curve.positions[i]!, t: frames.t[i]!, n: frames.n[i]!, b: frames.b[i]!, ...radii })
  }
  return out
}

function radiiAt(params: TubeParams, frame: BodyFrame, u: number, s: number, f: ReturnType<BodyFrame['frameAt']>): Pick<SweepRow, 'aD' | 'aV' | 'bw' | 'exponent'> {
  if (params.radiusMm === 'body') return { aD: f.hD, aV: f.hV, bw: f.hW, exponent: f.exponent }
  const e = params.ellipticity ?? 1
  let r: number
  if (typeof params.radiusMm === 'object' && 'r0Mm' in params.radiusMm) {
    const r0 = sizeMm(params.radiusMm.r0Mm, frame, u)
    const r1 = sizeMm(params.radiusMm.r1Mm, frame, u)
    let k = s
    if (params.taperFromU !== undefined && params.path.type === 'spine') {
      const { uStart, uEnd } = params.path
      const span = uEnd - params.taperFromU
      k = u <= params.taperFromU || span <= 0 ? 0 : (u - params.taperFromU) / span
      if (uStart >= params.taperFromU) k = s
    }
    r = lerp(r0, r1, k)
  } else {
    r = sizeMm(params.radiusMm, frame, u)
  }
  r = Math.max(RADIUS_FLOOR, r)
  return { aD: r * e, aV: r * e, bw: r, exponent: 2 }
}

/** Rows past iF rotated about the pivot's -b axis by an angle that ramps to `totalRad` at the tip. */
function flexRows(rows: SweepRow[], iF: number, nRows: number, totalRad: number): SweepRow[] {
  const pivot = rows[iF]!
  const axis = cross(pivot.t, pivot.n)      // -b: a positive angle turns t toward n (dorsal)
  return rows.map((row, i) => {
    if (i <= iF) return row
    const angle = totalRad * ((i - iF) / (nRows - iF))
    const rel = rotateAbout(sub(row.p, pivot.p), axis, angle)
    const t = rotateAbout(row.t, axis, angle)
    const n = rotateAbout(row.n, axis, angle)
    return { ...row, p: madd(pivot.p, rel, 1), t, n, b: cross(n, t) }
  })
}

/**
 * BG-57: bend the rows past flexionFromU dorsally by up to flexionDeg. The bend is
 * clamped so that every flexed row, plus its dorsal half-axis, stays inside 0.9 of the
 * body's dorsal half-height at its station: the urostyle turns up inside the caudal
 * peduncle and never leaves the skin (phase 1 review R4).
 */
function applyFlexion(params: TubeParams, rows: SweepRow[], nRows: number, frame: BodyFrame): SweepRow[] {
  const deg = params.flexionDeg ?? 0
  if (!deg || params.flexionFromU === undefined || params.path.type !== 'spine') return rows
  const { uStart, uEnd } = params.path
  const uF = params.flexionFromU
  if (uF >= uEnd) return rows
  const iF = Math.round(((uF - uStart) / (uEnd - uStart)) * nRows)
  if (iF < 0 || iF >= nRows) return rows
  const limits: number[] = []
  for (let i = iF + 1; i <= nRows; i++) {
    const u = lerp(uStart, uEnd, i / nRows)
    limits.push(FLEXION_SKIN_FRACTION * frame.frameAt(u).hD - rows[i]!.aD)
  }
  const fits = (rad: number): boolean => {
    const flexed = flexRows(rows, iF, nRows, rad)
    for (let i = iF + 1; i <= nRows; i++) {
      const rise = dot(sub(flexed[i]!.p, rows[i]!.p), rows[i]!.n)
      if (rise > limits[i - iF - 1]!) return false
    }
    return true
  }
  const wanted = degToRad(deg)
  if (fits(wanted)) return flexRows(rows, iF, nRows, wanted)
  let lo = 0
  let hi = wanted
  for (let k = 0; k < 12; k++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) lo = mid
    else hi = mid
  }
  return lo > 1e-6 ? flexRows(rows, iF, nRows, lo) : rows
}

export const tube: PrimitiveBuilder<TubeParams> = {
  kind: 'tube',
  localFrame: false,
  vertexCount(lod, params) {
    const { rows, radial } = tubeCounts(params, lod)
    return sweepVertexCount(rows, radial, params.caps ?? 'round')
  },
  build(params, frame, lod): GeometryOut {
    const { rows, radial } = tubeCounts(params, lod)
    const sweepRows = params.path.type === 'spine' ? spineRows(params, frame, rows) : splineRows(params, frame, rows)
    const { out, stats } = sweepTube(sweepRows, radial, params.caps ?? 'round', createWriter())
    return finish(out, { sweep: stats })
  },
}
