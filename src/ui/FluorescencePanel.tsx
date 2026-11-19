// The Reporter preview panel (D18). The reader sketches which modeled tissue carries which
// reporter and over which hours; the viewer draws that sketch. Nothing here reads or predicts
// enhancer activity, and the panel copy says so.
//
// The panel lives in the overlay registry under the id 'lab', so Escape closes it in the 5.9.1
// order and it never unmounts the info card. Time-dependent text (the legend counts, the rule
// status line) follows the store through useTransientTime, so a scrub does not re-render the
// panel on every frame (AR-17).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Copy, FlaskConical, Plus, Trash2 } from 'lucide-react'
import {
  exampleFluorescence, fluorescenceTargets, MAX_FLUORESCENCE_RULES, newRuleId, REPORTERS, ReporterId,
  resolveFluorescence, ruleActiveAt,
} from '../core/fluorescence.ts'
import type { FluorescenceRule } from '../core/fluorescence.ts'
import { hasMeshAt } from '../core/presence.ts'
import type { AtlasData } from '../core/schema.ts'
import { readAtlas, useAtlas, useAtlasShallow } from '../state/store.ts'
import { useBreakpoint } from './hooks/useBreakpoint.ts'
import { IconButton } from './primitives/IconButton.tsx'
import { Sheet } from './primitives/Sheet.tsx'
import { useTransientTime } from './timeMotion.ts'
import './FluorescencePanel.css'

const ICON = { size: 16, 'aria-hidden': true } as const

/** One name for the feature, in the button, the panel title, the legend and the docs. */
export const REPORTER_PREVIEW = 'Reporter preview'
const CAPTION = 'Sketch where and when a reporter lights up: the viewer draws your choice and predicts nothing.'
const INTRO = 'Choose a tissue, a time window and a reporter, then scrub development to see the pattern you defined.'
const CHANNEL_NOTE = 'Colours are pseudocolours; spectral overlap is not modelled.'
const EMPTY_STATE = 'Add a target tissue to start.'
const LEGEND_TITLE = 'Schematic reporter preview'
const MAX_MATCHES = 7

/** "EGFP, 507 nm": the published emission peak beside the name, in the picker and the legend. */
function reporterLabel(id: ReporterId): string {
  return `${REPORTERS[id].name}, ${REPORTERS[id].emissionNm} nm`
}

function TimeFields({ rule, onChange }: { rule: FluorescenceRule; onChange: (patch: Partial<FluorescenceRule>) => void }) {
  const from = useRef<HTMLInputElement>(null)
  const to = useRef<HTMLInputElement>(null)
  const [error, setError] = useState(false)
  // The two inputs stay uncontrolled and this effect writes a value the store changed elsewhere
  // ("This time only", a link, a bookmark) into the field the reader is not typing in. Keying the
  // element on the value instead unmounted both inputs on commit and dropped focus mid-Tab.
  useEffect(() => {
    const a = from.current
    const b = to.current
    if (a && document.activeElement !== a) a.value = String(rule.fromHpf)
    if (b && document.activeElement !== b) b.value = String(rule.toHpf)
  }, [rule.fromHpf, rule.toHpf])
  // Each input commits on its own blur, so Tab from From to Through writes one rule and leaves
  // the focus where the reader put it.
  const commit = () => {
    const a = from.current?.valueAsNumber ?? NaN
    const b = to.current?.valueAsNumber ?? NaN
    const valid = Number.isFinite(a) && Number.isFinite(b) && a >= 0 && b <= 4320 && a <= b
    setError(!valid)
    if (valid) onChange({ fromHpf: Math.round(a * 100) / 100, toHpf: Math.round(b * 100) / 100 })
  }
  const onKeyDown = (e: { key: string; currentTarget: HTMLInputElement }) => {
    if (e.key === 'Enter') e.currentTarget.blur()
  }
  return <>
    <div className="fp-times">
      <label>From (hpf)<input ref={from} aria-label="From (hpf)" type="number" min="0" max="4320" step="0.01" defaultValue={rule.fromHpf} onBlur={commit} onKeyDown={onKeyDown} /></label>
      <span aria-hidden="true">—</span>
      <label>Through (hpf)<input ref={to} aria-label="Through (hpf)" type="number" min="0" max="4320" step="0.01" defaultValue={rule.toHpf} onBlur={commit} onKeyDown={onKeyDown} /></label>
    </div>
    {error ? <p role="alert" className="fp-error">Use 0–4320 hpf, with start ≤ end. The preview keeps the last valid window.</p> : null}
  </>
}

