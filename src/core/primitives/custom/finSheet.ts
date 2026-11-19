// Fin sheet (BG-39, BG-59): a sheet whose span rows follow a direction
// field, plus optional fin rays. Record form (customParams.ts FinSheetParams):
// `base.side` is 'dorsal', 'ventral' or 'lateral'; `outlineMm` is a closed
// [chord, span] outline whose chord range maps onto the base path (so a chord
// written as 0..1 reads as a fraction of the base); `rays` draws ceil(count)
// tapered rods from the base to `lengthFraction` of the span.
// Legs. A dorsal base whose `uEnd` exceeds 1 wraps the tail (the median fin
// fold and the caudal fin): the dorsal leg runs uStart to 1, a fan turns from
// +N through +T to -N about the tail tip, and the ventral leg runs back to the
// vent or to uStart, whichever is more posterior. A lateral base draws a pair
// at +-|w| (1 when w is 0); a dorsal or ventral base with w != 0 also draws a
// pair. `rakeDeg` swings the span toward posterior on every straight leg.
// A lateral base (the pectoral fin) sits at `base.v` on the flank (default
// LATERAL_BASE_V, the ventrolateral insertion of the paired fins) and its blade
// is rolled about the base chord by `tiltDeg` from horizontal toward vertical
// (default LATERAL_TILT_DEG), so the blade shows in the lateral and the dorsal
// view (review DR-02, R03). The two leaves are optional until the record schema
// carries them. On a wrapped sheet `forkDepthFraction` also narrows the fan's
// direction sweep from 180 degrees toward LOBED_SPREAD_DEG and turns the legs
// into it, so a forked caudal fin points its lobes posteriorly (review R13).
// The legacy 'fold' and 'caudal' sides and the `outline` [fraction, height]
// form still build. Vertices: sides x (2 (rows + 1)(cols + 1) + 4 (rows + cols))
// plus rays per side x ((rayRows + 1)(rayRadial + 1) + 1).
import type { BodyFrame } from '../../bodyModel.ts'
import { countInstances } from '../../interpolation.ts'
import { createWriter, finish, gridIndices, type MeshWriter } from '../mesh.ts'
import { EDGE_FLOOR, buildRuledSheet, outlineExtent, sheetVertexCount, type RuledSurface } from '../sheet.ts'
import { countsFor } from '../tessellation.ts'
import { sizeMm, type GeometryOut, type Lod, type PrimitiveBuilder, type Size } from '../types.ts'
import { cross, degToRad, lerp, madd, normalize, scale, sub, type Vec3 } from '../vec3.ts'

export type FinLeg = 'fold' | 'dorsal' | 'ventral' | 'lateral' | 'caudal'

export interface FinRays { count: number; lengthFraction: number; thicknessMm: Size }

export interface FinSheetParams {
  /** `v` applies to a lateral base only (default LATERAL_BASE_V). */
  base: { uStart: number; uEnd: number; side: FinLeg; w: number; v?: number }
  /** Record form: closed outline as [chord, span] in mm; the chord range maps onto the base path. */
  outlineMm?: [number, number][]
  /** Legacy form: [chord fraction 0..1, height mm]. */
  outline?: [number, number][]
  thicknessBaseMm: number
  thicknessEdgeMm: number
  rakeDeg?: number
  /** Lateral base only: roll of the blade about the base chord, 0 horizontal, 90 vertical (default LATERAL_TILT_DEG). */
  tiltDeg?: number
  /** Chord share of the caudal fan of a wrapped sheet; default from the arc lengths, at least 0.22. */
  fanShare?: number
  /** Caudal notch depth as a fraction of the height (record: 0 to 0.2). */
  forkDepthFraction?: number
  lobes?: 1 | 2 | 'one' | 'two'
  rays?: FinRays
}

/** Ray tessellation per level: rows along the ray, radial around it. */
const RAY_COUNTS: Record<Lod, { rows: number; radial: number }> = { interactive: { rows: 2, radial: 4 }, final: { rows: 3, radial: 6 } }
const rayVertexCount = (lod: Lod): number => { const c = RAY_COUNTS[lod]; return (c.rows + 1) * (c.radial + 1) + 1 }
/** Default v of a lateral base: the paired fins insert on the ventrolateral flank, on the yolk shoulder of the larva. */
export const LATERAL_BASE_V = -0.45
/** Default roll of a lateral blade from horizontal toward vertical, so a resting pectoral fin lies against the flank. */
export const LATERAL_TILT_DEG = 55
/**
 * Direction sweep of the caudal fan at the schema's largest fork (0.2): the lobes point
 * posteriorly. At 80 degrees the outer lobe rows lie about 58 degrees off the dorsal normal,
 * so the adult caudal fin reaches 0.20 SL past the notochord end (D6 sets TL = 1.2 SL) while
 * its dorsoventral spread stays near 0.31 SL, as in the owner's adult reference figure.
 */
