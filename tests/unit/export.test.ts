// Export planning, outline bands and share links (AR-52, AR-53, AR-56, AR-57, UI-34, UX-EX-09).
import { describe, expect, it } from 'vitest'
import { presentIds } from '../../src/core/presence.ts'
import type { AtlasData, StageRecord, StructureRecord } from '../../src/core/schema.ts'
import { stageIndexAt } from '../../src/core/timeAxis.ts'
import { parseUrl } from '../../src/core/urlState.ts'
import { composeAtlasStore } from '../../src/state/slices/compose.ts'
import { PRESET_PARAM_DIRECTIONS, nearestPresetParam, shareState, shareUrl } from '../../src/state/urlSync.ts'
import { BAND_BG, BAND_FOCUS, BAND_NONE, chamferDistance, hexToRgb, outlineBands, paintBands } from '../../src/viewer/export/outlineMask.ts'
import { EXPORT_CREDIT, REPORTER_PREVIEW_CREDIT, creditText, setExportCredit } from '../../src/viewer/export/overlay.ts'
import {
  MAX_EDGE_PX, TILE_EDGE_PX, TILE_EDGE_SMALL_PX, blitTile, exportFileName, frameBox, outputSize, overlayPalette, planTiles, scaleBarFor, slug, tileEdge,
} from '../../src/viewer/export/plan.ts'
import { PRESET_DIRECTIONS } from '../../src/viewer/presets.ts'

const CANVAS = { width: 820, height: 740 }

describe('output size (AR-52, UX-EX-01, UX-EX-02)', () => {
  it('doubles the canvas CSS size at 2x for the viewport frame', () => {
    const out = outputSize({ frame: 'viewport', scale: 2 }, CANVAS)
    expect(out).toMatchObject({ width: 1640, height: 1480, scale: 2, token: '2x', overCap: false })
  })
  it('fits a 16:9, 4:3 and 1:1 frame inside the canvas', () => {
    expect(frameBox('16:9', CANVAS).height).toBeCloseTo(820 * (9 / 16), 6)
    expect(frameBox('4:3', CANVAS).height).toBeCloseTo(615, 6)
    expect(frameBox('1:1', CANVAS)).toEqual({ width: 740, height: 740 })
    expect(frameBox('16:9', { width: 1000, height: 900 })).toEqual({ width: 1000, height: 562.5 })
  })
  it('uses the fixed slide sizes as given and derives the overlay scale from the 16:9 box', () => {
    const out = outputSize({ frame: '16:9', fixedSize: '1920x1080' }, CANVAS)
    expect(out.width).toBe(1920)
    expect(out.height).toBe(1080)
    expect(out.token).toBe('1920x1080')
    expect(out.scale).toBeCloseTo(1080 / (820 * (9 / 16)), 6)
  })
  it('flags an export above the 8192 px cap', () => {
    expect(outputSize({ scale: 4 }, { width: 2100, height: 900 }).overCap).toBe(true)
    expect(outputSize({ scale: 4 }, { width: 2048, height: 900 }).overCap).toBe(false)
    expect(MAX_EDGE_PX).toBe(8192)
  })
})

describe('tiles (AR-53)', () => {
  it('picks 2048 on a desktop GPU and 1024 on a phone or a small texture limit', () => {
    expect(tileEdge({ maxTextureSize: 16384, maxRenderbufferSize: 16384, phone: false })).toBe(TILE_EDGE_PX)
    expect(tileEdge({ maxTextureSize: 16384, maxRenderbufferSize: 16384, phone: true })).toBe(TILE_EDGE_SMALL_PX)
    expect(tileEdge({ maxTextureSize: 2048, maxRenderbufferSize: 4096, phone: false })).toBe(1024)
  })
  it('covers the output with row-major tiles', () => {
    const tiles = planTiles(3200, 1500, 2048)
    expect(tiles).toEqual([
      { x: 0, y: 0, width: 2048, height: 1500 },
      { x: 2048, y: 0, width: 1152, height: 1500 },
    ])
    expect(planTiles(4096, 4096, 2048)).toHaveLength(4)
    expect(planTiles(100, 50, 2048)).toEqual([{ x: 0, y: 0, width: 100, height: 50 }])
  })
  it('flips the bottom-up rows of a tile into the top-down image', () => {
    const image = new Uint8ClampedArray(4 * 2 * 4)
    const rows = new Uint8Array([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4])
    blitTile(image, 4, { x: 2, y: 0, width: 2, height: 2 }, rows)
    // Bottom row of the tile (3, 4) lands on image row 0.
    expect(Array.from(image.subarray(8, 16))).toEqual([3, 3, 3, 3, 4, 4, 4, 4])
    expect(Array.from(image.subarray(24, 32))).toEqual([1, 1, 1, 1, 2, 2, 2, 2])
  })
})

