// The full ZFA vocabulary (D17): every non-obsolete term of the ZFIN snapshot, with its synonyms,
// its definition, its ZFIN stage window and the modeled record it stands in for. Pure TypeScript:
// the caller passes the parsed file, which src/data/index.ts loads as a lazy chunk.
//
// A term that is itself a record is 'modeled'. A term with a stand-in is drawn as part of that
// record and the info card names the chain. A term with neither has no model in the atlas yet.
import { expandTerm } from './vocabularySchema.ts'
import type { VocabularyFile, VocabularyTerm } from './vocabularySchema.ts'

export type { TermKind, VocabularyFile, VocabularyTerm } from './vocabularySchema.ts'

export interface Vocabulary {
  /** ZFA release of the snapshot, "2026-07-16". */
  release: string | null
  terms: VocabularyTerm[]
  byId: Map<string, VocabularyTerm>
}

/** Expands the short keys of the generated file and indexes the terms by id. */
export function buildVocabulary(file: VocabularyFile): Vocabulary {
  const terms = file.terms.map(expandTerm)
  const byId = new Map<string, VocabularyTerm>()
  for (const term of terms) byId.set(term.id, term)
  return { release: file.release, terms, byId }
}

export function getTerm(vocab: Vocabulary | null, id: string): VocabularyTerm | null {
  return vocab?.byId.get(id) ?? null
}

/** The ZFIN label of an id, from the vocabulary; the id itself when the term is unknown. */
export function termName(vocab: Vocabulary | null, id: string): string {
  return vocab?.byId.get(id)?.name ?? id
}

// Stand-in state -------------------------------------------------------------------------------

export type StandInState = 'modeled' | 'partOf' | 'none'

export interface TermStandIn {
  state: StandInState
  /** The record to highlight; null when nothing models the term. */
  recordId: string | null
  /** Names from the outermost ancestor to the stand-in, for "modelled as part of: brain > midbrain". */
  pathNames: string[]
}

/**
 * How a term reaches the model. `isRecord` reports whether the atlas draws a record with that id;
 * the vocabulary alone cannot tell, because it indexes every ZFA term.
 */
export function standInOf(vocab: Vocabulary | null, term: VocabularyTerm, isRecord: (id: string) => boolean): TermStandIn {
  if (isRecord(term.id)) return { state: 'modeled', recordId: term.id, pathNames: [] }
  const recordId = term.standIn && isRecord(term.standIn) ? term.standIn : null
  if (!recordId) return { state: 'none', recordId: null, pathNames: [] }
  // The file stores the chain nearest first; the card reads it outermost first.
  const pathNames = [...term.standInPath].reverse().map((id) => termName(vocab, id))
  return { state: 'partOf', recordId, pathNames }
}

/** "modeled", "part of brain" or "no model": the search row badge of D17. */
export function badgeText(standIn: TermStandIn, vocab: Vocabulary | null): string {
  if (standIn.state === 'modeled') return 'modeled'
  if (standIn.state === 'none') return 'no model'
  return `part of ${termName(vocab, standIn.recordId as string)}`
}

// Matching -------------------------------------------------------------------------------------

/** Lower-cased name and synonyms of a term, for the search index. */
export interface TermTexts {
  nameLower: string
  synonymsLower: string[]
  digits: string
}

export function termTexts(term: VocabularyTerm): TermTexts {
  return {
    nameLower: normalize(term.name),
    synonymsLower: term.synonyms.map(normalize),
    digits: term.id.slice(4),
  }
}

export function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}
