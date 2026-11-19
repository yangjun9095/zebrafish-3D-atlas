// QP-12: vertex counts per level, finite unit normals, outward normals on
// the convex kinds, analytic bounds, sheet winding, mirrored winding, the
// inner side of a bend, and writeInto.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createBodyModel, type BodyFile } from '../../src/core/bodyModel.ts'
import { toBufferGeometry, writeInto } from '../../src/core/primitives/toBufferGeometry.ts'
import {
  earVesicle, ellipsoid, eyeCup, finSheet, gutLoop, heartLoop, lathe, primordiumMover, segmentArray, sheet, shell, somiteChevron,
  superellipsoid, tube, type GeometryOut, type Lod,
} from '../../src/core/primitives/index.ts'
import { segmentInstances, templateGeometry, type SegmentArrayParams } from '../../src/core/primitives/segmentArray.ts'
import { sweepTube, type SweepRow } from '../../src/core/primitives/sweep.ts'
import { createWriter } from '../../src/core/primitives/mesh.ts'
import type { HeartLoopParams } from '../../src/core/primitives/custom/heartLoop.ts'
import type { FinSheetParams } from '../../src/core/primitives/custom/finSheet.ts'
import { loadGrowth } from '../../scripts/gen-body.ts'

const root = path.resolve(import.meta.dirname, '../..')
const body = JSON.parse(fs.readFileSync(path.join(root, 'src/data/body.json'), 'utf8')) as BodyFile
const model = createBodyModel(body, loadGrowth().growth)
const f48 = model(48)
const f24 = model(24)
const LODS: Lod[] = ['interactive', 'final']

const v3 = (a: Float32Array, i: number): [number, number, number] => [a[3 * i]!, a[3 * i + 1]!, a[3 * i + 2]!]
const dot = (a: number[], b: number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!
const sub = (a: number[], b: number[]): number[] => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!]
const cross = (a: number[], b: number[]): number[] => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!]

function basicChecks(g: GeometryOut, expectedVertices: number): void {
  const n = g.positions.length / 3
  expect(n).toBe(expectedVertices)
  expect(g.normals.length).toBe(n * 3)
  expect(g.uvs.length).toBe(n * 2)
  expect(g.indices.length % 3).toBe(0)
  let maxIndex = 0
  let badNormal = 0
  let nonFinite = 0
  for (let i = 0; i < g.indices.length; i++) maxIndex = Math.max(maxIndex, g.indices[i]!)
  for (let i = 0; i < n; i++) {
    const p = v3(g.positions, i)
    const nn = v3(g.normals, i)
    if (!p.every(Number.isFinite) || !nn.every(Number.isFinite)) nonFinite++
    if (Math.abs(Math.hypot(...nn) - 1) > 1e-3) badNormal++
  }
  expect(maxIndex).toBeLessThan(n)
  expect(nonFinite).toBe(0)
  expect(badNormal).toBe(0)
  expect(g.bounds.radius).toBeGreaterThan(0)
  expect(g.bounds.min.every((v, k) => v <= g.bounds.max[k]!)).toBe(true)
}

/** Every normal points away from the local centre (convex, local-frame kinds). */
function outwardFromOrigin(g: GeometryOut): number {
  let bad = 0
  for (let i = 0; i < g.positions.length / 3; i++) {
    const p = v3(g.positions, i)
    if (Math.hypot(...p) < 1e-9) continue
    if (dot(v3(g.normals, i), p) <= 0) bad++
  }
  return bad
}

/** Triangles with zero area or a winding that opposes the vertex normals. */
function windingReport(g: GeometryOut): { zeroArea: number; inverted: number } {
  let zeroArea = 0
  let inverted = 0
  for (let t = 0; t < g.indices.length; t += 3) {
    const [a, b, c] = [g.indices[t]!, g.indices[t + 1]!, g.indices[t + 2]!]
    const pa = v3(g.positions, a), pb = v3(g.positions, b), pc = v3(g.positions, c)
    const tn = cross(sub(pb, pa), sub(pc, pa))
    const area = Math.hypot(...tn) / 2
    if (area < 1e-14) { zeroArea++; continue }
    const avg = [0, 1, 2].map((k) => g.normals[3 * a + k]! + g.normals[3 * b + k]! + g.normals[3 * c + k]!)
    if (dot(tn, avg) < 0) inverted++
  }
  return { zeroArea, inverted }
}

