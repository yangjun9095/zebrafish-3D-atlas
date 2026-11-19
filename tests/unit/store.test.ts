import { describe, expect, it, vi } from 'vitest'
import type { AtlasData, StageRecord, StructureRecord } from '../../src/core/schema.ts'
import { presentIds } from '../../src/core/presence.ts'
import { stageIndexAt } from '../../src/core/timeAxis.ts'
import { URL_DEFAULTS, parseCam, parseUrl, serializeUrl, type UrlState } from '../../src/core/urlState.ts'
import { composeAtlasStore } from '../../src/state/slices/compose.ts'
import { hiddenForPreset } from '../../src/state/slices/visibility.ts'
import { KIT_JSON_MAX_CHARS, decodeKit, encodeBase64Url, encodeFluorescence, encodeKit, isBareKitLink } from '../../src/state/slices/url.ts'
import type { SlideKit, StoreDeps, ZfaId } from '../../src/state/slices/types.ts'
import { attachPersistence, deleteKit, initialSettings, readKit, readKits, readSettings, writeKit, type StorageLike } from '../../src/state/persist.ts'
import { createAtlasStore } from '../../src/state/store.ts'
import { exampleFluorescence } from '../../src/core/fluorescence.ts'

// ---- fixture -------------------------------------------------------------------------------------

const SYSTEM_IDS = [
  'early_embryo', 'axial', 'nervous', 'sensory', 'cardiovascular', 'hematopoietic_immune', 'respiratory',
  'digestive', 'excretory', 'endocrine', 'reproductive', 'skeletal', 'muscular', 'fins', 'integument_pigment',
]

function stage(zfs: string, shortLabel: string, period: string, startHpf: number, endHpf: number): StageRecord {
  return {
    zfs, zdb: 'ZDB-STAGE-010723-1', name: shortLabel, shortLabel, period, startHpf, endHpf, dpfLabel: '',
    landmarks: [], lengthMm: null, headline: false, sources: ['https://zfin.org/'],
  } as unknown as StageRecord
}

const STAGES = [
  stage('ZFS:0000001', '1-cell', 'zygote', 0, 0.75),
  stage('ZFS:0000002', '2-cell', 'cleavage', 0.75, 2.25),
  stage('ZFS:0000015', 'sphere', 'blastula', 2.25, 5.25),
  stage('ZFS:0000020', 'shield', 'gastrula', 5.25, 10.33),
  stage('ZFS:0000030', '26+ somites', 'segmentation', 10.33, 24),
  stage('ZFS:0000031', 'prim-5', 'pharyngula', 24, 30),
  stage('ZFS:0000032', 'prim-15', 'pharyngula', 30, 48),
  stage('ZFS:0000035', 'long-pec', 'hatching', 48, 72),
  stage('ZFS:0000037', 'protruding-mouth', 'larval', 72, 720),
  stage('ZFS:0000041', 'days 30-44', 'juvenile', 720, 2160),
  stage('ZFS:0000044', 'adult', 'adult', 2160, 17520),
]
const PERIODS = [
  ['zygote', 0, 0.75], ['cleavage', 0.75, 2.25], ['blastula', 2.25, 5.25], ['gastrula', 5.25, 10.33],
  ['segmentation', 10.33, 24], ['pharyngula', 24, 48], ['hatching', 48, 72], ['larval', 72, 720],
  ['juvenile', 720, 2160], ['adult', 2160, 17520],
].map(([id, startHpf, endHpf]) => ({ id, zfs: null, displayName: String(id), startHpf, endHpf }))

interface RecordOpts { sex?: 'female' | 'male'; fadeIn?: number; fadeOut?: number; group?: boolean }
function record(id: string, name: string, system: string, from: number, to: number, o: RecordOpts = {}): StructureRecord {
  return {
    id, name, synonyms: [], system, alsoIn: [], zfaParent: 'ZFA:0001094', uiParent: 'ZFA:0001094',
    parentRelation: 'part_of', definition: '', zfinStartStage: 'ZFS:0000001', zfinEndStage: 'ZFS:0000044',
    startHpf: from, endHpf: to, visibleFromHpf: from, modelEndHpf: to, overrideNote: null,
    fadeInHpf: o.fadeIn ?? 0.5, fadeOutHpf: o.fadeOut ?? 0.5, laterality: 'midline', pickable: true,
    sexSpecific: o.sex ?? null, aliasChain: [], events: [], sizes: [], colorOverride: null, sources: ['x'],
    geometry: o.group ? null : { kind: 'ellipsoid' },
  } as unknown as StructureRecord
}