export const LOBED_SPREAD_DEG = 80
const FORK_MAX = 0.2

/**
 * Smooth span at one chord (VR-10). `outlineExtent` reads the outline as straight segments, so a
 * seven-point caudal outline draws a seven-sided plate with a vertex at every sample. This reads the
 * same samples as a monotone Hermite curve (Fritsch-Carlson tangents): the margin is round, the
 * apex is a rounded peak, and no interval overshoots its two samples, so the fin never grows past
 * the outline the record wrote. Falls back to `outlineExtent` when the outline is not single valued
 * in chord (a two-lobed loop) or carries fewer than three samples.
 */
export function smoothExtent(outline: readonly (readonly [number, number])[], chord: number): number {
  const xs: number[] = []
  const ys: number[] = []
  for (const [c, s] of [...outline].sort((a, b) => a[0] - b[0])) {
    if (xs.length > 0 && Math.abs(c - xs[xs.length - 1]!) < 1e-9) {
      ys[ys.length - 1] = Math.max(ys[ys.length - 1]!, s)
      continue
    }
    xs.push(c)
    ys.push(s)
  }
  if (xs.length < 3) return outlineExtent(outline as [number, number][], chord)
  if (chord <= xs[0]!) return Math.max(EDGE_FLOOR, ys[0]!)
  if (chord >= xs[xs.length - 1]!) return Math.max(EDGE_FLOOR, ys[ys.length - 1]!)
  let i = 0
  while (i < xs.length - 2 && chord > xs[i + 1]!) i++
  const h = xs[i + 1]! - xs[i]!
  if (!(h > 1e-12)) return Math.max(EDGE_FLOOR, ys[i + 1]!)
  const slope = (a: number, b: number): number => (xs[b]! - xs[a]! > 1e-12 ? (ys[b]! - ys[a]!) / (xs[b]! - xs[a]!) : 0)
  const tangent = (k: number): number => {
    const before = k > 0 ? slope(k - 1, k) : slope(0, 1)
    const after = k < xs.length - 1 ? slope(k, k + 1) : slope(xs.length - 2, xs.length - 1)
    // A local peak or trough gets a flat tangent, so the curve rounds instead of overshooting.
    if (before * after <= 0) return 0
    const m = (before + after) / 2
    const limit = 3 * Math.min(Math.abs(before), Math.abs(after))
    return Math.sign(m) * Math.min(Math.abs(m), limit)
  }
  const t = (chord - xs[i]!) / h
  const t2 = t * t
  const t3 = t2 * t
  const m0 = tangent(i) * h
  const m1 = tangent(i + 1) * h
  const value = (2 * t3 - 3 * t2 + 1) * ys[i]! + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * ys[i + 1]! + (t3 - t2) * m1
  return Math.max(EDGE_FLOOR, value)
}

function heightAt(params: FinSheetParams, c: number): number {
  if (params.outlineMm && params.outlineMm.length >= 3) {
    const chords = params.outlineMm.map((p) => p[0])
    const cMin = Math.min(...chords), cMax = Math.max(...chords)
    return smoothExtent(params.outlineMm, lerp(cMin, cMax, c))
  }
  const pts = [...(params.outline ?? [])].sort((a, b) => a[0] - b[0])
  if (pts.length === 0) return EDGE_FLOOR
  if (c <= pts[0]![0]) return Math.max(EDGE_FLOOR, pts[0]![1])
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!, b = pts[i + 1]!
    if (c >= a[0] && c <= b[0]) return Math.max(EDGE_FLOOR, lerp(a[1], b[1], b[0] > a[0] ? (c - a[0]) / (b[0] - a[0]) : 0))
  }
  return Math.max(EDGE_FLOOR, pts[pts.length - 1]![1])
}

/** Direction in the sagittal plane at angle `a` from +n toward +t: 0 gives +n, pi / 2 gives +t, pi gives -n. */
function dirAt(n: Vec3, t: Vec3, a: number): Vec3 {
  return normalize([n[0] * Math.cos(a) + t[0] * Math.sin(a), n[1] * Math.cos(a) + t[1] * Math.sin(a), n[2] * Math.cos(a) + t[2] * Math.sin(a)], t)
}

/** Angular sweep of the fan: 180 degrees for a fold, narrowing to LOBED_SPREAD_DEG as the fork deepens. */
function fanSpread(fork: number): number {
  const k = Math.min(1, Math.max(0, fork / FORK_MAX))
  return degToRad(lerp(180, LOBED_SPREAD_DEG, k))
}

const neg = (v: Vec3): Vec3 => [-v[0], -v[1], -v[2]]

