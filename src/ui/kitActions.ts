// Kit sheet helpers (spec 5.12): the sheet open state, the thumbnail store, downloads, the ZIP
// export and the kit link. KitSheet.tsx and its key bindings call these; nothing here renders.
import { useSyncExternalStore } from 'react'
import { shareUrlFromState } from '../state/urlSync.ts'
import { closeOverlay, getOverlay, openOverlay, subscribeOverlay, toggleOverlay } from '../state/shortcuts.ts'
import type { OverlayId } from '../state/shortcuts.ts'
import { kitLinkTooLong, kitToJson, kitWithBookmarks, moveItem } from '../state/slices/mode.ts'
import { atlasStore, readAtlas } from '../state/store.ts'
import type { SlideKit } from '../state/store.ts'
import { downloadBlob } from '../viewer/export/download.ts'
import { exportPng } from '../viewer/export/exportPng.ts'
import { snapshotDataUrl } from '../viewer/export/snapshot.ts'
import { buildZip } from '../viewer/export/zip.ts'
import type { ZipEntry } from '../viewer/export/zip.ts'

// ---- sheet open state: the overlay registry of the key dispatcher, so the Escape order closes it ----

const KIT_OVERLAY: OverlayId = 'kit'

export function isKitSheetOpen(): boolean {
  return getOverlay() === KIT_OVERLAY
}

export function setKitSheetOpen(open: boolean): void {
  if (open) openOverlay(KIT_OVERLAY)
  else closeOverlay(KIT_OVERLAY)
}

export function toggleKitSheet(): void {
  toggleOverlay(KIT_OVERLAY)
}

export function useKitSheetOpen(): boolean {
  return useSyncExternalStore(subscribeOverlay, isKitSheetOpen, () => false)
}

// ---- thumbnails: one data URL per bookmark, stored with the kit id (UI-38) ---------------------

export const THUMB_PX = 96
const THUMBS_KEY = 'zfatlas:kitThumbs:v1'
export type Thumbs = readonly (string | null)[]

const EMPTY: Thumbs = []
const thumbCache = new Map<string, Thumbs>()
const thumbListeners = new Set<() => void>()

function readAllThumbs(): Record<string, Thumbs> {
  try {
    const raw = localStorage.getItem(THUMBS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, Thumbs>) : {}
  } catch {
    return {}
  }
}

export function getThumbs(kitId: string): Thumbs {
  let thumbs = thumbCache.get(kitId)
  if (!thumbs) {
    const stored = readAllThumbs()[kitId]
    thumbs = Array.isArray(stored) ? stored : EMPTY
    thumbCache.set(kitId, thumbs)
  }
  return thumbs
}

export function setThumbs(kitId: string, thumbs: Thumbs): void {
  thumbCache.set(kitId, thumbs)
  for (const cb of thumbListeners) cb()
  if (readAtlas().embed) return
  try {
    localStorage.setItem(THUMBS_KEY, JSON.stringify({ ...readAllThumbs(), [kitId]: thumbs }))
  } catch {
    // Storage is full, blocked, or absent: the thumbnails live for this session only.
  }
}

/** Writes one thumbnail; a stale index (the bookmark was removed) is dropped. */
export function setThumb(kitId: string, index: number, url: string | null): void {
  const kit = readAtlas().kit
  if (!kit || kit.id !== kitId || index >= kit.bookmarks.length) return
  const next = [...getThumbs(kitId)]
  while (next.length < kit.bookmarks.length) next.push(null)
  next[index] = url
  setThumbs(kitId, next)
}

function subscribeThumbs(cb: () => void): () => void {
  thumbListeners.add(cb)
  return () => {
    thumbListeners.delete(cb)
  }
}

export function useThumbs(kitId: string | undefined): Thumbs {
  return useSyncExternalStore(subscribeThumbs, () => (kitId ? getThumbs(kitId) : EMPTY), () => EMPTY)
}

/** A 96 px thumbnail of the live canvas as it is at the key press; null before the viewer mounts. */
export function captureThumbnail(): string | null {
  try {
    return snapshotDataUrl(THUMB_PX)
  } catch {
    return null
  }
}

