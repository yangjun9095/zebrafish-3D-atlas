// The D4 view preset table (spec 5.7.2). The keys (digits 1 to 6, T; 5.9.1) are defaults of the
// dispatcher in src/state/shortcuts.ts; App.tsx layers T through the theme actions.
import type { ViewPreset } from '../state/store.ts'

export interface PresetDef {
  id: Exclude<ViewPreset, 'free'>
  short: string
  name: string
  key: string
}

/** D4 order; the key is the digit of 5.9.1. */
export const VIEW_PRESETS: readonly PresetDef[] = [
  { id: 'lateral', short: 'Lat', name: 'Lateral', key: '1' },
  { id: 'dorsal', short: 'Dor', name: 'Dorsal', key: '2' },
  { id: 'ventral', short: 'Ven', name: 'Ventral', key: '3' },
  { id: 'anterior', short: 'Ant', name: 'Anterior', key: '4' },
  { id: 'posterior', short: 'Pos', name: 'Posterior', key: '5' },
  { id: 'threeQuarter', short: '3/4', name: 'Three-quarter', key: '6' },
]
