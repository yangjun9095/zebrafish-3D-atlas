// One movie of the fish with one tissue lit in one reporter (D18 reporter preview).
//
//   node scripts/render-movie.ts --target ZFA:0000135 --slug notochord --reporter egfp
//        [--include-parts] [--from 0] [--to 48] [--lit-from N] [--lit-to N]
//        [--seconds 20] [--fps 30] [--width 1920] [--height 1080] [--context 24]
//        [--out DIR] [--port 4952] [--dist DIR] [--frames DIR] [--keep-frames]
//        [--credit TEXT] [--crf 18] [--ffmpeg PATH]
//        [--wildtype] [--invert] [--name FILE.mp4]
//   --wildtype lights no tissue (the preview with an empty rule list: every structure drawn as
//   faint context), --invert negates the frames so the dark preview reads as a bright-field view,
//   and --name overrides the <slug>_<REPORTER>.mp4 file name.
//
// It builds the app into `--dist` when that directory holds no index.html, serves it with
// `vite preview --strictPort`, opens one page at 1920 by 1080 in the system Chrome with the
// SwiftShader flags of screenshot.ts, and writes one PNG per frame. The URL carries the reporter
// preview (`?lab=1&embed=1&theme=dark&v=lat&fp=<token>`), so the scene draws the dark preview
// background and the faint fish context of src/core/fluorescence.ts.
//
// Two rules make the frames a movie instead of 600 unrelated screenshots:
//
//   1. Settling. Every frame waits until the rebuild driver reports `finalDrained` with an empty
//      queue, the store at the final tessellation level and no pending visual pass. That is the
//      condition src/viewer/export/exportPng.ts waits for before it renders a PNG, so a frame
//      never carries interactive tessellation or geometry from the hour before.
//   2. Camera. `followGrowth` refits on every time change and filters the camera toward the new
//      pose over FOLLOW_TAU_S, which reads as a lurch in a movie. This script turns the follow
//      off, measures the app's own fit at a few hours (CAMERA_KEY_HPF), and interpolates the
//      target, the view direction and the distance with a monotone cubic spline. It writes the
//      pose per frame through `setCameraPose`, which the camera rig applies in the same tick.
//
// The capture is a viewport screenshot, not the render-target export of AR-51: `exportPng` is a
// module function that the page never publishes, and driving the export dialog 600 times would
// cost a tiled 2x render and a PNG encode per frame. So the script hides every panel with one
// injected stylesheet, gives the canvas the whole 1920 by 1080 viewport, and draws the credit
// line itself as one DOM element. The overlay of the export path (readout, scale bar, legend,
// labels) is absent by construction.
//
// Exit 1 on a build failure, a preview that never answers, a frame that never settles, or an
// ffmpeg failure.
import { spawn, spawnSync } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'
import { REPORTERS } from '../src/core/fluorescence.ts'
import type { FluorescenceConfig, ReporterId } from '../src/core/fluorescence.ts'
import type { AtlasStore, CameraPose } from '../src/state/store.ts'
import { GL_FLAGS, waitForReady } from './screenshot.ts'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const viteBin = resolve(repoRoot, 'node_modules/vite/bin/vite.js')

/** Movies live outside the repository: a 20 second 1080p movie is 5 to 20 MB and git keeps none. */
export const DEFAULT_OUT_DIR = '/hpc/projects/data.science/yangjoon.kim/github_repos/zebrafish-3D-atlas-movies'
/** The credit line the movie carries, one small line in the bottom left corner. */
export const DEFAULT_CREDIT = 'Schematic model | data: ZFIN CC BY 4.0'
/** The hours the camera fit is measured at; every frame between two of them is interpolated. */
export const CAMERA_KEY_HPF: readonly number[] = [0, 6, 10, 16, 19, 24, 30, 36, 42, 48]
/** Longest wait for one frame to settle at the final tessellation level. */
export const FRAME_SETTLE_TIMEOUT_MS = 120_000
/** Longest wait for the first frame of a page, which builds every structure from scratch. */
export const READY_TIMEOUT_MS = 180_000

// ---- pure helpers ------------------------------------------------------------------------------

export type Vec3 = [number, number, number]

export function roundTo(value: number, places: number): number {
  const f = 10 ** places
  return Math.round(value * f) / f
}

