// QP-13: bracketing, smoothstep, per-type rules, inheritance, the count
// rule, the sizeRefSl rescale and its NaN guard.
import { describe, expect, it } from 'vitest'
import {
  bracket, countInstances, interpolateParams, lerpAngleDeg, rescaleFactor, resolveKeyframe, smoothstep, weightBetween,
} from '../../src/core/interpolation.ts'
import { slScaleFrom, type GrowthPoint } from '../../src/core/growth.ts'
import { GROWTH_FALLBACK } from '../../scripts/gen-body.ts'

const growth: GrowthPoint[] = GROWTH_FALLBACK
const keys = [{ hpf: 10 }, { hpf: 16 }, { hpf: 24 }, { hpf: 48 }]

describe('bracket and smoothstep', () => {
  it('returns (i, i + 1) with k[i].hpf <= t < k[i + 1].hpf and clamps at the ends', () => {
    expect(bracket(keys, 5)).toEqual([0, 0])
    expect(bracket(keys, 10)).toEqual([0, 1])
    expect(bracket(keys, 15.999)).toEqual([0, 1])
    expect(bracket(keys, 16)).toEqual([1, 2])
    expect(bracket(keys, 30)).toEqual([2, 3])
    expect(bracket(keys, 48)).toEqual([3, 3])
    expect(bracket(keys, 1000)).toEqual([3, 3])
    expect(bracket(keys, Number.NaN)).toEqual([0, 0])
  })

  it('weights 0, 0.5 and 1 at the start, midpoint and end with flat ends', () => {
    expect(weightBetween(10, 20, 10)).toBe(0)
    expect(weightBetween(10, 20, 15)).toBeCloseTo(0.5, 12)
    expect(weightBetween(10, 20, 20)).toBe(1)
    const eps = 1e-4
    expect((smoothstep(eps) - smoothstep(0)) / eps).toBeLessThan(1e-3)
    expect((smoothstep(1) - smoothstep(1 - eps)) / eps).toBeLessThan(1e-3)
    expect(Math.abs(smoothstep(1e-7) / 1e-7)).toBeLessThan(1e-6)
    expect(weightBetween(10, 10, 10)).toBe(0)                 // coincident keyframes never divide by zero
  })
})

describe('count rule (BG-42)', () => {
  it('draws floor(c) full instances and one at the fractional scale', () => {
    const c = 5 + (9 - 5) * 0.4
    expect(c).toBeCloseTo(6.6, 12)
    expect(countInstances(c)).toEqual({ full: 6, partialScale: expect.closeTo(0.6, 9), visible: 7 })
    expect(countInstances(7)).toEqual({ full: 7, partialScale: 0, visible: 7 })
    expect(countInstances(0)).toEqual({ full: 0, partialScale: 0, visible: 0 })
  })

  it('never decreases between keyframes of a non-decreasing series', () => {
    const kf = [{ hpf: 10, count: 1 }, { hpf: 16, count: 14 }, { hpf: 24, count: 30 }]
    let prev = -1
    for (let t = 8; t <= 26; t += 0.1) {
      const c = interpolateParams({}, kf, t, null).count as number
      expect(c).toBeGreaterThanOrEqual(prev)
      prev = c
    }
  })
})

describe('per-type rules', () => {
  it('lerps lengths and dimensionless leaves, steps booleans and enums, wraps angles', () => {
    const kf = [
      { hpf: 0, radiusMm: 1, u: 0.2, segmented: false, stage: 'cone', headingDeg: 170 },
      { hpf: 10, radiusMm: 3, u: 0.4, segmented: true, stage: 'tube', headingDeg: -170 },
    ]
    const mid = interpolateParams({}, kf, 5, null)
    expect(mid.radiusMm).toBeCloseTo(2, 12)
    expect(mid.u).toBeCloseTo(0.3, 12)
    expect(mid.segmented).toBe(false)
    expect(mid.stage).toBe('cone')
    expect(Math.abs(mid.headingDeg as number)).toBeCloseTo(180, 9)   // shortest way round
    expect(interpolateParams({}, kf, 10, null).segmented).toBe(true)
    expect(lerpAngleDeg(10, 350, 0.5)).toBeCloseTo(0, 9)
    expect(lerpAngleDeg(-90, 90, 0.25)).toBeCloseTo(-45, 9)
  })

  it('interpolates arrays and vectors element-wise and replaces arrays of another length whole', () => {
    const kf = [
      { hpf: 0, radiiMm: [1, 2, 3], outlineMm: [[0, 0], [1, 0], [1, 1]] },
      { hpf: 10, radiiMm: [3, 2, 1], outlineMm: [[0, 0], [1, 0], [1, 3]] },
    ]
    const mid = interpolateParams({}, kf, 5, null)
    expect(mid.radiiMm).toEqual([2, 2, 2])
    expect(mid.outlineMm).toEqual([[0, 0], [1, 0], [1, 2]])
    const odd = [{ hpf: 0, outlineMm: [[0, 0], [1, 1]] }, { hpf: 10, outlineMm: [[0, 0], [1, 1], [2, 2]] }]
    expect(interpolateParams({}, odd, 4, null).outlineMm).toEqual([[0, 0], [1, 1]])
    expect(interpolateParams({}, odd, 10, null).outlineMm).toEqual([[0, 0], [1, 1], [2, 2]])
  })
})