describe('ellipsoid and superellipsoid', () => {
  const params = { placement: { u: 0.5, v: 0, w: 0 }, radiiMm: [0.1, 0.05, 0.03] as [number, number, number] }
  it('has 221 / 825 vertices, outward normals and the analytic box', () => {
    for (const lod of LODS) {
      const g = ellipsoid.build(params, f48, lod)
      basicChecks(g, lod === 'interactive' ? 221 : 825)
      expect(ellipsoid.vertexCount(lod, params)).toBe(lod === 'interactive' ? 221 : 825)
      expect(outwardFromOrigin(g)).toBe(0)
      expect(g.bounds.min[0]).toBeCloseTo(-0.1, 6); expect(g.bounds.max[0]).toBeCloseTo(0.1, 6)
      expect(g.bounds.min[1]).toBeCloseTo(-0.05, 6); expect(g.bounds.max[1]).toBeCloseTo(0.05, 6)
      expect(g.bounds.min[2]).toBeCloseTo(-0.03, 6); expect(g.bounds.max[2]).toBeCloseTo(0.03, 6)
      expect(g.placement).toBeDefined()
      expect(windingReport(g).inverted).toBe(0)
    }
  })
  it('keeps finite outward normals at e1 = e2 = 2.0 and at 0.5', () => {
    for (const e of [2.0, 0.5, 1.0]) {
      for (const lod of LODS) {
        const g = superellipsoid.build({ ...params, e1: e, e2: e }, f48, lod)
        basicChecks(g, superellipsoid.vertexCount(lod, { ...params, e1: e, e2: e }))
        expect(outwardFromOrigin(g)).toBe(0)
      }
    }
  })
  it('places the world centre at toWorld(u, v, w)', () => {
    const g = ellipsoid.build({ ...params, placement: { u: 0.3, v: 0.5, w: -0.2 } }, f48, 'interactive')
    const c = f48.toWorld(0.3, 0.5, -0.2)
    expect(g.placement!.position.map((v, k) => Math.abs(v - c[k]!)).every((d) => d < 1e-9)).toBe(true)
  })
})

describe('tube', () => {
  const straight = { path: { type: 'spine' as const, uStart: 0.4, uEnd: 0.7, v: 0, w: 0 }, radiusMm: { r0Mm: 0.03, r1Mm: 0.01 }, caps: 'round' as const }
  it('has 297 / 741 vertices with round caps and 225 / 637 without, all outward', () => {
    for (const lod of LODS) {
      const g = tube.build(straight, f48, lod)
      basicChecks(g, lod === 'interactive' ? 297 : 741)
      expect(tube.vertexCount(lod, straight)).toBe(lod === 'interactive' ? 297 : 741)
      const bare = { ...straight, caps: 'none' as const }
      basicChecks(tube.build(bare, f48, lod), lod === 'interactive' ? 225 : 637)
      // The 48 hpf trunk is straight along +x: outward means away from the axis line.
      const o = f48.toWorld(0.4, 0, 0)
      let bad = 0
      for (let i = 0; i < g.positions.length / 3; i++) {
        const p = v3(g.positions, i)
        const rad = [0, p[1] - o[1], p[2] - o[2]]
        if (Math.hypot(...rad) < 1e-6) continue
        if (dot(v3(g.normals, i), rad) <= 0) bad++
      }
      expect(bad).toBe(0)
      expect(windingReport(g).inverted).toBe(0)
    }
  })
  it('sweeps the body cross-section with the bodyTube counts', () => {
    const skin = { path: { type: 'spine' as const, uStart: 0, uEnd: 1, v: 0, w: 0 }, radiusMm: 'body' as const, caps: 'round' as const }
    for (const lod of LODS) {
      const g = tube.build(skin, f48, lod)
      basicChecks(g, tube.vertexCount(lod, skin))
      expect(g.positions.length / 3).toBe(lod === 'interactive' ? 65 * 25 + 8 * 25 : 129 * 33 + 8 * 33)
    }
    const g24 = tube.build(skin, f24, 'interactive')
    basicChecks(g24, tube.vertexCount('interactive', skin))
  })
  it('follows its own spline with finite frames', () => {
    const spline = { path: { type: 'spline' as const, points: [{ u: 0.1, v: -0.5, w: 0 }, { u: 0.3, v: -0.8, w: 0.3 }, { u: 0.6, v: -0.6, w: 0 }] }, radiusMm: 0.02 }
    for (const lod of LODS) basicChecks(tube.build(spline, f48, lod), tube.vertexCount(lod, spline))
  })
  it('keeps the inner-side normal pointing away from the axis at r x kappa = 0.85 (BG-31)', () => {
    const R = 0.2, r = 0.17
    const rows: SweepRow[] = []
    for (let i = 0; i <= 24; i++) {
      const a = (Math.PI / 2) * (i / 24)
      rows.push({ p: [R * Math.sin(a), R * (1 - Math.cos(a)), 0], t: [Math.cos(a), Math.sin(a), 0], n: [-Math.sin(a), Math.cos(a), 0], b: [0, 0, -1], aD: r, aV: r, bw: r, exponent: 2 })
    }
    const { out } = sweepTube(rows, 12, 'none', createWriter())
    let bad = 0
    for (let i = 0; i < out.vertexCount(); i++) {
      const row = rows[Math.floor(i / 13)]!
      const p = [out.positions[3 * i]!, out.positions[3 * i + 1]!, out.positions[3 * i + 2]!]
      const n = [out.normals[3 * i]!, out.normals[3 * i + 1]!, out.normals[3 * i + 2]!]
      if (dot(n, sub(p, row.p)) <= 0) bad++
    }
    expect(bad).toBe(0)
  })
})

