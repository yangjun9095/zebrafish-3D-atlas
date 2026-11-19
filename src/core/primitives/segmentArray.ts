// Segment array (BG-32, BG-45): repeats a compact template along u. Instance
// i sits at u_i = uStart + (i + 0.5)(uEnd - uStart) / count and takes the
// frame there; `ceil(count)` instances are visible and the last scales by
// the fraction (BG-42). The template is built once at the mid station, so each
// instance scales its height and width by the local body against that station
// (a tail somite is shorter than a trunk somite). The height scale is per axis:
// the dorsal edge follows the dorsal half-heights and the ventral edge the
// ventral ones, which a single scale cannot do, so each instance also carries a
// shift along its local y axis. `instances` gives the per-instance transforms
// for two InstancedMesh objects (left and right); `build` concatenates them for
// a non-instanced fallback and the tests.
// Vertex count: visible x template.
import type { BodyFrame } from '../bodyModel.ts'
import { countInstances } from '../interpolation.ts'
import { somiteChevron, type SomiteChevronParams } from './custom/somiteChevron.ts'
import { ellipsoid, type EllipsoidParams } from './ellipsoid.ts'
import { lathe, type LatheParams } from './lathe.ts'
import { boundsOf, localAxes, reverseWinding } from './mesh.ts'
import { superellipsoid, type SuperellipsoidParams } from './superellipsoid.ts'
import { sizeMm, type GeometryOut, type GeometryPlacement, type Lod, type Placement, type PrimitiveBuilder } from './types.ts'
import { applyQuat, cross, madd, quatFromAxes, type Vec3 } from './vec3.ts'

type WithOptionalPlacement<T extends { placement: Placement }> = Omit<T, 'placement'> & { placement?: Placement }

export type SegmentTemplate =
  | ({ kind: 'ellipsoid' } & WithOptionalPlacement<EllipsoidParams>)
  | ({ kind: 'superellipsoid' } & WithOptionalPlacement<SuperellipsoidParams>)
  | ({ kind: 'lathe' } & WithOptionalPlacement<LatheParams>)
  | ({ kind: 'custom'; builder: 'somiteChevron' } & WithOptionalPlacement<SomiteChevronParams>)

/** A template without a placement sits on the spine at the lateral surface (v 0, w 1). */
export const DEFAULT_TEMPLATE_PLACEMENT: Placement = { u: 0, v: 0, w: 1 }

export interface SegmentArrayParams {
  template: SegmentTemplate
  uStart: number
  uEnd: number
  count: number
  mirror?: boolean
  perIndex?: { scale?: number; offsetV?: number; chevronDeg?: number }
}

/** Clamp of the local-body scale ratios, so a station with a degenerate profile cannot blow an instance up. */
export const BODY_SCALE_RANGE: readonly [number, number] = [0.1, 3]

/** Height factor, width factor and the shift along the local y axis, in mm, of one instance. */
export interface BodyScale { y: number; z: number; offsetMm: number }

/** Reach of a template above (`dorsalMm`) and below (`ventralMm`) the spine at the template station. */
export interface TemplateSpan { dorsalMm: number; ventralMm: number }

/**
 * Height (y) and width (z) factors of the instance at `u` against the template station `uMid`,
 * and the shift along the local y axis that goes with them. z is the ratio of the half-widths.
 *
 * With a `span` the scale is per axis: the dorsal edge of the template follows the ratio of the
 * dorsal half-heights and the ventral edge follows the ratio of the ventral ones, so a myotome
 * fills a station whose ventral half is deeper than the template station's. One scale cannot put
 * both edges on their own ratio, so the pair (y, offsetMm) carries the affine map that does. The
 * origin already follows the ratio of its own side of the spine, so `offsetMm` moves the far edge.
 *
 * Without a `span` the older rule holds: the ratio of the template's own side, and the smaller of
 * the two for a template that straddles the spine. Every ratio is clamped to BODY_SCALE_RANGE.
 */
