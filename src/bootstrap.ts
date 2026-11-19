// App start-up (AR-07, AR-50) in two phases.
//
// `bootstrapShell` runs before the first render: it probes WebGL 2 and applies the URL, so the
// shell knows its mode, its theme and its time with no anatomy record parsed. `bootstrapData`
// then parses the bundled records, registers the growth table and applies the URL a second time,
// now against the ids the records define.
//
// Only the second phase imports src/data, so vite gives the records their own chunk with no
// `modulepreload` link (spec 2.9, the `atlas-data` group of vite.config.ts). The 173 kB gzip of
// JSON leaves the first download and the shell paints while it is still in flight. The viewer's
// `data-atlas-ready` attribute is unaffected: it turns true only after the first frame with
// final-tessellation structures, which cannot happen before the records arrive (QP-31).
//
// main.tsx calls both once; each function is idempotent so a test harness may call it too.
import { configureGrowth } from './core/growth.ts'
import { parseUrl } from './core/urlState.ts'
import type { UrlState } from './core/urlState.ts'
import { atlasStore } from './state/store.ts'
import type { AtlasStoreApi } from './state/store.ts'
import { probeWebgl2 } from './viewer/webgl.ts'

/** The warning both phases push when the link could not be applied (SEC-02). */
export const LINK_FAILED_WARNING = 'The link could not be read, so the atlas opened at its default view'

export interface BootstrapOptions {
  /** The query string to apply; defaults to location.search. */
  search?: string
  /** Skip the WebGL probe (tests). */
  probe?: boolean
}

let shellBooted = false
let dataBooted = false

function searchOf(opts: BootstrapOptions): string {
  return opts.search ?? (typeof location === 'undefined' ? '' : location.search)
}

/**
 * Applies a URL state and, when that throws, applies the defaults instead (SEC-02). Every
 * parameter passes a zod schema before it reaches the store, so a throw here means a defect
 * rather than a hostile link. The reader still gets the default view and a warning, because
 * phase 1 runs before React renders and an exception there leaves an empty document.
 */
function applyUrlOrDefaults(store: AtlasStoreApi, state: UrlState): void {
  try {
    store.getState().applyUrl(state)
  } catch (err) {
    console.error('[atlas] the link could not be applied', err)
    store.getState().applyUrl(parseUrl('').state)
    store.getState().pushWarning(LINK_FAILED_WARNING)
  }
}

/** Phase 1: the WebGL probe and the URL, with no record parsed. */
export function bootstrapShell(store: AtlasStoreApi = atlasStore, opts: BootstrapOptions = {}): void {
  if (shellBooted && store === atlasStore) return
  if (store === atlasStore) shellBooted = true
  const s = store.getState()
  if (opts.probe !== false && typeof document !== 'undefined') s.setWebgl(probeWebgl2() ? 'ok' : 'unavailable')
  // No id list yet, so `sel` and `hide` are applied as the link wrote them and phase 2 drops what
  // the atlas does not define. Nothing is on screen to select or hide until phase 2 lands.
  applyUrlOrDefaults(store, parseUrl(searchOf(opts)).state)
}

/**
 * Phase 2: parses the records, registers the growth table and re-applies the URL against the ids
 * they define. Returns true when the data parsed.
 */
export async function bootstrapData(store: AtlasStoreApi = atlasStore, opts: BootstrapOptions = {}): Promise<boolean> {
  if (dataBooted && store === atlasStore) return store.getState().data !== null
  if (store === atlasStore) dataBooted = true
  const { loadAtlasResult } = await import('./data/index.ts')
  const result = loadAtlasResult()
  // The growth table scales every body frame, so it is registered before the store publishes the data.
  if (result.ok) configureGrowth(result.data.stages.growth)
  store.getState().loadData(result)
  const data = store.getState().data
  if (!data) return false
  const { state, warnings } = parseUrl(searchOf(opts), {
    structureIds: data.structuresById.keys(),
    systemIds: data.systemsById.keys(),
  })
  applyUrlOrDefaults(store, state)
  for (const w of warnings) store.getState().pushWarning(w)
  return true
}
