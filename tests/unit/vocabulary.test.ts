// The full ZFA vocabulary of D17: the build script, the generated file, the stand-in resolution,
// the search rows and the term selection. The ZFIN snapshot under data/zfin is frozen, so the
// term ids below stay valid; the stand-in of a term follows the records and is checked by shape.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { OVERRIDES, STOP_CLASSES, buildVocabulary, meetsWindow, sentenceEnds, serialize, shortenDefinition, stripMarkup } from '../../scripts/build-vocabulary.ts'
import { badgeText, buildVocabulary as indexVocabulary, standInOf } from '../../src/core/vocabulary.ts'
import { parseVocabularyFile } from '../../src/core/vocabularySchema.ts'
import { loadAtlas, loadVocabulary } from '../../src/data/index.ts'
import { createAtlasStore } from '../../src/state/store.ts'
import { buildSearchIndex, buildVocabIndex, searchItems, searchVocabulary } from '../../src/ui/searchIndex.ts'
import { termFromLink } from '../../src/ui/infoCard/term.ts'

const GENERATED = 'src/data/vocabulary.json'
/** The D17 budget for the lazy chunk. */
const SIZE_BUDGET = 900 * 1024

const MHB = 'ZFA:0000042'
/** A term with no record: neural retina, contained by the retina. */
const RETINAL_NEURAL_LAYER = 'ZFA:0000046'
const RETINA = 'ZFA:0000152'
/** An alias of the eye record (D9 alias chain). */
const OPTIC_VESICLE = 'ZFA:0000050'
const EYE = 'ZFA:0000107'
const ADAXIAL_CELL = 'ZFA:0000003'
/** The skin tube carries this id, so it must never stand in for another term. */
const WHOLE_ORGANISM = 'ZFA:0001094'
const ARTERY = 'ZFA:0000005'
const CARDIOVASCULAR_SYSTEM = 'ZFA:0000010'
/** A curated stand-in: ZFA puts it in the immature eye, which no record draws. */
const LENS_PLACODE = 'ZFA:0000122'
/** An adult jaw bone; pharyngeal arch 1 is gone by 72 hpf. */
const QUADRATE = 'ZFA:0000621'
const NOTOCHORD = 'ZFA:0000135'

const text = readFileSync(GENERATED, 'utf8')
const parsed = parseVocabularyFile(JSON.parse(text) as unknown)
if (!parsed.ok) throw new Error(`${GENERATED}: ${parsed.error.path}: ${parsed.error.message}`)
const vocab = indexVocabulary(parsed.file)
const data = loadAtlas()
const isRecord = (id: string): boolean => data.structuresById.has(id)
const term = (id: string) => {
  const found = vocab.byId.get(id)
  if (!found) throw new Error(`${id} is not in the vocabulary`)
  return found
}

/** Brackets a string leaves open; a definition that ends mid-parenthesis reads as a broken cut. */
function openBrackets(text: string): number {
  let depth = 0
  for (const c of text) {
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1)
  }
  return depth
}

