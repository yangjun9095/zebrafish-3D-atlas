// The dissect slider (D17): the phase 1 spread, the inventory pack, the damped follow,
// the store field, the D key and the `x` URL round trip.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  DISSECT_DIRECTIONS, DISSECT_MAX, DISSECT_SPREAD_END, DISSECT_STEPS, LANE_ANGLE_DEG, MIN_SYSTEM_GAP,
  SPREAD_FRAME_SCALE, STAGGER_PITCH, bodyPartDissectFade, clampDissect,
  dampTowards, inventoryBounds, inventoryMix, loneSpread, nextDissectStep, packInventory,
  skinDissectFade, spreadLanes, spreadOffset, staggerAt, unitOf,
} from '../../src/core/dissect.ts'
import type { InventoryItem, Vec2 } from '../../src/core/dissect.ts'
import { SYSTEM_IDS, SystemsFile } from '../../src/core/schema.ts'
import { URL_DEFAULTS, parseUrl, serializeUrl } from '../../src/core/urlState.ts'
import { createAtlasStore } from '../../src/state/store.ts'
import { createDispatcher } from '../../src/state/shortcuts.ts'

const systems = SystemsFile.parse(JSON.parse(readFileSync('src/data/systems.json', 'utf8')))
const L = 3

function keyEvent(code: string, shift = false) {
  return { code, shiftKey: shift, ctrlKey: false, altKey: false, metaKey: false, defaultPrevented: false, target: null, preventDefault: () => {} }
}

describe('systems.json dissect directions (D17)', () => {
  it('gives every one of the 15 systems a direction in the lateral plane', () => {
    expect(systems).toHaveLength(15)
    for (const s of systems) {
      expect(s.dissectDirection, s.id).toBeDefined()
      const [dx, dy] = s.dissectDirection as Vec2
      expect(Math.hypot(dx, dy), s.id).toBeGreaterThan(0.2)
      expect(Math.hypot(dx, dy), s.id).toBeLessThanOrEqual(1.1)
    }
  })

  it('matches the fallback table of src/core/dissect.ts', () => {
    for (const s of systems) expect(s.dissectDirection, s.id).toEqual(DISSECT_DIRECTIONS[s.id])
    expect(Object.keys(DISSECT_DIRECTIONS).sort()).toEqual([...SYSTEM_IDS].sort())
  })
})