const CHORION: ZfaId = 'ZFA:0000329'
const YOLK: ZfaId = 'ZFA:0000084'
const NOTOCHORD: ZfaId = 'ZFA:0000135'
const HEART: ZfaId = 'ZFA:0000114'
const EYE: ZfaId = 'ZFA:0000107'
const OVARY: ZfaId = 'ZFA:0000403'
const TESTIS: ZfaId = 'ZFA:0000598'
const CV_GROUP: ZfaId = 'ZFA:0000010'

const STRUCTURES = [
  record(CHORION, 'chorion', 'early_embryo', 0, 30, { fadeIn: 0, fadeOut: 6 }),
  record(YOLK, 'yolk', 'early_embryo', 0, 168, { fadeIn: 0, fadeOut: 1.2 }),
  record(NOTOCHORD, 'notochord', 'axial', 10, 4320, { fadeOut: 0 }),
  record(HEART, 'heart', 'cardiovascular', 19, 4320, { fadeIn: 0.15, fadeOut: 0 }),
  record(EYE, 'eye', 'sensory', 11.66, 4320, { fadeOut: 0 }),
  record(OVARY, 'ovary', 'reproductive', 600, 4320, { sex: 'female', fadeOut: 0 }),
  record(TESTIS, 'testis', 'reproductive', 600, 4320, { sex: 'male', fadeOut: 0 }),
  record(CV_GROUP, 'cardiovascular system', 'cardiovascular', 19, 4320, { group: true, fadeOut: 0 }),
]

const SYSTEMS = SYSTEM_IDS.map((id, i) => ({ id, order: i + 1 }))
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

const realDeps: StoreDeps = { stageIndexAt, presentIds }

function makeStore() {
  const store = composeAtlasStore(realDeps)
  store.getState().loadData({ ok: true, data: DATA })
  return store
}

function fakeStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

// ---- derived fields (AR-74) -----------------------------------------------------------------------

describe('setTime and the derived fields', () => {
  it('writes stageIndex and presentIds only when they change', () => {
    const store = makeStore()
    let stageWrites = 0
    let presentWrites = 0
    store.subscribe((s) => s.stageIndex, () => stageWrites++)
    store.subscribe((s) => s.presentIds, () => presentWrites++)

    store.getState().setTime(24)
    expect(store.getState().stageIndex).toBe(5)
    expect(store.getState().presentIds).toEqual([EYE, NOTOCHORD, YOLK, HEART, CHORION, CV_GROUP].sort())
    stageWrites = 0
    presentWrites = 0
    const ids = store.getState().presentIds

    store.getState().setTime(26)
    store.getState().setTime(29.5)
    expect(store.getState().time).toBe(29.5)
    expect(stageWrites).toBe(0)
    expect(presentWrites).toBe(0)
    expect(store.getState().presentIds).toBe(ids)

    store.getState().setTime(31)
    expect(stageWrites).toBe(1)
    expect(presentWrites).toBe(1)
    expect(store.getState().stageIndex).toBe(6)
    expect(store.getState().presentIds).not.toContain(CHORION)

    store.getState().setTime(31)
    expect(stageWrites).toBe(1)
    expect(presentWrites).toBe(1)
  })

  it('clamps to the axis and does nothing for the same time', () => {
    const store = makeStore()
    store.getState().setTime(9999)
    expect(store.getState().time).toBe(4320)
    let calls = 0
    const off = store.subscribe(() => calls++)
    store.getState().setTime(4320)
    off()
    expect(calls).toBe(0)
    store.getState().setTime(-5)
    expect(store.getState().time).toBe(0)
    store.getState().setTime(Number.NaN)
    expect(store.getState().time).toBe(24)
  })

  it('marks the tessellation interactive and stops playback at the axis end', () => {
    const store = makeStore()
    store.getState().setTessellation('final')
    store.getState().play()
    store.getState().setTime(4320)
    expect(store.getState().tessellation).toBe('interactive')
    expect(store.getState().playing).toBe(false)
  })

  it('derives at load, records a parse error, and swaps sex-specific records on setSex', () => {
    const store = composeAtlasStore(realDeps)
    expect(store.getState().stageIndex).toBe(-1)
    store.getState().setTime(700)
    store.getState().loadData({ ok: true, data: DATA })
    expect(store.getState().stageIndex).toBe(8)
    expect(store.getState().presentIds).toContain(OVARY)
    expect(store.getState().presentIds).not.toContain(TESTIS)
    store.getState().setSex('male')
    expect(store.getState().presentIds).toContain(TESTIS)
    expect(store.getState().presentIds).not.toContain(OVARY)
    store.getState().loadData({ ok: false, error: { file: 'stages', issues: [{ path: 'stages', message: 'bad' }] } })
    expect(store.getState().data).toBeNull()
    expect(store.getState().dataError?.file).toBe('stages')
  })
})

