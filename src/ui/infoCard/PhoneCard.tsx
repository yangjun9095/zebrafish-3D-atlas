// The phone form of the info card (spec 5.1.1, 5.1.4): a 96 px peek strip in the layout row
// above the timeline bar, and a bottom sheet at the half or full detent for the whole card.
// The sheet stops at the top of the timeline bar, so the bar stays usable.
import { useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { ChevronDown, ChevronUp, Clock, X } from 'lucide-react'
import type { AtlasData, StructureRecord } from '../../core/schema.ts'
import { readAtlas, useAtlasShallow } from '../../state/store.ts'
import { IconButton } from '../primitives/IconButton.tsx'
import { Sheet } from '../primitives/Sheet.tsx'
import type { SheetDetent } from '../primitives/Sheet.tsx'
import { LiveTime } from './Sections.tsx'
import { cardPresence, stageByZfs, stageLabel } from './model.ts'

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

export interface PhoneCardProps {
  data: AtlasData
  records: readonly StructureRecord[]
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void
  /** The full card body, rendered inside the sheet. */
  children: ReactNode
  /** A selected vocabulary term (D17) names the strip instead of the highlighted record. */
  term?: { name: string; id: string; line: string } | null
}

/** "High-pec to Adult" while present, else the absent badge text with a live time. */
function PeekLine({ data, record }: { data: AtlasData; record: StructureRecord }) {
  const stages = data.stages.stages
  const view = useAtlasShallow((s) => {
    const p = cardPresence(record, stages, { t: s.time, units: s.units, sex: s.sex })
    return { kind: p.kind, units: s.units, modelEnd: record.modelEndHpf }
  })
  if (view.kind === 'present') {
    const start = stageByZfs(stages, record.zfinStartStage)
    const end = stageByZfs(stages, record.zfinEndStage)
    return <p className="info-peek-line">{start ? stageLabel(start) : 'unknown'} to {end ? stageLabel(end) : 'unknown'} (ZFIN)</p>
  }
  return (
    <p className="info-peek-line">
      <Clock {...ICON} />
      {view.kind === 'before' || view.kind === 'aliasBefore' ? (
        <span>
          Not present at <LiveTime units={view.units} />
        </span>
      ) : view.kind === 'after' ? (
        <span>Modelled until {view.modelEnd} hpf</span>
      ) : (
        <span>Not drawn for this sex</span>
      )}
    </p>
  )
}

/** The expand button cycles the detents: peek, half, full, peek. */
function nextDetent(d: SheetDetent): SheetDetent {
  return d === 'peek' ? 'half' : d === 'half' ? 'full' : 'peek'
}

export function PhoneCard({ data, records, onKeyDown, children, term = null }: PhoneCardProps) {
  const [detent, setDetent] = useState<SheetDetent>('peek')
  const first: StructureRecord | undefined = records[0]
  const title = term ? term.name : records.length > 1 ? `${records.length} selected` : first?.name ?? 'Selection'
  const open = detent !== 'peek'
  return (
    <>
      <section className="info-peek" data-testid="info-card" aria-label="Structure information" onKeyDown={onKeyDown}>
        <div style={{ minWidth: 0 }}>
          <p className="info-peek-title">
            {title}
            {term ? <span className="id-mono">{term.id}</span> : records.length === 1 ? <span className="id-mono">{first.id}</span> : null}
          </p>
          {term ? (
            <p className="info-peek-line">{term.line}</p>
          ) : records.length === 1 ? (
            <PeekLine data={data} record={first} />
          ) : (
            <p className="info-peek-line">{records.map((r) => r.name).join(', ')}</p>
          )}
        </div>
        <div className="info-peek-actions">
          <IconButton label="Expand the info card" aria-expanded={open} data-testid="info-expand" onClick={() => setDetent(nextDetent(detent))}>
            {detent === 'full' ? <ChevronDown {...ICON} /> : <ChevronUp {...ICON} />}
          </IconButton>
          <IconButton label="Close" onClick={() => readAtlas().clearSelection()}>
            <X {...ICON} />
          </IconButton>
        </div>
      </section>
      <Sheet
        open={open}
        onClose={() => setDetent('peek')}
        title={title}
        side="bottom"
        detent={detent}
        modal={false}
        className="info-sheet"
        actions={
          <IconButton label={detent === 'full' ? 'Half height' : 'Full height'} size="sm" onClick={() => setDetent(detent === 'full' ? 'half' : 'full')}>
            {detent === 'full' ? <ChevronDown {...ICON} /> : <ChevronUp {...ICON} />}
          </IconButton>
        }
      >
        <div className="info-card" data-testid="info-sheet" onKeyDown={onKeyDown}>
          {children}
        </div>
      </Sheet>
    </>
  )
}
