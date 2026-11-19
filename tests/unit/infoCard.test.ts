// Info card model (spec 5.4, UI-20 to UI-25, UX-LY-08) against the real records, and the
// presence helper it adds (lastFullyVisibleHpf).
import { describe, expect, it } from 'vitest'
import { lastFullyVisibleHpf, presenceAt } from '../../src/core/presence.ts'
import type { StructureRecord } from '../../src/core/schema.ts'
import { loadAtlas } from '../../src/data/index.ts'
import {
  activeTerm, announceText, cardPresence, childrenOf, correctionHref, descendantsWithGeometry, dimUnit, firstAppearing, formatDim,
  handoffLines, jumpTarget, linkify, modelWindowText, nextEventIndex, sizeRowText, sortedEvents, stageByZfs, stageRangeText,
  termRows, termText, timeKey, trimHpf, zfinUrl, zfinWindowText,
} from '../../src/ui/infoCard/model.ts'
import { classifySource, splitSources } from '../../src/core/sourceKind.ts'
import { classify } from '../../scripts/build-sources.ts'
import { NO_ZFIN_WINDOW, termWindowText } from '../../src/ui/infoCard/term.ts'
import type { VocabularyTerm } from '../../src/core/vocabularySchema.ts'

const data = loadAtlas()
const stages = data.stages.stages
const byId = data.structuresById
const rec = (id: string): StructureRecord => {
  const r = byId.get(id)
  if (!r) throw new Error(`${id} is not a record`)
  return r
}
const heart = rec('ZFA:0000114')
const eye = rec('ZFA:0000107')
const yolk = rec('ZFA:0000084')
const brain = rec('ZFA:0000008')
const ctx = (t: number, sex: 'female' | 'male' = 'female') => ({ t, units: 'auto' as const, sex })

describe('alias chain (UI-24, UI-25)', () => {
  it('lists the four heart aliases plus the record as the fifth row', () => {
    const rows = termRows(heart)
    expect(rows).toHaveLength(5)
    expect(rows[0]).toMatchObject({ zfaId: 'ZFA:0000028', name: 'heart primordium', fromHpf: 11.66, toHpf: 19 })
    expect(rows[4]).toMatchObject({ zfaId: 'ZFA:0000114', name: 'heart', fromHpf: 42, toHpf: null, own: true })
  })
  it('names the term whose window contains t and the record itself after the last window', () => {
    expect(activeTerm(heart, 24).zfaId).toBe('ZFA:0000360')
    expect(activeTerm(heart, 41.99).name).toBe('heart tube')
    expect(activeTerm(heart, 42).own).toBe(true)
    expect(activeTerm(heart, 5).own).toBe(true)
    expect(activeTerm(eye, 15).name).toBe('optic vesicle')
    expect(activeTerm(eye, 20).name).toBe('optic cup')
    expect(activeTerm(eye, 30).name).toBe('eye')
  })
  it('formats the term line and the ZFIN link', () => {
    expect(termText(activeTerm(heart, 24))).toBe('heart tube (ZFA:0000360), 24 to 42 hpf')
    expect(termText(activeTerm(heart, 100))).toBe('heart (ZFA:0000114), from 42 hpf')
    expect(zfinUrl('ZFA:0000360')).toBe('https://zfin.org/ZFA:0000360')
  })
})