describe('file name (AR-57, UX-EX-04)', () => {
  it('follows zfatlas_<time>_<view>_<selection-or-all>_<size>.png', () => {
    expect(exportFileName({ time: '24hpf', view: 'lateral', selectionNames: ['heart'], sizeToken: '2x' })).toBe('zfatlas_24hpf_lateral_heart_2x.png')
    expect(exportFileName({ time: '5dpf', view: 'dorsal', selectionNames: [], sizeToken: '1920x1080' })).toBe('zfatlas_5dpf_dorsal_all_1920x1080.png')
    expect(exportFileName({ time: '24hpf', view: 'free', selectionNames: ['otic vesicle', 'eye', 'heart'], sizeToken: '4x' })).toBe('zfatlas_24hpf_free_otic-vesicle+2_4x.png')
  })
  it('slugs names to lower-case ASCII', () => {
    expect(slug('Pectoral fin (left)')).toBe('pectoral-fin-left')
    expect(slug('!!!')).toBe('structure')
  })
})

describe('overlay colours and scale bar (AR-56, UXR-07)', () => {
  it('auto is dark ink on a transparent export and the theme ink otherwise', () => {
    expect(overlayPalette('auto', true, 'dark').ink).toBe('#1B1F24')
    expect(overlayPalette('auto', false, 'dark').ink).toBe('#E7EAEE')
    expect(overlayPalette('auto', false, 'light').ink).toBe('#1B1F24')
    expect(overlayPalette('light', true, 'light').ink).toBe('#E7EAEE')
    expect(overlayPalette('dark', false, 'dark').halo).toBe('#F5F6F7')
  })
  it('picks the longest 1-2-5 length that fits', () => {
    expect(scaleBarFor(100, 200)).toEqual({ mm: 2, px: 200, label: '2 mm' })
    expect(scaleBarFor(400, 200)).toEqual({ mm: 0.5, px: 200, label: '500 µm' })
    expect(scaleBarFor(1000, 150)).toMatchObject({ mm: 0.1, label: '100 µm' })
    expect(scaleBarFor(0, 200)).toBeNull()
  })
})

describe('outline bands (AR-35, AR-56)', () => {
  const W = 12
  const H = 12
  const mask = new Uint8Array(W * H)
  for (let y = 4; y < 8; y++) for (let x = 4; x < 8; x++) mask[y * W + x] = 1

  it('measures the chamfer distance to the silhouette in thirds of a pixel', () => {
    const d = chamferDistance(mask, W, H)
    expect(d[5 * W + 5]).toBe(0)
    expect(d[5 * W + 3]).toBe(3)
    expect(d[5 * W + 2]).toBe(6)
    expect(d[3 * W + 3]).toBe(4)
  })
  it('draws bg at 0 to 1 px, focus at 1 to 3 px and bg again at 3 to 4 px', () => {
    const bands = outlineBands(mask, W, H, 1)
    expect(bands[5 * W + 5]).toBe(BAND_NONE)
    expect(bands[5 * W + 3]).toBe(BAND_BG)
    expect(bands[5 * W + 2]).toBe(BAND_FOCUS)
    expect(bands[5 * W + 1]).toBe(BAND_FOCUS)
    expect(bands[5 * W + 0]).toBe(BAND_BG)
    expect(bands[0]).toBe(BAND_NONE)
    const empty = outlineBands(new Uint8Array(W * H), W, H, 1)
    expect(empty.every((b) => b === BAND_NONE)).toBe(true)
  })
  it('paints the bands as opaque pixels in the two colours', () => {
    const bands = outlineBands(mask, W, H, 1)
    const rgba = new Uint8ClampedArray(W * H * 4)
    paintBands(bands, rgba, hexToRgb('#0E1116'), hexToRgb('#FFD166'))
    const focus = (5 * W + 2) * 4
    expect(Array.from(rgba.subarray(focus, focus + 4))).toEqual([255, 209, 102, 255])
    const bg = (5 * W + 3) * 4
    expect(Array.from(rgba.subarray(bg, bg + 4))).toEqual([14, 17, 22, 255])
    expect(rgba[(5 * W + 5) * 4 + 3]).toBe(0)
  })
})

// ---- share links ---------------------------------------------------------------------------------

function stage(zfs: string, shortLabel: string, startHpf: number, endHpf: number): StageRecord {
  return { zfs, name: shortLabel, shortLabel, period: 'x', startHpf, endHpf, headline: false, sources: [] } as unknown as StageRecord
}
const STAGES = [stage('ZFS:0000001', '1-cell', 0, 24), stage('ZFS:0000031', 'prim-5', 24, 48), stage('ZFS:0000044', 'adult', 48, 17520)]

