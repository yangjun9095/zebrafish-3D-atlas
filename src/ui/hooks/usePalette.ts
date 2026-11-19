// The palette setting (UI-27, UX-VS-06) for the swatches of the rail, tree, search and card.
import { useSyncExternalStore } from 'react'
import type { PaletteMode } from '../../core/palette.ts'
import { settingsStore } from '../../state/slices/settings.ts'

const read = (): PaletteMode => settingsStore.getState().palette
const server = (): PaletteMode => 'atlas'

export function usePalette(): PaletteMode {
  return useSyncExternalStore(settingsStore.subscribe, read, server)
}