describe('stage windows', () => {
  it('reads "ZFIN: High-pec (42 hpf) to Adult" for the heart', () => {
    expect(zfinWindowText(heart, stages)).toBe('ZFIN: High-pec (42 hpf) to Adult')
    expect(zfinWindowText(rec('ZFA:0000051'), stages)).toBe('ZFIN: 14-19 somites (16 hpf) to an unknown end')
  })
  it('adds the model line only when the model window differs', () => {
    expect(modelWindowText(heart)).toBe('Model: 19 to 4320 hpf')
    expect(modelWindowText({ startHpf: 24, endHpf: 17520, visibleFromHpf: 24, modelEndHpf: 4320 })).toBeNull()
    expect(modelWindowText({ startHpf: 24, endHpf: 48, visibleFromHpf: 24, modelEndHpf: 48 })).toBeNull()
    expect(modelWindowText(yolk)).toBe('Model: 0 to 168 hpf')
  })
  it('formats the stage range and trims numbers', () => {
    expect(stageRangeText(stageByZfs(stages, 'ZFS:0000029')!)).toBe('24 to 30 hpf (1 dpf)')
    expect(stageRangeText(stages[stages.length - 1])).toContain('2160 to 4320 hpf on the axis')
    expect(trimHpf(19.15)).toBe('19.15')
    expect(trimHpf(4320)).toBe('4320')
  })
})

describe('presence badge (UX-IN-23, UI-22, UI-24)', () => {
  it('is present inside the window', () => {
    expect(cardPresence(heart, stages, ctx(24))).toMatchObject({ kind: 'present', text: 'Present' })
  })
  it('reads "Not present at 5 hpf" before the first alias window', () => {
    expect(cardPresence(heart, stages, ctx(5)).text).toBe('Not present at 5 hpf')
  })
  it('names the earlier ZFIN term when an alias window lies before visibleFromHpf', () => {
    const p = cardPresence(heart, stages, ctx(15))
    expect(p.kind).toBe('aliasBefore')
    // formatTime rounds 19.15 to "19.1 hpf" (binary representation); the spec example writes 19.2.
    expect(p.text).toBe('ZFIN describes the heart primordium at 15 hpf; the model draws the heart from 19.1 hpf')
  })
  it('reads "Modelled until 168 hpf (Days 7-13)" after the yolk ends', () => {
    expect(cardPresence(yolk, stages, ctx(200)).text).toBe('Modelled until 168 hpf (Days 7-13)')
    expect(cardPresence(yolk, stages, ctx(168)).kind).toBe('after')
  })
  it('reports a sex-specific record that the toggle hides', () => {
    const ovary = { ...heart, sexSpecific: 'female' as const }
    expect(cardPresence(ovary, stages, ctx(100, 'male')).kind).toBe('sex')
    expect(cardPresence(ovary, stages, ctx(100, 'female')).kind).toBe('present')
  })
})

describe('jump target (UI-20, UI-22, DM-09)', () => {
  it('targets the first fully visible time, not the fade start', () => {
    const j = jumpTarget(heart, stages, 10, false, 'auto')
    expect(j?.hpf).toBeCloseTo(19.15, 9)
    expect(presenceAt(heart, j!.hpf).opacity).toBe(1)
    expect(j?.label).toBe('Jump to 20-25 somites (19.1 hpf)')
  })
  it('stays enabled while present and returns to the first appearance', () => {
    expect(jumpTarget(heart, stages, 100, false, 'auto')?.hpf).toBeCloseTo(19.15, 9)
  })
  it('targets the start of the last stage with the structure once it has ended', () => {
    expect(lastFullyVisibleHpf(yolk)).toBeCloseTo(166.8, 9)
    expect(jumpTarget(yolk, stages, 200, false, 'hpf')).toEqual({ hpf: 144, label: 'Jump to Day 6 (144 hpf)' })
    expect(jumpTarget(yolk, stages, 200, false, 'auto')?.label).toBe('Jump to Day 6 (6 dpf)')
    // The chorion fades 24 to 30 hpf: its last fully visible time is 24, inside Prim-5.
    expect(jumpTarget(rec('ZFA:0000329'), stages, 100, false, 'hpf')).toEqual({ hpf: 24, label: 'Jump to Prim-5 (24 hpf)' })
  })
  it('snaps to the stage start when that start is at or after the target', () => {
    const yolkSac = rec('ZFA:0000084')
    expect(jumpTarget(yolkSac, stages, 10, true, 'auto')?.hpf).toBe(0)
    expect(jumpTarget(heart, stages, 10, true, 'auto')?.hpf).toBeCloseTo(19.15, 9)
  })
  it('gives a group node no target', () => {
    expect(jumpTarget(brain, stages, 10, false, 'auto')).toBeNull()
  })
})

