// WP-A2: the nervous and sensory records build, stay under the skin, chain through the
// D9 handoffs, and the three custom builders follow their schema shapes.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createBodyModel, type BodyFile, type BodyFrame } from '../../src/core/bodyModel.ts'
import { earVesicle } from '../../src/core/primitives/custom/earVesicle.ts'
import { depositedCount, primordiumMover, teardrop } from '../../src/core/primitives/custom/primordiumMover.ts'
import { buildStructure, isMirroredPair, mirrorGeometry, structureParams, twinPlacementOf } from '../../src/core/primitives/buildStructure.ts'
import type { GeometryOut, Lod } from '../../src/core/primitives/types.ts'
import { applyQuat } from '../../src/core/primitives/vec3.ts'
import { presenceAt } from '../../src/core/presence.ts'
import { HandoffsFile, StagesFile, StructuresFile } from '../../src/core/schema.ts'
import type { StructureRecord } from '../../src/core/schema.ts'

const root = path.resolve(import.meta.dirname, '../..')
const read = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8')) as unknown
const body = read('src/data/body.json') as BodyFile
const stages = StagesFile.parse(read('src/data/stages.json'))
const model = createBodyModel(body, stages.growth)
const nervous = StructuresFile.parse(read('src/data/structures/nervous.json'))
const sensory = StructuresFile.parse(read('src/data/structures/sensory.json'))
const handoffs = HandoffsFile.parse(read('src/data/handoffs/a2-nervous-sensory.json'))
const records = [...nervous, ...sensory]
const byId = new Map(records.map((r) => [r.id, r]))
const rec = (id: string): StructureRecord => {
  const r = byId.get(id)
  if (!r) throw new Error(`${id} is not a WP-A2 record`)
  return r
}
const LODS: Lod[] = ['interactive', 'final']

const NERVOUS_IDS = ['ZFA:0000132', 'ZFA:0000131', 'ZFA:0000133', 'ZFA:0001135', 'ZFA:0000079', 'ZFA:0000101', 'ZFA:0000032', 'ZFA:0000118', 'ZFA:0000019', 'ZFA:0000128', 'ZFA:0000445', 'ZFA:0000042', 'ZFA:0000029', 'ZFA:0000100', 'ZFA:0000545', 'ZFA:0001064', 'ZFA:0000075', 'ZFA:0000022', 'ZFA:0000295', 'ZFA:0001314', 'ZFA:0000175']
const SENSORY_IDS = ['ZFA:0000107', 'ZFA:0000152', 'ZFA:0000144', 'ZFA:0000035', 'ZFA:0000138', 'ZFA:0000051', 'ZFA:0000217', 'ZFA:0001617', 'ZFA:0000431', 'ZFA:0000048', 'ZFA:0000130', 'ZFA:0001157', 'ZFA:0000243']

/** World-space vertex positions of a build, both sides of a mirrored pair. */
function worldPositions(r: StructureRecord, out: GeometryOut, frame: BodyFrame, hpf: number): Float32Array[] {
  if (!out.placement) return [out.positions]
  const place = (g: GeometryOut, pl: NonNullable<GeometryOut['placement']>): Float32Array => {
    const arr = new Float32Array(g.positions.length)
    for (let i = 0; i < arr.length; i += 3) {
      const p = applyQuat(pl.quaternion, [g.positions[i]!, g.positions[i + 1]!, g.positions[i + 2]!])
      arr[i] = p[0] + pl.position[0]; arr[i + 1] = p[1] + pl.position[1]; arr[i + 2] = p[2] + pl.position[2]
    }
    return arr
  }
  const sides = [place(out, out.placement)]
  if (isMirroredPair(r)) {
    const twin = twinPlacementOf(r, structureParams(r, hpf, frame.slMm), frame)
    if (twin) sides.push(place(mirrorGeometry(out), twin))
  }
  return sides
}

/** Largest excess of |dv/h|^E + |dw/hW|^E over 1 at the nearest station inside [u0, u1]; 0 when inside. */
function skinExcess(positions: Float32Array, frame: BodyFrame, u0: number, u1: number): number {
  const st = frame.stations.filter((s) => s.u >= u0 && s.u <= u1)
  let worst = -Infinity
  for (let i = 0; i < positions.length; i += 3) {
    let best = st[0]!, bd = Infinity
    for (const s of st) {
      const d = [positions[i]! - s.p[0], positions[i + 1]! - s.p[1], positions[i + 2]! - s.p[2]]
      const dist = d[0]! * d[0]! + d[1]! * d[1]! + d[2]! * d[2]!
      if (dist < bd) { bd = dist; best = s }
    }
    const d = [positions[i]! - best.p[0], positions[i + 1]! - best.p[1], positions[i + 2]! - best.p[2]]
    const dv = d[0]! * best.n[0] + d[1]! * best.n[1] + d[2]! * best.n[2]
    const dw = d[0]! * best.b[0] + d[1]! * best.b[1] + d[2]! * best.b[2]
    const h = dv >= 0 ? best.hD : best.hV
    const E = best.exponent
    worst = Math.max(worst, Math.pow(Math.pow(Math.abs(dv) / h, E) + Math.pow(Math.abs(dw) / best.hW, E), 1 / E) - 1)
  }
  return Math.max(0, worst)
}

