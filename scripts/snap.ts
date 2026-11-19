// Snapshot helper for the phase 2 and 3 packages. It never touches the shared dist/.
//
//   node scripts/snap.ts --port <port> --out <dir> [--hpf 24,48,120,720,4320] [--views lat,dor]
//                        [--embed 0|1] [--xr 0..100] [--dissect 0..100] [--cam x,y,z,tx,ty,tz]
//                        [--hide <tokens>] [--sel <7-digit ZFA numbers>] [--theme dark|light]
//                        [--systems]
//
// Builds the app with `vite build --outDir <out>/dist --emptyOutDir` (VITE_ATLAS_FIXTURE unset,
// so the real records load), serves it with `vite preview --port <port> --strictPort`, opens
// `/?t=<hpf>&v=<view>&embed=1&theme=dark` per view in the system Chrome at 1600 by 900 with the
// SwiftShader flags of playwright.config.ts, waits for `[data-atlas-ready="true"]`, writes
// `<out>/<hpf>-<view>.png`, prints the non-blank statistics of the canvas, and stops the
// preview. Views: lat, dor, ven, ant, pos, tq (src/core/urlState.ts). `--hide` takes the URL
// form: system ids or 7-digit ZFA numbers, comma separated. `--sel` selects records by their
// 7-digit ZFA numbers, comma separated, which opens the structure card; with `--embed 0` the
// card carries the ZFIN footer. `--dissect` sets the D17 dissect
// slider through the `x` URL key. Every file it writes starts with `dissect-` and ends with
// the slider value: `dissect-<hpf>-<n>.png`, `dissect-<hpf>-<n>-<view>.png` when more than one
// view is asked for, and `dissect-<system>-<hpf>-lat-<n>.png` with `--systems`. The camera fit
// encloses the dissect layout (src/viewer/dissectFit.ts), so the inventory grid needs no `--cam`.
// `--cam` sets a free camera pose (the `cam` URL key, six numbers in mm) for a hand-framed shot.
// `--systems` writes one lateral view per D5 system with the other 14 hidden, as
// `<out>/<system>-<hpf>-lat.png`, or `<out>/dissect-<system>-<hpf>-lat-<n>.png` with `--dissect`; the skin (the whole-organism record, integument_pigment) stays as the outline, so
// that system is hidden record by record. Exit 1 when the build fails or a view never becomes ready.

import { spawn, spawnSync } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { VIEW_PARAM_VALUES } from '../src/core/urlState.ts'
import type { ViewParam } from '../src/core/urlState.ts'
import { DORSAL_MIN_CHANGED_FRACTION, GL_FLAGS, NON_BLANK, READY_SELECTOR, VIEWPORT, checkNonBlank, waitForReady } from './screenshot.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
/**
 * Milliseconds to let the demand frame loop settle after `data-atlas-ready`. The camera fit and
 * the label layout each need a few frames, and SwiftShader draws this scene at about three
 * frames a second, so the wait is generous.
 */
const SETTLE_MS = 2500
const viteBin = resolve(repoRoot, 'node_modules/vite/bin/vite.js')

type Options = {
  port: number
  out: string
  hpf: number[]
  views: ViewParam[]
  embed: boolean
  xr: number | null
  dissect: number | null
  cam: string | null
  hide: string | null
  sel: string | null
  theme: 'dark' | 'light'
  systems: boolean
}

const USAGE = 'usage: node scripts/snap.ts --port <port> --out <dir> [--hpf 24,48] [--views lat,dor] [--embed 0|1] [--xr 60] [--dissect 60] [--cam x,y,z,tx,ty,tz] [--hide axial,0000114] [--sel 0000114] [--theme dark|light] [--systems]'