describe('events and the time key', () => {
  it('sorts the events and finds the next one after t', () => {
    const events = sortedEvents(heart)
    for (let i = 1; i < events.length; i++) expect(events[i].hpf).toBeGreaterThanOrEqual(events[i - 1].hpf)
    expect(events[nextEventIndex(events, 24)].hpf).toBe(26)
    expect(nextEventIndex(events, 5000)).toBe(-1)
  })
  it('changes only at a boundary', () => {
    expect(timeKey(heart, stages, ctx(24.1))).toBe(timeKey(heart, stages, ctx(25.9)))
    expect(timeKey(heart, stages, ctx(25.9))).not.toBe(timeKey(heart, stages, ctx(26.1)))
    expect(timeKey(heart, stages, ctx(41.9))).not.toBe(timeKey(heart, stages, ctx(42.1)))
  })
})

describe('relations and handoffs', () => {
  it('lists the children of a group node and its drawable descendants', () => {
    expect(childrenOf(data.structures, brain.id).map((r) => r.name)).toEqual(['forebrain', 'midbrain', 'midbrain hindbrain boundary', 'hindbrain'])
    const cns = descendantsWithGeometry(data.structures, 'ZFA:0000012').map((r) => r.id)
    expect(cns).toContain('ZFA:0000075')
    expect(cns).toContain('ZFA:0001135')
    expect(cns).not.toContain('ZFA:0000008')
  })
  it('turns the heart handoffs into "Becomes" lines and skips the alias boundary inside the record', () => {
    const lines = handoffLines(data.handoffs, data.stages.growth, byId, heart.id, 'hpf')
    expect(lines.map((l) => l.id)).toEqual(['heart_tube_chambers'])
    expect(lines[0]).toMatchObject({ direction: 'to', window: '42 hpf to 48 hpf' })
    expect(lines[0].names).toHaveLength(4)
    const cord = handoffLines(data.handoffs, data.stages.growth, byId, 'ZFA:0000075', 'hpf')
    expect(cord[0]).toMatchObject({ direction: 'from', names: ['neural tube'], window: '22 hpf to 24 hpf' })
  })
})

