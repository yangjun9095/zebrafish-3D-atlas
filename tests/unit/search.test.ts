// WP-I1: the search index (spec 5.5, UX-LY-02, UX-ST-02), the tree model (5.3.2, UI-17, UX-IN-26) and
// the ARIA shape of the tree view (UX-AC-02). The records are the eleven-record fixture of WP-02 plus two
// group nodes, so the tests do not move while the anatomy packages edit the live files.
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { presentIds } from '../../src/core/presence.ts'
import { parseAtlasData } from '../../src/core/schema.ts'
import type { StructureRecordInput, SystemId } from '../../src/core/schema.ts'
import { rawAtlas } from '../../src/data/index.ts'
import {
  RANKS, SEARCH_PAGE, VOCAB_MAX_ROWS, VOCAB_MIN_QUERY, absenceLabel, buildSearchIndex, buildVocabIndex, editDistance,
  fuzzySuggestions, searchItems, searchStructures, searchVocabularyTop, stageWindowLabel, termWindowLabel,
} from '../../src/ui/searchIndex.ts'
import type { Vocabulary, VocabularyTerm } from '../../src/core/vocabulary.ts'
import { TreeView } from '../../src/ui/TreeView.tsx'
import {
  ROOT_ID, ancestorKeys, buildTree, defaultExpanded, flattenRows, shownChildren, systemKey, treeRows, typeAheadTarget, wrapperChild,
} from '../../src/ui/treeModel.ts'
import fixture from '../fixtures/structures.fixture.json' with { type: 'json' }

const HEART = 'ZFA:0000114'
const EYE = 'ZFA:0000107'
const NOTOCHORD = 'ZFA:0000135'
const YOLK = 'ZFA:0000084'
const CV_GROUP = 'ZFA:0000010'
const EXTRA_GROUP = 'ZFA:0000020'

function group(id: string, name: string, system: SystemId, synonyms: string[], from: number, to: number): StructureRecordInput {
  return {
    id, name, synonyms, system, zfaParent: ROOT_ID, uiParent: ROOT_ID, parentRelation: 'part_of', definition: `${name}.`,
    zfinStartStage: 'ZFS:0000001', zfinEndStage: 'ZFS:0000044', startHpf: from, endHpf: to, visibleFromHpf: from, modelEndHpf: to,
    overrideNote: null, fadeInHpf: 0.1, fadeOutHpf: 0, laterality: 'midline', events: [], sizes: [], colorOverride: null,
    sources: ['https://zfin.org/'], geometry: null,
  }
}

// The heart sits under the cardiovascular system group; the yolk under the extraembryonic structure (spec 3.4).
const records = (fixture as StructureRecordInput[]).map((r) => {
  if (r.id === HEART) return { ...r, uiParent: CV_GROUP }
  if (r.id === YOLK) return { ...r, uiParent: EXTRA_GROUP }
  return r
})
records.push(group(CV_GROUP, 'cardiovascular system', 'cardiovascular', [], 19, 4320))
records.push(group(EXTRA_GROUP, 'extraembryonic structure', 'early_embryo', ['extraembryonic structures'], 0, 168))

const parsed = parseAtlasData({ ...rawAtlas, structures: records, handoffs: [] })
if (!parsed.ok) throw new Error(JSON.stringify(parsed.error.issues.slice(0, 3)))
const data = parsed.data
const index = buildSearchIndex(data)

