// Writes docs/SOURCES.md, the index of where every number in the atlas came from.
//
//   node scripts/build-sources.ts [--check]
//
// Reads the `sources` arrays and fields of src/data/structures/*.json, src/data/stages.json and
// src/data/body.json. Each record can cite a source in four places: its own `sources` array, its
// `geometry.sources` array, the `source` field of one of its `events`, and the `source` field of
// one of its `sizes` rows. A stage cites through its own `sources` array; a stage event and a body
// keyframe each carry one `source` field. src/data/handoffs/*.json carries no `sources` field, so
// it is not read here.
//
// Each source string is classified as a URL, a bare DOI, a citation (an author-year reference,
// with or without a trailing URL), or a note (a measurement, a reasoning trail, an estimate, or a
// pointer to a spec or a research file). A URL is normalized by stripping trailing punctuation; a
// string of several URLs joined with "; " counts as one URL source, normalized piece by piece.
//
// `--check` exits 1 when the committed file differs from the generated text.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = resolve(repoRoot, 'docs/SOURCES.md')
const structuresDirName = 'src/data/structures'
const stagesFileName = 'src/data/stages.json'
const bodyFileName = 'src/data/body.json'
const zfinReadmeName = 'data/zfin/README.md'

export type Kind = 'url' | 'doi' | 'citation' | 'note'

export type SourceEntry = {
  kind: Kind
  display: string
  recordIds: string[]
}

export type SourceStats = {
  recordCount: number
  kindCounts: Record<Kind, number>
  totalDistinctSources: number
  recordsCitingUrlOrDoi: number
  sizeRowsTotal: number
  sizeRowsEstimate: number
  bodyKeyframesTotal: number
  bodyKeyframesEstimate: number
  recordsWithZeroSources: string[]
}

export type SourcesData = {
  entries: SourceEntry[]
  stats: SourceStats
}

type StructureRecord = {
  id: string
  sources?: string[]
  events?: { source?: string }[]
  sizes?: { source?: string; estimate?: boolean }[]
  geometry?: { sources?: string[] } | null
}

type StageRecord = { zfs: string; sources?: string[] }
type StageEvent = { id: string; source?: string }
type StagesFile = { stages: StageRecord[]; events: StageEvent[] }

type BodyKeyframe = { hpf: number; sources?: string[]; estimate?: string[] }
type BodyFile = { keyframes: BodyKeyframe[] }

/** Ordinal string compare, so a sort order does not depend on the machine's ICU locale. */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

const URL_RE = /^https?:\/\/\S+$/
const BARE_DOI_RE = /^10\.\d{4,9}\/\S+$/
const CITATION_RE = /^[A-Z][A-Za-z.'-]+(?:,?\s+(?:&|and|et al\.?|[A-Z][A-Za-z.'-]+\.?))*\s*\(?(?:18|19|20)\d{2}\)?\b/

/** Strips trailing punctuation a sentence left on a URL, and a closing bracket left unmatched. */
function normalizeUrlPiece(raw: string): string {
  let s = raw.trim()
  while (s.length > 0 && '.,;:'.includes(s[s.length - 1] as string)) s = s.slice(0, -1)
  if (s.endsWith(')') && s.split('(').length - 1 < s.split(')').length - 1) s = s.slice(0, -1)
  return s
}

/**
 * Classifies one source string. A string of several URLs joined with "; " is still a URL, each
 * piece normalized on its own. A bare DOI has no other text. A citation starts with an author name
 * (or names joined by "and", "&" or "et al.") and a four-digit year. Everything else is a note: a
 * measurement, a reasoning trail, an estimate, or a pointer to a spec or a research file.
 */
export function classify(raw: string): { kind: Kind; display: string } {
  const trimmed = raw.trim()
  const pieces = trimmed
    .split(';')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  if (pieces.length > 0 && pieces.every((p) => URL_RE.test(p))) {
    return { kind: 'url', display: pieces.map(normalizeUrlPiece).join('; ') }
  }
  if (BARE_DOI_RE.test(trimmed)) return { kind: 'doi', display: trimmed }
  if (CITATION_RE.test(trimmed)) return { kind: 'citation', display: trimmed }
  return { kind: 'note', display: trimmed }
}

type MapEntry = { kind: Kind; display: string; recordIds: Set<string> }

