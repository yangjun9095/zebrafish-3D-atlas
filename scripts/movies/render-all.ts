// Every movie of the tissue list, in EGFP, plus the eight most distinct tissues in a colour map.
//
//   node scripts/movies/render-all.ts [--tissues scripts/movies/tissues.json] [--out DIR]
//        [--palette FILE] [--parallel 2] [--force] [--only slug,slug] [--dry-run]
//        [--from 0] [--to 48] [--seconds 20] [--fps 30] [--width 1920] [--height 1080]
//        [--context 24] [--port 4952] [--dist DIR] [--frames DIR] [--keep-frames]
//        [--credit TEXT] [--crf 18] [--ffmpeg PATH]
//
// It builds the app once, starts one `vite preview`, launches `--parallel` copies of Chrome and
// gives each one page, and renders the job list into `--out`. A movie whose file is already there
// is skipped unless `--force`. After every movie it writes that movie's entry to
// `<out>/.manifest/<movie>.json` and assembles `<out>/manifest.json` from every entry whose movie
// is still on disk, so a run that is killed half way keeps what it finished and several runs
// (one SLURM array task per tissue) never overwrite each other's entries. `--manifest-only`
// assembles the manifest and exits.
//
// The job list is the tissue list in EGFP, then the tissues with the lowest `distinctRank` in the
// palette order. The default palette is the reporter order red, orange, yellow, green, cyan, blue,
// magenta and the eighth; `--palette` takes a JSON array of reporter ids instead. A tissue whose
// rank maps back to EGFP is not rendered twice.
//
// Each movie runs over the `--from` to `--to` span and lights its tissue over that tissue's own
// `fromHpf` to `toHpf` window, clamped into the span, so a heart that appears at 19 hpf lights up
// when it appears instead of from the first frame.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Browser } from '@playwright/test'
import type { ReporterId } from '../../src/core/fluorescence.ts'
import {
  DEFAULT_CREDIT, DEFAULT_OUT_DIR, defaultDist, ensureDist, launchBrowser, movieFileName, parseReporter,
  renderMovie, reporterIds, startPreview, stopPreview,
} from '../render-movie.ts'
import type { MovieOptions, MovieResult, RenderEnv } from '../render-movie.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * The colour map of the eight ranked tissues, in the order red, orange, yellow, green, cyan, blue,
 * magenta and the eighth. The hex values belong to REPORTERS in src/core/fluorescence.ts; this
 * list only names the reporters and their order. They are plain strings here and are validated
 * against REPORTERS at run time, so a build whose reporter table is shorter drops the ids it
 * lacks and renders the rest instead of failing.
 */
export const DEFAULT_PALETTE_IDS: readonly string[] = [
  'mcherry', 'mko2', 'mvenus', 'egfp', 'mturquoise2', 'mtagbfp2', 'irfp670', 'mscarlet',
]

/** The reporter every tissue is rendered in first. */
export const BASE_REPORTER_ID = 'egfp'

export interface Tissue {
  slug: string
  label: string
  targetId: string
  includeParts: boolean
  fromHpf: number
  toHpf: number
  system: string
  /** Rank in the "most distinct tissues" order; 1 is the most distinct. Null or 0 means unranked. */
  distinctRank: number | null
  /** Why the tissue is in the list; the manifest carries it so a viewer knows what to look for. */
  why: string | null
}

export interface MovieJob {
  tissue: Tissue
  reporter: ReporterId
  file: string
}

function bad(where: string, message: string): never {
  throw new Error(`${where}: ${message}`)
}

/** The entry array of a tissue list: the file is either the array itself or `{ version, tissues }`. */
function tissueRows(value: unknown, where: string): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'object' && value !== null) {
    const rows = (value as { tissues?: unknown }).tissues
    if (Array.isArray(rows)) return rows
  }
  bad(where, 'the file must hold an array of tissue entries, or an object with a "tissues" array')
}

