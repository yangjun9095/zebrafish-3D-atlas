// Heart loop (BG-34): cone, straight tube, C loop, S loop. The cone stage (19 to
// 22 hpf) is a shallow cone whose base sits on the venous pole anchor and whose
// apex points dorsally (Stainier 1993; research 03c heart rudiment row): the radius
// runs from coneBaseRadiusMm at the base to CONE_APEX_FRACTION of it at the apex.
// From the tube stage the centreline runs from the venous pole for half the tube
// length (the atrium limb, aimed along the heading plus the atrium offset), turns to
// the bend and twist heading on a circular arc (a dextral turn: to the right and
// ventral), continues a quarter length as the ventricle limb, turns on a second arc
// to the anterior-dorsal outflow heading and ends with the bulbus limb. Each arc's radius is the fattest chamber it
// passes through divided by 0.8, so r x kappa stays under 0.8 everywhere (E036,
// BG-31); the looped path is therefore longer than `tubeLengthMm`, as the real tube
// elongates while it loops. The path is swept with the chamber radii blended along
// s. `segmentRange(part)` gives the s range of a chamber so that a derived record
// builds one part.
// Vertices as a round-capped sweep: (rows + 1)(radial + 1) + 8 (radial + 1);
// 429 interactive, 969 final. The cone stage uses the same sweep along the
// cone height, so the count never changes across the cone-to-tube handoff.
import type { BodyFrame } from '../../bodyModel.ts'
import { parallelTransportFrames, sampleByArcLength } from '../../spine.ts'
import { createWriter, dirLocal, finish, localAxes, toWorldLocal } from '../mesh.ts'
import { RADIUS_FLOOR, sweepTube, sweepVertexCount, type SweepRow } from '../sweep.ts'
import { countsFor } from '../tessellation.ts'
import { sizeMm, type GeometryOut, type Placement, type PrimitiveBuilder, type Size } from '../types.ts'
import { cross, degToRad, dot, lerp, madd, normalize, rotateAbout, type Vec3 } from '../vec3.ts'

/** Largest r x kappa the loop arcs produce (E036 requires < 0.9). */
const LOOP_PRODUCT_MAX = 0.8
/** Dense samples per straight limb and per arc before the arc-length resample. */
const LIMB_SAMPLES = 12
const ARC_SAMPLES = 24
/** Apex radius of the cone stage as a fraction of the base radius. */
const CONE_APEX_FRACTION = 0.25
/** Ventricle length as a fraction of standard length, a lifetime average (Singleman and Holtzman 2012). */
export const VENTRICLE_LENGTH_SL_FRACTION = 0.0428
/** Bulbus length as a fraction of ventricle length (Singleman and Holtzman 2012). */
export const BULBUS_LENGTH_VENTRICLE_FRACTION = 0.57

export type HeartStage = 'cone' | 'tube' | 'C' | 'S' | 'chambers'
export type HeartPart = 'sinusVenosus' | 'atrium' | 'avCanal' | 'ventricle' | 'bulbus'

export interface HeartLoopParams {
  placement: Placement
  stage: HeartStage
  coneBaseRadiusMm: Size
  coneHeightMm: Size
  tubeLengthMm: Size
  headingDeg: number
  bendDeg: number
  twistDeg: number
  segments: {
    sinusVenosus: { s0: number; s1: number; rMm: Size }
    atrium: { s0: number; s1: number; rMm: Size; rAcrossMm: Size }
    avCanal: { s0: number; s1: number; rMm: Size }
    ventricle: { s0: number; s1: number; rMm: Size; rAcrossMm: Size; exponent: number }
    bulbus: { s0: number; s1: number; rBaseMm: Size; rNeckMm: Size; tiltDeg: number }
  }
  atriumOffset: { v: number; w: number }
}

export const HEART_PARTS: HeartPart[] = ['sinusVenosus', 'atrium', 'avCanal', 'ventricle', 'bulbus']

/** Ventricle length in mm at a standard length (D6 rescale target of the post-embryonic keyframes). */
export function ventricleLengthMm(slMm: number): number {
  return VENTRICLE_LENGTH_SL_FRACTION * slMm
}

/** True while the record draws the cone: the cone stage, or a tube too short to sweep. */
export function isConeStage(params: HeartLoopParams, frame: BodyFrame): boolean {
  return params.stage === 'cone' || sizeMm(params.tubeLengthMm, frame, params.placement.u) < RADIUS_FLOOR
}

export function segmentRange(params: HeartLoopParams, part: HeartPart): { s0: number; s1: number } {
  const seg = params.segments[part]
  return { s0: seg.s0, s1: seg.s1 }
}

