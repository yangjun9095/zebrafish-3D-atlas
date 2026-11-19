// Shared types of the primitive builders (BG-29, AR-72).
import type { BodyFrame } from '../bodyModel.ts'
import type { Quat, Vec3 } from './vec3.ts'

export type Lod = 'interactive' | 'final'

export interface Bounds {
  min: Vec3
  max: Vec3
  center: Vec3
  /** Radius of the bounding sphere about `center`. */
  radius: number
}

/** World transform of a local-frame build (AR-72). */
export interface GeometryPlacement {
  position: Vec3
  quaternion: Quat
  scale: Vec3
}

/** Typed-array mesh with analytic normals. `positions` is 3 floats per vertex. */
export interface GeometryOut {
  positions: Float32Array
  normals: Float32Array
  uvs: Float32Array
  indices: Uint16Array | Uint32Array
  bounds: Bounds
  /** Set by local-frame kinds; positions are then relative to `bounds.center` of the world build. */
  placement?: GeometryPlacement
  /** Named vertex ranges, for derived parts (heart chambers, eye parts). */
  parts?: Record<string, { vertexStart: number; vertexCount: number; indexStart: number; indexCount: number }>
  /** Set by the sweep kinds: largest half-axis times largest curvature, for rule E036 (BG-31). */
  sweep?: { maxRadiusMm: number; maxCurvature: number; product: number }
}

export interface Placement {
  u: number
  v: number
  w: number
  yawDeg?: number
  pitchDeg?: number
  rollDeg?: number
  mirror?: boolean
}

/** A length in mm, or a fraction of the local body height (BG-07, DM-17). */
export type Size = number | { value: number; unit: 'mm' | 'bodyHeightFraction' }

export interface PrimitiveBuilder<P> {
  readonly kind: string
  /** True for the compact kinds of AR-72: positions relative to bounds.center, with a placement. */
  readonly localFrame: boolean
  build(params: P, frame: BodyFrame, lod: Lod): GeometryOut
  /** Exact vertex count for the budget check and AR-73. */
  vertexCount(lod: Lod, params: P): number
}

/** Resolve a Size to millimetres at the body station `u` (BG-07). */
export function sizeMm(size: Size, frame: BodyFrame, u: number): number {
  if (typeof size === 'number') return size
  if (size.unit === 'mm') return size.value
  const f = frame.frameAt(u)
  return size.value * (f.hD + f.hV)
}
