// WP-A3: cardiovascular, blood and immune, gills and swim bladder records, the heartLoop
// builder, and the skin test: every A3 keyframe builds inside the body cross-section.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createBodyModel, type BodyFile, type BodyFrame } from '../../src/core/bodyModel.ts'
import { buildStructure, structureParams } from '../../src/core/primitives/buildStructure.ts'
import {
  HEART_PARTS, heartCentreline, heartLoop, isConeStage, ventricleLengthMm, type HeartLoopParams,
} from '../../src/core/primitives/custom/heartLoop.ts'
import { applyQuat } from '../../src/core/primitives/vec3.ts'
import { StructuresFile, type StructureRecord } from '../../src/core/schema.ts'
import { loadGrowth } from '../../scripts/gen-body.ts'

const root = path.resolve(import.meta.dirname, '../..')
const read = (name: string) => StructuresFile.parse(JSON.parse(fs.readFileSync(path.join(root, 'src/data/structures', name), 'utf8'))) as StructureRecord[]
const cardio = read('cardiovascular.json')
const hema = read('hematopoietic_immune.json')
const resp = read('respiratory.json')
const all = [...cardio, ...hema, ...resp]
const byId = new Map(all.map((r) => [r.id, r]))
const body = JSON.parse(fs.readFileSync(path.join(root, 'src/data/body.json'), 'utf8')) as BodyFile
const model = createBodyModel(body, loadGrowth().growth)

const ARTERIES = ['ZFA:0000014', 'ZFA:0000011', 'ZFA:0005004', 'ZFA:0000604', 'ZFA:0005002', 'ZFA:0001053']
const VEINS = ['ZFA:0000477', 'ZFA:0000423', 'ZFA:0000186', 'ZFA:0000180', 'ZFA:0001286', 'ZFA:0001052', 'ZFA:0005934']
/** Vertices may sit this far outside the skin section (mm): below the pixel size of a 1600 px lateral view. */
const SKIN_TOLERANCE_MM = 0.0025

/** Positive when `p` lies outside the body cross-section at its station (mm, approximate). */
function outsideMm(frame: BodyFrame, p: [number, number, number]): number {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < frame.stations.length; i++) {
    const s = frame.stations[i]!
    const d = Math.hypot(p[0] - s.p[0], p[1] - s.p[1], p[2] - s.p[2])
    if (d < bestD) { bestD = d; best = i }
  }
  let u = frame.stations[best]!.u
  for (let k = 0; k < 3; k++) {
    const f = frame.frameAt(Math.max(0, Math.min(1, u)))
    const d = [p[0] - f.p[0], p[1] - f.p[1], p[2] - f.p[2]]
    u += (d[0]! * f.t[0] + d[1]! * f.t[1] + d[2]! * f.t[2]) / frame.axisLengthMm
  }
  const f = frame.frameAt(Math.max(0, Math.min(1, u)))
  const d = [p[0] - f.p[0], p[1] - f.p[1], p[2] - f.p[2]]
  const y = d[0]! * f.n[0] + d[1]! * f.n[1] + d[2]! * f.n[2]
  const z = d[0]! * f.b[0] + d[1]! * f.b[1] + d[2]! * f.b[2]
  const h = y >= 0 ? f.hD : f.hV
  const value = Math.pow(Math.abs(y) / h, f.exponent) + Math.pow(Math.abs(z) / f.hW, f.exponent)
  return (Math.pow(value, 1 / f.exponent) - 1) * Math.min(h, f.hW)
}

/** Worst skin distance over a sample of the built vertices, in world space. */
function worstOutside(record: StructureRecord, hpf: number): number {
  const frame = model(hpf)
  const out = buildStructure(record, frame, hpf, 'final')
  if (!out) return -Infinity
  const step = Math.max(1, Math.floor(out.positions.length / 3 / 3000))
  let worst = -Infinity
  for (let i = 0; i < out.positions.length; i += 3 * step) {
    let p: [number, number, number] = [out.positions[i]!, out.positions[i + 1]!, out.positions[i + 2]!]
    const pl = out.placement
    if (pl) {
      const q = applyQuat(pl.quaternion, [p[0] * pl.scale[0], p[1] * pl.scale[1], p[2] * pl.scale[2]])
      p = [q[0] + pl.position[0], q[1] + pl.position[1], q[2] + pl.position[2]]
    }
    worst = Math.max(worst, outsideMm(frame, p))
  }
  return worst
}

