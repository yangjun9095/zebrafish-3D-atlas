// Mode slice: presentation and embed modes, sex toggle, projector settings, black screen, and the
// slide kit (spec 5.12, AR-60): capture, apply with the 600 ms time and 500 ms camera motion of
// UX-EX-14, the pure edit helpers of the kit sheet, and the kit JSON form.
import { z } from 'zod'
import { FluorescenceConfig } from '../../core/fluorescence.ts'
import { Bookmark as BookmarkSchema, VIEW_PRESETS } from '../../core/schema/body.ts'
import type { AtlasStore, Bookmark, BookmarkMotion, CameraPose, Get, ModeActions, ModeState, Set, SlideKit, StoreDeps, ZfaId } from './types.ts'
import { SECTION_OFF } from './types.ts'
import { clampTime, refreshDerived } from './time.ts'
import { encodeBase64Url } from './url.ts'

export const BOOKMARK_TIME_MS = 600
export const BOOKMARK_CAMERA_MS = 500
/** A kit above this many base64url characters ships as a file, not a link (UI-38). */
export const KIT_LINK_MAX_CHARS = 2048

export function newKitId(): string {
  return `kit_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** Splits bookmark hide tokens (the URL form: system ids or 7-digit ZFA numbers). */
export function splitHideTokens(tokens: readonly string[]): { systems: string[]; structures: ZfaId[] } {
  const systems: string[] = []
  const structures: ZfaId[] = []
  for (const tok of tokens) {
    if (/^\d{7}$/.test(tok)) structures.push(`ZFA:${tok}`)
    else systems.push(tok)
  }
  return { systems, structures }
}

/** A bookmark with any field missing: a compact starter row or a hand-written link. */
export type BookmarkLike = Partial<Omit<Bookmark, 'sel'>> & { sel?: readonly string[] }

/**
 * Fills the defaults of spec 2.4 so every consumer sees a complete bookmark.
 *
 * The function is total. A `fluorescence` field this build cannot read is dropped, the way
 * decodeFluorescence in ./url.ts drops an unreadable `fp` token, so a kit written by a newer build
 * or edited by hand still opens instead of throwing inside the click handler that loads it.
 */
export function normalizeBookmark(b: BookmarkLike): Bookmark {
  const parsed = b.fluorescence === undefined ? null : FluorescenceConfig.safeParse(b.fluorescence)
  return {
    name: b.name && b.name.length > 0 ? b.name : 'Bookmark',
    t: clampTime(b.t ?? 24),
    view: b.view ?? 'lateral',
    cam: b.cam ? { position: [...b.cam.position], target: [...b.cam.target] } : null,
    sel: (b.sel ?? []).map((id) => (id.startsWith('ZFA:') ? id : `ZFA:${id}`) as ZfaId),
    hide: [...(b.hide ?? [])],
    xr: b.xr ?? 60,
    sec: b.sec ? { ...b.sec } : { ...SECTION_OFF },
    iso: b.iso ?? false,
    labels: b.labels ?? false,
    notes: b.notes ?? '',
    ...(parsed?.success ? { fluorescence: parsed.data } : {}),
  }
}

/**
 * The live view as a bookmark.
 *
 * `fluorescence` rides along only when the preview is on or the reader has authored a rule. An
 * empty config in every bookmark costs about 70 characters a slide and pushes a kit over
 * KIT_LINK_MAX_CHARS for nothing. The test reads the config alone and never compares it with the
 * previous bookmark, so one bookmark means the same thing whatever its neighbours hold and an
 * edit to slide 2 cannot change what slide 3 restores.
 */
export function captureBookmark(s: AtlasStore, name?: string): Bookmark {
  const count = s.kit?.bookmarks.length ?? 0
  const fp = s.fluorescence
  const carriesFluorescence = fp.enabled || fp.rules.length > 0
  return {
    name: name ?? `Bookmark ${count + 1}`,
    t: s.time,
    view: s.viewPreset,
    cam: s.viewPreset === 'free' ? s.camera : null,
    sel: [...s.selection],
    hide: [...s.hiddenSystems, ...s.hiddenStructures.map((id) => id.slice(4))],
    xr: s.xray,
    sec: { ...s.section },
    iso: s.isolate,
    labels: s.labels,
    notes: '',
    ...(carriesFluorescence ? { fluorescence: { ...fp, rules: fp.rules.map((r) => ({ ...r })) } } : {}),
  }
}

// ---- edit helpers (pure; the kit sheet writes the result with setState) -------------------------

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const out = [...items]
  if (from < 0 || from >= out.length || to < 0 || to >= out.length || from === to) return out
  const [item] = out.splice(from, 1)
  out.splice(to, 0, item)
  return out
}

export function removeItem<T>(items: readonly T[], index: number): T[] {
  return items.filter((_, i) => i !== index)
}

/** A kit with new bookmarks; the index clamps to the list. */
export function kitWithBookmarks(kit: SlideKit, bookmarks: readonly Bookmark[], index = kit.index): SlideKit {
  const last = bookmarks.length - 1
  return { ...kit, bookmarks: [...bookmarks], index: last < 0 ? 0 : Math.min(Math.max(index, 0), last) }
}

export function updateBookmark(kit: SlideKit, index: number, patch: Partial<Bookmark>): SlideKit {
  const bookmarks = kit.bookmarks.map((b, i) => (i === index ? { ...b, ...patch } : b))
  return kitWithBookmarks(kit, bookmarks)
}

/** Copies a starter kit into a user kit with a fresh id (UI-45), so an edit never changes the shipped file. */
export function kitFromRecord(rec: { name: string; bookmarks: readonly BookmarkLike[] }): SlideKit {
  return { id: newKitId(), name: rec.name, bookmarks: rec.bookmarks.map(normalizeBookmark), index: 0 }
}

/** True when the base64url form exceeds the link limit; the sheet then offers "Download kit". */
export function kitLinkTooLong(kit: SlideKit): boolean {
  return encodeBase64Url(JSON.stringify(kit)).length > KIT_LINK_MAX_CHARS
}

// ---- JSON form (Export JSON, Import JSON) -----------------------------------------------------

/**
 * A bookmark as this app writes it. `captureBookmark` copies the store's view preset, and that
 * value is `free` while the reader holds a manual camera. The Bookmark schema of
 * src/core/schema/body.ts lists the six presets only, because a shipped kit file states a
 * preset; a captured bookmark carries the camera in `cam` and applyBookmark reads `view` only
 * when `cam` is null. Accepting `free` here keeps every kit link and kit file the app has
 * already written readable. Every other field keeps the shipped schema.
 */
const KitBookmarkJson = BookmarkSchema.extend({
  view: z.enum([...VIEW_PRESETS, 'free']).default('lateral'),
  fluorescence: FluorescenceConfig.optional(),
})

/**
 * The kit JSON form. Import JSON parses a file with it, and decodeKit in ./url.ts parses the
 * `kit` URL parameter with it (SEC-02), so a hand-written link cannot reach the store with a
 * bookmark the viewer then fails to read.
 */
export const KitJson = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  bookmarks: z.array(KitBookmarkJson).min(1),
  index: z.number().int().min(0).optional(),
})

export function kitToJson(kit: SlideKit): string {
  return JSON.stringify({ id: kit.id, name: kit.name, bookmarks: kit.bookmarks, index: kit.index }, null, 2)
}

/** Parses an exported kit; null when the text is not a kit. */
export function kitFromJson(text: string): SlideKit | null {
  try {
    const parsed = KitJson.safeParse(JSON.parse(text))
    if (!parsed.success) return null
    const { id, name, bookmarks, index } = parsed.data
    return kitWithBookmarks({ id: id ?? newKitId(), name, bookmarks: [], index: 0 }, bookmarks.map(normalizeBookmark), index ?? 0)
  } catch {
    return null
  }
}

// ---- motion (AR-60, UX-EX-14) ---------------------------------------------------------------

/** cubic-bezier(0.2, 0, 0, 1): Newton steps on x, then y. */
export function bookmarkEase(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const bez = (a: number, b: number, s: number): number => 3 * a * (1 - s) * (1 - s) * s + 3 * b * (1 - s) * s * s + s * s * s
  const dbez = (a: number, b: number, s: number): number => 3 * a * (1 - s) * (1 - 3 * s) + 3 * b * s * (2 - 3 * s) + 3 * s * s
  let s = t
  for (let i = 0; i < 8; i++) {
    const d = dbez(0.2, 0, s)
    if (Math.abs(d) < 1e-6) break
    s = Math.min(1, Math.max(0, s - (bez(0.2, 0, s) - t) / d))
  }
  return bez(0, 1, s)
}

function lerpPose(a: CameraPose, b: CameraPose, k: number): CameraPose {
  const mix = (p: readonly number[], q: readonly number[]): [number, number, number] => [
    p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k,
  ]
  return { position: mix(a.position, b.position), target: mix(a.target, b.target) }
}

let motionRaf = 0

export function cancelBookmarkMotion(): void {
  if (motionRaf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(motionRaf)
  motionRaf = 0
}

/** Time over 600 ms and a free camera over 500 ms; a cut when asked, without rAF, under reduced motion, or while playing. */
function animateBookmark(get: Get, t1: number, cam1: CameraPose | null, cut: boolean): void {
  cancelBookmarkMotion()
  const s = get()
  const cam0 = cam1 && s.viewPreset === 'free' ? s.camera : null
  if (cut || typeof requestAnimationFrame !== 'function' || s.reducedMotion || s.playing) {
    if (cam1) s.setCameraPose(cam1, { manual: true })
    s.setTime(t1)
    return
  }
  if (cam1 && !cam0) s.setCameraPose(cam1, { manual: true })
  const t0 = s.time
  const start = performance.now()
  const total = Math.max(BOOKMARK_TIME_MS, cam0 ? BOOKMARK_CAMERA_MS : 0)
  const tick = (now: number): void => {
    const el = now - start
    const st = get()
    if (cam0 && cam1) {
      const kc = bookmarkEase(el / BOOKMARK_CAMERA_MS)
      st.setCameraPose(kc >= 1 ? cam1 : lerpPose(cam0, cam1, kc), { manual: true })
    }
    if (el >= total) {
      motionRaf = 0
      st.setTime(t1)
      return
    }
    st.setTime(t0 + (t1 - t0) * bookmarkEase(el / BOOKMARK_TIME_MS))
    motionRaf = requestAnimationFrame(tick)
  }
  motionRaf = requestAnimationFrame(tick)
}

function applyBookmark(set: Set, get: Get, raw: Bookmark, opts: BookmarkMotion = {}): void {
  const b = normalizeBookmark(raw)
  const data = get().data
  const knownStructure = (id: ZfaId): boolean => !data || data.structuresById.has(id)
  const knownSystem = (id: string): boolean => !data || (data.systemsById as ReadonlyMap<string, unknown>).has(id)
  const { systems, structures } = splitHideTokens(b.hide)
  set({
    hiddenSystems: systems.filter(knownSystem),
    hiddenStructures: structures.filter(knownStructure),
    railPreset: null,
    soloRestore: null,
    xray: b.xr,
    lastXray: b.xr > 0 ? b.xr : get().lastXray,
    section: { ...b.sec },
    isolate: b.iso,
    labels: b.labels,
    selection: b.sel.filter(knownStructure),
    // A bookmark written before the lab existed states no preview. Stepping to it, or loading the
    // kit that holds it, then keeps the rules the reader authored; only a bookmark that states a
    // config replaces them. A bookmark turns the preview off by stating a config with `enabled`
    // false, which captureBookmark writes as soon as one rule exists.
    ...(b.fluorescence ? { fluorescence: b.fluorescence } : {}),
    labEnabled: get().labEnabled || b.fluorescence !== undefined,
  })
  if (!b.cam) get().setViewPreset(b.view === 'free' ? 'lateral' : b.view)
  animateBookmark(get, b.t, b.cam, opts.motion === 'cut')
}

export function createModeSlice(set: Set, get: Get, deps: StoreDeps): ModeState & ModeActions {
  return {
    presentation: false,
    embed: false,
    kit: null,
    sex: 'female',
    stripPinned: false,
    projectorScale: 1,
    stripPosition: 'bottom',
    blackScreen: false,

    setPresentation(on) {
      if (on === get().presentation) return
      // Entry sets snap on, labels off and jump-on-select on (AR-59, UI-02).
      if (on) set({ presentation: true, snap: true, labels: false, jumpOnSelect: true })
      else set({ presentation: false, blackScreen: false })
    },
    setEmbed(on) {
      if (on !== get().embed) set({ embed: on })
    },
    setSex(s) {
      if (s === get().sex) return
      set({ sex: s })
      refreshDerived(set, get, deps)
    },
    toggleStripPin() {
      set({ stripPinned: !get().stripPinned })
    },
    setProjectorScale(s) {
      if (s !== get().projectorScale) set({ projectorScale: s })
    },
    setStripPosition(p) {
      if (p !== get().stripPosition) set({ stripPosition: p })
    },
    toggleBlackScreen() {
      set({ blackScreen: !get().blackScreen })
    },
    toggleFullscreen() {
      // Fullscreen API from a key or pointer gesture only (UI-40). No-op outside a browser.
      if (typeof document === 'undefined') return
      try {
        const pending = document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen()
        pending.catch(() => undefined)
      } catch {
        // The browser has no Fullscreen API.
      }
    },
    loadKit(kit) {
      if (!kit) {
        cancelBookmarkMotion()
        if (get().kit !== null) set({ kit: null })
        return
      }
      const next = kitWithBookmarks(kit, kit.bookmarks.map(normalizeBookmark), kit.index)
      set({ kit: next })
      if (next.bookmarks.length > 0) applyBookmark(set, get, next.bookmarks[next.index])
    },
    addBookmark(name) {
      const s = get()
      const bookmark = captureBookmark(s, name)
      const kit: SlideKit = s.kit ?? { id: newKitId(), name: 'My kit', bookmarks: [], index: 0 }
      set({ kit: { ...kit, bookmarks: [...kit.bookmarks, bookmark], index: kit.bookmarks.length } })
    },
    stepBookmark(dir) {
      const { kit } = get()
      if (!kit || kit.bookmarks.length === 0) return
      get().goToBookmark(kit.index + dir)
    },
    goToBookmark(index, opts) {
      const { kit } = get()
      if (!kit || kit.bookmarks.length === 0) return
      const i = Math.min(Math.max(index, 0), kit.bookmarks.length - 1)
      set({ kit: { ...kit, index: i } })
      applyBookmark(set, get, kit.bookmarks[i], opts)
    },
  }
}