/** Reads the tissue list and states which entry is wrong instead of failing inside a render. */
export function parseTissues(value: unknown, where = 'tissues.json'): Tissue[] {
  return tissueRows(value, where).map((raw, i) => {
    const at = `${where}[${i}]`
    if (typeof raw !== 'object' || raw === null) bad(at, 'must be an object')
    const row = raw as Record<string, unknown>
    const str = (key: string): string => {
      const v = row[key]
      if (typeof v !== 'string' || v.length === 0) bad(at, `${key} must be a non-empty string`)
      return v
    }
    const numberAt = (key: string): number => {
      const v = row[key]
      if (typeof v !== 'number' || !Number.isFinite(v)) bad(at, `${key} must be a number`)
      return v
    }
    const slug = str('slug')
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) bad(at, `slug "${slug}" must be lower-case letters, digits and hyphens`)
    const targetId = str('targetId')
    if (!/^ZFA:\d{7}$/.test(targetId)) bad(at, `targetId "${targetId}" must be a ZFA id`)
    const rank = row.distinctRank
    if (rank !== null && rank !== undefined && (typeof rank !== 'number' || !Number.isFinite(rank))) {
      bad(at, 'distinctRank must be a number or null')
    }
    return {
      slug,
      label: str('label'),
      targetId,
      includeParts: row.includeParts !== false,
      fromHpf: numberAt('fromHpf'),
      toHpf: numberAt('toHpf'),
      system: str('system'),
      distinctRank: typeof rank === 'number' ? rank : null,
      why: typeof row.why === 'string' ? row.why : null,
    }
  })
}

/** The reporter id list of a `--palette` file, validated against REPORTERS. */
export function parsePalette(value: unknown, where = 'palette'): ReporterId[] {
  if (!Array.isArray(value)) bad(where, 'the file must hold an array of reporter ids')
  return value.map((raw, i) => {
    if (typeof raw !== 'string') bad(`${where}[${i}]`, 'must be a reporter id string')
    const id = parseReporter(raw)
    if (!id) bad(`${where}[${i}]`, `"${raw}" is not one of ${reporterIds().join(', ')}`)
    return id
  })
}

/** The default palette, with any reporter this build does not carry dropped and named. */
export function defaultPalette(): ReporterId[] {
  const out: ReporterId[] = []
  for (const raw of DEFAULT_PALETTE_IDS) {
    const id = parseReporter(raw)
    if (id) out.push(id)
    else console.warn(`render-all: this build has no reporter "${raw}"; the palette drops it`)
  }
  if (out.length === 0) bad('palette', `none of ${DEFAULT_PALETTE_IDS.join(', ')} is a reporter of this build`)
  return out
}

/** The reporter every tissue is rendered in first. */
export function baseReporter(): ReporterId {
  const id = parseReporter(BASE_REPORTER_ID)
  if (!id) bad('base reporter', `this build has no reporter "${BASE_REPORTER_ID}"`)
  return id
}

/** The tissues with the lowest positive `distinctRank`, at most `count` of them. */
export function rankedTissues(tissues: readonly Tissue[], count: number): Tissue[] {
  return tissues
    .filter((t) => typeof t.distinctRank === 'number' && t.distinctRank > 0)
    .sort((a, b) => (a.distinctRank ?? 0) - (b.distinctRank ?? 0))
    .slice(0, count)
}

/** Every tissue in EGFP, then the ranked tissues in the palette order, with no repeated output. */
export function plan(tissues: readonly Tissue[], palette: readonly ReporterId[] = defaultPalette()): MovieJob[] {
  const jobs: MovieJob[] = []
  const seen = new Set<string>()
  const base = baseReporter()
  const add = (tissue: Tissue, reporter: ReporterId): void => {
    const file = movieFileName(tissue.slug, reporter)
    if (seen.has(file)) return
    seen.add(file)
    jobs.push({ tissue, reporter, file })
  }
  for (const tissue of tissues) add(tissue, base)
  rankedTissues(tissues, palette.length).forEach((tissue, i) => add(tissue, palette[i]))
  return jobs
}

/**
 * The jobs of the requested slugs, or every job when `only` is null. The plan is made over the
 * whole list first so the colour of a ranked tissue does not depend on `--only`: a plan over a
 * filtered list gave every ranked tissue the first palette colour when a SLURM array task asked
 * for one tissue at a time.
 */
