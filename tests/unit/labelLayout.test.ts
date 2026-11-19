// Label placement (AR-37, UX-VS-19): the greedy slot pass of src/viewer/labelLayout.ts.
import { describe, expect, it } from 'vitest'
import { LABEL_GAP_PX, LABEL_STEM_PX, placeLabels, rectsOverlap, slotOffsets } from '../../src/viewer/labelLayout.ts'
import type { LabelAnchor } from '../../src/viewer/labelLayout.ts'

const viewport = { width: 1600, height: 900 }
const chip = { width: 120, height: 22 }

function anchors(n: number, x = 600, y = 383): LabelAnchor[] {
  return Array.from({ length: n }, (_, i) => ({ id: `L${i}`, x, y, ...chip }))
}

describe('label placement', () => {
  it('tries the default stem first, then alternates above and below', () => {
    const offsets = slotOffsets(22)
    expect(offsets[0]).toBe(-LABEL_STEM_PX)
    expect(offsets[1]).toBe(LABEL_STEM_PX)
    expect(offsets[2]).toBe(-(LABEL_STEM_PX + 22 + LABEL_GAP_PX))
    expect(offsets[3]).toBe(LABEL_STEM_PX + 22 + LABEL_GAP_PX)
  })

  it('places eight labels on one anchor without any two overlapping (the 120 hpf case)', () => {
    const placed = placeLabels(anchors(8), viewport)
    expect(placed).toHaveLength(8)
    const rects = placed.map((p) => ({ x: p.x, y: p.y, w: chip.width, h: chip.height }))
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) expect(rectsOverlap(rects[i], rects[j])).toBe(false)
    expect(placed[0].displaced).toBe(false)
    expect(placed.slice(1).every((p) => p.displaced)).toBe(true)
  })

  it('keeps the first label at its default stem above the anchor', () => {
    const [p] = placeLabels(anchors(1), viewport)
    expect(p.y).toBe(383 - LABEL_STEM_PX - chip.height)
    expect(p.x).toBe(600 - chip.width / 2)
  })

  it('clamps a chip inside the viewport and marks it displaced', () => {
    const [p] = placeLabels([{ id: 'edge', x: 10, y: 400, ...chip }], viewport)
    expect(p.x).toBe(LABEL_GAP_PX)
    expect(p.displaced).toBe(true)
  })

  it('drops an anchor outside the viewport and a chip that finds no free slot', () => {
    expect(placeLabels([{ id: 'out', x: -5, y: 400, ...chip }], viewport)).toHaveLength(0)
    const tight = placeLabels(anchors(4), { width: 1600, height: 60 })
    expect(tight.length).toBeLessThan(4)
  })
})
