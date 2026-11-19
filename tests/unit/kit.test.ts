// Slide kit (spec 5.12, AR-60, WP-I5): bookmark normalisation, the kit actions with and without
// the rAF motion, the pure edit helpers of the sheet, the JSON form, the link limit and the ZIP writer.
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AtlasData, StageRecord, StructureRecord } from '../../src/core/schema.ts'
import { presentIds } from '../../src/core/presence.ts'
import { stageIndexAt } from '../../src/core/timeAxis.ts'
import { composeAtlasStore } from '../../src/state/slices/compose.ts'
import {
  BOOKMARK_CAMERA_MS, BOOKMARK_TIME_MS, bookmarkEase, cancelBookmarkMotion, kitFromJson, kitFromRecord, kitLinkTooLong, kitToJson,
  kitWithBookmarks, moveItem, normalizeBookmark, removeItem, updateBookmark,
} from '../../src/state/slices/mode.ts'
import type { Bookmark, SlideKit, StoreDeps, ZfaId } from '../../src/state/slices/types.ts'
import { buildZip, crc32, dosDateTime, listZip } from '../../src/viewer/export/zip.ts'

// ---- fixture -------------------------------------------------------------------------------------

function stage(zfs: string, shortLabel: string, period: string, startHpf: number, endHpf: number): StageRecord {
  return {
    zfs, zdb: 'ZDB-STAGE-010723-1', name: shortLabel, shortLabel, period, startHpf, endHpf, dpfLabel: '',
    landmarks: [], lengthMm: null, headline: false, sources: ['https://zfin.org/'],
  } as unknown as StageRecord
}
const STAGES = [
  stage('ZFS:0000001', '1-cell', 'zygote', 0, 0.75),
  stage('ZFS:0000015', 'sphere', 'blastula', 0.75, 10),
  stage('ZFS:0000031', 'prim-5', 'pharyngula', 10, 48),
  stage('ZFS:0000037', 'protruding-mouth', 'larval', 48, 2160),
  stage('ZFS:0000044', 'adult', 'adult', 2160, 17520),
]
const PERIODS = [['zygote', 0, 0.75], ['blastula', 0.75, 10], ['pharyngula', 10, 48], ['larval', 48, 2160], ['adult', 2160, 17520]]
  .map(([id, startHpf, endHpf]) => ({ id, zfs: null, displayName: String(id), startHpf, endHpf }))

function record(id: string, name: string, system: string, from: number, to: number): StructureRecord {
  return {
    id, name, synonyms: [], system, alsoIn: [], zfaParent: 'ZFA:0001094', uiParent: 'ZFA:0001094', parentRelation: 'part_of',
    definition: '', zfinStartStage: 'ZFS:0000001', zfinEndStage: 'ZFS:0000044', startHpf: from, endHpf: to, visibleFromHpf: from,
    modelEndHpf: to, overrideNote: null, fadeInHpf: 0.5, fadeOutHpf: 0.5, laterality: 'midline', pickable: true, sexSpecific: null,
    aliasChain: [], events: [], sizes: [], colorOverride: null, sources: ['x'], geometry: { kind: 'ellipsoid' },
  } as unknown as StructureRecord
}
const HEART: ZfaId = 'ZFA:0000114'
const EYE: ZfaId = 'ZFA:0000107'
const STRUCTURES = [record(HEART, 'heart', 'cardiovascular', 19, 4320), record(EYE, 'eye', 'sensory', 11.66, 4320)]
const SYSTEMS = ['early_embryo', 'axial', 'nervous', 'sensory', 'cardiovascular'].map((id, i) => ({ id, order: i + 1 }))
const DATA = {
  systems: SYSTEMS,
  stages: { stages: STAGES, periods: PERIODS },
  structures: STRUCTURES,
  body: { keyframes: [] },
  handoffs: [],
  kits: [],
  structuresById: new Map(STRUCTURES.map((r) => [r.id, r])),
  systemsById: new Map(SYSTEMS.map((s) => [s.id, s])),
  warnings: [],
} as unknown as AtlasData

const deps: StoreDeps = { stageIndexAt, presentIds }

function makeStore() {
  const store = composeAtlasStore(deps)
  store.getState().loadData({ ok: true, data: DATA })
  return store
}

const bm = (name: string, t: number, extra: Partial<Bookmark> = {}): Bookmark => normalizeBookmark({ name, t, ...extra })

