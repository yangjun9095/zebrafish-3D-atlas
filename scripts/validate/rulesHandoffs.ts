// Rules for handoffs.json: E002, E021, E033, E034 (spec 3.8) and W011.
//
// E021 for a from, to or driver id that is not a record is the default since phase 2;
// `--lenient-handoffs` keeps the phase 1 warning W011 for a data directory under construction.

import { windowHpf } from './growth.ts'
import type { Report } from './report.ts'
import { num } from './report.ts'
import type { AtlasFiles, HandoffRecord, StructureRecord } from './types.ts'
import { AXIS_END_HPF, UNKNOWN_STAGE } from './types.ts'
import type { ZfinSnapshot } from './zfin.ts'

export type ResolvedHandoff = HandoffRecord & { startHpf: number; endHpf: number }

/** Resolves every window to hpf (DM-06). Rows without a resolvable window are reported and dropped. */
export function resolveHandoffs(data: AtlasFiles, report: Report): ResolvedHandoff[] {
  const out: ResolvedHandoff[] = []
  const ids = new Set<string>()
  for (const h of data.handoffs) {
    if (ids.has(h.id)) report.error('E021', 'handoffs', h.id, 'handoff id appears twice')
    ids.add(h.id)
    const w = windowHpf(data.stages.growth, h.window)
    if (!w) {
      report.error('E021', 'handoffs', h.id, 'window in SL does not resolve through the growth table')
      continue
    }
    if (w.endHpf < w.startHpf) report.error('E021', 'handoffs', h.id, `window ends (${num(w.endHpf)}) before it starts (${num(w.startHpf)})`)
    out.push({ ...h, startHpf: w.startHpf, endHpf: w.endHpf })
  }
  return out
}

export function checkHandoffs(
  handoffs: ResolvedHandoff[],
  records: Map<string, StructureRecord>,
  zfin: ZfinSnapshot,
  report: Report,
  opts: { strictHandoffs?: boolean } = {},
): void {
  const file = 'handoffs'
  for (const h of handoffs) {
    const all = [...h.from, ...h.to, h.driver]
    for (const id of all) {
      if (!zfin.items.has(id)) report.error('E002', file, h.id, `${id} not in anatomy_item.txt (ZFA release ${zfin.release ?? '?'})`)
      if (!records.has(id)) {
        if (opts.strictHandoffs) report.error('E021', file, h.id, `${id} is not a record`)
        else report.warn('W011', file, h.id, `${id} is not a record yet; the handoff row waits for phase 2`)
      }
    }
    if (!h.from.includes(h.driver) && !h.withinRecord) {
      report.error('E021', file, h.id, `driver ${h.driver} is not a from id and withinRecord is false`)
    }
    checkDriverGeometry(h, records, report)
    if (!h.withinRecord) checkWrittenWindows(h, records, report)
  }
}

/** The last stored keyframe time of a record with geometry. */
function lastKeyframeHpf(r: StructureRecord): number {
  const kfs = r.geometry?.keyframes ?? []
  return kfs.length > 0 ? kfs[kfs.length - 1].hpf : -Infinity
}

/**
 * E033: the source has geometry whose keyframes cover the window in which the target reads
 * it: from the target's start to `untilHpf`. The source's own mesh may have ended
 * (geometryEndHpf); parameters after the last keyframe hold, so coverage ends there.
 */
function checkSourceCoverage(sourceId: string, source: StructureRecord | undefined, targetId: string, fromHpf: number, untilHpf: number, report: Report): void {
  if (!source) return
  if (!source.geometry) {
    report.error('E033', 'structures', targetId, `source ${sourceId} has no geometry parameters at ${num(fromHpf)} hpf`)
    return
  }
  if (source.visibleFromHpf > fromHpf + 1e-9) {
    report.error('E033', 'structures', targetId, `source ${sourceId} has no geometry parameters at ${num(fromHpf)} hpf (it starts at ${num(source.visibleFromHpf)})`)
  }
  const last = lastKeyframeHpf(source)
  if (last < Math.min(untilHpf, AXIS_END_HPF) - 0.01) {
    report.error('E033', 'structures', targetId, `source ${sourceId} has no geometry parameters at ${num(untilHpf)} hpf (its last keyframe is at ${num(last)})`)
  }
}