/** Frames of a movie of `seconds` at `fps`, at least one. */
export function frameCount(seconds: number, fps: number): number {
  return Math.max(1, Math.round(seconds * fps))
}

/**
 * The hpf value of every frame: linear from `from` to `to` with both ends included, rounded to
 * the thousandth of an hour the body model memoises on (src/viewer/runtime.ts, frameAt).
 */
export function frameTimes(from: number, to: number, frames: number): number[] {
  if (frames <= 1) return [roundTo(from, 3)]
  const out: number[] = []
  for (let i = 0; i < frames; i++) out.push(roundTo(from + ((to - from) * i) / (frames - 1), 3))
  return out
}

/** `frame-000001.png`, so `ffmpeg -i frame-%06d.png` reads the frames in order. */
export function frameFileName(index: number): string {
  return `frame-${String(index + 1).padStart(6, '0')}.png`
}

/** `<slug>_<REPORTER>.mp4`, with the reporter's display name: `notochord_EGFP.mp4`. */
export function movieFileName(slug: string, reporter: ReporterId): string {
  return `${slug}_${REPORTERS[reporter].name}.mp4`
}

/** The reporter ids this build knows, read from REPORTERS so the table cannot drift. */
export function reporterIds(): ReporterId[] {
  return Object.keys(REPORTERS) as ReporterId[]
}

/** The reporter id, validated against REPORTERS at run time; null for an id this build lacks. */
export function parseReporter(raw: string): ReporterId | null {
  const id = raw.toLowerCase()
  return (reporterIds() as string[]).includes(id) ? (id as ReporterId) : null
}

/** The hours the camera fit is measured at inside `[from, to]`, both ends always included. */
export function keyframeHpf(from: number, to: number, keys: readonly number[] = CAMERA_KEY_HPF): number[] {
  const inside = keys.filter((h) => h > from && h < to)
  return [from, ...inside, to].filter((h, i, all) => i === 0 || h > all[i - 1])
}

/** One rule over one target for the whole lit window, on the dark preview background. */
export function fluorescenceConfigFor(input: {
  targetId: string
  reporter: ReporterId
  includeParts: boolean
  litFromHpf: number
  litToHpf: number
  context: number
  wildtype?: boolean
}): FluorescenceConfig {
  return {
    version: 1,
    enabled: true,
    channel: 'all',
    context: input.context,
    rules: input.wildtype ? [] : [{
      id: 'movie',
      targetId: input.targetId,
      includeParts: input.includeParts,
      fromHpf: roundTo(input.litFromHpf, 2),
      toHpf: roundTo(input.litToHpf, 2),
      reporter: input.reporter,
      enabled: true,
    }],
  }
}

/** The `fp` URL token: base64url JSON, the form src/state/slices/url.ts writes and reads. */
export function encodeFpToken(config: FluorescenceConfig): string {
  return Buffer.from(JSON.stringify(config), 'utf8').toString('base64url')
}

/** The page URL of a movie frame: lateral view, dark theme, embed mode, one reporter rule. */
export function movieUrl(input: { token: string; hpf: number }): string {
  const q = new URLSearchParams({
    t: String(roundTo(input.hpf, 2)),
    v: 'lat',
    theme: 'dark',
    embed: '1',
    lab: '1',
    labels: '0',
    fp: input.token,
  })
  return `/?${q.toString()}`
}

/** The H.264 encode of the owner's spec: CRF 18, yuv420p, faststart, no audio. */
export function ffmpegArgs(input: { framesDir: string; fps: number; out: string; crf?: number; invert?: boolean }): string[] {
  return [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-framerate', String(input.fps),
    '-i', join(input.framesDir, 'frame-%06d.png'),
    ...(input.invert ? ['-vf', 'negate'] : []),
    '-c:v', 'libx264',
    '-crf', String(input.crf ?? 18),
    '-preset', 'medium',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    '-r', String(input.fps),
    input.out,
  ]
}

// ---- monotone cubic interpolation ---------------------------------------------------------------

export interface Spline {
  xs: number[]
  ys: number[]
  /** Tangent per knot, limited by the Fritsch-Carlson condition so the curve never overshoots. */
  ms: number[]
}

/**
 * A monotone cubic Hermite spline through `(xs, ys)`. The camera distance grows by a factor of
 * ten between 0 and 48 hpf and grows faster in some hours than others; a plain Catmull-Rom
 * spline overshoots at those knots and pushes the fish out of frame for a few frames.
 */
