// The per-axis height scale of a segment array (BG-45): the dorsal edge of a template follows
// the dorsal half-heights and the ventral edge the ventral ones, so a myomere keeps its share
// of the section at every station instead of taking the smaller of the two ratios.
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createBodyModel, type BodyFile } from '../../src/core/bodyModel.ts'
import { structureParams } from '../../src/core/primitives/buildStructure.ts'
import { BODY_SCALE_RANGE, bodyScaleAt, segmentInstances, templateSpan, type SegmentArrayParams } from '../../src/core/primitives/segmentArray.ts'
import { parseFile, type StructureRecord } from '../../src/core/schema.ts'
import { loadGrowth } from '../../scripts/gen-body.ts'

const root = path.resolve(import.meta.dirname, '../..')
const body = JSON.parse(fs.readFileSync(path.join(root, 'src/data/body.json'), 'utf8')) as BodyFile
const model = createBodyModel(body, loadGrowth().growth)

function muscular(id: string): StructureRecord {
  const parsed = parseFile('structures', JSON.parse(fs.readFileSync(path.join(root, 'src/data/structures/muscular.json'), 'utf8')))
  if (!parsed.ok) throw new Error('muscular.json did not parse')
  const r = parsed.value.find((x) => x.id === id)
  if (!r) throw new Error(`${id} is not a record`)
  return r
}

const myotome = muscular('ZFA:0001056')

describe('bodyScaleAt with a template span', () => {
  const frame = model(720)
  const uMid = 0.6
  const fm = frame.frameAt(uMid)
  const fi = frame.frameAt(0.85)
  const rD = fi.hD / fm.hD
  const rV = fi.hV / fm.hV

  it('puts the dorsal edge on the dorsal ratio and the ventral edge on the ventral one', () => {
    const half = 0.4 * (fm.hD + fm.hV)
    const v = 0.1
    const centre = v * fm.hD
    const span = { dorsalMm: centre + half, ventralMm: half - centre }
    const s = bodyScaleAt(frame, uMid, 0.85, v, span)
    // The origin already follows the dorsal ratio, so the two edges land here.
    const dorsal = centre * rD + s.y * half + s.offsetMm
    const ventral = centre * rD - s.y * half + s.offsetMm
    expect(dorsal).toBeCloseTo(rD * (centre + half), 9)
    expect(ventral).toBeCloseTo(rV * (centre - half), 9)
    expect(rD).not.toBeCloseTo(rV, 3)
  })

  it('takes one ratio and no shift for a template that stays on one side of the spine', () => {
    const dorsalOnly = bodyScaleAt(frame, uMid, 0.85, 0.8, { dorsalMm: 0.3, ventralMm: -0.1 })
    expect(dorsalOnly.y).toBeCloseTo(rD, 9)
    expect(dorsalOnly.offsetMm).toBe(0)
    const ventralOnly = bodyScaleAt(frame, uMid, 0.85, -0.8, { dorsalMm: -0.1, ventralMm: 0.3 })
    expect(ventralOnly.y).toBeCloseTo(rV, 9)
    expect(ventralOnly.offsetMm).toBe(0)
  })

  it('keeps the older rule and no shift without a span', () => {
    expect(bodyScaleAt(frame, uMid, 0.85, 0).y).toBeCloseTo(Math.min(rD, rV), 9)
    expect(bodyScaleAt(frame, uMid, 0.85, 0).offsetMm).toBe(0)
    expect(bodyScaleAt(frame, uMid, 0.9999, 0).y).toBeGreaterThanOrEqual(BODY_SCALE_RANGE[0])
  })
})

describe('the myomere keeps its share of the section at every instance', () => {
  it('holds the dorsal and ventral edge fractions of the template station', () => {
    let checked = 0
    for (const hpf of [72, 120, 336, 720, 2160, 4320]) {
      const frame = model(hpf)
      const p = structureParams(myotome, hpf, frame.slMm) as unknown as SegmentArrayParams
      const t = p.template as unknown as { placement: { v: number } }
      const v = t.placement.v
      const uMid = (p.uStart + p.uEnd) / 2
      const fm = frame.frameAt(uMid)
      const span = templateSpan(p.template, frame, uMid, v)
      expect(span, `${hpf} hpf span`).not.toBeNull()
      const half = (span!.dorsalMm + span!.ventralMm) / 2
      const centre = v * fm.hD
      const wantDorsal = (centre + half) / fm.hD
      const wantVentral = (centre - half) / fm.hV
      for (const inst of segmentInstances(p, frame)) {
        const fi = frame.frameAt(inst.u)
        // A clamped ratio breaks the identity by design; skip those stations.
        const inRange = (x: number) => x > BODY_SCALE_RANGE[0] && x < BODY_SCALE_RANGE[1]
        if (!inRange(fi.hD / fm.hD) || !inRange(fi.hV / fm.hV)) continue
        const s = bodyScaleAt(frame, uMid, inst.u, v, span!)
        const origin = v * fi.hD
        expect((origin + s.y * half + s.offsetMm) / fi.hD, `${hpf} hpf dorsal at u ${inst.u.toFixed(2)}`).toBeCloseTo(wantDorsal, 6)
        expect((origin - s.y * half + s.offsetMm) / fi.hV, `${hpf} hpf ventral at u ${inst.u.toFixed(2)}`).toBeCloseTo(wantVentral, 6)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(100)
  })
})