describe('inheritance (BG-41)', () => {
  const staticBlock = { placement: { u: 0.21, v: -0.7, w: 0 } }
  const heart = [
    { hpf: 19, segments: { atrium: { s0: 0.1, s1: 0.45, rMm: 0.025, rAcrossMm: 0.025 }, ventricle: { s0: 0.55, s1: 0.9, rMm: 0.025 } }, bendDeg: 0 },
    { hpf: 30, segments: { atrium: { rMm: 0.0275 } } },
    { hpf: 36, bendDeg: 90 },
  ]
  it('a keyframe that lists one leaf inherits every other leaf to any depth', () => {
    const at30 = resolveKeyframe(staticBlock, heart, 1)
    expect(at30).toMatchObject({ placement: { u: 0.21 }, segments: { atrium: { s0: 0.1, s1: 0.45, rMm: 0.0275, rAcrossMm: 0.025 }, ventricle: { s0: 0.55 } }, bendDeg: 0 })
    const p = interpolateParams(staticBlock, heart, 33, null)
    expect(p.bendDeg).toBeCloseTo(45, 9)
    expect((p.segments as { atrium: { s0: number } }).atrium.s0).toBe(0.1)
    expect((p.placement as { v: number }).v).toBe(-0.7)
  })

  it('holds the first keyframe before it and the last after it', () => {
    expect(interpolateParams(staticBlock, heart, 5, null).bendDeg).toBe(0)
    expect(interpolateParams(staticBlock, heart, 99, null).bendDeg).toBe(90)
  })
})

describe('sizeRefSl rescale (BG-43, DM-16)', () => {
  const notochord = [
    { hpf: 48, radiusMm: { r0Mm: 0.0275, r1Mm: 0.010 } },
    { hpf: 72, sizeRefSl: 3.25 },
    { hpf: 120, sizeRefSl: 3.6, radiusMm: { r0Mm: 0.0325, r1Mm: 0.010 } },
  ]
  it('at 60 hpf the 72 hpf keyframe is scaled by SL(72) / 3.25 = 1, so the radii are the plain lerp', () => {
    const sl = slScaleFrom(growth, 60, 1)                      // SL(max(60, 72)) = 3.25
    expect(sl).toBeCloseTo(3.25, 9)
    const p = interpolateParams({}, notochord, 60, sl) as { radiusMm: { r0Mm: number; r1Mm: number } }
    expect(Number.isFinite(p.radiusMm.r0Mm)).toBe(true)
    expect(p.radiusMm.r0Mm).toBeCloseTo(0.0275, 9)             // both keyframes carry 0.0275 in mm
    expect(p.radiusMm.r1Mm).toBeCloseTo(0.010, 9)
  })

  it('scales the post-72 sizes by SL(t) / sizeRefSl and skips the fraction form', () => {
    const at96 = interpolateParams({}, [{ hpf: 72, sizeRefSl: 3.25, rMm: 1, fMm: { value: 0.5, unit: 'bodyHeightFraction' }, u: 0.3 }], 96, 3.4)
    expect(at96.rMm).toBeCloseTo(3.4 / 3.25, 9)
    expect(at96.fMm).toEqual({ value: 0.5, unit: 'bodyHeightFraction' })
    expect(at96.u).toBe(0.3)
  })

  it('never returns NaN when SL is null or the reference is zero (the guard)', () => {
    expect(rescaleFactor(3.25, null)).toBe(1)
    expect(rescaleFactor(0, 3.4)).toBe(1)
    expect(rescaleFactor(undefined, 3.4)).toBe(1)
    expect(rescaleFactor(Number.NaN, 3.4)).toBe(1)
    expect(slScaleFrom(growth.filter((g) => g.hpf < 72), 100, 3.25)).toBe(1)
    const p = interpolateParams({}, [{ hpf: 72, sizeRefSl: 3.25, rMm: 1 }, { hpf: 120, sizeRefSl: 0, rMm: 2 }], 96, null)
    expect(Number.isFinite(p.rMm as number)).toBe(true)
    const q = interpolateParams({}, [{ hpf: 72, rMm: Number.NaN }, { hpf: 120, rMm: 2 }], 96, 3.4)
    expect(q.rMm).toBe(2)
  })
})
