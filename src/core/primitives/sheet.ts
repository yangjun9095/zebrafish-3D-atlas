// Sheet (BG-29): a ruled surface with thickness, two faces plus a rim.
// `buildRuledSheet` is shared with finSheet. Face normals are the cross
// product of the surface partials (central differences of the parametric
// map); the rim normal lies in the sheet plane and points away from it.
// Vertices: 2 (rows + 1)(cols + 1) + 4 (rows + cols); 254 interactive, 578 final.
import type { BodyFrame } from '../bodyModel.ts'
import { createWriter, finish, gridIndices, type MeshWriter } from './mesh.ts'
import { countsFor } from './tessellation.ts'
import { cross, degToRad, dot, lerp, madd, normalize, sub, type Vec3 } from './vec3.ts'
import type { GeometryOut, PrimitiveBuilder } from './types.ts'

export interface SheetParams {
  base: { uStart: number; uEnd: number; side: 'dorsal' | 'ventral' | 'lateral'; w: number }
  /** Closed 2D outline as [chord, span] in mm; chord along the base, span outward. */
  outlineMm: [number, number][]
  thicknessBaseMm: number
  thicknessEdgeMm: number
  /** Swing of the span direction toward posterior, degrees. */
  rakeDeg?: number
}

export const EDGE_FLOOR = 0.004

/** Mid-surface map of a sheet over chord fraction c and span fraction f, both in [0, 1]. */
export interface RuledSurface {
  at(c: number, f: number): Vec3
  /** Unit thickness direction at (c, f). */
  thicknessDir(c: number, f: number): Vec3
  thickness(c: number, f: number): number
}

export const sheetVertexCount = (rows: number, cols: number): number => 2 * (rows + 1) * (cols + 1) + 4 * (rows + cols)

/** Two offset faces and a rim strip. Rows run along the chord, columns along the span. */
export function buildRuledSheet(surface: RuledSurface, rows: number, cols: number, out: MeshWriter = createWriter()): MeshWriter {
  const h = 1e-4
  const partials = (c: number, f: number): { p: Vec3; dc: Vec3; df: Vec3 } => {
    const c0 = Math.max(0, c - h), c1 = Math.min(1, c + h)
    const f0 = Math.max(0, f - h), f1 = Math.min(1, f + h)
    return { p: surface.at(c, f), dc: sub(surface.at(c1, f), surface.at(c0, f)), df: sub(surface.at(c, f1), surface.at(c, f0)) }
  }
  // One orientation sign per sheet: a smooth ruled surface does not flip.
  const centre = partials(0.5, 0.5)
  const orient = dot(cross(centre.dc, centre.df), surface.thicknessDir(0.5, 0.5)) >= 0 ? 1 : -1
  const faceNormal = (c: number, f: number, td: Vec3): Vec3 => {
    const { dc, df } = partials(c, f)
    const raw = cross(dc, df)
    return normalize([raw[0] * orient, raw[1] * orient, raw[2] * orient], td)
  }
  const point = (c: number, f: number, side: 1 | -1): Vec3 => {
    const td = surface.thicknessDir(c, f)
    return madd(surface.at(c, f), td, (side * surface.thickness(c, f)) / 2)
  }
  for (const side of [1, -1] as const) {
    const base = out.vertexCount()
    for (let i = 0; i <= rows; i++) {
      const c = i / rows
      for (let j = 0; j <= cols; j++) {
        const f = j / cols
        const td = surface.thicknessDir(c, f)
        const n = faceNormal(c, f, td)
        out.vertex(point(c, f, side), side > 0 ? n : [-n[0], -n[1], -n[2]], [c, f])
      }
    }
    // Default winding gives the normal df x dc = -orient * (dc x df); flip when that opposes the face normal.
    gridIndices(out, base, rows, cols, (side > 0) === (orient > 0))
  }
  // Rim: the grid perimeter, each vertex once, on both faces. The outward
  // direction of a perimeter segment comes from the grid edge it lies on;
  // a corner vertex takes the mean of its two segments.
  const perimeter: [number, number][] = []
  for (let j = 0; j < cols; j++) perimeter.push([0, j])
  for (let i = 0; i < rows; i++) perimeter.push([i, cols])
  for (let j = cols; j > 0; j--) perimeter.push([rows, j])
  for (let i = rows; i > 0; i--) perimeter.push([i, 0])
  const m = perimeter.length
  const segmentNormal = (k: number): Vec3 => {
    const [i, j] = perimeter[k]!
    const [i2, j2] = perimeter[(k + 1) % m]!
    const c = (i + i2) / (2 * rows), f = (j + j2) / (2 * cols)
    const { dc, df } = partials(c, f)
    const td = surface.thicknessDir(c, f)
    let outward: Vec3
    if (k < cols) outward = [-dc[0], -dc[1], -dc[2]]
    else if (k < cols + rows) outward = df
    else if (k < 2 * cols + rows) outward = dc
    else outward = [-df[0], -df[1], -df[2]]
    const along = dot(outward, td)
    return normalize([outward[0] - td[0] * along, outward[1] - td[1] * along, outward[2] - td[2] * along], td)
  }
  const segNormals: Vec3[] = []
  for (let k = 0; k < m; k++) segNormals.push(segmentNormal(k))
  const rimBase = out.vertexCount()
  for (let k = 0; k < m; k++) {
    const [i, j] = perimeter[k]!
    const c = i / rows, f = j / cols
    const prev = segNormals[(k + m - 1) % m]!
    const cur = segNormals[k]!
    const n = normalize([prev[0] + cur[0], prev[1] + cur[1], prev[2] + cur[2]], cur)
    out.vertex(point(c, f, 1), n, [c, 1])
    out.vertex(point(c, f, -1), n, [c, 0])
  }
  for (let k = 0; k < m; k++) {
    const a = rimBase + 2 * k, b = rimBase + 2 * ((k + 1) % m)
    // a: face A at k, a + 1: face B at k, b: face A at k + 1, b + 1: face B at k + 1.
    const pa = [out.positions[3 * a]!, out.positions[3 * a + 1]!, out.positions[3 * a + 2]!] as Vec3
    const pb = [out.positions[3 * b]!, out.positions[3 * b + 1]!, out.positions[3 * b + 2]!] as Vec3
    const pa1 = [out.positions[3 * (a + 1)]!, out.positions[3 * (a + 1) + 1]!, out.positions[3 * (a + 1) + 2]!] as Vec3
    const tri = cross(sub(pb, pa), sub(pa1, pa))
    if (dot(tri, segNormals[k]!) >= 0) out.quad(a, b, b + 1, a + 1)
    else out.quad(a, a + 1, b + 1, b)
  }
  return out
}

