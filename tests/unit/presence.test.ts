// BG-44, DM-36: fade opacity and scale, presence at the axis end, defaults and sex toggle.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { crossfadeInWindow, handoffsFor, perSegmentWindow, seedingHandoff } from '../../src/core/handoffs.ts'
import {
  defaultFades,
  firstFullyVisibleHpf,
  hasMeshAt,
  presenceAt,
  presentIds,
  stageContaining,
} from '../../src/core/presence.ts'
import { HandoffsFile, StagesFile } from '../../src/core/schema.ts'
import { handoffsRaw } from '../../src/data/handoffs/all.ts'

const stages = StagesFile.parse(JSON.parse(readFileSync('src/data/stages.json', 'utf8'))).stages
const handoffs = HandoffsFile.parse(handoffsRaw)

const rec = { visibleFromHpf: 10, modelEndHpf: 20, fadeInHpf: 2, fadeOutHpf: 4 }

describe('presenceAt', () => {
  it('is absent outside the window and ramps inside the fades', () => {
    expect(presenceAt(rec, 9.99)).toMatchObject({ present: false, opacity: 0, scale: 0.7, phase: 'before' })
    expect(presenceAt(rec, 10)).toMatchObject({ present: false, opacity: 0, phase: 'fadeIn' })
    expect(presenceAt(rec, 11)).toMatchObject({ present: true, opacity: 0.5, scale: 0.85, transparent: true })
    expect(presenceAt(rec, 12)).toMatchObject({ present: true, opacity: 1, scale: 1, transparent: false, phase: 'full' })
    expect(presenceAt(rec, 18)).toMatchObject({ opacity: 0.5, phase: 'fadeOut' })
    expect(presenceAt(rec, 20)).toMatchObject({ present: false, opacity: 0, phase: 'fadeOut' })
    expect(presenceAt(rec, 20.01)).toMatchObject({ present: false, phase: 'after' })
    expect(presenceAt(rec, 12).fade).toBe(1)
  })
  it('keeps a record clamped to 4320 hpf fully visible at the axis end (DM-36)', () => {
    const clamped = { visibleFromHpf: 10, modelEndHpf: 4320, fadeInHpf: 0.5, fadeOutHpf: 0 }
    expect(presenceAt(clamped, 4320)).toMatchObject({ present: true, opacity: 1, scale: 1, phase: 'full' })
    expect(presenceAt(clamped, 4319.9).opacity).toBe(1)
    expect(presenceAt(clamped, 4320.1).present).toBe(false)
  })
  it('is fully visible at visibleFromHpf when fadeInHpf is 0', () => {
    const r = { visibleFromHpf: 0, modelEndHpf: 30, fadeInHpf: 0, fadeOutHpf: 6 }
    expect(presenceAt(r, 0)).toMatchObject({ present: true, opacity: 1 })
    expect(presenceAt(r, 27).opacity).toBeCloseTo(0.5, 9)
  })
  it('takes the smaller of the two fades when they overlap', () => {
    const r = { visibleFromHpf: 0, modelEndHpf: 2, fadeInHpf: 2, fadeOutHpf: 2 }
    expect(presenceAt(r, 1).opacity).toBe(0.5)
    expect(presenceAt(r, 0.5).opacity).toBe(0.25)
    expect(presenceAt(r, 1.5).opacity).toBe(0.25)
  })
  it('hides a sex-specific record while the toggle does not match (DM-32)', () => {
    const ovary = { ...rec, sexSpecific: 'female' as const }
    expect(presenceAt(ovary, 15, { sex: 'male' })).toMatchObject({ present: false, phase: 'hiddenBySex' })
    expect(presenceAt(ovary, 15, { sex: 'female' }).present).toBe(true)
    expect(presenceAt(ovary, 15).present).toBe(true)
  })
})

