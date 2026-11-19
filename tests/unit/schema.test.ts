// QP-15: every data file and the fixture parse; issues name the path; docs/schema does not drift.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { hpfAtSl, resolveWindow } from '../../src/core/handoffs.ts'
import { jsonSchemaText } from '../../src/core/jsonSchema.ts'
import { presenceAt } from '../../src/core/presence.ts'
import {
  ATLAS_FILE_NAMES,
  AtlasDataError,
  formatIssuePath,
  HandoffsFile,
  KitsFile,
  parseAtlasData,
  parseFile,
  StagesFile,
  StructuresFile,
  SYSTEM_IDS,
  SystemsFile,
} from '../../src/core/schema.ts'
import type { AtlasRaw, StructureRecord } from '../../src/core/schema.ts'
import { handoffsRaw } from '../../src/data/handoffs/all.ts'
import { structuresRaw } from '../../src/data/structures/all.ts'

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as unknown

const systemsRaw = read('src/data/systems.json')
const stagesRaw = read('src/data/stages.json')
const kitsRaw = read('src/data/kits.json')
const fixtureRaw = read('tests/fixtures/structures.fixture.json')
const structuresDir = 'src/data/structures'
const handoffsDir = 'src/data/handoffs'
const bodyPath = 'src/data/body.json'

const systems = SystemsFile.parse(systemsRaw)
const stagesFile = StagesFile.parse(stagesRaw)
const handoffs = HandoffsFile.parse(handoffsRaw)
const fixture = StructuresFile.parse(fixtureRaw)
const structures = StructuresFile.parse(structuresRaw)
const systemIds = new Set(systems.map((s) => s.id))

describe('systems.json', () => {
  it('has 15 rows with unique slots and orders and the D5 names', () => {
    expect(systems).toHaveLength(15)
    expect(new Set(systems.map((s) => s.paletteSlot)).size).toBe(15)
    expect(new Set(systems.map((s) => s.order)).size).toBe(15)
    expect(systems.find((s) => s.id === 'respiratory')?.displayName).toBe('Gills and swim bladder')
    expect(systems.find((s) => s.id === 'hematopoietic_immune')?.displayName).toBe('Blood and immune')
    expect(systems.map((s) => s.order)).toEqual(systems.map((_, i) => i + 1))
  })
})

