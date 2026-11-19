// Settings store (spec 5.6 UI-27, 5.8): the preferences that the atlas store does not hold, the sex
// view for the gonad handoff (D9) and the persistence of the preferences that neither the URL nor
// persist.ts carries. It is a small vanilla store beside the atlas store, not a slice of it, so the
// store shape of section 2.4 stays as WP-08 froze it.
import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'
import type { PaletteMode } from '../../core/palette.ts'
import type { AtlasStoreApi } from './compose.ts'
import type { AtlasState, Sex } from './types.ts'
import type { StorageLike } from '../persist.ts'
import { atlasStore } from '../store.ts'

export type { PaletteMode } from '../../core/palette.ts'
export { OKABE_ITO_BY_SYSTEM } from '../../core/palette.ts'
/** female and male drive the D9 gonad handoff; both draws every sex-specific record. */
export type SexView = Sex

export interface SettingsState { palette: PaletteMode; sex: SexView }
export interface SettingsActions { setPalette(p: PaletteMode): void; setSex(s: SexView): void }
export type SettingsStore = SettingsState & SettingsActions

export const PREFS_KEY = 'zfatlas:prefs:v1'
export const PALETTE_ATTRIBUTE = 'data-palette'

/** The atlas store fields that live only in localStorage (persist.ts owns theme, units, snap, labels). */
const PREF_FIELDS = ['reducedMotion', 'stripPosition', 'quality', 'followGrowth', 'keepDorsalUp', 'jumpOnSelect'] as const
type PrefField = (typeof PREF_FIELDS)[number]
export type StoredPrefs = Partial<Pick<AtlasState, PrefField>> & { palette?: PaletteMode }

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function readPrefs(storage: StorageLike | null = defaultStorage()): StoredPrefs {
  try {
    const raw = storage?.getItem(PREFS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return {}
    const p = parsed as Record<string, unknown>
    const out: StoredPrefs = {}
    if (p.palette === 'atlas' || p.palette === 'okabeIto') out.palette = p.palette
    if (p.stripPosition === 'bottom' || p.stripPosition === 'top') out.stripPosition = p.stripPosition
    if (p.quality === 'standard' || p.quality === 'presentation') out.quality = p.quality
    for (const f of ['reducedMotion', 'followGrowth', 'keepDorsalUp', 'jumpOnSelect'] as const) {
      if (typeof p[f] === 'boolean') out[f] = p[f] as boolean
    }
    return out
  } catch {
    return {}
  }
}

export function writePrefs(patch: StoredPrefs, storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(storage), ...patch }))
  } catch {
    // Storage is full, blocked, or absent.
  }
}

/** The sex the atlas store passes to presence. */
function sexOf(atlas: AtlasStoreApi): SexView {
  return atlas.getState().sex
}

/** Applies the store palette to the root attribute that styles.css keys the `--sys-*` tokens on. */
export function applyPaletteAttribute(palette: PaletteMode): void {
  if (typeof document === 'undefined') return
  if (palette === 'atlas') document.documentElement.removeAttribute(PALETTE_ATTRIBUTE)
  else document.documentElement.setAttribute(PALETTE_ATTRIBUTE, 'okabe-ito')
}

export function createSettingsStore(atlas: AtlasStoreApi, init: Partial<SettingsState> = {}) {
  const store = createStore<SettingsStore>()(
    subscribeWithSelector((set, get) => ({
      palette: 'atlas',
      sex: sexOf(atlas),
      ...init,
      setPalette(p) {
        if (p !== get().palette) set({ palette: p })
      },
      setSex(s) {
        atlas.getState().setSex(s)
      },
    })),
  )
  atlas.subscribe((s) => s.sex, () => {
    const sex = sexOf(atlas)
    if (sex !== store.getState().sex) store.setState({ sex })
  })
  return store
}
export type SettingsStoreApi = ReturnType<typeof createSettingsStore>

/**
 * Applies the stored preferences through the atlas actions and writes them back as they change.
 * Embed mode never writes (AR-62); values forced by presentation mode are not preferences (AR-59).
 */
export function attachPrefs(atlas: AtlasStoreApi, settings: SettingsStoreApi, storage: StorageLike | null = defaultStorage()): () => void {
  const stored = readPrefs(storage)
  const a = atlas.getState()
  if (stored.palette) settings.getState().setPalette(stored.palette)
  if (stored.reducedMotion !== undefined) a.setReducedMotion(stored.reducedMotion)
  if (stored.stripPosition) a.setStripPosition(stored.stripPosition)
  if (stored.quality) a.setQuality(stored.quality)
  if (stored.followGrowth !== undefined) a.setFollowGrowth(stored.followGrowth)
  if (stored.keepDorsalUp !== undefined) a.setKeepDorsalUp(stored.keepDorsalUp)
  if (stored.jumpOnSelect !== undefined && !a.presentation) a.setJumpOnSelect(stored.jumpOnSelect)
  const unsubAtlas = atlas.subscribe((s, prev) => {
    if (s.embed) return
    const patch: StoredPrefs = {}
    for (const f of PREF_FIELDS) {
      if (s[f] === prev[f]) continue
      if (f === 'jumpOnSelect' && s.presentation) continue
      ;(patch as Record<string, unknown>)[f] = s[f]
    }
    if (Object.keys(patch).length > 0) writePrefs(patch, storage)
  })
  const unsubPalette = settings.subscribe((s) => s.palette, (palette) => {
    applyPaletteAttribute(palette)
    if (!atlas.getState().embed) writePrefs({ palette }, storage)
  }, { fireImmediately: true })
  return () => {
    unsubAtlas()
    unsubPalette()
  }
}

/** The settings store bound to the app store. */
export const settingsStore: SettingsStoreApi = createSettingsStore(atlasStore)

let attached: (() => void) | null = null
/** Applies the stored preferences and starts writing changes; idempotent (App.tsx calls it on mount). */
export function initSettings(): void {
  attached ??= attachPrefs(atlasStore, settingsStore)
}