/** A rAF queue driven by hand; performance.now follows the frame clock. */
function fakeFrames() {
  let now = 0
  const queue: Array<{ id: number; cb: FrameRequestCallback }> = []
  let nextId = 1
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = nextId++
    queue.push({ id, cb })
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    const i = queue.findIndex((q) => q.id === id)
    if (i >= 0) queue.splice(i, 1)
  })
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  return {
    step(ms: number) {
      now += ms
      const due = queue.splice(0)
      for (const q of due) q.cb(now)
    },
    pending: () => queue.length,
  }
}

afterEach(() => {
  cancelBookmarkMotion()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ---- bookmarks and kit actions ------------------------------------------------------------------

describe('normalizeBookmark', () => {
  it('fills every default of spec 2.4 and prefixes bare ZFA numbers', () => {
    const b = normalizeBookmark({ name: 'Heart', t: 22, sel: ['0000114', 'ZFA:0000107'], iso: true })
    expect(b).toEqual({
      name: 'Heart', t: 22, view: 'lateral', cam: null, sel: [HEART, EYE], hide: [], xr: 60,
      sec: { axis: null, position: 0, flip: false }, iso: true, labels: false, notes: '',
    })
    expect(normalizeBookmark({}).name).toBe('Bookmark')
    expect(normalizeBookmark({ t: 9000 }).t).toBe(4320)
  })
})

describe('kit actions without requestAnimationFrame (node)', () => {
  it('loadKit normalises compact starter rows, applies the index and drops unknown ids', () => {
    const store = makeStore()
    const s = () => store.getState()
    const compact = { id: 'starter', name: 'Starter', index: 1, bookmarks: [{ name: 'A', t: 4 }, { name: 'B', t: 24, sel: [HEART, 'ZFA:9999999'], hide: ['nosuch', 'axial'], iso: true }] }
    s().loadKit(compact as unknown as SlideKit)
    expect(s().kit?.index).toBe(1)
    expect(s().kit?.bookmarks[0]).toMatchObject({ xr: 60, cam: null, notes: '' })
    expect(s().time).toBe(24)
    expect(s().selection).toEqual([HEART])
    expect(s().hiddenSystems).toEqual(['axial'])
    expect(s().isolate).toBe(true)
  })

  it('goToBookmark clamps to the list, and stepBookmark stops at both ends', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().loadKit({ id: 'k', name: 'K', index: 0, bookmarks: [bm('a', 0), bm('b', 10), bm('c', 48)] })
    s().goToBookmark(99)
    expect(s().kit?.index).toBe(2)
    expect(s().time).toBe(48)
    s().stepBookmark(1)
    expect(s().kit?.index).toBe(2)
    s().goToBookmark(-5)
    expect(s().kit?.index).toBe(0)
    expect(s().time).toBe(0)
    s().stepBookmark(-1)
    expect(s().kit?.index).toBe(0)
  })

  it('a preset bookmark re-fits the preset; a free-camera bookmark restores the pose', () => {
    const store = makeStore()
    const s = () => store.getState()
    const pose = { position: [1, 2, 3] as [number, number, number], target: [0, 0, 0] as [number, number, number] }
    s().loadKit({ id: 'k', name: 'K', index: 0, bookmarks: [bm('dorsal', 10, { view: 'dorsal' }), bm('free', 20, { view: 'free', cam: pose })] })
    expect(s().viewPreset).toBe('dorsal')
    const fits = s().fitRequest
    s().stepBookmark(1)
    expect(s().viewPreset).toBe('free')
    expect(s().camera).toEqual(pose)
    s().stepBookmark(-1)
    expect(s().viewPreset).toBe('dorsal')
    expect(s().fitRequest).toBe(fits + 1)
  })

  it('addBookmark captures a preset view with cam null and a free view with its pose', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().setTime(30)
    s().addBookmark('one')
    expect(s().kit?.bookmarks[0]).toMatchObject({ name: 'one', t: 30, view: 'lateral', cam: null })
    s().setCameraPose({ position: [1, 1, 1], target: [0, 0, 0] })
    s().addBookmark()
    expect(s().kit?.bookmarks[1]).toMatchObject({ name: 'Bookmark 2', view: 'free', cam: { position: [1, 1, 1], target: [0, 0, 0] } })
    expect(s().kit?.index).toBe(1)
  })
})

