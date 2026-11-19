// QP-11 with the D8 revision: no NaN at 1 hpf resolution, monotone length,
// continuity across regime boundaries, the 0.60 mm enclosure to 30 hpf,
// somite counts at the stage starts, the chorion rule, and frame coherence.
// The hourly sweep runs once and the tests assert its aggregates, because
// four million `expect` calls would take minutes.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { BALL_WRAP_HPF, YOLK_SKIN_MARGIN_MM, createBodyModel, somiteCountAt, type BodyFile, type BodyFrame } from '../../src/core/bodyModel.ts'
import type { GrowthPoint } from '../../src/core/growth.ts'
import { BodyFile as BodyFileSchema } from '../../src/core/schema/body.ts'
import { CHORION_LAST_HPF, CHORION_RADIUS_MM, GUT_TOP_FRACTION, SNOUT_TIP, enclosureOf, generateBodyFile, loadGrowth } from '../../scripts/gen-body.ts'

const root = path.resolve(import.meta.dirname, '../..')
const body = JSON.parse(fs.readFileSync(path.join(root, 'src/data/body.json'), 'utf8')) as BodyFile
const growth: GrowthPoint[] = loadGrowth().growth
const model = createBodyModel(body, growth)

const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!
const dist = (a: readonly number[], b: readonly number[]): number => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!)
const finite = (f: BodyFrame): boolean => {
  const vals = [f.axisLengthMm, f.bodyLengthMm, f.epibolyFraction, f.somiteCount, f.ventU, f.notochordFlexionDeg, f.yolkDomeMm]
  if (f.yolk?.ball) vals.push(...f.yolk.ball.centre, f.yolk.ball.radiusMm)
  if (f.yolk?.extension) vals.push(f.yolk.extension.u0, f.yolk.extension.u1, f.yolk.extension.r0Mm, f.yolk.extension.r1Mm)
  if (f.chorion) vals.push(...f.chorion.centre, f.chorion.radiusMm)
  if (f.slMm !== null) vals.push(f.slMm)
  if (f.headTrunkAngleDeg !== null) vals.push(f.headTrunkAngleDeg)
  for (const s of f.stations) vals.push(...s.p, ...s.t, ...s.n, ...s.b, s.hD, s.hV, s.hW, s.exponent)
  return vals.every((v) => Number.isFinite(v))
}

/** Windows where the sourced series turn the tail heading faster than 8 degrees per hour. */
const fastWindow = (t: number): boolean => (t >= 3 && t < 19) || (t >= 30 && t < 36)

interface Sweep {
  nonFinite: number[]
  frameError: number
  minAlong: number
  minSeed: number
  minAcrossSlow: number
  minAcrossFast: number
  maxStepPerHour: number
  lengthDecreases: number[]
  axisDecreases: number[]
  stationCountWrong: number[]
}
let sweepCache: Sweep | null = null
function sweep(): Sweep {
  if (sweepCache) return sweepCache
  const r: Sweep = { nonFinite: [], frameError: 0, minAlong: 1, minSeed: 1, minAcrossSlow: 1, minAcrossFast: 1, maxStepPerHour: 0, lengthDecreases: [], axisDecreases: [], stationCountWrong: [] }
  let prev: BodyFrame | null = null
  for (let t = 0; t <= 4320; t++) {
    const f = model(t)
    if (f.stations.length !== 128) r.stationCountWrong.push(t)
    if (!finite(f)) r.nonFinite.push(t)
    for (let i = 0; i < f.stations.length; i++) {
      const s = f.stations[i]!
      r.frameError = Math.max(r.frameError, Math.abs(dot(s.t, s.t) - 1), Math.abs(dot(s.n, s.n) - 1), Math.abs(dot(s.b, s.b) - 1), Math.abs(dot(s.t, s.n)), Math.abs(dot(s.t, s.b)), Math.abs(dot(s.n, s.b)))
      if (i > 0) r.minAlong = Math.min(r.minAlong, dot(s.n, f.stations[i - 1]!.n))
      if (prev) {
        const d = dot(s.n, prev.stations[i]!.n)
        if (fastWindow(t - 1)) r.minAcrossFast = Math.min(r.minAcrossFast, d)
        else r.minAcrossSlow = Math.min(r.minAcrossSlow, d)
        r.maxStepPerHour = Math.max(r.maxStepPerHour, dist(s.p, prev.stations[i]!.p))
      }
    }
    r.minSeed = Math.min(r.minSeed, dot(f.stations[Math.round(0.4 * 127)]!.n, [0, 1, 0]))
    if (prev && t > 10) {
      if (f.bodyLengthMm < prev.bodyLengthMm) r.lengthDecreases.push(t)
      if (f.axisLengthMm < prev.axisLengthMm - 1e-9) r.axisDecreases.push(t)
    }
    prev = f
  }
  sweepCache = r
  return r
}

