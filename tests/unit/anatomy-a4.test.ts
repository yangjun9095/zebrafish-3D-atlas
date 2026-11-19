// WP-A4: the digestive, excretory, endocrine and reproductive records build at every
// keyframe, stay inside the skin, meet at the gut junctions, carry their handoff windows,
// obey the sex toggle, and the gutLoop builder keeps its radius plateaus, bows and
// attachments (BG-35).
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createBodyModel, type BodyFile, type BodyFrame } from '../../src/core/bodyModel.ts'
import { presenceAt } from '../../src/core/presence.ts'
import { buildStructure } from '../../src/core/primitives/buildStructure.ts'
import { gutAttachment, gutCentreline, gutLoop, type GutLoopParams } from '../../src/core/primitives/custom/gutLoop.ts'
import { countsFor } from '../../src/core/primitives/tessellation.ts'
import { applyQuat, type Vec3 } from '../../src/core/primitives/vec3.ts'
import { HandoffsFile, StructuresFile, type StructureRecord } from '../../src/core/schema.ts'
import { loadGrowth } from '../../scripts/gen-body.ts'
import { SWEEP_PRODUCT_MAX } from '../../scripts/validate/rulesBuild.ts'

const root = path.resolve(import.meta.dirname, '../..')
const readJson = (rel: string): unknown => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))
const body = readJson('src/data/body.json') as BodyFile
const model = createBodyModel(body, loadGrowth().growth)

const FILES = ['digestive', 'excretory', 'endocrine', 'reproductive'] as const
const records = StructuresFile.parse(FILES.flatMap((f) => readJson(`src/data/structures/${f}.json`) as unknown[]))
const byId = new Map(records.map((r) => [r.id, r]))
const handoffs = HandoffsFile.parse(readJson('src/data/handoffs/a4-digestive-excretory-endocrine-reproductive.json'))

/** Surface structures that sit on or in the skin by design. */
const SURFACE = new Set(['ZFA:0001118', 'ZFA:0000066', 'ZFA:0000298', 'ZFA:0000547'])
const GUT_SEGMENT_IDS = ['ZFA:0000204', 'ZFA:0001076', 'ZFA:0001323', 'ZFA:0000706']

/** World positions of a build: local-frame kinds carry a placement. */
function worldPositions(out: NonNullable<ReturnType<typeof buildStructure>>): Vec3[] {
  const pts: Vec3[] = []
  for (let i = 0; i < out.positions.length; i += 3) {
    let p: Vec3 = [out.positions[i]!, out.positions[i + 1]!, out.positions[i + 2]!]
    if (out.placement) {
      const q = applyQuat(out.placement.quaternion, p)
      p = [q[0] + out.placement.position[0], q[1] + out.placement.position[1], q[2] + out.placement.position[2]]
    }
    pts.push(p)
  }
  return pts
}

/** Superellipse measure of a world point against the nearest station; 1 is the skin. */
function skinMeasure(frame: BodyFrame, p: Vec3): number {
  let best = Infinity
  let s = frame.stations[0]!
  for (const st of frame.stations) {
    const d = (st.p[0] - p[0]) ** 2 + (st.p[1] - p[1]) ** 2 + (st.p[2] - p[2]) ** 2
    if (d < best) { best = d; s = st }
  }
  const d: Vec3 = [p[0] - s.p[0], p[1] - s.p[1], p[2] - s.p[2]]
  const a = d[0] * s.n[0] + d[1] * s.n[1] + d[2] * s.n[2]
  const b = d[0] * s.b[0] + d[1] * s.b[1] + d[2] * s.b[2]
  const e = Math.max(2, s.exponent)
  return Math.pow(Math.abs(a) / (a >= 0 ? s.hD : s.hV), e) + Math.pow(Math.abs(b) / s.hW, e)
}

