// Open state of the export and share dialogs (spec 5.11): a view over the overlay registry of
// src/state/shortcuts.ts, so the top bar buttons (ShareExportMenu.tsx), the Ctrl+Shift+S and
// Shift+C defaults of the dispatcher and the Escape order all share one open sheet.
import { useSyncExternalStore } from 'react'
import { closeOverlay, getOverlay, openOverlay, subscribeOverlay } from '../../state/shortcuts.ts'

export type AtlasDialog = 'export' | 'share' | null

export const openExportDialog = (): void => openOverlay('export')
export const openShareDialog = (): void => openOverlay('share')
export const closeDialogs = (): void => {
  const open = getOverlay()
  if (open === 'export' || open === 'share') closeOverlay(open)
}
export const getOpenDialog = (): AtlasDialog => {
  const open = getOverlay()
  if (open === 'export') return 'export'
  return open === 'share' ? 'share' : null
}
export const subscribeDialog = subscribeOverlay

/** Which dialog is open; ExportDialog.tsx renders the sheets from it. */
export function useOpenDialog(): AtlasDialog {
  return useSyncExternalStore(subscribeDialog, getOpenDialog, () => null)
}