describe('search index', () => {
  it('indexes every record once', () => {
    expect(index.entries).toHaveLength(data.structures.length)
  })

  it('ranks the exact name first, then the prefix, then a word of the name', () => {
    const hits = searchStructures(index, 'heart')
    expect(hits[0].record.id).toBe(HEART)
    expect(hits[0].rank).toBe(RANKS.exactName)
    const eye = searchStructures(index, 'ey')
    expect(eye[0].record.id).toBe(EYE)
    expect(eye[0].rank).toBe(RANKS.namePrefix)
    const cord = searchStructures(index, 'cord')
    expect(cord[0].record.name).toBe('spinal cord')
    expect(cord[0].rank).toBe(RANKS.nameWord)
  })

  it('matches synonyms and reports the matched text', () => {
    const hits = searchStructures(index, 'notocord')
    const hit = hits.find((x) => x.record.id === NOTOCHORD)
    expect(hit?.field).toBe('synonym')
    expect(hit?.matchedText).toBe('notocord')
    const otocyst = searchStructures(index, 'otocyst')
    expect(otocyst[0].record.name).toBe('otic vesicle')
  })

  it('matches alias chain names of the heart record', () => {
    const heart = data.structuresById.get(HEART)!
    expect(heart.aliasChain.length).toBeGreaterThan(0)
    const alias = heart.aliasChain[0].name
    const hit = searchStructures(index, alias).find((x) => x.record.id === HEART)
    expect(hit).toBeDefined()
    expect(hit!.rank).toBeLessThanOrEqual(RANKS.alias)
  })

  it('matches ZFA ids in the three written forms', () => {
    for (const q of ['ZFA:0000114', '0000114', '114', 'zfa 114']) {
      expect(searchStructures(index, q).map((x) => x.record.id), q).toContain(HEART)
    }
  })

  it('matches a system name and ranks it under name matches', () => {
    const hits = searchStructures(index, 'cardiovascular')
    expect(hits[0].record.name).toBe('cardiovascular system')
    expect(hits.filter((x) => x.field === 'system').map((x) => x.record.id)).toContain(HEART)
    expect(hits.every((x, i) => i === 0 || x.rank >= hits[i - 1].rank)).toBe(true)
  })

  it('finds a misspelling within two edits and nothing for an empty query', () => {
    const fuzzy = searchStructures(index, 'chorian')
    expect(fuzzy.some((x) => x.record.name === 'chorion' && x.field === 'fuzzy')).toBe(true)
    expect(searchStructures(index, 'hearts')[0].record.id).toBe(HEART)
    expect(searchStructures(index, '   ')).toEqual([])
  })

  it('computes the edit distance with a cut-off', () => {
    expect(editDistance('heart', 'heart')).toBe(0)
    expect(editDistance('heart', 'hearts')).toBe(1)
    expect(editDistance('kitten', 'sitting')).toBe(3)
    expect(editDistance('kitten', 'sitting', 2)).toBe(3)
  })

  it('offers three suggestions for a query with no match', () => {
    expect(searchStructures(index, 'xyzzyq')).toEqual([])
    const s = fuzzySuggestions(index, 'xyzzyq')
    expect(s).toHaveLength(3)
    expect(new Set(s.map((x) => x.record.id)).size).toBe(3)
  })

  it('builds the rows: a page of 8 with "Show all", or the notice and the suggestions', () => {
    const all = searchStructures(index, 'a')
    expect(all.length).toBeGreaterThan(SEARCH_PAGE)
    const a = searchItems(index, 'a', false)
    expect(a).toHaveLength(SEARCH_PAGE + 1)
    expect(a[SEARCH_PAGE]).toMatchObject({ kind: 'more', label: `Show all ${all.length}` })
    expect(a[SEARCH_PAGE].disabled).toBeUndefined()
    expect(searchItems(index, 'a', true)).toHaveLength(all.length)
    const none = searchItems(index, 'xyzzyq', false)
    expect(none[0]).toMatchObject({ kind: 'notice', disabled: true })
    expect(none[0].label).toBe("No structure matches 'xyzzyq'. Search also covers ZFA synonyms and ids.")
    expect(none.slice(1).every((x) => x.kind === 'suggestion')).toBe(true)
  })

  it('caps the vocabulary pass and names the true count on the capped list (D17)', () => {
    // A short query matches thousands of the 3113 terms; the keystroke path must not sort them
    // all, and "Show all" must not mount them all.
    const terms: VocabularyTerm[] = Array.from({ length: VOCAB_MAX_ROWS * 3 }, (_, i) => ({
      id: `ZFA:${String(2000000 + i).padStart(7, '0')}`,
      name: `alpha part ${String(i).padStart(4, '0')}`,
      synonyms: [], definition: '', startHpf: null, endHpf: null,
      partOf: [], isA: [], standIn: null, standInPath: [], kind: 'structure',
    }))
    const vocab: Vocabulary = { release: null, terms, byId: new Map(terms.map((t) => [t.id, t])) }
    const vocabIndex = buildVocabIndex(vocab, () => false)
    expect(searchVocabularyTop(vocabIndex, 'al').total).toBe(terms.length)
    expect(searchVocabularyTop(vocabIndex, 'al').hits).toHaveLength(VOCAB_MAX_ROWS)
    // The top-k keeps the same order a full sort would: the names sort by their index.
    expect(searchVocabularyTop(vocabIndex, 'al').hits[0].term.name).toBe(terms[0].name)
    const shown = searchItems(index, 'alpha', true, vocabIndex)
    const last = shown[shown.length - 1]
    expect(last).toMatchObject({ id: '__capped', kind: 'notice', disabled: true })
    expect(last.label).toContain(String(terms.length))
    expect(shown.length).toBeLessThan(terms.length)
  })

  it('leaves a one-letter query to the records (D17)', () => {
    const terms: VocabularyTerm[] = [{
      id: 'ZFA:2000001', name: 'alpha', synonyms: [], definition: '', startHpf: null, endHpf: null,
      partOf: [], isA: [], standIn: null, standInPath: [], kind: 'structure',
    }]
    const vocab: Vocabulary = { release: null, terms, byId: new Map(terms.map((t) => [t.id, t])) }
    const vocabIndex = buildVocabIndex(vocab, () => false)
    expect(VOCAB_MIN_QUERY).toBe(2)
    expect(searchVocabularyTop(vocabIndex, 'a').total).toBe(0)
    expect(searchVocabularyTop(vocabIndex, 'al').total).toBe(1)
  })

  it('names a term with no ZFIN stage window instead of inventing one (D17)', () => {
    expect(termWindowLabel({ startHpf: null, endHpf: null })).toBe('no ZFIN stage window')
    expect(termWindowLabel({ startHpf: null, endHpf: 17520 })).toBe('unknown start to adult')
    expect(termWindowLabel({ startHpf: 16, endHpf: null })).toBe('16 hpf to unknown end')
    expect(termWindowLabel({ startHpf: 16, endHpf: 168 })).toBe('16 hpf to 7 dpf')
  })

  it('formats the stage window and the absence text (UI-26)', () => {
    const heart = data.structuresById.get(HEART)!
    expect(stageWindowLabel(heart)).toBe('19 hpf to adult')
    expect(stageWindowLabel({ visibleFromHpf: 0, modelEndHpf: 168 })).toBe('0 hpf to 7 dpf')
    expect(absenceLabel(heart, 10)).toBe('from 19 hpf')
    expect(absenceLabel(heart, 24)).toBeNull()
    expect(absenceLabel({ visibleFromHpf: 0, modelEndHpf: 168 }, 200)).toBe('until 7 dpf')
  })
})

