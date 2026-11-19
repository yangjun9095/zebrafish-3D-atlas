// WP-A5: the skeletal, muscular, fins and skin records parse, build at every
// keyframe, stay inside the skin, and carry the D8 and D9 windows through the
// growth table; the finSheet builder accepts the record form of the schema.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createBodyModel, type BodyFile, type BodyFrame } from '../../src/core/bodyModel.ts'
import { hpfAtSlFrom } from '../../src/core/growth.ts'
import { COLOUR_ROLES, overrideFor } from '../../src/core/palette.ts'
import { buildStructure, structureParams } from '../../src/core/primitives/buildStructure.ts'
import { finSheet, finSides, type FinSheetParams } from '../../src/core/primitives/custom/finSheet.ts'
import { segmentInstances, type SegmentArrayParams } from '../../src/core/primitives/segmentArray.ts'
import type { TubeParams } from '../../src/core/primitives/tube.ts'
import { sizeMm, type GeometryOut, type Size } from '../../src/core/primitives/types.ts'
import { parseFile, type StructureRecord } from '../../src/core/schema.ts'
import { loadGrowth } from '../../scripts/gen-body.ts'

const root = path.resolve(import.meta.dirname, '../..')
const body = JSON.parse(fs.readFileSync(path.join(root, 'src/data/body.json'), 'utf8')) as BodyFile
const growth = loadGrowth().growth
const model = createBodyModel(body, growth)

const FILES = ['skeletal', 'muscular', 'fins', 'integument_pigment']
const records: StructureRecord[] = []
for (const name of FILES) {
  const raw = JSON.parse(fs.readFileSync(path.join(root, `src/data/structures/${name}.json`), 'utf8')) as unknown
  const parsed = parseFile('structures', raw)
  if (!parsed.ok) throw new Error(`${name}.json: ${parsed.error.issues.map((i) => `${i.path} ${i.message}`).join('; ')}`)
  records.push(...parsed.value)
}
// The epidermis ZFA:0000105 draws nothing (the skin tube is the surface) and lives with the group nodes.
{
  const raw = JSON.parse(fs.readFileSync(path.join(root, 'src/data/structures/groups.json'), 'utf8')) as unknown
  const parsed = parseFile('structures', raw)
  if (!parsed.ok) throw new Error(`groups.json: ${parsed.error.issues.map((i) => `${i.path} ${i.message}`).join('; ')}`)
  records.push(...parsed.value.filter((r) => FILES.includes(r.system)))
}
const byId = new Map(records.map((r) => [r.id, r]))
const drawn = records.filter((r) => r.geometry && r.geometry.kind !== 'bodyDriven' && r.id !== 'ZFA:0001094')

