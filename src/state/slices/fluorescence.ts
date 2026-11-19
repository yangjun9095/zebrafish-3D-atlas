import { emptyFluorescence, FluorescenceConfig } from '../../core/fluorescence.ts'
import type { FluorescenceActions, FluorescenceState, Get, Set } from './types.ts'

export function createFluorescenceSlice(set: Set, get: Get): FluorescenceState & FluorescenceActions {
  return {
    labEnabled: false,
    fluorescence: emptyFluorescence(),
    setFluorescence(patch) {
      const result = FluorescenceConfig.safeParse({ ...get().fluorescence, ...patch })
      if (result.success) set({ fluorescence: result.data })
      else get().pushWarning('Check fluorescence targets and times (0–4320 hpf, start ≤ end).')
    },
  }
}
