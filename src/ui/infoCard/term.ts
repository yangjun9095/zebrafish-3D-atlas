// Selecting a ZFA vocabulary term (D17) and keeping it in the address bar.
//
// A term the atlas draws is selected as a record. A term it does not draw goes to the store's
// `selectTerm`, which highlights the stand-in record and opens the card in its term state.
//
// URL. The term rides the `term` key of src/core/urlState.ts, which the store writes from
// `selectedTerm` and reads back in `applyUrl`; `sel` keeps the stand-in record. A hand-written
// link that puts a term id in `sel` still works: `termFromLink` takes the first `sel` id the
// atlas does not draw.
import { formatTime } from '../../core/format.ts'
import type { StageRecord } from '../../core/schema.ts'
import { AXIS_END_HPF, stageAt } from '../../core/timeAxis.ts'
import { selIds } from '../../core/urlState.ts'
import { standInOf } from '../../core/vocabulary.ts'
import type { TermStandIn, Vocabulary, VocabularyTerm } from '../../core/vocabulary.ts'
import { readAtlas, subscribeAtlas } from '../../state/store.ts'
import type { ZfaId } from '../../state/store.ts'
import { jumpToStructure, selectStructure } from '../selectStructure.ts'
import { structureLink } from './actions.ts'
import { stageLabel } from './model.ts'

/** The URL key that carries the selected term (src/core/urlState.ts). */
export const TERM_URL_KEY = 'term'
const TERM_ID = /^ZFA:\d{7}$/

// The link as it was opened. urlSync rewrites the address bar as soon as the records land, so the
// term is read from this copy, taken when the module first evaluates.
const openedSearch = typeof location === 'undefined' ? '' : location.search

/**
 * The term id the link asks for: the `term` key first, then the first `sel` id the atlas does
 * not draw. `isRecord` reports whether an id is a modeled record.
 */
export function termFromLink(search: string, isRecord: (id: string) => boolean): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const key = params.get(TERM_URL_KEY)
  if (key !== null && /^\d{7}$/.test(key)) return `ZFA:${key}`
  return selIds(params.get('sel') ?? undefined).find((id) => TERM_ID.test(id) && !isRecord(id)) ?? null
}

/** The term id of the link this page was opened with, or null. */
export function openedTermId(isRecord: (id: string) => boolean): string | null {
  return termFromLink(openedSearch, isRecord)
}

function isRecordNow(id: string): boolean {
  return readAtlas().data?.structuresById.has(id) ?? false
}

/** Where a term sits in the model, against the records the store holds now. */
export function standInNow(vocab: Vocabulary, term: VocabularyTerm): TermStandIn {
  return standInOf(vocab, term, isRecordNow)
}

/** The selection a term produces; the guard below compares it with the store's. */
function expectedSelection(vocab: Vocabulary, termId: string): string {
  const term = vocab.byId.get(termId)
  if (!term) return ''
  const stand = standInNow(vocab, term)
  return stand.recordId ?? ''
}

/**
 * Selects a term: a modeled term selects its record, any other opens the card in its term state
 * with the stand-in highlighted. Returns false when the vocabulary does not hold the id.
 */
export function selectTermId(vocab: Vocabulary, termId: string): boolean {
  const term = vocab.byId.get(termId)
  if (!term) return false
  const stand = standInNow(vocab, term)
  if (stand.state === 'modeled') {
    selectStructure(term.id as ZfaId)
    return true
  }
  readAtlas().selectTerm(term.id, (stand.recordId as ZfaId | null) ?? null)
  return true
}

/** "Jump to first appearance" on a term card: the stand-in's own UI-20 target. */
export function jumpToStandIn(vocab: Vocabulary, termId: string): void {
  const term = vocab.byId.get(termId)
  if (!term) return
  const stand = standInNow(vocab, term)
  if (!stand.recordId) return
  jumpToStructure(stand.recordId as ZfaId)
  readAtlas().selectTerm(term.id, stand.recordId as ZfaId)
}

/** The share link of a term: the current view with the stand-in selected and `term` set. */
export function termLink(vocab: Vocabulary, termId: string): string {
  const term = vocab.byId.get(termId)
  const stand = term ? standInNow(vocab, term) : null
  return structureLink(stand?.recordId ? [stand.recordId] : [], { termId })
}

/**
 * Starts the guard: a selection written straight into the store (a click, a bookmark, Reset
 * view) drops a term that no longer matches it. Returns the stop function. urlSync writes the
 * `term` key on its own, so nothing here touches the address bar.
 */
export function startTermSync(vocab: Vocabulary): () => void {
  return subscribeAtlas(
    (s) => s.selection.join(','),
    (selection) => {
      const termId = readAtlas().selectedTerm
      if (termId && selection !== expectedSelection(vocab, termId)) readAtlas().selectTerm(null, null)
    },
  )
}

// Card text ------------------------------------------------------------------------------------

/** Shown for a term whose ZFIN row carries the placeholder Unknown stage (D17, F01). */
export const NO_ZFIN_WINDOW = 'ZFIN states no stage window for this term'

/**
 * "ZFIN: Segmentation:14-19 somites (16 hpf) to Adult" for a vocabulary term. A null bound is
 * the ZFIN Unknown stage, which states no time at all, so it is named as unknown rather than
 * read as the zygote or the adult (src/core/vocabularySchema.ts).
 */
export function termWindowText(term: VocabularyTerm, stages: readonly StageRecord[]): string {
  const { startHpf, endHpf } = term
  if (startHpf === null && endHpf === null) return NO_ZFIN_WINDOW
  if (stages.length === 0) {
    return `ZFIN: ${startHpf === null ? 'unknown start' : formatTime(startHpf, 'hpf')} to ${endHpf === null ? 'an unknown end' : formatTime(endHpf, 'hpf')}`
  }
  const start = startHpf === null
    ? 'unknown start'
    : `${stageLabel(stageAt(stages, Math.min(startHpf, AXIS_END_HPF)))} (${formatTime(startHpf, 'hpf')})`
  const end = endHpf === null ? 'an unknown end' : endHpf >= AXIS_END_HPF ? 'Adult' : stageLabel(stageAt(stages, endHpf))
  return `ZFIN: ${start} to ${end}`
}

/** "Modelled as part of: brain", or the empty string for a modeled term. */
export function standInText(stand: TermStandIn): string {
  if (stand.state !== 'partOf' || stand.pathNames.length === 0) return ''
  return `Modelled as part of: ${stand.pathNames.join(' > ')}`
}
