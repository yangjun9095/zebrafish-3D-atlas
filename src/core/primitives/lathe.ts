// Lathe (BG-29): a 2D centripetal Catmull-Rom profile [r, y] revolved about
// the local y axis. The normal is (cos phi dy, -dr, sin phi dy) from the
// profile derivative, so the profile runs from its lowest y upward.
// Vertices: (rows + 1) x (radial + 1); 221 interactive, 825 final.
import { catmullRomSegments } from '../spine.ts'
import { createWriter, finish, gridIndices, localAxes, placementOf, type MeshWriter } from './mesh.ts'
import { countsFor, gridVertexCount } from './tessellation.ts'
import { degToRad } from './vec3.ts'
import type { GeometryOut, Placement, PrimitiveBuilder } from './types.ts'
import type { Vec3 } from './vec3.ts'

export interface LatheParams {
  placement: Placement
  /** [radius, height along local y] in mm, 6 to 10 points, lowest y first. */
  profileMm: [number, number][]
  phiLengthDeg?: number
}

/** Sample the profile curve and its derivative at `rows + 1` parameters. */
export function sampleProfile(profile: [number, number][], rows: number): { r: number[]; y: number[]; dr: number[]; dy: number[] } {
  const pts: Vec3[] = profile.map(([r, y]) => [r, y, 0])
  const segs = catmullRomSegments(pts)
  const r: number[] = [], y: number[] = [], dr: number[] = [], dy: number[] = []
  for (let i = 0; i <= rows; i++) {
    const t = (i / rows) * segs.length
    const s = Math.min(segs.length - 1, Math.floor(t))
    const l = t - s
    const c = segs[s]!
    r.push(Math.max(0, c.c0[0] + l * (c.c1[0] + l * (c.c2[0] + l * c.c3[0]))))
    y.push(c.c0[1] + l * (c.c1[1] + l * (c.c2[1] + l * c.c3[1])))
    dr.push(c.c1[0] + l * (2 * c.c2[0] + 3 * l * c.c3[0]))
    dy.push(c.c1[1] + l * (2 * c.c2[1] + 3 * l * c.c3[1]))
  }
  return { r, y, dr, dy }
}

/** Local-frame lathe surface; the axis is local y. */
export function latheLocal(profile: [number, number][], rows: number, radial: number, phiLengthDeg: number, out: MeshWriter = createWriter()): MeshWriter {
  const { r, y, dr, dy } = sampleProfile(profile, rows)
  const phi1 = degToRad(phiLengthDeg)
  const base = out.vertexCount()
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= radial; j++) {
      const phi = (phi1 * j) / radial
      const cp = Math.cos(phi)
      const spn = Math.sin(phi)
      const ri = Math.max(0, r[i]!)
      out.vertex([ri * cp, y[i]!, ri * spn], [cp * dy[i]!, -dr[i]!, spn * dy[i]!], [i / rows, j / radial])
    }
  }
  gridIndices(out, base, rows, radial, true)
  return out
}

export const lathe: PrimitiveBuilder<LatheParams> = {
  kind: 'lathe',
  localFrame: true,
  vertexCount(lod) { return gridVertexCount(countsFor('lathe', lod)) },
  build(params, frame, lod): GeometryOut {
    const { rows, radial } = countsFor('lathe', lod)
    const w = latheLocal(params.profileMm, rows, radial, params.phiLengthDeg ?? 360)
    return finish(w, { placement: placementOf(localAxes(frame, params.placement)) })
  },
}
