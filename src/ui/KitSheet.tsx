// Slide kit sheet (spec 5.12, UI-38): the bookmark list with thumbnails, reorder by drag and by
// Alt+Arrow, inline rename, delete with a confirm, the starter kits (UI-45), the saved kits, and
// the JSON, ZIP and link exports. Ctrl+B adds the current view and Shift+B toggles the sheet
// (UI-33) through the dispatcher of src/state/shortcuts.ts, whose Escape order closes the sheet.
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { formatTime } from '../core/format.ts'
import { deleteKit, readKits, writeKit } from '../state/persist.ts'
import { kitFromJson, kitFromRecord } from '../state/slices/mode.ts'
import { readAtlas, useAtlas } from '../state/store.ts'
import type { Bookmark, SlideKit } from '../state/store.ts'
import { registerAll } from '../state/shortcuts.ts'
import type { Shortcut } from '../state/shortcuts.ts'
import { downloadBlob } from '../viewer/export/download.ts'
import { showToast } from './hooks/useToast.ts'
import {
  addCurrentView, commitKit, copyText, downloadKitJson, exportKitZip, isKitSheetOpen, kitLink, moveRow, setKitSheetOpen, slugify,
  startLazyThumbnails, toggleKitSheet, useKitSheetOpen, useThumbs,
} from './kitActions.ts'
import { BookmarkRow, NameField } from './KitRow.tsx'
import { Button } from './primitives/Button.tsx'
import { IconButton } from './primitives/IconButton.tsx'
import { Sheet } from './primitives/Sheet.tsx'

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