describe('build-vocabulary', () => {
  it('keeps the generated file in step with the ZFIN snapshot and the records', () => {
    const rebuilt = serialize(buildVocabulary({ zfin: 'data/zfin', data: 'src/data/structures' }))
    expect(rebuilt, `${GENERATED} is stale: run node scripts/build-vocabulary.ts`).toBe(text)
  })

  it('holds every non-obsolete anatomy item and stays inside the size budget', () => {
    const items = readFileSync('data/zfin/anatomy_item.txt', 'utf8').split('\n').filter((l) => l.length > 0)
    expect(vocab.terms.length).toBe(items.length)
    expect(Buffer.byteLength(text, 'utf8')).toBeLessThan(SIZE_BUDGET)
    expect(parsed.file.release).toBe('2026-07-16')
  })

  it('cuts a definition at the first sentence and at 240 characters', () => {
    expect(shortenDefinition('The boundary between two parts. A second sentence here.')).toBe('The boundary between two parts.')
    expect(shortenDefinition('Cell of e.g. the yolk that stays whole.')).toBe('Cell of e.g. the yolk that stays whole.')
    const long = `${'word '.repeat(80)}end.`
    expect(shortenDefinition(long).length).toBeLessThanOrEqual(240)
    for (const t of vocab.terms) expect(t.definition.length, t.id).toBeLessThanOrEqual(240)
  })

  it('keeps a second sentence when the first repeats another term\'s opener', () => {
    const twinned = 'A pigment cell derived from the neural crest. Contains a trait that sets it apart.'
    expect(shortenDefinition(twinned, 240, 1)).toBe('A pigment cell derived from the neural crest.')
    expect(shortenDefinition(twinned, 240, 2)).toBe(twinned)
    // The chromatophore cell types (BIO review) all open on the same sentence; the card must show
    // the second sentence, the one trait that tells the six apart, instead of six identical cards.
    const CHROMATOPHORES = ['ZFA:0009091', 'ZFA:0009198', 'ZFA:0009199', 'ZFA:0009261', 'ZFA:0009263', 'ZFA:0009317']
    const definitions = CHROMATOPHORES.map((id) => term(id).definition)
    for (const definition of definitions) {
      expect(definition.startsWith('A pigment cell derived from the neural crest.')).toBe(true)
      expect(definition.length).toBeGreaterThan('A pigment cell derived from the neural crest.'.length)
    }
    expect(new Set(definitions).size).toBe(CHROMATOPHORES.length)
  })

  it('removes the hyperlink markup and keeps the credited curator whole (review B04)', () => {
    const linked =
      "The sensory ganglion of the ear. (See Anatomical Atlas entry for <a href='http://zfin.org/zf_info/anatomy/dict/stato/stato.html'>statoacoustic ganglion</a> by T. Whitfield.)"
    expect(stripMarkup(linked)).not.toContain('<a ')
    expect(shortenDefinition(linked)).toBe(
      'The sensory ganglion of the ear. (See Anatomical Atlas entry for statoacoustic ganglion by T. Whitfield.)',
    )
    expect(vocab.byId.get('ZFA:0000588')?.definition).toBe(
      'The sensory ganglion of the ear. (See Anatomical Atlas entry for statoacoustic ganglion by T. Whitfield.)',
    )
    for (const t of vocab.terms) {
      expect(t.definition.includes('<'), t.id).toBe(false)
      expect(t.definition.includes('&lt;'), t.id).toBe(false)
    }
  })

  it('never ends a definition inside a parenthesis, on an initial or on an abbreviation', () => {
    // A credit that does not fit inside the budget is dropped whole, at the sentence end before it.
    const long = `${'A sentence about the ear that runs on and on and on. '.repeat(5)}(See the Atlas entry for the ear by T. Whitfield.)`
    const cut = shortenDefinition(long)
    expect(cut.length).toBeLessThanOrEqual(240)
    expect(cut.endsWith('.')).toBe(true)
    expect(cut).not.toContain('(')
    for (const t of vocab.terms) {
      expect(openBrackets(t.definition), t.id).toBe(0)
      expect(/\b[A-Z]\.\.\.$/.test(t.definition), t.id).toBe(false)
    }
  })

  it('reads a stop as a sentence end only outside a bracket and after a whole word', () => {
    const text = 'The organ of the fish (see e.g. the ear). A second sentence. (A credit by T. Whitfield.)'
    expect(sentenceEnds(text).map((e) => [e.index, e.parenthetical])).toEqual([[41, false], [60, true]])
  })

  it('carries the ZFIN synonyms, stage window and parents of a term', () => {
    const mhb = term(MHB)
    expect(mhb.name).toBe('midbrain hindbrain boundary')
    expect(mhb.synonyms).toContain('isthmus')
    expect(mhb.synonyms).toContain('mhb')
    expect(mhb.definition).toBe('The boundary between the mesencephalon and the rhombencephalon.')
    expect(mhb.startHpf).toBe(16)
    expect(mhb.endHpf).toBeGreaterThanOrEqual(4320)
    expect(mhb.partOf).toContain('ZFA:0000008')
    expect(mhb.isA).toContain('ZFA:0001689')
  })

  it('reports whether a record is on screen while a term exists', () => {
    const eye = { id: EYE, name: 'eye', hasGeometry: true, fromHpf: 11.66, toHpf: 4320, contains: 0 }
    const epiblast = { ...eye, id: 'ZFA:0000018', name: 'epiblast', fromHpf: 5.66, toHpf: 10.33 }
    expect(meetsWindow(eye, { startHpf: 11.66, endHpf: 19 })).toBe(true)
    expect(meetsWindow(epiblast, { startHpf: 11.66, endHpf: 19 })).toBe(false)
    // A term on the ZFIN Unknown stage states no window, so every record meets it.
    expect(meetsWindow(epiblast, { startHpf: null, endHpf: null })).toBe(true)
    // The adult stage runs to 17520 hpf; the interactive axis stops at 4320 (D1).
    expect(meetsWindow(eye, { startHpf: 2160, endHpf: 17520 })).toBe(true)
  })

  it('marks the is_a descendants of ZFA:0009000 as cell terms', () => {
    expect(term(ADAXIAL_CELL).kind).toBe('cell')
    expect(term(NOTOCHORD).kind).toBe('structure')
    expect(vocab.terms.filter((t) => t.kind === 'cell').length).toBeGreaterThan(400)
  })
})

