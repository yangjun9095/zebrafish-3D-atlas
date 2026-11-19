// Phase 2 integration: derived parts slice their source build (D9, DM-24, DM-34, DM-31), segment
// arrays scale each instance by the local body, and the sex toggle accepts "both".
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createBodyModel, type BodyFile } from '../../src/core/bodyModel.ts'
import { buildStructure, structureParams } from '../../src/core/primitives/buildStructure.ts'
import { HEART_PARTS } from '../../src/core/primitives/custom/heartLoop.ts'
import { derivedSourceOf, slicePart } from '../../src/core/primitives/derived.ts'
import { bodyScaleAt, segmentInstances, type SegmentArrayParams } from '../../src/core/primitives/segmentArray.ts'
import { presenceAt, presentIds } from '../../src/core/presence.ts'
import { UrlState } from '../../src/core/urlState.ts'
import { loadAtlas } from '../../src/data/index.ts'
import { createAtlasStore } from '../../src/state/store.ts'
import { loadGrowth } from '../../scripts/gen-body.ts'

const root = path.resolve(import.meta.dirname, '../..')
const body = JSON.parse(fs.readFileSync(path.join(root, 'src/data/body.json'), 'utf8')) as BodyFile
const model = createBodyModel(body, loadGrowth().growth)
const data = loadAtlas()
const byId = data.structuresById
const rec = (id: string) => {
  const r = byId.get(id)
  if (!r) throw new Error(`${id} is not a record`)
  return r
}

describe('derived parts', () => {
  it('resolve their source and part, and nothing else does', () => {
    expect(derivedSourceOf(rec('ZFA:0000471'), byId)).toMatchObject({ source: { id: 'ZFA:0000114' }, part: 'atrium' })
    expect(derivedSourceOf(rec('ZFA:0000006'), byId)).toMatchObject({ source: { id: 'ZFA:0000084' }, part: 'ball' })
    expect(derivedSourceOf(rec('ZFA:0000114'), byId)).toBeNull()
    expect(derivedSourceOf(rec('ZFA:0000008'), byId)).toBeNull()
  })

  it('slice every heart chamber out of the loop at 120 hpf with a valid index range', () => {
    const heart = rec('ZFA:0000114')
    const frame = model(120)
    const out = buildStructure(heart, frame, 120, 'final')!
    expect(Object.keys(out.parts ?? {})).toEqual(HEART_PARTS)
    let vertices = 0
    for (const part of HEART_PARTS) {
      const sub = slicePart(out, part)!
      expect(sub, part).not.toBeNull()
      vertices += sub.positions.length / 3
      for (let i = 0; i < sub.indices.length; i++) expect(sub.indices[i]).toBeLessThan(sub.positions.length / 3)
      expect(sub.bounds.radius).toBeLessThanOrEqual(out.bounds.radius + 1e-9)
      expect(sub.placement).toBe(out.placement)
    }
    // Neighbouring chambers share their boundary ring, so the parts overlap by one ring each.
    expect(vertices).toBeGreaterThanOrEqual(out.positions.length / 3)
    expect(slicePart(out, 'nope')).toBeNull()
  })

  it('give the eye parts and the ear parts a non-empty slice after the source mesh ends', () => {
    for (const [id, hpf] of [['ZFA:0000152', 120], ['ZFA:0000144', 720], ['ZFA:0000035', 4320], ['ZFA:0001617', 72], ['ZFA:0000431', 168]] as const) {
      const d = derivedSourceOf(rec(id), byId)!
      const frame = model(hpf)
      const params = structureParams(d.source, hpf, frame.slMm)
      const whole = buildStructure(d.source, frame, hpf, 'interactive', params)!
      const sub = slicePart(whole, d.part)
      expect(sub, `${id} at ${hpf} hpf`).not.toBeNull()
      expect(sub!.positions.length, id).toBeGreaterThan(0)
      expect(Array.from(sub!.positions).every(Number.isFinite), id).toBe(true)
    }
  })

  it('name the yolk ball and extension as parts of the yolk build', () => {
    const yolk = rec('ZFA:0000084')
    const at48 = buildStructure(yolk, model(48), 48, 'final')!
    expect(Object.keys(at48.parts ?? {})).toEqual(['ball', 'extension'])
    const ball = slicePart(at48, 'ball')!
    const frame = model(48)
    const c = frame.yolk!.ball!.centre
    for (let i = 0; i < ball.positions.length; i += 3 * 50) {
      const d = Math.hypot(ball.positions[i]! - c[0], ball.positions[i + 1]! - c[1], ball.positions[i + 2]! - c[2])
      expect(Math.abs(d - frame.yolk!.ball!.radiusMm)).toBeLessThan(1e-3)
    }
    // At 144 hpf the extension has gone: only the ball remains.
    const at144 = buildStructure(yolk, model(144), 144, 'final')!
    expect(Object.keys(at144.parts ?? {})).toEqual(['ball'])
  })
})

