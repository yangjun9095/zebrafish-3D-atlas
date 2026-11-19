// The README of the movies folder, from the manifest and the files on disk.
//
//   node scripts/movies/write-readme.ts --out DIR [--date YYYY-MM-DD]
//
// It reads `<out>/manifest.json` and every .mp4 in `<out>`, and writes `<out>/README.md`: the
// properties table, series 1 in EGFP, series 2 in the palette order of render-all.ts, the
// wild-type files, how to render them again, and the licence note. `--date` is the date the batch
// was rendered and defaults to today.
//
// The file counts, the sizes, the tissue at the green slot and the list of other files come from
// the directory, the manifest and scripts/movies/tissues.json, so the README follows a batch that
// rendered more or fewer movies. The prose around the tables is fixed text about the 0 to 48 hpf
// series and the two wild-type looks; read it once when the batch changes shape.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_OUT_DIR } from '../render-movie.ts'
import { BASE_REPORTER_ID, DEFAULT_PALETTE_IDS, parseTissues, rankedTissues } from './render-all.ts'
import type { ManifestEntry, Tissue } from './render-all.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** Megabytes to two places, the way the tables carry a size. */
export function mb(bytes: number): string {
  return (bytes / 1e6).toFixed(2)
}

/** An hour with no trailing zeros: 0, 4.66, 10.33, 48. */
export function fmtHpf(value: number): string {
  return String(Number(value))
}

export interface MovieFile {
  file: string
  bytes: number
  entry?: ManifestEntry
}

/** One row of a movie table. A file the manifest does not carry keeps its size and no anatomy. */
export function movieRow(row: MovieFile): string {
  const e = row.entry
  if (!e) return `| \`${row.file}\` | | | | | ${mb(row.bytes)} |`
  return `| \`${row.file}\` | ${e.label} | ${e.targetId} | ${e.reporterName} | `
    + `${fmtHpf(e.litFromHpf)} to ${fmtHpf(e.litToHpf)} | ${mb(row.bytes)} |`
}

/** The movie table: the header, the rule and one row per file. */
export function movieTable(rows: readonly MovieFile[]): string[] {
  return [
    '| File | Tissue | ZFA id | Reporter | Lit window (hpf) | MB |',
    '|---|---|---|---|---|---|',
    ...rows.map(movieRow),
  ]
}

/** The look of a wild-type file, read from its name. */
export function wildtypeLook(file: string): string {
  return file.includes('bright') ? 'inverted frames, bright field' : 'frames as rendered, dark field'
}

export interface Series {
  egfp: MovieFile[]
  colour: MovieFile[]
  wildtype: MovieFile[]
  other: MovieFile[]
}

/** What the README says beside the tables; every field is read from the folder or the tissue list. */
export interface ReadmeFacts {
  /** The date the batch was rendered. */
  date: string
  /** The label of the tissue whose colour-series slot is EGFP, or null when no rank maps to EGFP. */
  greenSlot: string | null
  /** The files and folders next to the movies that the README should list. */
  extras: readonly string[]
}

/** The label of the ranked tissue whose palette slot is the base reporter, when there is one. */
export function greenSlotLabel(tissues: readonly Tissue[], palette: readonly string[] = DEFAULT_PALETTE_IDS): string | null {
  const slot = palette.indexOf(BASE_REPORTER_ID)
  if (slot < 0) return null
  return rankedTissues(tissues, palette.length)[slot]?.label ?? null
}

/** The extras that are folders; the table shows them with a trailing slash. */
export const EXTRA_DIRS: ReadonlySet<string> = new Set(['logs', 'test-renders', 'superseded'])

/** The description of a file or folder next to the movies, for the "Other files here" table, in table order. */
export const EXTRA_DESCRIPTIONS: Readonly<Record<string, string>> = {
  'colour-series-contact-sheet.png': 'one 47 hpf frame of each colour movie, labelled, tiled four to a row',
  'manifest.json': 'one entry per movie of series 1 and 2: ZFA id, lit window, seconds per frame, bytes, sha256',
  SHA256SUMS: 'sha256 of every movie file, for `sha256sum -c SHA256SUMS` after a copy',
  logs: 'the SLURM logs of this batch',
  'test-renders': 'short test movies from the pipeline check',
  superseded: 'movies of an earlier run that the files above replace; safe to delete',
}

