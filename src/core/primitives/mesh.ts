// Mesh assembly helpers: a growable vertex writer, grid index generation,
// bounds, and the local-frame placement of AR-72.
import type { BodyFrame } from '../bodyModel.ts'
import type { Bounds, GeometryOut, GeometryPlacement, Placement } from './types.ts'
import { cross, normalize, quatFromAxes, rotateAxes, scale, type Vec3 } from './vec3.ts'

export interface MeshWriter {
  positions: number[]
  normals: number[]
  uvs: number[]
  indices: number[]
  /** Append one vertex; returns its index. */
  vertex(p: Vec3, n: Vec3, uv: [number, number]): number
  /** Append one triangle with the given winding. */
  tri(a: number, b: number, c: number): void
  quad(a: number, b: number, c: number, d: number): void
  vertexCount(): number
}

export function createWriter(): MeshWriter {
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  return {
    positions, normals, uvs, indices,
    vertex(p, n, uv) {
      const nn = normalize(n, [0, 1, 0])
      positions.push(p[0], p[1], p[2])
      normals.push(nn[0], nn[1], nn[2])
      uvs.push(uv[0], uv[1])
      return positions.length / 3 - 1
    },
    tri(a, b, c) { indices.push(a, b, c) },
    quad(a, b, c, d) { indices.push(a, b, d, b, c, d) },
    vertexCount() { return positions.length / 3 },
  }
}

/**
 * Index a (rows + 1) x (cols + 1) grid whose vertices were written row by
 * row starting at `base`. Front faces are counter-clockwise when the row
 * direction crossed with the column direction points along the normal.
 */
export function gridIndices(w: MeshWriter, base: number, rows: number, cols: number, flip = false): void {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = base + i * (cols + 1) + j
      const b = a + 1
      const c = a + cols + 2
      const d = a + cols + 1
      if (flip) w.quad(a, d, c, b)
      else w.quad(a, b, c, d)
    }
  }
}

export function boundsOf(positions: ArrayLike<number>): Bounds {
  const min: Vec3 = [Infinity, Infinity, Infinity]
  const max: Vec3 = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = positions[i + k]!
      if (v < min[k]!) min[k] = v
      if (v > max[k]!) max[k] = v
    }
  }
  if (!Number.isFinite(min[0])) return { min: [0, 0, 0], max: [0, 0, 0], center: [0, 0, 0], radius: 0 }
  const center: Vec3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  let r2 = 0
  for (let i = 0; i < positions.length; i += 3) {
    const dx = positions[i]! - center[0], dy = positions[i + 1]! - center[1], dz = positions[i + 2]! - center[2]
    r2 = Math.max(r2, dx * dx + dy * dy + dz * dz)
  }
  return { min, max, center, radius: Math.sqrt(r2) }
}

/** Reverse the winding of every triangle (mirrored copies, BG-29). */
export function reverseWinding(indices: Uint16Array | Uint32Array): void {
  for (let i = 0; i < indices.length; i += 3) {
    const t = indices[i + 1]!
    indices[i + 1] = indices[i + 2]!
    indices[i + 2] = t
  }
}

/** Finish a writer into typed arrays with bounds. */
export function finish(w: MeshWriter, extra?: Partial<Pick<GeometryOut, 'placement' | 'parts' | 'sweep'>>): GeometryOut {
  const positions = new Float32Array(w.positions)
  const indices = w.vertexCount() > 65535 ? new Uint32Array(w.indices) : new Uint16Array(w.indices)
  const out: GeometryOut = {
    positions,
    normals: new Float32Array(w.normals),
    uvs: new Float32Array(w.uvs),
    indices,
    bounds: boundsOf(positions),
  }
  if (extra?.placement) out.placement = extra.placement
  if (extra?.parts) out.parts = extra.parts
  if (extra?.sweep) out.sweep = extra.sweep
  return out
}

/** Right-handed local axes at a placement: x along T, y along N, z = x cross y (the left side). */
export function localAxes(frame: BodyFrame, placement: Placement): { origin: Vec3; x: Vec3; y: Vec3; z: Vec3 } {
  const f = frame.frameAt(placement.u)
  const w = placement.mirror ? -Math.abs(placement.w) : placement.w
  const origin = frame.toWorld(placement.u, placement.v, w)
  const [x, y, z] = rotateAxes(f.t, f.n, cross(f.t, f.n), placement.yawDeg, placement.pitchDeg, placement.rollDeg)
  return { origin, x, y, z }
}

/** Local point to world. */
export function toWorldLocal(axes: { origin: Vec3; x: Vec3; y: Vec3; z: Vec3 }, p: Vec3): Vec3 {
  return [
    axes.origin[0] + axes.x[0] * p[0] + axes.y[0] * p[1] + axes.z[0] * p[2],
    axes.origin[1] + axes.x[1] * p[0] + axes.y[1] * p[1] + axes.z[1] * p[2],
    axes.origin[2] + axes.x[2] * p[0] + axes.y[2] * p[1] + axes.z[2] * p[2],
  ]
}

/** Local direction to world (no translation). */
export function dirLocal(axes: { x: Vec3; y: Vec3; z: Vec3 }, d: Vec3): Vec3 {
  return normalize([
    axes.x[0] * d[0] + axes.y[0] * d[1] + axes.z[0] * d[2],
    axes.x[1] * d[0] + axes.y[1] * d[1] + axes.z[1] * d[2],
    axes.x[2] * d[0] + axes.y[2] * d[1] + axes.z[2] * d[2],
  ])
}

export function placementOf(axes: { origin: Vec3; x: Vec3; y: Vec3; z: Vec3 }, uniformScale = 1): GeometryPlacement {
  return { position: scale(axes.origin, 1), quaternion: quatFromAxes(axes.x, axes.y, axes.z), scale: [uniformScale, uniformScale, uniformScale] }
}
