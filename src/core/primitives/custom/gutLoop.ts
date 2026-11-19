// Gut loop (BG-35): a round tube along its own spline in body coordinates.
// The record form (customParams.ts GutLoopParams) names four segments
// (esophagus, intestinalBulb, midIntestine, posteriorIntestine), each with
// an s range of the path and a radius; the radius holds inside a segment and
// smoothsteps across a short blend zone at each junction. `bulbOffsetW` bows
// the bulb range sideways (negative is left), `countLoops` folds the mid
// range dorsoventrally, and `attachments` name faces on the surface for the
// liver, pancreas and gall bladder. A record may cover the whole gut or one
// segment of it: a segment record gives its own sub-path and lets the
// neighbouring segments own a sliver of s at each end, so the radii match at
// the junctions. Both bows keep r x kappa under 0.6 by construction (E036).
// Vertices as a round-capped sweep: (rows + 1)(radial + 1) + 8 (radial + 1);
// 297 interactive, 741 final.
import type { BodyFrame } from '../../bodyModel.ts'
import { parallelTransportFrames, sampleByArcLength } from '../../spine.ts'
import { createWriter, finish } from '../mesh.ts'
import { RADIUS_FLOOR, sweepTube, sweepVertexCount, type SweepRow } from '../sweep.ts'
import { countsFor } from '../tessellation.ts'
import { sizeMm, type GeometryOut, type Placement, type PrimitiveBuilder, type Size } from '../types.ts'
import { clamp, lerp, madd, normalize, smoothstep, sub, type Vec3 } from '../vec3.ts'

export type GutSegment = 'esophagus' | 'intestinalBulb' | 'midIntestine' | 'posteriorIntestine'
export const GUT_SEGMENTS: GutSegment[] = ['esophagus', 'intestinalBulb', 'midIntestine', 'posteriorIntestine']

export interface GutSegmentSpec { s0: number; s1: number; rMm: Size }
export interface GutAttachment { name: string; s0: number; s1: number; thetaDeg: number }

export type GutSegments = Partial<Record<GutSegment, Partial<GutSegmentSpec>>>

export interface GutLoopParams {
  /** From the mouth (or the segment start) to the vent (or the segment end). */
  path: Placement[]
  segments?: GutSegments
  /** Sideways bow of the bulb range as a fraction of the local half-width; negative is left. */
  bulbOffsetW?: number
  /** Dorsoventral folds of the mid range: 0 in the larva, 1 from 504 hpf, 3 in the adult. */
  countLoops?: number
  attachments?: GutAttachment[] | Record<string, Omit<GutAttachment, 'name'>>
}

const segmentsOf = (params: GutLoopParams): GutSegments => params.segments ?? {}
const loopsOf = (params: GutLoopParams): number => Math.max(0, params.countLoops ?? 0)
function attachmentsOf(params: GutLoopParams): GutAttachment[] {
  const a = params.attachments
  if (!a) return []
  if (Array.isArray(a)) return a
  return Object.entries(a).map(([name, face]) => ({ name, ...face }))
}

/** Largest r x kappa that either bow may add (E036 rejects 0.9). */
const BOW_PRODUCT_MAX = 0.5
/** Half of the s span over which a junction blends, and its cap as a fraction of the shorter segment. */
const BLEND_HALF_S = 0.04
const BLEND_SEGMENT_FRACTION = 0.25
/** The fold amplitude never exceeds this fraction of the local ventral half-height. */
const LOOP_HEIGHT_FRACTION = 0.3
const U_MAX = 1.25

interface Knot { s: number; r: number }

function completeSegment(spec: Partial<GutSegmentSpec> | undefined): GutSegmentSpec | null {
  if (!spec || spec.s0 === undefined || spec.s1 === undefined || spec.rMm === undefined) return null
  return { s0: spec.s0, s1: spec.s1, rMm: spec.rMm }
}

