// E029, E036 and W007: build every keyframe with the core builders. The builders
// live in WP-03's modules; when they are absent the rules are skipped with a
// notice and the CLI reports which modules it looked for.

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Report } from './report.ts'
import { num } from './report.ts'
import type { AtlasFiles, StructureRecord } from './types.ts'

type GeometryOut = {
  positions: ArrayLike<number>
  normals: ArrayLike<number>
  bounds?: { min: ArrayLike<number>; max: ArrayLike<number> }
  /** Set by the local-frame kinds: positions are local and this transform places them (AR-72). */
  placement?: { position: ArrayLike<number>; quaternion: ArrayLike<number>; scale: ArrayLike<number> }
  /** Set by the sweep kinds (tube, heartLoop, gutLoop, primordiumMover). */
  sweep?: { maxRadiusMm: number; maxCurvature: number; product: number }
}
type Ball = { centre?: ArrayLike<number>; radiusMm?: number } | null | undefined
type Frame = {
  yolk?: { ball?: Ball } | null
  chorion?: Ball
  frameAt?: (u: number) => { p: ArrayLike<number>; hD: number; hV: number; hW: number }
}
type BodyModel = (hpf: number) => Frame
type Level = 'interactive' | 'final'
type CoreApi = {
  createBodyModel: (body: unknown, growth: unknown) => BodyModel
  buildStructure: (record: StructureRecord, frame: Frame, t: number, level: Level) => GeometryOut
}

const CONVEX_KINDS = new Set(['ellipsoid', 'superellipsoid'])
/** E036 (BG-31): max radius times max curvature along a sweep stays below this. */
export const SWEEP_PRODUCT_MAX = 0.9
/** W007 samples the body box at the 128 stations of the frame plus a tolerance for the tube caps. */
const BODY_BOX_STATIONS = 128

async function importCore(repoRoot: string): Promise<CoreApi | { missing: string[] }> {
  const paths = {
    body: resolve(repoRoot, 'src/core/bodyModel.ts'),
    build: resolve(repoRoot, 'src/core/primitives/buildStructure.ts'),
  }
  const missing = Object.values(paths).filter((p) => !existsSync(p))
  if (missing.length > 0) return { missing }
  const bodyMod = (await import(pathToFileURL(paths.body).href)) as Partial<CoreApi>
  const buildMod = (await import(pathToFileURL(paths.build).href)) as Partial<CoreApi>
  if (typeof bodyMod.createBodyModel !== 'function') return { missing: [`${paths.body}#createBodyModel`] }
  if (typeof buildMod.buildStructure !== 'function') return { missing: [`${paths.build}#buildStructure`] }
  return { createBodyModel: bodyMod.createBodyModel, buildStructure: buildMod.buildStructure }
}

/** Returns the notices to print; findings go to the report. */
export async function checkBuilds(data: AtlasFiles, repoRoot: string, report: Report): Promise<string[]> {
  const core = await importCore(repoRoot)
  if ('missing' in core) return [`build rules E029, E036 and W007 skipped: missing ${core.missing.join(', ')}`]
  let model: BodyModel
  try {
    model = core.createBodyModel(data.body, data.stages.growth)
  } catch (e) {
    return [`build rules E029, E036 and W007 skipped: createBodyModel threw ${(e as Error).message}`]
  }
  let built = 0
  for (const r of data.structures) {
    const g = r.geometry
    if (!g || g.kind === 'bodyDriven' || g.kind === 'derived') continue
    for (const kf of g.keyframes) {
      for (const level of ['interactive', 'final'] as Level[]) {
        let out: GeometryOut
        try {
          out = core.buildStructure(r, model(kf.hpf), kf.hpf, level)
        } catch (e) {
          report.error('E029', 'structures', r.id, `keyframe at ${num(kf.hpf)} hpf fails to build (${level}): ${(e as Error).message}`)
          continue
        }
        built++
        checkNormals(r, kf.hpf, g.kind, out, report)
        if (level === 'final') {
          checkSweep(r, kf.hpf, out, report)
          checkBounds(r, kf.hpf, out, model(kf.hpf), report)
        }
      }
    }
  }
  return [`build rules: ${built} keyframe builds checked`]
}

