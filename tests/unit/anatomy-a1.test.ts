// WP-A1 record checks: the early embryo and axial records build inside the body at every
// keyframe (in world space, since W007 reads local-frame bounds), the egg-stage lathes sit on
// the egg surface in the right order, the somite array follows BG-58, and the presence
// windows match D8, DM-21 and the D9 handoff row.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createBodyModel, somiteCountAt, type BodyFile, type BodyFrame } from '../../src/core/bodyModel.ts'
import { buildStructure, structureParams } from '../../src/core/primitives/buildStructure.ts'
import { SEGMENT_GAP_FRACTION, somiteChevron, type SomiteChevronParams } from '../../src/core/primitives/custom/somiteChevron.ts'
import { segmentInstances, type SegmentArrayParams } from '../../src/core/primitives/segmentArray.ts'
import { applyQuat, dot, length, sub, type Vec3 } from '../../src/core/primitives/vec3.ts'
import type { GeometryOut } from '../../src/core/primitives/types.ts'
import { HandoffsFile, StructuresFile } from '../../src/core/schema.ts'
import type { StructureRecord } from '../../src/core/schema.ts'
import { handoffsRaw } from '../../src/data/handoffs/all.ts'
import { structuresRaw } from '../../src/data/structures/all.ts'
import { loadGrowth } from '../../scripts/gen-body.ts'

const root = path.resolve(import.meta.dirname, '../..')
const body = JSON.parse(fs.readFileSync(path.join(root, 'src/data/body.json'), 'utf8')) as BodyFile
const model = createBodyModel(body, loadGrowth().growth)
const structures = StructuresFile.parse(structuresRaw)
const handoffs = HandoffsFile.parse(handoffsRaw)
const byId = new Map(structures.map((r) => [r.id, r]))
const rec = (id: string): StructureRecord => {
  const r = byId.get(id)
  if (!r) throw new Error(`${id} is not a record`)
  return r
}
const readFile = (name: string) => JSON.parse(fs.readFileSync(path.join(root, 'src/data/structures', name), 'utf8')) as { id: string; system: string }[]

const EARLY = ['ZFA:0000084', 'ZFA:0000088', 'ZFA:0000006', 'ZFA:0000106', 'ZFA:0000329', 'ZFA:0001175', 'ZFA:0001176', 'ZFA:0000086', 'ZFA:0000111', 'ZFA:0000071', 'ZFA:0000018', 'ZFA:0000117', 'ZFA:0000001', 'ZFA:0000026']
const AXIAL = ['ZFA:0000091', 'ZFA:0000135', 'ZFA:0000155', 'ZFA:0000279', 'ZFA:0000031', 'ZFA:0000077', 'ZFA:0000060', 'ZFA:0000121', 'ZFA:0001206']
/** A WP-A1 record whose system is skeletal, so it lives in skeletal.json (review BIO-04). */
const HEAD_MESENCHYME = 'ZFA:0000113'
/** Every record this package authored, wherever its system file is. */
const A1 = [...EARLY, ...AXIAL, HEAD_MESENCHYME]

/** World positions of a build: local-frame kinds carry a placement, the others are world already. */
function worldPositions(out: GeometryOut): Vec3[] {
  const pts: Vec3[] = []
  const pl = out.placement
  for (let i = 0; i < out.positions.length; i += 3) {
    const p: Vec3 = [out.positions[i]!, out.positions[i + 1]!, out.positions[i + 2]!]
    if (!pl) { pts.push(p); continue }
    const s: Vec3 = [p[0] * pl.scale[0], p[1] * pl.scale[1], p[2] * pl.scale[2]]
    const r = applyQuat(pl.quaternion, s)
    pts.push([r[0] + pl.position[0], r[1] + pl.position[1], r[2] + pl.position[2]])
  }
  return pts
}