// ---- transport ---------------------------------------------------------------------------------

describe('transport', () => {
  it('steps stages and periods and nudges by 1 hpf or 1 dpf', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().setTime(24)
    s().stepStage(1)
    expect(s().time).toBe(30)
    s().stepStage(-1)
    s().stepStage(-1)
    expect(s().time).toBe(10.33)
    s().stepPeriod(1)
    expect(s().time).toBe(24)
    s().stepPeriod(1)
    expect(s().time).toBe(48)
    s().nudgeTime(-1)
    expect(s().time).toBe(47)
    s().setTime(72)
    s().nudgeTime(1)
    expect(s().time).toBe(96)
    s().nudgeTime(-1)
    expect(s().time).toBe(72)
    s().nudgeTime(-1)
    expect(s().time).toBe(71)
    s().setTime(0)
    s().stepStage(-1)
    expect(s().time).toBe(0)
    s().setTime(2160)
    s().stepStage(1)
    expect(s().time).toBe(4320)
  })

  it('play at the axis end returns to the time the last playback started', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().setTime(100)
    s().play()
    expect(s().playing).toBe(true)
    expect(s().playStartHpf).toBe(100)
    s().setTime(4320)
    expect(s().playing).toBe(false)
    s().play()
    expect(s().time).toBe(100)
    expect(s().playing).toBe(true)
    s().pause()
    expect(s().playing).toBe(false)
  })

  it('cycles units, clamps speed steps and temperature', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().cycleUnits()
    expect(s().units).toBe('hpf')
    s().cycleUnits()
    s().cycleUnits()
    expect(s().units).toBe('auto')
    s().stepSpeed(1)
    s().stepSpeed(1)
    s().stepSpeed(1)
    s().stepSpeed(1)
    expect(s().speed).toBe(8)
    s().stepSpeed(-1)
    expect(s().speed).toBe(4)
    s().setTemperature(40)
    expect(s().temperatureC).toBe(33)
    s().setTemperature(Number.NaN)
    expect(s().temperatureC).toBe(33)
  })

  it('jumpToAppearance targets visibleFromHpf + fadeInHpf', () => {
    const store = makeStore()
    store.getState().jumpToAppearance(HEART)
    expect(store.getState().time).toBeCloseTo(19.15, 6)
    store.getState().toggleSnap()
    store.getState().jumpToAppearance(CHORION)
    expect(store.getState().time).toBe(0)
  })
})

// ---- selection (AR-20) ------------------------------------------------------------------------

describe('select', () => {
  const ids = Array.from({ length: 14 }, (_, i) => `ZFA:${String(i + 1).padStart(7, '0')}` as ZfaId)

  it('caps the selection at 12 and drops the oldest id', () => {
    const store = makeStore()
    for (const id of ids) store.getState().select(id, { add: true })
    const { selection } = store.getState()
    expect(selection).toHaveLength(12)
    expect(selection[0]).toBe(ids[2])
    expect(selection[11]).toBe(ids[13])
  })

  it('replaces without add, toggles with add, clears with null', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().select(ids[0])
    s().select(ids[1])
    expect(s().selection).toEqual([ids[1]])
    s().select(ids[2], { add: true })
    expect(s().selection).toEqual([ids[1], ids[2]])
    s().select(ids[1], { add: true })
    expect(s().selection).toEqual([ids[2]])
    const before = s().selection
    s().select(ids[2])
    expect(s().selection).toBe(before)
    s().select(null)
    expect(s().selection).toEqual([])
    s().select(ids[3])
    s().clearSelection()
    expect(s().selection).toEqual([])
  })

  it('jumps to the first appearance when the setting is on and the structure is absent', () => {
    const store = makeStore()
    store.getState().setTime(5)
    store.getState().select(HEART)
    expect(store.getState().time).toBe(5)
    store.getState().setJumpOnSelect(true)
    store.getState().select(HEART)
    expect(store.getState().time).toBeCloseTo(19.15, 6)
  })

  it('hover and pinned labels', () => {
    const store = makeStore()
    let calls = 0
    store.getState().setHover(HEART)
    const off = store.subscribe(() => calls++)
    store.getState().setHover(HEART)
    off()
    expect(calls).toBe(0)
    store.getState().togglePinnedLabel(EYE)
    store.getState().togglePinnedLabel(HEART)
    store.getState().togglePinnedLabel(EYE)
    expect(store.getState().pinnedLabels).toEqual([HEART])
  })
})