/** Plateau knots per segment, sorted by s; the gaps between plateaus are the blend zones. */
function radiusKnots(params: GutLoopParams, frame: BodyFrame, uAt: (s: number) => number): Knot[] {
  const knots: Knot[] = []
  for (const key of GUT_SEGMENTS) {
    const seg = completeSegment(segmentsOf(params)[key])
    if (!seg) continue
    const span = Math.max(0, seg.s1 - seg.s0)
    const pad = Math.min(BLEND_HALF_S, BLEND_SEGMENT_FRACTION * span)
    const r = Math.max(RADIUS_FLOOR, sizeMm(seg.rMm, frame, uAt((seg.s0 + seg.s1) / 2)))
    knots.push({ s: seg.s0 + pad, r }, { s: seg.s1 - pad, r })
  }
  return knots.sort((a, b) => a.s - b.s)
}

function radiusAt(knots: Knot[], s: number): number {
  if (knots.length === 0) return RADIUS_FLOOR * 2
  if (s <= knots[0]!.s) return knots[0]!.r
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[i]!, b = knots[i + 1]!
    if (s >= a.s && s <= b.s) return b.s > a.s ? lerp(a.r, b.r, smoothstep((s - a.s) / (b.s - a.s))) : b.r
  }
  return knots[knots.length - 1]!.r
}

/** Largest radius the sweep takes inside [s0, s1]. */
function maxRadiusIn(knots: Knot[], s0: number, s1: number, samples = 16): number {
  let r = 0
  for (let i = 0; i <= samples; i++) r = Math.max(r, radiusAt(knots, lerp(s0, s1, i / samples)))
  return r
}

/**
 * A bow amplitude capped so that its peak curvature (amplitude x k^2 for a bump with wave
 * number k) times the tube radius stays under BOW_PRODUCT_MAX.
 */
function safeBow(wanted: number, k: number, radius: number): number {
  if (!(k > 1e-9)) return 0
  const cap = BOW_PRODUCT_MAX / (Math.max(RADIUS_FLOOR, radius) * k * k)
  return Math.sign(wanted) * Math.min(Math.abs(wanted), cap)
}

/** The sideways bulb bow: a raised-cosine bump, zero and flat at both ends (C1), peak curvature amp x 2 pi^2 / L^2. */
const bump = (f: number): number => 0.5 * (1 - Math.cos(2 * Math.PI * f))

export interface GutCentreline { rows: SweepRow[]; length: number; uAt: (s: number) => number }

