// QP-10: time axis bijection, anchors, ticks, snap and playback.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { StagesFile } from '../../src/core/schema.ts'
import {
  AXIS_ANCHORS,
  anchorsFromSegments,
  filterTicks,
  headlineTicksAt,
  hpfToTrack,
  nextPeriod,
  nextStage,
  periodAt,
  prevPeriod,
  prevStage,
  snapTarget,
  stageAt,
  stageIndexAt,
  tickCandidates,
  trackToHpf,
} from '../../src/core/timeAxis.ts'
import { advance, fullTrackSeconds, segmentSeconds, speedLabel, stepSpeed, playStart } from '../../src/core/playback.ts'

const stagesFile = StagesFile.parse(JSON.parse(readFileSync('src/data/stages.json', 'utf8')))
const { stages, periods, timeAxis } = stagesFile
const anchors = anchorsFromSegments(timeAxis.segments)

describe('anchors', () => {
  it('derives the D7 anchors from stages.json', () => {
    expect(anchors).toEqual(AXIS_ANCHORS)
  })
  it('segment shares sum to 1', () => {
    const sum = timeAxis.segments.reduce((s, x) => s + x.share, 0)
    expect(Math.abs(sum - 1)).toBeLessThan(1e-9)
  })
  it('maps the anchors exactly', () => {
    for (const a of AXIS_ANCHORS) expect(hpfToTrack(a.hpf)).toBeCloseTo(a.fraction, 12)
  })
  it('rejects a non-contiguous or short segment table', () => {
    const bad = timeAxis.segments.map((s) => ({ ...s, share: s.share / 2 }))
    expect(() => anchorsFromSegments(bad)).toThrow(/sum/)
  })
})

describe('hpfToTrack and trackToHpf', () => {
  it('form a bijection on integer hpf from 0 to 4320', () => {
    for (let h = 0; h <= 4320; h++) expect(Math.abs(trackToHpf(hpfToTrack(h)) - h)).toBeLessThan(1e-9)
  })
  it('is strictly increasing', () => {
    let prev = -1
    for (let h = 0; h <= 4320; h++) {
      const f = hpfToTrack(h)
      expect(f).toBeGreaterThan(prev)
      prev = f
    }
  })
  it('matches the worked values of UI-03', () => {
    expect(hpfToTrack(24)).toBeCloseTo(0.3, 12)
    expect(hpfToTrack(42)).toBeCloseTo(0.3825, 12)
    expect(hpfToTrack(120)).toBeCloseTo(0.57, 12)
    expect(trackToHpf(0.75)).toBeCloseTo(616.5, 9)
  })
  it('clamps outside the domain', () => {
    expect(hpfToTrack(-5)).toBe(0)
    expect(hpfToTrack(9000)).toBe(1)
    expect(trackToHpf(-1)).toBe(0)
    expect(trackToHpf(2)).toBe(4320)
  })
})

describe('stageAt and periodAt', () => {
  it('finds the stage at its start and just before the next start', () => {
    expect(stageAt(stages, 0).shortLabel).toBe('1-cell')
    expect(stageAt(stages, 0.75).shortLabel).toBe('2-cell')
    expect(stageAt(stages, 23.99).shortLabel).toBe('26+ somites')
    expect(stageAt(stages, 24).shortLabel).toBe('prim-5')
    expect(stageAt(stages, 71.99).shortLabel).toBe('pec-fin')
    expect(stageAt(stages, 72).shortLabel).toBe('protruding-mouth')
    expect(stageAt(stages, 2160).shortLabel).toBe('adult')
    expect(stageAt(stages, 4320).shortLabel).toBe('adult')
    expect(stageIndexAt(stages, 4320)).toBe(stages.length - 1)
  })
  it('finds the period', () => {
    expect(periodAt(periods, 0).id).toBe('zygote')
    expect(periodAt(periods, 0.75).id).toBe('cleavage')
    expect(periodAt(periods, 10.33).id).toBe('segmentation')
    expect(periodAt(periods, 71).id).toBe('hatching')
    expect(periodAt(periods, 4320).id).toBe('adult')
  })
})