describe('WP-A2 record set', () => {
  it('holds the nervous and sensory records of the task, each with geometry in its system file', () => {
    expect(nervous.map((r) => r.id).sort()).toEqual([...NERVOUS_IDS].sort())
    expect(sensory.map((r) => r.id).sort()).toEqual([...SENSORY_IDS].sort())
    for (const r of nervous) expect(r.system, r.id).toBe('nervous')
    for (const r of sensory) expect(r.system, r.id).toBe('sensory')
    for (const r of records) expect(r.geometry, r.id).not.toBeNull()
    expect(rec('ZFA:0000118').alsoIn).toEqual(['endocrine'])
    expect(rec('ZFA:0000019').alsoIn).toEqual(['endocrine'])
    expect(rec('ZFA:0000022').alsoIn).toEqual(['axial'])
  })

  it('builds every keyframe of every drawable record at both levels with finite vertices', () => {
    for (const r of records) {
      const g = r.geometry!
      if (g.kind === 'derived') continue
      for (const kf of g.keyframes) {
        for (const lod of LODS) {
          const out = buildStructure(r, model(kf.hpf), kf.hpf, lod)
          expect(out, `${r.id} ${kf.hpf}`).not.toBeNull()
          expect(out!.positions.length, `${r.id} ${kf.hpf}`).toBeGreaterThan(0)
          let finite = true
          for (let i = 0; i < out!.positions.length; i++) finite &&= Number.isFinite(out!.positions[i]!)
          expect(finite, `${r.id} ${kf.hpf}`).toBe(true)
        }
      }
    }
  }, 60000)

  it('keeps the brain, ear and cord inside the skin at the headline stages', () => {
    const inside = [
      ['ZFA:0000079', 0, 0.2], ['ZFA:0000101', 0, 0.3], ['ZFA:0000128', 0, 0.35], ['ZFA:0000445', 0, 0.35], ['ZFA:0000100', 0.05, 0.4],
      ['ZFA:0000545', 0.1, 0.4], ['ZFA:0000075', 0.15, 1], ['ZFA:0000217', 0.05, 0.4], ['ZFA:0000295', 0, 0.35], ['ZFA:0000130', 0, 0.2],
    ] as const
    for (const [id, u0, u1] of inside) {
      const r = rec(id)
      for (const hpf of [24, 48, 120, 720, 4320]) {
        if (hpf < r.visibleFromHpf || hpf > r.modelEndHpf) continue
        const frame = model(hpf)
        const out = buildStructure(r, frame, hpf, 'final')!
        for (const side of worldPositions(r, out, frame, hpf)) {
          expect(skinExcess(side, frame, u0, u1), `${id} ${hpf} hpf`).toBeLessThan(0.02)
        }
      }
    }
  })

  it('draws the midbrain hindbrain boundary as a waist between the two regions (D17)', () => {
    const mhb = rec('ZFA:0000042')
    expect(mhb.uiParent).toBe('ZFA:0000008')
    expect(mhb.visibleFromHpf).toBe(16)
    const midbrain = rec('ZFA:0000128')
    const hindbrain = rec('ZFA:0000029')
    const medulla = rec('ZFA:0000545')
    for (const hpf of [16, 19, 24, 48, 120, 720, 4320]) {
      const frame = model(hpf)
      const ring = structureParams(mhb, hpf, frame.slMm) as { path: { uStart: number; uEnd: number }; radiusMm: number }
      const back = hpf <= 24 ? hindbrain : medulla
      const neck = structureParams(back, Math.max(hpf, back.visibleFromHpf), frame.slMm).path as { uStart: number }
      // The ring spans the station where the midbrain has tapered away and the hindbrain begins.
      expect(ring.path.uStart, `${hpf} hpf`).toBeLessThan(neck.uStart)
      expect(ring.path.uEnd, `${hpf} hpf`).toBeGreaterThan(neck.uStart)
      // It stays inside the widest point of the tectum, so the outline reads as a constriction.
      const widest = Math.max(...(structureParams(midbrain, hpf, frame.slMm).radiiMm as number[]).slice(1))
      expect(ring.radiusMm, `${hpf} hpf`).toBeLessThan(widest)
    }
  })

  it('runs the spinal cord from the medulla end and stops it before the urostyle bend', () => {
    const medulla = rec('ZFA:0000545')
    const cord = rec('ZFA:0000075')
    for (const hpf of [24, 48, 120, 720, 2160, 4320]) {
      const m = structureParams(medulla, hpf, model(hpf).slMm).path as { uEnd: number; v: number }
      const c = structureParams(cord, hpf, model(hpf).slMm).path as { uStart: number; uEnd: number; v: number }
      expect(c.uStart, `${hpf} hpf`).toBeCloseTo(m.uEnd, 6)
      if (hpf >= 504) expect(c.uEnd).toBeLessThanOrEqual(0.92 + 1e-9)
    }
    expect(structureParams(cord, 4320, 25).flexionDeg).toBeUndefined()
  })
})