describe('spreadOffset (phase 1)', () => {
  const NO_STAGGER: Vec2 = [0, 0]
  const dorsal = loneSpread([0, 1])

  it('is zero at 0 percent and grows with the slider', () => {
    expect(spreadOffset(dorsal, NO_STAGGER, L, 0)).toEqual([0, 0, 0])
    const half = spreadOffset(dorsal, NO_STAGGER, L, 30)[1]
    const full = spreadOffset(dorsal, NO_STAGGER, L, DISSECT_SPREAD_END)[1]
    expect(half).toBeGreaterThan(0)
    expect(full).toBeCloseTo(half * 2, 6)
  })

  it('holds at the phase 1 value above 60 percent, and stays in the lateral plane', () => {
    const ventral = loneSpread([0, -1])
    const at60 = spreadOffset(ventral, NO_STAGGER, L, 60)
    expect(spreadOffset(ventral, NO_STAGGER, L, 100)).toEqual(at60)
    expect(at60[2]).toBe(0)
    expect(at60[1]).toBeLessThan(0)
  })

  it('scales with the body length', () => {
    const a = spreadOffset(dorsal, NO_STAGGER, 2, 60)[1]
    const b = spreadOffset(dorsal, NO_STAGGER, 4, 60)[1]
    expect(b).toBeCloseTo(a * 2, 6)
  })

  it('puts the structures of one system on a lattice that never doubles up a cell', () => {
    for (const count of [1, 2, 5, 12, 30]) {
      const cells = Array.from({ length: count }, (_, i) => staggerAt(i, count))
      expect(new Set(cells.map((c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`)).size, String(count)).toBe(count)
      // The lattice is centred, so a system never drifts off its own direction.
      for (const k of [0, 1] as const) {
        const values = cells.map((c) => c[k])
        expect(Math.abs(Math.min(...values) + Math.max(...values)), `${count} axis ${k}`).toBeLessThan(1e-9)
      }
    }
    expect(staggerAt(0, 1)).toEqual([0, 0])
  })

  it('keeps two siblings at least one lattice pitch apart on screen', () => {
    const count = 12
    const offsets = Array.from({ length: count }, (_, i) => spreadOffset(dorsal, staggerAt(i, count), L, 60))
    const floor = STAGGER_PITCH * Math.min(SPREAD_FRAME_SCALE[0], SPREAD_FRAME_SCALE[1]) * L
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const d = Math.hypot(offsets[i][0] - offsets[j][0], offsets[i][1] - offsets[j][1])
        expect(d, `${i} and ${j}`).toBeGreaterThan(floor - 1e-9)
      }
    }
  })
})

describe('spreadLanes (D17: no two systems pile up)', () => {
  const rows = [...systems].sort((a, b) => a.order - b.order).map((s) => ({ id: s.id, direction: s.dissectDirection as Vec2 }))
  const lanes = spreadLanes(rows)

  it('gives every system an anchor and a unit direction', () => {
    expect(lanes.size).toBe(15)
    for (const row of rows) {
      const spread = lanes.get(row.id)
      expect(spread, row.id).toBeDefined()
      expect(spread!.unit).toEqual(unitOf(row.direction))
    }
  })

  it('fans apart the systems that point the same way', () => {
    const cos = Math.cos((LANE_ANGLE_DEG * Math.PI) / 180)
    let fanned = 0
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = unitOf(rows[i].direction)
        const b = unitOf(rows[j].direction)
        if (a[0] * b[0] + a[1] * b[1] < cos) continue
        fanned++
        const sa = lanes.get(rows[i].id)!
        const sb = lanes.get(rows[j].id)!
        expect(sa.lane === sb.lane, `${rows[i].id} and ${rows[j].id} share a lane`).toBe(false)
      }
    }
    // The ventral quadrant alone holds several of these pairs; without one the test proves nothing.
    expect(fanned).toBeGreaterThan(0)
  })

  it('separates every pair of system centres by MIN_SYSTEM_GAP', () => {
    const points = rows.map((r) => spreadOffset(lanes.get(r.id)!, [0, 0], 1, 60))
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const d = Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1])
        expect(d, `${rows[i].id} and ${rows[j].id}`).toBeGreaterThanOrEqual(MIN_SYSTEM_GAP - 1e-9)
      }
    }
  })

  it('moves every system off the spine and keeps it inside one body length', () => {
    for (const r of rows) {
      const [x, y] = spreadOffset(lanes.get(r.id)!, [0, 0], 1, 60)
      // The axial system carries the shortest vector by design (systems.json), so the floor is low.
      expect(Math.hypot(x, y), r.id).toBeGreaterThan(0.05)
      expect(Math.abs(x), r.id).toBeLessThan(1)
      expect(Math.abs(y), r.id).toBeLessThan(1)
    }
  })

  it('keeps every system on the bearing systems.json gave it', () => {
    // The lane steps radially, so D17's mapping survives it: nervous stays dorsal, digestive ventral.
    for (const r of rows) {
      const spread = lanes.get(r.id)!
      const scale = spread.anchor[0] === 0 ? spread.anchor[1] / r.direction[1] : spread.anchor[0] / r.direction[0]
      expect(scale, r.id).toBeGreaterThan(0)
      expect(spread.anchor[0], r.id).toBeCloseTo(r.direction[0] * scale, 9)
      expect(spread.anchor[1], r.id).toBeCloseTo(r.direction[1] * scale, 9)
    }
  })
})

describe('packInventory (phase 2)', () => {
  const items: InventoryItem[] = [
    { id: 'ZFA:0000200', order: 3, widthMm: 0.4, heightMm: 0.4 },
    { id: 'ZFA:0000100', order: 1, widthMm: 0.2, heightMm: 0.2 },
    { id: 'ZFA:0000300', order: 3, widthMm: 0.3, heightMm: 0.3 },
    { id: 'ZFA:0000400', order: 2, widthMm: 0.8, heightMm: 0.8 },
  ]
  const opts = { startXMm: 4, centreYMm: 0, gapMm: 0.05 }

  it('sorts by system order then id', () => {
    const cells = packInventory(items, opts)
    expect(cells.map((c) => c.id)).toEqual(['ZFA:0000100', 'ZFA:0000400', 'ZFA:0000200', 'ZFA:0000300'])
  })

  it('never overlaps two cells and never reaches back over the body', () => {
    // A long thin structure (the notochord shape) next to small round ones: the cell follows the
    // box, so the thin row stays thin and the grid does not open up around it.
    const many: InventoryItem[] = Array.from({ length: 60 }, (_, i) => ({
      id: `ZFA:${String(1000 + i).padStart(7, '0')}`,
      order: (i % 15) + 1,
      widthMm: i % 9 === 0 ? 4 : 0.1 + (i % 7) * 0.1,
      heightMm: 0.1 + (i % 7) * 0.1,
    }))
    const cells = packInventory(many, opts)
    expect(cells).toHaveLength(many.length)
    for (const c of cells) expect(c.x - c.widthMm / 2).toBeGreaterThanOrEqual(opts.startXMm - 1e-9)
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i]
        const b = cells[j]
        const apart =
          Math.abs(a.x - b.x) >= (a.widthMm + b.widthMm) / 2 - 1e-9 || Math.abs(a.y - b.y) >= (a.heightMm + b.heightMm) / 2 - 1e-9
        expect(apart, `${a.id} overlaps ${b.id}`).toBe(true)
      }
    }
  })

  it('sizes a cell from the box, not from a square around the longest axis', () => {
    const thin: InventoryItem[] = [{ id: 'ZFA:0000135', order: 1, widthMm: 10, heightMm: 0.3 }]
    const cells = packInventory(thin, opts)
    expect(cells[0].widthMm).toBeCloseTo(10 + opts.gapMm, 6)
    expect(cells[0].heightMm).toBeCloseTo(0.3 + opts.gapMm, 6)
  })

  it('centres the block on the given height and returns its bounds', () => {
    const cells = packInventory(items, { ...opts, centreYMm: 2 })
    const bounds = inventoryBounds(cells)
    expect(bounds).not.toBeNull()
    expect((bounds!.minY + bounds!.maxY) / 2).toBeCloseTo(2, 6)
    expect(inventoryBounds([])).toBeNull()
    expect(packInventory([], opts)).toEqual([])
  })
})

describe('the slider curve', () => {
  it('mixes the grid in only above 60 percent', () => {
    expect(inventoryMix(0)).toBe(0)
    expect(inventoryMix(DISSECT_SPREAD_END)).toBe(0)
    expect(inventoryMix(80)).toBeGreaterThan(0)
    expect(inventoryMix(80)).toBeLessThan(1)
    expect(inventoryMix(DISSECT_MAX)).toBe(1)
  })

  it('fades the skin out by 60 percent and keeps a quarter of the yolk', () => {
    expect(skinDissectFade(0)).toBe(1)
    expect(skinDissectFade(30)).toBeCloseTo(0.5, 6)
    expect(skinDissectFade(DISSECT_SPREAD_END)).toBe(0)
    expect(skinDissectFade(100)).toBe(0)
    expect(bodyPartDissectFade(0)).toBe(1)
    expect(bodyPartDissectFade(100)).toBeCloseTo(0.25, 6)
  })

  it('damps toward the target and lands on it', () => {
    let v = 0
    for (let i = 0; i < 150; i++) v = dampTowards(v, 60, 1 / 60)
    expect(v).toBe(60)
    // One frame is clamped to 100 ms, which covers 39 percent of the gap at a 200 ms constant.
    expect(dampTowards(0, 100, 0.1)).toBeCloseTo(39.3, 1)
    expect(dampTowards(0, 100, 5)).toBeCloseTo(39.3, 1)
    expect(dampTowards(10, 10, 1 / 60)).toBe(10)
    expect(dampTowards(0, 60, 0)).toBe(60)
  })
})

describe('the store field and the D key', () => {
  it('clamps and rounds the slider value', () => {
    expect(clampDissect(-5)).toBe(0)
    expect(clampDissect(140)).toBe(100)
    expect(clampDissect(32.4)).toBe(32)
    expect(clampDissect(Number.NaN)).toBe(0)
  })

  it('walks 0, 30, 60, 100 and wraps at both ends', () => {
    expect(DISSECT_STEPS).toEqual([0, 30, 60, 100])
    let v = 0
    for (const expected of [30, 60, 100, 0]) {
      v = nextDissectStep(v, 1)
      expect(v).toBe(expected)
    }
    for (const expected of [100, 60, 30, 0]) {
      v = nextDissectStep(v, -1)
      expect(v).toBe(expected)
    }
    // A value between two steps moves to the next one in either direction.
    expect(nextDissectStep(45, 1)).toBe(60)
    expect(nextDissectStep(45, -1)).toBe(30)
  })

  it('setDissect writes the store and resetView returns to 0', () => {
    const store = createAtlasStore()
    expect(store.getState().dissect).toBe(0)
    store.getState().setDissect(45)
    expect(store.getState().dissect).toBe(45)
    store.getState().resetView(false)
    expect(store.getState().dissect).toBe(0)
  })

  it('D steps forward and Shift+D steps back', () => {
    const store = createAtlasStore()
    const dispatcher = createDispatcher(store)
    expect(dispatcher.dispatch(keyEvent('KeyD'))).toBe(true)
    expect(store.getState().dissect).toBe(30)
    dispatcher.dispatch(keyEvent('KeyD'))
    expect(store.getState().dissect).toBe(60)
    expect(dispatcher.dispatch(keyEvent('KeyD', true))).toBe(true)
    expect(store.getState().dissect).toBe(30)
  })
})

describe('the x URL key', () => {
  it('defaults to 0 and is left out of a default link', () => {
    expect(URL_DEFAULTS.x).toBe(0)
    expect(serializeUrl(URL_DEFAULTS)).toBe('')
  })

  it('round trips through the URL and the store', () => {
    expect(parseUrl('?x=60').state.x).toBe(60)
    expect(parseUrl('?x=200').state.x).toBe(0)
    expect(parseUrl('?x=200').warnings.length).toBe(1)
    const store = createAtlasStore()
    store.getState().setDissect(75)
    const url = store.getState().toUrl()
    expect(url.x).toBe(75)
    expect(serializeUrl(url)).toContain('x=75')
    const other = createAtlasStore()
    other.getState().applyUrl(parseUrl(serializeUrl(url)).state)
    expect(other.getState().dissect).toBe(75)
  })
})
