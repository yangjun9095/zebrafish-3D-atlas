// The candidate tissues of a stage range: one row per structure record whose window meets the
// range, in the shape scripts/movies/selection/capture.ts reads.
//
//   node scripts/movies/selection/candidates.ts --from 0 --to 48 --out FILE [--system a,b]
//
// It reads every JSON file of src/data/structures/, the records that carry geometry and the group
// nodes of groups.json. A group such as the brain (ZFA:0000008) draws nothing itself and lights
// its parts, so its row carries `kind: "group"` and `includeParts: true`; four of the twenty
// tissues of the 2026-09-14 list (the brain, the lateral line system, the pigment cells and the
// trunk vasculature) are groups.
//
// A record's `id` is its ZFA id, and the fluorescence rule of src/core/fluorescence.ts points at
// that same id, so `targetId` and `recordId` hold it twice: `targetId` is what a rule and
// tissues.json take, `recordId` is what to edit under src/data/structures/.
//
// `includeParts` is true when another record names this record as its `uiParent`.
// `fluorescenceTargets` walks `uiParent` alone, so that field decides whether a rule over this
// target can light anything besides the record itself. The flag is a proposal: tissues.json turns
// it off for the germ ring, the myotome and the intermediate cell mass, whose parts read as one
// mass anyway.
//
// `fromHpf` and `toHpf` are the record's own window, `visibleFromHpf` to `modelEndHpf` (or to
// `endHpf` when the record models no earlier end). The requested range sits in the file header.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

/** The file that holds the group nodes; every other JSON file holds records with geometry. */
export const GROUP_FILE = 'groups.json'

/** The fields of a structure record this script reads. Every other field is ignored. */
export interface RecordInput {
  id: string
  /** True for a node of groups.json, which draws nothing itself and lights its parts. */
  group?: boolean
  name?: string | null
  system?: string | null
  uiParent?: string | null
  visibleFromHpf?: number | null
  modelEndHpf?: number | null
  endHpf?: number | null
  geometry?: unknown
}

export interface CandidateRow {
  slug: string
  targetId: string
  recordId: string
  name: string
  system: string
  /** A record draws itself; a group draws nothing and lights the records under it. */
  kind: 'record' | 'group'
  includeParts: boolean
  fromHpf: number
  toHpf: number
}

export interface CandidateFile {
  version: 1
  generated: string
  fromHpf: number
  toHpf: number
  candidates: CandidateRow[]
}

/**
 * The slug of a record name: lower case, the apostrophes dropped and every other run of
 * punctuation turned into one hyphen. "Kupffer's vesicle" gives "kupffers-vesicle". The form
 * matches the slug pattern of render-all.ts, so a row can be copied into tissues.json.
 */
export function slugOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** The record's window: `visibleFromHpf` to `modelEndHpf`, or to `endHpf` when there is no model end. */
export function recordWindow(record: RecordInput): { fromHpf: number; toHpf: number } | null {
  const from = record.visibleFromHpf
  const to = record.modelEndHpf ?? record.endHpf
  if (typeof from !== 'number' || !Number.isFinite(from)) return null
  if (typeof to !== 'number' || !Number.isFinite(to)) return null
  return { fromHpf: from, toHpf: to }
}

export interface CandidateOptions {
  fromHpf: number
  toHpf: number
  /** Keep only these systems; null keeps every system. */
  systems?: readonly string[] | null
}

/**
 * One row per record or group whose window meets `[fromHpf, toHpf]`, in the order they arrive.
 * `includeParts` is read from the same array, so a caller that drops a system still gets the
 * flag of the rows it keeps. A group always takes `includeParts: true`, because its parts are
 * the only thing a rule over it can light.
 */
export function buildCandidates(records: readonly RecordInput[], o: CandidateOptions): CandidateRow[] {
  const hasParts = new Set<string>()
  for (const record of records) {
    if (typeof record.uiParent === 'string' && record.uiParent.length > 0) hasParts.add(record.uiParent)
  }
  const rows: CandidateRow[] = []
  for (const record of records) {
    const window = recordWindow(record)
    if (!window) continue
    if (window.fromHpf > o.toHpf || window.toHpf < o.fromHpf) continue
    const system = typeof record.system === 'string' ? record.system : ''
    if (o.systems && !o.systems.includes(system)) continue
    const name = typeof record.name === 'string' && record.name.length > 0 ? record.name : record.id
    const group = record.group === true
    rows.push({
      slug: slugOf(name),
      targetId: record.id,
      recordId: record.id,
      name,
      system,
      kind: group ? 'group' : 'record',
      includeParts: group || hasParts.has(record.id),
      fromHpf: window.fromHpf,
      toHpf: window.toHpf,
    })
  }
  return rows
}

