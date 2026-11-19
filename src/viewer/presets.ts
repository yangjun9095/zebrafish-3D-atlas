// Camera presets and fit (D4, AR-38 to AR-42, UX-IN-14): pure math with no
// three import, so a unit test can check the axes. World axes: +x posterior,
// +y dorsal, +z the left side of the fish. `camera.up` is +y for every preset.
import type { BodyFrame } from '../core/bodyModel.ts'
import type { Vec3 } from '../core/primitives/vec3.ts'

export type PresetName = 'lateral' | 'dorsal' | 'ventral' | 'anterior' | 'posterior' | 'threeQuarter'

/**
 * Vertical field of view. AR-38 wrote 34 degrees; at the AR-41 fit distance that
 * perspective doubled the contralateral otic vesicle and eye rim (parallax 0.6 of the
 * organ diameter at 24 hpf). 18 degrees keeps the pair aligned (phase 1 review R6).
 */
export const FOV_DEG = 18
export const FIT_MARGIN = 1.1
export const PRESET_TWEEN_MS = 500
/** Follow-growth filter time constant (UX-IN-12). */
export const FOLLOW_TAU_S = 0.2
/** Polar offset of the two polar presets, so the roll of lookAt stays defined (AR-40). */
export const POLE_EPSILON = 0.001

const unit = (v: Vec3): Vec3 => {
  const n = Math.hypot(v[0], v[1], v[2])
  return [v[0] / n, v[1] / n, v[2] / n]
}

/**
 * Camera direction from the target for each preset. The dorsal and ventral
 * presets tilt toward +z, the lateral direction, because with up = +y the
 * screen-right vector is up x direction = (dz, 0, -dx): a tilt toward +z puts
 * +x (posterior) on the screen right and the snout on the left. The spec table
 * writes azimuth pi / 2 (a tilt toward +x), which puts the snout at the top;
 * AR-40 lets CameraRig derive the value from the D4 axes, which is done here.
 */
export const PRESET_DIRECTIONS: Record<PresetName, Vec3> = {
  lateral: [0, 0, 1],
  dorsal: unit([0, 1, POLE_EPSILON]),
  ventral: unit([0, -1, POLE_EPSILON]),
  anterior: [-1, 0, 0],
  posterior: [1, 0, 0],
  threeQuarter: unit([-0.45, 0.35, 0.82]),
}

/** Spherical angles of AR-40: polar from +y, azimuth from +z toward +x. */
export function presetSpherical(preset: PresetName): { polar: number; azimuth: number } {
  const d = PRESET_DIRECTIONS[preset]
  return { polar: Math.acos(Math.min(1, Math.max(-1, d[1]))), azimuth: Math.atan2(d[0], d[2]) }
}

/** Screen-right and screen-up unit vectors of a camera at `direction` from its target with up = +y. */
export function screenAxes(direction: Vec3): { right: Vec3; up: Vec3 } {
  const z = unit(direction)
  const right = unit([z[2], 0, -z[0]])
  const up: Vec3 = [z[1] * right[2] - z[2] * right[1], z[2] * right[0] - z[0] * right[2], z[0] * right[1] - z[1] * right[0]]
  return { right, up: unit(up) }
}

export interface FitSphere { center: Vec3; radius: number }