describe('stages.json', () => {
  it('holds the 44 named stages, contiguous from 0 (E022)', () => {
    const { stages } = stagesFile
    expect(stages).toHaveLength(44)
    expect(stages[0].startHpf).toBe(0)
    expect(stages.some((s) => s.zfs === 'ZFS:0000000')).toBe(false)
    for (let i = 1; i < stages.length; i++) expect(stages[i].startHpf).toBe(stages[i - 1].endHpf)
    expect(stages.filter((s) => s.headline)).toHaveLength(17)
  })
  it('has 10 periods with colours, contiguous', () => {
    const { periods } = stagesFile
    expect(periods).toHaveLength(10)
    for (let i = 1; i < periods.length; i++) expect(periods[i].startHpf).toBe(periods[i - 1].endHpf)
    expect(periods[0].zfs).toBeNull()
    expect(periods.find((p) => p.id === 'pharyngula')?.color).toBe('#4FA983')
  })
  it('has 18 headline ticks that each start a stage (E024)', () => {
    const { timeAxis, stages } = stagesFile
    expect(timeAxis.headlineTicks).toHaveLength(18)
    const starts = new Map(stages.map((s) => [s.zfs, s.startHpf]))
    let prev = -1
    for (const t of timeAxis.headlineTicks) {
      expect(t.hpf).toBeGreaterThan(prev)
      prev = t.hpf
      if (t.zfs) expect(starts.get(t.zfs)).toBe(t.hpf)
      else expect(t.hpf).toBe(4320)
    }
    expect(timeAxis.segments.map((s) => s.share)).toEqual([0.18, 0.12, 0.22, 0.1, 0.16, 0.14, 0.08])
  })
  it('has a monotone 32-row growth table with SL null before 72 hpf (E025, D6)', () => {
    const { growth } = stagesFile
    expect(growth).toHaveLength(32)
    for (let i = 1; i < growth.length; i++) {
      expect(growth[i].hpf).toBeGreaterThan(growth[i - 1].hpf)
      expect(growth[i].lengthMm).toBeGreaterThanOrEqual(growth[i - 1].lengthMm)
      const a = growth[i - 1].standardLengthMm
      const b = growth[i].standardLengthMm
      if (a !== null && b !== null) expect(b).toBeGreaterThanOrEqual(a)
    }
    for (const g of growth) expect(g.standardLengthMm === null).toBe(g.hpf < 72)
    expect(growth.find((g) => g.hpf === 24)?.lengthMm).toBe(1.9)
    expect(growth.find((g) => g.hpf === 1080)?.standardLengthMm).toBe(12)
    expect(growth.find((g) => g.hpf === 4320)?.standardLengthMm).toBe(25)
    expect(hpfAtSl(growth, 6.5)).toBe(504)
    expect(hpfAtSl(growth, 5.2)).toBeCloseTo(322, 0)
    expect(hpfAtSl(growth, 6.6)).toBeCloseTo(517, 0)
  })
  it('carries the D8 canonical events (E026)', () => {
    const byId = new Map(stagesFile.events.map((e) => [e.id, e]))
    const expected: Record<string, number> = {
      'ev-heart-beat': 24,
      'ev-blood-circulation-begins': 26,
      'ev-heart-looping-begins': 30,
      'ev-pectoral-fin-buds': 28,
      'ev-hatching-median': 60,
      'ev-mouth-open-and-protruding-end-of-embryogenesis': 72,
      'ev-swim-bladder-inflation': 100,
      'ev-first-feeding': 120,
      'ev-yolk-exhausted': 168,
      'ev-notochord-flexion-complete': 504,
      'ev-pelvic-fin-bud': 593,
      'ev-pelvic-fin-rays-fin-fold-resorption': 758,
      'ev-squamation-onset': 853,
      'ev-juvenile': 985,
      'ev-adult-sexual-maturity': 2160,
    }
    for (const [id, hpf] of Object.entries(expected)) {
      const e = byId.get(id)
      expect(e, id).toBeDefined()
      expect(e?.hpf, id).toBe(hpf)
      expect(e?.canonical, id).toBe(true)
    }
    expect(byId.get('ev-squamation-onset')?.slMm).toBe(9.6)
    expect(new Set(stagesFile.events.map((e) => e.id)).size).toBe(stagesFile.events.length)
    for (let i = 1; i < stagesFile.events.length; i++) {
      expect(stagesFile.events[i].hpf).toBeGreaterThanOrEqual(stagesFile.events[i - 1].hpf)
    }
  })
})

describe('src/data/handoffs/*.json', () => {
  it('splits into the five anatomy package files by the system of the source record', () => {
    const files = readdirSync(handoffsDir).filter((f) => f.endsWith('.json')).sort()
    expect(files).toEqual([
      'a1-early-axial.json',
      'a2-nervous-sensory.json',
      'a3-cardio-blood-respiratory.json',
      'a4-digestive-excretory-endocrine-reproductive.json',
      'a5-skeletal-muscular-fins-skin.json',
    ])
    let n = 0
    for (const f of files) {
      const rows = read(join(handoffsDir, f))
      expect(Array.isArray(rows), f).toBe(true)
      n += (rows as unknown[]).length
    }
    expect(n).toBe(handoffs.length)
  })
  it('has the 24 D9 rows with unique ids', () => {
    expect(handoffs).toHaveLength(24)
    expect(new Set(handoffs.map((h) => h.id)).size).toBe(24)
    expect(handoffs.filter((h) => h.withinRecord).map((h) => h.id).sort()).toEqual(['heart_cone_tube', 'optic_vesicle_cup'])
    expect(handoffs.find((h) => h.id === 'somites_myotomes')?.perSegment).toEqual({ delayHpf: 2, lengthHpf: 2 })
  })
  it('resolves every window through the growth table', () => {
    for (const h of handoffs) {
      const w = resolveWindow(h, stagesFile.growth)
      expect(w.endHpf).toBeGreaterThanOrEqual(w.startHpf)
      expect(w.startHpf).toBeGreaterThanOrEqual(0)
    }
    const fold = resolveWindow(handoffs.find((h) => h.id === 'fin_fold_fins')!, stagesFile.growth)
    expect(fold.startHpf).toBeCloseTo(322, 0)
    expect(fold.endHpf).toBeCloseTo(517, 0)
  })
})

