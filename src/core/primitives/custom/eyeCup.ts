// Eye cup (BG-36): an outer RPE shell, an inner retina shell and a lens
// sphere, all in the local frame at the placement with the cup opening
// laterally. Parts `rpe`, `retina` and `lens` address the vertex ranges.
// Vertices: 2 shells of 2 (rows + 1)(radial + 1) + 2 (radial + 1) plus a
// lens grid of (rows + 1)(radial + 1); 1173 interactive, 4421 final.
import type { BodyFrame } from '../../bodyModel.ts'
import { createWriter, finish, localAxes, placementOf, type MeshWriter } from '../mesh.ts'
import { shellLocal, shellVertexCount } from '../shell.ts'
import { superellipsoidLocal } from '../superellipsoid.ts'
import { countsFor, gridVertexCount } from '../tessellation.ts'
import { sizeMm, type GeometryOut, type Placement, type PrimitiveBuilder, type Size } from '../types.ts'
import type { Vec3 } from '../vec3.ts'

export interface EyeCupParams {
  placement: Placement
  outerDiameterMm: Size
  depthMm: Size
  stage: 'vesicle' | 'cup' | 'eye'
  /** Choroid fissure width; accepted, not cut in version 1. */
  fissureDeg?: number
  lensDiameterMm: Size
  /** 0 to 0.4 of the lens radius beyond the cup rim. */
  lensProtrusionFraction?: number
  rpeThicknessMm: Size
  retinaThicknessMm: Size
}

export const EYE_PARTS = ['rpe', 'retina', 'lens'] as const

/** Rotate the shell pole (+y) onto the medial axis (-outward) by a proper rotation about x. */
function rotateToAxis(out: MeshWriter, start: number, outward: Vec3): void {
  const o = outward[2]
  for (let i = start; i < out.vertexCount(); i++) {
    for (const arr of [out.positions, out.normals]) {
      const y = arr[3 * i + 1]!
      const z = arr[3 * i + 2]!
      arr[3 * i + 1] = o * z
      arr[3 * i + 2] = -o * y
    }
  }
}

export const eyeCup: PrimitiveBuilder<EyeCupParams> = {
  kind: 'eyeCup',
  localFrame: true,
  vertexCount(lod) { const c = countsFor('eyeCup', lod); return 2 * shellVertexCount(c.rows, c.radial) + gridVertexCount(c) },
  build(params, frame: BodyFrame, lod): GeometryOut {
    const { rows, radial } = countsFor('eyeCup', lod)
    const u = params.placement.u
    const R = Math.max(0.004, sizeMm(params.outerDiameterMm, frame, u) / 2)
    const depth = Math.min(2 * R, Math.max(0.05 * R, sizeMm(params.depthMm, frame, u)))
    const rpe = Math.max(0.002, sizeMm(params.rpeThicknessMm, frame, u))
    const retina = Math.max(0.002, sizeMm(params.retinaThicknessMm, frame, u))
    const lensR = Math.max(0.002, sizeMm(params.lensDiameterMm, frame, u) / 2)
    const polarDeg = params.stage === 'vesicle' ? 179.9 : (Math.acos(Math.max(-1, Math.min(1, 1 - depth / R))) * 180) / Math.PI
    const outwardSign = (params.placement.mirror ? -Math.abs(params.placement.w) : params.placement.w) < 0 ? 1 : -1   // +z local is the left side
    const outward: Vec3 = [0, 0, outwardSign]
    const out = createWriter()
    const parts: NonNullable<GeometryOut['parts']> = {}
    const record = (name: string, start: number, indexStart: number): void => {
      parts[name] = { vertexStart: start, vertexCount: out.vertexCount() - start, indexStart, indexCount: out.indices.length - indexStart }
    }
    let vs = out.vertexCount(), is = out.indices.length
    shellLocal(R - rpe, rpe, polarDeg, 360, rows, radial, out)
    rotateToAxis(out, vs, outward)
    record('rpe', vs, is)
    vs = out.vertexCount(); is = out.indices.length
    shellLocal(R - rpe - retina, retina, polarDeg, 360, rows, radial, out)
    rotateToAxis(out, vs, outward)
    record('retina', vs, is)
    vs = out.vertexCount(); is = out.indices.length
    // Lens on the axis: rim plane at axial coordinate depth - R from the centre.
    const protrusion = params.stage === 'vesicle' ? 0 : Math.min(0.4, Math.max(0, params.lensProtrusionFraction ?? 0))
    const lensScale = params.stage === 'vesicle' ? 0.02 : 1
    const axial = (depth - R) - lensR * lensScale + protrusion * lensR * lensScale
    superellipsoidLocal([lensR * lensScale, lensR * lensScale, lensR * lensScale], 1, 1, rows, radial, out)
    for (let i = vs; i < out.vertexCount(); i++) out.positions[3 * i + 2] = out.positions[3 * i + 2]! + axial * outwardSign
    record('lens', vs, is)
    return finish(out, { placement: placementOf(localAxes(frame, params.placement)), parts })
  },
}
