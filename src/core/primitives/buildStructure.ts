// Build bridge (spec 2.2.1, 2.3): interpolated parameters -> primitive builder ->
// GeometryOut. Adds the parameter hash of BG-54, the placement-only path of
// AR-72, the mirrored twin of a paired local-frame record, and the body-driven
// builders of DM-31 (yolk, chorion, blastodisc cap, blastoderm shell). The part slice of
// a `derived` record lives in derived.ts. Every function here is pure in (record, frame,
// t, level) and never touches a mesh (AR-09).
import type { BodyFrame } from '../bodyModel.ts'
import { defaultParamSpec, interpolateParams } from '../interpolation.ts'
import type { ParamSpec } from '../interpolation.ts'
import { GEOMETRY_META_KEYS, classifyParam } from '../paramUnits.ts'
import { builderFor } from './index.ts'
import type { AnyBuilder } from './index.ts'
import { boundsOf, createWriter, finish, gridIndices, localAxes, placementOf, reverseWinding } from './mesh.ts'
import type { MeshWriter } from './mesh.ts'
import { shellLocal } from './shell.ts'
import { superellipsoidLocal } from './superellipsoid.ts'
import { sweepTube } from './sweep.ts'
import type { SweepRow } from './sweep.ts'
import { countsFor } from './tessellation.ts'
import type { GeometryOut, GeometryPlacement, Lod, Placement } from './types.ts'
import { lerp, madd } from './vec3.ts'
import type { Vec3 } from './vec3.ts'
import type { StructureRecord } from '../schema.ts'

export type StructureParams = Record<string, unknown>

/** Drawn chorion wall (mm); the real wall is thinner than one pixel at any zoom. */
export const CHORION_THICKNESS_MM = 0.005
/** Radius floor of the yolk extension sweep (BG-31). */
const RADIUS_FLOOR_MM = 0.004
/**
 * The yolk extension's axis sits this far inside the ventral skin. The generator raises the
 * ventral profile to the axis line plus 0.01 mm over the extension (gen-body.ts), so the axis
 * lands at hV_template + r - 0.02 as BG-18 states and the lower half of the extension forms
 * the ventral outline under the skin (phase 1 review R3).
 */
export const EXTENSION_AXIS_INSET_MM = 0.03
/**
 * The blastoderm's outer surface sits this far proud of the yolk sphere: the covered part of
 * the egg reads as one ovoid instead of a cap stepped out by the shell thickness, and the two
 * surfaces do not z-fight (BG-13 as drawn; phase 1 review R5).
 */
const SHELL_PROUD_MM = 0.003

const IDENTITY_QUAT: [number, number, number, number] = [0, 0, 0, 1]