describe('kits.json', () => {
  it('has the two starter kits', () => {
    const kits = KitsFile.parse(kitsRaw)
    expect(kits.map((k) => k.name)).toEqual(['Embryogenesis in 8 views', 'Organ origins'])
    expect(kits[0].bookmarks.map((b) => b.t)).toEqual([0, 4, 6, 10, 14, 24, 48, 72])
    expect(kits[1].bookmarks.every((b) => b.iso && b.sel.length === 1)).toBe(true)
  })
})

describe('src/data/structures/*.json and the fixture', () => {
  it('the structure files parse with one record per id in a known system', () => {
    for (const r of structures) expect(systemIds.has(r.system)).toBe(true)
    expect(new Set(structures.map((r) => r.id)).size).toBe(structures.length)
  })
  it('keeps every group node in groups.json and every geometry record in the file of its system', () => {
    const files = readdirSync(structuresDir).filter((f) => f.endsWith('.json')).sort()
    expect(files).toEqual(['groups.json', ...SYSTEM_IDS.map((n) => `${n}.json`)].sort())
    const groups = StructuresFile.parse(read(join(structuresDir, 'groups.json')))
    for (const r of groups) expect(r.geometry, r.id).toBeNull()
    let n = groups.length
    for (const system of SYSTEM_IDS) {
      const rows = StructuresFile.parse(read(join(structuresDir, `${system}.json`)))
      for (const r of rows) {
        expect(r.system, r.id).toBe(system)
        expect(r.geometry, r.id).not.toBeNull()
      }
      n += rows.length
    }
    expect(n).toBe(structures.length)
  })
  it('the fixture has the root plus ten structures across five systems', () => {
    expect(fixture).toHaveLength(11)
    expect(new Set(fixture.map((r) => r.id)).size).toBe(11)
    expect(new Set(fixture.filter((r) => r.id !== 'ZFA:0001094').map((r) => r.system)).size).toBe(5)
    for (const r of fixture) expect(systemIds.has(r.system)).toBe(true)
    expect(fixture.filter((r) => r.uiParent === null)).toHaveLength(1)
    const ids = new Set(fixture.map((r) => r.id))
    for (const r of fixture) if (r.uiParent) expect(ids.has(r.uiParent)).toBe(true)
  })
  it('keyframes ascend and lie inside the presence window; post-72 keyframes carry sizeRefSl (E010, E011, E019)', () => {
    for (const r of fixture) {
      if (!r.geometry) continue
      const ks = r.geometry.keyframes
      for (let i = 0; i < ks.length; i++) {
        if (i > 0) expect(ks[i].hpf, r.id).toBeGreaterThan(ks[i - 1].hpf)
        expect(ks[i].hpf, r.id).toBeGreaterThanOrEqual(r.visibleFromHpf)
        expect(ks[i].hpf, r.id).toBeLessThanOrEqual(r.modelEndHpf)
        expect(ks[i].sizeRefSl !== undefined, `${r.id} at ${ks[i].hpf}`).toBe(ks[i].hpf >= 72)
      }
      expect(ks[0].hpf, r.id).toBe(r.visibleFromHpf)
    }
  })
  it.each([
    ['the structure files', structures],
    ['the fixture', fixture],
  ])('spot values in %s: notochord never fades at the axis end; the chorion fades out 24 to 30 hpf (D8); the yolk ends at 168', (_name, records) => {
    const notochord = records.find((r) => r.id === 'ZFA:0000135') as StructureRecord
    expect(notochord.fadeOutHpf).toBe(0)
    expect(presenceAt(notochord, 4320).opacity).toBe(1)
    const chorion = records.find((r) => r.id === 'ZFA:0000329') as StructureRecord
    expect(chorion.visibleFromHpf).toBe(0)
    expect(chorion.modelEndHpf).toBe(30)
    expect(chorion.fadeOutHpf).toBe(6)
    expect(presenceAt(chorion, 24).opacity).toBe(1)
    expect(presenceAt(chorion, 27).opacity).toBeCloseTo(0.5, 9)
    expect(presenceAt(chorion, 31).present).toBe(false)
    const yolk = records.find((r) => r.id === 'ZFA:0000084') as StructureRecord
    expect(yolk.modelEndHpf).toBe(168)
    const heart = records.find((r) => r.id === 'ZFA:0000114') as StructureRecord
    expect(heart.geometry?.kind).toBe('custom')
    if (heart.geometry?.kind === 'custom') expect(heart.geometry.builder).toBe('heartLoop')
    expect(heart.aliasChain).toHaveLength(4)
  })
  it('applies defaults on parse', () => {
    const somite = fixture.find((r) => r.id === 'ZFA:0000155') as StructureRecord
    expect(somite.pickable).toBe(true)
    expect(somite.alsoIn).toEqual([])
    expect(somite.geometry?.lodHint).toBe('medium')
    expect(somite.sizes[0].estimate).toBe(false)
  })
})

