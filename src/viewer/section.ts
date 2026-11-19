// Section plane math (AR-43, UX-IN-18): moves the runtime plane to the store's
// section state at the current body size; parked at 1e6 mm when off.
import { Vector3 } from 'three'
import type { SectionState } from '../state/store.ts'
import { bodyBoundingSphere } from './presets.ts'
import { PARKED_PLANE_CONSTANT, frameAt } from './runtime.ts'
import type { ViewerRuntime } from './runtime.ts'

const AXIS_DIR: Record<NonNullable<SectionState['axis']>, [number, number, number]> = {
  sagittal: [0, 0, 1],
  frontal: [0, 1, 0],
  transverse: [1, 0, 0],
}

const normal = new Vector3()

/**
 * `position` in [-1, 1] runs across the body bounding sphere on the plane's axis
 * (+1 left, dorsal or posterior). The default keeps the part below the position;
 * `flip` keeps the part above it.
 */
export function updateSectionPlane(rt: ViewerRuntime, section: SectionState, t: number): void {
  const frame = frameAt(rt, t)
  if (!section.axis || !frame) {
    rt.plane.set(normal.set(0, 0, 1), PARKED_PLANE_CONSTANT)
    return
  }
  const dir = AXIS_DIR[section.axis]
  const sphere = bodyBoundingSphere(frame)
  const axisIndex = dir.indexOf(1)
  const c = sphere.center[axisIndex]! + section.position * sphere.radius
  if (section.flip) rt.plane.set(normal.set(dir[0], dir[1], dir[2]), -c)
  else rt.plane.set(normal.set(-dir[0], -dir[1], -dir[2]), c)
}
