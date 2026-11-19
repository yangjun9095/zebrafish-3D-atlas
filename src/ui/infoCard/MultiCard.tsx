// The list card of a multi-selection (UI-21): one row per member with swatch, name and a remove
// button; Isolate, Hide and Copy link act on every member.
import { systemHex } from '../../core/palette.ts'
import { usePalette } from '../hooks/usePalette.ts'
import { Crosshair, Eye, EyeOff, Link, X } from 'lucide-react'
import type { AtlasData, StructureRecord } from '../../core/schema.ts'
import { readAtlas, useAtlas, useAtlasShallow } from '../../state/store.ts'
import type { ZfaId } from '../../state/store.ts'
import { Button } from '../primitives/Button.tsx'
import { IconButton } from '../primitives/IconButton.tsx'
import { copyStructureLink, isolateIds, setHidden } from './actions.ts'
import { AttributionFooter } from './Sections.tsx'

export interface MultiCardProps {
  data: AtlasData
  records: readonly StructureRecord[]
  showHeader?: boolean
}

export function MultiCard({ data, records, showHeader = true }: MultiCardProps) {
  const theme = useAtlas((s) => s.theme)
  const palette = usePalette()
  const isolate = useAtlas((s) => s.isolate)
  const presentIds = useAtlasShallow((s) => s.presentIds)
  const ids = records.map((r) => r.id as ZfaId)
  const allHidden = useAtlas((s) => ids.every((id) => s.hiddenStructures.includes(id)))

  return (
    <>
      {showHeader ? (
        <header className="info-head">
          <div className="info-head-main">
            <h2 className="info-title">{records.length} selected</h2>
            <p className="info-count">Up to 12 structures; Shift+click adds one</p>
          </div>
          <div className="info-head-actions">
            <IconButton label="Clear selection" shortcut="Esc" size="sm" onClick={() => readAtlas().clearSelection()}>
              <X strokeWidth={1.75} aria-hidden="true" />
            </IconButton>
          </div>
        </header>
      ) : (
        <p className="info-count">{records.length} selected</p>
      )}
      <ul className="info-list" data-testid="info-members">
        {records.map((r) => {
          const sys = data.systemsById.get(r.system)
          const absent = !(presentIds as readonly string[]).includes(r.id)
          return (
            <li key={r.id} className="info-member" data-id={r.id}>
              <button type="button" className="info-row" data-absent={absent ? 'true' : 'false'} onClick={() => readAtlas().select(r.id as ZfaId)}>
                <span className="info-swatch" style={{ ['--swatch' as string]: sys ? systemHex(sys, theme, palette) : 'currentColor' }} aria-hidden="true" />
                <span className="info-row-name">{r.name}</span>
                {absent ? <span className="info-row-time">absent now</span> : null}
              </button>
              <IconButton label={`Remove ${r.name}`} size="md" tooltip={false} onClick={() => readAtlas().select(r.id as ZfaId, { add: true })}>
                <X strokeWidth={1.75} aria-hidden="true" />
              </IconButton>
            </li>
          )
        })}
      </ul>
      <div className="info-actions">
        <Button pressed={isolate} onClick={() => (isolate ? readAtlas().setIsolate(false) : isolateIds(ids))}>
          <Crosshair strokeWidth={1.75} aria-hidden="true" />
          Isolate
        </Button>
        <Button onClick={() => setHidden(ids, !allHidden)}>
          {allHidden ? <Eye strokeWidth={1.75} aria-hidden="true" /> : <EyeOff strokeWidth={1.75} aria-hidden="true" />}
          {allHidden ? 'Show all' : 'Hide all'}
        </Button>
        <Button onClick={() => void copyStructureLink(ids)}>
          <Link strokeWidth={1.75} aria-hidden="true" />
          Copy link
        </Button>
      </div>
      <AttributionFooter />
    </>
  )
}
