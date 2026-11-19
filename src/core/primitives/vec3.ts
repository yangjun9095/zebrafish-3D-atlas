// Small vector helpers shared by the spine, the body model and the builders.
// Vectors are plain tuples in millimetres; nothing here allocates typed arrays.

export type Vec3 = [number, number, number]
export type Vec2 = [number, number]
export type Quat = [number, number, number, number]

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s]
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
export const length = (a: Vec3): number => Math.hypot(a[0], a[1], a[2])
export const distance = (a: Vec3, b: Vec3): number => length(sub(a, b))

/** Unit vector; returns the fallback when the input is shorter than 1e-12. */
export function normalize(a: Vec3, fallback: Vec3 = [1, 0, 0]): Vec3 {
  const n = length(a)
  return n < 1e-12 ? [fallback[0], fallback[1], fallback[2]] : [a[0] / n, a[1] / n, a[2] / n]
}

export const lerp = (a: number, b: number, s: number): number => a + (b - a) * s
export const lerp3 = (a: Vec3, b: Vec3, s: number): Vec3 => [lerp(a[0], b[0], s), lerp(a[1], b[1], s), lerp(a[2], b[2], s)]
export const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x)
export const smoothstep = (x: number): number => {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}
export const degToRad = (d: number): number => (d * Math.PI) / 180
export const radToDeg = (r: number): number => (r * 180) / Math.PI

/** a + b * s, in one allocation. */
export const madd = (a: Vec3, b: Vec3, s: number): Vec3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]

/** Rotate v about a unit axis by an angle (Rodrigues). */
export function rotateAbout(v: Vec3, axis: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const k = axis
  const kxv = cross(k, v)
  const kdv = dot(k, v)
  return [
    v[0] * c + kxv[0] * s + k[0] * kdv * (1 - c),
    v[1] * c + kxv[1] * s + k[1] * kdv * (1 - c),
    v[2] * c + kxv[2] * s + k[2] * kdv * (1 - c),
  ]
}

/** Remove the component of v along the unit vector t and renormalize. */
export function orthogonalize(v: Vec3, t: Vec3, fallback: Vec3): Vec3 {
  const d = dot(v, t)
  return normalize([v[0] - t[0] * d, v[1] - t[1] * d, v[2] - t[2] * d], fallback)
}

/**
 * Quaternion (x, y, z, w) of the rotation whose columns are the right-handed
 * unit axes x, y, z. Callers pass z = cross(x, y).
 */
export function quatFromAxes(x: Vec3, y: Vec3, z: Vec3): Quat {
  const m00 = x[0], m01 = y[0], m02 = z[0]
  const m10 = x[1], m11 = y[1], m12 = z[1]
  const m20 = x[2], m21 = y[2], m22 = z[2]
  const trace = m00 + m11 + m22
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1)
    return [(m21 - m12) * s, (m02 - m20) * s, (m10 - m01) * s, 0.25 / s]
  }
  if (m00 > m11 && m00 > m22) {
    const s = 2 * Math.sqrt(1 + m00 - m11 - m22)
    return [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]
  }
  if (m11 > m22) {
    const s = 2 * Math.sqrt(1 + m11 - m00 - m22)
    return [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s]
  }
  const s = 2 * Math.sqrt(1 + m22 - m00 - m11)
  return [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s]
}

/** Apply a quaternion to a vector. */
export function applyQuat(q: Quat, v: Vec3): Vec3 {
  const [qx, qy, qz, qw] = q
  const ix = qw * v[0] + qy * v[2] - qz * v[1]
  const iy = qw * v[1] + qz * v[0] - qx * v[2]
  const iz = qw * v[2] + qx * v[1] - qy * v[0]
  const iw = -qx * v[0] - qy * v[1] - qz * v[2]
  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx,
  ]
}

/** Yaw about local y, pitch about local z, roll about local x, applied to an axis triple. */
export function rotateAxes(x: Vec3, y: Vec3, z: Vec3, yawDeg = 0, pitchDeg = 0, rollDeg = 0): [Vec3, Vec3, Vec3] {
  let ax = x, ay = y, az = z
  if (yawDeg) { ax = rotateAbout(ax, ay, degToRad(yawDeg)); az = rotateAbout(az, ay, degToRad(yawDeg)) }
  if (pitchDeg) { ax = rotateAbout(ax, az, degToRad(pitchDeg)); ay = rotateAbout(ay, az, degToRad(pitchDeg)) }
  if (rollDeg) { ay = rotateAbout(ay, ax, degToRad(rollDeg)); az = rotateAbout(az, ax, degToRad(rollDeg)) }
  return [ax, ay, az]
}
