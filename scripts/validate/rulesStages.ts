// Rules for stages.json and systems.json: E003, E022 to E027 (spec 3.8), plus
// the E002 check of the system root ids.

import { slToHpf } from './growth.ts'
import type { Report } from './report.ts'
import { num } from './report.ts'
import type { StagesFile, SystemRecord } from './types.ts'
import { AXIS_END_HPF, UNKNOWN_STAGE } from './types.ts'
import type { ZfinSnapshot } from './zfin.ts'

/** The 18 headline ticks of D7 by stage start hpf. */
export const HEADLINE_HPF = [0, 2.5, 4, 6, 10, 16, 24, 42, 48, 72, 120, 168, 336, 504, 720, 1080, 2160, 4320]

/** D8 canonical events. A row matches an event by label or id; `sl` rows resolve through the growth table. */
export const D8_EVENTS: { name: string; match: RegExp; hpf?: number; sl?: number }[] = [
  { name: 'heartbeat onset', match: /heart\s*-?beat/i, hpf: 24 },
  { name: 'circulation onset', match: /circulation/i, hpf: 26 },
  { name: 'heart looping onset', match: /heart.*loop|loop.*heart/i, hpf: 30 },
  { name: 'pectoral fin bud visible', match: /pectoral fin bud/i, hpf: 28 },
  { name: 'hatching', match: /hatch/i, hpf: 60 },
  { name: 'mouth open', match: /mouth\s+open/i, hpf: 72 },
  { name: 'swim bladder posterior chamber inflated', match: /swim bladder.*inflat/i, hpf: 100 },
  { name: 'first feeding', match: /first feeding/i, hpf: 120 },
  { name: 'yolk exhausted', match: /yolk exhaust/i, hpf: 168 },
  { name: 'notochord flexion complete', match: /flexion complete/i, sl: 6.5 },
  { name: 'pelvic fin bud', match: /pelvic fin bud/i, sl: 7.2 },
  { name: 'pelvic fin rays', match: /pelvic fin rays?/i, sl: 8.6 },
  { name: 'squamation onset', match: /squamation/i, sl: 9.6 },
  { name: 'juvenile', match: /^juvenile\b|ev-juvenile/i, sl: 11.0 },
  { name: 'adult', match: /^adult\b|ev-adult\b/i, hpf: 2160, sl: 18 },
]

export function checkSystems(systems: SystemRecord[], zfin: ZfinSnapshot, report: Report): void {
  if (systems.length !== 15) report.error('E027', 'systems', '', `${systems.length} rows, expected 15`)
  const slots = new Map<string, string>()
  const orders = new Map<number, string>()
  for (const s of systems) {
    const slotOwner = slots.get(s.paletteSlot)
    if (slotOwner) report.error('E027', 'systems', s.id, `paletteSlot ${s.paletteSlot} is reused (also ${slotOwner})`)
    slots.set(s.paletteSlot, s.id)
    const orderOwner = orders.get(s.order)
    if (orderOwner) report.error('E027', 'systems', s.id, `order ${s.order} is reused (also ${orderOwner})`)
    orders.set(s.order, s.id)
    for (const root of s.zfaRoots) {
      if (!zfin.items.has(root)) {
        report.error('E002', 'systems', s.id, `root ${root} not in anatomy_item.txt (ZFA release ${zfin.release ?? '?'})`)
      }
    }
  }
}

export function checkStages(stages: StagesFile, zfin: ZfinSnapshot, report: Report): void {
  const file = 'stages'
  const rows = stages.stages
  // D7 states 43 named stages; the ZFIN table carries ZFS:0000001 to ZFS:0000044 (44 rows)
  // plus the Unknown row. The rule checks the file against the table, not against a count.
  const named = [...zfin.stagesByZfs.values()].filter((s) => s.zfs !== UNKNOWN_STAGE)
  if (rows.length !== named.length) report.error('E022', file, '', `${rows.length} stage rows, the ZFIN table has ${named.length} named stages`)
  const present = new Set(rows.map((s) => s.zfs))
  for (const s of named) if (!present.has(s.zfs)) report.error('E022', file, s.zfs, `ZFIN stage "${s.name}" is missing`)

  let prevEnd: number | null = null
  for (const [i, s] of rows.entries()) {
    if (s.zfs === UNKNOWN_STAGE) report.error('E022', file, s.zfs, 'the Unknown row is not a stage')
    const ref = zfin.stagesByZfs.get(s.zfs)
    if (!ref) report.error('E003', file, s.zfs, `${s.zfs} not in stage_ontology.txt or zfa.obo`)
    else {
      if (s.startHpf !== ref.startHpf) report.error('E022', file, s.zfs, `startHpf ${num(s.startHpf)} differs from ZFIN ${num(ref.startHpf)}`)
      if (s.endHpf !== ref.endHpf) report.error('E022', file, s.zfs, `endHpf ${num(s.endHpf)} differs from ZFIN ${num(ref.endHpf)}`)
      if (s.name !== ref.name) report.error('E022', file, s.zfs, `name "${s.name}" differs from ZFIN "${ref.name}"`)
      if (s.zdb !== ref.zdb) report.error('E022', file, s.zfs, `zdb ${s.zdb} differs from ZFIN ${ref.zdb}`)
    }
    if (i === 0 && s.startHpf !== 0) report.error('E022', file, s.zfs, `first startHpf is ${num(s.startHpf)}, expected 0`)
    if (prevEnd !== null && s.startHpf !== prevEnd) {
      report.error('E022', file, s.zfs, `startHpf ${num(s.startHpf)} differs from the previous endHpf ${num(prevEnd)}`)
    }
    prevEnd = s.endHpf
  }

  for (const p of stages.periods) {
    if (p.zfs === null) continue
    if (!zfin.stagesByZfs.has(p.zfs) && !zfin.oboTermIds.has(p.zfs)) {
      report.error('E003', file, p.id, `${p.zfs} not in stage_ontology.txt or zfa.obo`)
    }
  }

  checkTimeAxis(stages, report)
  checkGrowth(stages, report)
  checkEvents(stages, report)
}