export function monotoneSpline(xs: readonly number[], ys: readonly number[]): Spline {
  if (xs.length !== ys.length) throw new Error('monotoneSpline: xs and ys differ in length')
  if (xs.length === 0) throw new Error('monotoneSpline: needs at least one knot')
  const n = xs.length
  const ms = new Array<number>(n).fill(0)
  if (n === 1) return { xs: [...xs], ys: [...ys], ms }
  const delta: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i]
    if (!(dx > 0)) throw new Error('monotoneSpline: xs must increase')
    delta.push((ys[i + 1] - ys[i]) / dx)
  }
  ms[0] = delta[0]
  ms[n - 1] = delta[n - 2]
  for (let i = 1; i < n - 1; i++) ms[i] = (delta[i - 1] + delta[i]) / 2
  for (let i = 0; i < n - 1; i++) {
    if (delta[i] === 0) {
      ms[i] = 0
      ms[i + 1] = 0
      continue
    }
    const a = ms[i] / delta[i]
    const b = ms[i + 1] / delta[i]
    const s = a * a + b * b
    if (s > 9) {
      const tau = 3 / Math.sqrt(s)
      ms[i] = tau * a * delta[i]
      ms[i + 1] = tau * b * delta[i]
    }
  }
  return { xs: [...xs], ys: [...ys], ms }
}

/** The spline at `x`; the end value outside the knots. */
export function splineAt(spline: Spline, x: number): number {
  const { xs, ys, ms } = spline
  const n = xs.length
  if (n === 1 || x <= xs[0]) return ys[0]
  if (x >= xs[n - 1]) return ys[n - 1]
  let i = 0
  while (i < n - 2 && x >= xs[i + 1]) i++
  const h = xs[i + 1] - xs[i]
  const t = (x - xs[i]) / h
  const t2 = t * t
  const t3 = t2 * t
  const h00 = 2 * t3 - 3 * t2 + 1
  const h10 = t3 - 2 * t2 + t
  const h01 = -2 * t3 + 3 * t2
  const h11 = t3 - t2
  return h00 * ys[i] + h10 * h * ms[i] + h01 * ys[i + 1] + h11 * h * ms[i + 1]
}

export interface CameraKey { hpf: number; position: Vec3; target: Vec3 }

