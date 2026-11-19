import { describe, expect, it, vi } from 'vitest'
import {
  emptyFluorescence, exampleFluorescence, FluorescenceConfig, fluorescenceTargets,
  MAX_FLUORESCENCE_RULES, MAX_FLUORESCENCE_TOKEN_CHARS, newRuleId, REPORTERS, ReporterId,
  resolveFluorescence, ruleActiveAt, SKIN_RECORD_ID,
} from '../../src/core/fluorescence.ts'
import { hexToRgb, rgbToLab } from '../../src/core/palette.ts'
import { parseUrl, serializeUrl } from '../../src/core/urlState.ts'
import { loadAtlas } from '../../src/data/index.ts'
import { createAtlasStore } from '../../src/state/store.ts'
import { shareUrlFromState } from '../../src/state/urlSync.ts'
import { captureBookmark, kitFromJson, kitToJson, normalizeBookmark } from '../../src/state/slices/mode.ts'
import { decodeFluorescence, encodeBase64Url, encodeFluorescence } from '../../src/state/slices/url.ts'
import { fluorescenceColor } from '../../src/viewer/materials.ts'

const data = loadAtlas()
const example = exampleFluorescence()

describe('fluorescence target resolution', () => {
  it('uses the named ZFA structures in the example, including liver rather than the gut group', () => {
    expect(example.rules.map((r) => data.structuresById.get(r.targetId)?.name)).toEqual(['heart', 'liver', 'spinal cord'])
    const signal = resolveFluorescence(data, example, 60)
    expect(signal.get('ZFA:0000123')).toEqual(['mcherry'])
    expect(signal.get('ZFA:0000075')).toEqual(['egfp'])
    expect(signal.has('ZFA:0000107')).toBe(false)
  })

  it('expands only the requested modeled hierarchy and supports direct structures', () => {
    const root = data.structures.find((r) => r.name === 'cardiovascular system')!
    expect(root.geometry).toBeNull()
    expect(fluorescenceTargets(data, root.id, false)).toEqual([])
    const parts = fluorescenceTargets(data, root.id, true)
    expect(parts.map((r) => r.name)).toContain('heart')
    expect(parts.map((r) => r.name)).not.toContain('liver')
    expect(fluorescenceTargets(data, 'ZFA:9999999', true)).toEqual([])
    expect(fluorescenceTargets(data, 'ZFA:0000123', false).map((r) => r.name)).toEqual(['liver'])
  })

  it('honors inclusive windows, explicit snapshots, disabled rules and absent anatomy', () => {
    const rule = example.rules[0]
    expect([23.99, 24, 72, 72.01].map((t) => ruleActiveAt(rule, t))).toEqual([false, true, true, false])
    expect(ruleActiveAt({ ...rule, enabled: false }, 48)).toBe(false)
    const snapshot = { ...rule, fromHpf: 48, toHpf: 48 }
    expect([47.99, 48, 48.01].map((t) => ruleActiveAt(snapshot, t))).toEqual([false, true, false])
    const earlyLiver = { ...example, rules: [{ ...example.rules[1], fromHpf: 0, toHpf: 20 }] }
    expect(resolveFluorescence(data, earlyLiver, 10).size).toBe(0)
    expect(resolveFluorescence(data, { ...example, enabled: false }, 60).size).toBe(0)
    expect(resolveFluorescence(data, example, 121).size).toBe(0)
  })

  it('unions repeated reporters and preserves different channels on the same structure', () => {
    const liver = example.rules[1]
    const rules = [liver, { ...liver, id: 'duplicate' }, { ...liver, id: 'green', reporter: 'egfp' as const }]
    const config = { ...example, rules }
    expect(resolveFluorescence(data, config, 60).get(liver.targetId)).toEqual(['mcherry', 'egfp'])
    expect(resolveFluorescence(data, { ...config, channel: 'egfp' }, 60).get(liver.targetId)).toEqual(['egfp'])
    expect(fluorescenceColor(['egfp', 'mcherry', 'egfp'])).toBe(fluorescenceColor(['mcherry', 'egfp']))
    expect(fluorescenceColor(['egfp'])).not.toBe(fluorescenceColor(['mcherry']))
  })

  it('honors sex-specific anatomy', () => {
    const testis = data.structures.find((r) => r.name === 'testis')!
    const config = { ...example, rules: [{ ...example.rules[0], targetId: testis.id, fromHpf: 0, toHpf: 4320 }] }
    expect(resolveFluorescence(data, config, 4320, 'female').size).toBe(0)
    expect(resolveFluorescence(data, config, 4320, 'male').has(testis.id)).toBe(true)
  })
})

