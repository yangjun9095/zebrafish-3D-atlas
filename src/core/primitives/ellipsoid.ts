// Ellipsoid (BG-29): the superellipsoid at e1 = e2 = 1, so the normal is
// normalize(x / a^2, y / b^2, z / c^2) in the local frame.
// Vertices: (rows + 1) x (radial + 1); 221 interactive, 825 final.
import { createWriter, finish, localAxes, placementOf } from './mesh.ts'
import { superellipsoidLocal } from './superellipsoid.ts'
import { countsFor, gridVertexCount } from './tessellation.ts'
import { sizeMm, type GeometryOut, type Placement, type PrimitiveBuilder, type Size } from './types.ts'
import type { Vec3 } from './vec3.ts'

export interface EllipsoidParams {
  placement: Placement
  /** Along u, v, w. */
  radiiMm: [Size, Size, Size]
}

export const ellipsoid: PrimitiveBuilder<EllipsoidParams> = {
  kind: 'ellipsoid',
  localFrame: true,
  vertexCount(lod) { return gridVertexCount(countsFor('ellipsoid', lod)) },
  build(params, frame, lod): GeometryOut {
    const { rows, radial } = countsFor('ellipsoid', lod)
    const u = params.placement.u
    const radii: Vec3 = [sizeMm(params.radiiMm[0], frame, u), sizeMm(params.radiiMm[1], frame, u), sizeMm(params.radiiMm[2], frame, u)]
    const w = superellipsoidLocal(radii, 1, 1, rows, radial, createWriter())
    return finish(w, { placement: placementOf(localAxes(frame, params.placement)) })
  },
}
