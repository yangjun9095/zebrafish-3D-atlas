// Builds src/data/vocabulary.json: every non-obsolete ZFA term of the ZFIN snapshot (D17).
//
//   node scripts/build-vocabulary.ts [--zfin <dir>] [--data <dir>] [--out <path>] [--check]
//
// Inputs: data/zfin/anatomy_item.txt (id, name, start and end stage), anatomy_synonyms.txt,
// anatomy_relationship.txt (part of, is_a, develops from), stage_ontology.txt (hpf per stage)
// and zfa.obo (definitions and the obsolete flag). The modeled records under src/data/structures/
// supply the stand-in resolution.
//
// The file uses one-letter keys, ids without the "ZFA:" prefix and a stand-in path of ids, so the
// lazy chunk stays under the 900 kB budget of D17. src/core/vocabularySchema.ts parses it and
// src/core/vocabulary.ts expands the short keys into the named API. docs/api/vocabulary.md
// documents both. `--check` writes nothing and exits 1 when the file on disk is out of date.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Definition text kept per term (D17). */
export const MAX_DEFINITION = 240
/** The root of the cell branch; its is_a descendants get kind 'cell'. */
export const CELL_ROOT = 'ZFA:0009000'
/** Extra closure steps searched for a record with geometry once a group node has matched. */
export const GEOMETRY_LOOKAHEAD = 2
/** Guard against a relation cycle in the snapshot. */
const MAX_VISITED = 4000
/** The interactive time axis ends here (D1); a ZFIN window past it still meets a record that reaches the end. */
export const AXIS_END_HPF = 4320
/**
 * The ZFIN placeholder stage row (ZFS:0000000, 0.00 to 17520.00 hpf). It states no window, so a
 * term that carries it gets no `a` and no `b` instead of a window from the zygote to the adult.
 */
export const UNKNOWN_STAGE_ZDB = 'ZDB-STAGE-050211-1'

/**
 * The upper CARO classes of ZFA. Above these the graph carries no containment: every term of the
 * ontology is a portion of tissue, a compound organ or a cell, and every one of those is part of
 * the whole organism. A walk that reaches one has left the containment hierarchy D17 asks for, so
 * the closure neither steps through them nor accepts them as a stand-in, and "part of whole
 * organism" is never the answer. A term whose only path runs through them has no model yet.
 */
export const STOP_CLASSES: ReadonlySet<string> = new Set([
  'ZFA:0100000', // zebrafish anatomical entity
  'ZFA:0000037', // anatomical structure
  'ZFA:0001094', // whole organism
  'ZFA:0000242', // male organism
  'ZFA:0000303', // female organism
  'ZFA:0001105', // embryonic structure
  'ZFA:0001308', // organism subdivision
  'ZFA:0001439', // anatomical system
  'ZFA:0001487', // portion of organism substance
  'ZFA:0001512', // anatomical group
  'ZFA:0001477', // portion of tissue
  'ZFA:0001478', // anatomical cluster
  'ZFA:0001488', // multi-tissue structure
  'ZFA:0000496', // compound organ
  'ZFA:0001490', // cavitated compound organ
  'ZFA:0009000', // cell
])

/** A hand-picked stand-in, with the reason a curator can audit. */
export interface Override {
  standIn: string
  why: string
}

/**
 * Stand-ins the closure cannot find. A cell-type term is an is_a descendant of ZFA:0009000 cell
 * and never a part of the tissue it builds, so the walk stops at the cell root; the two lens rows
 * reach the epiblast through a develops_from edge that predates the term. Each row names the
 * record that draws the term on screen. Source: docs/research/11-zebrahub-celltype-crosswalk.md
 * section 5.
 */
