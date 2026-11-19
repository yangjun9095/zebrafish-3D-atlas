// URL sync (AR-48, AR-49, UI-34, UX-EX-08, UX-EX-09): writes the serialised store subset to the
// address bar with history.replaceState, at most once per 300 ms while the state keeps changing
// and once more when it settles. Never pushState. Embed mode never writes (AR-62). Also builds
// the share links of the share dialog: the full state, the nearest preset when the camera is
// left out, and the link to a structure that opens on a fully visible structure.
import { firstFullyVisibleHpf, presenceAt } from '../core/presence.ts'
import { serializeUrl } from '../core/urlState.ts'
import type { UrlState, ViewParam } from '../core/urlState.ts'
import type { AtlasStoreApi } from './slices/compose.ts'
import type { CameraPose } from './slices/types.ts'

export const URL_SYNC_THROTTLE_MS = 300
/** Longest wait after replaceState threw (Safari rate-limits it to 100 calls per 30 s). */
export const URL_SYNC_MAX_BACKOFF_MS = 5000

export interface UrlSyncOptions {
  throttleMs?: number
  history?: Pick<History, 'replaceState' | 'state'>
  location?: Pick<Location, 'pathname' | 'search' | 'hash'>
}

/** The query string the store produces now, without the leading "?". */
export function currentQuery(store: AtlasStoreApi): string {
  return serializeUrl(store.getState().toUrl())
}

/** Starts the subscription; returns a function that stops it and drops a pending write. */
export function startUrlSync(store: AtlasStoreApi, opts: UrlSyncOptions = {}): () => void {
  const throttleMs = opts.throttleMs ?? URL_SYNC_THROTTLE_MS
  const history = opts.history ?? (typeof window === 'undefined' ? null : window.history)
  const loc = opts.location ?? (typeof window === 'undefined' ? null : window.location)
  if (!history || !loc) return () => {}

  let last = -Infinity
  let timer: ReturnType<typeof setTimeout> | null = null
  let written = loc.search.replace(/^\?/, '')
  let wait = throttleMs

  const write = (): void => {
    timer = null
    last = Date.now()
    if (store.getState().embed) return
    const query = currentQuery(store)
    if (query === written) return
    try {
      history.replaceState(history.state, '', `${loc.pathname}${query ? `?${query}` : ''}${loc.hash}`)
      written = query
      wait = throttleMs
    } catch {
      // Rate limited: back off and try again; the store keeps changing, so a later write catches up.
      wait = Math.min(wait * 2, URL_SYNC_MAX_BACKOFF_MS)
      schedule()
    }
  }

  const schedule = (): void => {
    if (timer !== null) return
    timer = setTimeout(write, Math.max(0, wait - (Date.now() - last)))
  }

  const unsubscribe = store.subscribe(schedule)
  schedule()
  return () => {
    unsubscribe()
    if (timer !== null) clearTimeout(timer)
    timer = null
  }
}

// Share links (UI-34, UX-EX-09) --------------------------------------------------------

/**
 * Camera direction of each preset in the D4 axes (+x posterior, +y dorsal, +z left); the same
 * table as src/viewer/presets.ts, kept here so the state layer imports no viewer module.
 * tests/unit/export.test.ts asserts the two agree.
 */
export const PRESET_PARAM_DIRECTIONS: Record<ViewParam, [number, number, number]> = {
  lat: [0, 0, 1],
  dor: [0, 1, 0],
  ven: [0, -1, 0],
  ant: [-1, 0, 0],
  pos: [1, 0, 0],
  tq: [-0.45, 0.35, 0.82],
}

/** The preset whose camera direction is closest to the pose's direction from its target. */
export function nearestPresetParam(pose: CameraPose): ViewParam {
  const d = [pose.position[0] - pose.target[0], pose.position[1] - pose.target[1], pose.position[2] - pose.target[2]]
  const n = Math.hypot(d[0], d[1], d[2]) || 1
  let best: ViewParam = 'lat'
  let bestDot = -Infinity
  for (const [key, v] of Object.entries(PRESET_PARAM_DIRECTIONS) as [ViewParam, [number, number, number]][]) {
    const m = Math.hypot(v[0], v[1], v[2])
    const dot = (d[0] * v[0] + d[1] * v[1] + d[2] * v[2]) / (n * m)
    if (dot > bestDot) {
      bestDot = dot
      best = key
    }
  }
  return best
}

export interface ShareOptions {
  /** "Include camera" (UI-34). Default true. Off gives the nearest preset as `v`. */
  includeCamera?: boolean
  /** "Include theme" (UI-34). Default true: every copied link carries the theme (AR-49). */
  includeTheme?: boolean
  /** "Copy link to structure" (UX-EX-09): the link selects this structure and opens on it fully visible. */
  structureId?: string
}

/** The UrlState of a share link. */
export function shareState(store: AtlasStoreApi, opts: ShareOptions = {}): UrlState {
  const s = store.getState()
  const includeCamera = opts.includeCamera ?? true
  const state = s.toUrl({ includeCamera, includeTheme: opts.includeTheme ?? true })
  if (!includeCamera && s.viewPreset === 'free' && s.camera) state.v = nearestPresetParam(s.camera)
  if (opts.structureId) {
    const record = s.data?.structuresById.get(opts.structureId)
    state.sel = opts.structureId.replace(/^ZFA:/, '')
    // A link to a record is a record link: the vocabulary term of D17 does not travel with it.
    delete state.term
    if (record && presenceAt(record, s.time, { sex: s.sex }).phase !== 'full') {
      state.t = Number(firstFullyVisibleHpf(record).toFixed(2))
    }
  }
  return state
}

/** The absolute URL of a share state: `base` defaults to the page origin and path. */
export function shareUrlFromState(state: UrlState, base?: string): string {
  // file: pages have origin "null". Keep their actual URL so an offline preview can reopen.
  const root = base ?? (typeof location === 'undefined' ? '' : location.href.split(/[?#]/)[0])
  const query = serializeUrl(state)
  return query ? `${root}?${query}` : root
}

/** The absolute share URL of the store now. */
export function shareUrl(store: AtlasStoreApi, opts: ShareOptions = {}, base?: string): string {
  return shareUrlFromState(shareState(store, opts), base)
}
