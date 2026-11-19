// One frame per candidate per hour, through the reporter preview, for the tissue selection.
//
//   node scripts/movies/selection/capture.ts --candidates FILE --out DIR
//        [--only slug,slug] [--view lat] [--hours 3,6,7,9,12,16,18,24,27,36,48]
//        [--recheck 0,3,6] [--port 4971] [--dist DIR] [--base URL]
//
// Without `--base` it builds the app into `--dist` and serves it with `vite preview`, the way
// scripts/render-movie.ts does, and never the repository's own dist/. With `--base` it uses a
// server that is already up.
//
// It opens the page once per hour at `?lab=1&embed=1&theme=dark&v=<view>&t=<hour>`, waits for the
// ready marker, then writes one EGFP rule per candidate through
// `window.__atlasDebug.state().setFluorescence` and screenshots at 1600 by 900. Writing the rule
// costs one round trip and a reload costs a full rebuild, so one page load serves every candidate
// of that hour. A control run of 12 frames through the `fp` token of the URL gave the same lit
// areas (docs/research/12-movie-tissue-selection.md, section 2).
//
// Each candidate is shot at up to three hours of the grid, inside its own window, preferring 24
// and 48. A candidate that lights no handle at its first hour is shot again near its onset, which
// tells a tissue that appears later from one that never draws.
//
// `<out>/capture.json` holds one row per frame: the slug, the ZFA id, the hour, the lit handles
// and the file. scripts/movies/selection/measure.py reads it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Browser, Page } from '@playwright/test'
import { REPORTERS } from '../../../src/core/fluorescence.ts'
import type { FluorescenceConfig, ReporterId } from '../../../src/core/fluorescence.ts'
import type { AtlasStore } from '../../../src/state/store.ts'
import { ensureDist, fluorescenceConfigFor, launchBrowser, startPreview, stopPreview } from '../../render-movie.ts'
import type { Preview } from '../../render-movie.ts'
import { VIEWPORT, waitForReady } from '../../screenshot.ts'
import type { CandidateRow } from './candidates.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

/** The reporter every candidate is lit in: one colour keeps the pixel test one threshold. */
export const CAPTURE_REPORTER: ReporterId = 'egfp'
/** The fish context of the preview, the app default. */
export const CAPTURE_CONTEXT = 24
/** The hours a candidate can be shot at. */
export const DEFAULT_HOUR_GRID: readonly number[] = [3, 6, 7, 9, 12, 16, 18, 24, 27, 36, 48]
/** The hours the sweep keeps whenever they lie inside a candidate's window. */
export const PREFERRED_HOURS: readonly number[] = [24, 48]
/** Hours after the onset a dark candidate is shot again at. */
export const RECHECK_OFFSETS: readonly number[] = [0, 3, 6]
/** Wait after the ready marker, for the first paint of the hour. */
export const PAGE_SETTLE_MS = 800
/** Wait after a rule is written, for the visual pass that lights the target. */
export const RULE_SETTLE_MS = 700
/** Longest wait for the ready marker of one hour. */
export const READY_TIMEOUT_MS = 90_000

// ---- pure helpers ------------------------------------------------------------------------------