function fail(message: string): never {
  console.error(`snap: ${message}`)
  console.error(USAGE)
  process.exit(2)
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { port: 0, out: '', hpf: [24, 48, 120, 720, 4320], views: ['lat', 'dor'], embed: true, xr: null, dissect: null, cam: null, hide: null, sel: null, theme: 'dark', systems: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => argv[++i] ?? fail(`${a} needs a value`)
    if (a === '--port') opts.port = Number(next())
    else if (a === '--out') opts.out = next()
    else if (a === '--hpf') opts.hpf = next().split(',').map(Number)
    else if (a === '--views') opts.views = next().split(',') as ViewParam[]
    else if (a === '--embed') opts.embed = next() !== '0'
    else if (a === '--xr') opts.xr = Number(next())
    else if (a === '--dissect') opts.dissect = Number(next())
    else if (a === '--cam') opts.cam = next()
    else if (a === '--hide') opts.hide = next()
    else if (a === '--sel') opts.sel = next()
    else if (a === '--theme') opts.theme = next() as Options['theme']
    else if (a === '--systems') opts.systems = true
    else if (a === '--help' || a === '-h') {
      console.log(USAGE)
      process.exit(0)
    } else fail(`unknown argument ${a}`)
  }
  if (!Number.isInteger(opts.port) || opts.port < 1024 || opts.port > 65535) fail('--port must be an integer between 1024 and 65535')
  if (!opts.out) fail('--out is required')
  if (opts.hpf.length === 0 || opts.hpf.some((h) => !Number.isFinite(h) || h < 0 || h > 4320)) fail('--hpf values must lie in 0 to 4320')
  const bad = opts.views.filter((v) => !(VIEW_PARAM_VALUES as readonly string[]).includes(v))
  if (bad.length > 0) fail(`unknown view ${bad.join(', ')}; use ${VIEW_PARAM_VALUES.join(', ')}`)
  if (opts.xr !== null && !(Number.isInteger(opts.xr) && opts.xr >= 0 && opts.xr <= 100)) fail('--xr must be an integer between 0 and 100')
  if (opts.dissect !== null && !(Number.isInteger(opts.dissect) && opts.dissect >= 0 && opts.dissect <= 100)) fail('--dissect must be an integer between 0 and 100')
  if (opts.cam !== null && !/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){5}$/.test(opts.cam)) fail('--cam must be six comma-separated numbers')
  if (opts.sel !== null && !/^\d{7}(,\d{7}){0,11}$/.test(opts.sel)) fail('--sel must be up to 12 comma-separated 7-digit ZFA numbers')
  if (opts.theme !== 'dark' && opts.theme !== 'light') fail('--theme must be dark or light')
  return opts
}

/** The build and the preview run without the fixture alias, whatever the caller's shell exports. */
function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  delete env.VITE_ATLAS_FIXTURE
  return env
}