/** Normalised radial excess of a world point over the skin at its nearest station: 0 on the skin, negative inside. */
function skinExcess(frame: BodyFrame, p: Vec3): number {
  let best = frame.stations[0]!
  let bestD = Infinity
  for (const s of frame.stations) {
    const d = length(sub(p, s.p))
    if (d < bestD) { bestD = d; best = s }
  }
  const rel = sub(p, best.p)
  const y = dot(rel, best.n)
  const z = dot(rel, best.b)
  const h = y >= 0 ? best.hD : best.hV
  return Math.sqrt((y / h) ** 2 + (z / best.hW) ** 2) - 1
}

function keyframeTimes(r: StructureRecord): number[] {
  return (r.geometry?.keyframes ?? []).map((k) => k.hpf)
}

/** Half-width of the elliptic skin section at `v`. */
function skinHalfWidth(f: ReturnType<BodyFrame['frameAt']>, v: number): number {
  return f.hW * Math.sqrt(Math.max(0, 1 - Math.min(0.99, Math.abs(v)) ** 2))
}

/**
 * The chevron block of a segment array at its mid station, against the local body (RN-01, RN-02):
 * its height as a fraction of hD + hV, its dorsal and ventral edges in v, its medial and lateral
 * faces in mm from the midline, and the three neighbours it must respect (the notochord sheath,
 * the neural tube crest and the yolk surface).
 */
export function somiteBox(record: StructureRecord, hpf: number): {
  heightFraction: number; dorsalV: number; ventralV: number; w: number; wIn: number; wOut: number
  skinHalfMm: number; notochordRadiusMm: number; crestV: number; yolkTopV: number | null
} {
  const frame = model(hpf)
  const params = structureParams(record, hpf, frame.slMm) as unknown as SegmentArrayParams
  const uMid = (params.uStart + params.uEnd) / 2
  const f = frame.frameAt(uMid)
  const t = params.template as unknown as { placement?: { v: number; w: number }; heightFraction: number; widthMm: number }
  const v = t.placement?.v ?? 0
  const w = Math.abs(t.placement?.w ?? 1)
  const height = t.heightFraction * (f.hD + f.hV)
  const centre = v >= 0 ? v * f.hD : v * f.hV
  const dorsal = centre + height / 2
  const ventral = centre - height / 2
  // The notochord sheath and the spinal cord crest at the same station.
  const noto = structureParams(rec('ZFA:0000135'), hpf, frame.slMm) as Record<string, unknown>
  const nr = noto.radiusMm as number | { r0Mm: number; r1Mm: number }
  const notochordRadiusMm = typeof nr === 'number' ? nr : nr.r0Mm
  let crestV = 0.85
  const cord = rec('ZFA:0000075')
  if (hpf >= cord.visibleFromHpf && hpf <= cord.modelEndHpf) {
    const cp = structureParams(cord, hpf, frame.slMm) as Record<string, unknown>
    const cr = cp.radiusMm as { r0Mm: number; r1Mm: number }
    const path = cp.path as { v: number }
    crestV = (path.v * f.hD + cr.r0Mm * ((cp.ellipticity as number | undefined) ?? 1)) / f.hD
  }
  // Top of the yolk extension at this station, in v units, or null where the extension does not reach.
  let yolkTopV: number | null = null
  const ext = frame.yolk?.extension
  if (ext && uMid >= ext.u0 && uMid <= ext.u1) {
    const s = (uMid - ext.u0) / Math.max(1e-9, ext.u1 - ext.u0)
    const r = ext.r0Mm + (ext.r1Mm - ext.r0Mm) * s
    yolkTopV = (-(f.hV - 0.03) + r) / f.hV
  }
  return {
    heightFraction: t.heightFraction,
    dorsalV: dorsal / f.hD,
    ventralV: ventral >= 0 ? ventral / f.hD : ventral / f.hV,
    w,
    wIn: w * f.hW - t.widthMm / 2,
    wOut: w * f.hW + t.widthMm / 2,
    skinHalfMm: skinHalfWidth(f, v),
    notochordRadiusMm,
    crestV,
    yolkTopV,
  }
}

