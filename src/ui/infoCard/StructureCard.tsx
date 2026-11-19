// The card of one selected structure (spec 5.4.1 to 5.4.3): header, chips, presence badge,
// windows, alias chain, definition, events, relations, handoffs, ZFIN link, actions, sources
// and the attribution footer. A group node shows the UI-23 note and its parts instead of a
// jump target (DM-09). Presentation mode (UI-36) keeps the name, presence, windows, alias line,
// the collapsed definition and the actions at the projector sizes; the reading rows stay out.
import { useMemo } from 'react'
import { Copy, Crosshair, Eye, EyeOff, ExternalLink, Link, Pin, X } from 'lucide-react'
import type { AtlasData, StructureRecord } from '../../core/schema.ts'
import { readAtlas, useAtlas, useAtlasShallow } from '../../state/store.ts'
import type { ZfaId } from '../../state/store.ts'
import { Button } from '../primitives/Button.tsx'
import { IconButton } from '../primitives/IconButton.tsx'
import { copyId, copyStructureLink, isolateIds, jumpTo, setHidden } from './actions.ts'
import {
  activeTerm, cardPresence, childrenOf, descendantsWithGeometry, firstFullyVisibleText, handoffLines, jumpTarget, nextEventIndex,
  sortedEvents, stageLabelAt, termRows, zfinUrl,
} from './model.ts'
import {
  AliasSection, AttributionFooter, CorrectionLink, EventsList, MeasurementsSection, PresenceBadge, SourcesSection, SystemChips, WindowLines,
} from './Sections.tsx'

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

export interface StructureCardProps {
  data: AtlasData
  record: StructureRecord
  /** false inside the phone sheet, whose header already names the structure. */
  showHeader?: boolean
  /** Desktop only: keeps the stage card while a selection exists (UX-LY-08). */
  onPinStage?: () => void
}

/** A structure row that selects its record; absent rows carry the clock state. */
function StructureLink({ record, absent }: { record: StructureRecord; absent: boolean }) {
  return (
    <button type="button" className="info-row" data-absent={absent ? 'true' : 'false'} onClick={() => readAtlas().select(record.id as ZfaId)}>
      <span className="info-row-name">{record.name}</span>
      {absent ? <span className="info-row-time">absent now</span> : null}
    </button>
  )
}

function RelationsSection({ record, data, presentIds }: { record: StructureRecord; data: AtlasData; presentIds: readonly string[] }) {
  const parent = record.uiParent ? data.structuresById.get(record.uiParent) ?? null : null
  const children = childrenOf(data.structures, record.id)
  const group = record.geometry === null
  return (
    <div data-testid="info-relations">
      {parent ? (
        <p className="info-caption">
          Part of{' '}
          <button type="button" className="info-id" onClick={() => readAtlas().select(parent.id as ZfaId)}>
            {parent.name}
          </button>
        </p>
      ) : null}
      {group ? <p className="info-caption">No 3D geometry for this term. Its parts are listed below.</p> : null}
      {children.length > 0 ? (
        <details className="info-details" open={group} data-testid="info-parts">
          <summary>Parts ({children.length})</summary>
          <ul className="info-list">
            {children.map((c) => (
              <li key={c.id}>
                <StructureLink record={c} absent={!presentIds.includes(c.id)} />
              </li>
            ))}
          </ul>
        </details>
      ) : group ? (
        <p className="info-caption">No part of this term is in the atlas yet.</p>
      ) : null}
      {record.synonyms.length > 0 ? (
        <details className="info-details">
          <summary>Synonyms ({record.synonyms.length})</summary>
          <p className="info-note">{record.synonyms.join(', ')}</p>
        </details>
      ) : null}
    </div>
  )
}

