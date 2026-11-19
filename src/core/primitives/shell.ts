// Shell (BG-29): a spherical cap of inner radius R and thickness t, covering
// the polar angle `polarDeg` from the pole. Two surfaces plus a rim; normals
// are radial (+r outside, -r inside) and the rim normal points away from the
// covered cap. Vertices: 2 (rows + 1)(radial + 1) + 2 (radial + 1);
// 700 interactive, 2548 final.
import type { BodyFrame } from '../bodyModel.ts'
import { createWriter, finish, gridIndices, localAxes, placementOf, type MeshWriter } from './mesh.ts'
import { countsFor } from './tessellation.ts'
import { degToRad, type Vec3 } from './vec3.ts'
import type { GeometryOut, Placement, PrimitiveBuilder } from './types.ts'

export interface ShellParams {
  centre: Placement
  innerRadiusMm: number
  thicknessMm: number
  /** Coverage from the pole, 0 to 180. */
  polarDeg: number
  azimuthDeg?: number
  /** Pole direction: world +y (the animal pole of the egg) or the body normal at the centre. */
  pole?: 'worldUp' | 'bodyN'
}

const dir = (theta: number, phi: number): Vec3 => [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)]

/** Local-frame shell about the origin with the pole along local +y. */
export function shellLocal(innerR: number, thickness: number, polarDeg: number, azimuthDeg: number, rows: number, radial: number, out: MeshWriter = createWriter()): MeshWriter {
  const theta1 = degToRad(Math.min(180, Math.max(0.01, polarDeg)))
  const phi1 = degToRad(azimuthDeg)
  const outerR = innerR + thickness
  const surface = (radius: number, flip: boolean): void => {
    const base = out.vertexCount()
    for (let i = 0; i <= rows; i++) {
      const theta = (theta1 * i) / rows
      for (let j = 0; j <= radial; j++) {
        const phi = (phi1 * j) / radial
        const d = dir(theta, phi)
        out.vertex([d[0] * radius, d[1] * radius, d[2] * radius], flip ? [-d[0], -d[1], -d[2]] : d, [i / rows, j / radial])
      }
    }
    gridIndices(out, base, rows, radial, flip)
  }
  surface(outerR, false)
  surface(innerR, true)
  // Rim at theta1: outer ring then inner ring, normal along +theta.
  const rimBase = out.vertexCount()
  for (const radius of [outerR, innerR]) {
    for (let j = 0; j <= radial; j++) {
      const phi = (phi1 * j) / radial
      const d = dir(theta1, phi)
      const n: Vec3 = [Math.cos(theta1) * Math.cos(phi), -Math.sin(theta1), Math.cos(theta1) * Math.sin(phi)]
      out.vertex([d[0] * radius, d[1] * radius, d[2] * radius], n, [1, j / radial])
    }
  }
  gridIndices(out, rimBase, 1, radial, false)
  return out
}

export function shellVertexCount(rows: number, radial: number): number { return 2 * (rows + 1) * (radial + 1) + 2 * (radial + 1) }

export const shell: PrimitiveBuilder<ShellParams> = {
  kind: 'shell',
  localFrame: true,
  vertexCount(lod) { const c = countsFor('shell', lod); return shellVertexCount(c.rows, c.radial) },
  build(params, frame: BodyFrame, lod): GeometryOut {
    const { rows, radial } = countsFor('shell', lod)
    const w = shellLocal(params.innerRadiusMm, params.thicknessMm, params.polarDeg, params.azimuthDeg ?? 360, rows, radial)
    const axes = localAxes(frame, params.centre)
    if ((params.pole ?? 'worldUp') === 'worldUp') {
      // Pole along world +y: local y = up, local x = world +x made orthogonal, z = x cross y.
      const up: Vec3 = [0, 1, 0]
      const x: Vec3 = [1, 0, 0]
      return finish(w, { placement: placementOf({ origin: axes.origin, x, y: up, z: [0, 0, 1] }) })
    }
    return finish(w, { placement: placementOf(axes) })
  },
}
