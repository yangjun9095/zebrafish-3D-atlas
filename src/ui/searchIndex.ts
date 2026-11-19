// Search index (spec 5.5, UX-LY-02, UI-26, UX-ST-02): names, synonyms, alias chain names, ZFA ids
// and system names of every record, and, behind a second index, every ZFA vocabulary term of D17.
// Pure: it takes the parsed data and returns ranked hits.
//
// A query runs over both indexes. Records come first, vocabulary terms after them, and every row
// carries a badge: "modeled", "part of <stand-in>", or "no model". A term that is itself a record
// is left out of the vocabulary rows, because the record row already covers it.
import { formatTime } from '../core/format.ts'
import type { AtlasData, StructureRecord, SystemRecord } from '../core/schema.ts'
import { AXIS_END_HPF } from '../core/timeAxis.ts'
import { badgeText, standInOf } from '../core/vocabulary.ts'
import type { TermStandIn, Vocabulary, VocabularyTerm } from '../core/vocabulary.ts'

export type MatchField = 'name' | 'synonym' | 'alias' | 'id' | 'system' | 'fuzzy'

interface Term {
  text: string
  lower: string
}

export interface SearchEntry {
  record: StructureRecord
  system: SystemRecord | null
  nameLower: string
  words: string[]
  synonyms: Term[]
  aliases: Term[]
  /** "0000114" */
  idDigits: string
  systemLower: string
}

export interface SearchIndex {
  entries: SearchEntry[]
}

export interface SearchHit {
  record: StructureRecord
  system: SystemRecord | null
  /** Lower is better: 0 exact name to 7 fuzzy (RANKS). */
  rank: number
  field: MatchField
  /** The synonym or alias that matched; null for a name, id or system match. */
  matchedText: string | null
}

/** The ranking of UX-LY-02, with a plain substring rank between id and fuzzy. */
export const RANKS = {
  exactName: 0,
  namePrefix: 1,
  nameWord: 2,
  synonym: 3,
  alias: 3,
  id: 4,
  substring: 5,
  system: 6,
  fuzzy: 7,
} as const

export const MAX_FUZZY_EDITS = 2
/** Result rows before the "Show all N" row. */
export const SEARCH_PAGE = 8
export const SUGGESTION_COUNT = 3

export function normalizeQuery(q: string): string {
  return q.toLowerCase().replace(/\s+/g, ' ').trim()
}

function splitWords(s: string): string[] {
  return s.split(/[^a-z0-9]+/).filter((w) => w.length > 0)
}

export function buildSearchIndex(data: Pick<AtlasData, 'structures' | 'systemsById'>): SearchIndex {
  const term = (text: string): Term => ({ text, lower: normalizeQuery(text) })
  const entries: SearchEntry[] = data.structures.map((record) => {
    const system = data.systemsById.get(record.system) ?? null
    const nameLower = normalizeQuery(record.name)
    const seen = new Set<string>([nameLower])
    const unique = (texts: string[]): Term[] => {
      const out: Term[] = []
      for (const t of texts) {
        const item = term(t)
        if (seen.has(item.lower)) continue
        seen.add(item.lower)
        out.push(item)
      }
      return out
    }
    return {
      record,
      system,
      nameLower,
      words: splitWords(nameLower),
      synonyms: unique(record.synonyms),
      aliases: unique(record.aliasChain.map((a) => a.name)),
      idDigits: record.id.slice(4),
      systemLower: system ? normalizeQuery(system.displayName) : '',
    }
  })
  return { entries }
}

/** True when q starts a word of s: "cord" in "spinal cord", not "cardi" in "pericardial". */
function wordMatch(s: string, q: string): boolean {
  let i = s.indexOf(q)
  while (i >= 0) {
    if (i === 0 || !/[a-z0-9]/.test(s[i - 1])) return true
    i = s.indexOf(q, i + 1)
  }
  return false
}

/** Levenshtein distance, cut off at `max + 1` so long strings exit early. */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = new Array<number>(b.length + 1)
  let cur = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    let rowMin = cur[0]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (cur[j] < rowMin) rowMin = cur[j]
    }
    if (rowMin > max) return max + 1
    ;[prev, cur] = [cur, prev]
  }
  return prev[b.length]
}