export function StructureCard({ data, record, showHeader = true, onPinStage }: StructureCardProps) {
  const stages = data.stages.stages
  const theme = useAtlas((s) => s.theme)
  const isolate = useAtlas((s) => s.isolate)
  const presentation = useAtlas((s) => s.presentation)
  const presentIds = useAtlasShallow((s) => s.presentIds)
  const events = useMemo(() => sortedEvents(record), [record])
  const targets = useMemo<ZfaId[]>(
    () => (record.geometry === null ? descendantsWithGeometry(data.structures, record.id).map((r) => r.id as ZfaId) : [record.id as ZfaId]),
    [data, record],
  )
  const hidden = useAtlas((s) => targets.length > 0 && targets.every((id) => s.hiddenStructures.includes(id)))
  // One shallow-compared row of primitives, so the card re-renders at boundaries only (AR-17).
  const view = useAtlasShallow((s) => {
    const ctx = { t: s.time, units: s.units, sex: s.sex }
    const p = cardPresence(record, stages, ctx)
    const term = activeTerm(record, s.time)
    const jump = jumpTarget(record, stages, s.time, s.snap, s.units)
    return {
      kind: p.kind,
      present: p.presence.present,
      termId: term.zfaId,
      termName: term.name,
      termFrom: term.fromHpf,
      termTo: term.toHpf,
      termOwn: term.own,
      // UI-24: no "ZFIN term now" line before the first alias window opens.
      aliasBeforeFirst: record.aliasChain.length > 0 && s.time < termRows(record)[0].fromHpf,
      nextEvent: nextEventIndex(events, s.time),
      jumpHpf: jump?.hpf ?? null,
      jumpLabel: jump?.label ?? null,
      units: s.units,
    }
  })
  const term = { zfaId: view.termId, name: view.termName, fromHpf: view.termFrom, toHpf: view.termTo, own: view.termOwn }
  const handoffs = useMemo(
    () => handoffLines(data.handoffs, data.stages.growth, data.structuresById, record.id, view.units),
    [data, record, view.units],
  )
  const definition = record.definition ? <p className="info-definition" data-testid="info-definition">{record.definition}</p> : null

  return (
    <>
      {showHeader ? (
        <header className="info-head">
          <div className="info-head-main">
            <h2 className="info-title">{record.name}</h2>
            <button type="button" className="info-id" title="Copy the ZFA id" onClick={() => void copyId(record.id)}>
              {record.id}
              <Copy {...ICON} />
            </button>
          </div>
          <div className="info-head-actions">
            {onPinStage ? (
              <IconButton label="Show the stage card" size="sm" onClick={onPinStage}>
                <Pin {...ICON} />
              </IconButton>
            ) : null}
            <IconButton label="Close" shortcut="Esc" size="sm" onClick={() => readAtlas().clearSelection()}>
              <X {...ICON} />
            </IconButton>
          </div>
        </header>
      ) : (
        <button type="button" className="info-id" title="Copy the ZFA id" onClick={() => void copyId(record.id)}>
          {record.id}
          <Copy {...ICON} />
        </button>
      )}
      {presentation ? null : <SystemChips record={record} data={data} theme={theme} />}
      <PresenceBadge
        kind={view.kind}
        record={record}
        termName={view.termName}
        endStageLabel={stageLabelAt(stages, record.modelEndHpf)}
        firstVisibleText={firstFullyVisibleText(record, view.units)}
        units={view.units}
      />
      <WindowLines record={record} data={data} showNote={!presentation} showModel={!presentation} />
      <AliasSection record={record} term={term} beforeFirst={view.aliasBeforeFirst} />
      {presentation && definition ? (
        <details className="info-details">
          <summary>Definition</summary>
          {definition}
        </details>
      ) : (
        definition
      )}
      <div className="info-actions">
        {view.jumpHpf !== null && view.jumpLabel ? (
          <Button variant={view.present ? 'secondary' : 'primary'} data-testid="info-jump" onClick={() => jumpTo(view.jumpHpf as number)}>
            {view.jumpLabel}
          </Button>
        ) : null}
        {presentation ? null : (
          <>
            <Button pressed={isolate} disabled={targets.length === 0} onClick={() => (isolate ? readAtlas().setIsolate(false) : isolateIds(targets))}>
              <Crosshair {...ICON} />
              Isolate
            </Button>
            <Button disabled={targets.length === 0} onClick={() => setHidden(targets, !hidden)}>
              {hidden ? <Eye {...ICON} /> : <EyeOff {...ICON} />}
              {hidden ? 'Show' : 'Hide'}
            </Button>
            <Button onClick={() => void copyStructureLink([record.id])}>
              <Link {...ICON} />
              Copy link
            </Button>
            <a className="btn" href={zfinUrl(view.termId)} target="_blank" rel="noopener noreferrer" data-testid="info-zfin-link">
              Open in ZFIN
              <ExternalLink {...ICON} />
            </a>
            <CorrectionLink record={record} />
          </>
        )}
      </div>
      {presentation ? null : (
        <>
          <EventsList events={events} nextIndex={view.nextEvent} units={view.units} />
          <RelationsSection record={record} data={data} presentIds={presentIds} />
          {handoffs.length > 0 ? (
            <ul className="info-list" data-testid="info-handoffs">
              {handoffs.map((h) => (
                <li key={h.id} className="info-row-static">
                  <span>
                    {h.direction === 'from' ? 'Develops from' : 'Becomes'} {h.names.join(', ')} ({h.window})
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <MeasurementsSection record={record} />
          <SourcesSection sources={record.sources} />
        </>
      )}
      <AttributionFooter />
    </>
  )
}