interface Wrap { dorsalShare: number; fanShare: number; ventralEnd: number }

/** True for a sheet that turns around the tail tip. */
export function isWrapped(params: FinSheetParams): boolean {
  const { side, uEnd } = params.base
  return side === 'fold' || side === 'caudal' || (side === 'dorsal' && uEnd > 1)
}

/** Chord shares of the three legs from their arc lengths; the fan keeps at least 0.22 so it stays round. */
function wrapOf(params: FinSheetParams, frame: BodyFrame): Wrap {
  const { uStart, uEnd, side } = params.base
  const tip = frame.frameAt(1)
  const ventralEnd = side === 'fold' ? uEnd : side === 'caudal' ? 1 : Math.max(uStart, frame.ventU)
  const dorsalArc = side === 'caudal' ? 0 : Math.max(0, 1 - uStart) * frame.axisLengthMm
  const ventralArc = Math.max(0, 1 - ventralEnd) * frame.axisLengthMm
  const fanArc = Math.PI * Math.max(EDGE_FLOOR, tip.hD)
  const total = dorsalArc + ventralArc + fanArc
  let fanShare = params.fanShare ?? Math.max(0.22, fanArc / total)
  fanShare = Math.min(1, Math.max(0.05, fanShare))
  const legs = dorsalArc + ventralArc
  const dorsalShare = legs > 0 ? (1 - fanShare) * (dorsalArc / legs) : 0
  return { dorsalShare, fanShare, ventralEnd }
}

/** Sides of the sheet: a pair for a lateral base or an off-midline dorsal or ventral base. */
export function finSides(params: FinSheetParams): number[] {
  const { side, w } = params.base
  if (side === 'lateral') { const ww = w === 0 ? 1 : Math.abs(w); return [ww, -ww] }
  if ((side === 'dorsal' || side === 'ventral') && w !== 0) return [Math.abs(w), -Math.abs(w)]
  return [w]
}

export function finSurface(params: FinSheetParams, frame: BodyFrame, w = params.base.w): RuledSurface {
  const { uStart, uEnd, side } = params.base
  const rake = degToRad(params.rakeDeg ?? 0)
  const lobes = params.lobes
  let fork = Math.min(0.9, Math.max(0, params.forkDepthFraction ?? 0))
  if ((lobes === 2 || lobes === 'two') && fork === 0) fork = 0.1
  const wrapped = isWrapped(params)
  const wrap = wrapped ? wrapOf(params, frame) : null
  const tip = frame.frameAt(1)
  const tipR = Math.max(EDGE_FLOOR, tip.hD)
  const raked = (d: Vec3, t: Vec3): Vec3 => normalize(madd([d[0] * Math.cos(rake), d[1] * Math.cos(rake), d[2] * Math.cos(rake)], t, Math.sin(rake)), d)
  // Fan sweep and the leg directions that turn into it (a fold sweeps the full half turn).
  const spread = fanSpread(fork)
  const fanStart = Math.PI / 2 - spread / 2
  const fanEnd = Math.PI / 2 + spread / 2
  const baseOf = (c: number): { p: Vec3; d: Vec3; td: Vec3 } => {
    if (wrap) {
      const { dorsalShare, fanShare, ventralEnd } = wrap
      if (c < dorsalShare) {
        const u = lerp(uStart, 1, c / dorsalShare)
        const f = frame.frameAt(u)
        return { p: frame.toWorld(u, 1, w), d: dirAt(f.n, f.t, lerp(0, fanStart, c / dorsalShare)), td: f.b }
      }
      if (c <= dorsalShare + fanShare) {
        const d = dirAt(tip.n, tip.t, lerp(fanStart, fanEnd, (c - dorsalShare) / fanShare))
        return { p: madd(tip.p, d, tipR), d, td: tip.b }
      }
      const rest = 1 - dorsalShare - fanShare
      const s = rest > 0 ? (c - dorsalShare - fanShare) / rest : 1
      const u = lerp(1, ventralEnd, s)
      const f = frame.frameAt(u)
      return { p: frame.toWorld(u, -1, w), d: dirAt(f.n, f.t, lerp(fanEnd, Math.PI, s)), td: f.b }
    }
    const u = lerp(uStart, uEnd, c)
    const f = frame.frameAt(u)
    if (side === 'dorsal') return { p: frame.toWorld(u, 1, w), d: raked(f.n, f.t), td: f.b }
    if (side === 'ventral') return { p: frame.toWorld(u, -1, w), d: raked(neg(f.n), f.t), td: f.b }
    // Lateral: the base sits on the skin at v, the blade is rolled from outward toward ventral by the tilt.
    const ww = w === 0 ? 1 : w
    const vBase = params.base.v ?? LATERAL_BASE_V
    const e = Math.max(1, f.exponent)
    const onSkin = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(vBase), e)), 1 / e)
    const outward: Vec3 = ww > 0 ? f.b : neg(f.b)
    const tilt = degToRad(params.tiltDeg ?? LATERAL_TILT_DEG)
    const d0 = normalize(madd(scale(outward, Math.cos(tilt)), f.n, -Math.sin(tilt)), outward)
    const td = normalize(madd(scale(outward, Math.sin(tilt)), f.n, Math.cos(tilt)), f.n)
    return { p: frame.toWorld(u, vBase, ww * onSkin), d: raked(d0, f.t), td }
  }
  const height = (c: number): number => {
    let h = heightAt(params, c)
    if (fork > 0 && wrap) {
      const centre = wrap.dorsalShare + wrap.fanShare / 2
      const width = side === 'caudal' ? 0.5 : wrap.fanShare / 2
      const x = Math.abs(c - centre) / width
      if (x < 1) h *= 1 - fork * (1 - x)
    }
    return Math.max(EDGE_FLOOR, h)
  }
  return {
    at(c, f) { const b = baseOf(c); return madd(b.p, b.d, f * height(c)) },
    thicknessDir(c) { return baseOf(c).td },
    thickness(_c, f) { return Math.max(EDGE_FLOOR, lerp(params.thicknessBaseMm, params.thicknessEdgeMm, f)) },
  }
}

