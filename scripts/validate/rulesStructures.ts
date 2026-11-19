// Identity, ZFIN and presence-window rules for structures.json:
// E002, E004 to E009, E013 to E018, E026 (canonical windows), E028, E032, W003, W010 (spec 3.8),
// W012, which catches an unbalanced source string (M-05), and W013, which counts the strings
// still marked unverified (review action 20).

import type { Report } from './report.ts'
import { num } from './report.ts'
import type { StructureRecord, SystemRecord } from './types.ts'
import { AXIS_END_HPF, ROOT_ID, UNKNOWN_STAGE } from './types.ts'
import type { ZfinSnapshot } from './zfin.ts'
import { RELATION_TYPES, hasRelation } from './zfin.ts'

/** Records that may carry a colorOverride (spec 3.6, D10). */
export const COLOR_EXCEPTIONS = new Set([
  'ZFA:0000014', 'ZFA:0000011', 'ZFA:0005004', 'ZFA:0000604', 'ZFA:0005002', 'ZFA:0001053',
  'ZFA:0000477', 'ZFA:0000423', 'ZFA:0000186', 'ZFA:0000180', 'ZFA:0001286', 'ZFA:0001052', 'ZFA:0005934',
  'ZFA:0001617',
  'ZFA:0000144', 'ZFA:0009091', 'ZFA:0005221', 'ZFA:0005222', 'ZFA:0005223', 'ZFA:0005224', 'ZFA:0001463',
  'ZFA:0009198',
  'ZFA:0009199',
  'ZFA:0001580', 'ZFA:0001205', 'ZFA:0001399', 'ZFA:0001400', 'ZFA:0001422', 'ZFA:0000095', 'ZFA:0000364',
  'ZFA:0000694', 'ZFA:0000191', 'ZFA:0000270', 'ZFA:0000250', 'ZFA:0000184', 'ZFA:0001189', 'ZFA:0000538',
  'ZFA:0001188', 'ZFA:0001554',
  'ZFA:0000084', 'ZFA:0000006', 'ZFA:0000106', 'ZFA:0000088',
  'ZFA:0000035',
  'ZFA:0000329',
])

/** A D8 or DM-21 presence value that a record must keep; only the fields given are checked. */
export interface CanonicalWindow {
  id: string
  name: string
  visibleFromHpf?: number
  modelEndHpf?: number
  fadeInHpf?: number
  fadeOutHpf?: number
  source: string
}

/** The presence windows the decision record fixes (D8, as revised) and DM-21, DM-22. */
export const CANONICAL_WINDOWS: CanonicalWindow[] = [
  { id: 'ZFA:0000329', name: 'chorion', visibleFromHpf: 0, modelEndHpf: 30, fadeOutHpf: 6, source: 'D8: real size to 24 hpf, fade out 24 to 30 hpf' },
  { id: 'ZFA:0000084', name: 'yolk', modelEndHpf: 168, source: 'D8: yolk exhausted at 168 hpf' },
  { id: 'ZFA:0000001', name: "Kupffer's vesicle", modelEndHpf: 19, fadeOutHpf: 2, source: 'DM-21: regresses between the 14- and 20-somite stages' },
  { id: 'ZFA:0000077', name: 'tail bud', modelEndHpf: 24, source: 'DM-21: spent when the last somites form' },
  { id: 'ZFA:0001278', name: 'posterior chamber swim bladder', visibleFromHpf: 96, fadeInHpf: 24, source: 'D8: inflated at 100 hpf, fade in 96 to 120 hpf' },
]

/** E026 for records: the D8 and DM-21 windows above hold for every record that exists. */
export function checkCanonicalWindows(records: Map<string, StructureRecord>, report: Report, table: CanonicalWindow[] = CANONICAL_WINDOWS): void {
  const fields = ['visibleFromHpf', 'modelEndHpf', 'fadeInHpf', 'fadeOutHpf'] as const
  for (const row of table) {
    const r = records.get(row.id)
    if (!r) continue
    for (const field of fields) {
      const want = row[field]
      if (want === undefined) continue
      if (Math.abs(r[field] - want) > 1e-9) {
        report.error('E026', 'structures', r.id, `${field} ${num(r[field])} differs from the canonical ${num(want)} for the ${row.name} (${row.source})`)
      }
    }
  }
}

/** E013: one record per id. Returns the map that the other rules read. */
export function indexRecords(structures: StructureRecord[], report: Report): Map<string, StructureRecord> {
  const counts = new Map<string, number>()
  for (const r of structures) counts.set(r.id, (counts.get(r.id) ?? 0) + 1)
  for (const [id, n] of counts) if (n > 1) report.error('E013', 'structures', id, `appears ${n} times`)
  return new Map(structures.map((r) => [r.id, r]))
}