function checkNormals(r: StructureRecord, hpf: number, kind: string, out: GeometryOut, report: Report): void {
  const { positions, normals } = out
  const n = Math.min(positions.length, normals.length) / 3
  const centre = out.bounds ? [0, 1, 2].map((i) => (out.bounds!.min[i] + out.bounds!.max[i]) / 2) : null
  for (let v = 0; v < n; v++) {
    const px = positions[3 * v], py = positions[3 * v + 1], pz = positions[3 * v + 2]
    const nx = normals[3 * v], ny = normals[3 * v + 1], nz = normals[3 * v + 2]
    const finite = [px, py, pz, nx, ny, nz].every(Number.isFinite)
    const len = Math.hypot(nx, ny, nz)
    let bad = !finite || Math.abs(len - 1) > 1e-3
    if (!bad && centre && CONVEX_KINDS.has(kind)) {
      bad = nx * (px - centre[0]) + ny * (py - centre[1]) + nz * (pz - centre[2]) <= 0
    }
    if (bad) {
      report.error('E029', 'structures', r.id, `keyframe at ${num(hpf)} hpf builds a non-finite or inward normal at vertex ${v}`)
      return
    }
  }
}

/**
 * E036: r x kappa stays below 0.9 along every sweep, so the inner side of a bend does not
 * self-intersect and no normal inverts (BG-31). The product is taken per station (the
 * sweep normal is valid while the local r x kappa < 1); the two maxima are reported.
 */
function checkSweep(r: StructureRecord, hpf: number, out: GeometryOut, report: Report): void {
  const s = out.sweep
  if (!s || !(s.product >= SWEEP_PRODUCT_MAX)) return
  report.error('E036', 'structures', r.id, `keyframe at ${num(hpf)} hpf has r x kappa = ${num(s.product)} (largest radius ${num(s.maxRadiusMm)} mm, largest curvature ${num(s.maxCurvature)} per mm)`)
}

/** Rotates a vector by a unit quaternion [x, y, z, w]. */
function rotate(q: ArrayLike<number>, v: number[]): number[] {
  const [qx, qy, qz, qw] = [q[0], q[1], q[2], q[3]]
  const [x, y, z] = v
  const ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z
  return [ix * qw + iw * -qx + iy * -qz - iz * -qy, iy * qw + iw * -qy + iz * -qx - ix * -qz, iz * qw + iw * -qz + ix * -qy - iy * -qx]
}

/** World-space box of a build: a local-frame build's box corners go through its placement. */
function worldBounds(out: GeometryOut): { min: number[]; max: number[] } {
  const b = out.bounds!
  const pl = out.placement
  if (!pl) return { min: [b.min[0], b.min[1], b.min[2]], max: [b.max[0], b.max[1], b.max[2]] }
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let corner = 0; corner < 8; corner++) {
    const local = [0, 1, 2].map((i) => ((corner >> i) & 1 ? b.max[i] : b.min[i]) * pl.scale[i])
    const w = rotate(pl.quaternion, local)
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], w[i] + pl.position[i])
      max[i] = Math.max(max[i], w[i] + pl.position[i])
    }
  }
  return { min, max }
}

/** W007: the built bounds, placed in world space, lie inside the body box plus the record's margin. */
function checkBounds(r: StructureRecord, hpf: number, out: GeometryOut, frame: Frame, report: Report): void {
  if (!out.bounds || typeof frame.frameAt !== 'function') return
  const built = worldBounds(out)
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  const grow = (c: ArrayLike<number>, rad: number) => {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], c[i] - rad)
      max[i] = Math.max(max[i], c[i] + rad)
    }
  }
  for (let i = 0; i <= BODY_BOX_STATIONS; i++) {
    const s = frame.frameAt(i / BODY_BOX_STATIONS)
    grow(s.p, Math.max(s.hD, s.hV, s.hW))
  }
  for (const ball of [frame.yolk?.ball, frame.chorion]) {
    if (ball?.centre && typeof ball.radiusMm === 'number') grow(ball.centre, ball.radiusMm)
  }
  const span = Math.max(...[0, 1, 2].map((i) => max[i] - min[i]))
  let margin = r.geometry?.boundsMarginMm ?? 0
  if (r.system === 'fins') margin = Math.max(margin, 0.2 * span)
  let worst = 0
  for (let i = 0; i < 3; i++) {
    worst = Math.max(worst, min[i] - margin - built.min[i], built.max[i] - (max[i] + margin))
  }
  // The round caps of the skin tube reach one mean radius past u = 0 and u = 1; allow the finer of 1 um and 0.5 percent of the span.
  const tolerance = Math.min(1e-3, 0.005 * span)
  if (worst > tolerance) report.warn('W007', 'structures', r.id, `keyframe at ${num(hpf)} hpf protrudes ${num(worst)} mm beyond the body box`)
}