/** Span extent of a closed outline at a chord value, by scanline intersection. */
export function outlineExtent(outline: [number, number][], chord: number): number {
  let best = 0
  const n = outline.length
  for (let i = 0; i < n; i++) {
    const [c0, s0] = outline[i]!
    const [c1, s1] = outline[(i + 1) % n]!
    if ((chord >= Math.min(c0, c1) && chord <= Math.max(c0, c1)) && c0 !== c1) {
      const s = s0 + ((chord - c0) / (c1 - c0)) * (s1 - s0)
      best = Math.max(best, s)
    } else if (c0 === c1 && Math.abs(chord - c0) < 1e-12) best = Math.max(best, s0, s1)
  }
  return Math.max(EDGE_FLOOR, best)
}

/** The body-attached surface of a `sheet` record. */
export function sheetSurface(params: SheetParams, frame: BodyFrame): RuledSurface {
  const chords = params.outlineMm.map((p) => p[0])
  const cMin = Math.min(...chords)
  const cMax = Math.max(...chords)
  const rake = degToRad(params.rakeDeg ?? 0)
  const { uStart, uEnd, side, w } = params.base
  const baseFrame = (c: number) => {
    const u = lerp(uStart, uEnd, c)
    const f = frame.frameAt(u)
    const v = side === 'dorsal' ? 1 : side === 'ventral' ? -1 : 0
    const ww = side === 'lateral' ? (w === 0 ? 1 : w) : w
    const p = frame.toWorld(u, v, ww)
    let d: Vec3 = side === 'dorsal' ? f.n : side === 'ventral' ? [-f.n[0], -f.n[1], -f.n[2]] : ww > 0 ? f.b : [-f.b[0], -f.b[1], -f.b[2]]
    d = normalize(madd([d[0] * Math.cos(rake), d[1] * Math.cos(rake), d[2] * Math.cos(rake)], f.t, Math.sin(rake)), d)
    const td: Vec3 = side === 'lateral' ? f.n : f.b
    return { p, d, td, extent: outlineExtent(params.outlineMm, lerp(cMin, cMax, c)) }
  }
  return {
    at(c, f) { const b = baseFrame(c); return madd(b.p, b.d, f * b.extent) },
    thicknessDir(c) { return baseFrame(c).td },
    thickness(_c, f) { return Math.max(EDGE_FLOOR, lerp(params.thicknessBaseMm, params.thicknessEdgeMm, f)) },
  }
}

export const sheet: PrimitiveBuilder<SheetParams> = {
  kind: 'sheet',
  localFrame: false,
  vertexCount(lod) { const c = countsFor('sheet', lod); return sheetVertexCount(c.rows, c.radial) },
  build(params, frame, lod): GeometryOut {
    const { rows, radial } = countsFor('sheet', lod)
    return finish(buildRuledSheet(sheetSurface(params, frame), rows, radial))
  },
}