/**
 * The files split into the series the README carries: EGFP, the colour series in palette order,
 * the wild-type pair, and anything else.
 */
export function splitSeries(
  files: readonly MovieFile[],
  palette: readonly string[] = DEFAULT_PALETTE_IDS,
): Series {
  const egfp = files.filter((row) => row.file.endsWith('_EGFP.mp4'))
  const colour = files
    .filter((row) => row.entry && !row.file.endsWith('_EGFP.mp4'))
    .sort((a, b) => palette.indexOf(a.entry?.reporter ?? '') - palette.indexOf(b.entry?.reporter ?? ''))
  const wildtype = files.filter((row) => row.file.startsWith('wildtype_'))
  const named = new Set([...egfp, ...colour, ...wildtype].map((row) => row.file))
  return { egfp, colour, wildtype, other: files.filter((row) => !named.has(row.file)) }
}

/** The whole README, one line per element. */
export function readmeLines(series: Series, facts: ReadmeFacts): string[] {
  const { egfp, colour, wildtype, other } = series
  const { date, greenSlot } = facts
  const setSize = colour.length + (greenSlot ? 1 : 0)
  const lines: string[] = []
  lines.push('# Zebrafish 3D atlas movies, 0 to 48 hpf\n')
  lines.push(`Rendered on ${date} from the zebrafish-3D-atlas viewer (github.com/yangjun9095/zebrafish-3D-atlas),`)
  lines.push('one movie per file. Every movie is the schematic model of the atlas, not imaging data: the geometry is')
  lines.push('procedural, the anatomy names and ids come from ZFIN (ZFA, CC BY 4.0), and the reporter colour marks where')
  lines.push('the user asked a tissue to be lit, not where a real transgene expresses. The credit line in the bottom left')
  lines.push('of every frame says so.\n')
  lines.push('| Property | Value |')
  lines.push('|---|---|')
  lines.push('| Size | 1920 by 1080, H.264 (libx264, CRF 18, yuv420p), no audio |')
  lines.push('| Length | 20 s, 30 frames a second, 600 frames |')
  lines.push('| Time | 0 to 48 hpf, linear, one frame every 0.08 h |')
  lines.push('| View | lateral, camera follows the growth, no panels or labels |')
  lines.push(`| Files | ${egfp.length} EGFP, ${colour.length} colour series, ${wildtype.length} wild-type |\n`)
  lines.push('## Series 1: one tissue in EGFP\n')
  lines.push(`${egfp.length} tissues, each lit in EGFP (green, 507 nm) over the window in which the atlas models it. Before`)
  lines.push('its window the tissue is absent and only the faint fish is drawn.\n')
  lines.push(...movieTable(egfp))
  lines.push('')
  lines.push(`## Series 2: the ${setSize} most distinct tissues, one colour each\n`)
  lines.push(`The ${setSize} tissues that overlap least in a lateral frame, each in its own reporter so they can sit`)
  lines.push('side by side: red, orange, yellow, green, cyan, blue, magenta (near-infrared pseudocolour) and')
  lines.push('orange-red.'
    + (greenSlot ? ` The green slot is the ${greenSlot.toLowerCase()}, whose EGFP movie is in series 1 and is not` : ''))
  if (greenSlot) lines.push('repeated here.')
  lines.push('The ranking is documented in `docs/research/12-movie-tissue-selection.md` of the repository.\n')
  lines.push(...movieTable(colour))
  lines.push('')
  lines.push('## Wild type\n')
  lines.push('The same growth with no reporter. The viewer has no bright-field mode, so the preview draws every')
  lines.push('structure as translucent grey at full context, and the bright-field file inverts the frames: an off-white')
  lines.push('field and a sepia-grey embryo, the look of a transmitted-light image. The dark-field file is the same')
  lines.push('frames as rendered, a grey embryo on black, to sit next to the reporter movies.\n')
  lines.push('| File | Look | MB |')
  lines.push('|---|---|---|')
  for (const row of wildtype) lines.push(`| \`${row.file}\` | ${wildtypeLook(row.file)} | ${mb(row.bytes)} |`)
  lines.push('')
  if (other.length > 0) {
    lines.push('## Other files\n')
    for (const row of other) lines.push(`- \`${row.file}\``)
    lines.push('')
  }
  lines.push('## Regenerate\n')
  lines.push('From a checkout of the repository on the cluster:\n')
  lines.push('```sh')
  lines.push('sbatch scripts/movies/render-array.sbatch      # series 1 and 2, one array task per tissue')
  lines.push('sbatch scripts/movies/render-wildtype.sbatch   # the two wild-type files')
  lines.push('```\n')
  lines.push('The wild-type movie draws every structure and ran at 8 to 34 s per frame on the `cpu` nodes against')
  lines.push('1.2 to 3 s on the login node, so run that one on the login node: `bash scripts/movies/render-wildtype.sbatch`')
  lines.push(`(18 minutes on ${date}).\n`)
  lines.push('`scripts/movies/check-movies.sh` in the repository probes every file here and rewrites `SHA256SUMS`.')
  lines.push('`scripts/movies/README.md` describes the pipeline, the options and the timings.\n')
  const extras = Object.keys(EXTRA_DESCRIPTIONS).filter((name) => facts.extras.includes(name))
  if (extras.length > 0) {
    lines.push('## Other files here\n')
    lines.push('| File or folder | What it is |')
    lines.push('|---|---|')
    for (const name of extras) {
      const shown = EXTRA_DIRS.has(name) ? `${name}/` : name
      lines.push(`| \`${shown}\` | ${EXTRA_DESCRIPTIONS[name]} |`)
    }
    lines.push('')
  }
  lines.push('## Use\n')
  lines.push('The movies may be shown in talks and shared. Please keep the credit line in the frame, or state next to')
  lines.push('the movie that it is a schematic model from the zebrafish 3D atlas with anatomy from ZFIN (CC BY 4.0)')
  lines.push('and that no imaging data was used.')
  return lines
}