/** DM-35 classes from paramUnits, with the interpolation default for names outside the rule. */
const paramSpec: ParamSpec = {
  classify(name, path) {
    return classifyParam(name) ?? defaultParamSpec.classify(name, path)
  },
  metaKeys: defaultParamSpec.metaKeys,
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The whole-organism tube with `radiusMm: 'body'` (DM-31). */
export function isSkinRecord(record: StructureRecord): boolean {
  const g = record.geometry
  return g !== null && g.kind === 'tube' && g.radiusMm === 'body'
}

/** The core builder of a record, or null for group nodes, body-driven and derived records. */
export function builderOf(record: StructureRecord): AnyBuilder | null {
  const g = record.geometry
  if (!g || g.kind === 'bodyDriven' || g.kind === 'derived') return null
  return builderFor(g.kind, g.kind === 'custom' ? g.builder : undefined)
}

/** True when the record has something to draw: a builder, a body-driven part, or a derived part of a source build. */
export function hasBuilder(record: StructureRecord): boolean {
  const kind = record.geometry?.kind
  return kind === 'bodyDriven' || kind === 'derived' || builderOf(record) !== null
}

/** Compact kinds emit local positions and a placement (AR-72); the chorion is a sphere about its centre. */
export function isLocalFrame(record: StructureRecord): boolean {
  const g = record.geometry
  if (!g) return false
  if (g.kind === 'bodyDriven') return g.part === 'chorion'
  return builderOf(record)?.localFrame ?? false
}

/** Paired local-frame records (placement.mirror) draw a mirrored twin at +|w|. */
export function isMirroredPair(record: StructureRecord): boolean {
  if (!isLocalFrame(record)) return false
  const g = record.geometry as Record<string, unknown> | null
  const p = g && (g.placement ?? g.centre)
  if (isObject(p) && p.mirror === true) return true
  const keyframes = (g?.keyframes ?? []) as Record<string, unknown>[]
  return keyframes.some((k) => isObject(k.placement) && k.placement.mirror === true)
}

/** The static parameter block: the geometry spec without its metadata keys. */
function staticBlock(record: StructureRecord): StructureParams {
  const out: StructureParams = {}
  for (const [k, v] of Object.entries(record.geometry ?? {})) if (!GEOMETRY_META_KEYS.has(k)) out[k] = v
  return out
}

/** Interpolated parameters at t; `sl` is the frame's standard length (null before 72 hpf, BG-43). */
export function structureParams(record: StructureRecord, t: number, sl: number | null): StructureParams {
  const g = record.geometry
  if (!g) return {}
  const keyframes = g.keyframes as unknown as readonly { hpf: number; sizeRefSl?: number; [key: string]: unknown }[]
  return interpolateParams(staticBlock(record), keyframes, t, sl, paramSpec)
}

function usesBodyHeightFraction(v: unknown): boolean {
  if (Array.isArray(v)) return v.some(usesBodyHeightFraction)
  if (!isObject(v)) return false
  if (v.unit === 'bodyHeightFraction') return true
  return Object.values(v).some(usesBodyHeightFraction)
}

const quantize = (_key: string, v: unknown): unknown => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v)

/**
 * The cache key of BG-54: parameters quantized to 1e-4, the level, and the body-frame
 * time for every build whose vertices depend on the frame (world-space kinds, sizes in
 * body-height fractions, the chorion radius). A local-frame build with an unchanged hash
 * needs only its transform.
 */
export function paramHash(record: StructureRecord, params: StructureParams, lod: Lod, frame: BodyFrame): string {
  const g = record.geometry
  let frameKey = 0
  if (!isLocalFrame(record) || usesBodyHeightFraction(params)) frameKey = Math.round(frame.hpf * 1000) / 1000
  else if (g?.kind === 'bodyDriven' && g.part === 'chorion') frameKey = Math.round((frame.chorion?.radiusMm ?? 0) * 1e4) / 1e4
  return `${lod}|${frameKey}|${JSON.stringify(params, quantize)}`
}

/** True when every coordinate and normal is finite (AR-71). */
export function geometryIsFinite(out: GeometryOut): boolean {
  const b = out.bounds
  if (![...b.min, ...b.max, ...b.center, b.radius].every(Number.isFinite)) return false
  for (let i = 0; i < out.positions.length; i++) if (!Number.isFinite(out.positions[i]!)) return false
  for (let i = 0; i < out.normals.length; i++) if (!Number.isFinite(out.normals[i]!)) return false
  return true
}

// Body-driven parts (DM-31, BG-33) -------------------------------------------------