/** The displaced centreline with parallel-transport frames and radii; shared by the build, the attachments and the tests. */
export function gutCentreline(params: GutLoopParams, frame: BodyFrame, rows: number): GutCentreline {
  const path = params.path.length >= 2 ? params.path : [params.path[0]!, params.path[0]!]
  const pts: Vec3[] = path.map((q) => frame.toWorld(q.u, q.v, q.w))
  const curve = sampleByArcLength(pts, rows + 1)
  const u0 = path[0]!.u
  const u1 = path[path.length - 1]!.u
  const uAt = (s: number): number => clamp(u0 + (u1 - u0) * s, 0, U_MAX)
  const knots = radiusKnots(params, frame, uAt)
  const segs = segmentsOf(params)
  const bulb = completeSegment(segs.intestinalBulb)
  const mid = completeSegment(segs.midIntestine)
  const bulbSpan = bulb ? Math.max(0, bulb.s1 - bulb.s0) : 0
  const midSpan = mid ? Math.max(0, mid.s1 - mid.s0) : 0
  const loops = loopsOf(params)
  const bulbArc = Math.max(1e-9, curve.length * bulbSpan)
  const midArc = Math.max(1e-9, curve.length * midSpan)
  const bowW = bulb && params.bulbOffsetW && bulbSpan > 0 ? safeBow(params.bulbOffsetW * frame.frameAt(uAt((bulb.s0 + bulb.s1) / 2)).hW, (Math.PI * Math.SQRT2) / bulbArc, maxRadiusIn(knots, bulb.s0, bulb.s1)) : 0
  const loopAmp = mid && loops > 0 && midSpan > 0 ? safeBow(LOOP_HEIGHT_FRACTION * frame.frameAt(uAt((mid.s0 + mid.s1) / 2)).hV, (2 * Math.PI * loops) / midArc, maxRadiusIn(knots, mid.s0, mid.s1)) : 0
  const base = parallelTransportFrames(curve.tangents, 0, frame.frameAt(u0).n)
  const positions: Vec3[] = []
  for (let i = 0; i <= rows; i++) {
    const s = i / rows
    let p = curve.positions[i]!
    if (bowW !== 0 && bulb && s >= bulb.s0 && s <= bulb.s1 && bulbSpan > 0) {
      p = madd(p, base.b[i]!, bowW * bump((s - bulb.s0) / bulbSpan))
    }
    if (loopAmp !== 0 && mid && s >= mid.s0 && s <= mid.s1 && midSpan > 0) {
      const g = (s - mid.s0) / midSpan
      p = madd(p, base.n[i]!, loopAmp * Math.sin(Math.PI * g) * Math.sin(2 * Math.PI * loops * g))
    }
    positions.push(p)
  }
  // Tangents of the displaced curve, so the sweep normals and E036 see the bows.
  const tangents: Vec3[] = positions.map((_p, i) => {
    const a = positions[Math.max(0, i - 1)]!
    const b = positions[Math.min(rows, i + 1)]!
    return normalize(sub(b, a), curve.tangents[i]!)
  })
  const frames = parallelTransportFrames(tangents, 0, frame.frameAt(u0).n)
  const out: SweepRow[] = positions.map((p, i): SweepRow => {
    const r = radiusAt(knots, i / rows)
    return { p, t: frames.t[i]!, n: frames.n[i]!, b: frames.b[i]!, aD: r, aV: r, bw: r, exponent: 2 }
  })
  return { rows: out, length: curve.length, uAt }
}

/** World point and outward normal on the gut surface for a named attachment (BG-35); theta 0 is the right side, 90 dorsal. */
export function gutAttachment(params: GutLoopParams, frame: BodyFrame, name: string, rows = 48): { position: Vec3; normal: Vec3; s: number; u: number } | null {
  const att = attachmentsOf(params).find((a) => a.name === name)
  if (!att) return null
  const line = gutCentreline(params, frame, rows)
  const s = (att.s0 + att.s1) / 2
  const row = line.rows[Math.min(rows, Math.max(0, Math.round(s * rows)))]!
  const theta = (att.thetaDeg * Math.PI) / 180
  const normal = normalize(madd(madd([0, 0, 0], row.b, Math.cos(theta)), row.n, Math.sin(theta)), row.n)
  return { position: madd(row.p, normal, row.aD), normal, s, u: line.uAt(s) }
}

export const gutLoop: PrimitiveBuilder<GutLoopParams> = {
  kind: 'gutLoop',
  localFrame: false,
  vertexCount(lod) { const c = countsFor('gutLoop', lod); return sweepVertexCount(c.rows, c.radial, 'round') },
  build(params, frame, lod): GeometryOut {
    const { rows, radial } = countsFor('gutLoop', lod)
    const line = gutCentreline(params, frame, rows)
    const { out, stats } = sweepTube(line.rows, radial, 'round', createWriter())
    const parts: NonNullable<GeometryOut['parts']> = {}
    const stride = radial + 1
    for (const key of GUT_SEGMENTS) {
      const seg = completeSegment(segmentsOf(params)[key])
      if (!seg) continue
      const r0 = Math.max(0, Math.floor(seg.s0 * rows))
      const r1 = Math.min(rows, Math.ceil(seg.s1 * rows))
      parts[key] = { vertexStart: r0 * stride, vertexCount: (r1 - r0 + 1) * stride, indexStart: r0 * radial * 6, indexCount: Math.max(0, r1 - r0) * radial * 6 }
    }
    return finish(out, { parts, sweep: stats })
  },
}
