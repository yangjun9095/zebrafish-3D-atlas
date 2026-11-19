// Shared rows of the info card (spec 5.4.1): system chips, the presence badge with a live time,
// the ZFIN and model windows, the alias chain, events, sources, measurements and the
// attribution footer (D14, DM-27).
import { systemHex } from '../../core/palette.ts'
import { usePalette } from '../hooks/usePalette.ts'
import { useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { Clock, ExternalLink } from 'lucide-react'
import {
  ATTRIBUTION_FILE,
  EMBEDDED_ATTRIBUTION_ID,
  EMBEDDED_NOTICES_ID,
  NOTICES_FILE,
  attribution,
  attributionFooter,
} from '../../core/attribution.ts'
import { NoticeLink } from '../About.tsx'
import { formatTime } from '../../core/format.ts'
import type { Units } from '../../core/format.ts'
import type { AtlasData, StructureEvent, StructureRecord } from '../../core/schema.ts'
import { splitSources } from '../../core/sourceKind.ts'
import { readAtlas } from '../../state/store.ts'
import { useTransientTime } from '../timeMotion.ts'
import { jumpTo } from './actions.ts'
import { correctionHref, linkify, modelWindowText, sizeRowText, termRows, termText, zfinWindowText } from './model.ts'
import type { CardPresenceKind, TermRow } from './model.ts'

const ICON = { strokeWidth: 1.75, 'aria-hidden': true } as const

/** The current time as text, written outside React on every change (AR-17). */
export function LiveTime({ units }: { units: Units }) {
  const ref = useRef<HTMLSpanElement>(null)
  const apply = useCallback(
    (t: number) => {
      if (ref.current) ref.current.textContent = formatTime(t, units)
    },
    [units],
  )
  useTransientTime(apply)
  return <span ref={ref} className="tnum" />
}

export interface SystemChipsProps {
  record: StructureRecord
  data: AtlasData
  theme: 'dark' | 'light'
}

/** Swatch plus the D5 display name; `alsoIn` systems as muted chips. */
export function SystemChips({ record, data, theme }: SystemChipsProps) {
  const palette = usePalette()
  const chip = (id: string, also: boolean) => {
    const sys = data.systemsById.get(id as never)
    if (!sys) return null
    return (
      <span key={id} className="info-chip" data-also={also ? 'true' : 'false'} data-system={id}>
        <span className="info-swatch" style={{ ['--swatch' as string]: systemHex(sys, theme, palette) }} aria-hidden="true" />
        {sys.displayName}
      </span>
    )
  }
  return (
    <div className="info-chips" aria-label="Systems">
      {chip(record.system, false)}
      {record.alsoIn.map((id) => chip(id, true))}
    </div>
  )
}

export interface PresenceBadgeProps {
  kind: CardPresenceKind
  record: StructureRecord
  /** The active alias name for the UI-24 sentence. */
  termName: string
  /** The end stage label for the UI-22 sentence. */
  endStageLabel: string
  firstVisibleText: string
  units: Units
}

/** "Present", "Not present at 26 hpf", "Modelled until 168 hpf (Days 7-13)" or the UI-24 alias sentence. */
export function PresenceBadge({ kind, record, termName, endStageLabel, firstVisibleText, units }: PresenceBadgeProps) {
  let body: ReactNode
  if (kind === 'present') body = 'Present'
  else if (kind === 'before') body = <>Not present at <LiveTime units={units} /></>
  else if (kind === 'after') body = `Modelled until ${formatTime(record.modelEndHpf, 'hpf')} (${endStageLabel})`
  else if (kind === 'sex') body = `Drawn for the ${record.sexSpecific} fish only; switch the sex toggle`
  else {
    body = (
      <>
        ZFIN describes the {termName} at <LiveTime units={units} />; the model draws the {record.name} from {firstVisibleText}
      </>
    )
  }
  return (
    <p className="info-presence" data-kind={kind} data-testid="info-presence">
      {kind === 'present' ? null : <Clock {...ICON} />}
      <span>{body}</span>
    </p>
  )
}

/** The ZFIN window and, when the model window differs, the model line with the record's reader note (not its rationale). */
export function WindowLines({ record, data, showNote = true, showModel = true }: { record: StructureRecord; data: AtlasData; showNote?: boolean; showModel?: boolean }) {
  const model = showModel ? modelWindowText(record) : null
  return (
    <div>
      <p className="info-caption" data-testid="info-zfin-window">{zfinWindowText(record, data.stages.stages)}</p>
      {model ? (
        // A div, not a p: <details> is not phrasing content, so it cannot nest inside a paragraph
        // without the browser closing the p early and splitting the accessible tree.
        <div className="info-caption" data-testid="info-model-window">
          {model}
          {record.overrideNote && showNote ? (
            <details className="info-details" style={{ borderTop: 0, paddingTop: 0 }}>
              <summary>Why the model differs</summary>
              <p className="info-note">{record.overrideNote}</p>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** "ZFIN term now" plus the collapsed list of every term in the chain (UI-24, UI-25). No current term shows before the first window. */
export function AliasSection({ record, term, beforeFirst }: { record: StructureRecord; term: TermRow; beforeFirst: boolean }) {
  if (record.aliasChain.length === 0) return null
  const rows = termRows(record)
  return (
    <div>
      {beforeFirst ? null : (
        <p className="info-caption" data-testid="info-alias">
          ZFIN term now: <strong>{termText(term)}</strong>
        </p>
      )}
      <details className="info-details">
        <summary>All ZFIN terms ({rows.length})</summary>
        <ul className="info-list">
          {rows.map((r) => (
            <li key={r.zfaId} className="info-row-static info-term" data-active={r.zfaId === term.zfaId ? 'true' : 'false'}>
              <span className="info-row-name">{termText(r)}</span>
              {r.zfaId === term.zfaId ? <span>now</span> : null}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

export interface EventsListProps {
  events: readonly StructureEvent[]
  nextIndex: number
  units: Units
}

/** The record's events by hpf; the next one after t carries a clock; a click glides t there. */
export function EventsList({ events, nextIndex, units }: EventsListProps) {
  if (events.length === 0) return null
  return (
    <div>
      <p className="info-section-title">Events</p>
      <ol className="info-list" data-testid="info-events">
        {events.map((e, i) => (
          <li key={`${e.hpf}-${i}`}>
            <button
              type="button"
              className="info-row"
              data-active={i === nextIndex ? 'true' : 'false'}
              title={e.source ? `Go to ${formatTime(e.hpf, units)}. Source: ${e.source}` : `Go to ${formatTime(e.hpf, units)}`}
              onClick={() => jumpTo(e.hpf)}
            >
              <span className="info-row-time">{formatTime(e.hpf, units)}{e.estimate ? '~' : ''}</span>
              <span className="info-row-name">{e.text}</span>
              {i === nextIndex ? <Clock className="info-row-icon" {...ICON} /> : null}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** One labelled list of sources; each citation with its URL as a link. */
function SourceList({ title, items, testId }: { title: string; items: readonly string[]; testId: string }) {
  if (items.length === 0) return null
  return (
    <>
      <p className="info-section-title">{title} ({items.length})</p>
      <ul className="info-list" data-testid={testId}>
        {items.map((s, i) => (
          <li key={i} className="info-row-static">
            <span>
              {linkify(s).map((seg, j) =>
                seg.href ? (
                  <a key={j} href={seg.href} target="_blank" rel="noopener noreferrer">
                    {seg.text}
                  </a>
                ) : (
                  <span key={j}>{seg.text}</span>
                ),
              )}
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * Collapsed "Sources (3)", in two labelled lists. A paper and an internal modelling note sat in
 * one column, so five entries read as five citations (review M9). "Literature" holds the URLs,
 * the DOIs and the author-year citations; "Modelling notes" holds the measurements, the estimates
 * and the reasoning. src/core/sourceKind.ts states the rule, the same one docs/SOURCES.md counts.
 */
export function SourcesSection({ sources }: { sources: readonly string[] }) {
  if (sources.length === 0) return null
  const { literature, notes } = splitSources(sources)
  return (
    <details className="info-details" data-testid="info-sources">
      <summary>Sources ({sources.length})</summary>
      <SourceList title="Literature" items={literature} testId="info-sources-literature" />
      <SourceList title="Modelling notes" items={notes} testId="info-sources-notes" />
    </details>
  )
}

/**
 * The link to the anatomy correction form, with the ZFA id and the hour already in the issue
 * title. The href follows the store lazily, as the embed footer does: it is rebuilt when the
 * pointer or the focus reaches the link, so the card does not re-render on every time change.
 */
export function CorrectionLink({ record }: { record: StructureRecord }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const refresh = () => {
    if (ref.current) ref.current.href = correctionHref(record, readAtlas().time)
  }
  return (
    <a
      ref={ref}
      className="btn"
      href={correctionHref(record, readAtlas().time)}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="info-correction"
      title="Open a GitHub issue with the ZFA id and the stage filled in"
      onPointerEnter={refresh}
      onPointerDown={refresh}
      onFocus={refresh}
    >
      Report a correction
      <ExternalLink {...ICON} />
    </a>
  )
}

/** Collapsed reference measurements from the record's size rows. */
export function MeasurementsSection({ record }: { record: StructureRecord }) {
  if (record.sizes.length === 0) return null
  return (
    <details className="info-details">
      <summary>Measurements ({record.sizes.length})</summary>
      <ul className="info-list">
        {record.sizes.map((row, i) => (
          <li key={i} className="info-row-static" title={row.source}>
            <span>{sizeRowText(row)}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

/** Both ZFIN licences with their URLs, "Geometry is schematic.", and the two notice links (D14, DM-27, L-06). */
export function AttributionFooter() {
  return (
    <p className="info-footer" data-testid="info-attribution" title={attributionFooter()}>
      {attribution.zfin.footer.replace(attribution.zfin.license, '').trim()}{' '}
      <a href={attribution.zfin.licenseUrl} target="_blank" rel="noopener noreferrer">
        {attribution.zfin.license}
      </a>
      ; {attribution.ontology.footer.replace(attribution.ontology.license, '').replace(/,\s*$/, '')},{' '}
      <a href={attribution.ontology.licenseUrl} target="_blank" rel="noopener noreferrer">
        {attribution.ontology.license}
      </a>
      . Geometry is schematic.{' '}
      <NoticeLink file={ATTRIBUTION_FILE} embeddedId={EMBEDDED_ATTRIBUTION_ID} title="Attribution" label="Attribution" /> and{' '}
      <NoticeLink file={NOTICES_FILE} embeddedId={EMBEDDED_NOTICES_ID} title="Third-party notices" label="third-party notices" />.
    </p>
  )
}