function buildYolk(frame: BodyFrame, lod: Lod): GeometryOut | null {
  const yolk = frame.yolk
  if (!yolk) return null
  const counts = countsFor('lathe', lod)
  const w = createWriter()
  const parts: NonNullable<GeometryOut['parts']> = {}
  const record = (name: string, vs: number, is: number): void => {
    parts[name] = { vertexStart: vs, vertexCount: w.vertexCount() - vs, indexStart: is, indexCount: w.indices.length - is }
  }
  const ball = yolk.ball
  if (ball && ball.radiusMm > 1e-6) {
    const r = ball.radiusMm
    const vs = w.vertexCount(), is = w.indices.length
    superellipsoidLocal([r, r, r], 1, 1, counts.rows, counts.radial, w)
    translate(w, ball.centre)
    record('ball', vs, is)
  }
  const ext = yolk.extension
  if (ext && (ext.r0Mm > 1e-6 || ext.r1Mm > 1e-6) && ext.u1 > ext.u0) {
    const vs = w.vertexCount(), is = w.indices.length
    // BG-18 with the R3 envelope: the axis runs 0.03 mm inside the ventral skin, which the generator
    // raised to the axis line, so the extension's lower half is the ventral outline.
    const rows: SweepRow[] = []
    for (let i = 0; i <= counts.rows; i++) {
      const s = i / counts.rows
      const u = lerp(ext.u0, ext.u1, s)
      const f = frame.frameAt(u)
      const r = Math.max(RADIUS_FLOOR_MM, lerp(ext.r0Mm, ext.r1Mm, s))
      const p = madd(f.p, f.n, -(f.hV - EXTENSION_AXIS_INSET_MM))
      rows.push({ p, t: f.t, n: f.n, b: f.b, aD: r, aV: r, bw: r, exponent: 2 })
    }
    sweepTube(rows, counts.radial, 'round', w)
    record('extension', vs, is)
  }
  if (w.vertexCount() === 0) return null
  return finish(w, { parts })
}

function translate(w: MeshWriter, c: Vec3): void {
  for (let i = 0; i < w.positions.length; i += 3) {
    w.positions[i] = w.positions[i]! + c[0]
    w.positions[i + 1] = w.positions[i + 1]! + c[1]
    w.positions[i + 2] = w.positions[i + 2]! + c[2]
  }
}

/**
 * BG-11: the blastodisc, a half superellipsoid with semi-axes (a, h, a) and exponent 2,
 * whose base plane sits at y = sqrt(Ry^2 - a^2) above the yolk centre (animal pole +y).
 */
function buildBlastodisc(frame: BodyFrame, lod: Lod): GeometryOut | null {
  const cap = frame.cap
  const ball = frame.yolk?.ball
  if (!cap || !ball || cap.heightMm <= 1e-6 || cap.baseRadiusMm <= 1e-6) return null
  const ry = ball.radiusMm
  const a = Math.min(cap.baseRadiusMm, ry)
  const h = cap.heightMm
  const baseY = Math.sqrt(Math.max(0, ry * ry - a * a))
  const { rows, radial } = countsFor('shell', lod)
  const w = createWriter()
  const base = w.vertexCount()
  for (let i = 0; i <= rows; i++) {
    const theta = (Math.PI / 2) * (i / rows)
    for (let j = 0; j <= radial; j++) {
      const phi = 2 * Math.PI * (j / radial)
      const d: Vec3 = [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)]
      const p: Vec3 = [ball.centre[0] + a * d[0], ball.centre[1] + baseY + h * d[1], ball.centre[2] + a * d[2]]
      w.vertex(p, [d[0] / a, d[1] / h, d[2] / a], [j / radial, i / rows])
    }
  }
  gridIndices(w, base, rows, radial)
  return finish(w)
}

/**
 * BG-13: the blastoderm, a shell of thickness shellThicknessMm over the yolk from the animal pole
 * to acos(1 - 2 f). Its outer surface lies 3 um proud of the yolk sphere and its inner surface
 * inside the sphere, so the margin shows no ledge.
 */
function buildBlastoderm(frame: BodyFrame, lod: Lod): GeometryOut | null {
  const ball = frame.yolk?.ball
  const thickness = frame.shellThicknessMm
  const f = Math.min(1, frame.epibolyFraction)
  if (!ball || thickness === null || thickness <= 1e-6 || f <= 1e-6) return null
  const polarDeg = (Math.acos(Math.max(-1, 1 - 2 * f)) * 180) / Math.PI
  const counts = countsFor('shell', lod)
  const innerRadius = Math.max(0.01, ball.radiusMm + SHELL_PROUD_MM - thickness)
  const w = shellLocal(innerRadius, thickness, polarDeg, 360, counts.rows, counts.radial)
  translate(w, ball.centre)
  return finish(w)
}