export const OVERRIDES: ReadonlyMap<string, Override> = new Map<string, Override>([
  ['ZFA:0000122', { standIn: 'ZFA:0000107', why: 'lens placode: ZFA puts it in the immature eye, which no record draws; the eye record covers 11.66 hpf on' }],
  ['ZFA:0001679', { standIn: 'ZFA:0000107', why: 'solid lens vesicle: the lens forms inside the eye record, which draws the lens part from 24 hpf' }],
  ['ZFA:0009183', { standIn: 'ZFA:0000105', why: 'epidermal cell: the epidermis record draws the tissue these cells build (crosswalk section 5 item 2)' }],
  ['ZFA:0005323', { standIn: 'ZFA:0000105', why: 'ionocyte: an epidermal cell type; the epidermis record draws the sheet it sits in' }],
  ['ZFA:0007123', { standIn: 'ZFA:0000105', why: 'ionocyte progenitor cell: the same sheet as the ionocyte it becomes' }],
  ['ZFA:0005325', { standIn: 'ZFA:0000368', why: 'integument ionocyte: named for the integument, which is a group node of the skin system' }],
  ['ZFA:0009151', { standIn: 'ZFA:0000026', why: 'hatching gland cell: the hatching gland record draws the gland these cells make up' }],
  ['ZFA:0009316', { standIn: 'ZFA:0000114', why: 'cardiac muscle cell: the heart record draws the myocardium' }],
  ['ZFA:0009389', { standIn: 'ZFA:0000529', why: 'kidney cell: the kidney record draws the organ' }],
  ['ZFA:0009280', { standIn: 'ZFA:0000152', why: 'Muller cell: the radial glia of the retina, which the retina record draws' }],
])

type Options = { zfin: string; data: string; out: string; check: boolean }

type Stage = { zdb: string; startHpf: number; endHpf: number }
type Item = { id: string; name: string; startZdb: string; endZdb: string }
type Parents = { partOf: string[]; isA: string[]; developsFrom: string[] }

/** A modeled record of src/data/structures/. */
type Modeled = {
  id: string
  name: string
  hasGeometry: boolean
  /** the hpf window the viewer draws the record over */
  fromHpf: number
  toHpf: number
  /** how many other records sit under this one; a group-level container holds many */
  contains: number
}

/** The ZFIN stage window of a term, in hpf; null on either side when ZFIN states none. */
export interface TermWindow {
  startHpf: number | null
  endHpf: number | null
}

export type TermJson = {
  /** id without the "ZFA:" prefix */
  i: string
  n: string
  /** synonyms */
  y?: string[]
  /** definition, first sentence */
  d?: string
  /** ZFIN start hpf; absent when the ZFIN row carries the Unknown stage, which states no window */
  a?: number
  /** ZFIN end hpf; absent for the same reason */
  b?: number
  /** part_of parents, ids without the prefix */
  p?: string[]
  /** is_a parents */
  s?: string[]
  /** stand-in record id, absent when nothing models the term */
  m?: string
  /** the chain from the term to the stand-in, nearest first, ending at the stand-in */
  c?: string[]
  /** 1 for a cell term; absent for a structure */
  k?: 1
}

export type VocabularyJson = {
  release: string | null
  source: string
  terms: TermJson[]
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { zfin: 'data/zfin', data: 'src/data/structures', out: 'src/data/vocabulary.json', check: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--zfin') opts.zfin = argv[++i] ?? opts.zfin
    else if (a === '--data') opts.data = argv[++i] ?? opts.data
    else if (a === '--out') opts.out = argv[++i] ?? opts.out
    else if (a === '--check') opts.check = true
    else if (a === '--help' || a === '-h') {
      console.log('usage: node scripts/build-vocabulary.ts [--zfin <dir>] [--data <dir>] [--out <path>] [--check]')
      process.exit(0)
    } else {
      console.error(`unknown argument ${a}`)
      process.exit(2)
    }
  }
  return opts
}

function rows(path: string): string[][] {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'))
}

export function stripZfa(id: string): string {
  return id.startsWith('ZFA:') ? id.slice(4) : id
}

/**
 * Abbreviations whose period never closes a sentence. A single initial, "T." of "T. Whitfield",
 * is caught by its length instead.
 */