// ---- visibility ---------------------------------------------------------------------------------

describe('visibility', () => {
  it('rail presets hide the complement of the kept systems', () => {
    const store = makeStore()
    store.getState().applyRailPreset('organs')
    expect(store.getState().hiddenSystems.sort()).toEqual(
      ['early_embryo', 'axial', 'skeletal', 'muscular', 'fins', 'integument_pigment'].sort(),
    )
    expect(store.getState().railPreset).toBe('organs')
    store.getState().applyRailPreset('skeleton')
    expect(store.getState().hiddenSystems).toHaveLength(14)
    store.getState().applyRailPreset('all')
    expect(store.getState().hiddenSystems).toEqual([])
    expect(hiddenForPreset(SYSTEM_IDS, 'none')).toHaveLength(15)
    store.getState().setSystemHidden('fins', true)
    expect(store.getState().railPreset).toBeNull()
  })

  it('solo hides every other system and a second solo restores the previous set', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().setSystemHidden('fins', true)
    s().soloSystem('nervous')
    expect(s().hiddenSystems).toHaveLength(14)
    expect(s().hiddenSystems).not.toContain('nervous')
    s().soloSystem('nervous')
    expect(s().hiddenSystems).toEqual(['fins'])
    expect(s().soloRestore).toBeNull()
  })

  it('x-ray toggles between 0 and the last non-zero value', () => {
    const store = makeStore()
    const s = () => store.getState()
    expect(s().xray).toBe(60)
    s().setXray(80.4)
    expect(s().xray).toBe(80)
    s().toggleXray()
    expect(s().xray).toBe(0)
    s().toggleXray()
    expect(s().xray).toBe(80)
    s().setXray(500)
    expect(s().xray).toBe(100)
  })

  it('section merges patches and clamps the position', () => {
    const store = makeStore()
    store.getState().setSection({ axis: 'sagittal' })
    store.getState().setSection({ position: 3 })
    store.getState().setSection({ flip: true })
    expect(store.getState().section).toEqual({ axis: 'sagittal', position: 1, flip: true })
    store.getState().setStructureHidden(YOLK, true)
    store.getState().setStructureHidden(YOLK, true)
    expect(store.getState().hiddenStructures).toEqual([YOLK])
  })

  it('resetView restores the lateral view; resetView(true) also clears selection, hides and time', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().setTime(100)
    s().select(HEART)
    s().setSystemHidden('fins', true)
    s().setXray(10)
    s().setIsolate(true)
    s().setCameraPose({ position: [1, 2, 3], target: [0, 0, 0] })
    expect(s().viewPreset).toBe('free')
    const fit = s().fitRequest
    s().resetView()
    expect(s().viewPreset).toBe('lateral')
    expect(s().camera).toBeNull()
    expect(s().fitRequest).toBe(fit + 1)
    expect(s().xray).toBe(60)
    expect(s().isolate).toBe(false)
    expect(s().selection).toEqual([HEART])
    expect(s().time).toBe(100)
    s().resetView(true)
    expect(s().selection).toEqual([])
    expect(s().hiddenSystems).toEqual([])
    expect(s().time).toBe(24)
  })

  it('resetView(true) drops a vocabulary term that no record stands in for (D17)', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().selectTerm('ZFA:0009401', null)
    expect(s().selectedTerm).toBe('ZFA:0009401')
    s().resetView(true)
    expect(s().selectedTerm).toBeNull()
  })

  it('the dissect slider turns the section plane off, and the URL follows (D17)', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().setSection({ axis: 'transverse', position: 0 })
    expect(s().section.axis).toBe('transverse')
    s().setDissect(100)
    expect(s().section.axis).toBeNull()
    expect(s().toUrl().sec).toBeUndefined()
    // A link that names both keys opens with the section off rather than on a blank canvas.
    s().setDissect(0)
    s().applyUrl(parseUrl('?t=48&x=100&sec=t:0.00').state)
    expect(s().dissect).toBe(100)
    expect(s().section.axis).toBeNull()
  })
})

// ---- modes and kits -----------------------------------------------------------------------------

