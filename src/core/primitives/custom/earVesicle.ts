// Ear vesicle (BG-37): a hollow ellipsoid (outer and inner surfaces), an
// otolith sphere per listed pole, and three orthogonal semicircular canal
// tori on the dorsal vestibule when present. Local frame. Parts: `outer`,
// `inner`, `otolith_anterior`, `otolith_posterior`, `otoliths` (both) and
// `canals`, for derived records (the otolith and semicircular canal records).
// Vertices: 2 ellipsoid grids + one grid per otolith of (rows + 1)(radial + 1),
// plus 3 tori of (rows + 1)(radial / 2 + 1) when canals are present;
// 884 interactive with two otoliths and no canals (1235 with), 3300 / 4611 final.
import type { BodyFrame } from '../../bodyModel.ts'
import { createWriter, finish, gridIndices, localAxes, placementOf, type MeshWriter } from '../mesh.ts'
import { superellipsoidLocal } from '../superellipsoid.ts'
import { countsFor, gridVertexCount } from '../tessellation.ts'
import { sizeMm, type GeometryOut, type Placement, type PrimitiveBuilder, type Size } from '../types.ts'
import type { Vec3 } from '../vec3.ts'

export type OtolithPole = 'anterior' | 'posterior'

export interface EarVesicleParams {
  placement: Placement
  lengthMm: Size
  widthMm: Size
  heightMm: Size
  wallMm: Size
  /** One entry per otolith; an empty array draws none (the otolith record draws them). */
  otoliths: { diameterMm: Size; pole: OtolithPole }[]
  /** 0 to 1; the projections grow from 45 to 72 hpf. */
  pillarLengthFraction?: number
  canals?: { loopDiameterMm: Size; tubeDiameterMm: Size; present: boolean }
}

export const EAR_PARTS = ['outer', 'inner', 'otolith_anterior', 'otolith_posterior', 'otoliths', 'canals'] as const

/** Torus about `axis` (0 x, 1 y, 2 z) centred at c, major radius R, minor r. */
function torus(out: MeshWriter, c: Vec3, axis: 0 | 1 | 2, R: number, r: number, rows: number, radial: number): void {
  const base = out.vertexCount()
  const i1 = (axis + 1) % 3, i2 = (axis + 2) % 3
  for (let i = 0; i <= rows; i++) {
    const a = (2 * Math.PI * i) / rows
    const ring: Vec3 = [0, 0, 0]
    ring[i1] = Math.cos(a)
    ring[i2] = Math.sin(a)
    for (let j = 0; j <= radial; j++) {
      const b = (2 * Math.PI * j) / radial
      const n: Vec3 = [0, 0, 0]
      n[i1] = Math.cos(a) * Math.cos(b)
      n[i2] = Math.sin(a) * Math.cos(b)
      n[axis] = Math.sin(b)
      out.vertex([c[0] + ring[0] * R + n[0] * r, c[1] + ring[1] * R + n[1] * r, c[2] + ring[2] * R + n[2] * r], n, [i / rows, j / radial])
    }
  }
  gridIndices(out, base, rows, radial, true)
}

/** Vertex count of the canal tori for a count table. */
function canalVertexCount(rows: number, radial: number): number {
  return 3 * (rows + 1) * (Math.ceil(radial / 2) + 1)
}

export const earVesicle: PrimitiveBuilder<EarVesicleParams> = {
  kind: 'earVesicle',
  localFrame: true,
  vertexCount(lod, params) {
    const c = countsFor('earVesicle', lod)
    const grid = gridVertexCount(c)
    const canals = params.canals?.present ? canalVertexCount(c.rows, c.radial) : 0
    return (2 + params.otoliths.length) * grid + canals
  },
  build(params, frame: BodyFrame, lod): GeometryOut {
    const { rows, radial } = countsFor('earVesicle', lod)
    const u = params.placement.u
    const L = Math.max(0.006, sizeMm(params.lengthMm, frame, u))
    const W = Math.max(0.006, sizeMm(params.widthMm, frame, u))
    const H = Math.max(0.006, sizeMm(params.heightMm, frame, u))
    const wall = Math.max(0.001, Math.min(sizeMm(params.wallMm, frame, u), Math.min(L, W, H) / 2 - 0.002))
    const out = createWriter()
    const parts: NonNullable<GeometryOut['parts']> = {}
    const record = (name: string, vs: number, is: number): void => {
      parts[name] = { vertexStart: vs, vertexCount: out.vertexCount() - vs, indexStart: is, indexCount: out.indices.length - is }
    }
    let vs = out.vertexCount(), is = out.indices.length
    superellipsoidLocal([L / 2, H / 2, W / 2], 1, 1, rows, radial, out)
    record('outer', vs, is)
    vs = out.vertexCount(); is = out.indices.length
    superellipsoidLocal([L / 2 - wall, H / 2 - wall, W / 2 - wall], 1, 1, rows, radial, out)
    for (let i = vs; i < out.vertexCount(); i++) for (let k = 0; k < 3; k++) out.normals[3 * i + k] = -out.normals[3 * i + k]!
    for (let t = is; t < out.indices.length; t += 3) { const tmp = out.indices[t + 1]!; out.indices[t + 1] = out.indices[t + 2]!; out.indices[t + 2] = tmp }
    record('inner', vs, is)
    // Otoliths on the floor of the lumen, one per listed pole.
    const otolithStart = out.vertexCount(), otolithIndexStart = out.indices.length
    for (const spec of params.otoliths) {
      const r = Math.max(0.002, sizeMm(spec.diameterMm, frame, u) / 2)
      const x = (spec.pole === 'anterior' ? -1 : 1) * Math.max(0, L / 2 - wall - r)
      const y = -Math.max(0, H / 2 - wall - r) * 0.6
      vs = out.vertexCount(); is = out.indices.length
      superellipsoidLocal([r, r, r], 1, 1, rows, radial, out)
      for (let i = vs; i < out.vertexCount(); i++) { out.positions[3 * i] = out.positions[3 * i]! + x; out.positions[3 * i + 1] = out.positions[3 * i + 1]! + y }
      record(`otolith_${spec.pole}`, vs, is)
    }
    record('otoliths', otolithStart, otolithIndexStart)
    if (params.canals?.present) {
      const R = Math.max(0.004, sizeMm(params.canals.loopDiameterMm, frame, u) / 2)
      const r = Math.max(0.002, sizeMm(params.canals.tubeDiameterMm, frame, u) / 2)
      const c: Vec3 = [0, H / 2 - R * 0.3, 0]
      vs = out.vertexCount(); is = out.indices.length
      const half = Math.ceil(radial / 2)
      torus(out, [c[0] - R * 0.5, c[1], c[2]], 2, R, r, rows, half)       // anterior canal, sagittal plane
      torus(out, [c[0] + R * 0.5, c[1], c[2]], 0, R, r, rows, half)       // posterior canal, transverse plane
      torus(out, [c[0], c[1] - R * 0.5, c[2]], 1, R, r, rows, half)       // lateral canal, horizontal plane
      record('canals', vs, is)
    }
    return finish(out, { placement: placementOf(localAxes(frame, params.placement)), parts })
  },
}