describe('segment arrays scale with the local body', () => {
  const somite = rec('ZFA:0000155')

  it('shrink a tail somite and keep the mid-station instance at unit scale', () => {
    const frame = model(24)
    const params = structureParams(somite, 24, frame.slMm) as unknown as SegmentArrayParams
    const right = segmentInstances(params, frame).filter((i) => i.side === 'right')
    const mid = right.reduce((a, b) => (Math.abs(b.u - (params.uStart + params.uEnd) / 2) < Math.abs(a.u - (params.uStart + params.uEnd) / 2) ? b : a))
    const tail = right[right.length - 1]!
    expect(mid.placement.scale[1]).toBeCloseTo(1, 1)
    expect(mid.placement.scale[2]).toBeCloseTo(1, 1)
    expect(tail.placement.scale[1]).toBeLessThan(0.6)
    expect(tail.placement.scale[2]).toBeLessThan(0.6)
    expect(tail.placement.scale[0]).toBe(1)
  })

  it('takes the dorsal half-height for a dorsal template and clamps the ratios', () => {
    const frame = model(16)
    const uMid = 0.45
    const dorsal = bodyScaleAt(frame, uMid, 0.3, 0.8)
    const fm = frame.frameAt(uMid)
    const fi = frame.frameAt(0.3)
    expect(dorsal.y).toBeCloseTo(Math.min(3, Math.max(0.1, fi.hD / fm.hD)), 9)
    const straddle = bodyScaleAt(frame, uMid, 0.3, 0)
    expect(straddle.y).toBeLessThanOrEqual(dorsal.y + 1e-9)
    expect(bodyScaleAt(frame, uMid, 0.999, 0).y).toBeGreaterThanOrEqual(0.1)
  })
})

describe('sex "both"', () => {
  const ovary = { id: 'ovary', visibleFromHpf: 600, modelEndHpf: 4320, fadeInHpf: 0, fadeOutHpf: 0, sexSpecific: 'female' as const }
  const testis = { ...ovary, id: 'testis', sexSpecific: 'male' as const }

  it('draws every sex-specific record while female or male keep one', () => {
    expect(presenceAt(ovary, 1000, { sex: 'both' }).present).toBe(true)
    expect(presenceAt(testis, 1000, { sex: 'both' }).present).toBe(true)
    expect(presenceAt(testis, 1000, { sex: 'female' }).phase).toBe('hiddenBySex')
    expect(presentIds([ovary, testis], 1000, { sex: 'both' })).toEqual(['ovary', 'testis'])
  })

  it('round-trips through the URL as sex=b', () => {
    expect(UrlState.parse({ sex: 'b' }).sex).toBe('b')
    const store = createAtlasStore()
    store.getState().setSex('both')
    expect(store.getState().toUrl().sex).toBe('b')
    store.getState().applyUrl({ ...store.getState().toUrl(), sex: 'm' })
    expect(store.getState().sex).toBe('male')
    store.getState().applyUrl({ ...store.getState().toUrl(), sex: 'b' })
    expect(store.getState().sex).toBe('both')
  })
})
