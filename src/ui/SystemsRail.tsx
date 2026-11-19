// The systems rail (spec 5.3): header with the total badge, the 15 systems as rows or as a
// 3 by 5 grid (UI-43), the presets, x-ray, section control and the tree slot. Desktop docks it,
// tablet shows a 56 px strip that expands to a sheet, phone opens it from the top bar.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Layers, LayoutGrid, List, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { SystemRecord } from '../core/schema.ts'
import { readLayout, writeLayout } from '../state/persist.ts'
import { readAtlas, useAtlas } from '../state/store.ts'
import { useBreakpoint } from './hooks/useBreakpoint.ts'
import { usePalette } from './hooks/usePalette.ts'
import { useMediaQuery } from './hooks/useMediaQuery.ts'
import { Badge } from './primitives/Badge.tsx'
import { IconButton } from './primitives/IconButton.tsx'
import { Sheet } from './primitives/Sheet.tsx'
import { RailPresets } from './RailPresets.tsx'
import { UnitsSwitch } from './Readout.tsx'
import { DissectSlider } from './DissectSlider.tsx'
import { SectionControl } from './SectionControl.tsx'
import { SystemCell, SystemRow } from './SystemRow.tsx'
import { Tree } from './Tree.tsx'
import { countLabel, systemCounts } from './railModel.ts'
import { XraySlider } from './XraySlider.tsx'
import { SPEEDS, speedLabel } from '../core/playback.ts'
import './SystemsRail.css'

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

function useRailModel() {
  const data = useAtlas((s) => s.data)
  const presentIds = useAtlas((s) => s.presentIds)
  const hiddenSystems = useAtlas((s) => s.hiddenSystems)
  const theme = useAtlas((s) => s.theme)
  const palette = usePalette()
  const counts = useMemo(() => systemCounts(data, presentIds), [data, presentIds])
  const systems = useMemo(() => (data ? [...data.systems].sort((a, b) => a.order - b.order) : []), [data])
  const toggle = (system: SystemRecord, solo: boolean) => {
    const s = readAtlas()
    if (solo) s.soloSystem(system.id)
    else s.setSystemHidden(system.id, !s.hiddenSystems.includes(system.id))
  }
  return { data, systems, counts, hiddenSystems, theme, palette, toggle }
}

function SystemGrid({ model }: { model: ReturnType<typeof useRailModel> }) {
  return (
    <div className="sys-grid" role="group" aria-label="Systems">
      {model.systems.map((sys) => (
        <SystemCell
          key={sys.id}
          system={sys}
          counts={model.counts.bySystem.get(sys.id) ?? { present: 0, total: 0 }}
          hidden={model.hiddenSystems.includes(sys.id)}
          theme={model.theme}
          palette={model.palette}
          onToggle={(solo) => model.toggle(sys, solo)}
        />
      ))}
    </div>
  )
}

/** Focuses the tree row of a system (`[data-key="sys:<id>"]` in Tree.tsx); false when the tree is not mounted. */
function focusSystemTreeRow(from: HTMLElement, systemId: string): boolean {
  const row = from.closest('.rail')?.querySelector<HTMLElement>(`[data-key="${CSS.escape(`sys:${systemId}`)}"]`)
  if (!row) return false
  row.focus()
  return true
}

/** The 15 rows as a listbox (UI-19): Up and Down move, Space toggles the eye, Enter opens the system in the tree, Alt+Enter solos. */
function SystemList({ model }: { model: ReturnType<typeof useRailModel> }) {
  const [active, setActive] = useState(0)
  const n = model.systems.length
  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (n === 0) return
    const sys = model.systems[active]
    if (e.key === 'ArrowDown') setActive((i) => Math.min(i + 1, n - 1))
    else if (e.key === 'ArrowUp') setActive((i) => Math.max(i - 1, 0))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(n - 1)
    else if (e.key === ' ') model.toggle(sys, false)
    else if (e.key === 'Enter' && e.altKey) model.toggle(sys, true)
    else if (e.key === 'Enter') {
      if (!focusSystemTreeRow(e.currentTarget, sys.id)) return
    } else return
    e.preventDefault()
  }
  return (
    <ul className="sys-list" role="listbox" aria-label="Systems" tabIndex={0} aria-activedescendant={n > 0 ? `sys-row-${model.systems[active].id}` : undefined} onKeyDown={onKeyDown}>
      {model.systems.map((sys, i) => (
        <SystemRow
          key={sys.id}
          id={`sys-row-${sys.id}`}
          system={sys}
          counts={model.counts.bySystem.get(sys.id) ?? { present: 0, total: 0 }}
          hidden={model.hiddenSystems.includes(sys.id)}
          theme={model.theme}
          palette={model.palette}
          active={i === active}
          onToggle={(solo) => model.toggle(sys, solo)}
          onActivate={() => setActive(i)}
        />
      ))}
    </ul>
  )
}