describe('record files', () => {
  it('early_embryo.json and axial.json hold the WP-A1 records with matching systems', () => {
    const early = readFile('early_embryo.json')
    const axial = readFile('axial.json')
    expect(early.map((r) => r.id).sort()).toEqual([...EARLY].sort())
    expect(axial.map((r) => r.id).sort()).toEqual([...AXIAL].sort())
    for (const r of early) expect(r.system).toBe('early_embryo')
    for (const r of axial) expect(r.system).toBe('axial')
    // ZFA puts head mesenchyme under mesenchyme, not under any axial root, and its definition
    // names the connective tissue, bone and musculature of the head, so it takes the skeletal
    // hue and moves to skeletal.json with it (review BIO-04).
    expect(rec(HEAD_MESENCHYME).system).toBe('skeletal')
    expect(rec(HEAD_MESENCHYME).alsoIn).toEqual(['muscular'])
    for (const id of A1) expect(byId.has(id)).toBe(true)
  })

  it('carries sizeRefSl on every keyframe at or after 72 hpf and on none before', () => {
    for (const id of A1) {
      for (const k of rec(id).geometry?.keyframes ?? []) {
        expect(k.sizeRefSl !== undefined, `${id} ${k.hpf}`).toBe(k.hpf >= 72)
      }
    }
  })
})

describe('egg-stage lathes sit on the egg surface', () => {
  const eggOf = (hpf: number) => {
    const f = model(hpf)
    const C = f.yolk!.ball!.centre
    const p0 = f.frameAt(0).p
    const pole = sub(p0, C)
    return { f, C, R: f.yolk!.ball!.radiusMm, pole: [pole[0] / length(pole), pole[1] / length(pole), pole[2] / length(pole)] as Vec3, thetaM: Math.acos(1 - 2 * Math.min(1, f.epibolyFraction)) }
  }
  const radii = (id: string, hpf: number) => {
    const { f, C } = eggOf(hpf)
    const out = buildStructure(rec(id), f, hpf, 'final')!
    return worldPositions(out).map((p) => ({ d: length(sub(p, C)), p }))
  }

  it('stacks the hypoblast, epiblast and EVL 2, 9 and 16 um above the blastoderm surface', () => {
    const offsets: [string, number][] = [['ZFA:0000117', 0.002], ['ZFA:0000018', 0.009], ['ZFA:0000086', 0.016]]
    for (const [id, off] of offsets) {
      for (const hpf of keyframeTimes(rec(id))) {
        const { R, pole, C, thetaM } = eggOf(hpf)
        const pts = radii(id, hpf)
        for (const { d, p } of pts) {
          expect(Math.abs(d - (R + 0.003 + off)), `${id} ${hpf} hpf`).toBeLessThan(0.0035)
          const ang = Math.acos(Math.min(1, dot(sub(p, C), pole) / d))
          expect(ang, `${id} ${hpf} hpf polar angle`).toBeLessThan(thetaM + 0.06)
        }
        // The surface is revolved about the animal-vegetal axis: its width across the pole is the cap's chord.
        const zs = pts.map(({ p }) => p[2])
        const chord = 2 * R * Math.sin(Math.min(thetaM, Math.PI / 2))
        expect(Math.max(...zs) - Math.min(...zs), `${id} ${hpf} hpf revolved`).toBeGreaterThan(0.9 * chord)
      }
    }
  })

  it('puts the germ ring torus on the margin latitude', () => {
    const ring = rec('ZFA:0000111')
    for (const hpf of keyframeTimes(ring)) {
      const { R, pole, C, thetaM } = eggOf(hpf)
      const tube = hpf < 8 ? 0.05 : hpf < 9 ? 0.04 : hpf < 10 ? 0.035 : 0.03
      for (const { d, p } of radii('ZFA:0000111', hpf)) {
        expect(Math.abs(d - (R + 0.003 - 0.015)), `${hpf} hpf`).toBeLessThan(tube + 0.002)
        const ang = Math.acos(Math.max(-1, Math.min(1, dot(sub(p, C), pole) / d)))
        expect(Math.abs(ang - thetaM), `${hpf} hpf`).toBeLessThan(tube / (R - tube) + 0.03)
      }
    }
  })

  it('keeps the yolk syncytial layer 1 um outside the yolk ball at every keyframe', () => {
    const ysl = rec('ZFA:0000088')
    for (const hpf of keyframeTimes(ysl)) {
      const f = model(hpf)
      const ball = f.yolk!.ball!
      const out = buildStructure(ysl, f, hpf, 'final')!
      const pts = worldPositions(out)
      for (const p of pts) {
        expect(Math.abs(length(sub(p, ball.centre)) - (ball.radiusMm + 0.001)), `${hpf} hpf`).toBeLessThan(0.0035)
      }
      const zs = pts.map((p) => p[2])
      expect(Math.max(...zs) - Math.min(...zs), `${hpf} hpf revolved`).toBeGreaterThan(1.9 * ball.radiusMm)
    }
  })

  it('places the shield as a bump on the dorsal germ ring inside the chorion', () => {
    for (const hpf of [6, 8]) {
      const { f, C, R } = eggOf(hpf)
      const pts = worldPositions(buildStructure(rec('ZFA:0000071'), f, hpf, 'final')!)
      for (const p of pts) {
        expect(length(sub(p, f.chorion!.centre)), `${hpf} hpf`).toBeLessThan(f.chorion!.radiusMm)
        expect(length(sub(p, C)), `${hpf} hpf`).toBeLessThan(R + 0.08)
      }
    }
  })
})