function record(id: string, name: string, from: number, to: number): StructureRecord {
  return {
    id, name, synonyms: [], system: 'cardiovascular', alsoIn: [], zfaParent: null, uiParent: null, parentRelation: 'root', definition: '',
    zfinStartStage: 'ZFS:0000001', zfinEndStage: 'ZFS:0000044', startHpf: from, endHpf: to, visibleFromHpf: from, modelEndHpf: to,
    overrideNote: null, fadeInHpf: 0.5, fadeOutHpf: 0.5, laterality: 'midline', pickable: true, sexSpecific: null, aliasChain: [], events: [],
    sizes: [], colorOverride: null, sources: ['x'], geometry: { kind: 'ellipsoid' },
  } as unknown as StructureRecord
}
const HEART = record('ZFA:0000114', 'heart', 22, 4320)
const STRUCTURES = [HEART]
const SYSTEMS = [{ id: 'cardiovascular', displayName: 'Cardiovascular', order: 5, color: { dark: '#fff', light: '#000' } }]
const DATA = {
  systems: SYSTEMS, stages: { stages: STAGES, periods: [], growth: [] }, structures: STRUCTURES, handoffs: [], kits: [],
  structuresById: new Map(STRUCTURES.map((r) => [r.id, r])), systemsById: new Map(SYSTEMS.map((s) => [s.id, s])), warnings: [], fallbackNotes: [],
} as unknown as AtlasData

function makeStore() {
  const store = composeAtlasStore({ stageIndexAt, presentIds })
  store.getState().loadData({ ok: true, data: DATA })
  return store
}

describe('share links (UI-34, UX-EX-08, UX-EX-09)', () => {
  it('uses the same preset directions as the viewer (D4)', () => {
    const pairs = [['lat', 'lateral'], ['dor', 'dorsal'], ['ven', 'ventral'], ['ant', 'anterior'], ['pos', 'posterior'], ['tq', 'threeQuarter']] as const
    for (const [param, preset] of pairs) {
      const a = PRESET_PARAM_DIRECTIONS[param]
      const b = PRESET_DIRECTIONS[preset]
      const na = Math.hypot(...a)
      const dot = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / na
      expect(dot, param).toBeGreaterThan(0.9999)
    }
  })
  it('finds the nearest preset of a free camera', () => {
    expect(nearestPresetParam({ position: [0, 0, 5], target: [0, 0, 0] })).toBe('lat')
    expect(nearestPresetParam({ position: [1, 4.1, 0.2], target: [1, 0.1, 0] })).toBe('dor')
    expect(nearestPresetParam({ position: [-2, 0, 0], target: [0, 0, 0] })).toBe('ant')
    expect(nearestPresetParam({ position: [-0.45, 0.35, 0.82], target: [0, 0, 0] })).toBe('tq')
  })
  it('carries the free camera as cam, or the nearest preset as v when the camera is left out', () => {
    const store = makeStore()
    store.getState().setCameraPose({ position: [0.5, 3, 0.1], target: [0.5, 0, 0] })
    expect(store.getState().viewPreset).toBe('free')
    const withCam = shareState(store)
    expect(withCam.cam).toBe('0.500,3.000,0.100,0.500,0.000,0.000')
    expect(withCam.theme).toBe(store.getState().theme)
    const noCam = shareState(store, { includeCamera: false })
    expect(noCam.cam).toBeUndefined()
    expect(noCam.v).toBe('dor')
    expect(shareState(store, { includeTheme: false }).theme).toBeUndefined()
  })
  it('links to a structure and moves t to its first fully visible time when it is absent', () => {
    const store = makeStore()
    store.getState().setTime(10)
    const link = shareState(store, { structureId: 'ZFA:0000114' })
    expect(link.sel).toBe('0000114')
    expect(link.t).toBe(22.5)
    store.getState().setTime(30)
    expect(shareState(store, { structureId: 'ZFA:0000114' }).t).toBe(30)
  })
  it('builds an absolute URL that parses back', () => {
    const store = makeStore()
    store.getState().setTime(48)
    store.getState().setViewPreset('dorsal')
    const url = shareUrl(store, {}, 'https://example.org/atlas/')
    expect(url.startsWith('https://example.org/atlas/?')).toBe(true)
    const parsed = parseUrl(new URL(url).search)
    expect(parsed.warnings).toEqual([])
    expect(parsed.state.t).toBe(48)
    expect(parsed.state.v).toBe('dor')
  })
})

describe('export credit (L-07, review item 13)', () => {
  it('names the author of the pattern and denies imaging data', () => {
    expect(REPORTER_PREVIEW_CREDIT).toBe('Schematic reporter preview | pattern defined by the user, not imaging data')
  })

  it('keeps the preview sentence when the credit switch is off', () => {
    expect(creditText(REPORTER_PREVIEW_CREDIT, true)).toBe(`${REPORTER_PREVIEW_CREDIT} | ${EXPORT_CREDIT}`)
    expect(creditText(REPORTER_PREVIEW_CREDIT, false)).toBe(REPORTER_PREVIEW_CREDIT)
    expect(creditText(null, true)).toBe(EXPORT_CREDIT)
    expect(creditText(null, false)).toBeNull()
  })

  it('follows the dialog switch when the caller states no flag', () => {
    setExportCredit(false)
    try {
      expect(creditText(null)).toBeNull()
      expect(creditText(REPORTER_PREVIEW_CREDIT)).toBe(REPORTER_PREVIEW_CREDIT)
    } finally {
      setExportCredit(true)
    }
    expect(creditText(null)).toBe(EXPORT_CREDIT)
  })
})