/** The smallest edit distance between q and the name, its words, or a synonym. */
function fuzzyDistance(e: SearchEntry, q: string, max: number): number {
  let best = editDistance(e.nameLower, q, max)
  for (const w of e.words) {
    if (w.length < 3) continue
    best = Math.min(best, editDistance(w, q, max))
  }
  for (const t of e.synonyms) best = Math.min(best, editDistance(t.lower, q, max))
  return best
}

function idMatch(e: SearchEntry, q: string): boolean {
  const digits = q.replace(/^zfa:?\s*/, '')
  if (!/^\d+$/.test(digits)) return false
  return e.idDigits === digits.padStart(7, '0') || e.idDigits.replace(/^0+/, '') === digits.replace(/^0+/, '')
}

function termMatch(terms: Term[], q: string): Term | null {
  return terms.find((t) => t.lower === q) ?? terms.find((t) => t.lower.startsWith(q)) ?? terms.find((t) => wordMatch(t.lower, q)) ?? terms.find((t) => t.lower.includes(q)) ?? null
}

function classify(e: SearchEntry, q: string, allowFuzzy: boolean): Pick<SearchHit, 'rank' | 'field' | 'matchedText'> | null {
  if (e.nameLower === q) return { rank: RANKS.exactName, field: 'name', matchedText: null }
  if (e.nameLower.startsWith(q)) return { rank: RANKS.namePrefix, field: 'name', matchedText: null }
  if (wordMatch(e.nameLower, q)) return { rank: RANKS.nameWord, field: 'name', matchedText: null }
  const syn = termMatch(e.synonyms, q)
  if (syn) return { rank: RANKS.synonym, field: 'synonym', matchedText: syn.text }
  const alias = termMatch(e.aliases, q)
  if (alias) return { rank: RANKS.alias, field: 'alias', matchedText: alias.text }
  if (idMatch(e, q)) return { rank: RANKS.id, field: 'id', matchedText: null }
  if (e.nameLower.includes(q)) return { rank: RANKS.substring, field: 'name', matchedText: null }
  if (e.systemLower && (e.systemLower === q || wordMatch(e.systemLower, q))) return { rank: RANKS.system, field: 'system', matchedText: null }
  if (allowFuzzy) {
    const max = q.length >= 5 ? MAX_FUZZY_EDITS : 1
    if (fuzzyDistance(e, q, max) <= max) return { rank: RANKS.fuzzy, field: 'fuzzy', matchedText: null }
  }
  return null
}

function byRank(a: SearchHit, b: SearchHit): number {
  return a.rank - b.rank || a.record.name.length - b.record.name.length || a.record.name.localeCompare(b.record.name)
}

/** Every hit for the query, best first. An empty query returns no hits. */
export function searchStructures(index: SearchIndex, query: string): SearchHit[] {
  const q = normalizeQuery(query)
  if (q.length === 0) return []
  const allowFuzzy = q.length >= 3
  const hits: SearchHit[] = []
  for (const e of index.entries) {
    const m = classify(e, q, allowFuzzy)
    if (m) hits.push({ record: e.record, system: e.system, ...m })
  }
  return hits.sort(byRank)
}

/** The n nearest records by edit distance, for the no-match state (UX-ST-02). */
export function fuzzySuggestions(index: SearchIndex, query: string, n = SUGGESTION_COUNT): SearchHit[] {
  const q = normalizeQuery(query)
  if (q.length === 0) return []
  const scored = index.entries.map((e) => ({ e, d: fuzzyDistance(e, q, Math.max(q.length, 8)) }))
  scored.sort((a, b) => a.d - b.d || a.e.record.name.length - b.e.record.name.length || a.e.record.name.localeCompare(b.e.record.name))
  return scored.slice(0, n).map(({ e }) => ({ record: e.record, system: e.system, rank: RANKS.fuzzy, field: 'fuzzy', matchedText: null }))
}

/** "42 hpf to adult", "0 hpf to 7 dpf" (UI-26). */
export function stageWindowLabel(record: Pick<StructureRecord, 'visibleFromHpf' | 'modelEndHpf'>, axisEndHpf = AXIS_END_HPF): string {
  const end = record.modelEndHpf >= axisEndHpf ? 'adult' : formatTime(record.modelEndHpf)
  return `${formatTime(record.visibleFromHpf)} to ${end}`
}