export function checkIdentity(
  records: Map<string, StructureRecord>,
  systems: SystemRecord[],
  zfin: ZfinSnapshot,
  report: Report,
): void {
  const file = 'structures'
  const systemIds = new Set(systems.map((s) => s.id))
  const notInZfin = (id: string) => `${id} not in anatomy_item.txt (ZFA release ${zfin.release ?? '?'})`
  let roots = 0

  for (const r of records.values()) {
    const item = zfin.items.get(r.id)
    if (!item) report.error('E002', file, r.id, notInZfin(r.id))
    if (r.zfaParent && !zfin.items.has(r.zfaParent)) report.error('E002', file, r.id, notInZfin(r.zfaParent))
    if (r.uiParent && !zfin.items.has(r.uiParent)) report.error('E002', file, r.id, notInZfin(r.uiParent))
    for (const a of r.aliasChain ?? []) if (!zfin.items.has(a.zfaId)) report.error('E002', file, r.id, notInZfin(a.zfaId))

    if (item) {
      checkName(r, item.name, zfin, report)
      checkZfinWindow(r, item.startZdb, item.endZdb, zfin, report)
    }
    checkPresence(r, report)

    if (r.uiParent === null) roots++
    else if (!records.has(r.uiParent)) report.error('E014', file, r.id, `uiParent ${r.uiParent} is not a record`)

    if (r.parentRelation in RELATION_TYPES) {
      const type = RELATION_TYPES[r.parentRelation]
      if (!r.zfaParent) report.error('E016', file, r.id, `parentRelation ${r.parentRelation} without a zfaParent`)
      else if (!hasRelation(zfin, r.zfaParent, r.id, type)) {
        report.error('E016', file, r.id, `no ${r.parentRelation} row to ${r.zfaParent} in anatomy_relationship.txt`)
      }
    }

    checkAliases(r, records, report)

    if (!systemIds.has(r.system)) report.error('E018', file, r.id, `system ${r.system} is not in systems.json`)
    for (const s of r.alsoIn ?? []) {
      if (s === r.system) report.error('E018', file, r.id, `alsoIn repeats the system ${s}`)
      else if (!systemIds.has(s)) report.error('E018', file, r.id, `alsoIn system ${s} is not in systems.json`)
    }

    if (r.colorOverride && !COLOR_EXCEPTIONS.has(r.id)) report.error('E028', file, r.id, 'colorOverride is not in the exception list')

    checkSourceStrings(r, report)
    checkUnverified(r, report)

    if (r.uiParent && r.uiParent !== ROOT_ID && r.parentRelation !== 'grouping') {
      const parent = records.get(r.uiParent)
      if (parent && parent.system !== r.system) report.warn('W003', file, r.id, `uiParent ${r.uiParent} is in system ${parent.system}`)
    }
  }

  if (roots !== 1) report.error('E014', file, '', `${roots} root records, expected 1`)
  const root = records.get(ROOT_ID)
  if (root && root.uiParent !== null) report.error('E014', file, ROOT_ID, 'the root has a uiParent')
  checkCycles(records, report)
}

/**
 * W013: a string in the record still carries the marker `unverified`, which says the value came
 * from a search summary and not from the paper itself (review action 20). The count belongs in
 * the README Limitations section; this rule keeps it current.
 */
function checkUnverified(r: StructureRecord, report: Report): void {
  const seen: string[] = []
  const walk = (value: unknown, where: string): void => {
    if (typeof value === 'string') {
      if (value.includes('unverified')) seen.push(where)
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => { walk(item, `${where}[${i}]`) })
      return
    }
    if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) walk(item, where ? `${where}.${key}` : key)
    }
  }
  walk(r, '')
  for (const where of seen) report.warn('W013', 'structures', r.id, `${where} is still marked unverified`)
}

/** W012: a source string closes more parentheses than it opens, which marks a doubled clause (M-05). */
function checkSourceStrings(r: StructureRecord, report: Report): void {
  const strings: { where: string; text: string }[] = []
  for (const [i, s] of (r.sources ?? []).entries()) strings.push({ where: `sources[${i}]`, text: s })
  for (const row of r.sizes ?? []) {
    strings.push({ where: `size row at ${num(row.hpf)} hpf`, text: row.source })
    if (row.note) strings.push({ where: `note on the size row at ${num(row.hpf)} hpf`, text: row.note })
  }
  for (const { where, text } of strings) {
    const open = (text.match(/\(/g) ?? []).length
    const close = (text.match(/\)/g) ?? []).length
    if (close > open) {
      report.warn('W012', 'structures', r.id, `${where} closes ${close} parentheses and opens ${open}`)
    }
  }
}

/** E004: the name is the ZFIN label. W010: the name is only a ZFIN synonym. */
function checkName(r: StructureRecord, label: string, zfin: ZfinSnapshot, report: Report): void {
  if (r.name === label) return
  const synonyms = zfin.synonyms.get(r.id)
  if (synonyms?.has(r.name.trim().toLowerCase())) {
    report.warn('W010', 'structures', r.id, `name "${r.name}" is a ZFIN synonym of the label "${label}"`)
    return
  }
  report.error('E004', 'structures', r.id, `name "${r.name}" differs from ZFIN label "${label}"`)
}

