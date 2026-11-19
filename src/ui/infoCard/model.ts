// Pure helpers of the info card (spec 5.4): alias term at t, ZFIN and model windows, the
// presence badge, the jump target (UI-20, UI-22), event and relation lookups, handoff lines,
// source linkification and the stage fallback list. No React and no DOM; the unit test
// covers every export against the real records.
import { capitalizeLabel, formatTime } from '../../core/format.ts'
import type { Units } from '../../core/format.ts'
import { handoffsFor, resolveWindow } from '../../core/handoffs.ts'
import { firstFullyVisibleHpf, lastFullyVisibleHpf, presenceAt } from '../../core/presence.ts'
import type { Presence, Sex } from '../../core/presence.ts'
import type { GrowthPoint, HandoffRecord, SizeRow, StageRecord, StructureEvent, StructureRecord } from '../../core/schema.ts'
import { AXIS_END_HPF, stageAt } from '../../core/timeAxis.ts'

export const ZFIN_BASE_URL = 'https://zfin.org/'
const UNKNOWN_STAGE = 'ZFS:0000000'

export function zfinUrl(zfaId: string): string {
  return `${ZFIN_BASE_URL}${zfaId}`
}

/** "19.15" -> "19.15", "4320" -> "4320": a number without trailing zeros. */
export function trimHpf(hpf: number): string {
  return String(Number(hpf.toFixed(2)))
}

// Alias chain (UI-24, UI-25) ----------------------------------------------------------

export interface TermRow {
  zfaId: string
  name: string
  fromHpf: number
  /** null for the record's own term, which runs to the end of the model window */
  toHpf: number | null
  own: boolean
}

/** The chain entries in time order plus the record's own term as the last row. */
export function termRows(record: Pick<StructureRecord, 'id' | 'name' | 'startHpf' | 'aliasChain'>): TermRow[] {
  const chain = [...record.aliasChain].sort((a, b) => a.fromHpf - b.fromHpf)
  const rows: TermRow[] = chain.map((a) => ({ zfaId: a.zfaId, name: a.name, fromHpf: a.fromHpf, toHpf: a.toHpf, own: false }))
  const last = chain[chain.length - 1]
  rows.push({ zfaId: record.id, name: record.name, fromHpf: last ? last.toHpf : record.startHpf, toHpf: null, own: true })
  return rows
}

/** The ZFIN term that names the record at t: the alias whose window contains t, else the record itself. */
export function activeTerm(record: Pick<StructureRecord, 'id' | 'name' | 'startHpf' | 'aliasChain'>, t: number): TermRow {
  const rows = termRows(record)
  for (const r of rows) if (!r.own && r.fromHpf <= t && t < (r.toHpf as number)) return r
  return rows[rows.length - 1]
}

/** "ZFIN term now: heart tube (ZFA:0000360), 24 to 42 hpf" or ", from 42 hpf" for the own term. */
export function termText(term: TermRow): string {
  const window = term.toHpf === null ? `from ${trimHpf(term.fromHpf)} hpf` : `${trimHpf(term.fromHpf)} to ${trimHpf(term.toHpf)} hpf`
  return `${term.name} (${term.zfaId}), ${window}`
}

// Stage windows ------------------------------------------------------------------------

export function stageByZfs(stages: readonly StageRecord[], zfs: string): StageRecord | undefined {
  return stages.find((s) => s.zfs === zfs)
}

export function stageLabel(stage: StageRecord): string {
  return capitalizeLabel(stage.shortLabel)
}

/** The label of the stage that starts at or before hpf; the plain hour when no stages are loaded. */
export function stageLabelAt(stages: readonly StageRecord[], hpf: number): string {
  return stages.length > 0 ? stageLabel(stageAt(stages, hpf)) : `${trimHpf(hpf)} hpf`
}

/** "19.2 hpf": the UI-20 target as readout text. */
export function firstFullyVisibleText(record: StructureRecord, units: Units): string {
  return formatTime(firstFullyVisibleHpf(record), units)
}