/** E033 for a handoff: the driver covers each target from the target's start to the window end. */
function checkDriverGeometry(h: ResolvedHandoff, records: Map<string, StructureRecord>, report: Report): void {
  const driver = records.get(h.driver)
  if (!driver) return
  const windowEnd = h.perSegment ? h.endHpf + h.perSegment.delayHpf + h.perSegment.lengthHpf : h.endHpf
  for (const toId of h.to) {
    const target = records.get(toId)
    if (!target || toId === h.driver) continue
    checkSourceCoverage(h.driver, driver, toId, target.visibleFromHpf, Math.min(windowEnd, target.modelEndHpf), report)
  }
}

/**
 * E034: the merge wrote the window into the from and to records (DM-33). A from record that
 * continues as the parent of derived parts (the heart, DM-24; the eye, DM-34) ends its own mesh
 * at the window end through geometry.geometryEndHpf while modelEndHpf runs on.
 */
function checkWrittenWindows(h: ResolvedHandoff, records: Map<string, StructureRecord>, report: Report): void {
  const file = 'handoffs'
  const near = (a: number, b: number) => Math.abs(a - b) < 0.01
  const fromEnds = [h.endHpf]
  if (h.perSegment) fromEnds.push(h.endHpf + h.perSegment.delayHpf + h.perSegment.lengthHpf)

  for (const id of h.from) {
    const r = records.get(id)
    if (!r) continue
    const geometryEnd = r.geometry && 'geometryEndHpf' in r.geometry ? r.geometry.geometryEndHpf : undefined
    const ends = typeof geometryEnd === 'number' ? [r.modelEndHpf, geometryEnd] : [r.modelEndHpf]
    if (!fromEnds.some((e) => ends.some((end) => near(end, e)))) {
      report.error('E034', file, h.id, `${id} modelEndHpf ${num(r.modelEndHpf)} differs from the window end ${num(h.endHpf)}`)
    }
    if (!r.overrideNote?.includes(h.id)) report.error('E034', file, h.id, `${id} overrideNote does not name the handoff`)
  }
  for (const id of h.to) {
    const r = records.get(id)
    if (!r) continue
    // A target keeps its own ZFA start when that precedes the window (DM-33). A ZFA start stage of
    // Unknown (startHpf 0) carries no information, so the window start applies (E008 forbids 0).
    const knownStart = r.zfinStartStage !== UNKNOWN_STAGE
    const expected = knownStart && r.startHpf < h.startHpf ? r.startHpf : h.startHpf
    if (!near(r.visibleFromHpf, expected)) {
      report.error('E034', file, h.id, `${id} visibleFromHpf ${num(r.visibleFromHpf)} differs from the window start ${num(expected)}`)
    }
    if (!r.overrideNote?.includes(h.id)) report.error('E034', file, h.id, `${id} overrideNote does not name the handoff`)
    const first = r.geometry?.keyframes[0]
    if (first && (first.hpf < r.visibleFromHpf - 0.01 || first.hpf > h.endHpf + 0.01)) {
      report.error('E034', file, h.id, `${id} first keyframe at ${num(first.hpf)} hpf lies outside [${num(r.visibleFromHpf)}, ${num(h.endHpf)}]`)
    }
  }
}

/** E033 for `derived` geometry: the source record exists and its keyframes cover the whole derived window. */
export function checkDerivedSources(records: Map<string, StructureRecord>, report: Report): void {
  for (const r of records.values()) {
    const g = r.geometry
    if (!g || g.kind !== 'derived' || typeof g.sourceId !== 'string') continue
    const src = records.get(g.sourceId)
    if (!src) report.error('E033', 'structures', r.id, `source ${g.sourceId} is not a record`)
    else checkSourceCoverage(g.sourceId, src, r.id, r.visibleFromHpf, r.modelEndHpf, report)
  }
}

/** Ids that a handoff seeds; their first stored keyframe may lie after visibleFromHpf (W001, BG-50). */
export function seededIds(handoffs: ResolvedHandoff[]): Set<string> {
  const out = new Set<string>()
  for (const h of handoffs) if (!h.withinRecord) for (const id of h.to) out.add(id)
  return out
}