describe('lathe and shell', () => {
  const profile: [number, number][] = [[0, -0.1], [0.06, -0.08], [0.09, -0.04], [0.1, 0], [0.09, 0.04], [0.06, 0.08], [0, 0.1]]
  it('lathe has 221 / 825 vertices and outward normals on a convex profile', () => {
    for (const lod of LODS) {
      const g = lathe.build({ placement: { u: 0.5, v: 0, w: 0 }, profileMm: profile }, f48, lod)
      basicChecks(g, lod === 'interactive' ? 221 : 825)
      expect(outwardFromOrigin(g)).toBe(0)
      expect(windingReport(g).inverted).toBe(0)
    }
  })
  it('shell has 700 / 2548 vertices, radial normals outside and inside', () => {
    const params = { centre: { u: 0.4, v: 0, w: 0 }, innerRadiusMm: 0.3, thicknessMm: 0.03, polarDeg: 90 }
    for (const lod of LODS) {
      const g = shell.build(params, f48, lod)
      basicChecks(g, lod === 'interactive' ? 700 : 2548)
      expect(shell.vertexCount(lod, params)).toBe(lod === 'interactive' ? 700 : 2548)
      const per = (lod === 'interactive' ? 13 * 25 : 25 * 49)
      let bad = 0
      for (let i = 0; i < 2 * per; i++) {
        const p = v3(g.positions, i)
        const d = dot(v3(g.normals, i), p)
        if (i < per ? d <= 0 : d >= 0) bad++
      }
      expect(bad).toBe(0)
      expect(windingReport(g).inverted).toBe(0)
    }
  })
})

describe('sheet and fin sheet', () => {
  it('sheet has 254 / 578 vertices, no zero-area triangle and no inverted winding', () => {
    const params = { base: { uStart: 0.5, uEnd: 0.7, side: 'dorsal' as const, w: 0 }, outlineMm: [[0, 0], [0.3, 0], [0.3, 0.1], [0.15, 0.15], [0, 0.1]] as [number, number][], thicknessBaseMm: 0.02, thicknessEdgeMm: 0.005 }
    for (const lod of LODS) {
      const g = sheet.build(params, f48, lod)
      basicChecks(g, lod === 'interactive' ? 254 : 578)
      expect(windingReport(g)).toEqual({ zeroArea: 0, inverted: 0 })
    }
    const lateral = { ...params, base: { uStart: 0.25, uEnd: 0.3, side: 'lateral' as const, w: 1 }, rakeDeg: 40 }
    expect(windingReport(sheet.build(lateral, f48, 'final'))).toEqual({ zeroArea: 0, inverted: 0 })
  })
  it('the median fin fold at 24 and 48 hpf has no inverted or zero-area triangle (BG-59)', () => {
    for (const [frame, uStart, hMax] of [[f24, 0.46, 0.06], [f48, 0.42, 0.20]] as const) {
      const params: FinSheetParams = {
        base: { uStart, uEnd: frame.ventU, side: 'fold', w: 0 },
        outline: [[0, 0.02], [0.3, hMax], [0.5, hMax], [0.7, hMax], [1, 0.02]],
        thicknessBaseMm: 0.01, thicknessEdgeMm: 0.004,
      }
      for (const lod of LODS) {
        const g = finSheet.build(params, frame, lod)
        basicChecks(g, finSheet.vertexCount(lod, params))
        expect(windingReport(g)).toEqual({ zeroArea: 0, inverted: 0 })
      }
    }
    const pectoral: FinSheetParams = { base: { uStart: 0.24, uEnd: 0.28, side: 'lateral', w: 1 }, outline: [[0, 0.05], [0.5, 0.14], [1, 0.05]], thicknessBaseMm: 0.02, thicknessEdgeMm: 0.004, rakeDeg: 50 }
    expect(windingReport(finSheet.build(pectoral, f48, 'final'))).toEqual({ zeroArea: 0, inverted: 0 })
    const caudal: FinSheetParams = { base: { uStart: 0.95, uEnd: 1.2, side: 'caudal', w: 0 }, outline: [[0, 0.3], [0.5, 0.4], [1, 0.3]], thicknessBaseMm: 0.02, thicknessEdgeMm: 0.004, forkDepthFraction: 0.3 }
    expect(windingReport(finSheet.build(caudal, model(504), 'final'))).toEqual({ zeroArea: 0, inverted: 0 })
  })
})