/** Visible rays and the length scale of the last one (BG-42). */
function rayPlan(params: FinSheetParams): { visible: number; full: number; partialScale: number } {
  const count = params.rays?.count ?? 0
  if (!(count > 0) || !((params.rays?.lengthFraction ?? 0) > 0)) return { visible: 0, full: 0, partialScale: 0 }
  return countInstances(count)
}

/** One tapered rod along the span line at chord c, from the base to `length` of the span. */
function buildRay(surface: RuledSurface, c: number, length: number, radius: number, lod: Lod, out: MeshWriter): void {
  const { rows, radial } = RAY_COUNTS[lod]
  const base = out.vertexCount()
  const h = 1e-3
  for (let i = 0; i <= rows; i++) {
    const f = (i / rows) * length
    const p = surface.at(c, f)
    const along = normalize(sub(surface.at(c, Math.min(1, f + h)), surface.at(c, Math.max(0, f - h))), surface.thicknessDir(c, f))
    const td = surface.thicknessDir(c, f)
    const side = normalize(cross(td, along), td)
    const r = Math.max(EDGE_FLOOR, radius * (1 - 0.5 * (i / rows)))
    for (let j = 0; j <= radial; j++) {
      const a = (2 * Math.PI * j) / radial
      const n: Vec3 = [td[0] * Math.cos(a) + side[0] * Math.sin(a), td[1] * Math.cos(a) + side[1] * Math.sin(a), td[2] * Math.cos(a) + side[2] * Math.sin(a)]
      out.vertex(madd(p, n, r), n, [i / rows, j / radial])
    }
  }
  gridIndices(out, base, rows, radial)
  // Tip pole: closes the distal end with the along direction as its normal.
  const tipRow = base + rows * (radial + 1)
  const tipP = surface.at(c, length)
  const along = normalize(sub(surface.at(c, length), surface.at(c, Math.max(0, length - h))), surface.thicknessDir(c, length))
  const pole = out.vertex(tipP, along, [1, 0.5])
  for (let j = 0; j < radial; j++) out.tri(tipRow + j, pole, tipRow + j + 1)
}

export const finSheet: PrimitiveBuilder<FinSheetParams> = {
  kind: 'finSheet',
  localFrame: false,
  vertexCount(lod, params) {
    const c = countsFor('finSheet', lod)
    return finSides(params).length * (sheetVertexCount(c.rows, c.radial) + rayPlan(params).visible * rayVertexCount(lod))
  },
  build(params, frame, lod): GeometryOut {
    const { rows, radial } = countsFor('finSheet', lod)
    const out = createWriter()
    const plan = rayPlan(params)
    const rays = params.rays
    const radius = rays ? sizeMm(rays.thicknessMm, frame, Math.min(1, params.base.uStart)) / 2 : 0
    for (const w of finSides(params)) {
      const surface = finSurface(params, frame, w)
      buildRuledSheet(surface, rows, radial, out)
      if (!rays || plan.visible === 0) continue
      const length = Math.min(1, Math.max(0, rays.lengthFraction))
      for (let i = 0; i < plan.visible; i++) {
        const c = (i + 0.5) / plan.visible
        const scale = i < plan.full ? 1 : plan.partialScale
        buildRay(surface, c, Math.max(0.02, length * scale), radius * Math.max(0.2, scale), lod, out)
      }
    }
    return finish(out)
  },
}
