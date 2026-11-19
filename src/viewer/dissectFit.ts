// Fit points of the dissected structures (D17). The camera fit uses the body's own points
// (fit.ts), which say nothing about where the dissect slider has moved a structure: at 100
// percent the inventory grid is several body lengths wide and sits entirely off screen. These
// helpers read the offsets the viewer drew last, so the fit frames what is on screen and the
// pan limit reaches the grid.
//
// The box is the union of the world boxes of the displaced builds, not of their bounding
// spheres: a long thin tube such as the notochord has a sphere half the body long, which would
// pull the fit away by a body height in every direction. The fit then takes the eight corners
// of that box. One walk per frame gives the rig the box and the change signal it refits on.
import { applyQuat } from '../core/primitives/vec3.ts'
import type { Vec3 } from '../core/primitives/vec3.ts'
import type { GeometryPlacement } from '../core/primitives/types.ts'
import { dissectLayout } from '../core/dissect.ts'
import type { StructureHandle, ViewerRuntime } from './runtime.ts'

export interface DissectExtent {
  /** Displaced structures with a build; the rig refits when this changes. */
  count: number
  min: Vec3
  max: Vec3
}

/** The eight corners of a local box, placed in the world and moved by the dissect offset. */
export function addBox(min: Vec3, max: Vec3, handle: StructureHandle, placement: GeometryPlacement | null, offset: Vec3): void {
  const b = handle.bounds
  if (!b) return
  for (const x of [b.min[0], b.max[0]]) {
    for (const y of [b.min[1], b.max[1]]) {
      for (const z of [b.min[2], b.max[2]]) {
        let p: Vec3 = [x, y, z]
        if (placement) {
          p = applyQuat(placement.quaternion, [x * placement.scale[0], y * placement.scale[1], z * placement.scale[2]])
          p = [p[0] + placement.position[0], p[1] + placement.position[1], p[2] + placement.position[2]]
        }
        for (const k of [0, 1, 2] as const) {
          const v = p[k] + offset[k]
          if (v < min[k]) min[k] = v
          if (v > max[k]) max[k] = v
        }
      }
    }
  }
}

/** The box the displaced structures fill, in world millimetres, or null when none is drawn. */
export function dissectExtent(rt: ViewerRuntime): DissectExtent | null {
  if (dissectLayout.value <= 0) return null
  const min: Vec3 = [Infinity, Infinity, Infinity]
  const max: Vec3 = [-Infinity, -Infinity, -Infinity]
  let count = 0
  for (const [id, offset] of dissectLayout.offsets) {
    const handle = rt.handles.get(id)
    if (!handle || handle.bounds === null) continue
    count++
    addBox(min, max, handle, handle.placement, offset)
    if (handle.twinPlacement) addBox(min, max, handle, handle.twinPlacement, offset)
  }
  return count === 0 || !Number.isFinite(min[0]) ? null : { count, min, max }
}

/** The eight corners of an extent, for the projected-box fit of fit.ts. */
export function extentCorners(extent: DissectExtent | null): Vec3[] {
  if (!extent) return []
  const { min, max } = extent
  const out: Vec3[] = []
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) out.push([x, y, z])
  return out
}

/**
 * True when two extents frame the same box, so the rig keeps the pose it has. The tolerance is
 * a ten-thousandth of the box, so a rebuild at a new tessellation level does not refit.
 */
export function sameExtent(a: DissectExtent | null, b: DissectExtent | null): boolean {
  if (a === null || b === null) return a === b
  if (a.count !== b.count) return false
  const span = Math.max(a.max[0] - a.min[0], a.max[1] - a.min[1], a.max[2] - a.min[2], 1)
  const tolerance = 1e-4 * span
  for (const k of [0, 1, 2] as const) {
    if (Math.abs(a.min[k] - b.min[k]) > tolerance || Math.abs(a.max[k] - b.max[k]) > tolerance) return false
  }
  return true
}

const ZERO: Vec3 = [0, 0, 0]

export interface HandleBox {
  /** Centre of the world box, in millimetres. */
  centre: Vec3
  widthMm: number
  heightMm: number
  depthMm: number
}

/**
 * The world box of a handle's last build, with no dissect offset: the inventory packer of D17
 * sizes a cell from it, and the offset that moves the structure into that cell is measured from
 * its centre. Null when the handle has no build.
 */
export function handleBox(handle: StructureHandle): HandleBox | null {
  if (handle.bounds === null) return null
  const min: Vec3 = [Infinity, Infinity, Infinity]
  const max: Vec3 = [-Infinity, -Infinity, -Infinity]
  addBox(min, max, handle, handle.placement, ZERO)
  if (handle.twinPlacement) addBox(min, max, handle, handle.twinPlacement, ZERO)
  if (!Number.isFinite(min[0])) return null
  return {
    centre: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
    widthMm: max[0] - min[0],
    heightMm: max[1] - min[1],
    depthMm: max[2] - min[2],
  }
}

/** Largest displacement the viewer drew, in millimetres; 0 when every structure is in the body. */
export function dissectReachMm(): number {
  let reach = 0
  for (const o of dissectLayout.offsets.values()) reach = Math.max(reach, Math.hypot(o[0], o[1], o[2]))
  return reach
}