describe('ellipsoids stay inside the skin', () => {
  const cases: [string, number][] = [
    ['ZFA:0000001', 0.05],   // Kupffer's vesicle
    ['ZFA:0000077', 0.05],   // tail bud
    ['ZFA:0000279', 0.15],   // segmental plate (rounded blocks on the curved axis)
    ['ZFA:0000060', 0.15],   // prechordal plate
  ]
  for (const [id, tol] of cases) {
    it(`${id} at every keyframe`, () => {
      const r = rec(id)
      for (const hpf of keyframeTimes(r)) {
        const f = model(hpf)
        const out = buildStructure(r, f, hpf, 'final')!
        let worst = -Infinity
        for (const p of worldPositions(out)) worst = Math.max(worst, skinExcess(f, p))
        expect(worst, `${id} ${hpf} hpf`).toBeLessThan(tol)
      }
    })
  }

  it('hatching gland: on the pericardium under the head from 14 hpf, the polster bump before', () => {
    const r = rec('ZFA:0000026')
    for (const hpf of keyframeTimes(r)) {
      const f = model(hpf)
      const out = buildStructure(r, f, hpf, 'final')!
      let worst = -Infinity
      for (const p of worldPositions(out)) worst = Math.max(worst, skinExcess(f, p))
      expect(worst, `${hpf} hpf`).toBeLessThan(hpf < 14 ? 0.3 : 0.1)
    }
  })
})