describe('WP-A2 handoffs', () => {
  it('writes every D9 window into the from and to records (E034)', () => {
    for (const h of handoffs) {
      if (!('startHpf' in h.window)) continue
      const { startHpf, endHpf } = h.window
      if (h.withinRecord) continue
      for (const id of h.to) {
        const r = rec(id)
        expect(r.visibleFromHpf, `${h.id} ${id}`).toBeCloseTo(Math.min(r.startHpf, startHpf), 6)
        expect(r.overrideNote ?? '', `${h.id} ${id}`).toContain(h.id)
      }
      for (const id of h.from) {
        const r = rec(id)
        const ends = [r.modelEndHpf, r.geometry && 'geometryEndHpf' in r.geometry ? r.geometry.geometryEndHpf : undefined]
        expect(ends, `${h.id} ${id}`).toContain(endHpf)
        expect(r.overrideNote ?? '', `${h.id} ${id}`).toContain(h.id)
      }
    }
  })

  it('carries the eye alias chain and derives the three parts from the eye build', () => {
    const eye = rec('ZFA:0000107')
    expect(eye.aliasChain.map((a) => [a.fromHpf, a.toHpf])).toEqual([[11.66, 19], [19, 24]])
    const out = buildStructure(eye, model(48), 48, 'final')!
    expect(Object.keys(out.parts ?? {})).toEqual(['rpe', 'retina', 'lens'])
    for (const [id, part] of [['ZFA:0000152', 'retina'], ['ZFA:0000144', 'rpe'], ['ZFA:0000035', 'lens']] as const) {
      const g = rec(id).geometry!
      expect(g.kind).toBe('derived')
      if (g.kind === 'derived') { expect(g.sourceId).toBe('ZFA:0000107'); expect(g.part).toBe(part) }
    }
    const rpe = rec('ZFA:0000144')
    expect(rpe.fadeInHpf).toBe(2)
    expect(presenceAt(rpe, 25).opacity).toBeCloseTo(0.5, 5)
    expect(presenceAt(rpe, 26).opacity).toBe(1)
  })

  it('keeps the inner ear inside the otic vesicle lumen until the vesicle hands off', () => {
    const vesicle = rec('ZFA:0000051')
    const ear = rec('ZFA:0000217')
    expect(vesicle.modelEndHpf).toBe(72)
    expect(ear.visibleFromHpf).toBe(19)
    for (const hpf of [19, 24, 36, 48, 60, 66]) {
      const v = structureParams(vesicle, hpf, null) as { lengthMm: number; widthMm: number; heightMm: number; wallMm: number; placement: { u: number; v: number; w: number } }
      const e = structureParams(ear, hpf, null) as typeof v
      expect(e.placement, `${hpf} hpf`).toEqual(v.placement)
      expect(e.lengthMm + 2 * v.wallMm, `${hpf} hpf`).toBeLessThan(v.lengthMm)
      expect(e.widthMm + 2 * v.wallMm, `${hpf} hpf`).toBeLessThan(v.widthMm)
      expect(e.heightMm + 2 * v.wallMm, `${hpf} hpf`).toBeLessThan(v.heightMm)
    }
    const at72 = structureParams(ear, 72, 3.25) as { canals: { present: boolean } }
    expect(at72.canals.present).toBe(true)
    const at66 = structureParams(ear, 66, null) as { canals: { present: boolean } }
    expect(at66.canals.present).toBe(false)
  })
})