/** The stage window of a vocabulary term, or the note that ZFIN states none (D17). */
export function termWindowLabel(term: Pick<VocabularyTerm, 'startHpf' | 'endHpf'>, axisEndHpf = AXIS_END_HPF): string {
  if (term.startHpf === null && term.endHpf === null) return 'no ZFIN stage window'
  const start = term.startHpf === null ? 'unknown start' : formatTime(term.startHpf)
  const end = term.endHpf === null ? 'unknown end' : term.endHpf >= axisEndHpf ? 'adult' : formatTime(term.endHpf)
  return `${start} to ${end}`
}

/** "from 42 hpf" before the window, "until 7 dpf" after it, null while present (UI-26). */
export function absenceLabel(record: Pick<StructureRecord, 'visibleFromHpf' | 'modelEndHpf'>, hpf: number): string | null {
  if (hpf < record.visibleFromHpf) return `from ${formatTime(record.visibleFromHpf)}`
  if (hpf > record.modelEndHpf) return `until ${formatTime(record.modelEndHpf)}`
  return null
}

// Vocabulary rows (D17) ---------------------------------------------------------------------------

export interface VocabEntry {
  term: VocabularyTerm
  standIn: TermStandIn
  badge: string
  nameLower: string
  words: string[]
  synonyms: Term[]
  idDigits: string
}

export interface VocabIndex {
  entries: VocabEntry[]
}

export interface VocabHit {
  term: VocabularyTerm
  standIn: TermStandIn
  badge: string
  rank: number
  field: MatchField
  matchedText: string | null
}

/**
 * Indexes every ZFA term the atlas does not already draw. `isRecord` reports whether an id is a
 * modeled record; those terms are skipped, so a query never shows the same structure twice.
 */
export function buildVocabIndex(vocab: Vocabulary, isRecord: (id: string) => boolean): VocabIndex {
  const entries: VocabEntry[] = []
  for (const term of vocab.terms) {
    if (isRecord(term.id)) continue
    const standIn = standInOf(vocab, term, isRecord)
    const nameLower = normalizeQuery(term.name)
    const seen = new Set<string>([nameLower])
    const synonyms: Term[] = []
    for (const text of term.synonyms) {
      const lower = normalizeQuery(text)
      if (seen.has(lower)) continue
      seen.add(lower)
      synonyms.push({ text, lower })
    }
    entries.push({
      term,
      standIn,
      badge: badgeText(standIn, vocab),
      nameLower,
      words: splitWords(nameLower),
      synonyms,
      idDigits: term.id.slice(4),
    })
  }
  return { entries }
}

function classifyTerm(e: VocabEntry, q: string): Pick<VocabHit, 'rank' | 'field' | 'matchedText'> | null {
  if (e.nameLower === q) return { rank: RANKS.exactName, field: 'name', matchedText: null }
  if (e.nameLower.startsWith(q)) return { rank: RANKS.namePrefix, field: 'name', matchedText: null }
  if (wordMatch(e.nameLower, q)) return { rank: RANKS.nameWord, field: 'name', matchedText: null }
  const syn = termMatch(e.synonyms, q)
  if (syn) return { rank: RANKS.synonym, field: 'synonym', matchedText: syn.text }
  const digits = q.replace(/^zfa:?\s*/, '')
  if (/^\d+$/.test(digits) && e.idDigits.replace(/^0+/, '') === digits.replace(/^0+/, '')) {
    return { rank: RANKS.id, field: 'id', matchedText: null }
  }
  if (e.nameLower.includes(q)) return { rank: RANKS.substring, field: 'name', matchedText: null }
  return null
}

/**
 * Shortest query the vocabulary pass runs on. One letter matches thousands of the 3113 terms
 * ("a" 2408, "e" 2704), and the keystroke path pays for every one of them.
 */
export const VOCAB_MIN_QUERY = 2
/** Vocabulary rows the pass keeps. The combobox renders every row it is given, with no windowing. */
export const VOCAB_MAX_ROWS = 200

interface Scored {
  e: VocabEntry
  m: Pick<VocabHit, 'rank' | 'field' | 'matchedText'>
}

