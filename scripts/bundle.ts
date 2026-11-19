// Folds the build into one offline HTML file (README "Build a single-file demo").
//
//   npm run bundle [-- --out <file>] [-- --verify]
//   node scripts/bundle.ts [--out bundle/zebrafish-3d-atlas.html] [--dist dist] [--verify]
//
// It reads `dist/index.html` with the one JS and the one CSS file of a
// `VITE_SINGLE_FILE=1` build, inlines both, inlines the favicon as a data URI,
// drops the modulepreload hints, and writes the result to `--out`. The pre-paint
// theme script of `index.html` stays as it is. A relative `--out` is relative to
// the repository root. The script fails instead of writing a half-inlined page
// when the build is split or a reference to `/assets/` survives.
//
// It also embeds ATTRIBUTION.md and THIRD-PARTY-NOTICES.txt in two
// `<script type="text/plain">` blocks, so the attribution and the licence notices
// travel with the file (L-02, L-06). The About sheet and the info card footer read
// those blocks when the page has no files beside it.
//
// `--dist` reads another build directory, for a check that leaves the shared
// `dist/` alone.
//
// `--verify` opens the written file from the file system in the system Chrome,
// waits for the ready attribute, writes one screenshot next to the file, and
// exits 1 on a page error or a blank canvas.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import { ATTRIBUTION_FILE, EMBEDDED_ATTRIBUTION_ID, EMBEDDED_NOTICES_ID, NOTICES_FILE } from '../src/core/attribution.ts'
import { GL_FLAGS, READY_SELECTOR, VIEWPORT, checkNonBlank, waitForReady } from './screenshot.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_DIST = 'dist'

/** Milliseconds to let the demand frame loop settle after the ready attribute (scripts/snap.ts). */
const SETTLE_MS = 2500

const DEFAULT_OUT = 'bundle/zebrafish-3d-atlas.html'
const USAGE = `usage: node scripts/bundle.ts [--out ${DEFAULT_OUT}] [--dist ${DEFAULT_DIST}] [--verify]`

type Options = { out: string; dist: string; verify: boolean }

function fail(message: string): never {
  console.error(`bundle: ${message}`)
  console.error(USAGE)
  process.exit(2)
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { out: DEFAULT_OUT, dist: DEFAULT_DIST, verify: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out') opts.out = argv[++i] ?? fail('--out needs a value')
    else if (a === '--dist') opts.dist = argv[++i] ?? fail('--dist needs a value')
    else if (a === '--verify') opts.verify = true
    else if (a === '--help' || a === '-h') {
      console.log(USAGE)
      process.exit(0)
    } else fail(`unknown argument ${a}`)
  }
  return opts
}

const scriptRe = /<script type="module" crossorigin src="\/(assets\/[^"]+\.js)"><\/script>/
const styleRe = /<link rel="stylesheet" crossorigin href="\/(assets\/[^"]+\.css)">/
const iconRe = /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml" \/>/
const preloadRe = /\s*<link rel="modulepreload"[^>]*>/g

/**
 * The one JS and the one CSS file of the single-file build. A split build has several of each,
 * and it also emits the assets its modules import; both leave a fetch in the folded page, so
 * this reports the whole directory and stops.
 */
function singleAssets(distDir: string): { js: string; css: string } {
  let names: string[]
  try {
    names = readdirSync(join(distDir, 'assets')).sort()
  } catch {
    throw new Error(`${join(distDir, 'assets')} is missing; run VITE_SINGLE_FILE=1 npm run build first`)
  }
  const js = names.filter((n) => n.endsWith('.js'))
  const css = names.filter((n) => n.endsWith('.css'))
  const other = names.filter((n) => !n.endsWith('.js') && !n.endsWith('.css'))
  const problem =
    js.length !== 1 ? `${js.length} JS files` : css.length !== 1 ? `${css.length} CSS files` : other.length > 0 ? `${other.length} other files` : ''
  if (problem) {
    throw new Error(
      `dist/assets holds ${problem}, and a single-file bundle needs exactly one JS and one CSS file.\n` +
        `  Rebuild with VITE_SINGLE_FILE=1 npm run build (or npm run bundle).\n` +
        `  dist/assets: ${names.join(', ')}`,
    )
  }
  return { js: `assets/${js[0]}`, css: `assets/${css[0]}` }
}

/** `</script` inside the inlined code would close the tag early, so escape it. */
function escapeScript(js: string): string {
  return js.replace(/<\/(script)/gi, (_m, tag: string) => `<\\/${tag}`)
}