export interface CaptureRow {
  slug: string
  targetId: string
  includeParts: boolean
  fromHpf: number
  t: number
  view: string
  ready: boolean
  litCount: number
  lit: { id: string; em: number; op: number }[]
  file: string
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * The hours one candidate is shot at: the grid hours inside its window, keeping 24 and 48 first,
 * then its own first hour, and a middle hour when that leaves fewer than three.
 */
export function pickHours(
  fromHpf: number,
  toHpf: number,
  grid: readonly number[] = DEFAULT_HOUR_GRID,
  rangeEnd = 48,
): number[] {
  const end = Math.min(toHpf, rangeEnd)
  const inside = grid.filter((t) => t >= fromHpf && t <= end)
  if (inside.length === 0) return []
  const out: number[] = []
  for (const hour of PREFERRED_HOURS) if (inside.includes(hour)) out.push(hour)
  const first = inside[0]
  if (!out.includes(first)) out.unshift(first)
  if (out.length < 3) {
    const mid = inside[Math.floor(inside.length / 2)]
    if (!out.includes(mid)) out.push(mid)
  }
  return [...new Set(out)].sort((a, b) => a - b)
}

/**
 * The extra hours a candidate that lit nothing is shot again at: its onset and a few hours after
 * it, inside its window and clear of the hours already shot. A tissue whose first grid hour falls
 * before it draws light reads as absent otherwise.
 */
export function recheckHours(
  row: { fromHpf: number; toHpf: number },
  captured: readonly number[],
  rangeEnd = 48,
  offsets: readonly number[] = RECHECK_OFFSETS,
): number[] {
  const end = Math.min(row.toHpf, rangeEnd)
  const hours = offsets
    .map((offset) => round2(row.fromHpf + offset))
    .filter((t) => t >= row.fromHpf && t <= end && !captured.includes(t))
  return [...new Set(hours)].sort((a, b) => a - b)
}

export interface HourJob {
  t: number
  candidates: CandidateRow[]
}

/** The sweep, one job per hour, each holding the candidates to shoot at that hour. */
export function planCaptures(
  rows: readonly CandidateRow[],
  o: { grid?: readonly number[]; rangeEnd?: number; only?: readonly string[] | null } = {},
): HourJob[] {
  const grid = o.grid ?? DEFAULT_HOUR_GRID
  const rangeEnd = o.rangeEnd ?? 48
  const byHour = new Map<number, CandidateRow[]>()
  for (const row of rows) {
    if (o.only && !o.only.includes(row.slug)) continue
    const hours = pickHours(row.fromHpf, row.toHpf, grid, rangeEnd)
    if (hours.length === 0) hours.push(rangeEnd)
    for (const t of hours) {
      const list = byHour.get(t)
      if (list) list.push(row)
      else byHour.set(t, [row])
    }
  }
  return [...byHour.keys()].sort((a, b) => a - b).map((t) => ({ t, candidates: byHour.get(t) ?? [] }))
}

/** `notochord_t19p6.png`: one file name per candidate and hour, with no dot in it. */
export function shotFileName(slug: string, t: number): string {
  return `${slug}_t${String(t).replace('.', 'p')}.png`
}

/** The rows of `<out>/capture.json` whose candidate lit nothing at its earliest hour. */
export function darkCandidates(rows: readonly CaptureRow[]): string[] {
  const earliest = new Map<string, CaptureRow>()
  for (const row of rows) {
    const seen = earliest.get(row.slug)
    if (!seen || row.t < seen.t) earliest.set(row.slug, row)
  }
  return [...earliest.entries()].filter(([, row]) => row.litCount === 0).map(([slug]) => slug)
}

// ---- input --------------------------------------------------------------------------------------

export interface CandidateInput {
  candidates: CandidateRow[]
  /** The stage range the rows were built for; the rule's end and the hour cap. */
  rangeEnd: number
}

function isRow(value: unknown): value is CandidateRow {
  const row = value as CandidateRow
  return typeof value === 'object' && value !== null
    && typeof row.slug === 'string' && typeof row.targetId === 'string'
    && typeof row.fromHpf === 'number' && typeof row.toHpf === 'number'
}

/** Reads a candidates file: either the object candidates.ts writes or a bare array of rows. */
export function parseCandidateFile(value: unknown, where = 'candidates.json'): CandidateInput {
  const rows = Array.isArray(value) ? value : (value as { candidates?: unknown }).candidates
  if (!Array.isArray(rows)) throw new Error(`${where}: no candidate array`)
  const candidates = rows.map((row, i) => {
    if (!isRow(row)) throw new Error(`${where}[${i}]: needs slug, targetId, fromHpf and toHpf`)
    const kind: CandidateRow['kind'] = row.kind === 'group' ? 'group' : 'record'
    return { ...row, kind, includeParts: row.includeParts === true }
  })
  const end = Array.isArray(value) ? undefined : (value as { toHpf?: unknown }).toHpf
  const rangeEnd = typeof end === 'number' && Number.isFinite(end)
    ? end
    : Math.max(...candidates.map((row) => Math.min(row.toHpf, 48)))
  return { candidates, rangeEnd }
}

// ---- the browser --------------------------------------------------------------------------------

/** The hex the material carries while the target is lit in this reporter. */
export function emissiveHex(reporter: ReporterId): string {
  return REPORTERS[reporter].hex.replace('#', '').toLowerCase()
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** The handles whose material carries the reporter's emissive hex, with their intensity and opacity. */
async function litHandles(page: Page, hex: string): Promise<CaptureRow['lit']> {
  return page.evaluate((want) => {
    const dbg = window.__atlasDebug
    if (!dbg) throw new Error('window.__atlasDebug is missing; the viewer is not mounted')
    const out: { id: string; em: number; op: number }[] = []
    for (const [id, handle] of dbg.runtime.handles) {
      if (handle.material.emissive.getHexString() !== want) continue
      out.push({
        id,
        em: Math.round((handle.material.emissiveIntensity ?? 0) * 100) / 100,
        op: Math.round((handle.opacity ?? 0) * 100) / 100,
      })
    }
    return out
  }, hex)
}

async function writeRule(page: Page, config: FluorescenceConfig): Promise<void> {
  await page.evaluate((cfg) => {
    const dbg = window.__atlasDebug
    if (!dbg) throw new Error('window.__atlasDebug is missing; the viewer is not mounted')
    const store = dbg.state() as unknown as AtlasStore
    store.setFluorescence(cfg)
    dbg.runtime.invalidate()
  }, config)
}

/** Every candidate of one hour: one page load, then one rule and one frame per candidate. */
async function shootHour(page: Page, job: HourJob, o: Options, base: string, rangeEnd: number): Promise<CaptureRow[]> {
  await page.goto(`${base}/?lab=1&embed=1&theme=dark&v=${o.view}&t=${job.t}`, { waitUntil: 'load' })
  const ready = await waitForReady(page, READY_TIMEOUT_MS)
  await sleep(PAGE_SETTLE_MS)
  console.log(`capture: t=${job.t} view=${o.view} ready=${ready} (${job.candidates.length} candidates)`)
  const hex = emissiveHex(CAPTURE_REPORTER)
  const rows: CaptureRow[] = []
  for (const c of job.candidates) {
    await writeRule(page, fluorescenceConfigFor({
      targetId: c.targetId,
      reporter: CAPTURE_REPORTER,
      includeParts: c.includeParts,
      litFromHpf: c.fromHpf,
      litToHpf: rangeEnd,
      context: CAPTURE_CONTEXT,
    }))
    await sleep(RULE_SETTLE_MS)
    const lit = await litHandles(page, hex)
    const file = join(o.out, shotFileName(c.slug, job.t))
    await page.screenshot({ path: file })
    rows.push({
      slug: c.slug,
      targetId: c.targetId,
      includeParts: c.includeParts,
      fromHpf: c.fromHpf,
      t: job.t,
      view: o.view,
      ready,
      litCount: lit.length,
      lit,
      file,
    })
    console.log(`    ${c.slug} t=${job.t} lit=${lit.length}`)
  }
  return rows
}

// ---- command line -------------------------------------------------------------------------------

interface Options {
  candidates: string
  out: string
  only: string[] | null
  view: string
  hours: number[]
  recheck: number[]
  port: number
  dist: string
  base: string | null
}

const USAGE = [
  'usage: node scripts/movies/selection/capture.ts --candidates FILE --out DIR',
  '       [--only slug,slug] [--view lat] [--hours 3,6,7,9,12,16,18,24,27,36,48]',
  '       [--recheck 0,3,6] [--port 4971] [--dist DIR] [--base URL]',
  '       --recheck none turns the onset re-check off',
].join('\n')

function fail(message: string): never {
  console.error(`capture: ${message}`)
  console.error(USAGE)
  process.exit(2)
}

function numberList(raw: string, key: string): number[] {
  const out = raw.split(',').map((s) => s.trim()).filter(Boolean).map(Number)
  if (out.length === 0 || out.some((n) => !Number.isFinite(n))) fail(`--${key} must be a comma-separated list of numbers`)
  return out
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
  if (raw.candidates === undefined) fail('--candidates names the file candidates.ts wrote')
  if (raw.out === undefined) fail('--out names the directory to write the frames into')
  const port = raw.port === undefined ? 4971 : Number(raw.port)
  if (!(Number.isInteger(port) && port >= 1024 && port <= 65535)) fail('--port must be an integer in 1024 to 65535')
  const dist = raw.dist === undefined ? join(repoRoot, 'node_modules/.cache/atlas-selection-dist') : resolve(raw.dist)
  return {
    candidates: resolve(raw.candidates),
    out: resolve(raw.out),
    only: raw.only === undefined ? null : raw.only.split(',').map((s) => s.trim()).filter(Boolean),
    view: raw.view ?? 'lat',
    hours: raw.hours === undefined ? [...DEFAULT_HOUR_GRID] : numberList(raw.hours, 'hours'),
    recheck: raw.recheck === undefined ? [...RECHECK_OFFSETS] : raw.recheck === 'none' ? [] : numberList(raw.recheck, 'recheck'),
    port,
    dist,
    base: raw.base ?? null,
  }
}

async function main(argv: string[]): Promise<number> {
  const o = parseArgs(argv)
  if (!existsSync(o.candidates)) fail(`the candidates file ${o.candidates} is missing`)
  const input = parseCandidateFile(JSON.parse(readFileSync(o.candidates, 'utf8')), o.candidates)
  const jobs = planCaptures(input.candidates, { grid: o.hours, rangeEnd: input.rangeEnd, only: o.only })
  if (jobs.length === 0) fail('no candidate matched --only')
  const frames = jobs.reduce((n, job) => n + job.candidates.length, 0)
  console.log(`capture: ${frames} frames over ${jobs.length} hours into ${o.out}`)
  mkdirSync(o.out, { recursive: true })

  let preview: Preview | null = null
  let browser: Browser | null = null
  try {
    let base = o.base
    if (base === null) {
      ensureDist(o.dist)
      preview = await startPreview(o.dist, o.port)
      base = preview.baseURL
    }
    browser = await launchBrowser()
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const rows: CaptureRow[] = []
    for (const job of jobs) rows.push(...await shootHour(page, job, o, base, input.rangeEnd))

    if (o.recheck.length > 0) {
      const dark = new Set(darkCandidates(rows))
      const extra = new Map<number, CandidateRow[]>()
      for (const job of jobs) {
        for (const c of job.candidates) {
          if (!dark.has(c.slug)) continue
          dark.delete(c.slug)
          const captured = rows.filter((r) => r.slug === c.slug).map((r) => r.t)
          for (const t of recheckHours(c, captured, input.rangeEnd, o.recheck)) {
            const list = extra.get(t)
            if (list) list.push(c)
            else extra.set(t, [c])
          }
        }
      }
      const hours = [...extra.keys()].sort((a, b) => a - b)
      if (hours.length > 0) console.log(`capture: onset re-check at ${hours.join(', ')} hpf`)
      for (const t of hours) rows.push(...await shootHour(page, { t, candidates: extra.get(t) ?? [] }, o, base, input.rangeEnd))
    }

    writeFileSync(join(o.out, 'capture.json'), `${JSON.stringify(rows, null, 1)}\n`)
    const lit = rows.filter((row) => row.litCount > 0).length
    console.log(`capture: ${rows.length} frames, ${lit} with a lit handle, ${join(o.out, 'capture.json')}`)
    return 0
  } finally {
    if (browser) await browser.close()
    if (preview) await stopPreview(preview.child)
  }
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(`capture: ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    },
  )
}