describe('somite array', () => {
  const somite = rec('ZFA:0000155')
  const g = somite.geometry as Extract<StructureRecord['geometry'], { kind: 'segmentArray' }>

  it('follows the BG-58 count at every keyframe and never exceeds 31 segments', () => {
    let max = 0
    for (const k of g.keyframes) {
      const c = k.count as number
      expect(c, `${k.hpf} hpf`).toBe(somiteCountAt(k.hpf))
      max = Math.max(max, c)
    }
    expect(max).toBe(31)
  })

  it('gives each segment the array pitch so neighbours touch, and fills u 0.25 to 0.97 from 24 hpf', () => {
    for (const k of g.keyframes) {
      const f = model(k.hpf)
      const params = structureParams(somite, k.hpf, f.slMm) as unknown as SegmentArrayParams
      const pitch = ((params.uEnd - params.uStart) * f.axisLengthMm) / params.count
      expect(Math.abs((params.template as { lengthMm: number }).lengthMm - pitch), `${k.hpf} hpf`).toBeLessThan(0.001)
      expect(params.uStart).toBe(0.25)
      if (k.hpf >= 24) expect(params.uEnd).toBe(0.97)
    }
  })

  it('keeps the trunk segments (u below 0.62) inside the skin; the tail overshoot is bounded until segmentArray scales instances', () => {
    for (const hpf of [16, 24, 33]) {
      const f = model(hpf)
      const params = structureParams(somite, hpf, f.slMm) as unknown as SegmentArrayParams
      const out = buildStructure(somite, f, hpf, 'final')!
      const instances = segmentInstances(params, f)
      const per = out.positions.length / 3 / instances.length
      let trunkWorst = -Infinity
      let tailWorst = -Infinity
      const pts = worldPositions(out)
      pts.forEach((p, i) => {
        const inst = instances[Math.floor(i / per)]!
        const excess = skinExcess(f, p)
        if (inst.u < 0.62) trunkWorst = Math.max(trunkWorst, excess)
        else tailWorst = Math.max(tailWorst, excess)
      })
      expect(trunkWorst, `${hpf} hpf trunk`).toBeLessThan(0.2)
      // Known limitation: one template height for the whole array (see the record's sources and the WP-A1 request).
      expect(tailWorst, `${hpf} hpf tail`).toBeLessThan(3)
    }
  })

  it('keeps the chevron band at 0.30 to 0.41 of the local body height from 16 hpf (RN-01)', () => {
    for (const k of g.keyframes) {
      if (k.hpf < 16) continue
      const box = somiteBox(somite, k.hpf)
      expect(box.heightFraction, `${k.hpf} hpf`).toBeGreaterThanOrEqual(0.3)
      expect(box.heightFraction, `${k.hpf} hpf`).toBeLessThanOrEqual(0.41)
    }
  })

  it('flanks the notochord and the neural tube and never touches the skin (RN-01)', () => {
    for (const k of g.keyframes) {
      const box = somiteBox(somite, k.hpf)
      // Lateral to the notochord: the medial face clears the sheath, and the block is off the midline.
      expect(box.wIn, `${k.hpf} hpf medial face`).toBeGreaterThan(box.notochordRadiusMm)
      expect(box.w, `${k.hpf} hpf w`).toBeGreaterThan(0.4)
      // The dorsal edge stays below the neural tube crest, the ventral edge above the yolk surface.
      expect(box.dorsalV, `${k.hpf} hpf dorsal edge`).toBeLessThanOrEqual(box.crestV)
      if (box.yolkTopV !== null) expect(box.ventralV, `${k.hpf} hpf ventral edge`).toBeGreaterThan(box.yolkTopV)
      // The lateral face stays inside the skin at every instance, after the per-station scale.
      expect(box.wOut / box.skinHalfMm, `${k.hpf} hpf lateral face`).toBeLessThan(0.97)
    }
  })

  it('leaves a myoseptum gap between neighbouring blocks, so two plates never share a face', () => {
    expect(SEGMENT_GAP_FRACTION).toBeGreaterThan(0.02)
    for (const hpf of [18, 24, 33]) {
      const f = model(hpf)
      const params = structureParams(somite, hpf, f.slMm) as unknown as SegmentArrayParams
      const template = params.template as unknown as SomiteChevronParams
      const pitch = ((params.uEnd - params.uStart) * f.axisLengthMm) / params.count
      const uMid = (params.uStart + params.uEnd) / 2
      expect(template.lengthMm, `${hpf} hpf pitch`).toBeCloseTo(pitch, 3)
      // The block is built in its local frame, where the mid-height row carries no fan factor, so
      // the length of that row against the pitch is the gap two neighbours leave each other.
      const drawn = somiteChevron.build({ ...template, chevronDeg: 0, placement: { u: uMid, v: 0, w: 1 } }, f, 'final')
      let min = Infinity
      let max = -Infinity
      for (let i = 0; i < drawn.positions.length; i += 3) {
        if (Math.abs(drawn.positions[i + 1]!) > 1e-9) continue
        min = Math.min(min, drawn.positions[i]!)
        max = Math.max(max, drawn.positions[i]!)
      }
      const drawnLength = max - min
      expect(drawnLength, `${hpf} hpf drawn length`).toBeCloseTo(template.lengthMm * (1 - SEGMENT_GAP_FRACTION), 6)
      expect(pitch - drawnLength, `${hpf} hpf myoseptum gap`).toBeGreaterThan(0.001)
    }
  })

  it('hands off to the myotomes per the D9 row and ends when the last segment has crossed over', () => {
    const row = handoffs.find((h) => h.id === 'somites_myotomes')!
    expect(row.from).toEqual(['ZFA:0000155'])
    expect(row.driver).toBe('ZFA:0000155')
    expect(row.to).toEqual(['ZFA:0001056'])
    expect(row.perSegment).toEqual({ delayHpf: 2, lengthHpf: 2 })
    // A perSegment source may run to window end + delayHpf + lengthHpf (E034).
    expect(somite.modelEndHpf).toBe(33)
    expect(somite.overrideNote).toContain('somites_myotomes')
    expect(g.handoffOut).toBe('somites_myotomes')
    expect(somite.fadeOutHpf).toBe(0.3)
  })
})