describe('tree model', () => {
  const model = buildTree(data)

  it('has the 15 systems as roots in D5 order and no row for the root record', () => {
    expect(model.roots.map((r) => r.system.id)).toEqual([...data.systems].sort((a, b) => a.order - b.order).map((s) => s.id))
    expect(model.byKey.has(ROOT_ID)).toBe(false)
    expect(model.byKey.size).toBe(15 + data.structures.length - 1)
  })

  it('nests a record under its uiParent of the same system, else under its system row', () => {
    expect(model.parentKey.get(HEART)).toBe(CV_GROUP)
    expect(model.parentKey.get(CV_GROUP)).toBe(systemKey('cardiovascular'))
    expect(model.parentKey.get(YOLK)).toBe(EXTRA_GROUP)
    expect(model.parentKey.get(NOTOCHORD)).toBe(systemKey('axial'))
    expect(ancestorKeys(model, HEART)).toEqual([CV_GROUP, systemKey('cardiovascular')])
    for (const r of data.structures) {
      if (r.id === ROOT_ID) continue
      const parent = model.parentKey.get(r.id)!
      expect(model.byKey.get(parent)!.system.id, r.id).toBe(r.system)
    }
  })

  it('collects the descendant ids with geometry for counts and the eye', () => {
    const cv = model.byKey.get(CV_GROUP)!
    expect(cv.geometryIds).toEqual([HEART])
    expect(cv.descendantIds).toEqual([HEART])
    expect(model.byKey.get(systemKey('sensory'))!.geometryIds.sort()).toEqual(['ZFA:0000051', EYE].sort())
    expect(defaultExpanded(model)).toEqual(model.roots.map((r) => r.key))
  })

  function rowsAt(hpf: number, over: Partial<Parameters<typeof treeRows>[0]> = {}) {
    return treeRows({
      model, presentIds: new Set(presentIds(data.structures, hpf)), hiddenStructures: [], hiddenSystems: [],
      selection: [], expanded: new Set(defaultExpanded(model)), onlyPresent: true, ...over,
    })
  }

  it('folds a lone group child into its system row and keeps every other group (R13)', () => {
    const cv = model.byKey.get(systemKey('cardiovascular'))!
    expect(wrapperChild(cv)?.key).toBe(CV_GROUP)
    expect(shownChildren(cv).map((n) => n.key)).toEqual([HEART])
    const early = model.byKey.get(systemKey('early_embryo'))!
    expect(wrapperChild(early)).toBeNull()
    expect(shownChildren(early)).toBe(early.children)
  })

  it('hides absent rows with the filter on and keeps a group while a descendant is present (DM-30)', () => {
    const at24 = flattenRows(rowsAt(24)).map((r) => r.node.key)
    expect(at24).toContain(systemKey('cardiovascular'))
    // The "cardiovascular system" wrapper folds away: the heart sits under the system row.
    expect(at24).not.toContain(CV_GROUP)
    expect(at24).toContain(HEART)
    expect(at24).not.toContain(systemKey('reproductive'))
    const at0 = flattenRows(rowsAt(0)).map((r) => r.node.key)
    expect(at0).toContain(systemKey('early_embryo'))
    expect(at0).toContain(EXTRA_GROUP)
    expect(at0).not.toContain(systemKey('cardiovascular'))
    // A group's own ZFIN window does not count: the cardiovascular group starts at 19 hpf, the heart fades in after it.
    expect(flattenRows(rowsAt(19)).map((r) => r.node.key)).not.toContain(systemKey('cardiovascular'))
    const off = flattenRows(rowsAt(0, { onlyPresent: false }))
    expect(off.filter((r) => r.level === 1)).toHaveLength(15)
    expect(off.find((r) => r.node.key === systemKey('cardiovascular'))!.present).toBe(false)
  })

  it('always shows a selected row with its ancestors, sets counts, hidden state and the ARIA positions', () => {
    const selected = flattenRows(rowsAt(0, { selection: [HEART], expanded: new Set([...defaultExpanded(model), CV_GROUP]) })).map((r) => r.node.key)
    expect(selected).toContain(HEART)
    expect(selected).toContain(systemKey('cardiovascular'))
    expect(selected).not.toContain(systemKey('nervous'))
    const rows = flattenRows(rowsAt(24, { expanded: new Set([...defaultExpanded(model), EXTRA_GROUP]), hiddenStructures: [HEART] }))
    const cv = rows.find((r) => r.node.key === systemKey('cardiovascular'))!
    expect(cv.counts).toEqual({ present: 1, total: 1 })
    expect(cv.hidden).toBe(false)
    expect(cv.expanded).toBe(true)
    const heart = rows.find((r) => r.node.key === HEART)!
    expect(heart).toMatchObject({ level: 2, posInSet: 1, setSize: 1, hidden: true, present: true, counts: null })
    const extra = rows.find((r) => r.node.key === EXTRA_GROUP)!
    expect(extra).toMatchObject({ level: 2, expanded: true, counts: { present: 1, total: 1 } })
    expect(rows.find((r) => r.node.key === YOLK)).toMatchObject({ level: 3 })
    const systems = rows.filter((r) => r.level === 1)
    expect(systems.map((r) => r.posInSet)).toEqual(systems.map((_, i) => i + 1))
    expect(systems.every((r) => r.setSize === systems.length)).toBe(true)
    const hiddenSystem = flattenRows(rowsAt(24, { hiddenSystems: ['axial'] })).find((r) => r.node.key === systemKey('axial'))!
    expect(hiddenSystem.hidden).toBe(true)
  })

  it('type-ahead finds the next row by prefix and wraps', () => {
    const flat = flattenRows(rowsAt(24, { onlyPresent: false }))
    const i = typeAheadTarget(flat, 0, 'ner')
    expect(flat[i].node.name).toBe('Nervous')
    const first = flat.findIndex((r) => r.node.name.toLowerCase().startsWith('s'))
    expect(typeAheadTarget(flat, flat.length - 1, 's')).toBe(first)
    expect(typeAheadTarget(flat, 0, 'zzz')).toBe(-1)
  })

  it('renders the WAI-ARIA tree roles and attributes (UX-AC-02)', () => {
    const rows = rowsAt(24, { expanded: new Set([...defaultExpanded(model), EXTRA_GROUP]), selection: [HEART] })
    const html = renderToString(h(TreeView, { rows, activeKey: HEART, theme: 'dark' }))
    expect(html).toContain('role="tree"')
    expect(html).toContain('aria-multiselectable="true"')
    expect(html).toContain('role="group"')
    expect(html).toContain('role="treeitem"')
    expect(html).toContain('aria-level="3"')
    expect(html).toContain('aria-posinset="1"')
    expect(html).toContain('aria-setsize="1"')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('aria-labelledby="tree-name-ZFA:0000114"')
    expect(html).toContain('aria-label="Hide heart"')
    expect(html).toContain('aria-pressed="true"')
    // One row carries tabindex 0 and its eye is the only other tabbable control.
    expect(html.match(/tabindex="0"/g)).toHaveLength(2)
    expect(html).toContain('data-testid="structure-tree"')
  })
})