/** Bounding sphere of the body frame plus yolk and chorion (AR-41). */
export function bodyBoundingSphere(frame: BodyFrame): FitSphere {
  const pts: Vec3[] = []
  for (const s of frame.stations) {
    pts.push(
      [s.p[0] + s.n[0] * s.hD, s.p[1] + s.n[1] * s.hD, s.p[2] + s.n[2] * s.hD],
      [s.p[0] - s.n[0] * s.hV, s.p[1] - s.n[1] * s.hV, s.p[2] - s.n[2] * s.hV],
      [s.p[0] + s.b[0] * s.hW, s.p[1] + s.b[1] * s.hW, s.p[2] + s.b[2] * s.hW],
      [s.p[0] - s.b[0] * s.hW, s.p[1] - s.b[1] * s.hW, s.p[2] - s.b[2] * s.hW],
    )
  }
  const addSphere = (c: Vec3, r: number): void => {
    for (const k of [0, 1, 2] as const) {
      const a: Vec3 = [c[0], c[1], c[2]]
      const b: Vec3 = [c[0], c[1], c[2]]
      a[k] += r
      b[k] -= r
      pts.push(a, b)
    }
  }
  if (frame.yolk?.ball) addSphere(frame.yolk.ball.centre, frame.yolk.ball.radiusMm)
  if (frame.chorion) addSphere(frame.chorion.centre, frame.chorion.radiusMm)
  const min: Vec3 = [Infinity, Infinity, Infinity]
  const max: Vec3 = [-Infinity, -Infinity, -Infinity]
  for (const p of pts) for (const k of [0, 1, 2] as const) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]) }
  const center: Vec3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  let r2 = 0
  for (const p of pts) r2 = Math.max(r2, (p[0] - center[0]) ** 2 + (p[1] - center[1]) ** 2 + (p[2] - center[2]) ** 2)
  return { center, radius: Math.max(Math.sqrt(r2), 1e-3) }
}

export interface FitViewport {
  width: number
  height: number
  reserved: { top: number; right: number; bottom: number; left: number }
}

/**
 * Distance that frames a sphere of `radius` inside the free part of the
 * viewport: `radius / sin(halfAngle) * 1.1`, where the half angle is the
 * smaller of the vertical and horizontal half angles of the free rectangle.
 */
export function fitDistance(radius: number, viewport: FitViewport, fovDeg = FOV_DEG): number {
  const { width, height, reserved } = viewport
  const freeW = Math.max(1, width - reserved.left - reserved.right)
  const freeH = Math.max(1, height - reserved.top - reserved.bottom)
  const tanHalfV = Math.tan((fovDeg * Math.PI) / 360)
  const tanV = tanHalfV * (freeH / Math.max(1, height))
  const tanH = tanHalfV * (width / Math.max(1, height)) * (freeW / Math.max(1, width))
  const half = Math.atan(Math.min(tanV, tanH))
  return (radius / Math.sin(Math.max(half, 1e-3))) * FIT_MARGIN
}

/** View offset of AR-42: shifts the projection centre into the free rectangle. */
export function viewOffsetFor(viewport: FitViewport): { x: number; y: number } | null {
  const { reserved } = viewport
  if (!reserved.top && !reserved.right && !reserved.bottom && !reserved.left) return null
  return { x: (reserved.right - reserved.left) / 2, y: (reserved.bottom - reserved.top) / 2 }
}

/** cubic-bezier(0.2, 0, 0, 1) of research 07, solved by Newton iteration on x. */
export function presetEase(t: number): number {
  const x1 = 0.2, y1 = 0, x2 = 0, y2 = 1
  if (t <= 0) return 0
  if (t >= 1) return 1
  const bez = (a: number, b: number, s: number): number => 3 * a * (1 - s) * (1 - s) * s + 3 * b * (1 - s) * s * s + s * s * s
  const dbez = (a: number, b: number, s: number): number => 3 * a * (1 - s) * (1 - 3 * s) + 3 * b * s * (2 - 3 * s) + 3 * s * s
  let s = t
  for (let i = 0; i < 8; i++) {
    const d = dbez(x1, x2, s)
    if (Math.abs(d) < 1e-6) break
    s -= (bez(x1, x2, s) - t) / d
    s = Math.min(1, Math.max(0, s))
  }
  return bez(y1, y2, s)
}

/** Slerp between two unit vectors. */
export function slerpDir(a: Vec3, b: Vec3, s: number): Vec3 {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  const angle = Math.acos(dot)
  if (angle < 1e-4) return unit([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s])
  const sa = Math.sin((1 - s) * angle) / Math.sin(angle)
  const sb = Math.sin(s * angle) / Math.sin(angle)
  return unit([a[0] * sa + b[0] * sb, a[1] * sa + b[1] * sb, a[2] * sa + b[2] * sb])
}
