// The export and share buttons of the top bar (spec 5.6) and the share dialog (UI-34, UX-EX-08,
// UX-EX-09). The open state of both dialogs lives in src/viewer/export/dialogState.ts, so the
// buttons here and the keys in ExportDialog.tsx (always mounted by App.tsx) share it.
import { useMemo, useState } from 'react'
import { Camera, Link } from 'lucide-react'
import { formatReadout, lengthAt } from '../core/format.ts'
import { stageAt } from '../core/timeAxis.ts'
import { atlasStore, useAtlas, useAtlasShallow } from '../state/store.ts'
import { shareState, shareUrl, shareUrlFromState } from '../state/urlSync.ts'
import { openExportDialog, openShareDialog } from '../viewer/export/dialogState.ts'
import { showToast, toastText } from './hooks/useToast.ts'
import { Button } from './primitives/Button.tsx'
import { IconButton } from './primitives/IconButton.tsx'
import { Sheet } from './primitives/Sheet.tsx'
import { Switch } from './primitives/Switch.tsx'

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

export interface ShareExportMenuProps {
  /** Overrides of the default openers (tests). */
  onOpenExport?: () => void
  onOpenShare?: () => void
}

export function ShareExportMenu({ onOpenExport, onOpenShare }: ShareExportMenuProps) {
  return (
    <>
      <IconButton label="Export PNG" shortcut="Ctrl+Shift+S" onClick={onOpenExport ?? openExportDialog}>
        <Camera {...ICON} />
      </IconButton>
      <IconButton label="Share link" shortcut="Shift+C" onClick={onOpenShare ?? openShareDialog}>
        <Link {...ICON} />
      </IconButton>
    </>
  )
}

/** "24 hpf | Prim-5 | 1.9 mm" for the copy toast (UX-EX-08). */
function readoutNow(): string | null {
  const s = atlasStore.getState()
  if (!s.data) return null
  const stage = stageAt(s.data.stages.stages, s.time)
  return formatReadout({ hpf: s.time, stageShortLabel: stage.shortLabel, length: lengthAt(s.data.stages.growth, s.time), units: s.units, snap: s.snap })
}

async function copyText(text: string, input: HTMLInputElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    input?.focus()
    input?.select()
    return false
  }
}

const RESTORES = 'time, selection, view, camera, theme, hidden systems, x-ray, section, units, snap, temperature, sex, strip pin and projector scale'

export interface ShareDialogProps {
  open: boolean
  onClose: () => void
}

/** The share sheet: the URL, copy buttons, and the two include switches (UI-34). */
export function ShareDialog({ open, onClose }: ShareDialogProps) {
  const [includeCamera, setIncludeCamera] = useState(true)
  const [includeTheme, setIncludeTheme] = useState(true)
  const [input, setInput] = useState<HTMLInputElement | null>(null)
  const selectedId = useAtlas((s) => s.selection[0] ?? null)
  const selectedName = useAtlas((s) => (s.selection[0] ? s.data?.structuresById.get(s.selection[0])?.name ?? null : null))
  // The UrlState holds primitives only, so the shallow compare re-renders on a real change and the string builds once per change.
  const state = useAtlasShallow(() => (open ? shareState(atlasStore, { includeCamera, includeTheme }) : null))
  const url = useMemo(() => (state ? shareUrlFromState(state) : ''), [state])

  const copy = async (text: string): Promise<void> => {
    const readout = readoutNow()
    if (await copyText(text, input)) showToast(readout ? `${toastText.linkCopied} · ${readout}` : toastText.linkCopied, { kind: 'success' })
    else showToast('Could not copy. The link is selected; press Ctrl+C.', { kind: 'error' })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Share link" side="right" width={420} className="share-sheet">
      <div style={{ display: 'grid', gap: 16 }} data-testid="share-dialog">
        <input
          ref={setInput}
          type="text"
          readOnly
          value={url}
          aria-label="Share link"
          data-testid="share-url"
          onFocus={(e) => e.currentTarget.select()}
          style={{
            width: '100%', height: 36, boxSizing: 'border-box', padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface-2)', color: 'var(--text)', font: '400 12px/1.4 var(--font-mono)',
          }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => void copy(url)}>Copy link</Button>
          {selectedId ? (
            <Button onClick={() => void copy(shareUrl(atlasStore, { includeCamera, includeTheme, structureId: selectedId }))}>
              Copy link to {selectedName ?? 'structure'}
            </Button>
          ) : null}
        </div>
        <Switch checked={includeCamera} onChange={setIncludeCamera} label="Include camera" description="A free camera as cam; off gives the nearest preset as v." />
        <Switch checked={includeTheme} onChange={setIncludeTheme} label="Include theme" description="The link opens in this theme on any machine." />
        <p style={{ margin: 0, color: 'var(--text-muted)', font: '400 12px/1.5 var(--font-sans)' }}>This link restores: {RESTORES}.</p>
      </div>
    </Sheet>
  )
}