function RuleEditor({ rule, index, options, data, onChange, onDuplicate, onRemove, canAdd }: {
  rule: FluorescenceRule; index: number; options: ReactNode; data: AtlasData
  onChange: (patch: Partial<FluorescenceRule>) => void; onDuplicate: () => void; onRemove: () => void; canAdd: boolean
}) {
  const sex = useAtlas((s) => s.sex)
  const hiddenSystems = useAtlas((s) => s.hiddenSystems)
  const hiddenStructures = useAtlas((s) => s.hiddenStructures)
  const isolate = useAtlas((s) => s.isolate)
  const selection = useAtlasShallow((s) => s.selection)
  const channel = useAtlas((s) => s.fluorescence.channel)
  const previewOn = useAtlas((s) => s.fluorescence.enabled)
  const targets = useMemo(() => fluorescenceTargets(data, rule.targetId, rule.includeParts), [data, rule.targetId, rule.includeParts])
  const statusRef = useRef<HTMLParagraphElement>(null)
  const statusTextRef = useRef<HTMLSpanElement>(null)
  const hiddenNoteRef = useRef<HTMLParagraphElement>(null)

  // The status line and the hidden-region note are the only parts of a rule that follow time, so
  // they are written straight to the DOM instead of re-rendering 221 options on every tick.
  const applyStatus = useCallback((t: number) => {
    const available = targets.filter((r) => hasMeshAt(r, t, { sex }))
    const visible = available.filter((r) => !hiddenSystems.includes(r.system) && !(hiddenStructures as string[]).includes(r.id)
      && (!isolate || !selection.length || (selection as string[]).includes(r.id)))
    const text = !rule.enabled ? 'Rule off' : !targets.length ? 'No modeled geometry' : !ruleActiveAt(rule, t) ? 'Outside time window'
      : !available.length ? 'Anatomy absent at this time' : !visible.length ? 'Hidden by visibility controls'
      : !previewOn ? 'Preview off' : channel !== 'all' && channel !== rule.reporter ? 'Channel hidden'
      : `${visible.length} ${visible.length === 1 ? 'region' : 'regions'} active`
    if (statusTextRef.current) statusTextRef.current.textContent = text
    if (statusRef.current) statusRef.current.dataset.active = String(text.endsWith('active'))
    const note = hiddenNoteRef.current
    if (!note) return
    const hiddenCount = available.length - visible.length
    note.hidden = hiddenCount <= 0 || visible.length === 0
    note.textContent = note.hidden ? '' : `${hiddenCount} regions hidden by visibility controls.`
  }, [targets, rule, sex, hiddenSystems, hiddenStructures, isolate, selection, channel, previewOn])
  useTransientTime(applyStatus)

  return <fieldset className="fp-rule" data-testid="fluorescence-rule">
    <legend>Target {index + 1}</legend>
    <div className="fp-rule-head">
      <label className="fp-check"><input type="checkbox" checked={rule.enabled} onChange={(e) => onChange({ enabled: e.target.checked })} />Enabled</label>
      <span className="fp-spacer" />
      <IconButton label="Duplicate target" disabled={!canAdd} onClick={onDuplicate}><Copy {...ICON} /></IconButton>
      <IconButton label="Remove target" onClick={onRemove}><Trash2 {...ICON} /></IconButton>
    </div>
    <label>Anatomy (ZFA)
      <select aria-label="Anatomy (ZFA)" value={rule.targetId} onChange={(e) => onChange({ targetId: e.target.value })}>
        {!data.structuresById.has(rule.targetId) ? <option value={rule.targetId}>Unknown term · {rule.targetId}</option> : null}
        {options}
      </select>
    </label>
    <label className="fp-check"><input type="checkbox" checked={rule.includeParts} onChange={(e) => onChange({ includeParts: e.target.checked })} />Include modeled parts</label>
    <details className="fp-mapping"><summary>{targets.length} mapped {targets.length === 1 ? 'region' : 'regions'} · {rule.targetId}</summary>
      <ul>{targets.map((r) => <li key={r.id}>{r.name} <span>{r.id}</span></li>)}</ul>
      {!targets.length ? <p>This term has no geometry with the current parts setting.</p> : null}
    </details>
    <label>Fluorescent protein
      <select aria-label="Fluorescent protein" value={rule.reporter} onChange={(e) => onChange({ reporter: e.target.value as ReporterId })}>
        {ReporterId.options.map((id) => <option key={id} value={id}>{reporterLabel(id)}</option>)}
      </select>
    </label>
    <TimeFields rule={rule} onChange={onChange} />
    <div className="fp-time-actions">
      <button type="button" onClick={() => { readAtlas().pause(); readAtlas().setTime(rule.fromHpf) }}>Jump to start</button>
      <button type="button" onClick={() => { const t = Math.round(readAtlas().time * 100) / 100; onChange({ fromHpf: t, toHpf: t }) }}>This time only</button>
    </div>
    <p className="fp-status" ref={statusRef} data-active="false"><i style={{ background: REPORTERS[rule.reporter].hex }} /><span ref={statusTextRef} /></p>
    <p className="fp-note" ref={hiddenNoteRef} hidden />
  </fieldset>
}

