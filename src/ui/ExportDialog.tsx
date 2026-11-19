// Export dialog (spec 5.11.1, UX-EX-01 to UX-EX-05, AR-52). The two dialog keys of 5.9.1
// (Ctrl+Shift+S opens the export sheet, Shift+C the share sheet outside presentation mode) are
// defaults of the dispatcher in src/state/shortcuts.ts. App.tsx mounts this once; the share
// sheet renders here too, because the top bar that holds the buttons is hidden in presentation
// mode and absent on the phone.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useAtlas } from '../state/store.ts'
import { closeDialogs, useOpenDialog } from '../viewer/export/dialogState.ts'
import { canCopyImage, copyImage, downloadBlob } from '../viewer/export/download.ts'
import { exportPng, previewExport } from '../viewer/export/exportPng.ts'
import type { ExportFrame, ExportOptions, OverlayColour } from '../viewer/export/exportPng.ts'
import { EXPORT_CREDIT, exportCreditEnabled, setExportCredit } from '../viewer/export/overlay.ts'
import { EXPORT_FIXED_SIZES, EXPORT_FRAMES, EXPORT_SCALES, MAX_EDGE_PX } from '../viewer/export/plan.ts'
import type { ExportFixedSize, ExportScale } from '../viewer/export/plan.ts'
import { showToast } from './hooks/useToast.ts'
import { Button } from './primitives/Button.tsx'
import { Sheet } from './primitives/Sheet.tsx'
import { Switch } from './primitives/Switch.tsx'
import { ShareDialog } from './ShareExportMenu.tsx'

type SizeChoice = ExportScale | ExportFixedSize

const FRAME_LABELS: Record<ExportFrame, string> = { viewport: 'Viewport', '16:9': '16:9', '4:3': '4:3', '1:1': '1:1' }
const OVERLAY_LABELS: Record<OverlayColour, string> = { auto: 'Auto', dark: 'Dark', light: 'Light' }
const selectStyle: CSSProperties = {
  height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', padding: '0 8px', font: '500 13px/1.4 var(--font-sans)',
}
const labelStyle: CSSProperties = { display: 'grid', gap: 6, font: '500 12px/1.2 var(--font-sans)', color: 'var(--text-muted)' }
const noteStyle: CSSProperties = { margin: 0, font: '400 12px/1.5 var(--font-sans)', color: 'var(--text-muted)' }

const fixedSizeLabel = (size: ExportFixedSize): string => size.replace('x', ' × ')

interface ExportSheetProps { open: boolean; onClose: () => void }

