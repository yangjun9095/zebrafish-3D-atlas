// Phase 1 review fixes: E036 on the heart loop (R-02), the flexion clamp (R4), the
// blastodisc above the yolk apex (R1), the ventral envelope of the yolk (R3), the
// validator helpers (R-03, R-04), the URL sync back-off (F9), label eligibility (F10),
// the instance capacity of a segmentArray (F6) and the screenshot thresholds (F13).
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createBodyModel, type BodyFile } from '../../src/core/bodyModel.ts'
import { EXTENSION_AXIS_INSET_MM, buildStructure } from '../../src/core/primitives/buildStructure.ts'
import { StructuresFile } from '../../src/core/schema.ts'
import type { StructureRecord } from '../../src/core/schema.ts'
import { structuresRaw } from '../../src/data/structures/all.ts'
import { composeAtlasStore } from '../../src/state/slices/compose.ts'
import { startUrlSync } from '../../src/state/urlSync.ts'
import { instanceCapacityOf } from '../../src/viewer/handles.ts'
import { labelEligible } from '../../src/viewer/labelEligibility.ts'
import { CAP_CLEARANCE_MM, YOLK_ENVELOPE_MARGIN_MM, loadGrowth } from '../../scripts/gen-body.ts'
import { DORSAL_MIN_CHANGED_FRACTION, NON_BLANK } from '../../scripts/screenshot.ts'
import { firstDifference } from '../../scripts/validate/rulesBody.ts'
import { SWEEP_PRODUCT_MAX } from '../../scripts/validate/rulesBuild.ts'
import { checkCanonicalWindows } from '../../scripts/validate/rulesStructures.ts'
import { createReport } from '../../scripts/validate/report.ts'
import type { StructureRecord as ValidatorRecord } from '../../scripts/validate/types.ts'

const root = path.resolve(import.meta.dirname, '../..')
const body = JSON.parse(fs.readFileSync(path.join(root, 'src/data/body.json'), 'utf8')) as BodyFile
const model = createBodyModel(body, loadGrowth().growth)
const structures = StructuresFile.parse(structuresRaw)
const record = (id: string): StructureRecord => structures.find((r) => r.id === id)!

describe('E036: the heart loop sweep (R-02)', () => {
  it('keeps r x kappa under 0.9 at every keyframe and both levels', () => {
    const heart = record('ZFA:0000114')
    for (const kf of heart.geometry!.keyframes) {
      for (const lod of ['interactive', 'final'] as const) {
        const out = buildStructure(heart, model(kf.hpf), kf.hpf, lod)
        expect(out?.sweep, `${kf.hpf} hpf`).toBeDefined()
        expect(out!.sweep!.product, `${kf.hpf} hpf ${lod}`).toBeLessThan(SWEEP_PRODUCT_MAX)
      }
    }
  })
  it('reports the statistics of every sweep kind', () => {
    for (const id of ['ZFA:0000135', 'ZFA:0000075', 'ZFA:0001094']) {
      const out = buildStructure(record(id), model(48), 48, 'final')
      expect(out?.sweep?.maxRadiusMm, id).toBeGreaterThan(0)
      expect(out?.sweep?.product, id).toBeLessThan(SWEEP_PRODUCT_MAX)
    }
  })
})

describe('notochord flexion clamp (R4)', () => {
  it('keeps every flexed row inside the dorsal half-height of the body', () => {
    const notochord = record('ZFA:0000135')
    for (const hpf of [504, 720, 2160, 4320]) {
      const frame = model(hpf)
      const out = buildStructure(notochord, frame, hpf, 'final')!
      let worst = -Infinity
      for (let i = 0; i < out.positions.length; i += 3) {
        const x = out.positions[i]!
        const y = out.positions[i + 1]!
        // Stations near the tail: compare the vertex height with the skin above the nearest station.
        let best = frame.stations[0]!
        for (const s of frame.stations) if (Math.abs(s.p[0] - x) < Math.abs(best.p[0] - x)) best = s
        if (best.u < 0.9) continue
        worst = Math.max(worst, y - (best.p[1] + best.n[1] * best.hD))
      }
      expect(worst, `${hpf} hpf`).toBeLessThanOrEqual(1e-6)
    }
  })
})

