// Runtime slice: the parsed data, tessellation level, rebuild counter, WebGL status, and warnings.
import type { Get, RuntimeActions, RuntimeState, Set, StoreDeps } from './types.ts'
import { refreshDerived } from './time.ts'

export function createRuntimeSlice(set: Set, get: Get, deps: StoreDeps): RuntimeState & RuntimeActions {
  return {
    data: null,
    dataError: null,
    tessellation: 'interactive',
    rebuildPending: 0,
    webgl: 'probing',
    warnings: [],

    loadData(result) {
      if (result.ok) set({ data: result.data, dataError: null })
      else set({ data: null, dataError: result.error })
      refreshDerived(set, get, deps)
    },
    setTessellation(level) {
      if (level !== get().tessellation) set({ tessellation: level })
    },
    setRebuildPending(n) {
      if (n !== get().rebuildPending) set({ rebuildPending: n })
    },
    setWebgl(s) {
      if (s !== get().webgl) set({ webgl: s })
    },
    pushWarning(text) {
      set({ warnings: [...get().warnings, text] })
    },
    clearWarnings() {
      if (get().warnings.length > 0) set({ warnings: [] })
    },
  }
}