function ExportSheet({ open, onClose }: ExportSheetProps) {
  const hasSelection = useAtlas((s) => s.selection.length > 0)
  const labelsOn = useAtlas((s) => s.labels)
  const fluorescenceOn = useAtlas((s) => s.fluorescence.enabled)
  const [frame, setFrame] = useState<ExportFrame>('viewport')
  const [sizeChoice, setSize] = useState<SizeChoice>(2)
  const [transparent, setTransparent] = useState(false)
  const [includeLabels, setIncludeLabels] = useState(true)
  const [includeScaleBar, setIncludeScaleBar] = useState(true)
  const [includeReadout, setIncludeReadout] = useState(true)
  const [legendChoice, setIncludeLegend] = useState<boolean | null>(null)
  const includeLegend = legendChoice ?? fluorescenceOn
  // The credit line is a property of the overlay, not of one render, so the switch writes the
  // module preference that drawOverlay reads (src/viewer/export/overlay.ts). It starts on.
  const [includeCredit, setIncludeCredit] = useState(exportCreditEnabled)
  /** null: the default, on while a selection exists (UX-EX-01). */
  const [outlineChoice, setOutlineChoice] = useState<boolean | null>(null)
  const [overlayColour, setOverlayColour] = useState<OverlayColour>('auto')
  const [progress, setProgress] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const copySupported = useMemo(() => canCopyImage(), [])
  const ranRef = useRef(false)

  // A disabled button drops focus to body while an export runs; return it so Escape still closes the sheet.
  useEffect(() => {
    if (progress === null && ranRef.current) {
      ranRef.current = false
      document.querySelector<HTMLButtonElement>('[data-export-download]')?.focus()
    }
  }, [progress])

  // Escape and the overlay registry close the sheet without the close button: reset the result line either way.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) {
      setOutlineChoice(null)
      setResult(null)
      setError(null)
    }
  }

  // A fixed size exists for the 16:9 frame only (AR-52).
  const size: SizeChoice = frame !== '16:9' && typeof sizeChoice === 'string' ? 2 : sizeChoice
  const includeOutline = hasSelection && (outlineChoice ?? true)
  const options: ExportOptions = {
    frame,
    scale: typeof size === 'number' ? size : 2,
    fixedSize: typeof size === 'string' ? size : undefined,
    transparent,
    overlayColour,
    includeLabels,
    includeScaleBar,
    includeReadout,
    includeLegend,
    includeSelectionOutline: includeOutline,
  }
  const preview = open ? previewExport(options) : null
  const overCap = (choice: SizeChoice): boolean => {
    const p = previewExport(typeof choice === 'number' ? { frame, scale: choice } : { frame, fixedSize: choice })
    return p?.overCap ?? false
  }

  const run = async (action: 'download' | 'copy'): Promise<void> => {
    setError(null)
    setResult(null)
    ranRef.current = true
    setProgress('Rendering…')
    try {
      const out = await exportPng(options, { onProgress: (done, total) => setProgress(`Rendering tile ${done} of ${total}…`) })
      if (action === 'copy') {
        await copyImage(out.blob)
        showToast('Image copied', { kind: 'success' })
        setResult(`Copied ${out.width} × ${out.height} px`)
      } else {
        downloadBlob(out.blob, out.fileName)
        showToast(`Saved ${out.fileName}`, { kind: 'success' })
        setResult(`Saved ${out.fileName} (${out.width} × ${out.height} px)`)
      }
    } catch (e) {
      const text = e instanceof Error ? e.message : String(e)
      setError(text)
      showToast(`Export failed: ${text}`, { kind: 'error' })
    } finally {
      setProgress(null)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Export PNG" side="right" width={420} className="export-sheet">
      <div style={{ display: 'grid', gap: 16 }} data-testid="export-dialog">
        <div style={labelStyle}>
          <span id="export-frame-label">Frame</span>
          <div className="seg" role="group" aria-labelledby="export-frame-label">
            {EXPORT_FRAMES.map((f) => (
              <button key={f} type="button" aria-pressed={frame === f} data-frame={f} onClick={() => setFrame(f)}>{FRAME_LABELS[f]}</button>
            ))}
          </div>
        </div>
        <div style={labelStyle}>
          <span id="export-size-label">Size</span>
          <div className="seg" role="group" aria-labelledby="export-size-label">
            {EXPORT_SCALES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                data-size={`${s}x`}
                disabled={overCap(s)}
                title={overCap(s) ? `Over ${MAX_EDGE_PX} px on the longest edge` : undefined}
                onClick={() => setSize(s)}
              >
                {s}x
              </button>
            ))}
            {frame === '16:9'
              ? EXPORT_FIXED_SIZES.map((f) => (
                  <button key={f} type="button" aria-pressed={size === f} data-size={f} onClick={() => setSize(f)}>{fixedSizeLabel(f)}</button>
                ))
              : null}
          </div>
        </div>
        <p style={noteStyle} data-testid="export-size">
          {preview ? `Resulting size: ${preview.width} × ${preview.height} px${preview.overCap ? ` (over the ${MAX_EDGE_PX} px cap)` : ''}` : 'The 3D viewer is not ready.'}
        </p>
        <Switch checked={transparent} onChange={setTransparent} label="Transparent background" description="Straight alpha; composites onto any slide." />
        <Switch checked={includeLabels} onChange={setIncludeLabels} label="Include labels" description={labelsOn ? 'Labels as shown, up to 8.' : 'Selected and pinned labels as shown.'} />
        <Switch checked={includeScaleBar} onChange={setIncludeScaleBar} label="Include scale bar" />
        <Switch checked={includeReadout} onChange={setIncludeReadout} label="Include readout" description="Time, stage and length as a text chip." />
        <Switch checked={includeLegend} onChange={setIncludeLegend} label="Include legend" description={fluorescenceOn ? 'Active fluorescent proteins with swatches.' : 'Visible systems with swatches.'} />
        <Switch
          checked={includeCredit}
          onChange={(on) => {
            setIncludeCredit(on)
            setExportCredit(on)
          }}
          label="Include credit"
          description={EXPORT_CREDIT}
        />
        <Switch checked={includeOutline} onChange={setOutlineChoice} disabled={!hasSelection} label="Include selection outline" />
        <label style={labelStyle}>
          Overlay colour
          <select value={overlayColour} onChange={(e) => setOverlayColour(e.target.value as OverlayColour)} style={selectStyle}>
            {(Object.keys(OVERLAY_LABELS) as OverlayColour[]).map((c) => <option key={c} value={c}>{OVERLAY_LABELS[c]}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button data-export-download="" variant="primary" disabled={!preview || preview.overCap || progress !== null} onClick={() => void run('download')}>
            Download PNG
          </Button>
          {copySupported ? (
            <Button disabled={!preview || preview.overCap || progress !== null} onClick={() => void run('copy')}>Copy image</Button>
          ) : null}
          {progress ? <span style={noteStyle} role="status">{progress}</span> : null}
        </div>
        {result ? <p style={noteStyle} role="status" data-testid="export-result">{result}</p> : null}
        {error ? <p style={{ ...noteStyle, color: 'var(--danger, #E5484D)' }} role="alert">{error}</p> : null}
      </div>
    </Sheet>
  )
}

/** Mounts the export and share sheets. */
export function ExportDialog() {
  const open = useOpenDialog()
  return (
    <>
      <ExportSheet open={open === 'export'} onClose={closeDialogs} />
      <ShareDialog open={open === 'share'} onClose={closeDialogs} />
    </>
  )
}