function foldSingleFile(distDir: string): string {
  const assets = singleAssets(distDir)
  let html = readFileSync(join(distDir, 'index.html'), 'utf8')

  const scriptMatch = html.match(scriptRe)
  if (!scriptMatch) throw new Error('no module <script src="/assets/*.js"> tag in dist/index.html')
  if (scriptMatch[1] !== assets.js) throw new Error(`dist/index.html loads ${scriptMatch[1]}, but dist/assets holds ${assets.js}`)
  if (!styleRe.test(html)) throw new Error('no <link rel="stylesheet" href="/assets/*.css"> tag in dist/index.html')

  const js = readFileSync(join(distDir, assets.js), 'utf8')
  const css = readFileSync(join(distDir, assets.css), 'utf8')
  if (/<\/style/i.test(css)) throw new Error(`${assets.css} contains "</style"; the inlined stylesheet would end early`)

  html = html.replace(scriptRe, () => `<script type="module">\n${escapeScript(js)}\n</script>`)
  html = html.replace(styleRe, () => `<style>\n${css}\n</style>`)
  if (iconRe.test(html)) {
    const svg = readFileSync(join(distDir, 'favicon.svg'), 'utf8')
    const b64 = Buffer.from(svg, 'utf8').toString('base64')
    html = html.replace(iconRe, `<link rel="icon" href="data:image/svg+xml;base64,${b64}" type="image/svg+xml" />`)
  }

  // A preload link is a hint, not a load: the single-file build inlines every module it names.
  // Drop the hints first, so the guard below reports references that still fetch.
  html = html.replace(preloadRe, '')
  if (/(src|href)="\/assets\//.test(html)) throw new Error('an /assets/ reference survived inlining; the bundle would not be offline')
  return embedNotices(html, distDir)
}

/**
 * The attribution and the third-party notices, as two text blocks before `</body>`. CC BY 4.0,
 * CC BY 3.0 and MIT each ask for the notice in every copy, and the demo travels as one file with
 * nothing beside it (L-02, L-06).
 */
function embedNotices(html: string, distDir: string): string {
  if (!html.includes('</body>')) throw new Error('dist/index.html has no </body> tag')
  const blocks = [
    { id: EMBEDDED_ATTRIBUTION_ID, file: ATTRIBUTION_FILE },
    { id: EMBEDDED_NOTICES_ID, file: NOTICES_FILE },
  ].map(({ id, file }) => {
    const path = join(distDir, file)
    if (!existsSync(path)) throw new Error(`${path} is missing; run npm run attribution and npm run notices, then build again`)
    return `<script type="text/plain" id="${id}">\n${escapeScript(readFileSync(path, 'utf8'))}\n</script>`
  })
  return html.replace('</body>', `${blocks.join('\n')}\n</body>`)
}

/** Opens the written file from the file system and reports whether the viewer drew anything. */
async function verify(outFile: string): Promise<number> {
  const shotFile = join(dirname(outFile), `${basename(outFile, '.html')}.png`)
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL_FLAGS })
  const errors: string[] = []
  try {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(pathToFileURL(outFile).href)
    const ready = await waitForReady(page, 90_000)
    // The frame loop runs on demand, so give the camera fit and the labels a few frames.
    await page.waitForTimeout(SETTLE_MS)
    await page.screenshot({ path: shotFile, fullPage: false })
    console.log(`bundle: wrote ${shotFile}`)
    for (const e of errors) console.error(`bundle: page error: ${e}`)
    if (!ready) {
      console.error(`bundle: the page never set ${READY_SELECTOR}`)
      return 1
    }
    const canvas = page.locator('canvas').first()
    if ((await canvas.count()) === 0) {
      console.error('bundle: the page has no canvas')
      return 1
    }
    const r = checkNonBlank(new Uint8Array(await canvas.screenshot()))
    console.log(`bundle: canvas ${r.ok ? 'ok' : 'BLANK'} stdDev ${r.stdDev.toFixed(1)} changed ${(100 * r.changedFraction).toFixed(1)}%`)
    return r.ok && errors.length === 0 ? 0 : 1
  } finally {
    await browser.close()
  }
}

async function main(): Promise<number> {
  const opts = parseArgs(process.argv.slice(2))
  const outFile = resolve(repoRoot, opts.out)
  const html = foldSingleFile(resolve(repoRoot, opts.dist))
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, html)
  const bytes = Buffer.byteLength(html)
  console.log(`bundle: wrote ${outFile} (${(bytes / 1024 / 1024).toFixed(1)} MB, ${bytes} bytes)`)
  return opts.verify ? await verify(outFile) : 0
}

main().then(
  (code) => process.exit(code),
  (e: unknown) => {
    console.error(`bundle: ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  },
)