function checkTimeAxis(stages: StagesFile, report: Report): void {
  const file = 'stages'
  const axis = stages.timeAxis
  const segs = axis.segments
  let sum = 0
  let cursor = 0
  for (const seg of segs) {
    if (seg.startHpf !== cursor) report.error('E023', file, 'timeAxis', `segment ${seg.id} starts at ${num(seg.startHpf)}, expected ${num(cursor)}`)
    if (seg.endHpf <= seg.startHpf) report.error('E023', file, 'timeAxis', `segment ${seg.id} is empty or reversed`)
    cursor = seg.endHpf
    sum += seg.share
  }
  if (cursor !== AXIS_END_HPF) report.error('E023', file, 'timeAxis', `segments end at ${num(cursor)}, expected ${AXIS_END_HPF}`)
  if (Math.abs(sum - 1) > 1e-6) report.error('E023', file, 'timeAxis', `shares sum to ${num(sum)}, expected 1`)

  const ticks = axis.headlineTicks
  if (ticks.length !== 18) report.error('E024', file, 'timeAxis', `${ticks.length} headline ticks, expected 18`)
  const startsByHpf = new Map<number, string>(stages.stages.map((s) => [s.startHpf, s.zfs]))
  let prev = -1
  for (const tick of ticks) {
    if (tick.hpf <= prev) report.error('E024', file, 'timeAxis', `tick "${tick.label}" at ${num(tick.hpf)} hpf is not after the previous tick`)
    prev = tick.hpf
    if (tick.hpf < 0 || tick.hpf > AXIS_END_HPF) report.error('E024', file, 'timeAxis', `tick "${tick.label}" at ${num(tick.hpf)} hpf is outside the domain`)
    if (tick.zfs !== null && startsByHpf.get(tick.hpf) !== tick.zfs) {
      report.error('E024', file, 'timeAxis', `tick "${tick.label}" at ${num(tick.hpf)} hpf does not start stage ${tick.zfs}`)
    }
    if (tick.zfs === null && tick.hpf !== AXIS_END_HPF) {
      report.error('E024', file, 'timeAxis', `tick "${tick.label}" at ${num(tick.hpf)} hpf has no zfs`)
    }
  }
  const expected = HEADLINE_HPF.join(',')
  const actual = ticks.map((t) => t.hpf).join(',')
  if (actual !== expected) report.error('E024', file, 'timeAxis', `tick hpf list ${actual} differs from D7 ${expected}`)
}

function checkGrowth(stages: StagesFile, report: Report): void {
  const g = stages.growth
  for (let i = 1; i < g.length; i++) {
    if (g[i].hpf <= g[i - 1].hpf) report.error('E025', 'stages', 'growth', `hpf ${num(g[i].hpf)} is not after ${num(g[i - 1].hpf)}`)
    if (g[i].lengthMm < g[i - 1].lengthMm) report.error('E025', 'stages', 'growth', `length falls at ${num(g[i].hpf)} hpf`)
    const a = g[i - 1].standardLengthMm
    const b = g[i].standardLengthMm
    if (a !== null && b !== null && b < a) report.error('E025', 'stages', 'growth', `standard length falls at ${num(g[i].hpf)} hpf`)
    if (a !== null && b === null) report.error('E025', 'stages', 'growth', `standard length becomes null at ${num(g[i].hpf)} hpf`)
  }
}

function checkEvents(stages: StagesFile, report: Report): void {
  const file = 'stages'
  const canonical = stages.events.filter((e) => e.canonical === true)
  const seen = new Set<string>()
  for (const ev of canonical) {
    const row = D8_EVENTS.find((d) => d.match.test(ev.label) || d.match.test(ev.id))
    if (!row) {
      report.error('E026', file, ev.id, `canonical event "${ev.label}" matches no D8 row`)
      continue
    }
    seen.add(row.name)
    if (row.sl !== undefined) {
      if (ev.slMm === null || ev.slMm === undefined) report.error('E026', file, ev.id, `slMm is missing, D8 gives ${row.sl} mm SL`)
      else if (Math.abs(ev.slMm - row.sl) > 1e-6) report.error('E026', file, ev.id, `slMm ${num(ev.slMm)} differs from the canonical ${row.sl}`)
      const expected = row.hpf ?? slToHpf(stages.growth, row.sl)
      if (expected !== null && Math.abs(ev.hpf - expected) > 0.5) {
        report.error('E026', file, ev.id, `hpf ${num(ev.hpf)} differs from the canonical ${num(expected)} (${row.sl} mm SL through the growth table)`)
      }
    } else if (row.hpf !== undefined && Math.abs(ev.hpf - row.hpf) > 1e-6) {
      report.error('E026', file, ev.id, `hpf ${num(ev.hpf)} differs from the canonical ${row.hpf}`)
    }
  }
  for (const row of D8_EVENTS) {
    if (!seen.has(row.name)) report.error('E026', file, '', `no canonical event for the D8 row "${row.name}"`)
  }
}