describe('presentation mode and kits', () => {
  it('entry sets snap on, labels off and jump-on-select on; exit clears the black screen', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().setLabels(true)
    s().setPresentation(true)
    expect(s().snap).toBe(true)
    expect(s().labels).toBe(false)
    expect(s().jumpOnSelect).toBe(true)
    s().toggleBlackScreen()
    expect(s().blackScreen).toBe(true)
    s().setPresentation(false)
    expect(s().blackScreen).toBe(false)
  })

  it('addBookmark captures the view and stepBookmark applies the next one', () => {
    const store = makeStore()
    const s = () => store.getState()
    s().setTime(24)
    s().select(HEART)
    s().addBookmark('heart')
    s().setTime(48)
    s().select(EYE)
    s().setXray(90)
    s().addBookmark()
    expect(s().kit?.bookmarks).toHaveLength(2)
    expect(s().kit?.index).toBe(1)
    s().stepBookmark(-1)
    expect(s().kit?.index).toBe(0)
    expect(s().time).toBe(24)
    expect(s().selection).toEqual([HEART])
    expect(s().xray).toBe(60)
    s().stepBookmark(1)
    s().stepBookmark(1)
    expect(s().kit?.index).toBe(1)
    expect(s().time).toBe(48)
    const encoded = encodeKit(s().kit as SlideKit)
    expect(decodeKit(encoded)).toEqual(s().kit)
    expect(decodeKit('not-a-kit', (id) => (id === 'not-a-kit' ? (s().kit as SlideKit) : null))).toEqual(s().kit)
  })
})

// ---- the kit URL parameter (SEC-02) --------------------------------------------------------------

/** The base64url form of a value, the way a link carries it. */
const kitToken = (value: unknown): string => encodeBase64Url(JSON.stringify(value))

/** A bookmark that passes the schema of src/core/schema/body.ts. */
const GOOD_BOOKMARK = {
  name: 'one',
  t: 48,
  view: 'lateral',
  cam: null,
  sel: [HEART],
  hide: [],
  xr: 60,
  sec: { axis: null, position: 0, flip: false },
  iso: false,
  labels: false,
  notes: '',
}

/** The proof-of-concept link of docs/audit/02-security.md, decoded: {"id":"k1","bookmarks":[{"cam":{"position":1,"target":2}}]}. */
const CRAFTED_TOKEN = 'eyJpZCI6ImsxIiwiYm9va21hcmtzIjpbeyJjYW0iOnsicG9zaXRpb24iOjEsInRhcmdldCI6Mn19XX0'

describe('decodeKit validates the kit in the link (SEC-02)', () => {
  it('reads a kit that passes the schema', () => {
    const kit = decodeKit(kitToken({ id: 'k1', name: 'Kit', bookmarks: [GOOD_BOOKMARK], index: 0 }))
    expect(kit).not.toBeNull()
    expect(kit?.id).toBe('k1')
    expect(kit?.bookmarks).toHaveLength(1)
    expect(kit?.bookmarks[0]).toMatchObject({ name: 'one', t: 48, sel: [HEART] })
  })

  it('clamps the index to the bookmark list', () => {
    const kit = decodeKit(kitToken({ id: 'k1', name: 'Kit', bookmarks: [GOOD_BOOKMARK], index: 9 }))
    expect(kit?.index).toBe(0)
  })

  it('rejects the crafted link of the audit without throwing', () => {
    expect(() => decodeKit(CRAFTED_TOKEN)).not.toThrow()
    expect(decodeKit(CRAFTED_TOKEN)).toBeNull()
  })

  it('rejects a type-confused bookmark field', () => {
    const bad = [
      { id: 'k1', name: 'Kit', bookmarks: [{ ...GOOD_BOOKMARK, cam: { position: 1, target: 2 } }] },
      { id: 'k1', name: 'Kit', bookmarks: [{ ...GOOD_BOOKMARK, sel: 'abc' }] },
      { id: 'k1', name: 'Kit', bookmarks: [{ ...GOOD_BOOKMARK, hide: 7 }] },
      { id: 'k1', name: 'Kit', bookmarks: [{ ...GOOD_BOOKMARK, t: 'soon' }] },
      { id: 'k1', name: 'Kit', bookmarks: [{ ...GOOD_BOOKMARK, sec: { axis: 'diagonal', position: 0, flip: false } }] },
      { id: 'k1', name: 'Kit', bookmarks: [{ ...GOOD_BOOKMARK, extra: 1 }] },
      { id: 42, name: 'Kit', bookmarks: [GOOD_BOOKMARK] },
      { id: 'k1', name: 'Kit', bookmarks: 'nope' },
      { id: 'k1', name: '', bookmarks: [GOOD_BOOKMARK] },
      { id: 'k1', name: 'Kit', bookmarks: [] },
      { id: 'k1', name: 'Kit', bookmarks: [GOOD_BOOKMARK], index: -1 },
      [GOOD_BOOKMARK],
      'a string',
      null,
    ]
    for (const value of bad) {
      const token = kitToken(value)
      expect(() => decodeKit(token)).not.toThrow()
      expect(decodeKit(token)).toBeNull()
    }
  })

  it('rejects a malformed token and falls back to the stored kit', () => {
    const stored = { id: 'stored', name: 'Stored', bookmarks: [], index: 0 } as unknown as SlideKit
    for (const token of ['', '!!!not base64!!!', encodeBase64Url('{ not json'), encodeBase64Url('42')]) {
      expect(() => decodeKit(token)).not.toThrow()
      expect(decodeKit(token)).toBeNull()
      expect(decodeKit(token, () => stored)).toBe(stored)
    }
  })

  it('does not parse a payload above the size cap', () => {
    const token = kitToken({ id: 'k1', name: 'x'.repeat(KIT_JSON_MAX_CHARS), bookmarks: [GOOD_BOOKMARK] })
    expect(token.length).toBeGreaterThan(KIT_JSON_MAX_CHARS)
    expect(decodeKit(token)).toBeNull()
    // Well past the token cap as well, so the base64 decode never runs.
    const huge = 'A'.repeat(KIT_JSON_MAX_CHARS * 2 + 1)
    expect(() => decodeKit(huge)).not.toThrow()
    expect(decodeKit(huge)).toBeNull()
  })

  it('applyUrl warns instead of throwing when the link carries a crafted kit', () => {
    const store = makeStore()
    expect(() => store.getState().applyUrl(parseUrl(`kit=${CRAFTED_TOKEN}`).state)).not.toThrow()
    expect(store.getState().kit).toBeNull()
    expect(store.getState().warnings).toContain('The slide kit in the link could not be read')
  })

  it('applyUrl opens a bare link on the kit bookmark when the kit passes the schema', () => {
    const store = makeStore()
    const token = kitToken({ id: 'k1', name: 'Kit', bookmarks: [GOOD_BOOKMARK], index: 0 })
    store.getState().applyUrl(parseUrl(`kit=${token}`).state)
    expect(store.getState().warnings).not.toContain('The slide kit in the link could not be read')
    expect(store.getState().kit?.bookmarks[0]?.name).toBe('one')
    expect(store.getState().time).toBe(48)
    expect(store.getState().selection).toEqual([HEART])
  })
})