describe('stand-in resolution', () => {
  it('names the term itself when a record draws it', () => {
    const stand = standInOf(vocab, term(NOTOCHORD), isRecord)
    expect(stand).toMatchObject({ state: 'modeled', recordId: NOTOCHORD })
    expect(badgeText(stand, vocab)).toBe('modeled')
  })

  it('walks the part_of closure to the nearest modeled record', () => {
    const t = term(RETINAL_NEURAL_LAYER)
    expect(t.standIn).toBe(RETINA)
    expect(t.standInPath).toEqual([RETINA])
    const stand = standInOf(vocab, t, isRecord)
    expect(stand.state).toBe('partOf')
    expect(stand.recordId).toBe(RETINA)
    expect(stand.pathNames).toEqual(['retina'])
    expect(badgeText(stand, vocab)).toBe('part of retina')
  })

  it('resolves an alias of a record straight to that record (D9 alias chains)', () => {
    const t = term(OPTIC_VESICLE)
    expect(t.standIn).toBe(EYE)
    expect(t.standInPath).toEqual([EYE])
    expect(data.structuresById.get(EYE)?.aliasChain.some((a) => a.zfaId === OPTIC_VESICLE)).toBe(true)
  })

  it('reports "no model" when the atlas holds no record on the chain', () => {
    const stand = standInOf(vocab, term(RETINAL_NEURAL_LAYER), () => false)
    expect(stand).toMatchObject({ state: 'none', recordId: null })
    expect(badgeText(stand, vocab)).toBe('no model')
  })

  it('never sends a term to the whole organism or to another upper CARO class', () => {
    // The skin tube carries the id of the whole organism, so before the stop set 521 terms of the
    // 3113 read "part of whole organism", 220 of them structures (review BIO-02).
    const escaped = vocab.terms.filter((t) => t.id !== WHOLE_ORGANISM && t.standIn !== null && STOP_CLASSES.has(t.standIn))
    expect(escaped.map((t) => t.id)).toEqual([])
    for (const t of vocab.terms) {
      if (t.id === WHOLE_ORGANISM) continue
      for (const step of t.standInPath) expect(STOP_CLASSES.has(step), `${t.id} walks through ${step}`).toBe(false)
    }
  })

  it('keeps a vessel inside the cardiovascular branch', () => {
    for (const id of [ARTERY, 'ZFA:0000082', 'ZFA:0005032', 'ZFA:0001079']) {
      expect(term(id).standIn, id).toBe(CARDIOVASCULAR_SYSTEM)
    }
  })

  it('applies the curated stand-ins and keeps the table auditable', () => {
    for (const [id, row] of OVERRIDES) {
      expect(isRecord(row.standIn), `${id} names ${row.standIn}`).toBe(true)
      expect(isRecord(id), `${id} is a record of its own`).toBe(false)
      expect(row.why.length, id).toBeGreaterThan(20)
      expect(term(id).standIn, id).toBe(row.standIn)
    }
    expect(term(LENS_PLACODE).standIn).toBe(EYE)
    expect(term('ZFA:0009183').standIn).toBe('ZFA:0000105')
  })

  it('prefers a record that is on screen while the term exists', () => {
    // The jaw bones reached pharyngeal arch 1, which the model retires at 72 hpf (review BIO-03).
    for (const id of [QUADRATE, 'ZFA:0000163']) {
      const t = term(id)
      const record = t.standIn === null ? null : data.structuresById.get(t.standIn)
      if (!record) continue
      expect(record.modelEndHpf, `${id} -> ${t.standIn}`).toBeGreaterThanOrEqual(Math.min(t.startHpf ?? 0, 4320))
    }
    const stand = data.structuresById.get(term(QUADRATE).standIn as string)
    expect(stand?.modelEndHpf).toBe(4320)
  })

  it('prefers the narrower of two candidates at the same depth', () => {
    // Both the hindbrain and the floor plate contain the floor plate rhombomere region; the floor
    // plate is the structure the term is part of (review BIO-12).
    expect(term('ZFA:0000893').standIn).toBe('ZFA:0000022')
  })

  it('leaves a term with no containing record without a stand-in', () => {
    for (const id of ['ZFA:0000041', 'ZFA:0009034']) expect(term(id).standIn, id).toBeNull()
  })

  it('points every stand-in at a record of the atlas', () => {
    const missing = vocab.terms.filter((t) => t.standIn !== null && !isRecord(t.standIn))
    expect(missing.map((t) => t.id)).toEqual([])
  })

  it('gives every record its own id as the stand-in', () => {
    const wrong = data.structures.filter((r) => vocab.byId.has(r.id) && vocab.byId.get(r.id)?.standIn !== r.id)
    expect(wrong.map((r) => r.id)).toEqual([])
  })
})

