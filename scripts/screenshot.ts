// Headline-stage screenshots (D13, QP-32 to QP-34).
//
//   node scripts/screenshot.ts [--out docs/screenshots] [--base-url http://localhost:4173]
//                              [--hpf 24,48] [--views lat,dor] [--fallback]
//
// Opens `/?t=<hpf>&v=<view>&embed=1&theme=dark` for the 18 headline stages in
// the lateral and dorsal views at 1600 by 900, waits for the ready attribute,
// and writes `<out>/<hpf>-<lateral|dorsal>.png`. It needs a prior `npm run build`
// and starts `npm run preview` when nothing answers at the base URL.
// The e2e specs import the helpers below; only a direct `node` run starts a browser.

import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import type { Page } from '@playwright/test'
import { decodePng } from './lib/png.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** The 18 headline stage starts of D7, used when stages.json is not available. */
export const D7_HEADLINE_HPF = [0, 2.5, 4, 6, 10, 16, 24, 42, 48, 72, 120, 168, 336, 504, 720, 1080, 2160, 4320]

export const VIEWS = { lat: 'lateral', dor: 'dorsal' } as const
export type ViewKey = keyof typeof VIEWS

export const VIEWPORT = { width: 1600, height: 900 } as const

/** WebGL through SwiftShader on a machine without a GPU (research 06, QP-30). */
export const GL_FLAGS = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']

/** The viewer marks its canvas wrapper when the first final-tessellation frame has rendered (QP-31). */
export const READY_SELECTOR = '[data-atlas-ready="true"], [data-atlas-ready="1"]'

/**
 * Non-blank thresholds (QP-34): the spec's starting values. WP-H1 calibrates them against
 * the first accepted screenshot set.
 */
export const NON_BLANK = { minLuminanceStdDev: 8, minChangedFraction: 0.03, colourTolerance: 16 } as const

/**
 * Deviation from QP-34 recorded in the phase 1 report: under the AR-41 sphere fit a dorsal
 * larva (42 to 720 hpf) is a thin bar that changes 2.5 to 2.9 percent of the canvas, so the
 * dorsal views use this lower fraction until WP-H1 sets a per-view value. A blank canvas
 * changes 0 percent; the 24 hpf lateral view 12 percent.
 */
export const DORSAL_MIN_CHANGED_FRACTION = 0.02

export type NonBlankResult = { ok: boolean; stdDev: number; changedFraction: number; width: number; height: number }