describe('segment array', () => {
  const params: SegmentArrayParams = {
    template: { kind: 'ellipsoid', placement: { u: 0, v: 0.2, w: 0.5 }, radiiMm: [0.025, 0.06, 0.03] },
    uStart: 0.25, uEnd: 0.9, count: 6.6, mirror: true,
  }
  it('scales its vertex count with ceil(count), two sides, and mirrors the winding', () => {
    for (const lod of LODS) {
      const g = segmentArray.build(params, f48, lod)
      basicChecks(g, (lod === 'interactive' ? 221 : 825) * 7 * 2)
      expect(segmentArray.vertexCount(lod, params)).toBe((lod === 'interactive' ? 221 : 825) * 14)
    }
    const right = templateGeometry(params, f48, 'interactive', false)
    const left = templateGeometry(params, f48, 'interactive', true)
    for (let t = 0; t < right.indices.length; t += 3) {
      expect([left.indices[t], left.indices[t + 1], left.indices[t + 2]]).toEqual([right.indices[t], right.indices[t + 2], right.indices[t + 1]])
    }
    const inst = segmentInstances(params, f48)
    expect(inst).toHaveLength(14)
    expect(inst.filter((i) => i.side === 'left')).toHaveLength(7)
    expect(inst[inst.length - 1]!.placement.scale[0]).toBeCloseTo(0.6, 9)
    expect(inst[0]!.u).toBeCloseTo(0.25 + (0.5 * 0.65) / 6.6, 9)
  })
})