describe('sources, measurements, stage list, announcement', () => {
  it('links the URL inside a citation and keeps trailing punctuation outside it', () => {
    const segs = linkify('Bakkers 2011 Cardiovasc Res 91:279-288 https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/.')
    expect(segs.map((s) => s.href ?? null)).toEqual([null, 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/', null])
    expect(segs[2].text).toBe('.')
    expect(linkify('research 03c')).toEqual([{ text: 'research 03c' }])
  })
  it('formats a size row', () => {
    expect(sizeRowText(heart.sizes[1])).toBe('Prim-5 (24 hpf): length 0.2 mm, diameter 0.05 mm, estimate')
  })

  it('gives a volume its own unit and keeps a small value off zero (review M11)', () => {
    const row = eye.sizes.find((r) => r.hpf === 12)
    expect(row, 'the eye has a 12 hpf size row').toBeDefined()
    expect(sizeRowText(row!)).toBe('5-9 somites (12 hpf): length 0.12 mm, width 0.05 mm, height 0.08 mm, volume 0.00084 mm\u00b3, estimate')
    expect(dimUnit('volumeMm3')).toEqual({ name: 'volume', unit: 'mm\u00b3' })
    expect(dimUnit('areaMm2')).toEqual({ name: 'area', unit: 'mm\u00b2' })
    expect(dimUnit('lengthMm')).toEqual({ name: 'length', unit: 'mm' })
    expect(dimUnit('diameter')).toEqual({ name: 'diameter', unit: 'mm' })
    expect([0, 0.00084, 0.002, 0.008, 0.13, 2.5, 21.6].map(formatDim)).toEqual(['0', '0.00084', '0.002', '0.008', '0.13', '2.5', '21.6'])
  })

  it('never prints a measured dimension as zero', () => {
    for (const record of data.structures) {
      for (const row of record.sizes) {
        for (const [key, value] of Object.entries(row.dimsMm)) {
          if (value === 0) continue
          expect(formatDim(value), `${record.id} ${key}`).not.toBe('0')
        }
      }
    }
  })

  it('splits the sources into literature and modelling notes, as build-sources.ts classifies them', () => {
    const split = splitSources([
      'https://zfin.org/ZFA:0000114',
      'Bakkers 2011 Cardiovasc Res 91:279-288 https://pmc.ncbi.nlm.nih.gov/articles/PMC3125074/',
      'research 03c heart records',
      'spec BG-36 and DM-34',
    ])
    expect(split.literature).toHaveLength(2)
    expect(split.notes).toEqual(['research 03c heart records', 'spec BG-36 and DM-34'])
    // The card and docs/SOURCES.md must never disagree about one string (review M9).
    for (const record of data.structures) {
      for (const source of record.sources) {
        expect(classifySource(source), `${record.id}: ${source}`).toBe(classify(source).kind)
      }
    }
  })

  it('prefills the correction form with the ZFA id and the hour', () => {
    const href = correctionHref(heart, 24)
    expect(href.startsWith('https://github.com/yangjun9095/zebrafish-3D-atlas/issues/new?template=anatomy-correction.yml&title=')).toBe(true)
    expect(decodeURIComponent(new URL(href).searchParams.get('title') ?? '')).toBe('[anatomy] heart (ZFA:0000114) at 24 hpf')
    expect(new URL(correctionHref(heart, 19.15)).searchParams.get('title')).toContain('at 19.15 hpf')
  })
  it('lists the structures that first appear in a stage', () => {
    const bud = stageByZfs(stages, 'ZFS:0000022')!
    const names = firstAppearing(data.structures, bud).map((r) => r.name)
    expect(names).toContain('notochord')
    expect(names).not.toContain('head')
    expect(firstAppearing(data.structures, stageByZfs(stages, 'ZFS:0000029')!).map((r) => r.id)).not.toContain(eye.id)
  })
  it('builds the live-region sentence', () => {
    expect(announceText(heart, 'Cardiovascular', stages, true)).toBe('Heart selected, Cardiovascular system, present from 20-25 somites')
    expect(announceText(heart, 'Cardiovascular', stages, false)).toContain('not present now')
  })
})

describe('the ZFIN window of a vocabulary term (D17)', () => {
  const term = (startHpf: number | null, endHpf: number | null): VocabularyTerm => ({
    id: 'ZFA:0009401', name: 'lens fiber cell', synonyms: [], definition: '',
    startHpf, endHpf, partOf: [], isA: [], standIn: null, standInPath: [], kind: 'cell',
  })

  it('says ZFIN states no window when the ZFIN row is the Unknown stage', () => {
    // 1602 of the 3113 anatomy items carry ZDB-STAGE-050211-1, whose 0.00 to 17520.00 range is a
    // placeholder, not a window: the card must not read it as "1-cell to Adult".
    expect(termWindowText(term(null, null), stages)).toBe(NO_ZFIN_WINDOW)
    expect(termWindowText(term(null, null), [])).toBe(NO_ZFIN_WINDOW)
  })

  it('names the one bound ZFIN does state', () => {
    expect(termWindowText(term(null, 4320), stages)).toBe('ZFIN: unknown start to Adult')
    expect(termWindowText(term(16, null), stages)).toContain('to an unknown end')
  })

  it('keeps the stage window of a term ZFIN does place', () => {
    const text = termWindowText(term(16, 17520), stages)
    expect(text.startsWith('ZFIN: ')).toBe(true)
    expect(text).toContain('(16 hpf)')
    expect(text).toContain('Adult')
  })
})