/** Rank, then the shorter name, then the name itself. Plain comparison: no collator per pair. */
function compareTerm(a: Scored, b: Scored): number {
  if (a.m.rank !== b.m.rank) return a.m.rank - b.m.rank
  if (a.e.term.name.length !== b.e.term.name.length) return a.e.term.name.length - b.e.term.name.length
  return a.e.nameLower < b.e.nameLower ? -1 : a.e.nameLower > b.e.nameLower ? 1 : 0
}

/** Keeps the best `limit` hits in order, so a broad query never sorts its whole hit list. */
function keepBest(best: Scored[], item: Scored, limit: number): void {
  if (best.length >= limit && compareTerm(item, best[best.length - 1]) >= 0) return
  let lo = 0
  let hi = best.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (compareTerm(item, best[mid]) < 0) hi = mid
    else lo = mid + 1
  }
  best.splice(lo, 0, item)
  if (best.length > limit) best.pop()
}

/** The best `limit` vocabulary hits and how many matched in all. Exact matching only: no fuzzy pass. */
export function searchVocabularyTop(index: VocabIndex | null, query: string, limit = VOCAB_MAX_ROWS): { hits: VocabHit[]; total: number } {
  const q = normalizeQuery(query)
  if (!index || q.length < VOCAB_MIN_QUERY) return { hits: [], total: 0 }
  const best: Scored[] = []
  let total = 0
  for (const e of index.entries) {
    const m = classifyTerm(e, q)
    if (!m) continue
    total++
    keepBest(best, { e, m }, limit)
  }
  return { hits: best.map(({ e, m }) => ({ term: e.term, standIn: e.standIn, badge: e.badge, ...m })), total }
}

/** Every vocabulary hit the pass keeps for the query, best first. */
export function searchVocabulary(index: VocabIndex | null, query: string, limit = VOCAB_MAX_ROWS): VocabHit[] {
  return searchVocabularyTop(index, query, limit).hits
}

// Result rows (UX-LY-02, UX-ST-02, D17) ------------------------------------------------------------

export interface SearchItem {
  /** The ZFA id, or "__notice" and "__more" for the two service rows. */
  id: string
  label: string
  kind: 'hit' | 'notice' | 'suggestion' | 'more' | 'term'
  disabled?: boolean
  hit?: SearchHit
  /** Set on a 'term' row. */
  term?: VocabHit
}

/**
 * Up to 8 rows and a "Show all N" row: the record hits first, then the vocabulary terms. With no
 * hit of either kind, the notice and three fuzzy record suggestions. "Show all" opens at most
 * SEARCH_PAGE + VOCAB_MAX_ROWS rows and closes with a line naming the true count, because the
 * combobox mounts every row it is handed.
 */
export function searchItems(index: SearchIndex, query: string, showAll: boolean, vocab: VocabIndex | null = null): SearchItem[] {
  const hits = searchStructures(index, query)
  const { hits: terms, total: termTotal } = searchVocabularyTop(vocab, query)
  if (hits.length === 0 && termTotal === 0) {
    const notice: SearchItem = {
      id: '__notice', kind: 'notice', disabled: true,
      label: `No structure matches '${query.trim()}'. Search also covers ZFA synonyms and ids.`,
    }
    const suggestions = fuzzySuggestions(index, query).map((hit): SearchItem => ({ id: hit.record.id, label: hit.record.name, kind: 'suggestion', hit }))
    return [notice, ...suggestions]
  }
  const all: SearchItem[] = [
    ...hits.map((hit): SearchItem => ({ id: hit.record.id, label: hit.record.name, kind: 'hit', hit })),
    ...terms.map((term): SearchItem => ({ id: term.term.id, label: term.term.name, kind: 'term', term })),
  ]
  const total = hits.length + termTotal
  const items = showAll ? all : all.slice(0, SEARCH_PAGE)
  // The row is one button; Search.tsx handles Enter on it before the combobox, so the list stays open.
  if (!showAll && total > items.length) items.push({ id: '__more', kind: 'more', label: `Show all ${total}` })
  else if (showAll && total > items.length) {
    items.push({
      id: '__capped', kind: 'notice', disabled: true,
      label: `Showing the first ${items.length} of ${total} matches. Type more of the name to narrow it.`,
    })
  }
  return items
}