describe('body.json', () => {
  it('validates against the WP-02 BodyFile schema', () => {
    const parsed = BodyFileSchema.safeParse(body)
    expect(parsed.success, parsed.success ? '' : JSON.stringify(parsed.error.issues.slice(0, 5))).toBe(true)
  })

  it('has the 32 keyframes ascending from 0 to 4320 hpf with 9 profile stations and ascending spine u', () => {
    expect(body.keyframes).toHaveLength(32)
    const hpfs = body.keyframes.map((k) => k.hpf)
    expect(hpfs).toEqual([...hpfs].sort((a, b) => a - b))
    expect(hpfs[0]).toBe(0)
    expect(hpfs[31]).toBe(4320)
    for (const k of body.keyframes) {
      expect(k.profile).toHaveLength(9)
      expect(k.spine.length).toBeGreaterThanOrEqual(9)
      expect(k.spine[0]![0]).toBe(0)
      expect(k.spine[k.spine.length - 1]![0]).toBe(1)
      expect(k.spine.every((p, i) => i === 0 || p[0] > k.spine[i - 1]![0])).toBe(true)
      expect(k.profile.every((p) => p.hD > 0 && p.hV > 0 && p.hW > 0)).toBe(true)
    }
  })

  it('matches the generator output (BG-25)', () => {
    expect(JSON.stringify(generateBodyFile(growth))).toBe(JSON.stringify(body))
  })

  it('never decreases axis length after 10 hpf', () => {
    const rows = body.keyframes.filter((k) => k.hpf >= 10)
    for (let i = 1; i < rows.length; i++) expect(rows[i]!.axisLengthMm!).toBeGreaterThanOrEqual(rows[i - 1]!.axisLengthMm!)
  })
})

describe('bodyModel(t) at 1 hpf resolution', () => {
  it('returns finite values and 128 unit orthogonal frames at every hour', () => {
    const r = sweep()
    expect(r.nonFinite).toEqual([])
    expect(r.stationCountWrong).toEqual([])
    expect(r.frameError).toBeLessThan(1e-6)
  }, 120000)

  it('keeps body length and axis length non-decreasing after 10 hpf', () => {
    const r = sweep()
    expect(r.lengthDecreases).toEqual([])
    expect(r.axisDecreases).toEqual([])
    for (const g of growth) expect(Math.abs(model(g.hpf).bodyLengthMm - g.lengthMm)).toBeLessThan(1e-6)
  }, 120000)

  it('moves no station more than 0.07 mm per 0.1 hpf across the regime boundaries', () => {
    let worst = 0
    for (const bnd of [4.66, 10, 19, 72]) {
      for (let k = -10; k < 10; k++) {
        const t = bnd + k * 0.1
        const a = model(t)
        const b = model(t + 0.1)
        for (let i = 0; i < 128; i++) worst = Math.max(worst, dist(a.stations[i]!.p, b.stations[i]!.p))
      }
    }
    expect(worst).toBeLessThan(0.07)
  })

  it('moves no station more than 0.7 mm per hour of model time (BG-23)', () => {
    expect(sweep().maxStepPerHour).toBeLessThan(0.7)
  }, 120000)
})

describe('frame coherence (BG-04)', () => {
  it('keeps n coherent along the spine and above 0.2 dot up at the seed, every hour', () => {
    const r = sweep()
    expect(r.minAlong).toBeGreaterThan(0.99)
    expect(r.minSeed).toBeGreaterThan(0.2)
  }, 120000)

  it('never flips dorsal and ventral between one hour and the next', () => {
    // Epiboly and axis extension (3 to 19 hpf) and the straightening from the
    // 30 hpf curl (30 to 36 hpf) turn the tail heading by up to 37 degrees
    // per hour by construction; there the bound is 60 degrees per hour.
    const r = sweep()
    expect(r.minAcrossSlow).toBeGreaterThan(0.99)
    expect(r.minAcrossFast).toBeGreaterThan(0.5)
  }, 120000)
})