// ---- persistence --------------------------------------------------------------------------------

describe('persist', () => {
  it('reads the stored theme and writes user changes, never in embed mode', () => {
    const storage = fakeStorage()
    storage.setItem('zfatlas:settings:v1', JSON.stringify({ theme: 'light', units: 'dpf', snap: 'yes' }))
    const init = initialSettings(storage)
    expect(init).toEqual({ theme: 'light', themeSource: 'stored', units: 'dpf' })
    const store = composeAtlasStore(realDeps, init)
    const off = attachPersistence(store, storage)
    store.getState().setTheme('dark')
    store.getState().cycleUnits()
    store.getState().toggleSnap()
    expect(readSettings(storage)).toEqual({ theme: 'dark', units: 'auto', snap: true })
    store.getState().setEmbed(true)
    store.getState().setTheme('light')
    expect(readSettings(storage).theme).toBe('dark')
    off()
  })

  it('drops a stored kit that fails the schema and keeps the ones that pass', () => {
    const storage = fakeStorage()
    const good = { id: 'good', name: 'Good', index: 0, bookmarks: [{ name: 'one', t: 48, view: 'lateral' }] }
    storage.setItem('zfatlas:kits:v1', JSON.stringify({
      good,
      empty: { id: 'empty', name: 'Empty', bookmarks: [], index: 0 },
      wrong: { id: 'wrong', name: 'Wrong', bookmarks: [{ name: 'one', t: 48, fluorescence: { version: 2 } }], index: 0 },
      junk: 'not a kit',
    }))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      expect(Object.keys(readKits(storage))).toEqual(['good'])
      // normalizeBookmark has filled the defaults, so no caller sees a partial bookmark.
      expect(readKit('good', storage)?.bookmarks[0]).toMatchObject({ name: 'one', t: 48, xr: 60, notes: '', sel: [] })
      expect(readKit('wrong', storage)).toBeNull()
      expect(readKit('junk', storage)).toBeNull()
      expect(warn).toHaveBeenCalled()
    } finally { warn.mockRestore() }
    // Saving one kit leaves the unreadable entries in storage rather than deleting them.
    writeKit({ id: 'new', name: 'New', bookmarks: [], index: 0 }, storage)
    expect(Object.keys(JSON.parse(storage.map.get('zfatlas:kits:v1')!)).sort()).toEqual(['empty', 'good', 'junk', 'new', 'wrong'])
    deleteKit('junk', storage)
    expect(Object.keys(JSON.parse(storage.map.get('zfatlas:kits:v1')!))).not.toContain('junk')
  })

  it('reads a stored kit that carries a fluorescence preview', () => {
    const storage = fakeStorage()
    const store = makeStore()
    store.getState().setFluorescence({ enabled: true, rules: exampleFluorescence().rules })
    store.getState().addBookmark('with preview')
    writeKit(store.getState().kit!, storage)
    const back = readKit(store.getState().kit!.id, storage)
    expect(back?.bookmarks[0].fluorescence?.rules).toHaveLength(3)
  })

  it('survives a throwing storage', () => {
    const broken: StorageLike = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    }
    expect(initialSettings(broken).themeSource).toBe('system')
    const store = composeAtlasStore(realDeps)
    attachPersistence(store, broken)
    expect(() => store.getState().setTheme('light')).not.toThrow()
  })
})