describe('WP-A4 records', () => {
  it('holds the 38 records of the four systems in their system files', () => {
    expect(records).toHaveLength(38)
    for (const f of FILES) {
      for (const r of readJson(`src/data/structures/${f}.json`) as StructureRecord[]) expect(r.system, r.id).toBe(f)
    }
    expect(byId.get('ZFA:0000669')!.alsoIn).toEqual(['hematopoietic_immune', 'endocrine'])
  })

  it('builds every keyframe at both levels with finite geometry and sweeps under the E036 limit', () => {
    let builds = 0
    for (const r of records) {
      if (!r.geometry) continue
      for (const kf of r.geometry.keyframes) {
        for (const lod of ['interactive', 'final'] as const) {
          const out = buildStructure(r, model(kf.hpf), kf.hpf, lod)
          expect(out, `${r.id} ${kf.hpf} hpf`).not.toBeNull()
          expect(out!.positions.every(Number.isFinite), `${r.id} ${kf.hpf} hpf ${lod}`).toBe(true)
          if (out!.sweep) expect(out!.sweep.product, `${r.id} ${kf.hpf} hpf ${lod}`).toBeLessThan(SWEEP_PRODUCT_MAX)
          builds++
        }
      }
    }
    expect(builds).toBeGreaterThan(600)
  })

  it('keeps every internal mesh inside the skin at every keyframe', () => {
    const failures: string[] = []
    for (const r of records) {
      if (!r.geometry || SURFACE.has(r.id)) continue
      for (const kf of r.geometry.keyframes) {
        const frame = model(kf.hpf)
        const out = buildStructure(r, frame, kf.hpf, 'final')!
        const pts = worldPositions(out)
        let worst = 0
        let outside = 0
        for (const p of pts) {
          const m = skinMeasure(frame, p)
          if (m > 1.05) outside++
          worst = Math.max(worst, m)
        }
        // A tube's round cap or a sample between two stations may cross the sampled skin by a sliver.
        if (outside / pts.length > 0.02) failures.push(`${r.id} ${r.name} ${kf.hpf} hpf: ${(100 * outside / pts.length).toFixed(1)} percent outside, worst ${worst.toFixed(2)}`)
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })

  it('gut segment records meet at one radius and one point at every shared time', () => {
    const rows = countsFor('gutLoop', 'final').rows
    for (let i = 0; i < GUT_SEGMENT_IDS.length - 1; i++) {
      const a = byId.get(GUT_SEGMENT_IDS[i]!)!
      const b = byId.get(GUT_SEGMENT_IDS[i + 1]!)!
      const times = a.geometry!.keyframes.map((k) => k.hpf).filter((t) => b.geometry!.keyframes.some((k) => k.hpf === t))
      expect(times.length).toBeGreaterThan(5)
      for (const t of times) {
        const frame = model(t)
        const pa = paramsAt(a, t, frame)
        const pb = paramsAt(b, t, frame)
        const la = gutCentreline(pa, frame, rows)
        const lb = gutCentreline(pb, frame, rows)
        const end = la.rows[rows]!
        const start = lb.rows[0]!
        expect(Math.abs(end.aD - start.aD), `${a.name} to ${b.name} at ${t} hpf`).toBeLessThan(1e-6)
        const gap = Math.hypot(end.p[0] - start.p[0], end.p[1] - start.p[1], end.p[2] - start.p[2])
        expect(gap, `${a.name} to ${b.name} at ${t} hpf`).toBeLessThan(0.02 * frame.axisLengthMm + 2 * end.aD)
      }
    }
  })

  it('writes the D9 windows into the records (E034 shape) and names the handoff in the notes', () => {
    expect(handoffs).toHaveLength(7)
    for (const h of handoffs) {
      if (!('startHpf' in h.window)) continue
      for (const id of h.from) {
        const r = byId.get(id)!
        expect(r.modelEndHpf, `${h.id} from ${id}`).toBe(h.window.endHpf)
        expect(r.overrideNote ?? '', `${h.id} from ${id}`).toContain(h.id)
        expect(r.geometry?.handoffOut, `${h.id} from ${id}`).toBe(h.id)
      }
      for (const id of h.to) {
        const r = byId.get(id)
        if (!r) continue // the pancreas group node lives in groups.json
        expect(r.visibleFromHpf, `${h.id} to ${id}`).toBe(Math.min(h.window.startHpf, r.startHpf))
        expect(r.overrideNote ?? '', `${h.id} to ${id}`).toContain(h.id)
      }
    }
  })

  it('draws the ovary or the testis by the sex toggle and both without one', () => {
    const ovary = byId.get('ZFA:0000403')!
    const testis = byId.get('ZFA:0000598')!
    expect(ovary.sexSpecific).toBe('female')
    expect(testis.sexSpecific).toBe('male')
    expect(presenceAt(ovary, 800, { sex: 'female' }).present).toBe(true)
    expect(presenceAt(ovary, 800, { sex: 'male' }).phase).toBe('hiddenBySex')
    expect(presenceAt(testis, 800, { sex: 'male' }).present).toBe(true)
    expect(presenceAt(testis, 800, { sex: 'female' }).phase).toBe('hiddenBySex')
    expect(presenceAt(ovary, 800).present && presenceAt(testis, 800).present).toBe(true)
  })
})

/** The record's interpolated gutLoop parameters at t (the same path as the viewer). */
function paramsAt(r: StructureRecord, t: number, frame: BodyFrame): GutLoopParams {
  const g = r.geometry as unknown as Record<string, unknown>
  const params: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(g)) if (!['kind', 'builder', 'keyframes', 'estimate', 'sources', 'handoffOut', 'geometryEndHpf', 'lodHint', 'boundsMarginMm'].includes(k)) params[k] = v
  const kfs = g.keyframes as Record<string, unknown>[]
  for (const kf of kfs) {
    if (kf.hpf as number > t) break
    for (const [k, v] of Object.entries(kf)) if (k !== 'hpf' && k !== 'sizeRefSl') params[k] = v
  }
  void frame
  return params as unknown as GutLoopParams
}

describe('gutLoop builder', () => {
  const f48 = model(48)
  const base: GutLoopParams = {
    path: [{ u: 0.22, v: -0.4, w: 0 }, { u: 0.3, v: -0.45, w: 0 }, { u: 0.4, v: -0.45, w: 0 }, { u: 0.5, v: -0.45, w: 0 }, { u: f48.ventU, v: -0.85, w: 0 }],
    segments: {
      esophagus: { s0: 0, s1: 0.15, rMm: 0.01 },
      intestinalBulb: { s0: 0.15, s1: 0.45, rMm: 0.03 },
      midIntestine: { s0: 0.45, s1: 0.75, rMm: 0.02 },
      posteriorIntestine: { s0: 0.75, s1: 1, rMm: 0.012 },
    },
    bulbOffsetW: 0,
    countLoops: 0,
    attachments: [{ name: 'liver', s0: 0.2, s1: 0.4, thetaDeg: 180 }],
  }
  const rows = countsFor('gutLoop', 'final').rows

  it('holds each segment radius on its plateau and blends across the junctions', () => {
    const line = gutCentreline(base, f48, rows)
    const at = (s: number) => line.rows[Math.round(s * rows)]!.aD
    expect(at(0.07)).toBeCloseTo(0.01, 6)
    expect(at(0.3)).toBeCloseTo(0.03, 6)
    expect(at(0.6)).toBeCloseTo(0.02, 6)
    expect(at(0.9)).toBeCloseTo(0.012, 6)
    const junction = at(0.15)
    expect(junction).toBeGreaterThan(0.01)
    expect(junction).toBeLessThan(0.03)
    // The blend zone spans about four rows, so no single row steps more than half a plateau difference.
    for (let i = 1; i <= rows; i++) expect(Math.abs(line.rows[i]!.aD - line.rows[i - 1]!.aD)).toBeLessThan(0.01)
  })

  it('bows the bulb and folds the mid range with r x kappa under the E036 limit', () => {
    for (const p of [{ ...base, bulbOffsetW: -0.6 }, { ...base, countLoops: 3 }, { ...base, bulbOffsetW: -1, countLoops: 3 }]) {
      for (const lod of ['interactive', 'final'] as const) {
        const out = gutLoop.build(p, f48, lod)
        expect(out.positions.length / 3).toBe(gutLoop.vertexCount(lod, p))
        expect(out.sweep!.product).toBeLessThan(SWEEP_PRODUCT_MAX)
        expect(Object.keys(out.parts ?? {})).toEqual(['esophagus', 'intestinalBulb', 'midIntestine', 'posteriorIntestine'])
      }
    }
    const straight = gutCentreline(base, f48, rows)
    const bowed = gutCentreline({ ...base, bulbOffsetW: -0.6 }, f48, rows)
    const i = Math.round(0.3 * rows)
    const dz = bowed.rows[i]!.p[2] - straight.rows[i]!.p[2]
    expect(dz).toBeGreaterThan(0)              // +z is the left side (D4)
    expect(bowed.rows[0]!.p).toEqual(straight.rows[0]!.p)
  })

  it('returns an attachment on the tube surface, one radius from the centreline', () => {
    const att = gutAttachment(base, f48, 'liver', rows)!
    expect(att).not.toBeNull()
    const line = gutCentreline(base, f48, rows)
    const row = line.rows[Math.round(att.s * rows)]!
    const d = Math.hypot(att.position[0] - row.p[0], att.position[1] - row.p[1], att.position[2] - row.p[2])
    expect(d).toBeCloseTo(row.aD, 6)
    expect(att.position[2]).toBeGreaterThan(row.p[2]) // theta 180 is the left face
    expect(gutAttachment(base, f48, 'spleen')).toBeNull()
  })
})