/** "ZFIN: High-pec (42 hpf) to Adult"; an Unknown start or end stage is named as such. */
export function zfinWindowText(record: StructureRecord, stages: readonly StageRecord[]): string {
  const start = stageByZfs(stages, record.zfinStartStage)
  const end = stageByZfs(stages, record.zfinEndStage)
  const startText = start ? `${stageLabel(start)} (${formatTime(start.startHpf, 'hpf')})` : 'unknown start'
  const endText = end ? stageLabel(end) : record.zfinEndStage === UNKNOWN_STAGE ? 'an unknown end' : record.zfinEndStage
  return `ZFIN: ${startText} to ${endText}`
}

/** "Model: 19 to 4320 hpf" when the model window differs from the ZFIN window (clamped to the axis), else null. */
export function modelWindowText(record: Pick<StructureRecord, 'startHpf' | 'endHpf' | 'visibleFromHpf' | 'modelEndHpf'>): string | null {
  const zfinEnd = Math.min(record.endHpf, AXIS_END_HPF)
  if (record.visibleFromHpf === record.startHpf && record.modelEndHpf === zfinEnd) return null
  return `Model: ${trimHpf(record.visibleFromHpf)} to ${trimHpf(record.modelEndHpf)} hpf`
}

// Presence badge (UX-IN-23, UI-22, UI-24) ---------------------------------------------

export type CardPresenceKind = 'present' | 'before' | 'after' | 'aliasBefore' | 'sex'

export interface CardPresence {
  kind: CardPresenceKind
  text: string
  presence: Presence
}

export interface PresenceContext {
  t: number
  units: Units
  sex: Sex
}

export function cardPresence(record: StructureRecord, stages: readonly StageRecord[], ctx: PresenceContext): CardPresence {
  const presence = presenceAt(record, ctx.t, { sex: ctx.sex })
  if (presence.phase === 'hiddenBySex') {
    return { kind: 'sex', text: `Drawn for the ${record.sexSpecific} fish only; switch the sex toggle`, presence }
  }
  if (presence.present) return { kind: 'present', text: 'Present', presence }
  if (presence.phase === 'after' || presence.phase === 'fadeOut') {
    const end = stageAt(stages, record.modelEndHpf)
    return { kind: 'after', text: `Modelled until ${trimHpf(record.modelEndHpf)} hpf (${stageLabel(end)})`, presence }
  }
  const term = activeTerm(record, ctx.t)
  if (!term.own && (term.toHpf as number) <= record.visibleFromHpf) {
    const from = formatTime(firstFullyVisibleHpf(record), ctx.units)
    return {
      kind: 'aliasBefore',
      text: `ZFIN describes the ${term.name} at ${formatTime(ctx.t, ctx.units)}; the model draws the ${record.name} from ${from}`,
      presence,
    }
  }
  return { kind: 'before', text: `Not present at ${formatTime(ctx.t, ctx.units)}`, presence }
}

// Jump target (UI-20, UI-22, DM-09) ------------------------------------------------------

export interface JumpTarget {
  hpf: number
  /** "Jump to High-pec (42.3 hpf)" */
  label: string
}

/**
 * The first fully visible time (UI-20), or the start of the last stage in which the structure
 * is present once it has ended (UI-22). With snap on, the stage start that contains the time
 * when that start is at or after it. A group node has no target in 3D (DM-09).
 */
export function jumpTarget(record: StructureRecord, stages: readonly StageRecord[], t: number, snap: boolean, units: Units): JumpTarget | null {
  if (record.geometry === null || stages.length === 0) return null
  const first = firstFullyVisibleHpf(record)
  let hpf = first
  if (t > record.modelEndHpf - record.fadeOutHpf && t >= first) {
    hpf = Math.max(stageAt(stages, lastFullyVisibleHpf(record)).startHpf, first)
  } else if (snap) {
    const start = stageAt(stages, first).startHpf
    if (start >= first) hpf = start
  }
  return { hpf, label: `Jump to ${stageLabel(stageAt(stages, hpf))} (${formatTime(hpf, units)})` }
}

// Events -------------------------------------------------------------------------------