export function bodyScaleAt(frame: BodyFrame, uMid: number, u: number, v = 0, span?: TemplateSpan): BodyScale {
  const fm = frame.frameAt(uMid)
  const fi = frame.frameAt(u)
  const ratio = (a: number, b: number) => (b > 1e-9 && Number.isFinite(a / b) ? a / b : 1)
  const clamp = (x: number) => Math.min(BODY_SCALE_RANGE[1], Math.max(BODY_SCALE_RANGE[0], x))
  const rD = clamp(ratio(fi.hD, fm.hD))
  const rV = clamp(ratio(fi.hV, fm.hV))
  const z = clamp(ratio(fi.hW, fm.hW))
  if (!span) return { y: v >= 0.5 ? rD : v <= -0.5 ? rV : Math.min(rD, rV), z, offsetMm: 0 }
  const { dorsalMm: a, ventralMm: b } = span
  if (!(b > 0)) return { y: rD, z, offsetMm: 0 }
  if (!(a > 0)) return { y: rV, z, offsetMm: 0 }
  return { y: clamp((a * rD + b * rV) / (a + b)), z, offsetMm: ((v >= 0 ? b : a) * (rD - rV)) / 2 }
}

/** Half-height of a template in mm at station `u`; null when the kind states no height. */
function templateHalfHeightMm(t: SegmentTemplate, frame: BodyFrame, u: number): number | null {
  if (t.kind === 'custom') {
    const f = frame.frameAt(u)
    return Math.max(0.004, t.heightMm ?? t.heightFraction * (f.hD + f.hV)) / 2
  }
  if (t.kind === 'ellipsoid' || t.kind === 'superellipsoid') return t.radiiMm ? sizeMm(t.radiiMm[1], frame, u) : null
  return null
}

/** Reach of the template above and below the spine at its own station; null when the height is unknown. */
export function templateSpan(t: SegmentTemplate, frame: BodyFrame, u: number, v: number): TemplateSpan | null {
  const half = templateHalfHeightMm(t, frame, u)
  if (half === null || !Number.isFinite(half)) return null
  const f = frame.frameAt(u)
  const centre = v >= 0 ? v * f.hD : v * f.hV
  return { dorsalMm: centre + half, ventralMm: half - centre }
}

export interface SegmentInstance {
  index: number
  side: 'right' | 'left'
  u: number
  placement: GeometryPlacement
}

function templateBuilder(t: SegmentTemplate): PrimitiveBuilder<Record<string, unknown>> {
  switch (t.kind) {
    case 'ellipsoid': return ellipsoid as unknown as PrimitiveBuilder<Record<string, unknown>>
    case 'superellipsoid': return superellipsoid as unknown as PrimitiveBuilder<Record<string, unknown>>
    case 'lathe': return lathe as unknown as PrimitiveBuilder<Record<string, unknown>>
    case 'custom': return somiteChevron as unknown as PrimitiveBuilder<Record<string, unknown>>
  }
}

/** Per-instance transforms; a mirrored copy uses the mirrored template geometry, never a reflection matrix. */
export function segmentInstances(params: SegmentArrayParams, frame: BodyFrame): SegmentInstance[] {
  const { full, partialScale, visible } = countInstances(params.count)
  const out: SegmentInstance[] = []
  const t = params.template
  const base: Placement = t.placement ?? DEFAULT_TEMPLATE_PLACEMENT
  const uMid = (params.uStart + params.uEnd) / 2
  const v = base.v + (params.perIndex?.offsetV ?? 0)
  const span = templateSpan(t, frame, uMid, v) ?? undefined
  for (let i = 0; i < visible; i++) {
    const u = params.uStart + ((i + 0.5) * (params.uEnd - params.uStart)) / Math.max(params.count, 1e-9)
    const s = (i < full ? 1 : partialScale) * (params.perIndex?.scale ?? 1)
    const body = bodyScaleAt(frame, uMid, u, v, span)
    const sides: ('right' | 'left')[] = params.mirror ? ['right', 'left'] : [base.w < 0 ? 'left' : 'right']
    for (const side of sides) {
      const w = params.mirror ? (side === 'right' ? Math.abs(base.w) : -Math.abs(base.w)) : base.w
      const axes = localAxes(frame, { ...base, u, w, v, mirror: false })
      // The template scales about its own origin, so the shift of the per-axis scale scales with it.
      const position = madd(axes.origin, axes.y, body.offsetMm * s)
      out.push({
        index: i, side, u,
        placement: { position, quaternion: quatFromAxes(axes.x, axes.y, cross(axes.x, axes.y)), scale: [s, s * body.y, s * body.z] },
      })
    }
  }
  return out
}