describe('WP-A3 record files', () => {
  it('hold one record per id in the file of its system', () => {
    expect(all.length).toBe(new Set(all.map((r) => r.id)).size)
    for (const r of cardio) expect(r.system, r.id).toBe('cardiovascular')
    for (const r of hema) expect(r.system, r.id).toBe('hematopoietic_immune')
    for (const r of resp) expect(r.system, r.id).toBe('respiratory')
    expect(cardio.length).toBeGreaterThanOrEqual(20)
    expect(hema.length).toBe(6)
    expect(resp.length).toBe(7)   // pharyngeal arch 3-7 ZFA:0001613 moved to skeletal.json (D5; review DR-01)
  })

  it('colour only the D10 arteries red and veins blue', () => {
    for (const r of all) {
      if (ARTERIES.includes(r.id)) expect(r.colorOverride, r.id).toEqual({ dark: '#E31A1C', light: '#A50F15' })
      else if (VEINS.includes(r.id)) expect(r.colorOverride, r.id).toEqual({ dark: '#1F78B4', light: '#08519C' })
      else expect(r.colorOverride, r.id).toBeNull()
    }
  })

  it('write the D8 and DM-20 windows', () => {
    const posterior = byId.get('ZFA:0001278')!
    expect(posterior.visibleFromHpf).toBe(96)
    expect(posterior.fadeInHpf).toBe(24)
    expect(byId.get('ZFA:0000180')!.visibleFromHpf).toBe(24)          // caudal vein drawn from 24 hpf (DM-20)
    expect(byId.get('ZFA:0001285')!.visibleFromHpf).toBe(22)          // intersegmental sprouts from 22 hpf
    expect(byId.get('ZFA:0000076')!.visibleFromHpf).toBe(55)          // swim bladder seeded by the bud handoff
    expect(byId.get('ZFA:0005335')!.modelEndHpf).toBe(60)
    expect(byId.get('ZFA:0001077')!.modelEndHpf).toBe(72)             // thymus primordium hands over to the thymus
    expect(byId.get('ZFA:0001078')!.visibleFromHpf).toBe(72)
    for (const r of all) {
      if (r.endHpf > 4320 && r.modelEndHpf === 4320) expect(r.fadeOutHpf, r.id).toBe(0)
      expect(r.fadeInHpf + r.fadeOutHpf, r.id).toBeLessThanOrEqual(r.modelEndHpf - r.visibleFromHpf)
    }
  })

  it('keep a keyframe at every headline stage inside each window', () => {
    const headline = [24, 42, 48, 72, 120, 168, 336, 504, 720, 1080, 2160, 4320]
    for (const r of all) {
      const g = r.geometry
      if (!g) continue
      const end = g.geometryEndHpf ?? r.modelEndHpf
      const times = new Set(g.keyframes.map((k) => k.hpf))
      expect(g.keyframes[0]!.hpf, r.id).toBe(r.visibleFromHpf)
      for (const h of headline) if (h > r.visibleFromHpf && h <= end) expect(times.has(h), `${r.id} at ${h} hpf`).toBe(true)
      for (const k of g.keyframes) expect(k.sizeRefSl !== undefined, `${r.id} sizeRefSl at ${k.hpf}`).toBe(k.hpf >= 72)
    }
  })
})