/** Classifies one raw source string and records that `recordId` cites it. Returns its kind. */
function addSource(map: Map<string, MapEntry>, recordId: string, raw: string): Kind {
  const { kind, display } = classify(raw)
  const key = `${kind} ${display}`
  const entry = map.get(key) ?? { kind, display, recordIds: new Set<string>() }
  entry.recordIds.add(recordId)
  map.set(key, entry)
  return kind
}

/** Reads the three data files and tallies every source they cite. */
export function collectSourcesData(root: string = repoRoot): SourcesData {
  const map = new Map<string, MapEntry>()
  const recordKinds = new Map<string, Set<Kind>>()
  const recordsWithZeroSources: string[] = []
  let recordCount = 0
  let sizeRowsTotal = 0
  let sizeRowsEstimate = 0

  const structuresDir = resolve(root, structuresDirName)
  const files = readdirSync(structuresDir)
    .filter((n) => n.endsWith('.json'))
    .sort(compare)
  for (const file of files) {
    const records = JSON.parse(readFileSync(join(structuresDir, file), 'utf8')) as StructureRecord[]
    for (const rec of records) {
      recordCount++
      const pool: string[] = [...(rec.sources ?? [])]
      if (rec.geometry) pool.push(...(rec.geometry.sources ?? []))
      for (const ev of rec.events ?? []) if (ev.source) pool.push(ev.source)
      for (const sz of rec.sizes ?? []) {
        sizeRowsTotal++
        if (sz.estimate === true) sizeRowsEstimate++
        if (sz.source) pool.push(sz.source)
      }
      if (pool.length === 0 && rec.geometry) recordsWithZeroSources.push(rec.id)
      const kinds = recordKinds.get(rec.id) ?? new Set<Kind>()
      recordKinds.set(rec.id, kinds)
      for (const raw of pool) kinds.add(addSource(map, rec.id, raw))
    }
  }

  const stagesFile = JSON.parse(readFileSync(resolve(root, stagesFileName), 'utf8')) as StagesFile
  for (const stage of stagesFile.stages) {
    for (const raw of stage.sources ?? []) addSource(map, stage.zfs, raw)
  }
  for (const event of stagesFile.events) {
    if (event.source) addSource(map, event.id, event.source)
  }

  const bodyFile = JSON.parse(readFileSync(resolve(root, bodyFileName), 'utf8')) as BodyFile
  let bodyKeyframesTotal = 0
  let bodyKeyframesEstimate = 0
  for (const kf of bodyFile.keyframes) {
    bodyKeyframesTotal++
    if (kf.estimate && kf.estimate.length > 0) bodyKeyframesEstimate++
    const recordId = `body@${kf.hpf}hpf`
    for (const raw of kf.sources ?? []) addSource(map, recordId, raw)
  }

  const entries: SourceEntry[] = [...map.values()]
    .map((e) => ({ kind: e.kind, display: e.display, recordIds: [...e.recordIds].sort(compare) }))
    .sort((a, b) => b.recordIds.length - a.recordIds.length || compare(a.display, b.display))

  const kindCounts: Record<Kind, number> = { url: 0, doi: 0, citation: 0, note: 0 }
  for (const e of entries) kindCounts[e.kind]++

  const recordsCitingUrlOrDoi = [...recordKinds.values()].filter((k) => k.has('url') || k.has('doi')).length

  return {
    entries,
    stats: {
      recordCount,
      kindCounts,
      totalDistinctSources: entries.length,
      recordsCitingUrlOrDoi,
      sizeRowsTotal,
      sizeRowsEstimate,
      bodyKeyframesTotal,
      bodyKeyframesEstimate,
      recordsWithZeroSources,
    },
  }
}