export const ABBREVIATIONS: ReadonlySet<string> = new Set([
  'al', 'approx', 'ca', 'cf', 'dr', 'e.g', 'ed', 'eds', 'etc', 'fig', 'figs', 'i.e', 'mr', 'mrs',
  'no', 'pp', 'prof', 'resp', 'sp', 'spp', 'ssp', 'st', 'var', 'viz', 'vol', 'vs',
])

/** The shortest sentence a cut accepts, so a leading abbreviation never ends one. */
const MIN_SENTENCE = 20

/**
 * Removes the markup a ZFA definition carries. Sixteen definitions link the ZFIN Anatomical
 * Atlas with an `<a href>` element (review B04), and the term card prints its text, so the tags
 * go before anything measures or cuts the string.
 */
export function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The token that ends at `end`: letters, digits and the periods inside "e.g". */
function tokenBefore(text: string, end: number): string {
  let start = end
  while (start > 0 && /[A-Za-z0-9.]/.test(text[start - 1] as string)) start--
  return text.slice(start, end)
}

/** One sentence end: the index after the stop, and whether a parenthetical opens after it. */
export interface SentenceEnd {
  index: number
  /** true when the next sentence starts with "(", as the ZFIN Anatomical Atlas credits do. */
  parenthetical: boolean
}

/**
 * Every sentence end of `text`, in order. A stop ends a sentence when a space and a capital, a
 * digit or an opening parenthesis follow it, the stop sits outside every bracket, and the token
 * before it is neither an initial ("by T. Whitfield") nor a known abbreviation ("e.g. the yolk").
 */
export function sentenceEnds(text: string): SentenceEnd[] {
  const out: SentenceEnd[] = []
  let depth = 0
  for (let i = 0; i < text.length - 2; i++) {
    const c = text[i]
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1)
    else if (c === '.' || c === '?' || c === '!') {
      if (depth > 0) continue
      if (i < MIN_SENTENCE) continue
      if (text[i + 1] !== ' ') continue
      const next = text[i + 2] as string
      const capital = /[A-Z0-9]/.test(next)
      if (!capital && next !== '(') continue
      const token = tokenBefore(text, i).toLowerCase()
      if (token.length === 1 && /[a-z]/.test(token)) continue
      if (ABBREVIATIONS.has(token)) continue
      out.push({ index: i + 1, parenthetical: !capital })
    }
  }
  return out
}

/** The index of the last bracket `text` leaves open, or -1. */
function lastUnclosed(text: string): number {
  const stack: number[] = []
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '(' || c === '[') stack.push(i)
    else if ((c === ')' || c === ']') && stack.length > 0) stack.pop()
  }
  return stack.length > 0 ? (stack[stack.length - 1] as number) : -1
}

/** Drops a trailing initial or abbreviation, so a cut never lands inside a person's name. */
function dropTrailingAbbreviation(text: string): string {
  let out = text.trimEnd()
  for (;;) {
    const gap = out.lastIndexOf(' ')
    if (gap < MIN_SENTENCE) return out
    const token = out.slice(gap + 1).replace(/[^A-Za-z0-9.]/g, '')
    if (!token.endsWith('.')) return out
    const bare = token.slice(0, -1).toLowerCase()
    if (bare.length !== 1 && !ABBREVIATIONS.has(bare)) return out
    out = out.slice(0, gap).trimEnd()
  }
}

/** Cuts `text` to `max`, the ellipsis included, at a word gap outside every bracket. */
function cutToFit(text: string, max: number): string {
  const limit = max - 3
  const gap = text.lastIndexOf(' ', limit)
  let out = text.slice(0, gap > MIN_SENTENCE ? gap : limit)
  const open = lastUnclosed(out)
  if (open > MIN_SENTENCE) out = out.slice(0, open)
  out = dropTrailingAbbreviation(out)
  return `${out.replace(/[\s,;:.([-]+$/, '')}...`
}