describe('the heart (D9, DM-24, BG-34)', () => {
  const heart = byId.get('ZFA:0000114')!

  it('is one record with the five ZFIN heart terms and derived chambers', () => {
    expect(heart.aliasChain.map((a) => a.zfaId)).toEqual(['ZFA:0000028', 'ZFA:0000115', 'ZFA:0000149', 'ZFA:0000360'])
    expect(heart.aliasChain[0]!.fromHpf).toBe(11.66)
    expect(heart.aliasChain[3]!.toHpf).toBe(42)
    expect(heart.visibleFromHpf).toBe(19)
    const chambers: [string, string][] = [['ZFA:0000471', 'atrium'], ['ZFA:0000009', 'ventricle'], ['ZFA:0000173', 'bulbus'], ['ZFA:0000154', 'sinusVenosus']]
    for (const [id, part] of chambers) {
      const r = byId.get(id)!
      expect(r.geometry?.kind).toBe('derived')
      if (r.geometry?.kind === 'derived') {
        expect(r.geometry.sourceId).toBe('ZFA:0000114')
        expect(r.geometry.part).toBe(part)
        expect(HEART_PARTS).toContain(part)
      }
      expect(r.visibleFromHpf).toBe(42)
      expect(r.uiParent).toBe('ZFA:0000114')
    }
  })

  it('steps cone, tube, C, S and scales the adult ventricle to 4.28 percent of SL', () => {
    const stageAt = (h: number) => (structureParams(heart, h, model(h).slMm) as unknown as HeartLoopParams).stage
    expect(stageAt(19)).toBe('cone')
    expect(stageAt(24)).toBe('tube')
    expect(stageAt(36)).toBe('C')
    expect(stageAt(48)).toBe('S')
    const p30 = structureParams(heart, 30, null) as unknown as HeartLoopParams
    expect(p30.bendDeg).toBe(0)                                            // straight before looping onset (D8)
    const adult = structureParams(heart, 4320, 25) as unknown as HeartLoopParams
    const ventricle = adult.segments.ventricle.rMm as number
    expect(ventricle * 2).toBeCloseTo(ventricleLengthMm(25), 6)
    const larva = structureParams(heart, 168, 4.1) as unknown as HeartLoopParams
    expect((larva.segments.ventricle.rMm as number) * 2).toBeCloseTo(ventricleLengthMm(4.1), 6)
  })

  it('draws the cone with its apex dorsal and the loop to the right of the atrium', () => {
    const f19 = model(19)
    const cone = structureParams(heart, 19, null) as unknown as HeartLoopParams
    expect(isConeStage(cone, f19)).toBe(true)
    const line = heartCentreline(cone, f19)
    expect(line[line.length - 1]![1]).toBeGreaterThan(0)                  // local y is dorsal
    const f48 = model(48)
    const s = structureParams(heart, 48, null) as unknown as HeartLoopParams
    expect(isConeStage(s, f48)).toBe(false)
    const loop = heartCentreline(s, f48)
    const end = loop[loop.length - 1]!
    expect(end[0]).toBeLessThan(0)                                         // outflow anterior of the venous pole
    expect(end[2]).toBeLessThan(0)                                         // and to the right (local z is left)
    for (const lod of ['interactive', 'final'] as const) {
      const g = heartLoop.build(s, f48, lod)
      expect(g.sweep!.product).toBeLessThan(0.9)                           // E036
      expect(Object.keys(g.parts ?? {})).toEqual(HEART_PARTS)
    }
  })
})

describe('A3 geometry against the body frame', () => {
  it('stacks the trunk and tail vessels under the notochord in order', () => {
    const v = (id: string, hpf: number, index: number) => {
      const p = structureParams(byId.get(id)!, hpf, model(hpf).slMm) as { path: { points: { v: number }[] } }
      return p.path.points[index]!.v
    }
    for (const hpf of [24, 48, 120, 720, 4320]) {
      expect(v('ZFA:0000014', hpf, 4)).toBeGreaterThan(v('ZFA:0000477', hpf, 4))   // aorta above the cardinal vein
      expect(v('ZFA:0000011', hpf, 4)).toBeGreaterThan(v('ZFA:0000180', hpf, 4))   // caudal artery above the caudal vein
      expect(v('ZFA:0000014', hpf, 4)).toBeLessThan(0)
    }
  })

  it('keeps every keyframe of every A3 record inside the skin', () => {
    const failures: string[] = []
    for (const r of all) {
      const g = r.geometry
      if (!g || g.kind === 'derived') continue
      for (const kf of g.keyframes) {
        const worst = worstOutside(r, kf.hpf)
        if (worst > SKIN_TOLERANCE_MM) failures.push(`${r.id} ${r.name} at ${kf.hpf} hpf: ${worst.toFixed(4)} mm outside`)
      }
    }
    expect(failures).toEqual([])
  }, 30_000)
})