describe('custom builders', () => {
  it('heartLoop builds cone, tube, C and S with one vertex count', () => {
    const base: HeartLoopParams = {
      placement: { u: 0.21, v: -0.7, w: 0 }, stage: 'cone', coneBaseRadiusMm: 0.06, coneHeightMm: 0.03,
      tubeLengthMm: 0, headingDeg: 0, bendDeg: 0, twistDeg: 0,
      segments: {
        sinusVenosus: { s0: 0, s1: 0.1, rMm: 0.025 }, atrium: { s0: 0.1, s1: 0.45, rMm: 0.025, rAcrossMm: 0.025 },
        avCanal: { s0: 0.45, s1: 0.55, rMm: 0.022 }, ventricle: { s0: 0.55, s1: 0.9, rMm: 0.025, rAcrossMm: 0.025, exponent: 0.7 },
        bulbus: { s0: 0.9, s1: 1.0, rBaseMm: 0.02, rNeckMm: 0.015, tiltDeg: 0 },
      },
      atriumOffset: { v: 0, w: 0 },
    }
    const variants: HeartLoopParams[] = [
      base,
      { ...base, stage: 'tube', tubeLengthMm: 0.2, headingDeg: 15 },
      { ...base, stage: 'C', tubeLengthMm: 0.28, headingDeg: 15, bendDeg: 90 },
      { ...base, stage: 'S', tubeLengthMm: 0.28, headingDeg: 15, bendDeg: 140, twistDeg: 30, atriumOffset: { v: 0.2, w: -0.3 } },
    ]
    for (const lod of LODS) {
      for (const p of variants) {
        const g = heartLoop.build(p, f48, lod)
        basicChecks(g, heartLoop.vertexCount(lod, p))
        expect(Object.keys(g.parts ?? {})).toEqual(['sinusVenosus', 'atrium', 'avCanal', 'ventricle', 'bulbus'])
      }
    }
  })
  it('gutLoop, eyeCup, earVesicle, somiteChevron and primordiumMover build at both levels', () => {
    const gut = {
      path: [{ u: 0.09, v: -0.85, w: 0 }, { u: 0.22, v: -0.5, w: 0 }, { u: 0.35, v: -0.6, w: 0 }, { u: 0.5, v: -0.7, w: 0 }, { u: f48.ventU, v: -0.9, w: 0 }],
      segments: { esophagus: { s0: 0, s1: 0.2, rMm: 0.01 }, intestinalBulb: { s0: 0.2, s1: 0.45, rMm: 0.03 }, midIntestine: { s0: 0.45, s1: 0.8, rMm: 0.02 }, posteriorIntestine: { s0: 0.8, s1: 1, rMm: 0.015 } },
      bulbOffsetW: -0.3, countLoops: 1, attachments: [{ name: 'liver', s0: 0.25, s1: 0.36, thetaDeg: 90 }],
    }
    const eye = { placement: { u: 0.1, v: 0, w: 0.8 }, outerDiameterMm: 0.23, depthMm: 0.15, stage: 'eye' as const, lensDiameterMm: 0.08, lensProtrusionFraction: 0.2, rpeThicknessMm: 0.01, retinaThicknessMm: 0.04 }
    const ear = { placement: { u: 0.21, v: 0.3, w: 0.6 }, lengthMm: 0.13, widthMm: 0.09, heightMm: 0.11, wallMm: 0.015, otoliths: [{ diameterMm: 0.02, pole: 'anterior' as const }, { diameterMm: 0.025, pole: 'posterior' as const }], canals: { loopDiameterMm: 0.09, tubeDiameterMm: 0.015, present: true } }
    const somite = { placement: { u: 0.5, v: 0.2, w: 0.5 }, lengthMm: 0.09, widthMm: 0.05, heightFraction: 0.8, chevronDeg: 40 }
    const prim = { placement: { u: 0.6, v: 0, w: 1 }, lengthMm: 0.1, widthMm: 0.04, heightMm: 0.02 }
    for (const lod of LODS) {
      basicChecks(gutLoop.build(gut, f48, lod), gutLoop.vertexCount(lod, gut))
      const e = eyeCup.build(eye, f48, lod)
      basicChecks(e, eyeCup.vertexCount(lod, eye))
      expect(Object.keys(e.parts ?? {})).toEqual(['rpe', 'retina', 'lens'])
      expect(windingReport(e).inverted).toBe(0)
      expect(windingReport(eyeCup.build({ ...eye, placement: { u: 0.1, v: 0, w: -0.8 } }, f48, lod)).inverted).toBe(0)
      basicChecks(eyeCup.build({ ...eye, stage: 'vesicle' }, f24, lod), eyeCup.vertexCount(lod, eye))
      const earG = earVesicle.build(ear, f48, lod)
      basicChecks(earG, earVesicle.vertexCount(lod, ear))
      expect(windingReport(earG).inverted).toBe(0)
      basicChecks(earVesicle.build({ ...ear, canals: { ...ear.canals, present: false } }, f48, lod), earVesicle.vertexCount(lod, { ...ear, canals: { ...ear.canals, present: false } }))
      const s = somiteChevron.build(somite, f48, lod)
      basicChecks(s, 80)
      expect(windingReport(s)).toEqual({ zeroArea: 0, inverted: 0 })
      basicChecks(primordiumMover.build(prim, f48, lod), primordiumMover.vertexCount(lod, prim))
    }
  })
})

describe('toBufferGeometry', () => {
  it('writeInto twice sets the bounding sphere of the second build; a local-frame kind keeps its bounds', () => {
    const params = { path: { type: 'spine' as const, uStart: 0.2, uEnd: 0.8, v: 0, w: 0 }, radiusMm: 0.02 }
    const g = toBufferGeometry(tube.build(params, f24, 'interactive'))
    const second = tube.build(params, f48, 'interactive')
    writeInto(g, second)
    expect(g.boundingSphere!.center.toArray().map((v, k) => Math.abs(v - second.bounds.center[k]!)).every((d) => d < 1e-6)).toBe(true)
    expect(Math.abs(g.boundingSphere!.radius - second.bounds.radius)).toBeLessThan(1e-6)
    expect(g.getAttribute('position').count).toBe(second.positions.length / 3)
    const e = { placement: { u: 0.5, v: 0, w: 0 }, radiiMm: [0.1, 0.05, 0.03] as [number, number, number] }
    const a = ellipsoid.build(e, f24, 'final')
    const b = ellipsoid.build(e, f48, 'final')
    expect(a.bounds).toEqual(b.bounds)
    const bg = toBufferGeometry(a)
    const before = bg.boundingSphere!.clone()
    writeInto(bg, b)
    expect(bg.boundingSphere!.equals(before)).toBe(true)
  })
})