const v3 = (a: Float32Array, i: number): [number, number, number] => [a[3 * i]!, a[3 * i + 1]!, a[3 * i + 2]!]
const sub = (a: number[], b: number[]): number[] => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!]
const cross = (a: number[], b: number[]): number[] => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!]
const dot = (a: number[], b: number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!

/** Triangles whose geometric normal opposes the mean vertex normal, and degenerate ones. */
function windingReport(g: GeometryOut): { zeroArea: number; inverted: number } {
  let zeroArea = 0
  let inverted = 0
  for (let i = 0; i < g.indices.length; i += 3) {
    const a = g.indices[i]!, b = g.indices[i + 1]!, c = g.indices[i + 2]!
    const pa = v3(g.positions, a), pb = v3(g.positions, b), pc = v3(g.positions, c)
    const n = cross(sub(pb, pa), sub(pc, pa))
    const len = Math.hypot(...n)
    if (len < 1e-14) { zeroArea++; continue }
    const na = v3(g.normals, a), nb = v3(g.normals, b), nc = v3(g.normals, c)
    const mean = [na[0] + nb[0] + nc[0], na[1] + nb[1] + nc[1], na[2] + nb[2] + nc[2]]
    if (dot(n, mean) < 0) inverted++
  }
  return { zeroArea, inverted }
}

function finite(g: GeometryOut): boolean {
  for (let i = 0; i < g.positions.length; i++) if (!Number.isFinite(g.positions[i]!)) return false
  for (let i = 0; i < g.normals.length; i++) if (!Number.isFinite(g.normals[i]!)) return false
  return true
}

const hpfAtSl = (sl: number): number => hpfAtSlFrom(growth, sl) ?? NaN

describe('WP-A5 records', () => {
  it('cover the skeletal, muscular, fins and skin deliverables', () => {
    for (const id of ['ZFA:0001612', 'ZFA:0001580', 'ZFA:0001205', 'ZFA:0000095', 'ZFA:0000250', 'ZFA:0001189', 'ZFA:0000538', 'ZFA:0001188', 'ZFA:0000364',
      'ZFA:0001056', 'ZFA:0000671', 'ZFA:0000040', 'ZFA:0000141', 'ZFA:0001161', 'ZFA:0001184', 'ZFA:0001173', 'ZFA:0001162', 'ZFA:0001058',
      'ZFA:0000105', 'ZFA:0000277', 'ZFA:0009091', 'ZFA:0005223', 'ZFA:0001463', 'ZFA:0009198', 'ZFA:0009199', 'ZFA:0000622']) {
      expect(byId.has(id), id).toBe(true)
    }
    expect(byId.has('ZFA:0001185')).toBe(true)   // the periderm is its own record (spec 3.5.3; review DR-08), not an alias of the epidermis
  })

  it('build finite geometry at every keyframe at both levels', () => {
    for (const r of drawn) {
      for (const kf of r.geometry!.keyframes) {
        for (const lod of ['interactive', 'final'] as const) {
          const out = buildStructure(r, model(kf.hpf), kf.hpf, lod)
          expect(out, `${r.id} at ${kf.hpf}`).not.toBeNull()
          expect(finite(out!), `${r.id} at ${kf.hpf} (${lod})`).toBe(true)
        }
      }
    }
  })

  it('carry the D8 and D9 windows through the growth table (D6)', () => {
    const near = (a: number, b: number) => Math.abs(a - b) < 0.01
    expect(near(byId.get('ZFA:0000040')!.modelEndHpf, hpfAtSl(6.6))).toBe(true)
    expect(near(byId.get('ZFA:0001173')!.visibleFromHpf, hpfAtSl(5.2))).toBe(true)
    expect(near(byId.get('ZFA:0001162')!.visibleFromHpf, hpfAtSl(5.2))).toBe(true)
    expect(byId.get('ZFA:0001058')!.visibleFromHpf).toBe(24)
    expect(near(byId.get('ZFA:0001384')!.visibleFromHpf, hpfAtSl(7.2))).toBe(true)
    expect(near(byId.get('ZFA:0001384')!.modelEndHpf, hpfAtSl(8.7))).toBe(true)
    expect(byId.get('ZFA:0001184')!.visibleFromHpf).toBe(720)
    expect(near(byId.get('ZFA:0000277')!.visibleFromHpf, hpfAtSl(9.6))).toBe(true)
    for (const id of ['ZFA:0005221', 'ZFA:0005222', 'ZFA:0005223', 'ZFA:0005224']) expect(near(byId.get(id)!.modelEndHpf, hpfAtSl(9.6)), id).toBe(true)
    expect(near(byId.get('ZFA:0001463')!.visibleFromHpf, hpfAtSl(5.9))).toBe(true)
    expect(byId.get('ZFA:0000141')!.visibleFromHpf).toBe(28)
    expect(byId.get('ZFA:0000141')!.modelEndHpf).toBe(60)
    expect(byId.get('ZFA:0001056')!.visibleFromHpf).toBe(10.33)
  })

  it('carry sizeRefSl on every keyframe at or after 72 hpf and on none before', () => {
    for (const r of drawn) {
      for (const kf of r.geometry!.keyframes) {
        expect(kf.hpf >= 72 ? typeof kf.sizeRefSl === 'number' : kf.sizeRefSl === undefined, `${r.id} at ${kf.hpf}`).toBe(true)
      }
    }
  })

  it('keep the D10 colours on the exception records only', () => {
    expect(byId.get('ZFA:0001205')!.colorOverride?.dark).toBe('#8FC1E3')
    expect(byId.get('ZFA:0001189')!.colorOverride?.dark).toBe('#E9DFC4')
    expect(byId.get('ZFA:0009091')!.colorOverride?.dark).toBe('#23262B')
    expect(byId.get('ZFA:0009198')!.colorOverride?.dark).toBe('#FFB000')
    expect(byId.get('ZFA:0009199')!.colorOverride?.dark).toBe('#C9D6DF')
    expect(byId.get('ZFA:0000040')!.colorOverride).toBeNull()
    expect(byId.get('ZFA:0000407')!.colorOverride).toBeNull()
  })
})

/** Skin half-width at v for an elliptic section (exponent 2 in every body keyframe). */
function skinHalfWidth(f: ReturnType<BodyFrame['frameAt']>, v: number): number {
  return f.hW * Math.sqrt(Math.max(0, 1 - v * v))
}

describe('WP-A5 records sit inside the skin', () => {
  /** Pigment cells and scales sit on the skin: their centres must lie inside, their discs may straddle it. */
  const SURFACE = new Set(['ZFA:0000277', 'ZFA:0009091', 'ZFA:0009198', 'ZFA:0009199', 'ZFA:0005221', 'ZFA:0005222', 'ZFA:0005223', 'ZFA:0005224', 'ZFA:0001463'])
  /** Appendages outside the skin by nature: the barbel (fins are exempt by system). */
  const EXTERNAL = new Set(['ZFA:0000622'])
  /**
   * Head mesenchyme sits in skeletal.json because its system is skeletal (review BIO-04), but
   * WP-A1 authored it and anatomy-a1.test.ts checks its built mesh point by point against the
   * skin. The bound below reads the skin half-width at the top of the v extent, which is too
   * tight for a region that is wide and shallow around the spine, so it is checked there.
   */
  const A1_RECORDS = new Set(['ZFA:0000113'])
  const localFrame = drawn.filter(
    (r) => r.system !== 'fins' && !EXTERNAL.has(r.id) && !A1_RECORDS.has(r.id) && (r.geometry!.kind === 'ellipsoid' || r.geometry!.kind === 'superellipsoid'),
  )

  it('placed ellipsoids fit the local section at every keyframe', () => {
    const violations: string[] = []
    for (const r of localFrame) {
      const slack = 0.02
      for (const kf of r.geometry!.keyframes) {
        const frame = model(kf.hpf)
        const p = structureParams(r, kf.hpf, frame.slMm)
        const pl = p.placement as { u: number; v: number; w: number }
        const f = frame.frameAt(pl.u)
        const radii = (p.radiiMm as (number | { value: number })[]).map((x) => (typeof x === 'number' ? x : x.value * (f.hD + f.hV)))
        const hv = pl.v >= 0 ? f.hD : f.hV
        const vTop = (Math.abs(pl.v) * hv + radii[1]!) / hv
        if (vTop > 1 + slack) violations.push(`${r.id} at ${kf.hpf} hpf: v extent ${vTop.toFixed(3)}`)
        const wOut = Math.abs(pl.w) * f.hW + radii[2]!
        const wMax = skinHalfWidth(f, Math.min(1, vTop)) * (1 + slack) + 0.002
        if (wOut > wMax) violations.push(`${r.id} at ${kf.hpf} hpf: w extent ${wOut.toFixed(4)} > ${wMax.toFixed(4)}`)
      }
    }
    expect(violations).toEqual([])
  })

  // A neuromast is an epidermal sense organ: its record sits it at w = 1, so it straddles the
  // skin the way a pigment cell does.
  const IN_SKIN = new Set([...SURFACE, 'ZFA:0000243'])

  it('segment array templates fit the section at every instance', () => {
    const violations: string[] = []
    for (const r of drawn.filter((x) => x.geometry!.kind === 'segmentArray' && x.system !== 'fins')) {
      for (const kf of r.geometry!.keyframes) {
        const frame = model(kf.hpf)
        const p = structureParams(r, kf.hpf, frame.slMm) as unknown as SegmentArrayParams
        const inst = segmentInstances(p, frame)
        const t = p.template as unknown as { placement?: { v: number; w: number }; radiiMm?: (number | { value: number })[]; heightFraction?: number; widthMm?: number }
        const v = t.placement?.v ?? 0
        const w = Math.abs(t.placement?.w ?? 1)
        const mid = frame.frameAt((p.uStart + p.uEnd) / 2)
        const surface = IN_SKIN.has(r.id)
        const rw = surface ? 0 : t.radiiMm ? (typeof t.radiiMm[2] === 'number' ? t.radiiMm[2] : t.radiiMm[2]!.value * (mid.hD + mid.hV)) : (t.widthMm ?? 0) / 2
        for (const i of inst) {
          const f = frame.frameAt(i.u)
          // The template is built at the mid station and each instance scales it by the local body
          // (BG-45), so the width the instance draws is `rw` times its own z scale. Folding that in
          // makes the check hold at every station, and the tail no longer needs its own slack.
          const extent = w * f.hW + rw * i.placement.scale[2]!
          const slack = surface ? 0.05 : 0.12
          const wMax = skinHalfWidth(f, Math.min(0.95, Math.abs(v))) * (1 + slack) + 0.003
          if (extent > wMax) violations.push(`${r.id} at ${kf.hpf} hpf, u ${i.u.toFixed(2)}: w extent ${extent.toFixed(4)} > ${wMax.toFixed(4)}`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})

describe('myotome block (RN-02, RN-04)', () => {
  const myotome = byId.get('ZFA:0001056')!
  // The notochord lives in axial.json (WP-A1); the myotome must stay lateral to its sheath.
  const notochord = (() => {
    const raw = JSON.parse(fs.readFileSync(path.join(root, 'src/data/structures/axial.json'), 'utf8')) as unknown
    const parsed = parseFile('structures', raw)
    if (!parsed.ok) throw new Error('axial.json did not parse')
    return parsed.value.find((r) => r.id === 'ZFA:0000135')!
  })()

  /** The block at the array mid station against the local body. */
  function box(hpf: number) {
    const frame = model(hpf)
    const p = structureParams(myotome, hpf, frame.slMm) as unknown as SegmentArrayParams
    const uMid = (p.uStart + p.uEnd) / 2
    const f = frame.frameAt(uMid)
    const t = p.template as unknown as { placement?: { v: number; w: number }; heightFraction: number; widthMm: number }
    const v = t.placement?.v ?? 0
    const w = Math.abs(t.placement?.w ?? 1)
    const height = t.heightFraction * (f.hD + f.hV)
    const centre = v >= 0 ? v * f.hD : v * f.hV
    const np = structureParams(notochord, hpf, frame.slMm) as Record<string, unknown>
    const nr = np.radiusMm as number | { r0Mm: number; r1Mm: number }
    return {
      heightFraction: t.heightFraction,
      templateV: v,
      dorsalV: (centre + height / 2) / f.hD,
      ventralV: (centre - height / 2) / f.hV,
      wIn: w * f.hW - t.widthMm / 2,
      wOut: w * f.hW + t.widthMm / 2,
      skinHalfMm: skinHalfWidth(f, v),
      notochordRadiusMm: typeof nr === 'number' ? nr : nr.r0Mm,
    }
  }

  it('fills the trunk between the spine and the skin from 72 hpf', () => {
    for (const hpf of [72, 120, 168, 336, 720, 2160, 4320]) {
      const b = box(hpf)
      expect(b.heightFraction, `${hpf} hpf height`).toBeGreaterThanOrEqual(0.7)
      expect(b.dorsalV, `${hpf} hpf dorsal edge`).toBeGreaterThan(0.75)
      expect(-b.ventralV, `${hpf} hpf ventral edge`).toBeGreaterThan(0.5)
    }
  })

  // The somite lives in axial.json (WP-A1); over the handoff window the myotome copies its band.
  const somite = (() => {
    const raw = JSON.parse(fs.readFileSync(path.join(root, 'src/data/structures/axial.json'), 'utf8')) as unknown
    const parsed = parseFile('structures', raw)
    if (!parsed.ok) throw new Error('axial.json did not parse')
    return parsed.value.find((r) => r.id === 'ZFA:0000155')!
  })()

  /** heightFraction and placement v of the somite template at hpf. */
  function somiteBand(hpf: number): { heightFraction: number; v: number } {
    const p = structureParams(somite, hpf, model(hpf).slMm) as unknown as SegmentArrayParams
    const t = p.template as unknown as { placement?: { v: number }; heightFraction: number }
    return { heightFraction: t.heightFraction, v: t.placement?.v ?? 0 }
  }

  it('shares the somite band over the handoff window, so the trunk shows one band (RN-01, VR-07)', () => {
    for (const hpf of [14.66, 17, 19, 22, 24, 26, 29, 33]) {
      const b = box(hpf)
      const s = somiteBand(hpf)
      expect(b.heightFraction, `${hpf} hpf height`).toBeCloseTo(s.heightFraction, 2)
      expect(b.templateV, `${hpf} hpf placement`).toBeCloseTo(s.v, 2)
      expect(b.heightFraction, `${hpf} hpf RN-01 range`).toBeLessThanOrEqual(0.41)
    }
  })

  it('carries muscle to the ventral tail from 42 hpf, with no empty wedge (RN-02, VR-03)', () => {
    for (const hpf of [42, 48, 60, 72]) {
      const b = box(hpf)
      expect(b.dorsalV, `${hpf} hpf dorsal edge`).toBeGreaterThan(0.75)
      expect(-b.ventralV, `${hpf} hpf ventral edge`).toBeGreaterThan(0.5)
    }
  })

  it('never touches the skin and never covers the notochord', () => {
    for (const kf of myotome.geometry!.keyframes) {
      const p = structureParams(myotome, kf.hpf, model(kf.hpf).slMm) as unknown as SegmentArrayParams
      if (p.count <= 0) continue
      const b = box(kf.hpf)
      expect(b.wIn, `${kf.hpf} hpf medial face`).toBeGreaterThan(b.notochordRadiusMm)
      expect(Math.abs(b.dorsalV), `${kf.hpf} hpf dorsal edge`).toBeLessThan(0.95)
      expect(Math.abs(b.ventralV), `${kf.hpf} hpf ventral edge`).toBeLessThan(0.95)
      expect(b.wOut / b.skinHalfMm, `${kf.hpf} hpf lateral face`).toBeLessThan(0.95)
    }
  })
})

describe('finSheet record form', () => {
  const fold = byId.get('ZFA:0000040')!
  const caudal = byId.get('ZFA:0001058')!
  const pectoral = byId.get('ZFA:0001161')!

  it('draws the median fin fold as one wrapped sheet with no inverted triangle at 24 and 48 hpf (BG-59)', () => {
    for (const hpf of [24, 48, 120]) {
      const frame = model(hpf)
      const p = structureParams(fold, hpf, frame.slMm) as unknown as FinSheetParams
      expect(finSides(p)).toEqual([0])
      for (const lod of ['interactive', 'final'] as const) {
        const g = finSheet.build(p, frame, lod)
        expect(g.positions.length / 3).toBe(finSheet.vertexCount(lod, p))
        expect(windingReport(g)).toEqual({ zeroArea: 0, inverted: 0 })
      }
      // the fold reaches the vent on the ventral side: some vertex lies within one body height of toWorld(ventU, -1, 0)
      const g = finSheet.build(p, frame, 'final')
      const vent = frame.toWorld(frame.ventU, -1, 0)
      let best = Infinity
      for (let i = 0; i < g.positions.length / 3; i++) best = Math.min(best, Math.hypot(...sub(v3(g.positions, i), vent)))
      expect(best).toBeLessThan(0.1)
    }
  })

  it('draws the caudal fin as a forked fan with rays from 4.9 mm SL', () => {
    const before = structureParams(caudal, 168, model(168).slMm) as unknown as FinSheetParams
    expect(before.rays?.count ?? 0).toBe(0)
    const hpf = 720
    const frame = model(hpf)
    const p = structureParams(caudal, hpf, frame.slMm) as unknown as FinSheetParams
    expect(p.rays!.count).toBe(19)
    expect(p.forkDepthFraction).toBeGreaterThan(0.1)
    const g = finSheet.build(p, frame, 'final')
    expect(g.positions.length / 3).toBe(finSheet.vertexCount('final', p))
    expect(windingReport(g).zeroArea).toBe(0)
    const tip = frame.frameAt(1).p
    expect(g.bounds.max[0]).toBeGreaterThan(tip[0] + 0.5)
    // the fin spreads above and below the notochord tip
    expect(g.bounds.max[1] - tip[1]).toBeGreaterThan(0.5)
    expect(tip[1] - g.bounds.min[1]).toBeGreaterThan(0.5)
  })

  it('draws a paired pectoral fin with rays on both sides', () => {
    const hpf = 2160
    const frame = model(hpf)
    const p = structureParams(pectoral, hpf, frame.slMm) as unknown as FinSheetParams
    expect(finSides(p)).toHaveLength(2)
    const g = finSheet.build(p, frame, 'final')
    const noRays = finSheet.build({ ...p, rays: { ...p.rays!, count: 0 } }, frame, 'final')
    expect(g.positions.length).toBeGreaterThan(noRays.positions.length)
    expect(g.positions.length / 3).toBe(finSheet.vertexCount('final', p))
    // left and right blades
    expect(g.bounds.max[2]).toBeGreaterThan(frame.frameAt(0.28).hW)
    expect(g.bounds.min[2]).toBeLessThan(-frame.frameAt(0.28).hW)
    expect(windingReport(g).zeroArea).toBe(0)
  })

  it('accepts the legacy fold leg and the schema outline together', () => {
    const frame = model(48)
    const legacy: FinSheetParams = { base: { uStart: 0.42, uEnd: frame.ventU, side: 'fold', w: 0 }, outline: [[0, 0.02], [0.5, 0.2], [1, 0.02]], thicknessBaseMm: 0.01, thicknessEdgeMm: 0.004 }
    const schema: FinSheetParams = { base: { uStart: 0.42, uEnd: 1.2, side: 'dorsal', w: 0 }, outlineMm: [[0, 0.02], [0.5, 0.2], [1, 0.02]], thicknessBaseMm: 0.01, thicknessEdgeMm: 0.004 }
    const a = finSheet.build(legacy, frame, 'final')
    const b = finSheet.build(schema, frame, 'final')
    expect(a.positions.length).toBe(b.positions.length)
    expect(Math.abs(a.bounds.radius - b.bounds.radius)).toBeLessThan(0.05)
  })

  // The owner's visual reference notes: the fold is a narrow pale rim on the body outline,
  // never a slab (RN-01 to RN-04). The rim height is 0.20 to 0.35 of the local body height.
  it('keeps the median fin fold a rim of the tail height', () => {
    for (const hpf of [24, 42, 48, 72, 120, 336]) {
      const frame = model(hpf)
      const p = structureParams(fold, hpf, frame.slMm) as unknown as FinSheetParams
      const tail = frame.frameAt(0.8)
      const ratio = Math.max(...p.outlineMm!.map((q) => q[1])) / (tail.hD + tail.hV)
      expect(ratio, `fold rim at ${hpf} hpf`).toBeGreaterThan(0.15)
      expect(ratio, `fold rim at ${hpf} hpf`).toBeLessThan(0.4)
      // the built sheet hugs the skin: its box grows out of the skin box over the same u
      // range by at most half the tail height on any side.
      const skin: number[][] = []
      for (let i = 0; i <= 40; i++) {
        const u = p.base.uStart + ((1 - p.base.uStart) * i) / 40
        skin.push(frame.toWorld(u, 1, 0), frame.toWorld(u, -1, 0))
      }
      const g = finSheet.build(p, frame, 'final')
      const allowance = 0.5 * (tail.hD + tail.hV)
      for (let axis = 0; axis < 3; axis++) {
        const lo = Math.min(...skin.map((q) => q[axis]!))
        const hi = Math.max(...skin.map((q) => q[axis]!))
        expect(g.bounds.max[axis]! - hi, `fold beyond the skin at ${hpf} hpf, axis ${axis}`).toBeLessThan(allowance)
        expect(lo - g.bounds.min[axis]!, `fold beyond the skin at ${hpf} hpf, axis ${axis}`).toBeLessThan(allowance)
      }
    }
  })

  it('gives the adult caudal and pectoral fins their Parichy 2009 length in SL', () => {
    for (const hpf of [2160, 4320]) {
      const frame = model(hpf)
      const sl = frame.slMm!
      const g = buildStructure(caudal, frame, hpf, 'final')!
      const past = (g.bounds.max[0] - frame.frameAt(1).p[0]) / sl
      // D6 sets TL = 1.2 SL, so the caudal fin reaches about 0.2 SL past the notochord end
      expect(past, `caudal length at ${hpf} hpf`).toBeGreaterThan(0.17)
      expect(past, `caudal length at ${hpf} hpf`).toBeLessThan(0.23)
      const pec = structureParams(pectoral, hpf, sl) as unknown as FinSheetParams
      const blade = Math.max(...pec.outlineMm!.map((q) => q[1])) / sl
      expect(blade, `pectoral blade at ${hpf} hpf`).toBeGreaterThan(0.13)
      expect(blade, `pectoral blade at ${hpf} hpf`).toBeLessThan(0.17)
    }
  })
})

/** In-plane and through-plane radii of a segment array template, in mm at the mid station. */
function templateRadii(record: StructureRecord, hpf: number): number[] {
  const frame = model(hpf)
  const p = structureParams(record, hpf, frame.slMm) as unknown as SegmentArrayParams
  const t = p.template as unknown as { radiiMm: (number | { value: number })[] }
  const mid = frame.frameAt((p.uStart + p.uEnd) / 2)
  return t.radiiMm.map((x) => (typeof x === 'number' ? x : x.value * (mid.hD + mid.hV)))
}

/** Array pitch in mm: the arc length between two instances. */
function pitchMm(record: StructureRecord, hpf: number): number {
  const frame = model(hpf)
  const p = structureParams(record, hpf, frame.slMm) as unknown as SegmentArrayParams
  return ((p.uEnd - p.uStart) * frame.axisLengthMm) / p.count
}

describe('pigment cells and stripes', () => {
  const LARVAL_STRIPES = ['ZFA:0009091', 'ZFA:0005221', 'ZFA:0005222', 'ZFA:0005223', 'ZFA:0005224']

  it('draws larval melanophores as flat discs of 20 to 32 um', () => {
    for (const id of LARVAL_STRIPES) {
      const r = byId.get(id)!
      for (const hpf of [24, 48, 72]) {
        if (hpf < r.visibleFromHpf) continue
        const radii = [...templateRadii(r, hpf)].sort((a, b) => a - b)
        const diameter = 2 * radii[2]!
        expect(diameter, `${id} disc at ${hpf} hpf`).toBeGreaterThanOrEqual(0.02)
        expect(diameter, `${id} disc at ${hpf} hpf`).toBeLessThanOrEqual(0.032)
        // flat against the skin: the through-plane radius is at most half the in-plane one
        expect(radii[0]!, `${id} thickness at ${hpf} hpf`).toBeLessThanOrEqual(0.5 * radii[2]!)
      }
    }
  })

  it('draws the adult flank stripes as two continuous dark bands', () => {
    const bands = [byId.get('ZFA:0001463')!, byId.get('ZFA:0009091')!]
    const spans: [number, number][] = []
    for (const r of bands) {
      if (r.geometry?.kind === 'tube') {
        // A tube has no plate joints to test for overlap; it reads as continuous by
        // construction, replacing the array of plates that scalloped at each join (RN-07).
        let half = 0
        let v = 0
        for (const hpf of [1080, 4320]) {
          const frame = model(hpf)
          const p = structureParams(r, hpf, frame.slMm) as unknown as TubeParams
          if (p.path.type !== 'spine') throw new Error(`${r.id} expected a spine path`)
          const midU = (p.path.uStart + p.path.uEnd) / 2
          const wRadiusMm = sizeMm(p.radiusMm as Size, frame, midU)
          expect(wRadiusMm, `${r.id} radius at ${hpf} hpf`).toBeGreaterThan(0)
          v = p.path.v
          half = wRadiusMm * (p.ellipticity ?? 1) / (model(4320).frameAt(0.5).hD + model(4320).frameAt(0.5).hV)
        }
        expect(Math.abs(v), `${r.id} sits on the flank`).toBeLessThan(0.5)
        spans.push([v - half, v + half])
      } else {
        for (const hpf of [1080, 4320]) {
          expect(2 * templateRadii(r, hpf)[0]!, `${r.id} plate at ${hpf} hpf`).toBeGreaterThan(pitchMm(r, hpf))
        }
        const p = structureParams(r, 4320, model(4320).slMm) as unknown as SegmentArrayParams
        const t = p.template as unknown as { placement: { v: number } }
        const half = templateRadii(r, 4320)[1]! / (model(4320).frameAt(0.5).hD + model(4320).frameAt(0.5).hV)
        expect(Math.abs(t.placement.v), `${r.id} sits on the flank`).toBeLessThan(0.5)
        spans.push([t.placement.v - half, t.placement.v + half])
      }
    }
    // the two bands leave a pale interstripe between them
    const [a, b] = spans as [[number, number], [number, number]]
    expect(Math.min(a[0], b[0]) < Math.max(a[0], b[0])).toBe(true)
    expect(a[0] > b[1] || b[0] > a[1], 'the 1D and 1V bands do not overlap').toBe(true)
  })

  it('paints every melanophore record the documented D10 near black', () => {
    // Spec section 3.6 and src/core/palette.ts both name #23262B dark and #1B1F24 light.
    const nearBlack = COLOUR_ROLES.nearBlack
    for (const id of [...LARVAL_STRIPES, 'ZFA:0001463']) {
      const r = byId.get(id)!
      expect(r.colorOverride, id).toEqual({ dark: nearBlack.dark, light: nearBlack.light })
      expect(overrideFor(id)?.role, id).toBe('nearBlack')
    }
  })

  it('keeps the scale row sparse and the adult interstripe rows continuous', () => {
    // The scales read as a fine texture, so a disc covers a fraction of the pitch (brief C2 item 4).
    const scales = byId.get('ZFA:0000277')!
    for (const hpf of [1080, 4320]) {
      expect(2 * templateRadii(scales, hpf)[0]!, `ZFA:0000277 at ${hpf} hpf`).toBeLessThan(0.6 * pitchMm(scales, hpf))
    }
    // The X0 interstripe and the ventral iridophores are bands of the adult pattern, so their
    // neighbours overlap; at a quarter of the pitch each row read as a dotted line (review VIS-04).
    for (const id of ['ZFA:0009198', 'ZFA:0009199']) {
      const r = byId.get(id)!
      for (const hpf of [1080, 4320]) {
        expect(2 * templateRadii(r, hpf)[0]!, `${id} at ${hpf} hpf`).toBeGreaterThan(1.1 * pitchMm(r, hpf))
      }
    }
  })
})
