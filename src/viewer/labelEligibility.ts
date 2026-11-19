// Label eligibility (AR-37): decided from store state alone, so a chip appears with its
// structure and not one store change later (phase 1 review F10).
import type { StructureRecord } from '../core/schema.ts'

export interface LabelEligibility {
  presentIds: readonly string[]
  hiddenSystems: readonly string[]
  hiddenStructures: readonly string[]
  isolate: boolean
  selection: readonly string[]
}

/** True when the store state lets the structure draw at an opacity above the ghost level. */
export function labelEligible(record: StructureRecord | undefined, state: LabelEligibility): boolean {
  if (!record || !record.geometry) return false
  if (!state.presentIds.includes(record.id)) return false
  if (state.hiddenStructures.includes(record.id) || state.hiddenSystems.includes(record.system)) return false
  if (state.isolate && state.selection.length > 0 && !state.selection.includes(record.id)) return false
  return true
}