function PlaybackSection() {
  const speed = useAtlas((s) => s.speed)
  return (
    <div className="rail-playback">
      <div className="seg seg-sm" role="group" aria-label="Playback speed">
        {SPEEDS.map((s) => (
          <button key={s} type="button" aria-pressed={s === speed} title={speedLabel(s)} onClick={() => readAtlas().setSpeed(s)}>
            {s}x
          </button>
        ))}
      </div>
      <UnitsSwitch small />
    </div>
  )
}

export interface RailContentProps {
  onCollapse?: () => void
  /** Overrides the Tree component of Tree.tsx (tests). */
  tree?: ReactNode
  /** Phone: speed and units live in the Layers sheet (spec 5.1.4). */
  showPlayback?: boolean
}

export function RailContent({ onCollapse, tree, showPlayback = false }: RailContentProps) {
  const model = useRailModel()
  const shortViewport = useMediaQuery('(max-height: 999px)')
  const [viewOverride, setViewOverride] = useState<'grid' | 'list' | null>(null)
  const view = viewOverride ?? (shortViewport ? 'grid' : 'list')
  // A nav landmark: the app's one way to browse and jump between systems and structures (UX-AC-06).
  return (
    <nav className="rail" aria-label="Systems" data-testid="systems-rail">
      <div className="rail-head">
        <h2 className="rail-title">Systems</h2>
        <Badge title="Structures present now of all modelled structures">{countLabel(model.counts.all)}</Badge>
        <IconButton label={view === 'grid' ? 'Show systems as a list' : 'Show systems as a grid'} size="sm" aria-pressed={view === 'list'} onClick={() => setViewOverride(view === 'grid' ? 'list' : 'grid')}>
          {view === 'grid' ? <List {...ICON} /> : <LayoutGrid {...ICON} />}
        </IconButton>
        {onCollapse ? (
          <IconButton label="Collapse systems rail" size="sm" onClick={onCollapse}>
            <PanelLeftClose {...ICON} />
          </IconButton>
        ) : null}
      </div>
      {view === 'grid' ? <SystemGrid model={model} /> : <SystemList model={model} />}
      <div className="rail-section">
        <RailPresets />
      </div>
      <div className="rail-section">
        <XraySlider />
        <DissectSlider />
        <SectionControl />
      </div>
      {showPlayback ? (
        <div className="rail-section">
          <p className="rail-section-title">Playback</p>
          <PlaybackSection />
        </div>
      ) : null}
      <div className="rail-tree">{tree ?? <Tree />}</div>
    </nav>
  )
}

/** Tablet: a 56 px strip of swatch cells with a Layers button that opens the full rail (spec 5.1.3). */
function RailStrip({ onExpand }: { onExpand: () => void }) {
  const model = useRailModel()
  return (
    <div className="rail-strip">
      <IconButton label="Layers" onClick={onExpand}>
        <Layers {...ICON} />
      </IconButton>
      {model.systems.map((sys) => (
        <SystemCell
          key={sys.id}
          system={sys}
          counts={model.counts.bySystem.get(sys.id) ?? { present: 0, total: 0 }}
          hidden={model.hiddenSystems.includes(sys.id)}
          theme={model.theme}
          palette={model.palette}
          onToggle={(solo) => model.toggle(sys, solo)}
        />
      ))}
    </div>
  )
}

export interface SystemsRailProps {
  tree?: ReactNode
}

export function SystemsRail({ tree }: SystemsRailProps) {
  const breakpoint = useBreakpoint()
  const [collapsed, setCollapsed] = useState(() => readLayout().railCollapsed ?? false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // The app root keys the rail column width on data-rail (styles.css); the rail owns the toggle until App lifts it.
  useEffect(() => {
    rootRef.current?.closest('.app')?.setAttribute('data-rail', collapsed ? 'collapsed' : 'open')
    writeLayout({ railCollapsed: collapsed })
  }, [collapsed])

  if (breakpoint === 'phone') return null
  if (breakpoint === 'tablet') {
    return (
      <div ref={rootRef} className="rail">
        <RailStrip onExpand={() => setSheetOpen(true)} />
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Systems" side="left" width={280} modal={false} className="rail-sheet">
          <RailContent tree={tree} />
        </Sheet>
      </div>
    )
  }
  if (collapsed) {
    return (
      <div ref={rootRef} className="rail rail-collapsed">
        <IconButton label="Expand systems rail" onClick={() => setCollapsed(false)}>
          <PanelLeftOpen {...ICON} />
        </IconButton>
      </div>
    )
  }
  return (
    <div ref={rootRef} className="rail-host" style={{ height: '100%' }}>
      <RailContent onCollapse={() => setCollapsed(true)} tree={tree} />
    </div>
  )
}
