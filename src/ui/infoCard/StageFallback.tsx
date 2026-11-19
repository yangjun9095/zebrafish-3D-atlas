// The stage card that the docked info card shows when nothing is selected (UX-LY-08): stage name,
// ZFS id, period, hpf range, landmarks, body length from the growth table and the structures
// that first appear in the stage. A pin keeps this view while a selection exists. When no
// structure starts in the stage, the panel states what is drawn and which milestones the stage
// carries instead of one empty line (review C-14): the adult stage starts nothing, and it is the
// endpoint of the whole model.
import { systemHex } from '../../core/palette.ts'
import { usePalette } from '../hooks/usePalette.ts'
import { useCallback, useMemo, useRef } from 'react'
import { Pin, PinOff } from 'lucide-react'
import { MEASURE_NAMES, formatLength, formatTime, lengthAt } from '../../core/format.ts'
import type { AtlasData, StageRecord } from '../../core/schema.ts'
import { periodAt } from '../../core/timeAxis.ts'
import { readAtlas, useAtlas, useAtlasShallow } from '../../state/store.ts'
import type { ZfaId } from '../../state/store.ts'
import { IconButton } from '../primitives/IconButton.tsx'
import { useTransientTime } from '../timeMotion.ts'
import { jumpTo } from './actions.ts'
import { firstAppearing, stageLabel, stageRangeText, trimHpf } from './model.ts'
import { AttributionFooter } from './Sections.tsx'

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

export interface StageFallbackProps {
  data: AtlasData
  pinned: boolean
  /** true while a selection exists; the pin then reads "Show the selection". */
  hasSelection: boolean
  onTogglePin: () => void
}

/** Body length at t from the growth table, with its measure named, written outside React (AR-17). */
function LiveLength({ data }: { data: AtlasData }) {
  const ref = useRef<HTMLSpanElement>(null)
  const apply = useCallback(
    (t: number) => {
      const read = lengthAt(data.stages.growth, t)
      if (!ref.current) return
      if (!read) {
        ref.current.textContent = 'no length in the table'
        return
      }
      const sl = read.standardLengthMm !== null && read.measure !== 'SL' ? `; ${read.standardLengthMm.toFixed(1)} mm standard length` : ''
      ref.current.textContent = `${formatLength(read)} ${MEASURE_NAMES[read.measure]}${sl}`
    },
    [data],
  )
  useTransientTime(apply)
  return <span ref={ref} className="tnum" />
}

/**
 * What the model draws now and which systems it draws, for a stage that starts nothing. The row
 * follows `presentIds`, which changes only when a structure appears or ends, not on every hour.
 */
function PresentNow({ data }: { data: AtlasData }) {
  const presentIds = useAtlasShallow((s) => s.presentIds)
  const present = new Set<string>(presentIds)
  const drawn = data.structures.filter((r) => r.geometry !== null && present.has(r.id))
  const total = data.structures.filter((r) => r.geometry !== null).length
  const names = [...data.systems]
    .sort((a, b) => a.order - b.order)
    .filter((sys) => drawn.some((r) => r.system === sys.id))
    .map((sys) => sys.displayName)
  return (
    <div data-testid="stage-present">
      <p className="info-section-title">Drawn in this stage</p>
      <p className="info-caption">
        {drawn.length} of {total} structures, in {names.length} systems.
      </p>
      {names.length > 0 ? <p className="info-caption">{names.join(', ')}</p> : null}
    </div>
  )
}

/** The stages.json events inside the stage window; a click glides the time to the event. */
function StageMilestones({ data, stage }: { data: AtlasData; stage: StageRecord }) {
  const events = data.stages.events.filter((e) => e.hpf >= stage.startHpf && e.hpf < stage.endHpf)
  if (events.length === 0) return null
  return (
    <div>
      <p className="info-section-title">Milestones ({events.length})</p>
      <ol className="info-list" data-testid="stage-milestones">
        {events.map((e) => (
          <li key={e.id}>
            <button type="button" className="info-row" title={e.description} onClick={() => jumpTo(e.hpf)}>
              <span className="info-row-time">{formatTime(e.hpf, 'hpf')}{e.hpfIsEstimate ? '~' : ''}</span>
              <span className="info-row-name">{e.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function StageFallback({ data, pinned, hasSelection, onTogglePin }: StageFallbackProps) {
  const stageIndex = useAtlas((s) => s.stageIndex)
  const theme = useAtlas((s) => s.theme)
  const palette = usePalette()
  const stages = data.stages.stages
  const stage = stages[Math.max(stageIndex, 0)]
  const period = periodAt(data.stages.periods, stage.startHpf)
  const appearing = useMemo(() => firstAppearing(data.structures, stage), [data, stage])

  return (
    <>
      <header className="info-head">
        <div className="info-head-main">
          <h2 className="info-title" data-testid="stage-info-title">{stageLabel(stage)}</h2>
          <p className="info-stage-meta">
            <span className="id-mono">{stage.zfs}</span>
            <span>{period.displayName} period</span>
          </p>
        </div>
        <div className="info-head-actions">
          <IconButton
            label={hasSelection && pinned ? 'Show the selection' : pinned ? 'Unpin the stage card' : 'Keep the stage card while a structure is selected'}
            size="sm"
            pressed={pinned}
            onClick={onTogglePin}
          >
            {pinned ? <PinOff {...ICON} /> : <Pin {...ICON} />}
          </IconButton>
        </div>
      </header>
      <p className="info-caption">
        <strong>{stageRangeText(stage)}</strong>
      </p>
      <p className="info-caption">
        Body length: <LiveLength data={data} />
      </p>
      {stage.landmarks.length > 0 ? (
        <ul className="info-landmarks">
          {stage.landmarks.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      ) : null}
      <div>
        <p className="info-section-title">Appears in this stage ({appearing.length})</p>
        {appearing.length === 0 ? (
          <p className="info-caption">No modelled structure starts in this stage.</p>
        ) : (
          <ul className="info-list" data-testid="stage-appearing">
            {appearing.map((r) => {
              const sys = data.systemsById.get(r.system)
              return (
                <li key={r.id}>
                  <button type="button" className="info-row" onClick={() => readAtlas().select(r.id as ZfaId)}>
                    <span className="info-swatch" style={{ ['--swatch' as string]: sys ? systemHex(sys, theme, palette) : 'currentColor', marginTop: 5 }} aria-hidden="true" />
                    <span className="info-row-name">{r.name}</span>
                    <span className="info-row-time">from {trimHpf(r.visibleFromHpf)} hpf</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {appearing.length === 0 ? (
        <>
          <PresentNow data={data} />
          <StageMilestones data={data} stage={stage} />
        </>
      ) : null}
      <AttributionFooter />
    </>
  )
}