/** Radii (along n, along b) and exponent at centreline fraction s. */
function radiiAt(params: HeartLoopParams, frame: BodyFrame, u: number, s: number): { a: number; b: number; exponent: number } {
  const g = params.segments
  const mm = (v: Size): number => sizeMm(v, frame, u)
  if (isConeStage(params, frame)) {
    const base = Math.max(RADIUS_FLOOR, mm(params.coneBaseRadiusMm))
    const r = lerp(base, Math.max(RADIUS_FLOOR, base * CONE_APEX_FRACTION), s)
    return { a: r, b: r, exponent: 2 }
  }
  const knots: { s: number; a: number; b: number; e: number }[] = [
    { s: (g.sinusVenosus.s0 + g.sinusVenosus.s1) / 2, a: mm(g.sinusVenosus.rMm), b: mm(g.sinusVenosus.rMm), e: 2 },
    { s: (g.atrium.s0 + g.atrium.s1) / 2, a: mm(g.atrium.rMm), b: mm(g.atrium.rAcrossMm), e: 2 },
    { s: (g.avCanal.s0 + g.avCanal.s1) / 2, a: mm(g.avCanal.rMm), b: mm(g.avCanal.rMm), e: 2 },
    { s: (g.ventricle.s0 + g.ventricle.s1) / 2, a: mm(g.ventricle.rMm), b: mm(g.ventricle.rAcrossMm), e: 2 / Math.max(0.3, g.ventricle.exponent) },
    { s: g.bulbus.s0, a: mm(g.bulbus.rBaseMm), b: mm(g.bulbus.rBaseMm), e: 2 },
    { s: g.bulbus.s1, a: mm(g.bulbus.rNeckMm), b: mm(g.bulbus.rNeckMm), e: 2 },
  ].sort((x, y) => x.s - y.s)
  if (s <= knots[0]!.s) return { a: knots[0]!.a, b: knots[0]!.b, exponent: knots[0]!.e }
  for (let i = 0; i < knots.length - 1; i++) {
    const k0 = knots[i]!, k1 = knots[i + 1]!
    if (s >= k0.s && s <= k1.s) {
      const f = k1.s > k0.s ? (s - k0.s) / (k1.s - k0.s) : 0
      return { a: lerp(k0.a, k1.a, f), b: lerp(k0.b, k1.b, f), exponent: lerp(k0.e, k1.e, f) }
    }
  }
  const last = knots[knots.length - 1]!
  return { a: last.a, b: last.b, exponent: last.e }
}

/** Appends the points of a circular arc that turns the heading from `from` to `to` with `radius`; returns the end point. */
function appendArc(pts: Vec3[], start: Vec3, from: Vec3, to: Vec3, radius: number): Vec3 {
  const axisRaw = cross(from, to)
  const sinA = Math.hypot(axisRaw[0], axisRaw[1], axisRaw[2])
  const angle = Math.atan2(sinA, dot(from, to))
  if (sinA < 1e-6 || angle < 1e-4) return start
  const axis: Vec3 = [axisRaw[0] / sinA, axisRaw[1] / sinA, axisRaw[2] / sinA]
  const inward = cross(axis, from)
  const centre = madd(start, inward, radius)
  let end = start
  for (let k = 1; k <= ARC_SAMPLES; k++) {
    const a = (angle * k) / ARC_SAMPLES
    end = madd(madd(centre, inward, -radius * Math.cos(a)), from, radius * Math.sin(a))
    pts.push(end)
  }
  return end
}

/** Appends a straight limb of `length` along `dir`; returns the end point. */
function appendLimb(pts: Vec3[], start: Vec3, dir: Vec3, length: number): Vec3 {
  let end = start
  for (let k = 1; k <= LIMB_SAMPLES; k++) {
    end = madd(start, dir, (length * k) / LIMB_SAMPLES)
    pts.push(end)
  }
  return end
}