describe('spot values', () => {
  it('yolk, epiboly, SL, HTA, regime (QP-11)', () => {
    expect(model(0).yolk?.ball?.radiusMm).toBeCloseTo(0.35, 6)
    expect(model(6).epibolyFraction).toBeCloseTo(0.5, 6)
    expect(model(10).epibolyFraction).toBeCloseTo(1, 6)
    expect(model(71).slMm).toBeNull()
    expect(model(72).slMm).toBeCloseTo(3.25, 6)
    expect(model(60).headTrunkAngleDeg).toBeCloseTo(35, 6)
    expect(model(72).headTrunkAngleDeg).toBeCloseTo(25, 6)
    expect(model(21).headTrunkAngleDeg).toBeNull()
    expect(model(168).yolk).toBeNull()
    expect(model(200).yolk).toBeNull()
    expect(model(120).yolk?.ball?.radiusMm).toBeCloseTo(0.06, 6)   // Day 5 remnant inside the belly (review R01)
    expect(model(120).yolk?.extension).toBeNull()
    expect(model(48).yolk?.extension?.u1).toBeCloseTo(0.6, 6)
    expect(model(72).regime).toBe('R4')
    expect(model(71.9).regime).toBe('R3')
    expect(model(4320).axisLengthMm).toBeCloseTo(25, 6)
  })

  it('somite counts equal the ZFS stage-name lower bounds at the stage starts (BG-58)', () => {
    const expected: [number, number][] = [[10.33, 1], [11.66, 5], [14, 10], [16, 14], [18, 18], [19, 20], [22, 26], [24, 30]]
    for (const [t, n] of expected) {
      expect(somiteCountAt(t)).toBe(n)
      expect(model(t).somiteCount).toBe(n)
    }
    expect(somiteCountAt(10)).toBe(0)
    expect(somiteCountAt(26)).toBe(31)
    expect(model(4320).somiteCount).toBe(31)
    for (let t = 10; t < 30; t += 0.25) expect(somiteCountAt(t + 0.25)).toBeGreaterThanOrEqual(somiteCountAt(t))
  })

  it('cell counts follow the cleavage stages', () => {
    expect(model(0).cellCount).toBe(1)
    expect(model(0.75).cellCount).toBe(2)
    expect(model(2.25).cellCount).toBe(128)
    expect(model(3.33).cellCount).toBe(2048)
    expect(model(5).cellCount).toBeNull()
  })

  it('frameAt and toWorld follow BG-05 and BG-08', () => {
    const f = model(48)
    const seed = f.frameAt(0.4)
    expect(Math.abs(seed.p[0])).toBeLessThan(0.02)
    expect(seed.t[0]).toBeGreaterThan(0.99)
    const mid = f.frameAt(0.5)
    expect(dist(f.toWorld(0.5, 1, 0), mid.p)).toBeCloseTo(mid.hD, 9)
    expect(dist(f.toWorld(0.5, -1, 0), mid.p)).toBeCloseTo(mid.hV, 9)
    expect(f.toWorld(0.5, 0, 1)[2]).toBeLessThan(0)          // +w is the right side, -z (D4)
    expect(dist(f.frameAt(1.2).p, f.frameAt(1).p)).toBeCloseTo(0.2 * f.axisLengthMm, 9)
    expect(model(48)).toBe(f)                                 // cached by hpf
  })
})