describe('bookmark motion (AR-60, UX-EX-14)', () => {
  it('eases time over 600 ms and the camera over 500 ms with cubic-bezier(0.2, 0, 0, 1)', () => {
    const frames = fakeFrames()
    const store = makeStore()
    const s = () => store.getState()
    const cam0 = { position: [0, 0, 10] as [number, number, number], target: [0, 0, 0] as [number, number, number] }
    const cam1 = { position: [10, 0, 0] as [number, number, number], target: [1, 0, 0] as [number, number, number] }
    s().loadKit({ id: 'k', name: 'K', index: 0, bookmarks: [bm('a', 0, { view: 'free', cam: cam0 }), bm('b', 600, { view: 'free', cam: cam1 })] })
    frames.step(1000)
    expect(s().time).toBe(0)
    s().stepBookmark(1)
    expect(s().time).toBe(0)
    expect(frames.pending()).toBe(1)
    frames.step(BOOKMARK_TIME_MS / 2)
    const mid = s().time
    expect(mid).toBeGreaterThan(300)
    expect(mid).toBeLessThan(600)
    expect(s().camera?.position[0]).toBeGreaterThan(5)
    expect(s().camera?.position[0]).toBeLessThan(10)
    frames.step(BOOKMARK_CAMERA_MS / 2)
    expect(s().camera).toEqual(cam1)
    frames.step(BOOKMARK_TIME_MS)
    expect(s().time).toBe(600)
    expect(frames.pending()).toBe(0)
  })

  it('a new step cancels the running motion, and reduced motion or playback cuts', () => {
    const frames = fakeFrames()
    const store = makeStore()
    const s = () => store.getState()
    s().loadKit({ id: 'k', name: 'K', index: 0, bookmarks: [bm('a', 0), bm('b', 100), bm('c', 200)] })
    frames.step(1000)
    s().stepBookmark(1)
    frames.step(100)
    s().stepBookmark(1)
    expect(frames.pending()).toBe(1)
    frames.step(2000)
    expect(s().time).toBe(200)
    s().setReducedMotion(true)
    s().goToBookmark(0)
    expect(s().time).toBe(0)
    expect(frames.pending()).toBe(0)
    s().setReducedMotion(false)
    s().play()
    s().goToBookmark(2)
    expect(s().time).toBe(200)
    expect(frames.pending()).toBe(0)
    // The ZIP export asks for a cut and leaves the reduced-motion preference alone (F08).
    s().pause()
    s().goToBookmark(1, { motion: 'cut' })
    expect(s().time).toBe(100)
    expect(frames.pending()).toBe(0)
    expect(s().reducedMotion).toBe(false)
  })

  it('bookmarkEase is an ease-out curve through (0, 0) and (1, 1)', () => {
    expect(bookmarkEase(0)).toBe(0)
    expect(bookmarkEase(1)).toBe(1)
    let last = 0
    for (let i = 1; i <= 20; i++) {
      const y = bookmarkEase(i / 20)
      expect(y).toBeGreaterThanOrEqual(last)
      last = y
    }
    expect(bookmarkEase(0.5)).toBeGreaterThan(0.75)
  })
})

// ---- edit helpers and JSON -----------------------------------------------------------------------

