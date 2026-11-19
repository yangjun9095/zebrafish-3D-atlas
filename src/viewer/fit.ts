// Camera fit (AR-41 as revised in phase 2): a projected bounding-box fit. The
// body's extreme points (skin stations, tube caps, yolk ball, chorion) are
// projected onto the screen axes of the view direction, and the distance is
// the smallest one at which every point lies inside FIT_FILL_WIDTH of the free
// width and FIT_FILL_HEIGHT of the free height of the viewport (AR-42 reserved
// rectangle). The target is the centre of the projected box, so the fish fills
// about 70 percent of the canvas width in the lateral view at every stage.
//
// The points are the body's, not the drawn scene's: the fins reach past them. At
// 4320 hpf the caudal fin ends 2.4 percent of the canvas short of the right edge
// with FIT_FILL_WIDTH at 0.7, so raising the fill crops the tail. Framing the fish
// larger needs the fins inside the fit points, not a larger fill fraction.
// Pure math with no three import, so a unit test can check the framing.
import type { BodyFrame } from '../core/bodyModel.ts'
import type { Vec3 } from '../core/primitives/vec3.ts'
import { FOV_DEG, screenAxes } from './presets.ts'
import type { FitViewport } from './presets.ts'

export const FIT_FILL_WIDTH = 0.7
export const FIT_FILL_HEIGHT = 0.8

export interface FitPose {
  target: Vec3
  distance: number
  /** Projected half-extents of the points about the target, in mm, along the screen axes. */
  halfWidth: number
  halfHeight: number
}

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** Six axis points of a sphere. */
function spherePoints(centre: Vec3, radiusMm: number): Vec3[] {
  const out: Vec3[] = []
  for (const k of [0, 1, 2] as const) {
    const a: Vec3 = [centre[0], centre[1], centre[2]]
    const b: Vec3 = [centre[0], centre[1], centre[2]]
    a[k] += radiusMm
    b[k] -= radiusMm
    out.push(a, b)
  }
  return out
}

/**
 * The yolk ball and the chorion alone. The dissect slider of D17 fades the skin out by 60
 * percent and leaves these two at a quarter opacity, so above that value they are the only part
 * of the body still on screen and the only part the fit should hold (UI-65).
 */
export function bodyBallFitPoints(frame: BodyFrame): Vec3[] {
  const pts: Vec3[] = []
  if (frame.yolk?.ball) pts.push(...spherePoints(frame.yolk.ball.centre, frame.yolk.ball.radiusMm))
  if (frame.chorion) pts.push(...spherePoints(frame.chorion.centre, frame.chorion.radiusMm))
  return pts
}

/** The points the fit encloses: four skin points per station, the tube cap tips, the yolk ball and the chorion. */
export function bodyFitPoints(frame: BodyFrame): Vec3[] {
  const pts: Vec3[] = []
  for (const s of frame.stations) {
    pts.push(
      [s.p[0] + s.n[0] * s.hD, s.p[1] + s.n[1] * s.hD, s.p[2] + s.n[2] * s.hD],
      [s.p[0] - s.n[0] * s.hV, s.p[1] - s.n[1] * s.hV, s.p[2] - s.n[2] * s.hV],
      [s.p[0] + s.b[0] * s.hW, s.p[1] + s.b[1] * s.hW, s.p[2] + s.b[2] * s.hW],
      [s.p[0] - s.b[0] * s.hW, s.p[1] - s.b[1] * s.hW, s.p[2] - s.b[2] * s.hW],
    )
  }
  // The round caps of the skin tube reach one mean radius past the first and last station (sweep.ts).
  const ends = [frame.stations[0], frame.stations[frame.stations.length - 1]] as const
  ends.forEach((s, i) => {
    if (!s) return
    const reach = ((s.hD + s.hV) / 4 + s.hW / 2) * (i === 0 ? -1 : 1)
    pts.push([s.p[0] + s.t[0] * reach, s.p[1] + s.t[1] * reach, s.p[2] + s.t[2] * reach])
  })
  pts.push(...bodyBallFitPoints(frame))
  return pts
}

/** Tangents of the half angles of the free rectangle (AR-42), horizontal and vertical. */
export function freeHalfTangents(viewport: FitViewport, fovDeg = FOV_DEG): { tanH: number; tanV: number } {
  const { width, height, reserved } = viewport
  const freeW = Math.max(1, width - reserved.left - reserved.right)
  const freeH = Math.max(1, height - reserved.top - reserved.bottom)
  const tanHalfV = Math.tan((fovDeg * Math.PI) / 360)
  return {
    tanV: tanHalfV * (freeH / Math.max(1, height)),
    tanH: tanHalfV * (width / Math.max(1, height)) * (freeW / Math.max(1, width)),
  }
}

/**
 * The pose that frames `points` seen from `direction` (unit vector from the target toward
 * the camera, `camera.up` = +y): the target at the centre of the projected box and the
 * distance at which the box fills the fill fractions of the free rectangle. Perspective is
 * exact: a point nearer the camera than the target needs more distance for the same angle.
 */
export function fitPose(points: readonly Vec3[], direction: Vec3, viewport: FitViewport, fovDeg = FOV_DEG): FitPose {
  const { right, up } = screenAxes(direction)
  const dir = direction
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const p of points) {
    const x = dot(p, right)
    const y = dot(p, up)
    const z = dot(p, dir)
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }
  if (!Number.isFinite(minX)) return { target: [0, 0, 0], distance: 1, halfWidth: 0, halfHeight: 0 }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const cz = (minZ + maxZ) / 2
  const { tanH, tanV } = freeHalfTangents(viewport, fovDeg)
  const kx = Math.max(tanH * FIT_FILL_WIDTH, 1e-4)
  const ky = Math.max(tanV * FIT_FILL_HEIGHT, 1e-4)
  let distance = 1e-3
  for (const p of points) {
    const depth = dot(p, dir) - cz
    distance = Math.max(distance, depth + Math.abs(dot(p, right) - cx) / kx, depth + Math.abs(dot(p, up) - cy) / ky)
  }
  const target: Vec3 = [
    cx * right[0] + cy * up[0] + cz * dir[0],
    cx * right[1] + cy * up[1] + cz * dir[1],
    cx * right[2] + cy * up[2] + cz * dir[2],
  ]
  return { target, distance, halfWidth: (maxX - minX) / 2, halfHeight: (maxY - minY) / 2 }
}
