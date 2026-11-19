// Somite chevron (BG-38): a local-frame block, length along u, height along
// v, width along w, whose anterior and posterior faces carry a chevron cut
// with the apex anterior. The medial face (local +z, toward the notochord) is
// flat; the lateral face is a half-ellipse in section that narrows toward the
// dorsal and ventral edges, so the block sits inside the elliptical skin
// instead of poking its corners through it (phase 2 WP-A1). On a curled spine
// the block's length scales with height by the arc-length factor 1 - k1 y of
// the offset curve, so neighbouring segments still touch on the outer side of
// the curl instead of fanning open (phase 1 review R8). Four side faces of
// (rows x 1) plus two caps: 8 (rows + 1) + 8 vertices, 80 at rows = 8.
import { dot, sub } from '../vec3.ts'
import type { BodyFrame } from '../../bodyModel.ts'
import { createWriter, finish, localAxes, placementOf, type MeshWriter } from '../mesh.ts'
import { countsFor } from '../tessellation.ts'
import type { GeometryOut, Placement, PrimitiveBuilder } from '../types.ts'
import { degToRad, normalize, type Vec3 } from '../vec3.ts'

export interface SomiteChevronParams {
  placement: Placement
  lengthMm: number
  widthMm: number
  /** Fraction of the local body height (hD + hV); 1.0 for a myotome. */
  heightFraction: number
  /** Explicit height in mm; overrides heightFraction when set. */
  heightMm?: number
  /** 0 is a cuboid; 40 for trunk segments by 26 hpf. */
  chevronDeg: number
  /** 0 in the larva, 1 for the adult W shape. */
  wFoldFraction?: number
  /** Accepted for the schema; the apex always points anteriorly. */
  apexOffsetFraction?: number
}

/** The chevron tip reaches at most this many block lengths past the block (the arms nest in about two neighbours). */
export const CHEVRON_REACH_LENGTHS = 1

/**
 * Share of the segment pitch left open between neighbouring blocks. A record gives the block the
 * array pitch as its length, so two neighbours would share one face and z-fight along it. The
 * builder draws the block a little shorter instead: the gap is the myoseptum, and the chevron
 * lines of RN-01 read in a lateral view.
 */
export const SEGMENT_GAP_FRACTION = 0.08

/**
 * Posterior offset of the anterior and posterior faces at height fraction y in [-1, 1]. `maxOffset`
 * caps the offset: past the cap the face runs straight (slope 0), so a tall adult myomere at 40
 * degrees does not throw its arms across six neighbours and through the tail skin.
 */
function chevronOffset(y: number, halfHeight: number, chevronDeg: number, wFold: number, maxOffset = Infinity): { d: number; slope: number } {
  const tan = Math.tan(degToRad(Math.min(80, Math.max(0, chevronDeg))))
  const a = Math.abs(y)
  // W fold: a second apex at |y| = 0.5; blend by wFold.
  const tri = wFold > 0 ? (1 - wFold) * a + wFold * Math.abs(a - 0.5) * 2 : a
  const sign = wFold > 0 ? (1 - wFold) * Math.sign(y) + wFold * Math.sign(y) * Math.sign(a - 0.5) : Math.sign(y)
  const raw = tri * halfHeight * tan
  if (raw >= maxOffset) return { d: maxOffset, slope: 0 }
  return { d: raw, slope: sign * tan * (wFold > 0 ? 1 + wFold : 1) }
}

/** Bounds of the height-dependent length factor, so a block never inverts or balloons. */
const FAN_SCALE_MIN = 0.3
const FAN_SCALE_MAX = 3
/** Width of the block at its dorsal and ventral edges, as a fraction of the mid-height width. */
export const LATERAL_EDGE_FRACTION = 0.35
/** Floor of 1 - y^2 in the lateral-face derivative, so the edge normal stays finite. */
const EDGE_SLOPE_FLOOR = 0.03

/**
 * `fanPerMm` is minus the spine curvature toward the dorsal normal at the block's station:
 * the half-length at height yy along that normal is hl x (1 + fanPerMm x yy).
 */