/** Ctrl+B and the "Add current view" button: appends the view with a thumbnail of the screen at the press. */
export function addCurrentView(): void {
  readAtlas().addBookmark()
  const kit = readAtlas().kit
  if (!kit) return
  setThumb(kit.id, kit.bookmarks.length - 1, captureThumbnail())
}

/** Time for a bookmark glide (600 ms) and the rebuild to settle before a lazy thumbnail. */
const LAZY_THUMB_MS = 900

/**
 * Fills the thumbnail of the bookmark the kit lands on when it has none (a starter kit or an
 * imported file), once the glide has settled. Returns the unsubscribe function; KitSheet.tsx runs it.
 */
export function startLazyThumbnails(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  const unsub = atlasStore.subscribe((s, prev) => {
    const kit = s.kit
    if (!kit || (kit === prev.kit && kit.bookmarks === prev.kit?.bookmarks && kit.index === prev.kit?.index)) return
    if (getThumbs(kit.id)[kit.index]) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      const now = readAtlas().kit
      if (!now || now.id !== kit.id || now.index !== kit.index || getThumbs(now.id)[now.index]) return
      setThumb(now.id, now.index, captureThumbnail())
    }, LAZY_THUMB_MS)
  })
  return () => {
    unsub()
    if (timer) clearTimeout(timer)
  }
}

// ---- edits from the sheet ---------------------------------------------------------------------

/** Writes an edited kit and keeps the thumbnail list aligned with the bookmarks. */
export function commitKit(kit: SlideKit, thumbs?: readonly (string | null)[]): void {
  atlasStore.setState({ kit })
  if (thumbs) setThumbs(kit.id, thumbs)
}

/** Moves one bookmark (and its thumbnail) and keeps focus on the moved row. */
export function moveRow(kit: SlideKit, from: number, to: number): void {
  if (to < 0 || to >= kit.bookmarks.length || from < 0 || from >= kit.bookmarks.length || from === to) return
  const thumbs = [...getThumbs(kit.id), ...Array<null>(Math.max(0, kit.bookmarks.length - getThumbs(kit.id).length)).fill(null)]
  commitKit(kitWithBookmarks(kit, moveItem(kit.bookmarks, from, to), to), moveItem(thumbs, from, to))
  requestAnimationFrame(() => document.querySelector<HTMLElement>(`.kit-row[data-index="${to}"]`)?.focus())
}

// ---- files and links ------------------------------------------------------------------------

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'kit'
}

export function downloadKitJson(kit: SlideKit): void {
  downloadBlob(new Blob([kitToJson(kit)], { type: 'application/json' }), `${slugify(kit.name)}.json`)
}

const nextFrame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)))

/**
 * One PNG per bookmark at 2x with the export settings (UX-EX-15). Steps through the kit with cuts
 * (the motion option, never the stored reduced-motion preference) and returns to the start index.
 * Throws with the pipeline's message (size cap, drain timeout, viewer not ready).
 */
export async function exportKitZip(kit: SlideKit, onProgress?: (done: number, total: number) => void): Promise<Blob> {
  const startIndex = kit.index
  const entries: ZipEntry[] = []
  // The legend of each slide follows the preview that slide draws: the bookmark's own config when
  // it states one, else the config it inherits from the slide before it. Left to the export
  // default, one ZIP carried a legend on some slides and none on the rest.
  let preview = readAtlas().fluorescence.enabled
  try {
    for (let i = 0; i < kit.bookmarks.length; i++) {
      readAtlas().goToBookmark(i, { motion: 'cut' })
      await nextFrame()
      preview = kit.bookmarks[i]?.fluorescence?.enabled ?? preview
      const result = await exportPng({ scale: 2, includeLegend: preview })
      entries.push({ name: `${String(i + 1).padStart(2, '0')}_${result.fileName}`, data: new Uint8Array(await result.blob.arrayBuffer()) })
      onProgress?.(i + 1, kit.bookmarks.length)
    }
  } finally {
    readAtlas().goToBookmark(startIndex, { motion: 'cut' })
  }
  return new Blob([buildZip(entries)], { type: 'application/zip' })
}

/** The share URL of the current state with the kit; `tooLong` asks for "Download kit" instead (UI-38). */
export function kitLink(kit: SlideKit): { url: string; tooLong: boolean } {
  return { url: shareUrlFromState(readAtlas().toUrl()), tooLong: kitLinkTooLong(kit) }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
