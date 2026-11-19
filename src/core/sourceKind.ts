// What kind of thing a source string is (review M9). The info card lists a ZFIN link, a paper and
// an internal modelling note in one column, so a reader with no context reads five citations where
// the record cites two. scripts/build-sources.ts classifies the same strings for docs/SOURCES.md,
// but it runs in Node and reads the JSON files from disk, so the browser cannot import it. The
// rule lives here, the script keeps its own copy, and tests/unit/infoCard.test.ts checks the two
// against every source string in src/data/structures/.

export type SourceKind = 'url' | 'doi' | 'citation' | 'note'

const URL_RE = /^https?:\/\/\S+$/
const BARE_DOI_RE = /^10\.\d{4,9}\/\S+$/
const CITATION_RE = /^[A-Z][A-Za-z.'-]+(?:,?\s+(?:&|and|et al\.?|[A-Z][A-Za-z.'-]+\.?))*\s*\(?(?:18|19|20)\d{2}\)?\b/

/**
 * A string of several URLs joined with "; " is still a URL. A bare DOI has no other text. A
 * citation starts with an author name (or names joined by "and", "&" or "et al.") and a
 * four-digit year. Everything else is a note: a measurement, a reasoning trail, an estimate, or a
 * pointer to a spec or a research file.
 */
export function classifySource(raw: string): SourceKind {
  const trimmed = raw.trim()
  const pieces = trimmed
    .split(';')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  if (pieces.length > 0 && pieces.every((p) => URL_RE.test(p))) return 'url'
  if (BARE_DOI_RE.test(trimmed)) return 'doi'
  if (CITATION_RE.test(trimmed)) return 'citation'
  return 'note'
}

/** True for a source a reader can go and read: a URL, a DOI or an author-year citation. */
export function isLiterature(raw: string): boolean {
  return classifySource(raw) !== 'note'
}

export interface SourceSplit {
  /** URLs, DOIs and citations, in the order the record states them. */
  literature: string[]
  /** Measurements, estimates and the reasoning behind a shape. */
  notes: string[]
}

/** Splits a record's sources into the two lists the info card labels. */
export function splitSources(sources: readonly string[]): SourceSplit {
  const literature: string[] = []
  const notes: string[] = []
  for (const s of sources) (isLiterature(s) ? literature : notes).push(s)
  return { literature, notes }
}