/**
 * The definition a term card prints: the markup removed, then the first `sentences` whole
 * sentences (one by default). `sentences` is 2 for a term whose first sentence is identical to
 * another term's (the six chromatophore cell types all open "A pigment cell derived from the
 * neural crest."), so the card shows the trait that tells them apart instead of two duplicate
 * cards. A result longer than `max` is cut at the last sentence end that fits, which drops a
 * trailing credit or a second sentence rather than splitting it; a sentence that carries no such
 * end is cut at a word gap, outside every bracket and clear of an initial, and ends in an
 * ellipsis.
 */
export function shortenDefinition(text: string, max = MAX_DEFINITION, sentences = 1): string {
  const clean = stripMarkup(text)
  const ends = sentenceEnds(clean)
  const whole = ends.filter((e) => !e.parenthetical)
  const chosen = whole[sentences - 1]
  const first = chosen ? clean.slice(0, chosen.index) : clean
  if (first.length <= max) return first
  const fits = ends.filter((e) => e.index <= max)
  const last = fits[fits.length - 1]
  return last ? clean.slice(0, last.index) : cutToFit(first, max)
}

/** The first whole sentence of a definition, markup removed, uncut. Used to find a repeated opener. */
function firstWholeSentence(text: string): string {
  const clean = stripMarkup(text)
  const first = sentenceEnds(clean).find((e) => !e.parenthetical)
  return first ? clean.slice(0, first.index) : clean
}

/** Unescapes the quoted string of an OBO `def:` line. */
function oboQuoted(line: string): string {
  const start = line.indexOf('"')
  if (start < 0) return ''
  let out = ''
  for (let i = start + 1; i < line.length; i++) {
    const c = line[i]
    if (c === '\\') {
      i++
      out += line[i] ?? ''
    } else if (c === '"') break
    else out += c
  }
  return out
}

export type Obo = { definitions: Map<string, string>; obsolete: Set<string>; release: string | null }

/** Reads the definitions and the obsolete flags of zfa.obo. */
export function readObo(path: string): Obo {
  const definitions = new Map<string, string>()
  const obsolete = new Set<string>()
  const raw = new Map<string, string>()
  let release: string | null = null
  let id: string | null = null
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (line.startsWith('data-version:')) release = line.slice(13).trim().replace(/^releases\//, '')
    else if (line === '[Term]') id = null
    else if (line.startsWith('id: ')) id = line.slice(4).trim()
    else if (id === null) continue
    else if (line.startsWith('def: ')) raw.set(id, oboQuoted(line))
    else if (line.startsWith('is_obsolete: true')) obsolete.add(id)
  }
  // Counts how many terms open on the same first sentence, so a repeated opener (the six
  // chromatophore cell types, among others) gets its second sentence kept instead of colliding.
  const openerCounts = new Map<string, number>()
  for (const text of raw.values()) {
    const opener = firstWholeSentence(text)
    openerCounts.set(opener, (openerCounts.get(opener) ?? 0) + 1)
  }
  for (const [termId, text] of raw) {
    const repeated = (openerCounts.get(firstWholeSentence(text)) ?? 0) > 1
    definitions.set(termId, shortenDefinition(text, MAX_DEFINITION, repeated ? 2 : 1))
  }
  return { definitions, obsolete, release }
}

/** Reads every structure record file and returns the modeled ids plus the alias-to-record map. */
export function readModeled(dir: string): { modeled: Map<string, Modeled>; aliasOf: Map<string, string> } {
  const modeled = new Map<string, Modeled>()
  const aliasOf = new Map<string, string>()
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const parsed: unknown = JSON.parse(readFileSync(join(dir, name), 'utf8'))
    if (!Array.isArray(parsed)) continue
    for (const raw of parsed) {
      const r = raw as {
        id?: string
        name?: string
        geometry?: unknown
        aliasChain?: { zfaId?: string }[]
        visibleFromHpf?: number
        modelEndHpf?: number
      }
      if (typeof r.id !== 'string' || typeof r.name !== 'string') continue
      modeled.set(r.id, {
        id: r.id,
        name: r.name,
        hasGeometry: r.geometry !== null && r.geometry !== undefined,
        fromHpf: typeof r.visibleFromHpf === 'number' ? r.visibleFromHpf : 0,
        toHpf: typeof r.modelEndHpf === 'number' ? r.modelEndHpf : AXIS_END_HPF,
        contains: 0,
      })
      for (const alias of r.aliasChain ?? []) {
        if (typeof alias.zfaId === 'string' && alias.zfaId !== r.id) aliasOf.set(alias.zfaId, r.id)
      }
    }
  }
  return { modeled, aliasOf }
}