describe('presentIds, firstFullyVisibleHpf, hasMeshAt', () => {
  const records = [
    { id: 'ZFA:0000002', ...rec, geometry: { geometryEndHpf: 15 } },
    { id: 'ZFA:0000001', visibleFromHpf: 0, modelEndHpf: 4320, fadeInHpf: 0, fadeOutHpf: 0, geometry: null },
    { id: 'ZFA:0000003', visibleFromHpf: 30, modelEndHpf: 40, fadeInHpf: 1, fadeOutHpf: 1, geometry: {} },
  ]
  it('returns sorted ids of the present records', () => {
    expect(presentIds(records, 15)).toEqual(['ZFA:0000001', 'ZFA:0000002'])
    expect(presentIds(records, 35)).toEqual(['ZFA:0000001', 'ZFA:0000003'])
    expect(presentIds(records, 30)).toEqual(['ZFA:0000001'])
  })
  it('gives the UI-20 target', () => {
    expect(firstFullyVisibleHpf(rec)).toBe(12)
    expect(firstFullyVisibleHpf({ visibleFromHpf: 96, modelEndHpf: 4320, fadeInHpf: 24, fadeOutHpf: 0 })).toBe(120)
  })
  it('has a mesh only with geometry and before geometryEndHpf', () => {
    expect(hasMeshAt(records[0], 14)).toBe(true)
    expect(hasMeshAt(records[0], 16)).toBe(false)
    expect(hasMeshAt(records[1], 100)).toBe(false)
    expect(hasMeshAt(records[2], 35)).toBe(true)
  })
})

describe('defaultFades (DM-22, DM-36)', () => {
  it('uses 5 percent of the containing stage', () => {
    expect(stageContaining(stages, 24, 'start')?.shortLabel).toBe('prim-5')
    expect(stageContaining(stages, 24, 'end')?.shortLabel).toBe('26+ somites')
    const f = defaultFades({ startHpf: 24, endHpf: 48, visibleFromHpf: 24, modelEndHpf: 48 }, stages)
    expect(f.fadeInHpf).toBeCloseTo(0.3, 9)
    expect(f.fadeOutHpf).toBeCloseTo(0.3, 9)
    const larva = defaultFades({ startHpf: 96, endHpf: 4320, visibleFromHpf: 96, modelEndHpf: 720 }, stages)
    expect(larva.fadeInHpf).toBeCloseTo(1.2, 9)
    expect(larva.fadeOutHpf).toBeCloseTo(10.8, 9)
  })
  it('writes 0 at the axis clamp and at 0 hpf', () => {
    const f = defaultFades({ startHpf: 0, endHpf: 17520, visibleFromHpf: 0, modelEndHpf: 4320 }, stages)
    expect(f).toEqual({ fadeInHpf: 0, fadeOutHpf: 0 })
    const adultStart = defaultFades({ startHpf: 2160, endHpf: 17520, visibleFromHpf: 2160, modelEndHpf: 4320 }, stages)
    expect(adultStart.fadeInHpf).toBeCloseTo(108, 9)
    expect(adultStart.fadeOutHpf).toBe(0)
  })
  it('never exceeds the window', () => {
    const f = defaultFades({ startHpf: 10, endHpf: 10.33, visibleFromHpf: 10, modelEndHpf: 10.01 }, stages)
    expect(f.fadeInHpf + f.fadeOutHpf).toBeLessThanOrEqual(0.01 + 1e-12)
  })
})

describe('handoff cross-fades', () => {
  it('fades from out and to in over the window', () => {
    const w = { startHpf: 42, endHpf: 48 }
    expect(crossfadeInWindow(w, 40)).toMatchObject({ from: 1, to: 0, active: false })
    expect(crossfadeInWindow(w, 45)).toMatchObject({ from: 0.5, to: 0.5, active: true })
    expect(crossfadeInWindow(w, 50)).toMatchObject({ from: 0, to: 1, active: false })
  })
  it('finds the rows of a record and the per-segment window', () => {
    const heart = handoffsFor(handoffs, 'ZFA:0000114')
    expect(heart.asFrom.map((h) => h.id)).toEqual(['heart_cone_tube', 'heart_tube_chambers'])
    expect(heart.asDriver).toHaveLength(2)
    expect(seedingHandoff(handoffs, 'ZFA:0000471')?.id).toBe('heart_tube_chambers')
    expect(seedingHandoff(handoffs, 'ZFA:0000114')).toBeUndefined()
    const somites = handoffs.find((h) => h.id === 'somites_myotomes')!
    expect(perSegmentWindow(somites, 12)).toEqual({ startHpf: 14, endHpf: 16 })
  })
})