export interface PoseTrack {
  at(hpf: number): { position: Vec3; target: Vec3 }
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const length3 = (v: Vec3): number => Math.hypot(v[0], v[1], v[2])

/**
 * The camera pose at any hour between the measured keys. The target, the view direction and the
 * distance are interpolated on their own and the position is rebuilt from them, so the view
 * direction stays the lateral one instead of drifting as three independent position splines
 * would let it.
 */
export function poseTrack(keys: readonly CameraKey[]): PoseTrack {
  if (keys.length === 0) throw new Error('poseTrack: needs at least one key')
  const sorted = [...keys].sort((a, b) => a.hpf - b.hpf)
  const hs = sorted.map((k) => k.hpf)
  const dists = sorted.map((k) => Math.max(length3(sub(k.position, k.target)), 1e-9))
  const dirs = sorted.map((k, i) => {
    const d = sub(k.position, k.target)
    return [d[0] / dists[i], d[1] / dists[i], d[2] / dists[i]] as Vec3
  })
  const target = [0, 1, 2].map((axis) => monotoneSpline(hs, sorted.map((k) => k.target[axis])))
  const dir = [0, 1, 2].map((axis) => monotoneSpline(hs, dirs.map((d) => d[axis])))
  const dist = monotoneSpline(hs, dists)
  return {
    at(hpf) {
      const tgt: Vec3 = [splineAt(target[0], hpf), splineAt(target[1], hpf), splineAt(target[2], hpf)]
      const raw: Vec3 = [splineAt(dir[0], hpf), splineAt(dir[1], hpf), splineAt(dir[2], hpf)]
      const norm = Math.max(length3(raw), 1e-9)
      const d = Math.max(splineAt(dist, hpf), 1e-6)
      return {
        target: tgt,
        position: [tgt[0] + (raw[0] / norm) * d, tgt[1] + (raw[1] / norm) * d, tgt[2] + (raw[2] / norm) * d],
      }
    },
  }
}

// ---- options ------------------------------------------------------------------------------------

export interface MovieOptions {
  targetId: string
  slug: string
  reporter: ReporterId
  includeParts: boolean
  /** The movie time span in hpf. */
  fromHpf: number
  toHpf: number
  /** The window the rule lights the tissue in; the movie span by default. */
  litFromHpf: number
  litToHpf: number
  seconds: number
  fps: number
  width: number
  height: number
  context: number
  out: string
  framesDir: string | null
  keepFrames: boolean
  credit: string
  crf: number
  ffmpeg: string
  port: number
  dist: string
  wildtype: boolean
  invert: boolean
  name: string | null
}

export interface MovieResult {
  file: string
  slug: string
  targetId: string
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
  renderSeconds: number
  bytes: number
  sha256: string
}

const USAGE = [
  'usage: node scripts/render-movie.ts --target ZFA:0000135 --slug notochord --reporter egfp',
  '       [--include-parts] [--from 0] [--to 48] [--lit-from N] [--lit-to N]',
  '       [--seconds 20] [--fps 30] [--width 1920] [--height 1080] [--context 24]',
  '       [--out DIR] [--port 4952] [--dist DIR] [--frames DIR] [--keep-frames]',
  `       [--credit TEXT] [--crf 18] [--ffmpeg PATH]   reporters: ${reporterIds().join(', ')}`,
].join('\n')

function fail(message: string): never {
  console.error(`render-movie: ${message}`)
  console.error(USAGE)
  process.exit(2)
}

export function defaultDist(): string {
  return join(repoRoot, 'node_modules/.cache/atlas-movie-dist')
}

export function parseArgs(argv: string[]): MovieOptions {
  const raw: Record<string, string | boolean> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help' || a === '-h') {
      console.log(USAGE)
      process.exit(0)
    }
    if (!a.startsWith('--')) fail(`unexpected argument ${a}`)
    const key = a.slice(2)
    if (key === 'include-parts' || key === 'keep-frames' || key === 'wildtype' || key === 'invert') raw[key] = true
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
  const wildtype = raw.wildtype === true
  const name = typeof raw.name === 'string' ? raw.name : null
  if (name !== null && !/^[A-Za-z0-9][A-Za-z0-9._-]*\.mp4$/.test(name)) fail('--name must be a plain file name that ends in .mp4')
  const targetId = text('target', wildtype ? 'ZFA:0000135' : '')
  if (!/^ZFA:\d{7}$/.test(targetId)) fail('--target must be a ZFA id, for example ZFA:0000135')
  const slug = text('slug', wildtype ? 'wildtype' : '')
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) fail('--slug must be lower-case letters, digits and hyphens')
  const reporter = parseReporter(text('reporter', 'egfp'))
  if (!reporter) fail(`--reporter must be one of ${reporterIds().join(', ')}`)
  const fromHpf = num('from', 0)
  const toHpf = num('to', 48)
  if (!(toHpf > fromHpf)) fail('--to must be above --from')
  const fps = num('fps', 30)
  if (!(fps > 0 && fps <= 120)) fail('--fps must lie in 1 to 120')
  const seconds = num('seconds', 20)
  if (!(seconds > 0 && seconds <= 600)) fail('--seconds must lie above 0 and at or below 600')
  const width = num('width', 1920)
  const height = num('height', 1080)
  if (width % 2 !== 0 || height % 2 !== 0) fail('--width and --height must be even; H.264 yuv420p needs even edges')
  const context = num('context', 24)
  if (!(Number.isInteger(context) && context >= 0 && context <= 100)) fail('--context must be an integer in 0 to 100')
  const port = num('port', 4952)
  if (!(Number.isInteger(port) && port >= 1024 && port <= 65535)) fail('--port must be an integer in 1024 to 65535')
  const crf = num('crf', 18)
  if (!(Number.isInteger(crf) && crf >= 0 && crf <= 51)) fail('--crf must be an integer in 0 to 51')
  return {
    targetId,
    slug,
    reporter,
    includeParts: raw['include-parts'] === true,
    fromHpf,
    toHpf,
    litFromHpf: num('lit-from', fromHpf),
    litToHpf: num('lit-to', toHpf),
    seconds,
    fps,
    width,
    height,
    context,
    out: resolve(text('out', DEFAULT_OUT_DIR)),
    framesDir: typeof raw.frames === 'string' ? resolve(raw.frames) : null,
    keepFrames: raw['keep-frames'] === true,
    credit: text('credit', DEFAULT_CREDIT),
    crf,
    ffmpeg: text('ffmpeg', process.env.FFMPEG ?? 'ffmpeg'),
    port,
    dist: resolve(text('dist', defaultDist())),
    wildtype,
    invert: raw.invert === true,
    name,
  }
}