/**
 * Counts, for every record, the other records under it in the part_of and is_a closure. The count
 * says how group-level a candidate is: the brain holds a dozen records, the floor plate none, so
 * two candidates at the same depth are ranked by it and the narrower one wins (BIO-12).
 */
export function countContained(modeled: Map<string, Modeled>, parents: Map<string, Parents>): void {
  for (const record of modeled.values()) {
    const seen = new Set<string>([record.id])
    const stack = [record.id]
    let visited = 0
    while (stack.length > 0 && visited < MAX_VISITED) {
      const id = stack.pop() as string
      const p = parents.get(id)
      if (!p) continue
      for (const parent of [...p.partOf, ...p.isA]) {
        if (seen.has(parent) || STOP_CLASSES.has(parent)) continue
        seen.add(parent)
        visited++
        stack.push(parent)
        const ancestor = modeled.get(parent)
        if (ancestor) ancestor.contains++
      }
    }
  }
}

export type StandIn = { id: string | null; path: string[] }

export interface ResolveInput {
  parents: Map<string, Parents>
  modeled: Map<string, Modeled>
  aliasOf: Map<string, string>
}

/**
 * Whether a record is on screen while the term exists. A term whose ZFIN window and record window
 * never meet highlights nothing and offers a jump to a stage the term has no part in (BIO-03).
 * A term with no stage row (endHpf 0) states no window, so every record meets it.
 */
export function meetsWindow(record: Modeled, window: TermWindow | null): boolean {
  if (!window || window.endHpf === null || !(window.endHpf > 0)) return true
  const start = Math.min(window.startHpf ?? 0, AXIS_END_HPF)
  const end = Math.min(window.endHpf, AXIS_END_HPF)
  return record.fromHpf <= end && start <= record.toHpf
}

/** The record a term id stands in for directly: itself, or the record whose alias chain names it. */
function directRecord(id: string, input: ResolveInput): string | null {
  if (input.modeled.has(id)) return id
  return input.aliasOf.get(id) ?? null
}

type Node = { id: string; path: string[] }
type Hit = Node & { depth: number; meets: boolean; hasGeometry: boolean; contains: number }

/**
 * Ranks two candidates. A record that is on screen while the term exists beats one that is not,
 * because a stand-in the reader cannot see explains nothing (BIO-03). Then a record that draws
 * geometry beats a group node, because only a drawn record carries the selection outline (D17).
 * Then the nearer ancestor, and last the narrower one, so the floor plate beats the hindbrain.
 */
function better(a: Hit, b: Hit): boolean {
  if (a.meets !== b.meets) return a.meets
  if (a.hasGeometry !== b.hasGeometry) return a.hasGeometry
  if (a.depth !== b.depth) return a.depth < b.depth
  return a.contains < b.contains
}

/**
 * Breadth-first walk up `edges` from `id`. Stops at the nearest modeled record, then keeps
 * walking GEOMETRY_LOOKAHEAD further levels, because a nearer candidate can lose on the ranking
 * above. The walk never steps on a STOP_CLASSES member.
 */