describe('earVesicle builder', () => {
  const base = { placement: { u: 0.21, v: 0.2, w: 0.6 }, lengthMm: 0.13, widthMm: 0.09, heightMm: 0.11, wallMm: 0.015, canals: { loopDiameterMm: 0.09, tubeDiameterMm: 0.015, present: false } }
  it('draws one sphere per listed otolith and records the combined part', () => {
    const f = model(48)
    for (const lod of LODS) {
      const none = earVesicle.build({ ...base, otoliths: [] }, f, lod)
      expect(none.positions.length / 3).toBe(earVesicle.vertexCount(lod, { ...base, otoliths: [] }))
      expect(none.parts!.otoliths!.vertexCount).toBe(0)
      const two = earVesicle.build({ ...base, otoliths: [{ diameterMm: 0.02, pole: 'anterior' }, { diameterMm: 0.025, pole: 'posterior' }] }, f, lod)
      expect(two.positions.length / 3).toBe(earVesicle.vertexCount(lod, { ...base, otoliths: [{ diameterMm: 0.02, pole: 'anterior' }, { diameterMm: 0.025, pole: 'posterior' }] }))
      expect(two.parts!.otoliths!.vertexCount).toBe(two.parts!.otolith_anterior!.vertexCount + two.parts!.otolith_posterior!.vertexCount)
      expect(two.parts!.otoliths!.vertexStart).toBe(two.parts!.otolith_anterior!.vertexStart)
      expect(two.parts!.canals).toBeUndefined()
      const withCanals = earVesicle.build({ ...base, otoliths: [], canals: { ...base.canals, present: true } }, f, lod)
      expect(withCanals.parts!.canals!.vertexCount).toBeGreaterThan(0)
      expect(withCanals.positions.length / 3).toBe(earVesicle.vertexCount(lod, { ...base, otoliths: [], canals: { ...base.canals, present: true } }))
    }
  })
  it('accepts body-height-fraction sizes', () => {
    const g = earVesicle.build({ ...base, otoliths: [], lengthMm: { value: 0.3, unit: 'bodyHeightFraction' } }, model(120), 'interactive')
    const f = model(120).frameAt(0.21)
    expect(g.bounds.max[0] - g.bounds.min[0]).toBeCloseTo(0.3 * (f.hD + f.hV), 4)
  })
})

describe('primordiumMover builder and the neuromast array', () => {
  it('is blunt at the posterior (leading) end and takes Size leaves', () => {
    expect(teardrop(0.5)).toBeGreaterThan(teardrop(-0.5))
    const params = { placement: { u: 0.6, v: 0, w: 0.8 }, lengthMm: 0.1, widthMm: { value: 0.02, unit: 'mm' as const }, heightMm: 0.04, speedMmPerHour: 0.1, deposits: { countSomitesPerDeposit: 5, neuromastDiameterMm: 0.02 } }
    for (const lod of LODS) {
      const g = primordiumMover.build(params, model(30), lod)
      expect(g.positions.length / 3).toBe(primordiumMover.vertexCount(lod, params))
      expect(Math.abs(g.bounds.max[0] - g.bounds.min[0] - 0.1)).toBeLessThan(0.01)   // round caps add one floor radius per end
    }
    expect(depositedCount(0.315, 0.021, 5)).toBeCloseTo(3, 6)
    expect(depositedCount(0, 0.021, 5)).toBe(0)
  })

  it('deposits the neuromasts behind the migrating primordium without moving the earlier ones', () => {
    const prim = rec('ZFA:0001157')
    const neuromast = rec('ZFA:0000243')
    const g = neuromast.geometry!
    expect(g.kind).toBe('segmentArray')
    for (const hpf of [30, 36, 42]) {
      const u = (structureParams(prim, hpf, null).placement as { u: number }).u
      const n = structureParams(neuromast, hpf, null) as { uStart: number; uEnd: number; count: number }
      expect(n.uEnd).toBeCloseTo(n.uStart + n.count * 0.105, 3)
      const expected = (u - n.uStart) / 0.105 - 0.3
      expect(Math.abs(n.count - expected), `${hpf} hpf`).toBeLessThan(0.2)
    }
    expect((structureParams(neuromast, 48, null) as { count: number }).count).toBe(6)
    expect((structureParams(neuromast, 120, 3.6) as { count: number }).count).toBe(12)
    const nerve = rec('ZFA:0000175')
    for (const hpf of [30, 36, 42]) {
      const u = (structureParams(prim, hpf, null).placement as { u: number }).u
      const p = structureParams(nerve, hpf, null).path as { uEnd: number }
      expect(Math.abs(p.uEnd - u), `${hpf} hpf`).toBeLessThan(0.02)
    }
  })
})
