// Selection from the panels (UX-IN-25): search rows and tree rows select through these two helpers.
import { formatTime } from '../core/format.ts'
import { firstFullyVisibleHpf } from '../core/presence.ts'
import { readAtlas } from '../state/store.ts'
import type { ZfaId } from '../state/store.ts'
import { showToast } from './hooks/useToast.ts'

/** A toast with an action stays as long as an error toast, so the user can reach the button. */
export const ACTION_TOAST_MS = 6000

/**
 * Selects the record. When it is absent at t and "Jump to appearance on select" is off, t does not
 * change and a toast offers the UI-20 target; with the setting on, the store moves t itself.
 */
export function selectStructure(id: ZfaId, opts: { add?: boolean } = {}): void {
  const s = readAtlas()
  const record = s.data?.structuresById.get(id)
  const absent = record !== undefined && !s.presentIds.includes(id)
  s.select(id, opts)
  if (!record || !absent || opts.add || s.jumpOnSelect) return
  const target = firstFullyVisibleHpf(record)
  showToast(`${record.name} is not present at ${formatTime(s.time)}`, {
    durationMs: ACTION_TOAST_MS,
    action: { label: `Jump to ${formatTime(target)}`, onClick: () => readAtlas().jumpToAppearance(id) },
  })
}

/** "Jump to first appearance": t moves to the UI-20 target, then the record is selected. */
export function jumpToStructure(id: ZfaId): void {
  const s = readAtlas()
  s.jumpToAppearance(id)
  s.select(id)
}
