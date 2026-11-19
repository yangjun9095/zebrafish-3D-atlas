// Projected-box fit of src/viewer/fit.ts (AR-41 as revised in phase 2, AR-42).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createBodyModel } from '../../src/core/bodyModel.ts'
import type { BodyFile } from '../../src/core/bodyModel.ts'
import type { GrowthPoint } from '../../src/core/growth.ts'
import type { Vec3 } from '../../src/core/primitives/vec3.ts'
import { FIT_FILL_HEIGHT, FIT_FILL_WIDTH, bodyFitPoints, fitPose, freeHalfTangents } from '../../src/viewer/fit.ts'
import { FOV_DEG, PRESET_DIRECTIONS, screenAxes } from '../../src/viewer/presets.ts'

const body = JSON.parse(readFileSync('src/data/body.json', 'utf8')) as BodyFile
const stages = JSON.parse(readFileSync('src/data/stages.json', 'utf8')) as { growth: GrowthPoint[] }
const model = createBodyModel(body, stages.growth)
const viewport = { width: 1600, height: 900, reserved: { top: 0, right: 0, bottom: 0, left: 0 } }
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** Projected half-extent of the points on the free rectangle, as a fraction of the half width or height. */
function projectedFill(points: Vec3[], dir: Vec3, target: Vec3, distance: number, vp = viewport): { w: number; h: number } {
  const { right, up } = screenAxes(dir)
  const { tanH, tanV } = freeHalfTangents(vp, FOV_DEG)
  let w = 0
  let h = 0
  for (const p of points) {
    const rel: Vec3 = [p[0] - target[0], p[1] - target[1], p[2] - target[2]]
    const depth = distance - dot(rel, dir)
    w = Math.max(w, Math.abs(dot(rel, right)) / depth / tanH)
    h = Math.max(h, Math.abs(dot(rel, up)) / depth / tanV)
  }
  return { w, h }
}

describe('projected-box fit', () => {
  it.each([24, 48, 72, 120, 720, 4320])('fills 70 percent of the width in the lateral view at %s hpf', (hpf) => {
    const points = bodyFitPoints(model(hpf))
    const pose = fitPose(points, PRESET_DIRECTIONS.lateral, viewport)
    const fill = projectedFill(points, PRESET_DIRECTIONS.lateral, pose.target, pose.distance)
    // The width binds for a fish; the height binds only for the round early embryo.
    expect(Math.max(fill.w / FIT_FILL_WIDTH, fill.h / FIT_FILL_HEIGHT)).toBeCloseTo(1, 3)
    expect(fill.w).toBeLessThanOrEqual(FIT_FILL_WIDTH + 1e-6)
    expect(fill.h).toBeLessThanOrEqual(FIT_FILL_HEIGHT + 1e-6)
  })

  it('lets the height bind for the chorion sphere at 4 hpf', () => {
    const points = bodyFitPoints(model(4))
    const pose = fitPose(points, PRESET_DIRECTIONS.lateral, viewport)
    const fill = projectedFill(points, PRESET_DIRECTIONS.lateral, pose.target, pose.distance)
    expect(fill.h).toBeCloseTo(FIT_FILL_HEIGHT, 3)
    expect(fill.w).toBeLessThan(FIT_FILL_WIDTH)
  })

  it('centres the target on the projected box and works for every preset', () => {
    const points = bodyFitPoints(model(120))
    for (const dir of Object.values(PRESET_DIRECTIONS)) {
      const pose = fitPose(points, dir, viewport)
      const { right, up } = screenAxes(dir)
      const xs = points.map((p) => dot(p, right))
      const ys = points.map((p) => dot(p, up))
      expect(dot(pose.target, right)).toBeCloseTo((Math.min(...xs) + Math.max(...xs)) / 2, 9)
      expect(dot(pose.target, up)).toBeCloseTo((Math.min(...ys) + Math.max(...ys)) / 2, 9)
      expect(pose.distance).toBeGreaterThan(0)
    }
  })

  it('moves back when a reserved rectangle shrinks the free width (AR-42)', () => {
    const points = bodyFitPoints(model(72))
    const free = fitPose(points, PRESET_DIRECTIONS.lateral, viewport)
    const reserved = fitPose(points, PRESET_DIRECTIONS.lateral, { ...viewport, reserved: { top: 0, right: 800, bottom: 0, left: 0 } })
    expect(reserved.distance).toBeGreaterThan(free.distance * 1.5)
  })

  it('scales the distance with the body, so follow growth keeps the on-screen length steady', () => {
    const a = fitPose(bodyFitPoints(model(72)), PRESET_DIRECTIONS.lateral, viewport)
    const b = fitPose(bodyFitPoints(model(4320)), PRESET_DIRECTIONS.lateral, viewport)
    expect(b.distance / a.distance).toBeCloseTo(b.halfWidth / a.halfWidth, 1)
  })
})

describe('portrait free rectangle', () => {
  const phone = { width: 390, height: 844, reserved: { top: 0, right: 0, bottom: 0, left: 0 } }

  /**
   * A phone in the lateral view leaves most of its height empty, and the obvious repair (a larger
   * width fill on a portrait rectangle) crops the fish. `bodyFitPoints` encloses the body, not the
   * fins: measured at 4320 hpf on a 1600 by 900 canvas, the drawn scene runs from 15.0 to 97.6
   * percent of the width, so the caudal fin already ends 2.4 percent short of the right edge at
   * FIT_FILL_WIDTH. Raising the fill to 0.9 on a 390 by 844 viewport cut the tail off at the edge.
   * This test pins the fill, so a later attempt has to put the fins in the fit points first.
   */
  it('keeps FIT_FILL_WIDTH, because the fins reach past the points the fit encloses', () => {
    const points = bodyFitPoints(model(4320))
    const pose = fitPose(points, PRESET_DIRECTIONS.lateral, phone)
    const fill = projectedFill(points, PRESET_DIRECTIONS.lateral, pose.target, pose.distance, phone)
    expect(fill.w).toBeCloseTo(FIT_FILL_WIDTH, 3)
    expect(fill.h).toBeLessThanOrEqual(FIT_FILL_HEIGHT + 1e-6)
  })
})