function nearestModeled(
  id: string,
  input: ResolveInput,
  edges: (p: Parents) => string[],
  window: TermWindow | null,
): Hit | null {
  const seen = new Set<string>([id])
  let frontier: Node[] = [{ id, path: [] }]
  let best: Hit | null = null
  let visited = 0
  for (let depth = 1; frontier.length > 0 && visited < MAX_VISITED; depth++) {
    if (best && depth > best.depth + GEOMETRY_LOOKAHEAD) break
    const next: Node[] = []
    for (const node of frontier) {
      const p = input.parents.get(node.id)
      if (!p) continue
      for (const parent of edges(p)) {
        if (seen.has(parent) || STOP_CLASSES.has(parent)) continue
        seen.add(parent)
        visited++
        const path = [...node.path, parent]
        const record = directRecord(parent, input)
        if (record === null) {
          next.push({ id: parent, path })
          continue
        }
        const found = input.modeled.get(record) as Modeled
        const hit: Hit = {
          id: record,
          path: record === parent ? path : [...path, record],
          depth,
          meets: meetsWindow(found, window),
          hasGeometry: found.hasGeometry,
          contains: found.contains,
        }
        if (!best || better(hit, best)) best = hit
      }
    }
    frontier = next
  }
  return best
}

/**
 * The record a term stands in for: itself, the record whose alias chain names it, a curated
 * override, or the nearest modeled ancestor. The closure runs in three stages, part_of, then
 * part_of with is_a, then all three relations (D17), so "modelled as part of" names a containing
 * structure whenever one exists and falls back to develops_from only for a term with no
 * anatomical parent. Returns the chain from the term to the stand-in, nearest first.
 */
export function resolveStandIn(id: string, input: ResolveInput, window: TermWindow | null = null): StandIn {
  const own = directRecord(id, input)
  if (own) return { id: own, path: [own] }
  const override = OVERRIDES.get(id)
  if (override && input.modeled.has(override.standIn)) return { id: override.standIn, path: [override.standIn] }
  const stages: ((p: Parents) => string[])[] = [
    (p) => p.partOf,
    (p) => [...p.partOf, ...p.isA],
    (p) => [...p.partOf, ...p.isA, ...p.developsFrom],
  ]
  for (const edges of stages) {
    const hit = nearestModeled(id, input, edges, window)
    if (hit) return { id: hit.id, path: hit.path }
  }
  return { id: null, path: [] }
}

/** Every id reachable from CELL_ROOT by following is_a edges downward. */
export function cellIds(parents: Map<string, Parents>): Set<string> {
  const childrenByIsA = new Map<string, string[]>()
  for (const [child, p] of parents) {
    for (const parent of p.isA) {
      const list = childrenByIsA.get(parent) ?? []
      list.push(child)
      childrenByIsA.set(parent, list)
    }
  }
  const out = new Set<string>()
  const stack = [CELL_ROOT]
  while (stack.length > 0) {
    const id = stack.pop() as string
    for (const child of childrenByIsA.get(id) ?? []) {
      if (out.has(child)) continue
      out.add(child)
      stack.push(child)
    }
  }
  return out
}