describe('search rows', () => {
  const index = buildSearchIndex(data)
  const vocabIndex = buildVocabIndex(vocab, isRecord)

  it('leaves the record rows alone when no vocabulary is passed', () => {
    expect(searchItems(index, 'heart', false).every((i) => i.kind !== 'term')).toBe(true)
  })

  it('finds ZFA:0000042 from "MHB" and from "isthmus"', () => {
    for (const q of ['MHB', 'isthmus', 'midbrain-hindbrain boundary']) {
      const rows = searchItems(index, q, true, vocabIndex)
      expect(rows.map((r) => r.id), q).toContain(MHB)
    }
  })

  it('finds a term that no record draws, through its synonym, with its badge', () => {
    const hits = searchVocabulary(vocabIndex, 'neuroretina')
    expect(hits[0].term.id).toBe(RETINAL_NEURAL_LAYER)
    expect(hits[0].matchedText).toBe('neuroretina')
    expect(hits[0].badge).toBe('part of retina')
  })

  it('lists the records before the vocabulary terms and never repeats one', () => {
    const rows = searchItems(index, 'retina', true, vocabIndex)
    const firstTerm = rows.findIndex((r) => r.kind === 'term')
    const lastHit = rows.map((r) => r.kind).lastIndexOf('hit')
    expect(firstTerm).toBeGreaterThan(lastHit)
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length)
    expect(rows.filter((r) => r.kind === 'term').every((r) => r.term?.badge)).toBe(true)
  })

  it('keeps the no-match notice only when neither index matches', () => {
    expect(searchItems(index, 'xyzzyq', false, vocabIndex)[0].kind).toBe('notice')
    expect(searchItems(index, 'neuroretina', false, vocabIndex)[0].kind).toBe('term')
  })
})

describe('term selection and the URL', () => {
  it('stores the term and highlights its stand-in', () => {
    const store = createAtlasStore()
    store.getState().selectTerm(RETINAL_NEURAL_LAYER, RETINA)
    expect(store.getState().selectedTerm).toBe(RETINAL_NEURAL_LAYER)
    expect(store.getState().selection).toEqual([RETINA])
    store.getState().select(NOTOCHORD)
    expect(store.getState().selectedTerm).toBeNull()
  })

  it('clears the term with the selection and accepts a term with no stand-in', () => {
    const store = createAtlasStore()
    store.getState().selectTerm(RETINAL_NEURAL_LAYER, null)
    expect(store.getState().selection).toEqual([])
    expect(store.getState().selectedTerm).toBe(RETINAL_NEURAL_LAYER)
    store.getState().clearSelection()
    expect(store.getState().selectedTerm).toBeNull()
  })

  it('round trips the term through the `term` URL key and reads it from sel', () => {
    const store = createAtlasStore()
    store.getState().selectTerm(MHB, RETINA)
    expect(store.getState().toUrl().term).toBe('0000042')
    const store2 = createAtlasStore()
    store2.getState().applyUrl({ ...store.getState().toUrl() })
    expect(store2.getState().selectedTerm).toBe(MHB)
    store2.getState().applyUrl({ ...store.getState().toUrl(), term: undefined })
    expect(store2.getState().selectedTerm).toBeNull()
  })

  it('reads the term from a link: the `term` key first, then a sel id with no record', () => {
    expect(termFromLink('?t=24&sel=0000152&term=0000042', isRecord)).toBe(MHB)
    expect(termFromLink('?sel=0000046', isRecord)).toBe(RETINAL_NEURAL_LAYER)
    expect(termFromLink('?sel=0000152', isRecord)).toBeNull()
    expect(termFromLink('?t=24', isRecord)).toBeNull()
  })
})

describe('loadVocabulary', () => {
  it('parses the shipped file and indexes it by id', async () => {
    const loaded = await loadVocabulary()
    expect(loaded.terms.length).toBe(vocab.terms.length)
    expect(loaded.byId.get(MHB)?.name).toBe('midbrain hindbrain boundary')
    expect(await loadVocabulary()).toBe(loaded)
  })
})
