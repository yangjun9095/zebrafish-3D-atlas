// Phase 1 fallback for handoffs whose targets are not records yet (D9; phase 1 review F1, R2).
// A `from` record retires its mesh (`geometryEndHpf`) or ends its window (`modelEndHpf`) at
// the handoff window because the `to` records take over. While no `to` record with a builder
// exists, the source keeps its mesh and its window runs to its ZFA end, clamped to the axis.
// The validator reads the authored file, so the authored windows still pass E034.
import { hasBuilder } from './primitives/buildStructure.ts'
import type { HandoffRecord, StructureRecord } from './schema.ts'
import { AXIS_END_HPF } from './timeAxis.ts'

export interface HandoffFallbackResult {
  structures: StructureRecord[]
  /** One line per adjusted record: `handoffs:<hid>: <id> keeps its mesh to <hpf> hpf`. */
  notes: string[]
}

/** True when the handoff has at least one `to` record that draws something. */
export function handoffHasTarget(handoff: HandoffRecord, byId: ReadonlyMap<string, StructureRecord>): boolean {
  return handoff.to.some((id) => {
    const r = byId.get(id)
    return r !== undefined && hasBuilder(r)
  })
}

/** The handoffs whose `from` records must keep their geometry: not withinRecord, no drawable target. */
export function handoffsWithoutTargets(handoffs: readonly HandoffRecord[], byId: ReadonlyMap<string, StructureRecord>): HandoffRecord[] {
  return handoffs.filter((h) => !h.withinRecord && !handoffHasTarget(h, byId))
}

function namesHandoff(record: StructureRecord, handoffId: string): boolean {
  if (record.geometry?.handoffOut === handoffId) return true
  return (record.overrideNote ?? '').includes(handoffId)
}

/** Returns the records with the fallback applied; records that need no change keep their identity. */
export function applyHandoffFallback(structures: StructureRecord[], handoffs: readonly HandoffRecord[]): HandoffFallbackResult {
  const byId = new Map(structures.map((r) => [r.id, r]))
  const pending = handoffsWithoutTargets(handoffs, byId)
  const notes: string[] = []
  if (pending.length === 0) return { structures, notes }
  const out = new Map(byId)
  for (const h of pending) {
    for (const id of h.from) {
      const r = out.get(id)
      if (!r || !r.geometry || !namesHandoff(r, h.id)) continue
      const zfaEnd = Math.min(r.endHpf, AXIS_END_HPF)
      const geometryEnd = r.geometry.geometryEndHpf
      const extendWindow = r.modelEndHpf < zfaEnd - 1e-9
      const dropGeometryEnd = geometryEnd !== undefined && geometryEnd < r.modelEndHpf - 1e-9
      if (!extendWindow && !dropGeometryEnd) continue
      const modelEndHpf = extendWindow ? zfaEnd : r.modelEndHpf
      const clampedToAxis = r.endHpf > AXIS_END_HPF && modelEndHpf >= AXIS_END_HPF
      const geometry = { ...r.geometry }
      delete (geometry as { geometryEndHpf?: number }).geometryEndHpf
      out.set(id, {
        ...r,
        modelEndHpf,
        fadeOutHpf: clampedToAxis ? 0 : Math.min(r.fadeOutHpf, modelEndHpf - r.visibleFromHpf),
        geometry: geometry as StructureRecord['geometry'],
      })
      notes.push(`handoffs:${h.id}: ${id} keeps its mesh to ${modelEndHpf} hpf until a target record lands`)
    }
  }
  return { structures: structures.map((r) => out.get(r.id) ?? r), notes }
}