/**
 * The fish-context slider. The value stays local while the pointer is down and reaches the store
 * once, on release, so one drag runs one zod parse instead of one per tick.
 */
function ContextSlider() {
  const context = useAtlas((s) => s.fluorescence.context)
  const [draft, setDraft] = useState<number | null>(null)
  const value = draft ?? context
  const commit = () => {
    if (draft === null) return
    setDraft(null)
    if (draft !== context) readAtlas().setFluorescence({ context: draft })
  }
  return <label className="fp-context">Fish context <span>{value}%</span>
    <input
      aria-label="Fish context" type="range" min="0" max="100" value={value}
      onChange={(e) => setDraft(Number(e.target.value))}
      onPointerUp={commit} onPointerCancel={commit} onKeyUp={commit} onBlur={commit}
    />
  </label>
}

function PanelContent() {
  const data = useAtlas((s) => s.data)
  const config = useAtlas((s) => s.fluorescence)
  const selection = useAtlasShallow((s) => s.selection)
  const [search, setSearch] = useState('')
  const records = useMemo(() => [...(data?.structures ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [data])
  // One option list for every rule editor: 24 rules once cost 24 x 221 elements per render.
  const options = useMemo(
    () => records.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.id}{r.geometry ? '' : ' (group)'}</option>),
    [records],
  )
  const query = search.trim().toLowerCase()
  const matches = useMemo(
    () => (query ? records.filter((r) => `${r.name} ${r.id} ${r.synonyms.join(' ')}`.toLowerCase().includes(query)).slice(0, MAX_MATCHES) : []),
    [records, query],
  )
  if (!data) return <p>Loading anatomy…</p>
  const canAdd = config.rules.length < MAX_FLUORESCENCE_RULES
  const write = (rules: FluorescenceRule[]) => readAtlas().setFluorescence({ rules })
  const add = (targetId: string) => {
    const time = Math.round(readAtlas().time * 100) / 100
    write([...config.rules, { id: newRuleId(), targetId, includeParts: true, fromHpf: time, toHpf: Math.min(4320, time + 24), reporter: 'egfp', enabled: true }])
    setSearch('')
  }
  return <div className="fp-content">
    <p className="fp-caption">{CAPTION}</p>
    <p className="fp-intro">{INTRO}</p>
    <label className="fp-toggle"><input type="checkbox" checked={config.enabled} onChange={(e) => readAtlas().setFluorescence({ enabled: e.target.checked })} /><span>Show fluorescence</span></label>
    <div className="fp-display-controls">
      <label>View channel<select aria-label="View channel" value={config.channel} onChange={(e) => readAtlas().setFluorescence({ channel: e.target.value as typeof config.channel })}>
        <option value="all">Composite · all reporters</option>
        {ReporterId.options.map((id) => <option key={id} value={id}>{reporterLabel(id)}</option>)}
      </select></label>
      <p className="fp-note">{CHANNEL_NOTE}</p>
      <ContextSlider />
    </div>
    <div className="fp-add">
      <label>Add a target<input type="search" aria-label="Find anatomy for fluorescence" placeholder="Find tissue, synonym, or ZFA ID…" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      {query ? <div className="fp-matches">{matches.map((r) => <button type="button" key={r.id} disabled={!canAdd} onClick={() => add(r.id)}><Plus {...ICON} /><span>{r.name}<small>{r.id}{r.geometry ? '' : ' · group'}</small></span></button>)}{!matches.length ? <p>No modeled term matches.</p> : null}</div> : null}
      <button type="button" className="fp-add-button" disabled={!canAdd} onClick={() => add(selection[0] ?? 'ZFA:0000114')}><Plus {...ICON} />Add {selection.length ? 'selected anatomy' : 'target'}</button>
    </div>
    {!config.rules.length ? <div className="fp-empty"><FlaskConical size={28} aria-hidden="true" /><p>{EMPTY_STATE}</p><button type="button" onClick={() => { readAtlas().setFluorescence(exampleFluorescence()); readAtlas().pause(); readAtlas().setTime(48) }}>Try heart + liver + spinal cord</button></div> : null}
    {config.rules.map((rule, index) => <RuleEditor key={rule.id} rule={rule} index={index} options={options} data={data} canAdd={canAdd}
      onChange={(patch) => write(config.rules.map((r) => r.id === rule.id ? { ...r, ...patch } : r))}
      onDuplicate={() => write([...config.rules, { ...rule, id: newRuleId() }])}
      onRemove={() => write(config.rules.filter((r) => r.id !== rule.id))} />)}
    {!canAdd ? <p className="fp-note">Maximum {MAX_FLUORESCENCE_RULES} targets per preview.</p> : null}
    <p className="fp-note">Windows include both endpoints. Equal times select one snapshot. Repeated reporters combine coverage; different reporters mix colors. Section planes may clip active regions.</p>
    <p className="fp-note">The atlas draws the tissue you name in the colour you pick. It states no enhancer activity and no cell-level expression.</p>
  </div>
}