/** Build the template once in its local frame at station u = mid-range (a compact kind). */
export function templateGeometry(params: SegmentArrayParams, frame: BodyFrame, lod: Lod, mirrored = false): GeometryOut {
  const t = params.template
  const mid = (params.uStart + params.uEnd) / 2
  const p = { ...t, placement: { ...(t.placement ?? DEFAULT_TEMPLATE_PLACEMENT), u: mid } } as unknown as Record<string, unknown>
  if (t.kind === 'custom' && params.perIndex?.chevronDeg !== undefined) p.chevronDeg = params.perIndex.chevronDeg
  const g = templateBuilder(t).build(p, frame, lod)
  if (mirrored) {
    const positions = g.positions.slice()
    const normals = g.normals.slice()
    for (let i = 2; i < positions.length; i += 3) { positions[i] = -positions[i]!; normals[i] = -normals[i]! }
    const indices = g.indices.slice()
    reverseWinding(indices)
    return { ...g, positions, normals, indices, bounds: boundsOf(positions) }
  }
  return g
}

export const segmentArray: PrimitiveBuilder<SegmentArrayParams> = {
  kind: 'segmentArray',
  localFrame: false,
  vertexCount(lod, params) {
    const per = templateBuilder(params.template).vertexCount(lod, params.template as unknown as Record<string, unknown>)
    const { visible } = countInstances(params.count)
    return per * visible * (params.mirror ? 2 : 1)
  },
  build(params, frame, lod): GeometryOut {
    const right = templateGeometry(params, frame, lod, false)
    const left = templateGeometry(params, frame, lod, true)
    const instances = segmentInstances(params, frame)
    const per = right.positions.length / 3
    const total = per * instances.length
    const positions = new Float32Array(total * 3)
    const normals = new Float32Array(total * 3)
    const uvs = new Float32Array(total * 2)
    const idx: number[] = []
    instances.forEach((inst, k) => {
      const g = inst.side === 'left' ? left : right
      const { position, quaternion, scale } = inst.placement
      for (let v = 0; v < per; v++) {
        const lp: Vec3 = [g.positions[3 * v]! * scale[0], g.positions[3 * v + 1]! * scale[1], g.positions[3 * v + 2]! * scale[2]]
        const wp = applyQuat(quaternion, lp)
        const wn = applyQuat(quaternion, [g.normals[3 * v]!, g.normals[3 * v + 1]!, g.normals[3 * v + 2]!])
        const o = (k * per + v) * 3
        positions[o] = wp[0] + position[0]; positions[o + 1] = wp[1] + position[1]; positions[o + 2] = wp[2] + position[2]
        normals[o] = wn[0]; normals[o + 1] = wn[1]; normals[o + 2] = wn[2]
        uvs[(k * per + v) * 2] = g.uvs[2 * v]!; uvs[(k * per + v) * 2 + 1] = g.uvs[2 * v + 1]!
      }
      for (let i = 0; i < g.indices.length; i++) idx.push(g.indices[i]! + k * per)
    })
    const indices = total > 65535 ? new Uint32Array(idx) : new Uint16Array(idx)
    return { positions, normals, uvs, indices, bounds: boundsOf(positions) }
  },
}