export function selectJobs(
  tissues: readonly Tissue[],
  palette: readonly ReporterId[],
  only: readonly string[] | null,
): MovieJob[] {
  const all = plan(tissues, palette)
  return only ? all.filter((job) => only.includes(job.tissue.slug)) : all
}

/** The lit window of a job: the tissue's own window, held inside the movie span. */
export function litWindow(tissue: Tissue, fromHpf: number, toHpf: number): { litFromHpf: number; litToHpf: number } {
  const litFromHpf = Math.min(Math.max(tissue.fromHpf, fromHpf), toHpf)
  const litToHpf = Math.min(Math.max(tissue.toHpf, litFromHpf), toHpf)
  return { litFromHpf, litToHpf }
}

// ---- manifest -----------------------------------------------------------------------------------

export interface Manifest {
  generated: string
  movies: ManifestEntry[]
}

export interface ManifestEntry {
  movie: string
  tissue: string
  label: string
  targetId: string
  system: string
  why: string | null
  reporter: ReporterId
  reporterName: string
  frames: number
  fps: number
  seconds: number
  width: number
  height: number
  fromHpf: number
  toHpf: number
  litFromHpf: number
  litToHpf: number
  secondsPerFrame: number
  bytes: number
  sha256: string
}

export function manifestEntry(job: MovieJob, result: MovieResult): ManifestEntry {
  return {
    movie: job.file,
    tissue: job.tissue.slug,
    label: job.tissue.label,
    targetId: job.tissue.targetId,
    system: job.tissue.system,
    why: job.tissue.why,
    reporter: result.reporter,
    reporterName: result.reporterName,
    frames: result.frames,
    fps: result.fps,
    seconds: result.seconds,
    width: result.width,
    height: result.height,
    fromHpf: result.fromHpf,
    toHpf: result.toHpf,
    litFromHpf: result.litFromHpf,
    litToHpf: result.litToHpf,
    secondsPerFrame: result.secondsPerFrame,
    bytes: result.bytes,
    sha256: result.sha256,
  }
}

/** Merges new entries over the entries of an earlier run, keyed on the movie file name. */
export function mergeManifest(previous: readonly ManifestEntry[], next: readonly ManifestEntry[]): ManifestEntry[] {
  const byName = new Map<string, ManifestEntry>()
  for (const entry of [...previous, ...next]) byName.set(entry.movie, entry)
  return [...byName.values()].sort((a, b) => a.movie.localeCompare(b.movie))
}

/** The directory of one-entry files the manifest is assembled from. */
export const ENTRY_DIR = '.manifest'

/**
 * The entries of the manifest: every entry file under `<out>/.manifest/`, over the entries of the
 * previous `manifest.json` (from a run before the entry files existed), keeping only entries whose
 * movie is on disk. Each render writes its own entry file, so parallel runs never lose an entry.
 */
export function assembleManifest(
  previous: readonly ManifestEntry[],
  entryFiles: readonly ManifestEntry[],
  present: (movie: string) => boolean,
): ManifestEntry[] {
  return mergeManifest(previous, entryFiles).filter((entry) => present(entry.movie))
}

function isEntry(value: unknown): value is ManifestEntry {
  return typeof value === 'object' && value !== null && typeof (value as ManifestEntry).movie === 'string'
}

function readManifest(file: string): ManifestEntry[] {
  if (!existsSync(file)) return []
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<Manifest>
    return Array.isArray(parsed.movies) ? parsed.movies.filter(isEntry) : []
  } catch {
    console.warn(`render-all: ${file} is not readable JSON; it will be replaced`)
    return []
  }
}

function readEntryFiles(out: string): ManifestEntry[] {
  const dir = join(out, ENTRY_DIR)
  if (!existsSync(dir)) return []
  const entries: ManifestEntry[] = []
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue
    try {
      const parsed: unknown = JSON.parse(readFileSync(join(dir, name), 'utf8'))
      if (isEntry(parsed)) entries.push(parsed)
    } catch {
      console.warn(`render-all: ${join(dir, name)} is not readable JSON; it is ignored`)
    }
  }
  return entries
}

