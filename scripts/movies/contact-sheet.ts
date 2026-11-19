// One frame of each colour-series movie, tiled and labelled.
//
//   node scripts/movies/contact-sheet.ts --out DIR [--at 19.6]
//        [--file colour-series-contact-sheet.png] [--movies a.mp4,b.mp4]
//
// Without `--movies` it reads `<out>/manifest.json` and takes the colour series: every entry
// whose reporter is not EGFP, in the palette order of render-all.ts, and at the EGFP slot of that
// order the EGFP movie of the tissue whose `distinctRank` maps to it. That tissue is rendered
// once, in series 1, so its colour-series panel is its EGFP file.
//
// Each panel is one frame at `--at` seconds, scaled to 960 wide and labelled
// "<label>, <reporterName>". The panels are tiled four to a row with the xstack filter, so eight
// 1920 by 1080 movies give one 3840 by 1080 sheet.
//
// ffmpeg comes from $FFMPEG, else the static 7.0 build under /hpc/apps, else the path. That build
// carries xstack but no drawtext, so the labels are drawn by the first ffmpeg that has drawtext,
// /usr/bin/ffmpeg on the login node. With no such build the sheet is tiled without labels and the
// last line says so.
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_OUT_DIR } from '../render-movie.ts'
import { DEFAULT_PALETTE_IDS, BASE_REPORTER_ID, parseTissues, rankedTissues } from './render-all.ts'
import type { ManifestEntry, Tissue } from './render-all.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** The static build that runs on every node. It has xstack and no drawtext. */
export const STATIC_FFMPEG = '/hpc/apps/ffmpeg/7.0/bin/ffmpeg'
/** The font the labels are drawn in, when it is installed. */
export const LABEL_FONT = '/usr/share/fonts/dejavu/DejaVuSans.ttf'
/** Panels a row, and the width each panel is scaled to. */
export const PANELS_PER_ROW = 4
export const PANEL_WIDTH = 960

export interface SheetPanel {
  movie: string
  label: string
}

/**
 * The colour series in palette order, with the EGFP slot filled by the ranked tissue that maps to
 * it. An entry the manifest lacks is left out, so a half-finished batch still makes a sheet.
 */
export function colourSeriesPanels(
  entries: readonly ManifestEntry[],
  tissues: readonly Tissue[],
  palette: readonly string[] = DEFAULT_PALETTE_IDS,
): SheetPanel[] {
  const ranked = rankedTissues(tissues, palette.length)
  const panels: SheetPanel[] = []
  palette.forEach((reporter, slot) => {
    const entry = reporter === BASE_REPORTER_ID
      ? entries.find((e) => e.reporter === reporter && e.tissue === ranked[slot]?.slug)
      : entries.find((e) => e.reporter === reporter)
    if (!entry) return
    panels.push({ movie: entry.movie, label: `${entry.label}, ${entry.reporterName}` })
  })
  return panels
}

/** The xstack layout of `count` panels, `perRow` to a row, in the cell form ffmpeg reads. */
export function xstackLayout(count: number, perRow: number = PANELS_PER_ROW): string {
  const cells: string[] = []
  for (let i = 0; i < count; i++) {
    const col = i % perRow
    const row = Math.floor(i / perRow)
    const x = col === 0 ? '0' : Array.from({ length: col }, (_, k) => `w${k}`).join('+')
    const y = row === 0 ? '0' : Array.from({ length: row }, (_, k) => `h${k * perRow}`).join('+')
    cells.push(`${x}_${y}`)
  }
  return cells.join('|')
}

/** A label inside a filter graph: the backslashes and the quotes are escaped. */
export function drawtextEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")
}

/** The filter graph: one scale and one label per panel, then the tile. */
export function sheetFilter(panels: readonly SheetPanel[], font: string | null): string {
  const parts = panels.map((panel, i) => {
    const label = font
      ? `,drawtext=fontfile=${font}:text='${drawtextEscape(panel.label)}':fontcolor=white:fontsize=30:x=24:y=24`
      : ''
    return `[${i}:v]scale=${PANEL_WIDTH}:-1${label}[t${i}];`
  })
  const inputs = panels.map((_, i) => `[t${i}]`).join('')
  return `${parts.join('')}${inputs}xstack=inputs=${panels.length}:layout=${xstackLayout(panels.length)}`
}