export function KitSheet() {
  const open = useKitSheetOpen()
  const kit = useAtlas((s) => s.kit)
  const data = useAtlas((s) => s.data)
  const presentation = useAtlas((s) => s.presentation)
  const embed = useAtlas((s) => s.embed)
  const units = useAtlas((s) => s.units)
  const thumbs = useThumbs(kit?.id)
  const [renaming, setRenaming] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [, bump] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  // UI-33 through the dispatcher of src/state/shortcuts.ts: the newest registration wins over its Ctrl+B default.
  // Embed mode registers nothing on purpose (AR-61, AR-62): an embedded slide frame hides the top bar,
  // and every action of this sheet writes a kit to localStorage, which AR-62 forbids there. Shift+B is
  // therefore a no-op inside an embed, and the sheet has no other way in.
  useEffect(() => {
    if (embed) return
    return registerAll(kitShortcuts())
  }, [embed])

  // The loaded kit persists as one of the user's kits (UI-38); embed mode never writes (AR-62).
  useEffect(() => {
    if (kit && !embed) writeKit(kit)
  }, [kit, embed])

  // A bookmark without a thumbnail (a starter kit, an import) gets one when the presenter lands on it.
  useEffect(() => startLazyThumbnails(), [])

  if (!open) return null

  const saved = Object.values(readKits()).filter((k) => k.id !== kit?.id)
  const structureName = (id: string) => data?.structuresById.get(id)?.name ?? id
  const selectionText = (b: Bookmark) => (b.sel.length === 0 ? 'no selection' : `${b.sel.map(structureName).join(', ')}${b.iso ? ' (isolated)' : ''}`)
  const load = (next: SlideKit) => {
    readAtlas().loadKit(next)
    showToast(`Loaded "${next.name}"`)
  }
  const onImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    void file.text().then((text) => {
      const parsed = kitFromJson(text)
      if (parsed) load(parsed)
      else showToast('That file is not a slide kit', { kind: 'error' })
    })
  }
  const onZip = async (k: SlideKit) => {
    setBusy('Rendering 0 of ' + k.bookmarks.length)
    try {
      const blob = await exportKitZip(k, (done, total) => setBusy(`Rendering ${done} of ${total}`))
      downloadBlob(blob, `${slugify(k.name)}.zip`)
      showToast('Kit exported')
    } catch (e) {
      showToast(`Export failed: ${e instanceof Error ? e.message : String(e)}`, { kind: 'error' })
    } finally {
      setBusy(null)
    }
  }
  const onLink = async (k: SlideKit) => {
    const { url, tooLong } = kitLink(k)
    if (tooLong) {
      downloadKitJson(k)
      return
    }
    const ok = await copyText(url)
    showToast(ok ? 'Link copied' : 'Clipboard unavailable', { kind: ok ? 'info' : 'error' })
  }
  const link = kit ? kitLink(kit) : null

  return (
    <Sheet open onClose={() => setKitSheetOpen(false)} title="Slide kit" side="right" width={320} modal={!presentation} className="kit-sheet">
      <style>{SHEET_CSS}</style>
      {kit ? (
        <>
          <div className="kit-head">
            {renaming ? (
              <NameField
                value={kit.name}
                label="Kit name"
                onCommit={(v) => {
                  setRenaming(false)
                  if (v.trim()) commitKit({ ...kit, name: v.trim() })
                }}
                onCancel={() => setRenaming(false)}
              />
            ) : (
              <button type="button" className="kit-title" onClick={() => setRenaming(true)} title="Rename kit">
                {kit.name} <Pencil {...ICON} />
              </button>
            )}
            <span className="kit-count">{slideCount(kit.bookmarks.length)}</span>
          </div>
          <ol className="kit-list" data-testid="kit-list" aria-label="Bookmarks">
            {kit.bookmarks.map((b, i) => (
              <BookmarkRow key={`${kit.id}-${i}`} kit={kit} index={i} bookmark={b} thumb={thumbs[i] ?? null} selectionText={selectionText(b)} timeText={formatTime(b.t, units)} />
            ))}
          </ol>
        </>
      ) : (
        <p className="kit-empty">No kit loaded. Add the current view to start one, or load a starter kit below.</p>
      )}
      <div className="kit-actions">
        <Button size="sm" variant="primary" onClick={() => addBookmarkWithToast()}>
          Add current view
        </Button>
        {kit ? (
          <>
            <Button size="sm" onClick={() => downloadKitJson(kit)}>Export JSON</Button>
            <Button size="sm" disabled={busy !== null} onClick={() => void onZip(kit)}>{busy ?? 'Export ZIP'}</Button>
            <Button size="sm" onClick={() => void onLink(kit)}>{link?.tooLong ? 'Download kit' : 'Copy kit link'}</Button>
            <Button size="sm" variant="ghost" onClick={() => readAtlas().loadKit(null)}>Close kit</Button>
          </>
        ) : null}
        <Button size="sm" onClick={() => fileRef.current?.click()}>Import JSON</Button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden aria-label="Import a kit file" onChange={onImport} />
      </div>
      <h3 className="kit-section-title">Starter kits</h3>
      <div className="kit-picks">
        {(data?.kits ?? []).map((k) => (
          <button key={k.id} type="button" className="kit-pick" onClick={() => load(kitFromRecord(k))} title={k.description}>
            {k.name} <span>{slideCount(k.bookmarks.length)}</span>
          </button>
        ))}
      </div>
      {saved.length > 0 ? (
        <>
          <h3 className="kit-section-title">Your kits</h3>
          <div className="kit-picks">
            {saved.map((k) => (
              <div key={k.id} className="kit-saved">
                <button type="button" className="kit-pick" onClick={() => load(k)}>
                  {k.name} <span>{slideCount(k.bookmarks.length)}</span>
                </button>
                <IconButton
                  label={`Delete ${k.name}`}
                  size="sm"
                  onClick={() => {
                    deleteKit(k.id)
                    bump((n) => n + 1)
                  }}
                >
                  <Trash2 {...ICON} />
                </IconButton>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </Sheet>
  )
}

/** "1 slide", "8 slides". */
function slideCount(n: number): string {
  return `${n} ${n === 1 ? 'slide' : 'slides'}`
}

function addBookmarkWithToast(): void {
  addCurrentView()
  const kit = readAtlas().kit
  if (kit) showToast(`Bookmark ${kit.bookmarks.length} added`)
}

/** The row that has focus inside the open sheet, or null: Alt+Arrow moves it instead of orbiting the camera. */
function focusedRowIndex(): number | null {
  if (!isKitSheetOpen() || typeof document === 'undefined') return null
  const row = document.activeElement?.closest<HTMLElement>('.kit-row')
  const index = row ? Number(row.dataset.index) : NaN
  return Number.isInteger(index) ? index : null
}

function moveFocusedRow(dir: -1 | 1): boolean {
  const index = focusedRowIndex()
  const kit = readAtlas().kit
  if (index === null || !kit) return false
  moveRow(kit, index, index + dir)
  return true
}

function kitShortcuts(): Shortcut[] {
  return [
    { code: 'KeyB', ctrl: true, run: () => addBookmarkWithToast() },
    { code: 'KeyB', shift: true, run: () => toggleKitSheet() },
    { code: 'ArrowUp', alt: true, run: () => moveFocusedRow(-1) },
    { code: 'ArrowDown', alt: true, run: () => moveFocusedRow(1) },
  ]
}

const SHEET_CSS = `
.kit-sheet .sheet-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; font-family: var(--font-sans); }
.kit-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.kit-title { display: inline-flex; align-items: center; gap: 6px; margin: 0; padding: 4px 6px; border: 0; border-radius: 6px; background: none; color: var(--text); font: 600 14px/1.3 var(--font-sans); cursor: pointer; text-align: left; }
.kit-title svg { width: 14px; height: 14px; color: var(--text-muted); }
.kit-title:hover { background: var(--surface-2); }
.kit-count { color: var(--text-muted); font: 400 12px/1.3 var(--font-sans); white-space: nowrap; }
.kit-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.kit-row { display: grid; grid-template-columns: 96px minmax(0, 1fr) 64px; align-items: center; gap: 8px; padding: 4px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-2); cursor: grab; }
.kit-row[data-current="true"] { border-color: var(--focus); }
.kit-row:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }
.kit-thumb { width: 96px; height: 54px; padding: 0; border: 0; border-radius: 4px; background: var(--bg); display: grid; place-items: center; color: var(--text-muted); font: 500 11px/1.2 var(--font-sans); overflow: hidden; cursor: pointer; }
.kit-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.kit-main { display: grid; gap: 2px; min-width: 0; }
.kit-name { margin: 0; padding: 0; border: 0; background: none; color: var(--text); font: 600 13px/1.3 var(--font-sans); text-align: left; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kit-meta { color: var(--text-muted); font: 400 12px/1.3 var(--font-sans); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kit-input { width: 100%; height: 28px; padding: 0 8px; box-sizing: border-box; border-radius: 6px; border: 1px solid var(--accent); background: var(--surface); color: var(--text); font: 500 13px/1.3 var(--font-sans); }
.kit-row-actions { display: grid; grid-template-columns: 32px 32px; }
.kit-row-actions .btn-danger { grid-column: 1 / -1; height: 28px; }
.kit-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.kit-section-title { margin: 6px 0 0; color: var(--text-muted); font: 500 11px/1.2 var(--font-sans); text-transform: uppercase; letter-spacing: 0.04em; }
.kit-picks { display: grid; gap: 6px; }
.kit-saved { display: grid; grid-template-columns: minmax(0, 1fr) 32px; gap: 4px; align-items: center; }
.kit-pick { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; min-height: 36px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); font: 500 13px/1.3 var(--font-sans); cursor: pointer; text-align: left; }
.kit-pick:hover { background: color-mix(in srgb, var(--surface-2), var(--text) 8%); }
.kit-pick span { color: var(--text-muted); font-weight: 400; font-size: 12px; white-space: nowrap; }
.kit-empty { margin: 0; color: var(--text-muted); font: 400 13px/1.4 var(--font-sans); }
.app[data-presentation="true"] .kit-sheet { top: auto; right: 12px; bottom: calc(var(--time-h, 64px) + 12px); max-height: 70dvh; border: 1px solid var(--border); border-radius: 12px; }
`
