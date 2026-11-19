// localStorage persistence: theme, units, snap, labels, the panel layout, the first-run flag and the
// user's slide kits. Every access is wrapped in try/catch; a missing or throwing storage is a no-op.
// Embed mode never writes (AR-62).
import type { AtlasStoreApi } from './slices/compose.ts'
import { KitJson, kitWithBookmarks, normalizeBookmark } from './slices/mode.ts'
import type { AtlasState, SlideKit, Theme, Units } from './slices/types.ts'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface PersistedSettings {
  theme?: Theme
  units?: Units
  snap?: boolean
  labels?: boolean
}

export interface PersistedLayout {
  railWidth?: number
  cardWidth?: number
  railCollapsed?: boolean
  treeExpanded?: string[]
}

const SETTINGS_KEY = 'zfatlas:settings:v1'
/** The theme key that index.html reads before first paint (src/ui/hooks/useTheme.ts writes it). */
const THEME_KEY = 'zfatlas.theme'
const LAYOUT_KEY = 'zfatlas:layout:v1'
const FIRST_RUN_KEY = 'zfatlas:firstRunDone:v1'
const KITS_KEY = 'zfatlas:kits:v1'

const THEMES: readonly Theme[] = ['dark', 'light']
const UNITS: readonly Units[] = ['hpf', 'dpf', 'auto']

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

function readJson<T extends object>(key: string, storage: StorageLike | null): Partial<T> {
  try {
    const raw = storage?.getItem(key)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Partial<T>) : {}
  } catch {
    return {}
  }
}

function writeJson(key: string, value: object, storage: StorageLike | null): void {
  try {
    storage?.setItem(key, JSON.stringify(value))
  } catch {
    // Storage is full, blocked, or absent.
  }
}

/** The stored settings, with every value checked against its allowed set. */
export function readSettings(storage: StorageLike | null = defaultStorage()): PersistedSettings {
  const raw = readJson<PersistedSettings>(SETTINGS_KEY, storage)
  const out: PersistedSettings = {}
  if (raw.theme && THEMES.includes(raw.theme)) out.theme = raw.theme
  else {
    try {
      const t = storage?.getItem(THEME_KEY) as Theme | null | undefined
      if (t && THEMES.includes(t)) out.theme = t
    } catch {
      // No storage.
    }
  }
  if (raw.units && UNITS.includes(raw.units)) out.units = raw.units
  if (typeof raw.snap === 'boolean') out.snap = raw.snap
  if (typeof raw.labels === 'boolean') out.labels = raw.labels
  return out
}

export function writeSettings(patch: PersistedSettings, storage: StorageLike | null = defaultStorage()): void {
  writeJson(SETTINGS_KEY, { ...readSettings(storage), ...patch }, storage)
}

/** The theme the OS prefers; dark when no media query is available (UX-US-06). */
export function systemTheme(): Theme {
  try {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
  } catch {
    // No media query support.
  }
  return 'dark'
}

/** Initial store fields from storage: the stored theme, else the system theme; units, snap, labels. */
export function initialSettings(storage: StorageLike | null = defaultStorage()): Partial<AtlasState> {
  const stored = readSettings(storage)
  const init: Partial<AtlasState> = stored.theme
    ? { theme: stored.theme, themeSource: 'stored' }
    : { theme: systemTheme(), themeSource: 'system' }
  if (stored.units) init.units = stored.units
  if (stored.snap !== undefined) init.snap = stored.snap
  if (stored.labels !== undefined) init.labels = stored.labels
  return init
}

/** Writes theme (user choice only), units, snap and labels as they change. Returns the unsubscribe. */
export function attachPersistence(store: AtlasStoreApi, storage: StorageLike | null = defaultStorage()): () => void {
  return store.subscribe((s, prev) => {
    if (s.embed) return
    const patch: PersistedSettings = {}
    if (s.theme !== prev.theme && s.themeSource === 'user') patch.theme = s.theme
    if (s.units !== prev.units) patch.units = s.units
    // Presentation mode forces snap on and labels off (AR-59); those forced values are not a preference.
    if (s.snap !== prev.snap && !s.presentation) patch.snap = s.snap
    if (s.labels !== prev.labels && !s.presentation) patch.labels = s.labels
    if (Object.keys(patch).length > 0) writeSettings(patch, storage)
  })
}

export function readLayout(storage: StorageLike | null = defaultStorage()): PersistedLayout {
  return readJson<PersistedLayout>(LAYOUT_KEY, storage)
}

export function writeLayout(patch: PersistedLayout, storage: StorageLike | null = defaultStorage()): void {
  writeJson(LAYOUT_KEY, { ...readLayout(storage), ...patch }, storage)
}

export function isFirstRun(storage: StorageLike | null = defaultStorage()): boolean {
  try {
    return storage?.getItem(FIRST_RUN_KEY) !== '1'
  } catch {
    return false
  }
}

export function markFirstRunDone(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.setItem(FIRST_RUN_KEY, '1')
  } catch {
    // Absent storage: the hint shows again next time.
  }
}

/** The stored record as written, without validation. Only the two writers read this form. */
function readRawKits(storage: StorageLike | null): Record<string, unknown> {
  return readJson<Record<string, unknown>>(KITS_KEY, storage)
}

const warnedKits = new Set<string>()

/**
 * The stored kits, each checked against the kit JSON schema of ./slices/mode.ts. A kit written by
 * a newer build, truncated by a full disk, or edited by hand is dropped with one warning, so no
 * caller of readKit ever receives a shape the viewer then fails to read. The warning fires once per
 * id per session, because the kit sheet reads this record on every open.
 */
export function readKits(storage: StorageLike | null = defaultStorage()): Record<string, SlideKit> {
  const out: Record<string, SlideKit> = {}
  for (const [id, value] of Object.entries(readRawKits(storage))) {
    const parsed = KitJson.safeParse(value)
    if (!parsed.success) {
      if (!warnedKits.has(id)) {
        warnedKits.add(id)
        console.warn(`[atlas] the stored slide kit "${id}" could not be read and was skipped`)
      }
      continue
    }
    const { name, bookmarks, index } = parsed.data
    out[id] = kitWithBookmarks({ id: parsed.data.id ?? id, name, bookmarks: [], index: 0 }, bookmarks.map(normalizeBookmark), index ?? 0)
  }
  return out
}

export function readKit(id: string, storage: StorageLike | null = defaultStorage()): SlideKit | null {
  return readKits(storage)[id] ?? null
}

/** Merges onto the raw record, so saving one kit never deletes a stored kit this build cannot read. */
export function writeKit(kit: SlideKit, storage: StorageLike | null = defaultStorage()): void {
  writeJson(KITS_KEY, { ...readRawKits(storage), [kit.id]: kit }, storage)
}

export function deleteKit(id: string, storage: StorageLike | null = defaultStorage()): void {
  const kits = readRawKits(storage)
  delete kits[id]
  writeJson(KITS_KEY, kits, storage)
}