function buildChorion(frame: BodyFrame, lod: Lod): GeometryOut | null {
  const ch = frame.chorion
  if (!ch || ch.radiusMm <= 1e-6) return null
  const counts = countsFor('shell', lod)
  const w = shellLocal(ch.radiusMm, CHORION_THICKNESS_MM, 180, 360, counts.rows, counts.radial)
  const position: Vec3 = [ch.centre[0], ch.centre[1], ch.centre[2]]
  return finish(w, { placement: { position, quaternion: IDENTITY_QUAT, scale: [1, 1, 1] } })
}

/**
 * `buildStructure(record, frame, t, level)` of spec 2.2.1, with an optional
 * pre-interpolated parameter block. Returns null when the record draws nothing.
 */
export function buildStructure(
  record: StructureRecord,
  frame: BodyFrame,
  t: number,
  lod: Lod,
  params: StructureParams = structureParams(record, t, frame.slMm),
): GeometryOut | null {
  const g = record.geometry
  if (!g) return null
  if (g.kind === 'bodyDriven') {
    switch (g.part) {
      case 'yolk': return buildYolk(frame, lod)
      case 'chorion': return buildChorion(frame, lod)
      case 'blastodisc': return buildBlastodisc(frame, lod)
      case 'blastoderm': return buildBlastoderm(frame, lod)
    }
  }
  const builder = builderOf(record)
  if (!builder) return null
  return (builder as unknown as { build(p: StructureParams, f: BodyFrame, l: Lod): GeometryOut }).build(params, frame, lod)
}

/** The placement of a local-frame record without a build; null when the kind needs its builder. */
export function placementOnly(record: StructureRecord, params: StructureParams, frame: BodyFrame): GeometryPlacement | null {
  const g = record.geometry
  if (!g) return null
  if (g.kind === 'bodyDriven') {
    if (g.part !== 'chorion' || !frame.chorion) return null
    const c = frame.chorion.centre
    return { position: [c[0], c[1], c[2]], quaternion: IDENTITY_QUAT, scale: [1, 1, 1] }
  }
  if (g.kind === 'ellipsoid' || g.kind === 'superellipsoid' || g.kind === 'lathe') {
    const p = params.placement
    return isObject(p) ? placementOf(localAxes(frame, p as unknown as Placement)) : null
  }
  if (g.kind === 'shell') {
    const c = params.centre
    if (!isObject(c)) return null
    const axes = localAxes(frame, c as unknown as Placement)
    if ((params.pole ?? 'worldUp') === 'worldUp') return placementOf({ origin: axes.origin, x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] })
    return placementOf(axes)
  }
  return null
}

/** Placement of the mirrored twin of a paired record: the same axes at +|w|. */
export function twinPlacementOf(record: StructureRecord, params: StructureParams, frame: BodyFrame): GeometryPlacement | null {
  if (!isMirroredPair(record)) return null
  const p = (params.placement ?? params.centre) as Placement | undefined
  if (!isObject(p)) return null
  return placementOf(localAxes(frame, { ...p, w: Math.abs(p.w), mirror: false }))
}

/** Mirror a local-frame build across its local xy plane: z negated, winding reversed. */
export function mirrorGeometry(out: GeometryOut): GeometryOut {
  const positions = out.positions.slice()
  const normals = out.normals.slice()
  for (let i = 2; i < positions.length; i += 3) {
    positions[i] = -positions[i]!
    normals[i] = -normals[i]!
  }
  const indices = out.indices.slice()
  reverseWinding(indices)
  return { ...out, positions, normals, indices, bounds: boundsOf(positions) }
}