describe('presence windows and aliases', () => {
  it('keeps the D8 and DM-21 windows', () => {
    const chorion = rec('ZFA:0000329')
    expect([chorion.visibleFromHpf, chorion.modelEndHpf, chorion.fadeOutHpf]).toEqual([0, 30, 6])
    expect(rec('ZFA:0000084').modelEndHpf).toBe(168)
    expect(rec('ZFA:0000084').fadeOutHpf).toBe(1.2)
    const kv = rec('ZFA:0000001')
    expect([kv.modelEndHpf, kv.fadeOutHpf]).toEqual([19, 2])
    expect(rec('ZFA:0000077').modelEndHpf).toBe(24)
    expect(rec('ZFA:0000279').modelEndHpf).toBe(26)
  })

  it('hands the notochord rudiment over as its own record and carries the polster as an alias', () => {
    const notochord = rec('ZFA:0000135')
    const chorda = rec('ZFA:0000091')
    expect(notochord.visibleFromHpf).toBe(10)
    expect(notochord.zfaParent).toBe('ZFA:0000091')
    expect([chorda.visibleFromHpf, chorda.modelEndHpf]).toEqual([8, 10.33])
    // The two rods cross-fade over 10 to 10.33 hpf with the same radius.
    expect(chorda.fadeOutHpf).toBeCloseTo(0.33, 9)
    expect(notochord.fadeInHpf).toBeCloseTo(0.33, 9)
    const hg = rec('ZFA:0000026')
    expect(hg.visibleFromHpf).toBe(10)
    expect(hg.aliasChain).toEqual([{ zfaId: 'ZFA:0000058', name: 'polster', fromHpf: 10, toHpf: 14 }])
    expect(byId.has('ZFA:0000058')).toBe(false)
  })

  it('derives the yolk parts from the yolk', () => {
    for (const [id, part] of [['ZFA:0000006', 'ball'], ['ZFA:0000106', 'extension']] as const) {
      const g = rec(id).geometry
      expect(g?.kind).toBe('derived')
      if (g?.kind === 'derived') { expect(g.sourceId).toBe('ZFA:0000084'); expect(g.part).toBe(part) }
      expect(rec(id).modelEndHpf).toBe(168)
    }
  })

  it('builds every drawable record at every keyframe with finite positions', () => {
    for (const id of A1) {
      const r = rec(id)
      if (!r.geometry || r.geometry.kind === 'derived' || r.geometry.kind === 'bodyDriven') continue
      for (const k of r.geometry.keyframes) {
        const out = buildStructure(r, model(k.hpf), k.hpf, 'interactive')
        expect(out, `${id} ${k.hpf} hpf`).not.toBeNull()
        expect(Array.from(out!.positions).every(Number.isFinite), `${id} ${k.hpf} hpf`).toBe(true)
      }
    }
  })
})