// ---- command line -------------------------------------------------------------------------------

interface Options {
  out: string
  date: string
}

const USAGE = 'usage: node scripts/movies/write-readme.ts --out DIR [--date YYYY-MM-DD]'

function fail(message: string): never {
  console.error(`write-readme: ${message}`)
  console.error(USAGE)
  process.exit(2)
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
  const date = raw.date ?? new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('--date must read YYYY-MM-DD')
  return { out: resolve(raw.out ?? DEFAULT_OUT_DIR), date }
}

function main(argv: string[]): number {
  const o = parseArgs(argv)
  const manifest = join(o.out, 'manifest.json')
  if (!existsSync(manifest)) fail(`${manifest} is missing; render-all.ts writes it`)
  const parsed = JSON.parse(readFileSync(manifest, 'utf8')) as { movies?: ManifestEntry[] }
  const entries = new Map((parsed.movies ?? []).map((entry) => [entry.movie, entry]))
  const files: MovieFile[] = readdirSync(o.out)
    .filter((name) => name.endsWith('.mp4'))
    .sort()
    .map((file) => ({ file, bytes: statSync(join(o.out, file)).size, entry: entries.get(file) }))
  if (files.length === 0) fail(`${o.out} holds no .mp4 file`)
  const series = splitSeries(files)
  const tissueFile = join(repoRoot, 'scripts/movies/tissues.json')
  const tissues = existsSync(tissueFile) ? parseTissues(JSON.parse(readFileSync(tissueFile, 'utf8')), tissueFile) : []
  const extras = readdirSync(o.out).filter((name) => name in EXTRA_DESCRIPTIONS)
  const readme = join(o.out, 'README.md')
  writeFileSync(readme, `${readmeLines(series, { date: o.date, greenSlot: greenSlotLabel(tissues), extras }).join('\n')}\n`)
  console.log(`write-readme: ${readme}, ${series.egfp.length} EGFP, ${series.colour.length} colour, `
    + `${series.wildtype.length} wild-type, ${series.other.length} other`)
  return 0
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) process.exit(main(process.argv.slice(2)))