describe('kit edit helpers', () => {
  const kit: SlideKit = { id: 'k', name: 'K', index: 2, bookmarks: [bm('a', 0), bm('b', 10), bm('c', 20)] }

  it('moveItem and removeItem return new arrays and ignore bad indices', () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1])
    expect(moveItem([1, 2, 3], 2, 0)).toEqual([3, 1, 2])
    expect(moveItem([1, 2, 3], 5, 0)).toEqual([1, 2, 3])
    expect(removeItem([1, 2, 3], 1)).toEqual([1, 3])
    expect(removeItem([1, 2, 3], 7)).toEqual([1, 2, 3])
  })

  it('kitWithBookmarks clamps the index and updateBookmark patches one row', () => {
    expect(kitWithBookmarks(kit, removeItem(kit.bookmarks, 2)).index).toBe(1)
    expect(kitWithBookmarks(kit, [], 4)).toMatchObject({ bookmarks: [], index: 0 })
    const renamed = updateBookmark(kit, 1, { name: 'B!', notes: 'n' })
    expect(renamed.bookmarks[1]).toMatchObject({ name: 'B!', notes: 'n', t: 10 })
    expect(renamed.bookmarks[0]).toBe(kit.bookmarks[0])
    expect(kit.bookmarks[1].name).toBe('b')
  })

  it('kitToJson round-trips through kitFromJson; garbage returns null', () => {
    const text = kitToJson(kit)
    expect(kitFromJson(text)).toEqual(kit)
    expect(JSON.parse(text)).toEqual({ id: 'k', name: 'K', bookmarks: kit.bookmarks, index: 2 })
    expect(kitFromJson('{')).toBeNull()
    expect(kitFromJson('{"name":"x"}')).toBeNull()
    expect(kitFromJson('{"name":"x","bookmarks":[]}')).toBeNull()
    const noId = kitFromJson('{"name":"x","bookmarks":[{"name":"a","t":5}],"index":9}')
    expect(noId?.id).toMatch(/^kit_/)
    expect(noId?.index).toBe(0)
    expect(noId?.bookmarks[0]).toMatchObject({ t: 5, xr: 60, cam: null })
  })

  it('kitFromRecord copies a starter with a fresh id at index 0', () => {
    const copy = kitFromRecord({ name: 'Starter', bookmarks: [{ name: 'x', t: 1 }, { name: 'y', t: 2, iso: true }] })
    expect(copy.id).toMatch(/^kit_/)
    expect(copy.index).toBe(0)
    expect(copy.bookmarks[1]).toMatchObject({ name: 'y', t: 2, iso: true, sel: [] })
  })

  it('kitLinkTooLong flags a kit above 2 KB as base64url (UI-38)', () => {
    expect(kitLinkTooLong(kit)).toBe(false)
    const big: SlideKit = { ...kit, bookmarks: Array.from({ length: 40 }, (_, i) => bm(`slide ${i}`, i, { notes: 'x'.repeat(40) })) }
    expect(kitLinkTooLong(big)).toBe(true)
  })
})

// ---- zip writer ------------------------------------------------------------------------------------

describe('zip.ts', () => {
  const enc = new TextEncoder()

  it('crc32 matches the IEEE reference values', () => {
    expect(crc32(new Uint8Array(0))).toBe(0)
    expect(crc32(enc.encode('hello world'))).toBe(0x0d4a1185)
    expect(crc32(enc.encode('The quick brown fox jumps over the lazy dog'))).toBe(0x414fa339)
  })

  it('dosDateTime packs the fields and clamps years before 1980', () => {
    const d = new Date(2026, 8, 7, 13, 45, 30)
    expect(dosDateTime(d)).toEqual({ time: (13 << 11) | (45 << 5) | 15, date: (46 << 9) | (9 << 5) | 7 })
    expect(dosDateTime(new Date(1970, 0, 1)).date >> 9).toBe(0)
  })

  it('buildZip writes stored entries that listZip reads back with matching checksums', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])
    const bytes = buildZip([
      { name: '01_zfatlas_0hpf_lateral_all_2x.png', data: png },
      { name: 'ünïcode/slide two.png', data: enc.encode('second') },
      { name: 'empty.txt', data: new Uint8Array(0) },
    ], new Date(2026, 0, 2, 3, 4, 6))
    const view = new DataView(bytes.buffer)
    expect(view.getUint32(0, true)).toBe(0x04034b50)
    expect(view.getUint32(bytes.length - 22, true)).toBe(0x06054b50)
    expect(view.getUint16(bytes.length - 22 + 10, true)).toBe(3)
    const listed = listZip(bytes)
    expect(listed.map((e) => e.name)).toEqual(['01_zfatlas_0hpf_lateral_all_2x.png', 'ünïcode/slide two.png', 'empty.txt'])
    expect(listed.map((e) => e.size)).toEqual([png.length, 6, 0])
    expect(Array.from(listed[0].data)).toEqual(Array.from(png))
    expect(new TextDecoder().decode(listed[1].data)).toBe('second')
    expect(listed[0].crc32).toBe(crc32(png))
    // The central directory sits after every local record; sizes add up.
    const localBytes = 3 * 30 + png.length + 6 + enc.encode('01_zfatlas_0hpf_lateral_all_2x.png').length + enc.encode('ünïcode/slide two.png').length + enc.encode('empty.txt').length
    expect(view.getUint32(bytes.length - 22 + 16, true)).toBe(localBytes)
  })

  it('listZip rejects a truncated archive and a corrupted entry', () => {
    const bytes = buildZip([{ name: 'a.txt', data: enc.encode('abc') }])
    expect(() => listZip(bytes.subarray(0, bytes.length - 1))).toThrow(/end record/)
    const bad = new Uint8Array(bytes)
    bad[30 + 5] ^= 0xff
    expect(() => listZip(bad)).toThrow(/checksum/)
  })
})