export function sortedEvents(record: Pick<StructureRecord, 'events'>): StructureEvent[] {
  return [...record.events].sort((a, b) => a.hpf - b.hpf)
}

/** Index of the first event after t in a sorted list, or -1. */
export function nextEventIndex(events: readonly StructureEvent[], t: number): number {
  return events.findIndex((e) => e.hpf > t)
}

/**
 * A short key that changes only when the card's time-dependent text changes: presence kind,
 * active alias, next event and stage. The card subscribes to it instead of `time` (AR-17).
 */
export function timeKey(record: StructureRecord, stages: readonly StageRecord[], ctx: PresenceContext): string {
  const p = cardPresence(record, stages, ctx)
  const term = activeTerm(record, ctx.t)
  const stage = stages.length > 0 ? stageAt(stages, ctx.t).zfs : ''
  return `${p.kind}|${term.zfaId}|${nextEventIndex(sortedEvents(record), ctx.t)}|${stage}|${ctx.sex}`
}

// Relations ------------------------------------------------------------------------------

export function childrenOf(structures: readonly StructureRecord[], id: string): StructureRecord[] {
  return structures.filter((r) => r.uiParent === id)
}

/** Every descendant that draws something, depth first; the targets of Isolate and Hide on a group node (UI-23). */
export function descendantsWithGeometry(structures: readonly StructureRecord[], id: string): StructureRecord[] {
  const out: StructureRecord[] = []
  const seen = new Set<string>([id])
  const walk = (parent: string) => {
    for (const child of childrenOf(structures, parent)) {
      if (seen.has(child.id)) continue
      seen.add(child.id)
      if (child.geometry !== null) out.push(child)
      walk(child.id)
    }
  }
  walk(id)
  return out
}

// Handoffs (D9) --------------------------------------------------------------------------

export interface HandoffLine {
  id: string
  /** 'from': the record develops from the named structures; 'to': it becomes them */
  direction: 'from' | 'to'
  names: string[]
  window: string
}

function nameOf(byId: ReadonlyMap<string, StructureRecord>, id: string): string {
  return byId.get(id)?.name ?? id
}

function windowText(h: HandoffRecord, growth: readonly GrowthPoint[], units: Units): string {
  try {
    const w = resolveWindow(h, growth)
    return `${formatTime(w.startHpf, units)} to ${formatTime(w.endHpf, units)}`
  } catch {
    return 'window outside the growth table'
  }
}

/** The develops-from and becomes rows of a record; alias boundaries inside one record are skipped. */
export function handoffLines(
  handoffs: readonly HandoffRecord[],
  growth: readonly GrowthPoint[],
  byId: ReadonlyMap<string, StructureRecord>,
  id: string,
  units: Units,
): HandoffLine[] {
  const { asFrom, asTo } = handoffsFor(handoffs, id)
  const out: HandoffLine[] = []
  for (const h of asTo) {
    if (h.withinRecord) continue
    out.push({ id: h.id, direction: 'from', names: h.from.map((x) => nameOf(byId, x)), window: windowText(h, growth, units) })
  }
  for (const h of asFrom) {
    if (h.withinRecord) continue
    out.push({ id: h.id, direction: 'to', names: h.to.map((x) => nameOf(byId, x)), window: windowText(h, growth, units) })
  }
  return out
}

// Sources and measurements ----------------------------------------------------------------