/** Decodes a PNG and applies the two QP-34 conditions. */
export function checkNonBlank(png: Uint8Array, minChangedFraction: number = NON_BLANK.minChangedFraction): NonBlankResult {
  const { width, height, rgba } = decodePng(png)
  const n = width * height
  const counts = new Map<number, number>()
  let sum = 0
  let sumSq = 0
  for (let i = 0; i < n; i++) {
    const r = rgba[4 * i], g = rgba[4 * i + 1], b = rgba[4 * i + 2]
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sum += lum
    sumSq += lum * lum
    const key = (r << 16) | (g << 8) | b
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const mean = sum / n
  const stdDev = Math.sqrt(Math.max(0, sumSq / n - mean * mean))
  let modeKey = 0
  let modeCount = -1
  for (const [key, count] of counts) if (count > modeCount) { modeKey = key; modeCount = count }
  const mr = (modeKey >> 16) & 255, mg = (modeKey >> 8) & 255, mb = modeKey & 255
  let changed = 0
  for (let i = 0; i < n; i++) {
    const d = Math.max(Math.abs(rgba[4 * i] - mr), Math.abs(rgba[4 * i + 1] - mg), Math.abs(rgba[4 * i + 2] - mb))
    if (d > NON_BLANK.colourTolerance) changed++
  }
  const changedFraction = changed / n
  const ok = stdDev > NON_BLANK.minLuminanceStdDev && changedFraction > minChangedFraction
  return { ok, stdDev, changedFraction, width, height }
}

/** Headline tick hpf values from stages.json, or the D7 list when the file is absent. */
export function headlineHpf(stagesPath = join(repoRoot, 'src/data/stages.json')): number[] {
  if (!existsSync(stagesPath)) return D7_HEADLINE_HPF
  try {
    const stages = JSON.parse(readFileSync(stagesPath, 'utf8')) as { timeAxis?: { headlineTicks?: { hpf: number }[] } }
    const ticks = stages.timeAxis?.headlineTicks?.map((t) => t.hpf)
    return ticks && ticks.length > 0 ? ticks : D7_HEADLINE_HPF
  } catch {
    return D7_HEADLINE_HPF
  }
}

/** Shortest decimal string of an hpf value, as the file names use it. */
export const hpfLabel = (hpf: number): string => String(hpf)

export function viewUrl(hpf: number, view: ViewKey, extra = ''): string {
  return `/?t=${hpfLabel(hpf)}&v=${view}&embed=1&theme=dark${extra}`
}

export function screenshotName(hpf: number, view: ViewKey): string {
  return `${hpfLabel(hpf)}-${VIEWS[view]}.png`
}

/** Waits for the ready attribute; false when no viewer marks itself ready in time. */
export async function waitForReady(page: Page, timeoutMs = 60_000): Promise<boolean> {
  try {
    await page.locator(READY_SELECTOR).first().waitFor({ state: 'attached', timeout: timeoutMs })
    return true
  } catch {
    return false
  }
}

export function canvasLocator(page: Page) {
  return page.locator('canvas').first()
}

export type Capture = { file: string; canvasPng: Uint8Array; nonBlank: NonBlankResult }

/** Saves the viewport screenshot and returns the canvas pixels with their non-blank result. */
export async function captureView(page: Page, hpf: number, view: ViewKey, outDir: string): Promise<Capture> {
  mkdirSync(outDir, { recursive: true })
  const file = join(outDir, screenshotName(hpf, view))
  await page.screenshot({ path: file, fullPage: false })
  const canvasPng = new Uint8Array(await canvasLocator(page).screenshot())
  const minChanged = view === 'dor' ? DORSAL_MIN_CHANGED_FRACTION : NON_BLANK.minChangedFraction
  return { file, canvasPng, nonBlank: checkNonBlank(canvasPng, minChanged) }
}

// ---- standalone run ---------------------------------------------------------

type Options = { out: string; baseUrl: string; hpf: number[]; views: ViewKey[]; fallback: boolean }

function parseArgs(argv: string[]): Options {
  const opts: Options = { out: 'docs/screenshots', baseUrl: 'http://localhost:4173', hpf: headlineHpf(), views: ['lat', 'dor'], fallback: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out') opts.out = argv[++i] ?? opts.out
    else if (a === '--base-url') opts.baseUrl = argv[++i] ?? opts.baseUrl
    else if (a === '--hpf') opts.hpf = (argv[++i] ?? '').split(',').map(Number).filter(Number.isFinite)
    else if (a === '--views') opts.views = (argv[++i] ?? '').split(',').filter((v): v is ViewKey => v in VIEWS)
    else if (a === '--fallback') opts.fallback = true
    else { console.error(`unknown argument ${a}`); process.exit(2) }
  }
  return opts
}

async function serverUp(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

async function ensureServer(baseUrl: string): Promise<ChildProcess | null> {
  if (await serverUp(baseUrl)) return null
  if (!existsSync(join(repoRoot, 'dist/index.html'))) throw new Error('dist/index.html is missing; run npm run build first')
  const port = new URL(baseUrl).port || '4173'
  const child = spawn('npm', ['run', 'preview', '--', '--port', port], { cwd: repoRoot, stdio: 'ignore' })
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500))
    if (await serverUp(baseUrl)) return child
  }
  child.kill()
  throw new Error(`preview server did not answer at ${baseUrl}`)
}

async function main(): Promise<number> {
  const opts = parseArgs(process.argv.slice(2))
  const outDir = resolve(repoRoot, opts.out)
  const server = await ensureServer(opts.baseUrl)
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL_FLAGS })
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, reducedMotion: 'reduce', baseURL: opts.baseUrl })
  const page = await context.newPage()
  let failures = 0
  try {
    for (const hpf of opts.hpf) {
      for (const view of opts.views) {
        await page.goto(viewUrl(hpf, view))
        const ready = await waitForReady(page)
        if (!ready) {
          failures++
          console.log(`${screenshotName(hpf, view)}: not ready (no ${READY_SELECTOR})`)
          continue
        }
        const cap = await captureView(page, hpf, view, outDir)
        const r = cap.nonBlank
        if (!r.ok) failures++
        console.log(`${screenshotName(hpf, view)}: ${r.ok ? 'ok' : 'BLANK'} stdDev ${r.stdDev.toFixed(1)} changed ${(100 * r.changedFraction).toFixed(1)}%`)
      }
    }
    const lateral24 = join(outDir, screenshotName(24, 'lat'))
    if (opts.fallback && existsSync(lateral24)) copyFileSync(lateral24, join(repoRoot, 'public/fallback-24hpf.png'))
  } finally {
    await browser.close()
    server?.kill()
  }
  console.log(`screenshots: ${opts.hpf.length * opts.views.length} views, ${failures} failures, written to ${outDir}`)
  return failures > 0 ? 1 : 0
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(`screenshots: ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    },
  )
}