describe('error messages', () => {
  it('name the file and the path', () => {
    const bad = JSON.parse(JSON.stringify(systemsRaw)) as Array<Record<string, unknown>>
    ;(bad[2].color as Record<string, unknown>).dark = 'blue'
    const res = parseFile('systems', bad)
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.file).toBe('systems')
      expect(res.error.issues[0].path).toBe('[2].color.dark')
      const err = new AtlasDataError(res.error)
      expect(err.message).toContain('systems:[2].color.dark')
    }
    expect(formatIssuePath(['structures', 3, 'geometry', 'keyframes', 0, 'hpf'])).toBe('structures[3].geometry.keyframes[0].hpf')
  })
  it('rejects unknown keys and a bad geometry kind with a path', () => {
    const rec = JSON.parse(JSON.stringify(fixtureRaw)) as Array<Record<string, unknown>>
    rec[4].bogus = 1
    const res = parseFile('structures', rec)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.issues[0].path).toBe('[4]')
    const rec2 = JSON.parse(JSON.stringify(fixtureRaw)) as Array<{ geometry: Record<string, unknown> }>
    rec2[9].geometry.builder = 'nope'
    const res2 = parseFile('structures', rec2)
    expect(res2.ok).toBe(false)
    if (!res2.ok) expect(res2.error.issues[0].path).toBe('[9].geometry.builder')
  })
})

describe('parseAtlasData', () => {
  const minimalBody = {
    generatedBy: 'test',
    keyframes: Array.from({ length: 24 }, (_, i) => ({
      hpf: i * 10,
      stage: 'x',
      regime: 'R4',
      bodyLengthMm: 1 + i,
      slMm: null,
      axisLengthMm: null,
      headTrunkAngleDeg: null,
      notochordFlexionDeg: 0,
      ventU: 0.6,
      epibolyFraction: 1,
      somiteCount: 0,
      cellCount: null,
      cap: null,
      shellThicknessMm: null,
      yolkRadiusMm: null,
      yolkBall: null,
      yolkExtension: null,
      chorion: null,
      spine: Array.from({ length: 9 }, (_, j) => [j / 8, j, 0]),
      profile: Array.from({ length: 9 }, (_, j) => ({ u: j / 8, hD: 0.1, hV: 0.1, hW: 0.1 })),
      sources: [],
    })),
  }
  it('returns typed data with id maps and non-fatal cross-reference warnings', () => {
    const raw: AtlasRaw = { systems: systemsRaw, stages: stagesRaw, structures: fixtureRaw, body: minimalBody, handoffs: handoffsRaw, kits: kitsRaw }
    const res = parseAtlasData(raw)
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.data.structuresById.get('ZFA:0000114')?.name).toBe('heart')
      expect(res.data.systemsById.get('fins')?.paletteSlot).toBe('S14')
      expect(res.data.kits).toHaveLength(2)
      expect(res.data.warnings.some((w) => w.startsWith('handoffs:'))).toBe(true)
    }
  })
  it('reports a duplicate id as an error', () => {
    const dup = [...(fixtureRaw as unknown[]), (fixtureRaw as unknown[])[1]]
    const res = parseAtlasData({ systems: systemsRaw, stages: stagesRaw, structures: dup, body: minimalBody, handoffs: handoffsRaw })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.issues[0].message).toContain('more than once')
  })
  it.skipIf(!existsSync(bodyPath))('parses the committed body.json when it exists', () => {
    const res = parseFile('body', read(bodyPath))
    expect(res.ok, res.ok ? '' : JSON.stringify(res.error.issues.slice(0, 3))).toBe(true)
  })
})

describe('docs/schema', () => {
  it.each(ATLAS_FILE_NAMES)('%s.json equals the current zod schema (QP-15)', (name) => {
    const path = `docs/schema/${name}.json`
    expect(existsSync(path), path).toBe(true)
    expect(readFileSync(path, 'utf8')).toBe(jsonSchemaText(name))
  })
})