export interface TextSegment {
  text: string
  href?: string
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/g

/** Splits a citation into text and link segments; trailing punctuation stays outside the link. */
export function linkify(text: string): TextSegment[] {
  const out: TextSegment[] = []
  let last = 0
  for (const m of text.matchAll(URL_RE)) {
    let url = m[0]
    let trail = ''
    while (/[.,;:]$/.test(url)) {
      trail = url.slice(-1) + trail
      url = url.slice(0, -1)
    }
    const start = m.index
    if (start > last) out.push({ text: text.slice(last, start) })
    out.push({ text: url, href: url })
    if (trail) out.push({ text: trail })
    last = start + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}

/**
 * A measured value with the digits it needs. `trimHpf` rounds to two decimals, which printed the
 * eye's 0.00084 volume as "0" and every thickness under 0.005 mm as "0" (review M11). A value
 * below 1 keeps two significant digits instead.
 */
export function formatDim(value: number): string {
  if (value === 0) return '0'
  return String(Number(Math.abs(value) >= 1 ? value.toFixed(2) : value.toPrecision(2)))
}

/** The name and the unit of a `dimsMm` key: "volumeMm3" is a volume in mm3, not a length in mm. */
export function dimUnit(key: string): { name: string; unit: string } {
  if (key.endsWith('Mm3')) return { name: key.slice(0, -3), unit: 'mm\u00b3' }
  if (key.endsWith('Mm2')) return { name: key.slice(0, -3), unit: 'mm\u00b2' }
  if (key.endsWith('Mm')) return { name: key.slice(0, -2), unit: 'mm' }
  return { name: key, unit: 'mm' }
}

/** "Prim-5 (24 hpf): length 0.2 mm, diameter 0.05 mm, estimate" */
export function sizeRowText(row: SizeRow): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(row.dimsMm)) {
    const { name, unit } = dimUnit(k)
    parts.push(`${name} ${formatDim(v)} ${unit}`)
  }
  for (const [k, v] of Object.entries(row.counts)) parts.push(`${k} ${trimHpf(v)}`)
  for (const [k, v] of Object.entries(row.anglesDeg)) parts.push(`${k.replace(/Deg$/, '')} ${formatDim(v)} deg`)
  if (row.estimate) parts.push('estimate')
  return `${row.stageLabel} (${formatTime(row.hpf, 'hpf')}): ${parts.join(', ')}`
}

// Corrections (review C-18) ------------------------------------------------------------------

/** The anatomy correction form of the repository. */
export const CORRECTION_FORM_URL = 'https://github.com/yangjun9095/zebrafish-3D-atlas/issues/new?template=anatomy-correction.yml'

/**
 * The correction form with the record and the hour already in the issue title, so a reader who
 * spots a structure in the wrong place reports it without copying an id by hand. The form asks
 * for the ZFA id, the stage in hpf, what is wrong and a citation.
 */
export function correctionHref(record: Pick<StructureRecord, 'id' | 'name'>, hpf: number): string {
  const title = `[anatomy] ${record.name} (${record.id}) at ${trimHpf(hpf)} hpf`
  return `${CORRECTION_FORM_URL}&title=${encodeURIComponent(title)}`
}

// Stage fallback (UX-LY-08) ----------------------------------------------------------------

/** Records with geometry whose model window starts inside the stage, by start time then name. */
export function firstAppearing(structures: readonly StructureRecord[], stage: StageRecord): StructureRecord[] {
  return structures
    .filter((r) => r.geometry !== null && r.visibleFromHpf >= stage.startHpf && r.visibleFromHpf < stage.endHpf)
    .sort((a, b) => a.visibleFromHpf - b.visibleFromHpf || a.name.localeCompare(b.name))
}

/** "24 to 30 hpf (1 dpf)" */
export function stageRangeText(stage: StageRecord): string {
  const end = stage.endHpf > AXIS_END_HPF ? `${trimHpf(AXIS_END_HPF)} hpf on the axis` : `${trimHpf(stage.endHpf)} hpf`
  return `${trimHpf(stage.startHpf)} to ${end}${stage.dpfLabel ? ` (${stage.dpfLabel})` : ''}`
}

// Announcements (UX-AC-04) ---------------------------------------------------------------------

/** "Heart selected, cardiovascular system, present from High-pec" */
export function announceText(record: StructureRecord, systemName: string, stages: readonly StageRecord[], present: boolean): string {
  const start = stages.length > 0 ? stageLabel(stageAt(stages, record.visibleFromHpf)) : `${trimHpf(record.visibleFromHpf)} hpf`
  const state = present ? `present from ${start}` : `not present now, appears at ${start}`
  return `${capitalizeLabel(record.name)} selected, ${systemName} system, ${state}`
}