// ---- input and output ---------------------------------------------------------------------------

function isRecord(value: unknown): value is RecordInput {
  return typeof value === 'object' && value !== null && typeof (value as RecordInput).id === 'string'
}

/** Every record and group of src/data/structures/, the groups marked. */
export function readRecords(dir: string): RecordInput[] {
  const records: RecordInput[] = []
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith('.json')) continue
    const parsed: unknown = JSON.parse(readFileSync(join(dir, name), 'utf8'))
    if (!Array.isArray(parsed)) throw new Error(`${join(dir, name)} does not hold an array of records`)
    for (const row of parsed) {
      if (!isRecord(row)) throw new Error(`${join(dir, name)} holds an entry with no id`)
      records.push(name === GROUP_FILE ? { ...row, group: true } : row)
    }
  }
  return records
}

const USAGE = [
  'usage: node scripts/movies/selection/candidates.ts --from 0 --to 48 --out FILE [--system a,b]',
  '       --from, --to  the stage range in hpf; a record whose window meets it becomes a row',
  '       --system      keep only these systems, comma separated',
].join('\n')

function fail(message: string): never {
  console.error(`candidates: ${message}`)
  console.error(USAGE)
  process.exit(2)
}

interface Options {
  fromHpf: number
  toHpf: number
  out: string
  systems: string[] | null
}

export function parseArgs(argv: string[]): Options {
  const raw: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') {
      console.log(USAGE)
      process.exit(0)
    }
    if (!a.startsWith('--')) fail(`unexpected argument ${a}`)
    const value = argv[++i]
    if (value === undefined) fail(`${a} needs a value`)
    raw[a.slice(2)] = value
  }
  const num = (key: string, fallback: number): number => {
    if (raw[key] === undefined) return fallback
    const n = Number(raw[key])
    if (!Number.isFinite(n)) fail(`--${key} must be a number`)
    return n
  }
  const fromHpf = num('from', 0)
  const toHpf = num('to', 48)
  if (!(toHpf > fromHpf)) fail('--to must be above --from')
  if (raw.out === undefined) fail('--out names the file to write')
  return {
    fromHpf,
    toHpf,
    out: resolve(raw.out),
    systems: raw.system === undefined ? null : raw.system.split(',').map((s) => s.trim()).filter(Boolean),
  }
}

function main(argv: string[]): number {
  const o = parseArgs(argv)
  const dir = join(repoRoot, 'src/data/structures')
  if (!existsSync(dir)) fail(`${dir} is missing`)
  const rows = buildCandidates(readRecords(dir), { fromHpf: o.fromHpf, toHpf: o.toHpf, systems: o.systems })
  if (rows.length === 0) fail('no record meets the range')
  const file: CandidateFile = {
    version: 1,
    generated: new Date().toISOString(),
    fromHpf: o.fromHpf,
    toHpf: o.toHpf,
    candidates: rows,
  }
  mkdirSync(dirname(o.out), { recursive: true })
  writeFileSync(o.out, `${JSON.stringify(file, null, 1)}\n`)
  const head = ['slug'.padEnd(34), 'ZFA'.padEnd(13), 'kind  ', 'parts', 'window'.padStart(14), '  system'].join(' ')
  console.log(head)
  for (const row of rows) {
    console.log([
      row.slug.padEnd(34),
      row.targetId.padEnd(13),
      row.kind.padEnd(6),
      (row.includeParts ? 'yes' : 'no').padEnd(5),
      `${row.fromHpf} to ${row.toHpf}`.padStart(14),
      `  ${row.system}`,
    ].join(' '))
  }
  console.log(`candidates: ${rows.length} rows over ${o.fromHpf} to ${o.toHpf} hpf in ${o.out}`)
  return 0
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) process.exit(main(process.argv.slice(2)))