/** Local centreline points: x posterior, y dorsal, z left, origin at the venous pole. */
export function heartCentreline(params: HeartLoopParams, frame: BodyFrame): Vec3[] {
  const u = params.placement.u
  const L = sizeMm(params.tubeLengthMm, frame, u)
  if (isConeStage(params, frame)) {
    // Base on the anchor, apex dorsal: the cone stands on the yolk under the hindbrain.
    const h = Math.max(RADIUS_FLOOR * 2, sizeMm(params.coneHeightMm, frame, u))
    return [[0, 0, 0], [0, h * 0.25, 0], [0, h * 0.5, 0], [0, h * 0.75, 0], [0, h, 0]]
  }
  const g = params.segments
  const mm = (v: Size): number => sizeMm(v, frame, u)
  const heading = degToRad(params.headingDeg)
  const d0: Vec3 = [-Math.cos(heading), 0, Math.sin(heading)]            // anterior, toward the left
  // The atrium offset aims the first limb dorsally and to the left (w < 0 is the left side, +z),
  // so the atrium sits posterior-dorsal-left of the ventricle after the turn.
  const atriumEnd: Vec3 = madd(madd([0, 0, 0], d0, 0.5 * L), [0, params.atriumOffset.v * 0.2 * L, -params.atriumOffset.w * 0.2 * L], 1)
  const atriumLength = Math.hypot(atriumEnd[0], atriumEnd[1], atriumEnd[2])
  const dA = normalize(atriumEnd, d0)
  // Dextral loop (D-loop): the ventricle limb turns to the right about the dorsal axis by the bend
  // and drops ventrally by the twist, so the ventricle ends ventral and to the right of the atrium.
  let d1 = rotateAbout(dA, [0, 1, 0], -degToRad(params.bendDeg))
  d1 = normalize(madd(d1, [0, 1, 0], -Math.tan(degToRad(Math.min(60, params.twistDeg))) * 0.5))
  // The bulbus limb heads anterior and rises by the tilt, back toward the midline.
  const tilt = degToRad(g.bulbus.tiltDeg)
  const d2: Vec3 = normalize([-Math.cos(tilt), Math.sin(tilt), 0])
  const fattest = Math.max(RADIUS_FLOOR, mm(g.atrium.rMm), mm(g.atrium.rAcrossMm), mm(g.avCanal.rMm), mm(g.ventricle.rMm), mm(g.ventricle.rAcrossMm))
  const bulbusFat = Math.max(RADIUS_FLOOR, mm(g.ventricle.rMm), mm(g.bulbus.rBaseMm))
  // Each arc radius is the fattest radius the arc passes through divided by LOOP_PRODUCT_MAX.
  // The first pass uses the fattest chamber; the second pass reads the radii over the s range
  // the arc occupied, so a turn through the thin atrioventricular canal can be tight (E036 holds
  // per station).
  let rho1 = fattest / LOOP_PRODUCT_MAX
  let rho2 = bulbusFat / LOOP_PRODUCT_MAX
  let pts: Vec3[] = []
  for (let pass = 0; pass < 3; pass++) {
    pts = [[0, 0, 0]]
    let p = appendLimb(pts, [0, 0, 0], dA, atriumLength)
    const i1 = pts.length
    p = appendArc(pts, p, dA, d1, rho1)
    const i2 = pts.length
    p = appendLimb(pts, p, d1, 0.25 * L)
    const i3 = pts.length
    p = appendArc(pts, p, d1, d2, rho2)
    const i4 = pts.length
    appendLimb(pts, p, d2, 0.25 * L)
    const cum = cumulativeLength(pts)
    const total = cum[cum.length - 1]!
    if (!(total > 0)) break
    const maxR = (a: number, b: number): number => {
      let r = RADIUS_FLOOR
      for (let k = 0; k <= 8; k++) {
        const sAt = (cum[a]! + ((cum[Math.min(b, pts.length - 1)]! - cum[a]!) * k) / 8) / total
        const rr = radiiAt(params, frame, u, sAt)
        r = Math.max(r, rr.a, rr.b)
      }
      return r
    }
    const next1 = Math.max(RADIUS_FLOOR * 2, maxR(Math.max(0, i1 - 1), i2 - 1)) / LOOP_PRODUCT_MAX
    const next2 = Math.max(RADIUS_FLOOR * 2, maxR(Math.max(0, i3 - 1), i4 - 1)) / LOOP_PRODUCT_MAX
    if (Math.abs(next1 - rho1) < 1e-4 && Math.abs(next2 - rho2) < 1e-4) break
    rho1 = Math.max(next1, rho1 * 0.5)
    rho2 = Math.max(next2, rho2 * 0.5)
  }
  return pts
}

function cumulativeLength(pts: Vec3[]): number[] {
  const out = [0]
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!, b = pts[i]!
    out.push(out[i - 1]! + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]))
  }
  return out
}

export const heartLoop: PrimitiveBuilder<HeartLoopParams> = {
  kind: 'heartLoop',
  localFrame: false,
  vertexCount(lod) { const c = countsFor('heartLoop', lod); return sweepVertexCount(c.rows, c.radial, 'round') },
  build(params, frame, lod): GeometryOut {
    const { rows, radial } = countsFor('heartLoop', lod)
    const axes = localAxes(frame, params.placement)
    const world = heartCentreline(params, frame).map((p) => toWorldLocal(axes, p))
    const curve = sampleByArcLength(world, rows + 1)
    const frames = parallelTransportFrames(curve.tangents, 0, dirLocal(axes, [0, 1, 0]))
    const sweep: SweepRow[] = []
    for (let i = 0; i <= rows; i++) {
      const s = i / rows
      const r = radiiAt(params, frame, params.placement.u, s)
      sweep.push({ p: curve.positions[i]!, t: frames.t[i]!, n: frames.n[i]!, b: frames.b[i]!, aD: r.a, aV: r.a, bw: r.b, exponent: r.exponent })
    }
    const { out, stats } = sweepTube(sweep, radial, 'round', createWriter())
    const parts: NonNullable<GeometryOut['parts']> = {}
    const stride = radial + 1
    for (const part of HEART_PARTS) {
      const { s0, s1 } = segmentRange(params, part)
      const r0 = Math.max(0, Math.floor(s0 * rows))
      const r1 = Math.min(rows, Math.ceil(s1 * rows))
      parts[part] = { vertexStart: r0 * stride, vertexCount: (r1 - r0 + 1) * stride, indexStart: r0 * radial * 6, indexCount: Math.max(0, r1 - r0) * radial * 6 }
    }
    return finish(out, { parts, sweep: stats })
  },
}