export function somiteChevronLocal(length: number, height: number, width: number, chevronDeg: number, wFold: number, rows: number, out: MeshWriter = createWriter(), fanPerMm = 0): MeshWriter {
  const hl = length / 2, hh = height / 2, hw = width / 2
  const halfAt = (y: number): number => hl * Math.min(FAN_SCALE_MAX, Math.max(FAN_SCALE_MIN, 1 + fanPerMm * y * hh))
  // Lateral face z at height fraction y: -hw at mid-height, hw (1 - 2 f) at the edges (a half-ellipse).
  const lateralZ = (y: number): number => hw - width * (LATERAL_EDGE_FRACTION + (1 - LATERAL_EDGE_FRACTION) * Math.sqrt(Math.max(0, 1 - y * y)))
  // d(lateralZ)/d(y in mm), for the lateral normal.
  const lateralSlope = (y: number): number => (width * (1 - LATERAL_EDGE_FRACTION) * y) / (hh * Math.sqrt(Math.max(EDGE_SLOPE_FLOOR, 1 - y * y)))
  const face = (xAt: (y: number) => { x: number; slope: number }, normalOf: (slope: number) => Vec3, flip: boolean): void => {
    const base = out.vertexCount()
    for (let i = 0; i <= rows; i++) {
      const y = -1 + (2 * i) / rows
      const { x, slope } = xAt(y)
      const n = normalOf(slope)
      for (const z of [lateralZ(y), hw]) out.vertex([x, y * hh, z], n, [(x + hl) / (2 * hl + 1e-9), i / rows])
    }
    for (let i = 0; i < rows; i++) {
      const a = base + 2 * i
      if (flip) out.quad(a, a + 2, a + 3, a + 1)
      else out.quad(a, a + 1, a + 3, a + 2)
    }
  }
  const off = (y: number) => chevronOffset(y, hh, chevronDeg, wFold, CHEVRON_REACH_LENGTHS * length)
  const fanSlope = hl * fanPerMm
  // Anterior face at -half(y) + d(y), normal (-1, slope, 0); posterior at +half(y) + d(y), normal (1, -slope, 0).
  face((y) => ({ x: -halfAt(y) + off(y).d, slope: off(y).slope - fanSlope }), (s) => normalize([-1, s, 0]), false)
  face((y) => ({ x: halfAt(y) + off(y).d, slope: off(y).slope + fanSlope }), (s) => normalize([1, -s, 0]), true)
  // Medial face at +hw (flat, normal +z) and lateral face at lateralZ(y) (normal (0, slope, -1)).
  for (const medial of [true, false]) {
    const base = out.vertexCount()
    for (let i = 0; i <= rows; i++) {
      const y = -1 + (2 * i) / rows
      const d = off(y).d
      const z = medial ? hw : lateralZ(y)
      const n: Vec3 = medial ? [0, 0, 1] : normalize([0, lateralSlope(y), -1])
      out.vertex([-halfAt(y) + d, y * hh, z], n, [0, i / rows])
      out.vertex([halfAt(y) + d, y * hh, z], n, [1, i / rows])
    }
    for (let i = 0; i < rows; i++) {
      const a = base + 2 * i
      if (medial) out.quad(a, a + 1, a + 3, a + 2)
      else out.quad(a, a + 2, a + 3, a + 1)
    }
  }
  // Caps at +-hh, from the lateral edge to the medial face.
  for (const [y, flip] of [[1, false], [-1, true]] as const) {
    const d = off(y).d
    const h = halfAt(y)
    const zl = lateralZ(y)
    const base = out.vertexCount()
    const n: Vec3 = [0, y, 0]
    out.vertex([-h + d, y * hh, zl], n, [0, 0])
    out.vertex([h + d, y * hh, zl], n, [1, 0])
    out.vertex([h + d, y * hh, hw], n, [1, 1])
    out.vertex([-h + d, y * hh, hw], n, [0, 1])
    if (flip) out.quad(base, base + 1, base + 2, base + 3)
    else out.quad(base, base + 3, base + 2, base + 1)
  }
  return out
}

export const somiteChevronVertexCount = (rows: number): number => 8 * (rows + 1) + 8

export const somiteChevron: PrimitiveBuilder<SomiteChevronParams> = {
  kind: 'somiteChevron',
  localFrame: true,
  vertexCount(lod) { return somiteChevronVertexCount(countsFor('somiteChevron', lod).rows) },
  build(params, frame: BodyFrame, lod): GeometryOut {
    const { rows } = countsFor('somiteChevron', lod)
    const u = params.placement.u
    const f = frame.frameAt(u)
    const height = params.heightMm ?? params.heightFraction * (f.hD + f.hV)
    // Spine curvature toward the dorsal normal at the station, from the tangents one half-percent of u either side.
    const du = 0.005
    const a = frame.frameAt(Math.max(0, u - du))
    const b = frame.frameAt(Math.min(1, u + du))
    const ds = Math.hypot(...sub(b.p, a.p))
    const k1 = ds > 1e-9 ? dot(sub(b.t, a.t), f.n) / ds : 0
    const length = Math.max(0.002, params.lengthMm * (1 - SEGMENT_GAP_FRACTION))
    const w = somiteChevronLocal(length, Math.max(0.004, height), Math.max(0.004, params.widthMm), params.chevronDeg, params.wFoldFraction ?? 0, rows, createWriter(), -k1)
    return finish(w, { placement: placementOf(localAxes(frame, params.placement)) })
  },
}