function build(distDir: string): void {
  console.log(`snap: vite build into ${distDir}`)
  const r = spawnSync(process.execPath, [viteBin, 'build', '--outDir', distDir, '--emptyOutDir'], {
    cwd: repoRoot, env: cleanEnv(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (r.status !== 0) {
    process.stdout.write(r.stdout)
    process.stderr.write(r.stderr)
    throw new Error(`vite build exited with ${r.status}`)
  }
  const lines = r.stdout.trim().split('\n')
  console.log(`snap: ${lines[lines.length - 1]?.trim() ?? 'built'}`)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function serverUp(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

async function startPreview(distDir: string, port: number): Promise<{ child: ChildProcess; baseURL: string }> {
  const baseURL = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, [viteBin, 'preview', '--outDir', distDir, '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: repoRoot, env: cleanEnv(), stdio: ['ignore', 'pipe', 'pipe'],
  })
  const state = { log: '', exit: null as number | null }
  child.stdout?.on('data', (d: Buffer) => { state.log += String(d) })
  child.stderr?.on('data', (d: Buffer) => { state.log += String(d) })
  child.on('exit', (code) => { state.exit = code ?? 1 })
  for (let i = 0; i < 120; i++) {
    if (state.exit !== null) throw new Error(`vite preview exited with ${state.exit} before it served ${baseURL} (is the port free?)\n${state.log}`)
    if (await serverUp(`${baseURL}/`)) return { child, baseURL }
    await sleep(500)
  }
  child.kill()
  throw new Error(`vite preview did not answer at ${baseURL} within 60 s\n${state.log}`)
}

async function stopPreview(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return
  child.kill('SIGTERM')
  for (let i = 0; i < 30 && child.exitCode === null && !child.killed; i++) await sleep(100)
  if (child.exitCode === null) child.kill('SIGKILL')
}

function viewUrl(o: Options, hpf: number, view: ViewParam, hide: string | null = o.hide): string {
  const q = new URLSearchParams({ t: String(hpf), v: view })
  if (o.embed) q.set('embed', '1')
  q.set('theme', o.theme)
  if (o.xr !== null) q.set('xr', String(o.xr))
  if (o.dissect !== null) q.set('x', String(o.dissect))
  if (o.cam !== null) q.set('cam', o.cam)
  if (hide) q.set('hide', hide)
  if (o.sel) q.set('sel', o.sel)
  return `/?${q.toString()}`
}

/** The D5 system ids in rail order, from systems.json. */
function systemIds(): string[] {
  const rows = JSON.parse(readFileSync(resolve(repoRoot, 'src/data/systems.json'), 'utf8')) as { id: string; order: number }[]
  return rows.sort((a, b) => a.order - b.order).map((r) => r.id)
}

const SKIN_SYSTEM = 'integument_pigment'
const SKIN_ID = 'ZFA:0001094'

/** The 7-digit hide tokens of every drawn skin-system record except the skin itself. */
function skinSystemRecordTokens(): string[] {
  const dir = resolve(repoRoot, 'src/data/structures')
  const out: string[] = []
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const rows = JSON.parse(readFileSync(join(dir, file), 'utf8')) as { id: string; system: string; geometry: unknown }[]
    for (const r of rows) if (r.system === SKIN_SYSTEM && r.id !== SKIN_ID && r.geometry) out.push(r.id.replace(/^ZFA:/, ''))
  }
  return out
}

/** One shot per (name, url): the plain views, or one lateral view per system with the others hidden. */
function shots(o: Options): { name: string; url: string; view: ViewParam }[] {
  // One scheme for both modes: a dissect run is prefixed `dissect-` and ends with the slider
  // value, so a system shot and a plain shot sort and diff the same way.
  const suffix = o.dissect === null ? '' : `-${o.dissect}`
  const prefix = o.dissect === null ? '' : 'dissect-'
  const plainName = (hpf: number, view: ViewParam): string =>
    o.dissect === null
      ? `${hpf}-${view}.png`
      : `dissect-${hpf}-${o.dissect}${o.views.length > 1 ? `-${view}` : ''}.png`
  if (!o.systems) return o.hpf.flatMap((hpf) => o.views.map((view) => ({ name: plainName(hpf, view), url: viewUrl(o, hpf, view), view })))
  const ids = systemIds()
  const skinRecords = skinSystemRecordTokens()
  return ids.flatMap((id) =>
    o.hpf.map((hpf) => {
      const others = ids.filter((other) => other !== id)
      const hide = [
        ...others.filter((other) => other !== SKIN_SYSTEM),
        ...(others.includes(SKIN_SYSTEM) ? skinRecords : []),
        ...(o.hide ? o.hide.split(',') : []),
      ].join(',')
      return { name: `${prefix}${id}-${hpf}-lat${suffix}.png`, url: viewUrl(o, hpf, 'lat', hide), view: 'lat' as ViewParam }
    }),
  )
}

async function main(): Promise<number> {
  const opts = parseArgs(process.argv.slice(2))
  const outDir = resolve(opts.out)
  mkdirSync(outDir, { recursive: true })
  const distDir = join(outDir, 'dist')
  build(distDir)
  const { child, baseURL } = await startPreview(distDir, opts.port)
  const stop = () => { void stopPreview(child) }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  let failures = 0
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL_FLAGS })
  try {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, reducedMotion: 'reduce', baseURL })
    const page = await context.newPage()
    const list = shots(opts)
    for (const { name, url, view } of list) {
      const file = join(outDir, name)
      await page.goto(url)
      const ready = await waitForReady(page, 90_000)
      // The frame loop runs on demand: the label chips, the dissect follow and the camera glide
      // each need a frame or two after the ready flag, so settle before the shot.
      await page.waitForTimeout(SETTLE_MS)
      await page.screenshot({ path: file, fullPage: false })
      if (!ready) {
        failures++
        console.log(`${name}: NOT READY (no ${READY_SELECTOR})  ${url}`)
        continue
      }
      const canvas = page.locator('canvas').first()
      let stats = 'no canvas'
      if ((await canvas.count()) > 0) {
        // The dorsal larva is a thin bar (screenshot.ts); the e2e check uses the same lower fraction.
        const minChanged = view === 'dor' ? DORSAL_MIN_CHANGED_FRACTION : NON_BLANK.minChangedFraction
        const r = checkNonBlank(new Uint8Array(await canvas.screenshot()), minChanged)
        stats = `${r.ok ? 'ok' : 'BLANK'} stdDev ${r.stdDev.toFixed(1)} changed ${(100 * r.changedFraction).toFixed(1)}%`
      }
      console.log(`${name}: ${stats}  ${url}`)
    }
    console.log(`snap: ${list.length} views, ${failures} failures, written to ${outDir}`)
  } finally {
    await browser.close()
    await stopPreview(child)
  }
  return failures > 0 ? 1 : 0
}

main().then(
  (code) => process.exit(code),
  (e: unknown) => {
    console.error(`snap: ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  },
)
