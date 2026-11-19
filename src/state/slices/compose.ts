// Composes the slices into one vanilla zustand store. No React and no core runtime import here,
// so tests can build a store with stub deps.
import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'
import type { AtlasState, AtlasStore, StoreDeps } from './types.ts'
import { createTimeSlice } from './time.ts'
import { createSelectionSlice } from './selection.ts'
import { createVisibilitySlice } from './visibility.ts'
import { createViewSlice } from './view.ts'
import { createAppearanceSlice } from './appearance.ts'
import { createModeSlice } from './mode.ts'
import { createRuntimeSlice } from './runtime.ts'
import { createUrlSlice } from './url.ts'
import { createFluorescenceSlice } from './fluorescence.ts'

export function composeAtlasStore(deps: StoreDeps, init: Partial<AtlasState> = {}) {
  return createStore<AtlasStore>()(
    subscribeWithSelector((set, get) => ({
      ...createTimeSlice(set, get, deps),
      ...createSelectionSlice(set, get),
      ...createVisibilitySlice(set, get),
      ...createViewSlice(set, get),
      ...createAppearanceSlice(set, get),
      ...createModeSlice(set, get, deps),
      ...createRuntimeSlice(set, get, deps),
      ...createUrlSlice(set, get, deps),
      ...createFluorescenceSlice(set, get),
      ...init,
    })),
  )
}

export type AtlasStoreApi = ReturnType<typeof composeAtlasStore>
