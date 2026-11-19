// The top bar (spec 5.6, UX-LY-01): title, the schematic caveat, the search slot, view presets,
// theme, export, share, present, settings and help. Tablet folds the extra presets and buttons
// into an overflow menu (UI-28); phone shows the title, a search button and the Layers button
// that opens the rail sheet.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { Ellipsis, Fish, FlaskConical, Info, Layers, Presentation, Settings } from 'lucide-react'
import { closeOverlay, getOverlay, subscribeOverlay, toggleOverlay } from '../state/shortcuts.ts'
import { readAtlas, useAtlas } from '../state/store.ts'
import { AboutSheet } from './About.tsx'
import { useBreakpoint } from './hooks/useBreakpoint.ts'
import type { Breakpoint } from './hooks/useBreakpoint.ts'
import { IconButton } from './primitives/IconButton.tsx'
import { Sheet } from './primitives/Sheet.tsx'
import { REPORTER_PREVIEW } from './FluorescencePanel.tsx'
import { Search } from './Search.tsx'
import { ShareExportMenu } from './ShareExportMenu.tsx'
import { RailContent } from './SystemsRail.tsx'
import { ThemeToggle } from './ThemeToggle.tsx'
import { ViewPresets } from './ViewPresets.tsx'
import { blurAfterPointer } from './timelineGeometry.ts'
import './TopBar.css'

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

export interface TopBarProps {
  /** Overrides the Search component of Search.tsx (tests). */
  search?: ReactNode
  /** Dialog openers of later packages; a button without its handler renders disabled with a tooltip. */
  onOpenExport?: () => void
  onOpenShare?: () => void
  onOpenSettings?: () => void
}

type Openers = Pick<TopBarProps, 'onOpenExport' | 'onOpenShare' | 'onOpenSettings'>

function ActionButtons({ onHelp, onOpenExport, onOpenShare, onOpenSettings }: Openers & { onHelp: () => void }) {
  const soon = (label: string, handler?: () => void) => (handler ? label : `${label} (coming soon)`)
  return (
    <>
      <ThemeToggle />
      <ShareExportMenu onOpenExport={onOpenExport} onOpenShare={onOpenShare} />
      <IconButton label={soon('Settings', onOpenSettings)} shortcut="," disabled={!onOpenSettings} onClick={onOpenSettings}>
        <Settings {...ICON} />
      </IconButton>
      <IconButton label="About" onClick={onHelp}>
        <Info {...ICON} />
      </IconButton>
    </>
  )
}

/** The caveat beside the title (review C-08). The full sentence has room on the desktop bar only. */
export const SCHEMATIC_NOTE = 'Schematic model. Most sizes are estimates.'

/**
 * The caveat strip. The phone bar holds a title, a search button and the Layers button, so the
 * strip would push one of them off the row; the About sheet and the export footer carry the same
 * words there. Presentation and embed mode hide the whole top bar (styles.css), and the embed
 * footer states "Schematic model" in embed mode.
 */
function SchematicNote({ layout }: { layout: Breakpoint }) {
  if (layout === 'phone') return null
  return (
    <span className="badge topbar-note" data-testid="topbar-note" title={SCHEMATIC_NOTE}>
      {layout === 'desktop' ? SCHEMATIC_NOTE : 'Schematic model'}
    </span>
  )
}

export function TopBar({ search, ...openers }: TopBarProps) {
  const breakpoint = useBreakpoint()
  const labEnabled = useAtlas((s) => s.labEnabled)
  // The About sheet lives in the overlay registry, so it never stacks on another sheet and Escape closes it in the 5.9.1 order.
  const aboutOpen = useSyncExternalStore(subscribeOverlay, () => getOverlay() === 'about', () => false)
  const openAbout = () => toggleOverlay('about')
  // The preview panel is registered the same way, so this button reports the registry, not a copy of it.
  const labOpen = useSyncExternalStore(subscribeOverlay, () => getOverlay() === 'lab', () => false)
  const [layersOpen, setLayersOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moreOpen) return
    const close = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [moreOpen])

  const present = (
    <IconButton
      label="Presentation mode"
      shortcut="P"
      onClick={(e) => {
        readAtlas().setPresentation(true)
        blurAfterPointer(e)
      }}
    >
      <Presentation {...ICON} />
    </IconButton>
  )

  return (
    <div className="topbar" data-layout={breakpoint}>
      <div className="topbar-brand">
        <Fish {...ICON} />
        <h1 className="topbar-title">Zebrafish 3D Atlas</h1>
        <SchematicNote layout={breakpoint} />
      </div>
      <div className="topbar-search">{search ?? <Search compact={breakpoint === 'phone'} />}</div>
      <div className="topbar-actions">
        {labEnabled ? <IconButton label={REPORTER_PREVIEW} aria-pressed={labOpen} onClick={() => toggleOverlay('lab')}><FlaskConical {...ICON} /></IconButton> : null}
        {breakpoint === 'desktop' ? (
          <>
            <ViewPresets />
            <ActionButtons onHelp={openAbout} {...openers} />
            {present}
          </>
        ) : null}
        {breakpoint === 'tablet' ? (
          <div ref={moreRef} className="topbar-actions">
            <ViewPresets only={['lateral', 'dorsal', 'threeQuarter']} />
            {present}
            <IconButton label="More controls" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen((o) => !o)}>
              <Ellipsis {...ICON} />
            </IconButton>
            {moreOpen ? (
              <div className="topbar-menu" role="group" aria-label="More controls">
                <div className="topbar-menu-label">View</div>
                <ViewPresets only={['ventral', 'anterior', 'posterior']} />
                <div className="topbar-menu-row">
                  <ActionButtons onHelp={openAbout} {...openers} />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {breakpoint === 'phone' ? (
          <IconButton label="Layers" aria-expanded={layersOpen} data-testid="layers-button" onClick={() => setLayersOpen((o) => !o)}>
            <Layers {...ICON} />
          </IconButton>
        ) : null}
      </div>
      <AboutSheet open={aboutOpen} onClose={() => closeOverlay('about')} />
      {breakpoint === 'phone' ? (
        <Sheet open={layersOpen} onClose={() => setLayersOpen(false)} title="Layers" side="bottom" detent="half" modal={false} className="rail-sheet">
          <RailContent showPlayback />
        </Sheet>
      ) : null}
    </div>
  )
}