describe('body model after the review (R1, R3, R13)', () => {
  it('holds the blastodisc top above the yolk apex at every early keyframe', () => {
    for (const k of body.keyframes) {
      if (!k.cap) continue
      const a = Math.min(k.cap.baseRadiusMm, k.yolkRadiusMm!)
      const baseY = Math.sqrt(k.yolkRadiusMm! ** 2 - a * a)
      expect(baseY + k.cap.heightMm, `${k.hpf} hpf`).toBeGreaterThanOrEqual(k.yolkRadiusMm! + CAP_CLEARANCE_MM - 1e-9)
    }
  })
  it('runs the ventral skin down to the yolk ball equator and below the extension axis from 36 hpf', () => {
    for (const hpf of [36, 48, 72, 120]) {
      const f = model(hpf)
      const ball = f.yolk!.ball!
      expect(f.frameAt(ball.u).hV, `${hpf} hpf ball`).toBeGreaterThanOrEqual(ball.depthMm - 1e-6)
      const ext = f.yolk!.extension
      if (!ext) continue
      for (let i = 0; i <= 8; i++) {
        const u = ext.u0 + ((ext.u1 - ext.u0) * i) / 8
        const r = ext.r0Mm + (ext.r1Mm - ext.r0Mm) * (i / 8)
        // The axis sits EXTENSION_AXIS_INSET_MM inside the skin, so the extension's top lies inside the body.
        expect(f.frameAt(u).hV - EXTENSION_AXIS_INSET_MM - r, `${hpf} hpf u ${u.toFixed(2)}`).toBeLessThanOrEqual(f.frameAt(u).hV)
      }
    }
    expect(YOLK_ENVELOPE_MARGIN_MM).toBeGreaterThan(0)
  })
  it('tapers the adult snout as a convex wedge', () => {
    const k = body.keyframes.find((k) => k.hpf === 2160)!
    expect(k.profile[0]!.hD / k.profile[1]!.hD).toBeGreaterThan(0.4)
  })
})

describe('validator helpers (R-03, R-04)', () => {
  it('names the first differing leaf', () => {
    expect(firstDifference({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }, 'k')).toBeNull()
    expect(firstDifference({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] }, 'k')).toBe('k.a[1].b')
    expect(firstDifference([1, 2], [1], 'k')).toBe('k.length')
    expect(firstDifference(1, '1', 'k')).toBe('k')
  })
  it('rejects a chorion that outlives D8 and accepts the seed', () => {
    const records = new Map(structures.map((r) => [r.id, r as unknown as ValidatorRecord]))
    const clean = createReport()
    checkCanonicalWindows(records, clean)
    expect(clean.findings).toEqual([])
    const chorion = { ...records.get('ZFA:0000329')!, modelEndHpf: 72, fadeOutHpf: 24 }
    const bad = createReport()
    checkCanonicalWindows(new Map([['ZFA:0000329', chorion]]), bad)
    expect(bad.findings.map((f) => f.code)).toEqual(['E026', 'E026'])
    expect(bad.findings[0]!.message).toContain('modelEndHpf 72 differs from the canonical 30')
  })
})

describe('URL sync back-off (F9)', () => {
  it('survives a throwing replaceState and writes again later', () => {
    vi.useFakeTimers()
    try {
      const store = composeAtlasStore({ stageIndexAt: () => -1, presentIds: () => [] })
      let calls = 0
      const history = {
        state: null,
        replaceState() {
          calls++
          if (calls === 1) throw new Error('SecurityError')
        },
      }
      const stop = startUrlSync(store, { throttleMs: 100, history, location: { pathname: '/', search: '', hash: '' } })
      store.getState().setTime(48)
      vi.advanceTimersByTime(100)
      expect(calls).toBe(1)
      // The failed write is retried after a doubled wait, not rethrown.
      vi.advanceTimersByTime(250)
      expect(calls).toBe(2)
      stop()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('viewer helpers (F6, F10, F13)', () => {
  it('sizes the instance buffer from the largest count of the record', () => {
    expect(instanceCapacityOf(record('ZFA:0000155'))).toBe(31)
    expect(instanceCapacityOf(record('ZFA:0000135'))).toBe(64)
  })
  it('decides label eligibility from store state', () => {
    const eye = record('ZFA:0000107')
    const base = { presentIds: [eye.id], hiddenSystems: [], hiddenStructures: [], isolate: false, selection: [] }
    expect(labelEligible(eye, base)).toBe(true)
    expect(labelEligible(eye, { ...base, presentIds: [] })).toBe(false)
    expect(labelEligible(eye, { ...base, hiddenSystems: ['sensory'] })).toBe(false)
    expect(labelEligible(eye, { ...base, isolate: true, selection: ['ZFA:0000114'] })).toBe(false)
    expect(labelEligible(eye, { ...base, isolate: true, selection: [eye.id] })).toBe(true)
    expect(labelEligible(record('ZFA:0000008'), { ...base, presentIds: ['ZFA:0000008'] })).toBe(false)
  })
  it('keeps the QP-34 fraction for the lateral views and a lower one for the dorsal views', () => {
    expect(NON_BLANK.minChangedFraction).toBe(0.03)
    expect(DORSAL_MIN_CHANGED_FRACTION).toBeLessThan(NON_BLANK.minChangedFraction)
  })
})