// ---- URL ----------------------------------------------------------------------------------------

function richState(store: ReturnType<typeof makeStore>) {
  const s = store.getState()
  s.setTime(48)
  s.select(YOLK)
  s.setCameraPose({ position: [0, 0, 5], target: [0, 0, 0] })
  s.setSystemHidden('integument_pigment', true)
  s.setStructureHidden(YOLK, true)
  s.setXray(80)
  s.setSection({ axis: 'sagittal', position: 0.25, flip: true })
  s.setIsolate(true)
  s.setTheme('light')
  s.setUnits('dpf')
  s.toggleSnap()
  s.setLabels(true)
  s.setTemperature(25)
  s.setSex('male')
  s.toggleStripPin()
  s.setProjectorScale(1.5)
  // The bookmark is taken before the last changes, so it differs from the final state (F02, F10).
  s.addBookmark('one')
  s.setTime(26.5)
  s.select(HEART)
  s.select(EYE, { add: true })
  s.setCameraPose({ position: [1.2, 0.8, 3.1], target: [0, 0.1, 0] })
}

describe('toUrl and applyUrl', () => {
  it('toUrl reads exactly the AR-19 fields and omits absent optional ones', () => {
    const store = makeStore()
    const u = store.getState().toUrl()
    expect(u).toEqual({
      t: 24, v: 'lat', xr: 60, x: 0, iso: 0, u: 'auto', temp: 28.5, sex: 'f', embed: 0, present: 0, pin: 0, ps: '1',
    })
    expect(serializeUrl(u)).toBe('')
    richState(store)
    const r = store.getState().toUrl()
    expect(r.sel).toBe('0000114,0000107')
    expect(parseCam(r.cam)).toEqual({ position: [1.2, 0.8, 3.1], target: [0, 0.1, 0] })
    expect(r.v).toBe('lat')
    expect(r.hide).toBe('integument_pigment,0000084')
    expect(r.sec).toBe('sag:0.25:f')
    expect(r).toMatchObject({ t: 26.5, xr: 80, iso: 1, theme: 'light', u: 'dpf', snap: 1, labels: 1, temp: 25, sex: 'm', pin: 1, ps: '1.5' })
    expect(typeof r.kit).toBe('string')
    expect(store.getState().toUrl({ includeCamera: false }).cam).toBeUndefined()
    expect(store.getState().toUrl({ includeTheme: false }).theme).toBeUndefined()
  })

  it('applyUrl drops unknown ids with a warning and applies the rest', () => {
    const store = makeStore()
    const u = {
      t: 5000, sel: '9999999,0000114', v: 'dor', hide: 'nosuch,0000084,1234567', xr: 30, sec: 'tra:-0.5', iso: 1,
      u: 'hpf', temp: 30, sex: 'm', embed: 0, present: 1, pin: 0, ps: '2',
    } as UrlState
    store.getState().applyUrl(u)
    const s = store.getState()
    expect(s.time).toBe(4320)
    expect(s.selection).toEqual([HEART])
    expect(s.hiddenSystems).toEqual([])
    expect(s.hiddenStructures).toEqual([YOLK])
    expect(s.warnings).toEqual([
      'Structure ZFA:9999999 is not in this atlas',
      'System "nosuch" is not in this atlas',
      'Structure ZFA:1234567 is not in this atlas',
    ])
    expect(s.viewPreset).toBe('dorsal')
    expect(s.section).toEqual({ axis: 'transverse', position: -0.5, flip: false })
    expect(s.presentation).toBe(true)
    expect(s.snap).toBe(true)
    expect(s.labels).toBe(false)
    expect(s.sex).toBe('male')
    expect(s.stageIndex).toBe(10)
    expect(s.projectorScale).toBe(2)
    expect(s.presentIds).toContain(TESTIS)
    expect(s.presentIds).not.toContain(OVARY)
  })

  it('round-trips through urlState.parseUrl and serializeUrl', () => {
    const a = createAtlasStore()
    a.getState().loadData({ ok: true, data: DATA })
    richState(a)
    expect(a.getState().presentIds.length).toBeGreaterThan(0)
    const first = a.getState().toUrl()

    const query = serializeUrl(first)
    const parsed = parseUrl(query)
    expect(parsed.warnings).toEqual([])

    const b = createAtlasStore()
    b.getState().loadData({ ok: true, data: DATA })
    b.getState().applyUrl(parsed.state)
    // The URL's own view wins over the kit's bookmark (D1): t 26.5 and the two structures, not the bookmark's 48 and the yolk.
    expect(b.getState().toUrl()).toEqual(first)
    expect(b.getState().time).toBe(26.5)
    expect(b.getState().selection).toEqual([HEART, EYE])
    expect(b.getState().camera).toEqual({ position: [1.2, 0.8, 3.1], target: [0, 0.1, 0] })
    expect(b.getState().kit?.bookmarks[0]).toMatchObject({ name: 'one', t: 48, sel: [YOLK] })
    expect(b.getState().warnings).toEqual([])
    expect(b.getState().presentIds).toEqual(a.getState().presentIds)

    const bare = createAtlasStore()
    bare.getState().loadData({ ok: true, data: DATA })
    const defaults = bare.getState().toUrl()
    const again = parseUrl(serializeUrl(defaults))
    expect(again.warnings).toEqual([])
    bare.getState().applyUrl(again.state)
    expect(bare.getState().toUrl()).toEqual(defaults)
  })

  it('a bare ?kit= link opens on the kit bookmark; a link with a view keeps its own view (UI-38, D1)', () => {
    const a = makeStore()
    a.getState().setTime(48)
    a.getState().select(HEART)
    a.getState().addBookmark('heart at 48')
    const kitToken = a.getState().toUrl().kit as string
    const bareLink = parseUrl(`kit=${encodeURIComponent(kitToken)}`).state
    const b = makeStore()
    b.getState().applyUrl(bareLink)
    expect(b.getState().time).toBe(48)
    expect(b.getState().selection).toEqual([HEART])
    const viewLink = parseUrl(`t=120&sel=0000107&kit=${encodeURIComponent(kitToken)}`).state
    const c = makeStore()
    c.getState().applyUrl(viewLink)
    expect(c.getState().time).toBe(120)
    expect(c.getState().selection).toEqual([EYE])
    expect(c.getState().kit?.bookmarks[0]?.name).toBe('heart at 48')
  })

  it('a link that carries only fp is not a bare kit link (UI-38)', () => {
    const a = makeStore()
    a.getState().setTime(48)
    a.getState().addBookmark('slide one')
    const kitToken = a.getState().toUrl().kit as string
    expect(isBareKitLink(parseUrl(`kit=${encodeURIComponent(kitToken)}`).state)).toBe(true)
    const fp = encodeFluorescence(exampleFluorescence())
    const withPreview = parseUrl(`kit=${encodeURIComponent(kitToken)}&fp=${fp}`).state
    expect(withPreview.fp).toBe(fp)
    expect(isBareKitLink(withPreview)).toBe(false)
    // So the link's own time wins over the bookmark's.
    const b = makeStore()
    b.getState().applyUrl(withPreview)
    expect(b.getState().time).toBe(URL_DEFAULTS.t)
    expect(b.getState().fluorescence.rules).toHaveLength(3)
  })

  it('hide carries every hidden system and structure, past the 12 of sel (AR-20)', () => {
    const a = makeStore()
    a.getState().applyRailPreset('none')
    a.getState().setStructureHidden(HEART, true)
    a.getState().setStructureHidden(EYE, true)
    a.getState().setStructureHidden(YOLK, true)
    const systems = a.getState().hiddenSystems
    expect(systems.length).toBeGreaterThanOrEqual(15)
    const query = serializeUrl(a.getState().toUrl())
    const parsed = parseUrl(query)
    expect(parsed.warnings).toEqual([])
    expect(parsed.state.hide?.split(',')).toHaveLength(systems.length + 3)
    const b = makeStore()
    b.getState().applyUrl(parsed.state)
    expect(b.getState().hiddenSystems).toEqual(systems)
    expect(b.getState().hiddenStructures).toEqual([HEART, EYE, YOLK])
  })
})