function writeEntryFile(out: string, entry: ManifestEntry): void {
  const dir = join(out, ENTRY_DIR)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${entry.movie}.json`), `${JSON.stringify(entry, null, 2)}\n`)
}

/** Rebuilds `<out>/manifest.json` from the entry files and returns the entries it holds. */
function writeManifest(out: string): ManifestEntry[] {
  const file = join(out, 'manifest.json')
  const entries = assembleManifest(readManifest(file), readEntryFiles(out), (movie) => existsSync(join(out, movie)))
  const manifest: Manifest = { generated: new Date().toISOString(), movies: entries }
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
  return entries
}

// ---- command line -------------------------------------------------------------------------------

interface AllOptions {
  tissues: string
  palette: string | null
  out: string
  parallel: number
  force: boolean
  only: string[] | null
  dryRun: boolean
  manifestOnly: boolean
  from: number
  to: number
  seconds: number
  fps: number
  width: number
  height: number
  context: number
  port: number
  dist: string
  framesDir: string | null
  keepFrames: boolean
  credit: string
  crf: number
  ffmpeg: string
}

const USAGE = [
  'usage: node scripts/movies/render-all.ts [--tissues scripts/movies/tissues.json] [--out DIR]',
  '       [--palette FILE] [--parallel 2] [--force] [--only slug,slug] [--dry-run] [--manifest-only]',
  '       [--from 0] [--to 48] [--seconds 20] [--fps 30] [--width 1920] [--height 1080]',
  '       [--context 24] [--port 4952] [--dist DIR] [--frames DIR] [--keep-frames]',
  '       [--credit TEXT] [--crf 18] [--ffmpeg PATH]',
].join('\n')

function fail(message: string): never {
  console.error(`render-all: ${message}`)
  console.error(USAGE)
  process.exit(2)
}

function parseArgs(argv: string[]): AllOptions {
  const raw: Record<string, string | boolean> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') {
      console.log(USAGE)
      process.exit(0)
    }
    if (!a.startsWith('--')) fail(`unexpected argument ${a}`)
    const key = a.slice(2)
    if (key === 'force' || key === 'dry-run' || key === 'keep-frames' || key === 'manifest-only') raw[key] = true
    else {
      const value = argv[++i]
      if (value === undefined) fail(`${a} needs a value`)
      raw[key] = value
    }
  }
  const text = (key: string, fallback: string): string => (typeof raw[key] === 'string' ? (raw[key] as string) : fallback)
  const num = (key: string, fallback: number): number => {
    if (typeof raw[key] !== 'string') return fallback
    const n = Number(raw[key])
    if (!Number.isFinite(n)) fail(`--${key} must be a number`)
    return n
  }
  const parallel = num('parallel', 2)
  if (!(Number.isInteger(parallel) && parallel >= 1 && parallel <= 16)) fail('--parallel must be an integer in 1 to 16')
  const from = num('from', 0)
  const to = num('to', 48)
  if (!(to > from)) fail('--to must be above --from')
  return {
    tissues: resolve(text('tissues', join(repoRoot, 'scripts/movies/tissues.json'))),
    palette: typeof raw.palette === 'string' ? resolve(raw.palette) : null,
    out: resolve(text('out', DEFAULT_OUT_DIR)),
    parallel,
    force: raw.force === true,
    only: typeof raw.only === 'string' ? raw.only.split(',').map((s) => s.trim()).filter(Boolean) : null,
    dryRun: raw['dry-run'] === true,
    manifestOnly: raw['manifest-only'] === true,
    from,
    to,
    seconds: num('seconds', 20),
    fps: num('fps', 30),
    width: num('width', 1920),
    height: num('height', 1080),
    context: num('context', 24),
    port: num('port', 4952),
    dist: resolve(text('dist', defaultDist())),
    framesDir: typeof raw.frames === 'string' ? resolve(raw.frames) : null,
    keepFrames: raw['keep-frames'] === true,
    credit: text('credit', DEFAULT_CREDIT),
    crf: num('crf', 18),
    ffmpeg: text('ffmpeg', process.env.FFMPEG ?? 'ffmpeg'),
  }
}

function movieOptionsFor(job: MovieJob, o: AllOptions): MovieOptions {
  const { litFromHpf, litToHpf } = litWindow(job.tissue, o.from, o.to)
  return {
    targetId: job.tissue.targetId,
    slug: job.tissue.slug,
    reporter: job.reporter,
    includeParts: job.tissue.includeParts,
    fromHpf: o.from,
    toHpf: o.to,
    litFromHpf,
    litToHpf,
    seconds: o.seconds,
    fps: o.fps,
    width: o.width,
    height: o.height,
    context: o.context,
    out: o.out,
    framesDir: o.framesDir === null ? null : join(o.framesDir, job.file.replace(/\.mp4$/, '')),
    keepFrames: o.keepFrames,
    credit: o.credit,
    crf: o.crf,
    ffmpeg: o.ffmpeg,
    port: o.port,
    dist: o.dist,
    wildtype: false,
    invert: false,
    name: null,
  }
}

async function main(): Promise<number> {
  const o = parseArgs(process.argv.slice(2))
  if (!existsSync(o.tissues)) fail(`the tissue list ${o.tissues} is missing`)
  const tissues = parseTissues(JSON.parse(readFileSync(o.tissues, 'utf8')), o.tissues)
  const palette = o.palette ? parsePalette(JSON.parse(readFileSync(o.palette, 'utf8')), o.palette) : defaultPalette()
  mkdirSync(o.out, { recursive: true })
  if (o.manifestOnly) {
    const entries = writeManifest(o.out)
    console.log(`render-all: manifest ${join(o.out, 'manifest.json')} holds ${entries.length} movies`)
    return 0
  }
  const all = selectJobs(tissues, palette, o.only)
  if (all.length === 0) fail('no tissue matched --only')
  const jobs = o.force ? all : all.filter((job) => !existsSync(join(o.out, job.file)))
  console.log(`render-all: ${all.length} movies planned, ${all.length - jobs.length} already in ${o.out}, ${jobs.length} to render`)
  for (const job of all) {
    const state = jobs.includes(job) ? 'render' : 'skip'
    console.log(`  ${state.padEnd(6)} ${job.file}  ${job.tissue.label} (${job.tissue.targetId})`)
  }
  if (o.dryRun || jobs.length === 0) return 0

  ensureDist(o.dist)
  const preview = await startPreview(o.dist, o.port)
  const browsers: Browser[] = []
  const failures: string[] = []
  let done = 0
  let next = 0
  try {
    const slots = Math.min(o.parallel, jobs.length)
    for (let i = 0; i < slots; i++) browsers.push(await launchBrowser())
    const env: RenderEnv[] = browsers.map((browser) => ({ browser, baseURL: preview.baseURL }))
    await Promise.all(env.map(async (slot) => {
      for (;;) {
        const index = next++
        if (index >= jobs.length) return
        const job = jobs[index]
        try {
          const result = await renderMovie(movieOptionsFor(job, o), slot)
          writeEntryFile(o.out, manifestEntry(job, result))
          writeManifest(o.out)
          done++
          console.log(`render-all: ${done}/${jobs.length} ${job.file}, ${(result.bytes / 1e6).toFixed(2)} MB, ${result.secondsPerFrame.toFixed(2)} s/frame`)
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : String(e)
          failures.push(`${job.file}: ${message}`)
          console.error(`render-all: ${job.file} failed: ${message}`)
        }
      }
    }))
  } finally {
    for (const browser of browsers) await browser.close()
    await stopPreview(preview.child)
  }
  const entries = writeManifest(o.out)
  console.log(`render-all: ${done} rendered, ${failures.length} failed, manifest ${join(o.out, 'manifest.json')} holds ${entries.length} movies`)
  for (const line of failures) console.error(`  ${line}`)
  return failures.length > 0 ? 1 : 0
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(`render-all: ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    },
  )
}