describe('stepping', () => {
  it('steps by stage start and reaches the axis end', () => {
    expect(nextStage(stages, 24)).toBe(30)
    expect(prevStage(stages, 24)).toBe(22)
    expect(prevStage(stages, 25)).toBe(24)
    expect(prevStage(stages, 0)).toBeNull()
    expect(nextStage(stages, 2160)).toBe(4320)
    expect(nextStage(stages, 4320)).toBeNull()
    expect(prevStage(stages, 4320)).toBe(2160)
  })
  it('steps by period', () => {
    expect(nextPeriod(periods, 24)).toBe(48)
    expect(prevPeriod(periods, 24)).toBe(10.33)
    expect(nextPeriod(periods, 2160)).toBe(4320)
    expect(nextPeriod(periods, 4320)).toBeNull()
  })
})

describe('ticks', () => {
  const candidates = tickCandidates(stages, periods, timeAxis.headlineTicks)
  it('has one candidate per stage start plus the axis end', () => {
    expect(candidates).toHaveLength(stages.length + 1)
    expect(candidates.filter((c) => c.rank === 'headline')).toHaveLength(18)
  })
  it.each([358, 700, 1200, 1392, 1856, 1920])('keeps every drawn tick 8 px apart at %i px', (w) => {
    const drawn = filterTicks(candidates, w, anchors, 8)
    for (let i = 1; i < drawn.length; i++) expect(drawn[i].xPx - drawn[i - 1].xPx).toBeGreaterThanOrEqual(8)
    for (const t of drawn.filter((d) => d.rank === 'headline')) expect(t.hpf).toBeDefined()
  })
  it('drops the 1-4 somites tick at 1392 and 1856 px in favour of the bud headline tick', () => {
    for (const w of [1392, 1856]) {
      const drawn = filterTicks(candidates, w, anchors, 8)
      expect(drawn.some((d) => d.hpf === 10)).toBe(true)
      expect(drawn.some((d) => d.hpf === 10.33)).toBe(false)
    }
  })
  it('draws every headline tick at 1392 px and none at a very narrow track', () => {
    const wide = filterTicks(candidates, 1392, anchors, 8)
    expect(wide.filter((d) => d.rank === 'headline')).toHaveLength(18)
    const narrow = filterTicks(candidates, 40, anchors, 8)
    expect(narrow.length).toBeLessThan(6)
  })
  it('places the headline labels where section 5.2.5 says', () => {
    const drawn = headlineTicksAt(timeAxis, 1392)
    const at = (hpf: number) => drawn.find((d) => d.hpf === hpf)?.xPx
    expect(at(2.5)).toBeCloseTo(62.6, 1)
    expect(at(16)).toBeCloseTo(322.1, 1)
    expect(at(120)).toBeCloseTo(793.4, 1)
    expect(at(1080)).toBeCloseTo(1134.5, 1)
    expect(at(4320)).toBeCloseTo(1392, 6)
    expect(drawn.find((d) => d.hpf === 72)?.label).toBe('Prot-mouth')
  })
})

describe('snap', () => {
  it('snaps within 6 px and not beyond', () => {
    expect(snapTarget(stages, 24.2, 1392, anchors)).toBe(24)
    expect(snapTarget(stages, 26, 1392, anchors)).toBeNull()
    expect(snapTarget(stages, 4300, 1392, anchors)).toBe(4320)
  })
})

describe('playback', () => {
  it('crosses the full track in 60 s at 1x', () => {
    let t = 0
    for (let i = 0; i < 600; i++) t = advance(t, 1, 0.1, anchors).hpf
    expect(t).toBeCloseTo(4320, 6)
    expect(advance(4319, 1, 1, anchors).ended).toBe(true)
  })
  it('lands at 67.64 hpf after 30 s from 0 hpf', () => {
    expect(advance(0, 1, 30, anchors).hpf).toBeCloseTo(trackToHpf(0.5), 9)
    expect(advance(0, 1, 30, anchors).hpf).toBeCloseTo(67.64, 1)
  })
  it('scales the durations by the speed factor', () => {
    expect(fullTrackSeconds(0.5)).toBe(120)
    expect(fullTrackSeconds(8)).toBe(7.5)
    expect(segmentSeconds(0.18, 1)).toBeCloseTo(10.8, 9)
    expect(segmentSeconds(0.22, 1)).toBeCloseTo(13.2, 9)
    expect(speedLabel(2)).toBe('2x, 30 s')
    expect(stepSpeed(1, 1)).toBe(2)
    expect(stepSpeed(8, 1)).toBe(8)
    expect(stepSpeed(0.5, -1)).toBe(0.5)
    expect(playStart(4320, 100)).toBe(100)
    expect(playStart(4320, null)).toBe(0)
    expect(playStart(50, 100)).toBe(50)
  })
})