// ---- build, preview and browser -----------------------------------------------------------------

/** The build and the preview run without the fixture alias, whatever the caller's shell exports. */
function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  delete env.VITE_ATLAS_FIXTURE
  return env
}

/**
 * Builds the app into `distDir` unless it already holds an index.html. It refuses the repository's
 * own `dist/`, which `npm run gate` and the browser suite share (CONTRIBUTING.md).
 */
export function ensureDist(distDir: string): void {
  if (resolve(distDir) === join(repoRoot, 'dist')) throw new Error('--dist must not be the repository dist/; pick a directory of your own')
  if (existsSync(join(distDir, 'index.html'))) {
    console.log(`render-movie: reusing the build in ${distDir}`)
    return
  }
  mkdirSync(distDir, { recursive: true })
  console.log(`render-movie: vite build into ${distDir}`)
  const r = spawnSync(process.execPath, [viteBin, 'build', '--outDir', distDir, '--emptyOutDir'], {
    cwd: repoRoot, env: cleanEnv(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (r.status !== 0) {
    process.stdout.write(r.stdout ?? '')
    process.stderr.write(r.stderr ?? '')
    throw new Error(`vite build exited with ${r.status}`)
  }
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

async function serverUp(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

export interface Preview { child: ChildProcess; baseURL: string }

export async function startPreview(distDir: string, port: number): Promise<Preview> {
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

export async function stopPreview(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return
  child.kill('SIGTERM')
  for (let i = 0; i < 30 && child.exitCode === null && !child.killed; i++) await sleep(100)
  if (child.exitCode === null) child.kill('SIGKILL')
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ channel: 'chrome', headless: true, args: GL_FLAGS })
}

/**
 * Hides every panel and gives the canvas the whole viewport. The embed layout of styles.css
 * already drops the top bar and the rail; this also drops the 96 px timeline strip, the embed
 * footer, the info card, the preview chip and the toasts, so the frame holds the canvas alone.
 */
export const FRAME_CSS = [
  '.app { --time-h: 0px !important; grid-template-rows: minmax(0, 1fr) 0px !important; grid-template-areas: "viewer" "time" !important; padding: 0 !important; }',
  '.app > *:not(.app-viewer) { display: none !important; }',
  '.app-viewer > *:not(.atlas-viewer) { display: none !important; }',
  '[data-testid="viewer-loading"] { display: none !important; }',
].join('\n')

const CREDIT_STYLE = [
  'position:fixed', 'left:26px', 'bottom:20px', 'z-index:2147483647', 'pointer-events:none',
  'color:rgba(231,234,238,0.72)', 'letter-spacing:0.01em',
  'font:400 15px/1.3 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  'text-shadow:0 1px 2px rgba(0,0,0,0.85)',
].join(';')

/** Applies the frame stylesheet, draws the credit line and waits for the canvas to fill the viewport. */
async function preparePage(page: Page, o: MovieOptions): Promise<void> {
  await page.addStyleTag({ content: FRAME_CSS })
  if (o.credit) {
    await page.evaluate((input) => {
      const el = document.createElement('div')
      el.id = 'atlas-movie-credit'
      el.textContent = input.credit
      el.setAttribute('style', input.style)
      document.body.appendChild(el)
    }, { credit: o.credit, style: CREDIT_STYLE })
  }
  await page.evaluate(() => {
    const store = window.__atlasDebug?.state() as unknown as AtlasStore | undefined
    // The follow-growth filter of UX-IN-12 refits on every time change and glides toward the new
    // pose; this script sets the pose itself, per frame.
    store?.setFollowGrowth(false)
  })
  await page.waitForFunction(
    (want) => {
      const canvas = document.querySelector('canvas')
      return canvas !== null && canvas.clientWidth >= want.w - 2 && canvas.clientHeight >= want.h - 2
    },
    { w: o.width, h: o.height },
    { timeout: 30_000 },
  )
}

/**
 * Waits until the frame on screen matches the time that was set: the queue empty, a final-level
 * drain behind it, the store at the final level and the visual pass applied. It is the condition
 * `waitForFinal` in src/viewer/export/exportPng.ts holds an export back for.
 */
async function waitForSettled(page: Page, timeoutMs: number): Promise<void> {
  await page.waitForFunction(
    () => {
      const dbg = window.__atlasDebug
      if (!dbg) return false
      const rt = dbg.runtime
      const s = dbg.state() as { tessellation?: string }
      if (!rt.ready || !rt.finalDrained || rt.visualDirty || rt.queue.size() > 0) {
        rt.invalidate()
        return false
      }
      return s.tessellation === 'final'
    },
    undefined,
    { timeout: timeoutMs, polling: 50 },
  )
}

/** Sets the camera pose and the time in one round trip, and clears the settled flag first. */
async function setFrameState(page: Page, hpf: number, pose: { position: Vec3; target: Vec3 } | null): Promise<void> {
  await page.evaluate((input) => {
    const dbg = window.__atlasDebug
    if (!dbg) throw new Error('window.__atlasDebug is missing; the viewer is not mounted')
    const store = dbg.state() as unknown as AtlasStore
    if (input.pose) store.setCameraPose(input.pose as CameraPose, { manual: true })
    dbg.runtime.finalDrained = false
    store.setTime(input.hpf)
    dbg.runtime.invalidate()
  }, { hpf, pose })
}

/**
 * The app's own fit at every keyframe hour. `setViewPreset` bumps `fitRequest`, which the camera
 * rig answers with the projected-box fit of src/viewer/fit.ts and writes back to the store, and
 * the reduced-motion context of this browser skips the tween, so the pose is readable in the same
 * tick. The fit reads the body frame, not the built geometry, so it needs no settled frame.
 */
async function measureCameraKeys(page: Page, hours: readonly number[]): Promise<CameraKey[]> {
  const keys: CameraKey[] = []
  for (const hpf of hours) {
    const pose = await page.evaluate((t) => {
      const dbg = window.__atlasDebug
      if (!dbg) throw new Error('window.__atlasDebug is missing; the viewer is not mounted')
      const store = dbg.state() as unknown as AtlasStore
      store.setTime(t)
      store.setViewPreset('lateral')
      const after = dbg.state() as unknown as AtlasStore
      const cam = after.camera
      return cam ? { position: [...cam.position], target: [...cam.target] } : null
    }, hpf)
    if (!pose || pose.position.length !== 3 || pose.target.length !== 3) {
      throw new Error(`the camera rig wrote no pose at ${hpf} hpf`)
    }
    keys.push({ hpf, position: pose.position as Vec3, target: pose.target as Vec3 })
  }
  return keys
}

function runFfmpeg(o: MovieOptions, framesDir: string, outFile: string): void {
  const args = ffmpegArgs({ framesDir, fps: o.fps, out: outFile, crf: o.crf, invert: o.invert })
  const r = spawnSync(o.ffmpeg, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  if (r.error) throw new Error(`${o.ffmpeg} did not run: ${r.error.message}`)
  if (r.status !== 0) throw new Error(`${o.ffmpeg} exited with ${r.status}\n${r.stderr ?? ''}`)
}

async function sha256Of(file: string): Promise<string> {
  return createHash('sha256').update(await readFile(file)).digest('hex')
}

export interface RenderEnv {
  baseURL: string
  browser: Browser
}

/**
 * Renders one movie. With `env` it uses the caller's preview and browser and opens one page of its
 * own; without one it builds, serves, launches and tears every part down again.
 */
export async function renderMovie(o: MovieOptions, env?: RenderEnv): Promise<MovieResult> {
  const config = fluorescenceConfigFor({
    targetId: o.targetId,
    reporter: o.reporter,
    includeParts: o.includeParts,
    litFromHpf: o.litFromHpf,
    litToHpf: o.litToHpf,
    context: o.context,
    wildtype: o.wildtype,
  })
  const name = o.name ?? movieFileName(o.slug, o.reporter)
  const outFile = join(o.out, name)
  // One frames directory per process: two runs of the same movie (a resubmitted array task next
  // to a still-running one) must not delete each other's frames.
  const framesDir = o.framesDir ?? join(o.out, '.frames', `${name.replace(/\.mp4$/, '')}-${process.pid}`)
  const frames = frameCount(o.seconds, o.fps)
  const times = frameTimes(o.fromHpf, o.toHpf, frames)
  mkdirSync(o.out, { recursive: true })
  rmSync(framesDir, { recursive: true, force: true })
  mkdirSync(framesDir, { recursive: true })

  let preview: Preview | null = null
  let browser: Browser | null = null
  const started = Date.now()
  try {
    let baseURL = env?.baseURL
    if (!baseURL) {
      ensureDist(o.dist)
      preview = await startPreview(o.dist, o.port)
      baseURL = preview.baseURL
    }
    browser = env?.browser ?? (await launchBrowser())
    const context = await browser.newContext({
      viewport: { width: o.width, height: o.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      baseURL,
    })
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    try {
      await page.goto(movieUrl({ token: encodeFpToken(config), hpf: o.fromHpf }))
      if (!(await waitForReady(page, READY_TIMEOUT_MS))) throw new Error('the viewer never reported its first frame')
      await preparePage(page, o)
      const keys = await measureCameraKeys(page, keyframeHpf(o.fromHpf, o.toHpf))
      const track = poseTrack(keys)
      console.log(`render-movie: ${name}, ${frames} frames, camera fitted at ${keys.map((k) => k.hpf).join(', ')} hpf`)
      let slowest = 0
      for (let i = 0; i < frames; i++) {
        const frameStart = Date.now()
        await setFrameState(page, times[i], track.at(times[i]))
        await waitForSettled(page, FRAME_SETTLE_TIMEOUT_MS)
        await page.screenshot({ path: join(framesDir, frameFileName(i)), fullPage: false })
        const ms = Date.now() - frameStart
        slowest = Math.max(slowest, ms)
        if (i === 0 || (i + 1) % 50 === 0 || i === frames - 1) {
          const perFrame = (Date.now() - started) / 1000 / (i + 1)
          console.log(`render-movie: ${name} frame ${i + 1}/${frames} at ${times[i]} hpf, ${(ms / 1000).toFixed(2)} s, ${perFrame.toFixed(2)} s/frame`)
        }
      }
      console.log(`render-movie: ${name} slowest frame ${(slowest / 1000).toFixed(2)} s`)
      if (errors.length > 0) throw new Error(`the page raised ${errors.length} error(s): ${errors.join(' | ')}`)
    } finally {
      await context.close()
    }
    const renderSeconds = (Date.now() - started) / 1000
    runFfmpeg(o, framesDir, outFile)
    const result: MovieResult = {
      file: outFile,
      slug: o.slug,
      targetId: o.targetId,
      reporter: o.reporter,
      reporterName: REPORTERS[o.reporter].name,
      frames,
      fps: o.fps,
      seconds: frames / o.fps,
      width: o.width,
      height: o.height,
      fromHpf: o.fromHpf,
      toHpf: o.toHpf,
      litFromHpf: o.litFromHpf,
      litToHpf: o.litToHpf,
      secondsPerFrame: roundTo(renderSeconds / frames, 3),
      renderSeconds: roundTo(renderSeconds, 1),
      bytes: statSync(outFile).size,
      sha256: await sha256Of(outFile),
    }
    if (!o.keepFrames) rmSync(framesDir, { recursive: true, force: true })
    else console.log(`render-movie: frames kept in ${framesDir}`)
    return result
  } finally {
    if (!env?.browser && browser) await browser.close()
    if (preview) await stopPreview(preview.child)
  }
}

async function main(): Promise<number> {
  const o = parseArgs(process.argv.slice(2))
  const result = await renderMovie(o)
  console.log(
    `render-movie: ${result.file}\n` +
    `  ${result.frames} frames at ${result.fps} fps (${result.seconds.toFixed(2)} s), ${result.width}x${result.height}\n` +
    `  ${result.fromHpf} to ${result.toHpf} hpf, ${result.reporterName} on ${result.targetId}\n` +
    `  ${(result.bytes / 1e6).toFixed(2)} MB, ${result.secondsPerFrame.toFixed(2)} s/frame, sha256 ${result.sha256}`,
  )
  return 0
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().then(
    (code) => process.exit(code),
    (e: unknown) => {
      console.error(`render-movie: ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    },
  )
}
