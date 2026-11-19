// The stage card above the thumb (UX-TL-14), the hover tooltip of the track (UX-TL-11) and the
// event list of a merged marker (UI-09). The card writes its text through refs on each time change.
import { useCallback, useEffect, useRef } from 'react'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { EventRecord, StagesFile } from '../core/schema.ts'
import { capitalizeLabel, formatLength, formatTime, formatTimeBoth, lengthAt } from '../core/format.ts'
import type { Units } from '../core/format.ts'
import { periodAt, stageAt } from '../core/timeAxis.ts'
import { readAtlas } from '../state/store.ts'
import type { EventMarker } from './timelineGeometry.ts'
import { timeText } from './timelineGeometry.ts'
import { useTransientTime } from './timeMotion.ts'

export interface StageCardProps {
  stages: StagesFile
  shown: boolean
}

/** Floats above the thumb while it is dragged, hovered or focused: stage, time and ZFS id, body length. */
export function StageCard({ stages, shown }: StageCardProps) {
  const nameRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const lenRef = useRef<HTMLDivElement>(null)

  const apply = useCallback(
    (t: number) => {
      const s = readAtlas()
      const stage = stageAt(stages.stages, t)
      const shownT = s.snap ? stage.startHpf : t
      const time = timeText(shownT, s.units, s.snap, s.temperatureC)
      if (nameRef.current) nameRef.current.textContent = capitalizeLabel(stage.shortLabel)
      if (metaRef.current) {
        metaRef.current.textContent = time.chip ? `${time.text} (${time.chip})` : time.text
        const id = document.createElement('span')
        id.className = 'id-mono tl-card-id'
        id.textContent = stage.zfs
        metaRef.current.appendChild(id)
      }
      if (lenRef.current) lenRef.current.textContent = formatLength(lengthAt(stages.growth, t)) ?? ''
    },
    [stages],
  )
  useTransientTime(apply)

  return (
    <div className="tl-card" data-shown={shown ? 'true' : 'false'} aria-hidden="true" data-testid="stage-card">
      <div className="tl-card-name" ref={nameRef} />
      <div className="tl-card-meta" ref={metaRef} />
      <div className="tl-card-len" ref={lenRef} />
    </div>
  )
}

export interface TrackTooltipProps {
  /** Track x in px of the hovered time. */
  x: number
  hpf: number
  stages: StagesFile
  /** Events listed under the stage lines (markers on desktop, events within 8 px elsewhere). */
  events: readonly EventRecord[]
  snap: boolean
  units: Units
  temperatureC: number
}

/** "Prim-5, Pharyngula" / "24 hpf ZFS:0000029" / landmark sentence, plus one line per event. */
export function TrackTooltip({ x, hpf, stages, events, snap, units, temperatureC }: TrackTooltipProps) {
  const stage = stageAt(stages.stages, hpf)
  const period = periodAt(stages.periods, hpf)
  const shownT = snap ? stage.startHpf : hpf
  const time = shownT >= 72 && units === 'auto' ? formatTimeBoth(shownT) : timeText(shownT, units, snap, temperatureC).text
  return (
    <div className="tl-tip" role="tooltip" style={{ '--hx': `${x}px` } as CSSProperties}>
      <div className="tl-tip-1">
        {capitalizeLabel(stage.shortLabel)}, {period.displayName}
      </div>
      <div className="tl-tip-2">
        {time}
        <span className="id-mono">{stage.zfs}</span>
      </div>
      {stage.landmarks[0] ? <p className="tl-tip-3">{stage.landmarks[0]}</p> : null}
      {events.map((e) => (
        <p key={e.id} className="tl-tip-ev">
          {e.label}, {formatTime(e.hpf)}
          {e.slMm !== null ? ` (SL ${e.slMm} mm, estimate)` : e.hpfIsEstimate ? ' (estimate)' : ''}
        </p>
      ))}
    </div>
  )
}

export interface EventListProps {
  marker: EventMarker
  onPick: (hpf: number) => void
}

/** The id the track names in `aria-controls` while the list is open. */
export const EVENT_LIST_ID = 'tl-event-list'

/** The 200 px list under a merged marker; each row moves t to its event (UI-09). Escape closes it (Track.tsx). */
export function EventList({ marker, onPick }: EventListProps) {
  const rootRef = useRef<HTMLUListElement>(null)

  // Opening the menu (mouse or keyboard) moves focus to the first item (WAI-ARIA menu pattern).
  useEffect(() => {
    rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [marker])

  /** ArrowDown, ArrowUp, Home and End move focus among the events. */
  const onKeyDown = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
    if (items.length === 0) return
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    const go = (j: number) => items[(j + items.length) % items.length]?.focus()
    if (e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(items.length - 1)
    else return
    e.preventDefault()
  }

  return (
    <ul ref={rootRef} id={EVENT_LIST_ID} className="tl-evlist" role="menu" aria-label="Events" style={{ '--ex': `${marker.x}px` } as CSSProperties} onKeyDown={onKeyDown}>
      {marker.events.map((e) => (
        <li key={e.id} role="none">
          <button type="button" role="menuitem" onClick={() => onPick(e.hpf)}>
            {e.label}
            <small>{formatTime(e.hpf)}{e.hpfIsEstimate ? ' (estimate)' : ''}</small>
          </button>
        </li>
      ))}
    </ul>
  )
}