describe('chorion and enclosure (D8 revised)', () => {
  it('holds a 0.60 mm chorion through 30 hpf and none from 36 hpf', () => {
    for (let t = 0; t <= CHORION_LAST_HPF; t++) expect(model(t).chorion?.radiusMm).toBeCloseTo(CHORION_RADIUS_MM, 9)
    expect(model(36).chorion).toBeNull()
    for (let t = 37; t <= 4320; t += 7) expect(model(t).chorion).toBeNull()
  })

  it('fits body plus yolk inside the chorion sphere at every keyframe at or before 30 hpf', () => {
    for (const k of body.keyframes.filter((k) => k.hpf <= CHORION_LAST_HPF)) {
      const f = model(k.hpf)
      expect(enclosureOf(f).radius).toBeLessThanOrEqual(CHORION_RADIUS_MM + 1e-3)
      expect(f.chorion).not.toBeNull()
      const c = f.chorion!.centre
      let worst = 0
      for (const s of f.stations) {
        worst = Math.max(worst,
          dist([s.p[0] + s.n[0] * s.hD, s.p[1] + s.n[1] * s.hD, 0], c),
          dist([s.p[0] - s.n[0] * s.hV, s.p[1] - s.n[1] * s.hV, 0], c),
          dist([s.p[0], s.p[1], s.hW], c))
      }
      if (f.yolk?.ball) worst = Math.max(worst, dist(f.yolk.ball.centre, c) + f.yolk.ball.radiusMm)
      expect(worst).toBeLessThanOrEqual(CHORION_RADIUS_MM + 1e-3)
    }
  })

  it('wraps the ventral skin around the yolk ball at every hour from 36 to 168 hpf (BG-18 as revised)', () => {
    let worst = -Infinity
    for (let t = BALL_WRAP_HPF[1]; t < 168; t++) {
      const f = model(t)
      const ball = f.yolk?.ball
      if (!ball) continue
      // frameAt lerps between two stations; the chord under the ball's apex sits at most du^2 / 8r inside the circle
      // (0.3 to 1.4 um here), which the 10 um margin covers; the sampled check below is the strict one.
      const sagitta = (f.axisLengthMm / 127) ** 2 / (8 * ball.radiusMm)
      expect(f.frameAt(ball.u).hV, `${t} hpf`).toBeGreaterThanOrEqual(ball.depthMm + ball.radiusMm + YOLK_SKIN_MARGIN_MM - 2 * sagitta)
      for (let i = 0; i <= 400; i++) {
        const p = f.toWorld(i / 400, -1, 0)
        worst = Math.max(worst, ball.radiusMm - dist(p, ball.centre))
      }
    }
    // Negative: every point of the ventral skin lies outside the ball.
    expect(worst).toBeLessThan(0)
  }, 60000)

  it('leaves the coiled postures alone through 30 hpf and forms the belly by 36 hpf', () => {
    const coil = model(BALL_WRAP_HPF[0])
    const ball30 = coil.yolk!.ball!
    expect(coil.frameAt(ball30.u).hV).toBeLessThan(ball30.depthMm)
    const straight = model(BALL_WRAP_HPF[1])
    const ball36 = straight.yolk!.ball!
    expect(straight.frameAt(ball36.u).hV).toBeGreaterThan(ball36.depthMm + ball36.radiusMm)
  })

  it('sits the yolk remnant in the gut region from 72 hpf: top under the notochord, ball inside the belly', () => {
    for (const k of body.keyframes.filter((k) => k.hpf >= 72 && k.yolkBall && k.yolkBall.radiusMm > 0)) {
      const ball = k.yolkBall!
      const top = ball.depthMm - ball.radiusMm
      expect(top, `${k.hpf} hpf`).toBeGreaterThan(0.05)
      expect(top, `${k.hpf} hpf`).toBeLessThan(GUT_TOP_FRACTION * 0.25)
    }
    expect(model(120).yolk!.ball!.depthMm - model(120).yolk!.ball!.radiusMm).toBeLessThan(0.1)
  })

  it('gives every free-swimming keyframe a wedge snout with the tip above the mid-line', () => {
    for (const k of body.keyframes.filter((k) => k.hpf >= 22)) {
      const [tip, next] = k.profile
      expect(tip!.hD / next!.hD, `${k.hpf} hpf`).toBeCloseTo(SNOUT_TIP.hD, 2)
      expect(tip!.hV / next!.hV, `${k.hpf} hpf`).toBeCloseTo(SNOUT_TIP.hV, 2)
      expect(tip!.hD).toBeGreaterThan(tip!.hV)
    }
  })

  it('keeps every phase 1 profile value except the snout tip, so no record placed against phase 1 leaves the skin', () => {
    // The belt line of the hanging ball stays baked into the profile at 36 to 120 hpf (envelopeProfile).
    for (const k of body.keyframes.filter((k) => k.hpf >= 36 && k.hpf <= 120)) {
      const ball = k.yolkBall!
      const station = k.profile.find((p) => Math.abs(p.u - 0.35) < 1e-9)!
      const templateHv = k.profile[4]!.hV
      expect(station.hV, `${k.hpf} hpf`).toBeGreaterThan(templateHv)
      expect(station.hV, `${k.hpf} hpf`).toBeGreaterThanOrEqual(ball.depthMm)
    }
  })

  it('keeps the yolk centre inside a 0.4 mm box around the origin from 10 to 120 hpf (BG-22)', () => {
    let worst = 0
    for (let t = 10; t <= 120; t++) {
      const ball = model(t).yolk?.ball
      expect(ball).toBeTruthy()
      worst = Math.max(worst, Math.abs(ball!.centre[0]), Math.abs(ball!.centre[1]))
    }
    expect(worst).toBeLessThan(0.4)
  })
})