// ---- ffmpeg -------------------------------------------------------------------------------------

function ffmpegPath(): string {
  if (process.env.FFMPEG) return process.env.FFMPEG
  return existsSync(STATIC_FFMPEG) ? STATIC_FFMPEG : 'ffmpeg'
}

/** Whether this ffmpeg carries the drawtext filter. */
export function hasDrawtext(ffmpeg: string): boolean {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-filters'], { encoding: 'utf8' })
  return r.status === 0 && typeof r.stdout === 'string' && / drawtext /.test(r.stdout)
}

function run(ffmpeg: string, args: string[]): void {
  const r = spawnSync(ffmpeg, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  if (r.error) throw new Error(`${ffmpeg} did not run: ${r.error.message}`)
  if (r.status !== 0) throw new Error(`${ffmpeg} exited with ${r.status}\n${r.stderr ?? ''}`)
}

// ---- command line -------------------------------------------------------------------------------

interface Options {
  out: string
  at: number
  file: string
  movies: string[] | null
}

const USAGE = [
  'usage: node scripts/movies/contact-sheet.ts --out DIR [--at 19.6]',
  '       [--file colour-series-contact-sheet.png] [--movies a.mp4,b.mp4]',
].join('\n')

function fail(message: string): never {
  console.error(`contact-sheet: ${message}`)
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
  const at = raw.at === undefined ? 19.6 : Number(raw.at)
  if (!(Number.isFinite(at) && at >= 0)) fail('--at must be a number of seconds')
  const file = raw.file ?? 'colour-series-contact-sheet.png'
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.png$/.test(file)) fail('--file must be a plain file name that ends in .png')
  return {
    out: resolve(raw.out ?? DEFAULT_OUT_DIR),
    at,
    file,
    movies: raw.movies === undefined ? null : raw.movies.split(',').map((s) => s.trim()).filter(Boolean),
  }
}

function readEntries(out: string): ManifestEntry[] {
  const file = join(out, 'manifest.json')
  if (!existsSync(file)) fail(`${file} is missing; render-all.ts writes it`)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as { movies?: ManifestEntry[] }
  return Array.isArray(parsed.movies) ? parsed.movies : []
}

function panelsOf(o: Options): SheetPanel[] {
  const entries = readEntries(o.out)
  if (o.movies) {
    return o.movies.map((movie) => {
      const entry = entries.find((e) => e.movie === movie)
      return { movie, label: entry ? `${entry.label}, ${entry.reporterName}` : movie.replace(/\.mp4$/, '') }
    })
  }
  const tissues = parseTissues(
    JSON.parse(readFileSync(join(repoRoot, 'scripts/movies/tissues.json'), 'utf8')),
    'tissues.json',
  )
  return colourSeriesPanels(entries, tissues)
}

function main(argv: string[]): number {
  const o = parseArgs(argv)
  const panels = panelsOf(o)
  if (panels.length === 0) fail('no colour-series movie is in the manifest')
  for (const panel of panels) {
    if (!existsSync(join(o.out, panel.movie))) fail(`${join(o.out, panel.movie)} is missing`)
  }
  const ffmpeg = ffmpegPath()
  const labeller = [ffmpeg, '/usr/bin/ffmpeg'].find(hasDrawtext) ?? null
  const font = labeller !== null && existsSync(LABEL_FONT) ? LABEL_FONT : null
  const frames = mkdtempSync(join(tmpdir(), 'atlas-sheet-'))
  try {
    const inputs: string[] = []
    panels.forEach((panel, i) => {
      const png = join(frames, `panel-${String(i).padStart(2, '0')}.png`)
      run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(o.at), '-i', join(o.out, panel.movie), '-frames:v', '1', png])
      inputs.push('-i', png)
    })
    const sheet = join(o.out, o.file)
    run(font ? (labeller ?? ffmpeg) : ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', sheetFilter(panels, font), sheet,
    ])
    console.log(`contact-sheet: ${panels.length} panels at ${o.at} s in ${sheet}`)
    for (const panel of panels) console.log(`  ${panel.movie}  ${panel.label}`)
    if (!font) console.log('contact-sheet: no ffmpeg with drawtext and no font, so the panels carry no label')
    return 0
  } finally {
    rmSync(frames, { recursive: true, force: true })
  }
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) process.exit(main(process.argv.slice(2)))
