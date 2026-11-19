// Superellipsoid (BG-29): Barr's form with the pole axis along local x (the
// body's u direction). e1 is the north-south exponent, e2 the east-west
// exponent; e = 1 is an ellipsoid. The normal is Barr's closed form with the
// exponents 2 - e, finite at the poles for e <= 2 (E029).
// Vertices: (rows + 1) x (radial + 1); 221 interactive, 825 final.
import { createWriter, finish, gridIndices, localAxes, placementOf } from './mesh.ts'
import { countsFor, gridVertexCount } from './tessellation.ts'
import { sizeMm, type GeometryOut, type Lod, type Placement, type PrimitiveBuilder, type Size } from './types.ts'
import type { Vec3 } from './vec3.ts'

export interface SuperellipsoidParams {
  placement: Placement
  /** Along u, v, w. */
  radiiMm: [Size, Size, Size]
  e1: number
  e2: number
}

const sp = (x: number, e: number): number => Math.sign(x) * Math.pow(Math.abs(x), e)

/** Local-frame superellipsoid grid; positions relative to the centre. */
export function superellipsoidLocal(radii: Vec3, e1: number, e2: number, rows: number, radial: number, out = createWriter()): typeof out {
  const [a, b, c] = radii
  const base = out.vertexCount()
  for (let i = 0; i <= rows; i++) {
    const eta = -Math.PI / 2 + (Math.PI * i) / rows
    const ce = Math.cos(eta)
    const se = Math.sin(eta)
    for (let j = 0; j <= radial; j++) {
      const om = -Math.PI + (2 * Math.PI * j) / radial
      const co = Math.cos(om)
      const so = Math.sin(om)
      const p: Vec3 = [a * sp(se, e1), b * sp(ce, e1) * sp(co, e2), c * sp(ce, e1) * sp(so, e2)]
      const n: Vec3 = [sp(se, 2 - e1) / a, (sp(ce, 2 - e1) * sp(co, 2 - e2)) / b, (sp(ce, 2 - e1) * sp(so, 2 - e2)) / c]
      out.vertex(p, n, [i / rows, j / radial])
    }
  }
  gridIndices(out, base, rows, radial)
  return out
}

export function superellipsoidCounts(lod: Lod): { rows: number; radial: number } { return countsFor('superellipsoid', lod) }

export const superellipsoid: PrimitiveBuilder<SuperellipsoidParams> = {
  kind: 'superellipsoid',
  localFrame: true,
  vertexCount(lod) { return gridVertexCount(countsFor('superellipsoid', lod)) },
  build(params, frame, lod): GeometryOut {
    const { rows, radial } = countsFor('superellipsoid', lod)
    const u = params.placement.u
    const radii: Vec3 = [sizeMm(params.radiiMm[0], frame, u), sizeMm(params.radiiMm[1], frame, u), sizeMm(params.radiiMm[2], frame, u)]
    const e1 = Math.min(2, Math.max(0.3, params.e1))
    const e2 = Math.min(2, Math.max(0.3, params.e2))
    const w = superellipsoidLocal(radii, e1, e2, rows, radial)
    return finish(w, { placement: placementOf(localAxes(frame, params.placement)) })
  },
}