/**
 * The panel, as a sheet on every breakpoint. A sheet keeps the info card mounted, and the card is
 * the only host of the linked-term hook, the term sync and the selection announcement; the earlier
 * desktop layout replaced the card with this panel and silenced all three.
 */
export function FluorescencePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const layout = useBreakpoint()
  const side = layout === 'phone' ? 'bottom' : 'right'
  return <Sheet
    open={open} onClose={onClose} title={REPORTER_PREVIEW} side={side} detent="half" modal={false}
    className={side === 'bottom' ? 'fp-sheet fp-sheet-bottom' : 'fp-sheet fp-sheet-right'}
    actions={<span className="fp-eyebrow">Experimental</span>}
  ><PanelContent /></Sheet>
}

interface LegendCount { id: ReporterId; count: number }

function sameCounts(a: readonly LegendCount[], b: readonly LegendCount[]): boolean {
  return a.length === b.length && a.every((row, i) => row.id === b[i].id && row.count === b[i].count)
}

/** The time reading of the legend: hundredths, with a trailing ".00" dropped. */
function timeText(t: number): string {
  return `${t.toFixed(2).replace(/\.00$/, '')} hpf`
}

function LegendBody() {
  const data = useAtlas((s) => s.data)
  const config = useAtlas((s) => s.fluorescence)
  const sex = useAtlas((s) => s.sex)
  const hiddenSystems = useAtlas((s) => s.hiddenSystems)
  const hiddenStructures = useAtlas((s) => s.hiddenStructures)
  const selection = useAtlasShallow((s) => s.selection)
  const isolate = useAtlas((s) => s.isolate)
  const timeRef = useRef<HTMLSpanElement>(null)
  const [counts, setCounts] = useState<readonly LegendCount[]>([])
  const channelName = config.channel === 'all' ? 'Composite' : reporterLabel(config.channel)

  // The reading follows every tick; the rows change only when a window opens or closes, so the
  // React render runs on that event and not on the tick.
  const apply = useCallback((t: number) => {
    if (timeRef.current) timeRef.current.textContent = `${timeText(t)} · ${channelName}`
    if (!data) return
    const tally = new Map<ReporterId, number>()
    for (const [id, reporters] of resolveFluorescence(data, config, t, sex)) {
      const record = data.structuresById.get(id)
      if (!record) continue
      if (hiddenSystems.includes(record.system) || (hiddenStructures as string[]).includes(id)) continue
      if (isolate && selection.length && !(selection as string[]).includes(id)) continue
      for (const reporter of reporters) tally.set(reporter, (tally.get(reporter) ?? 0) + 1)
    }
    const next = [...tally].sort(([a], [b]) => a.localeCompare(b)).map(([id, count]) => ({ id, count }))
    setCounts((prev) => (sameCounts(prev, next) ? prev : next))
  }, [data, config, sex, hiddenSystems, hiddenStructures, selection, isolate, channelName])
  useTransientTime(apply)

  if (!data) return null
  return <div className="fp-legend" aria-label={`${REPORTER_PREVIEW} legend`}>
    <strong>{LEGEND_TITLE}</strong>
    <span ref={timeRef} />
    {counts.map(({ id, count }) => <span key={id}><i style={{ background: REPORTERS[id].hex }} />{reporterLabel(id)}<small>{count} {count === 1 ? 'region' : 'regions'}</small></span>)}
    {!counts.length ? <span>No active targets in this view</span> : null}
  </div>
}

/**
 * The legend over the viewer. The outer component reads one flag, so a reader who never opens the
 * preview pays one selector and no per-frame work.
 *
 * Presentation and embed mode hide every control that could turn the preview off, so neither mounts
 * the legend. A link that carried `fp` into one of those modes still draws the signal, and the chip
 * names the mode it is in, so the state is visible rather than silent. Presentation mode returns to
 * the normal view with the P key, which reaches the panel again.
 */
export function FluorescenceLegend() {
  const enabled = useAtlas((s) => s.fluorescence.enabled)
  const presentation = useAtlas((s) => s.presentation)
  const embed = useAtlas((s) => s.embed)
  if (!enabled) return null
  if (presentation || embed) return <p className="fp-chip" data-testid="fluorescence-chip">{REPORTER_PREVIEW}</p>
  return <LegendBody />
}