describe('fluorescence persistence and validation', () => {
  it('builds a usable share URL when the demo is opened from a local file', () => {
    vi.stubGlobal('location', { href: 'file:///tmp/My%20Atlas/demo.html?old=1#old', origin: 'null', pathname: '/tmp/My%20Atlas/demo.html' })
    try {
      const store = createAtlasStore({ data, labEnabled: true, fluorescence: example })
      const url = new URL(shareUrlFromState(store.getState().toUrl()))
      expect(url.protocol).toBe('file:')
      expect(url.pathname).toBe('/tmp/My%20Atlas/demo.html')
      expect(url.searchParams.get('lab')).toBe('1')
      expect(decodeFluorescence(url.searchParams.get('fp')!)).toEqual(example)
      expect(url.searchParams.has('old')).toBe(false)
      expect(url.hash).toBe('')
    } finally { vi.unstubAllGlobals() }
  })
  it('round trips through a share link and clears on a plain anatomy link', () => {
    const store = createAtlasStore({ data, labEnabled: true, fluorescence: example })
    const url = serializeUrl(store.getState().toUrl())
    const restored = createAtlasStore({ data })
    restored.getState().applyUrl(parseUrl(url).state)
    expect(restored.getState().fluorescence).toEqual(example)
    expect(restored.getState().labEnabled).toBe(true)
    restored.getState().applyUrl(parseUrl('?t=48').state)
    expect(restored.getState().fluorescence).toEqual(emptyFluorescence())
    expect(restored.getState().labEnabled).toBe(false)
  })

  it('rejects malformed configs, reversed windows, duplicate IDs, oversized lists and future versions', () => {
    expect(decodeFluorescence('garbage')).toBeNull()
    for (const config of [
      { ...example, version: 2 },
      { ...example, rules: [{ ...example.rules[0], fromHpf: 72, toHpf: 24 }] },
      { ...example, rules: [example.rules[0], example.rules[0]] },
      { ...example, rules: Array.from({ length: MAX_FLUORESCENCE_RULES + 1 }, (_, i) => ({ ...example.rules[0], id: `r${i}` })) },
    ]) expect(decodeFluorescence(encodeBase64Url(JSON.stringify(config)))).toBeNull()
    const store = createAtlasStore()
    store.getState().applyUrl(parseUrl('?lab=1&fp=garbage').state)
    expect(store.getState().warnings).toContain('The fluorescence preview in the link could not be read')
    expect(store.getState().fluorescence.enabled).toBe(false)
  })

  it('preserves every allowed rule in the bounded share token', () => {
    const config = { ...example, rules: Array.from({ length: MAX_FLUORESCENCE_RULES }, (_, i) => ({ ...example.rules[0], id: `r${i}-${'x'.repeat(40)}` })) }
    expect(FluorescenceConfig.safeParse(config).success).toBe(true)
    const token = encodeFluorescence(config)
    expect(token.length).toBeLessThan(MAX_FLUORESCENCE_TOKEN_CHARS)
    expect(decodeFluorescence(token)).toEqual(config)
  })

  it('captures and restores rules through kit JSON; a bookmark with no preview keeps the live rules', () => {
    const store = createAtlasStore({ data, labEnabled: true, fluorescence: example })
    const on = captureBookmark(store.getState())
    store.getState().setFluorescence({ enabled: false })
    const off = captureBookmark(store.getState())
    expect(off.fluorescence?.enabled).toBe(false)
    const kit = kitFromJson(kitToJson({ id: 'fp-test', name: 'Test', bookmarks: [on, normalizeBookmark({ t: 48 }), off], index: 0 }))!
    store.getState().loadKit(kit)
    expect(store.getState().fluorescence).toEqual(example)
    // Slide 2 was written before the lab and states no preview, so the authored rules survive the step.
    store.getState().goToBookmark(1, { motion: 'cut' })
    expect(store.getState().fluorescence).toEqual(example)
    // Slide 3 states a config with the preview off, so it does turn the preview off.
    store.getState().goToBookmark(2, { motion: 'cut' })
    expect(store.getState().fluorescence.enabled).toBe(false)
    expect(store.getState().fluorescence.rules).toHaveLength(example.rules.length)
  })

  it('keeps the authored rules when a kit written before the lab is loaded', () => {
    const store = createAtlasStore({ data, labEnabled: true, fluorescence: example })
    const legacy = kitFromJson(kitToJson({
      id: 'legacy', name: 'Legacy', bookmarks: [normalizeBookmark({ t: 24 }), normalizeBookmark({ t: 48 })], index: 0,
    }))!
    expect(legacy.bookmarks.every((b) => b.fluorescence === undefined)).toBe(true)
    store.getState().loadKit(legacy)
    expect(store.getState().fluorescence).toEqual(example)
    expect(store.getState().labEnabled).toBe(true)
  })

  it('leaves fluorescence out of a bookmark that has no preview and no rules', () => {
    const store = createAtlasStore({ data, labEnabled: true })
    expect(captureBookmark(store.getState()).fluorescence).toBeUndefined()
    store.getState().setFluorescence({ rules: example.rules })
    const bookmark = captureBookmark(store.getState())
    expect(bookmark.fluorescence?.rules).toHaveLength(3)
    // The copy is deep: editing the live rules never rewrites a captured slide.
    store.getState().setFluorescence({ rules: [] })
    expect(bookmark.fluorescence?.rules).toHaveLength(3)
  })

  it('drops a fluorescence field normalizeBookmark cannot read instead of throwing', () => {
    const badId = { ...example, rules: [{ ...example.rules[0], id: 'has a space' }] }
    for (const bad of [{ version: 2 }, badId, 'not an object', null]) {
      const b = normalizeBookmark({ t: 24, fluorescence: bad as unknown as FluorescenceConfig })
      expect(b.fluorescence).toBeUndefined()
      expect(b.t).toBe(24)
    }
    expect(normalizeBookmark({ t: 24, fluorescence: example }).fluorescence).toEqual(example)
  })
})

