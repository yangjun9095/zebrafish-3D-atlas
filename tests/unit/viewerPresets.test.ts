// Camera presets and fit of src/viewer/presets.ts (D4, AR-40, AR-41, QP-38).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createBodyModel } from '../../src/core/bodyModel.ts'
import type { BodyFile } from '../../src/core/bodyModel.ts'
import type { GrowthPoint } from '../../src/core/growth.ts'
import { PRESET_DIRECTIONS, bodyBoundingSphere, fitDistance, presetEase, presetSpherical, screenAxes, slerpDir } from '../../src/viewer/presets.ts'
import type { PresetName } from '../../src/viewer/presets.ts'

const body = JSON.parse(readFileSync('src/data/body.json', 'utf8')) as BodyFile
const stages = JSON.parse(readFileSync('src/data/stages.json', 'utf8')) as { growth: GrowthPoint[] }
const model = createBodyModel(body, stages.growth)

const PRESETS: PresetName[] = ['lateral', 'dorsal', 'ventral', 'anterior', 'posterior', 'threeQuarter']

describe('view presets (D4, AR-40)', () => {
  it.each(PRESETS)('%s direction is a unit vector', (p) => {
    const d = PRESET_DIRECTIONS[p]
    expect(Math.hypot(d[0], d[1], d[2])).toBeCloseTo(1, 6)
  })

  it('lateral looks along -z with the snout (−x) on the screen left', () => {
    const { right, up } = screenAxes(PRESET_DIRECTIONS.lateral)
    expect(right[0]).toBeCloseTo(1, 6)
    expect(up[1]).toBeCloseTo(1, 6)
  })

  it('dorsal and ventral keep the snout on the screen left with up = +y', () => {
    for (const p of ['dorsal', 'ventral'] as const) {
      const { right } = screenAxes(PRESET_DIRECTIONS[p])
      expect(right[0]).toBeGreaterThan(0.999)
    }
    // Dorsal: the left flank (+z) toward the bottom of the screen; ventral: toward the top (spec 5.7.2).
    expect(screenAxes(PRESET_DIRECTIONS.dorsal).up[2]).toBeLessThan(-0.999)
    expect(screenAxes(PRESET_DIRECTIONS.ventral).up[2]).toBeGreaterThan(0.999)
  })

  it('polar angles follow the AR-40 table', () => {
    expect(presetSpherical('lateral').polar).toBeCloseTo(Math.PI / 2, 6)
    expect(presetSpherical('dorsal').polar).toBeCloseTo(0.001, 4)
    expect(presetSpherical('ventral').polar).toBeCloseTo(Math.PI - 0.001, 4)
    expect(presetSpherical('anterior').azimuth).toBeCloseTo(-Math.PI / 2, 6)
    expect(presetSpherical('posterior').azimuth).toBeCloseTo(Math.PI / 2, 6)
    const tq = Math.hypot(-0.45, 0.35, 0.82)
    expect(presetSpherical('threeQuarter').polar).toBeCloseTo(Math.acos(0.35 / tq), 6)
  })
})

describe('fit (AR-41, AR-42)', () => {
  it('bounding sphere encloses the spine, yolk and chorion at 24 hpf', () => {
    const frame = model(24)
    const s = bodyBoundingSphere(frame)
    const inside = (p: readonly number[]): number => Math.hypot(p[0] - s.center[0], p[1] - s.center[1], p[2] - s.center[2])
    for (const st of frame.stations) expect(inside(st.p)).toBeLessThanOrEqual(s.radius + 1e-9)
    expect(inside(frame.chorion!.centre) + frame.chorion!.radiusMm).toBeLessThanOrEqual(s.radius * Math.sqrt(3) + 1e-9)
  })

  it('fit distance frames the sphere in the free rectangle', () => {
    const viewport = { width: 1600, height: 900, reserved: { top: 0, right: 0, bottom: 0, left: 0 } }
    const d = fitDistance(1, viewport, 34)
    expect(d).toBeCloseTo((1 / Math.sin((34 * Math.PI) / 360)) * 1.1, 6)
    const reserved = fitDistance(1, { ...viewport, reserved: { top: 0, right: 800, bottom: 0, left: 0 } }, 34)
    expect(reserved).toBeGreaterThan(d)
  })

  it('easing and slerp are monotone and bounded', () => {
    let last = 0
    for (let i = 0; i <= 10; i++) {
      const v = presetEase(i / 10)
      expect(v).toBeGreaterThanOrEqual(last - 1e-9)
      last = v
    }
    expect(presetEase(0)).toBe(0)
    expect(presetEase(1)).toBe(1)
    const mid = slerpDir([0, 0, 1], [1, 0, 0], 0.5)
    expect(mid[0]).toBeCloseTo(Math.SQRT1_2, 6)
    expect(mid[2]).toBeCloseTo(Math.SQRT1_2, 6)
  })
})