function truncate(s: string, max = 140): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1).trimEnd()}…`
}

/** Markdown-escapes a table cell: a literal pipe would break the row, a newline would break the table. */
function escapeCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

function formatRecordIds(ids: string[]): string {
  if (ids.length <= 8) return ids.join(', ')
  return `${ids.slice(0, 8).join(', ')}, +${ids.length - 8} more`
}

export function renderSourcesDoc(data: SourcesData, zfinReadme: string): string {
  const { stats } = data
  const keyframesTotal = stats.sizeRowsTotal + stats.bodyKeyframesTotal
  const keyframesEstimate = stats.sizeRowsEstimate + stats.bodyKeyframesEstimate

  const lines: string[] = []
  lines.push('# Data sources')
  lines.push('')
  lines.push('`npm run sources` generates this file from `src/data/structures/*.json`, `src/data/stages.json`')
  lines.push('and `src/data/body.json`. It lists where every number in the atlas came from: a URL, a DOI, a')
  lines.push('citation, or a note that states an estimate and the reasoning behind it. Do not edit this file')
  lines.push('by hand. Edit the `sources` field of the record instead, then run the script again.')
  lines.push('')
  lines.push("A source longer than 140 characters is shown truncated below. The record's own JSON file")
  lines.push('carries the full text.')
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  lines.push('| Metric | Count |')
  lines.push('|---|---|')
  lines.push(`| Records (\`src/data/structures/\`) | ${stats.recordCount} |`)
  lines.push(`| Distinct sources, URL | ${stats.kindCounts.url} |`)
  lines.push(`| Distinct sources, DOI | ${stats.kindCounts.doi} |`)
  lines.push(`| Distinct sources, citation | ${stats.kindCounts.citation} |`)
  lines.push(`| Distinct sources, note or estimate | ${stats.kindCounts.note} |`)
  lines.push(`| Distinct sources, total | ${stats.totalDistinctSources} |`)
  lines.push(`| Records that cite a URL or a DOI | ${stats.recordsCitingUrlOrDoi} of ${stats.recordCount} |`)
  lines.push(`| Keyframes marked as an estimate | ${keyframesEstimate} of ${keyframesTotal} |`)
  lines.push('')
  lines.push(
    `"Keyframes" counts the ${stats.sizeRowsTotal} \`sizes\` rows of \`src/data/structures/\` ` +
      `(${stats.sizeRowsEstimate} carry \`"estimate": true\`) and the ${stats.bodyKeyframesTotal} keyframes of ` +
      `\`src/data/body.json\` (${stats.bodyKeyframesEstimate} carry a non-empty \`estimate\` field). A \`geometry\` ` +
      'block can mark some of its own fields as an estimate too, but that flag applies to the block, not to one',
  )
  lines.push('keyframe, so it is not part of this count.')
  lines.push('')
  if (stats.recordsWithZeroSources.length > 0) {
    lines.push(
      `${stats.recordsWithZeroSources.length} record(s) cite no source at all: ${stats.recordsWithZeroSources.join(', ')}.`,
    )
    lines.push('')
  }
  lines.push('## Sources by citation count')
  lines.push('')
  lines.push('Sorted by the number of records that cite each source, most first.')
  lines.push('')
  lines.push('| Source | Kind | Citing records | Citing record ids |')
  lines.push('|---|---|---|---|')
  for (const e of data.entries) {
    lines.push(
      `| ${escapeCell(truncate(e.display))} | ${e.kind} | ${e.recordIds.length} | ${escapeCell(formatRecordIds(e.recordIds))} |`,
    )
  }
  lines.push('')
  lines.push('## Fixed bulk inputs')
  lines.push('')
  lines.push('The atlas also reads five ZFIN files as bulk input to the anatomy vocabulary and the stage table,')
  lines.push('not as a per-record citation. `data/zfin/README.md` names the files, their source URLs and the')
  lines.push('download date:')
  lines.push('')
  for (const line of zfinReadme.split('\n')) lines.push(line.length > 0 ? `> ${line}` : '>')
  lines.push('')
  return lines.join('\n')
}

async function main(): Promise<number> {
  const check = process.argv.includes('--check')
  const data = collectSourcesData(repoRoot)
  const zfinReadme = readFileSync(resolve(repoRoot, zfinReadmeName), 'utf8')
  const text = renderSourcesDoc(data, zfinReadme)
  if (check) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : ''
    if (current !== text) {
      console.error(`sources: ${outPath} is out of date; run node scripts/build-sources.ts`)
      return 1
    }
    console.log(`sources: ${outPath} is up to date (${data.stats.recordCount} records, ${data.stats.totalDistinctSources} distinct sources)`)
    return 0
  }
  writeFileSync(outPath, text)
  console.log(`sources: wrote ${outPath} (${data.stats.recordCount} records, ${data.stats.totalDistinctSources} distinct sources)`)
  return 0
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(`sources: ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    },
  )
}