describe('the reporter table and the resolver cache', () => {
  it('gives every reporter an emission peak and reads the id list from the table', () => {
    expect(ReporterId.options).toEqual(Object.keys(REPORTERS))
    const peaks = Object.fromEntries(ReporterId.options.map((id) => [REPORTERS[id].name, REPORTERS[id].emissionNm]))
    expect(peaks).toEqual({
      mTagBFP2: 454, mTurquoise2: 474, EGFP: 507, mVenus: 528, mKO2: 565, mScarlet: 594, mCherry: 610, iRFP670: 670,
    })
  })

  it('holds eight reporters with unique hexes, ascending emission order and colours that separate', () => {
    expect(ReporterId.options).toHaveLength(8)
    const hexes = ReporterId.options.map((id) => REPORTERS[id].hex)
    expect(new Set(hexes).size).toBe(8)
    const byEmission = [...ReporterId.options].sort((a, b) => REPORTERS[a].emissionNm - REPORTERS[b].emissionNm)
    expect(byEmission).toEqual(ReporterId.options)
    // A simple CIELAB (dE76) distance: every pair of the eight reporter hexes stays well apart.
    const labs = hexes.map((hex) => rgbToLab(hexToRgb(hex)))
    let minDistance = Infinity
    for (let i = 0; i < labs.length; i++) {
      for (let j = i + 1; j < labs.length; j++) {
        const [l1, a1, b1] = labs[i]
        const [l2, a2, b2] = labs[j]
        minDistance = Math.min(minDistance, Math.hypot(l1 - l2, a1 - a2, b1 - b2))
      }
    }
    expect(minDistance).toBeGreaterThan(20)
  })

  it('never lights the whole-organism skin record itself', () => {
    const parts = fluorescenceTargets(data, SKIN_RECORD_ID, true)
    expect(parts.length).toBeGreaterThan(0)
    expect(parts.map((r) => r.id)).not.toContain(SKIN_RECORD_ID)
    expect(fluorescenceTargets(data, SKIN_RECORD_ID, false)).toEqual([])
    const whole = { ...example, rules: [{ ...example.rules[0], targetId: SKIN_RECORD_ID, fromHpf: 0, toHpf: 4320 }] }
    const signals = resolveFluorescence(data, whole, 48)
    expect(signals.size).toBeGreaterThan(0)
    expect(signals.has(SKIN_RECORD_ID)).toBe(false)
    expect(exampleFluorescence().rules.map((r) => r.targetId)).not.toContain(SKIN_RECORD_ID)
  })

  it('returns the same map for a repeated call and a new map when the key changes', () => {
    const first = resolveFluorescence(data, example, 60)
    expect(resolveFluorescence(data, example, 60)).toBe(first)
    // Both times round to the same hundredth of an hour, which is what a rule window compares.
    expect(resolveFluorescence(data, example, 60.004)).toBe(first)
    expect(resolveFluorescence(data, example, 61)).not.toBe(first)
    expect(resolveFluorescence(data, { ...example }, 60)).not.toBe(first)
    expect(resolveFluorescence(data, example, 60, 'male')).not.toBe(first)
  })

  it('mints rule ids without crypto.randomUUID', () => {
    const ids = Array.from({ length: 200 }, () => newRuleId())
    expect(new Set(ids).size).toBe(200)
    for (const id of ids) expect(id).toMatch(/^[a-zA-Z0-9_-]{1,48}$/)
    const rules = ids.slice(0, 3).map((id) => ({ ...example.rules[0], id }))
    expect(FluorescenceConfig.safeParse({ ...example, rules }).success).toBe(true)
  })
})