/** E005, E006, E008: stage ids and their hpf bounds match ZFIN. */
function checkZfinWindow(r: StructureRecord, startZdb: string, endZdb: string, zfin: ZfinSnapshot, report: Report): void {
  const file = 'structures'
  const start = zfin.stagesByZdb.get(startZdb)
  const end = zfin.stagesByZdb.get(endZdb)
  if (start && r.zfinStartStage !== start.zfs) report.error('E005', file, r.id, `zfinStartStage ${r.zfinStartStage} differs from ZFIN ${start.zfs}`)
  if (end && r.zfinEndStage !== end.zfs) report.error('E005', file, r.id, `zfinEndStage ${r.zfinEndStage} differs from ZFIN ${end.zfs}`)

  const startRow = zfin.stagesByZfs.get(r.zfinStartStage)
  const endRow = zfin.stagesByZfs.get(r.zfinEndStage)
  if (startRow && r.startHpf !== startRow.startHpf) report.error('E006', file, r.id, `startHpf ${num(r.startHpf)} differs from the ZFS bound ${num(startRow.startHpf)}`)
  if (endRow && r.endHpf !== endRow.endHpf) report.error('E006', file, r.id, `endHpf ${num(r.endHpf)} differs from the ZFS bound ${num(endRow.endHpf)}`)

  if (r.zfinStartStage === UNKNOWN_STAGE && r.id !== ROOT_ID && r.visibleFromHpf <= 0) {
    report.error('E008', file, r.id, 'start stage Unknown and visibleFromHpf is 0')
  }
  if (r.zfinEndStage === UNKNOWN_STAGE && (r.modelEndHpf >= AXIS_END_HPF || !r.overrideNote)) {
    report.error('E008', file, r.id, 'end stage Unknown and modelEndHpf is 4320')
  }
}

/** E007, E009, E032: the presence window against the ZFIN window and the fades. */
function checkPresence(r: StructureRecord, report: Report): void {
  const file = 'structures'
  const note = (r.overrideNote ?? '').trim().length > 0
  const defaultEnd = Math.min(r.endHpf, AXIS_END_HPF)
  if (r.visibleFromHpf !== r.startHpf && !note) {
    report.error('E007', file, r.id, `visibleFromHpf ${num(r.visibleFromHpf)} differs from startHpf ${num(r.startHpf)} without overrideNote`)
  }
  if (r.modelEndHpf !== defaultEnd && !note) {
    report.error('E007', file, r.id, `modelEndHpf ${num(r.modelEndHpf)} differs from min(endHpf, 4320) ${num(defaultEnd)} without overrideNote`)
  }
  const span = r.modelEndHpf - r.visibleFromHpf
  if (span <= 0 || r.fadeInHpf + r.fadeOutHpf > span) {
    report.error('E009', file, r.id, `presence window [${num(r.visibleFromHpf)}, ${num(r.modelEndHpf)}] is empty or shorter than its fades`)
  }
  if (r.modelEndHpf === AXIS_END_HPF && r.endHpf > AXIS_END_HPF && r.fadeOutHpf !== 0) {
    report.error('E032', file, r.id, `fade of ${num(r.fadeOutHpf)} h at the clamped axis end`)
  }
  if (r.visibleFromHpf === 0 && r.fadeInHpf !== 0) report.error('E032', file, r.id, `fade of ${num(r.fadeInHpf)} h at the axis start`)
}

/** E017: alias ids are not records and alias windows are contiguous. */
function checkAliases(r: StructureRecord, records: Map<string, StructureRecord>, report: Report): void {
  const chain = r.aliasChain ?? []
  for (const [i, a] of chain.entries()) {
    if (records.has(a.zfaId)) report.error('E017', 'structures', r.id, `alias ${a.zfaId} is also a record`)
    if (a.toHpf <= a.fromHpf) report.error('E017', 'structures', r.id, `alias ${a.zfaId} window [${num(a.fromHpf)}, ${num(a.toHpf)}] is empty`)
    if (i > 0 && chain[i - 1].toHpf !== a.fromHpf) {
      report.error('E017', 'structures', r.id, `alias ${a.zfaId} starts at ${num(a.fromHpf)}, the previous alias ends at ${num(chain[i - 1].toHpf)}`)
    }
  }
}

/** E015: no cycle in the uiParent chain. */
function checkCycles(records: Map<string, StructureRecord>, report: Report): void {
  const state = new Map<string, 'open' | 'done'>()
  for (const start of records.keys()) {
    if (state.has(start)) continue
    const path: string[] = []
    let cur: string | null = start
    while (cur && records.has(cur) && !state.has(cur)) {
      state.set(cur, 'open')
      path.push(cur)
      cur = records.get(cur)?.uiParent ?? null
    }
    if (cur && state.get(cur) === 'open') {
      const loop = path.slice(path.indexOf(cur))
      report.error('E015', 'structures', cur, `uiParent cycle ${[...loop, cur].join(' -> ')}`)
    }
    for (const id of path) state.set(id, 'done')
  }
}