export function buildVocabulary(opts: Pick<Options, 'zfin' | 'data'>, root = repoRoot): VocabularyJson {
  const zfinDir = resolve(root, opts.zfin)
  const stages = new Map<string, Stage>()
  for (const [zdb, , , startHpf, endHpf] of rows(join(zfinDir, 'stage_ontology.txt'))) {
    if (zdb) stages.set(zdb, { zdb, startHpf: Number(startHpf), endHpf: Number(endHpf) })
  }

  const items: Item[] = []
  for (const [id, name, startZdb, endZdb] of rows(join(zfinDir, 'anatomy_item.txt'))) {
    if (id && name) items.push({ id, name, startZdb: startZdb ?? '', endZdb: endZdb ?? '' })
  }

  const synonyms = new Map<string, string[]>()
  for (const [id, , synonym] of rows(join(zfinDir, 'anatomy_synonyms.txt'))) {
    if (!id || !synonym) continue
    const list = synonyms.get(id) ?? []
    const text = synonym.trim()
    if (text.length > 0 && !list.includes(text)) list.push(text)
    synonyms.set(id, list)
  }

  const parents = new Map<string, Parents>()
  const parentsOf = (id: string): Parents => {
    const found = parents.get(id) ?? { partOf: [], isA: [], developsFrom: [] }
    parents.set(id, found)
    return found
  }
  for (const [parent, child, type] of rows(join(zfinDir, 'anatomy_relationship.txt'))) {
    if (!parent || !child) continue
    const p = parentsOf(child)
    const kind = (type ?? '').trim()
    if (kind === 'part of') p.partOf.push(parent)
    else if (kind === 'is_a') p.isA.push(parent)
    else if (kind === 'develops from') p.developsFrom.push(parent)
  }

  const obo = readObo(join(zfinDir, 'zfa.obo'))
  const { modeled, aliasOf } = readModeled(resolve(root, opts.data))
  countContained(modeled, parents)
  for (const [id, override] of OVERRIDES) {
    if (!modeled.has(override.standIn)) throw new Error(`OVERRIDES: ${id} names ${override.standIn}, which no record draws`)
    if (modeled.has(id)) throw new Error(`OVERRIDES: ${id} is a record of its own; drop the row`)
  }
  const cells = cellIds(parents)
  const input: ResolveInput = { parents, modeled, aliasOf }

  const terms: TermJson[] = []
  for (const item of items) {
    if (obo.obsolete.has(item.id)) continue
    const start = item.startZdb === UNKNOWN_STAGE_ZDB ? undefined : stages.get(item.startZdb)
    const end = item.endZdb === UNKNOWN_STAGE_ZDB ? undefined : stages.get(item.endZdb)
    const p = parents.get(item.id)
    const term: TermJson = { i: stripZfa(item.id), n: item.name }
    if (start) term.a = start.startHpf
    if (end) term.b = end.endHpf
    const standIn = resolveStandIn(item.id, input, { startHpf: term.a ?? null, endHpf: term.b ?? null })
    const syn = synonyms.get(item.id)
    if (syn && syn.length > 0) term.y = syn
    const def = obo.definitions.get(item.id)
    if (def) term.d = def
    if (p && p.partOf.length > 0) term.p = p.partOf.map(stripZfa)
    if (p && p.isA.length > 0) term.s = p.isA.map(stripZfa)
    if (standIn.id) {
      term.m = stripZfa(standIn.id)
      term.c = standIn.path.map(stripZfa)
    }
    if (cells.has(item.id)) term.k = 1
    terms.push(term)
  }
  terms.sort((a, b) => (a.i < b.i ? -1 : a.i > b.i ? 1 : 0))
  return {
    release: obo.release,
    source: 'data/zfin: anatomy_item.txt, anatomy_synonyms.txt, anatomy_relationship.txt, stage_ontology.txt, zfa.obo',
    terms,
  }
}

/** One term per line, so a diff of the generated file reads as a list of terms. */
export function serialize(file: VocabularyJson): string {
  const head = `{\n  "release": ${JSON.stringify(file.release)},\n  "source": ${JSON.stringify(file.source)},\n  "terms": [\n`
  const body = file.terms.map((t) => `    ${JSON.stringify(t)}`).join(',\n')
  return `${head}${body}\n  ]\n}\n`
}

function main(): number {
  const opts = parseArgs(process.argv.slice(2))
  const file = buildVocabulary(opts)
  const text = serialize(file)
  const outPath = resolve(repoRoot, opts.out)
  const bytes = Buffer.byteLength(text, 'utf8')
  const modeledCount = file.terms.filter((t) => t.m !== undefined).length
  const cellCount = file.terms.filter((t) => t.k === 1).length
  if (opts.check) {
    let current: string
    try {
      current = readFileSync(outPath, 'utf8')
    } catch {
      current = ''
    }
    if (current !== text) {
      console.error(`build-vocabulary: ${opts.out} is out of date; run node scripts/build-vocabulary.ts`)
      return 1
    }
  } else {
    writeFileSync(outPath, text)
  }
  console.log(
    `build-vocabulary: ${file.terms.length} terms, ${modeledCount} with a stand-in, ${cellCount} cell terms, ` +
      `${(bytes / 1024).toFixed(1)} kB raw (release ${file.release ?? 'unknown'})`,
  )
  return 0
}

// Run as a script; imported by the unit test as a module.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) process.exit(main())
