// Selection slice: the selected ids (at most 12, AR-20), hover, pinned labels, and the selected
// ZFA vocabulary term of D17.
//
// A vocabulary term that no record draws still opens the info card. The store keeps its id in
// `selectedTerm` and puts the term's stand-in record in `selection`, so the selection outline and
// every consumer of `selection` keep working with no change: the outline lands on the modeled
// ancestor and the card shows the term. src/ui/infoCard/term.ts resolves the stand-in and holds
// the URL round trip. The two fields are declared here, next to the actions that own them.
import type { Get, SelectionActions, SelectionState, Set, ZfaId } from './types.ts'
import { MAX_SELECTION } from './types.ts'

declare module './types.ts' {
  interface SelectionState {
    /** ZFA id of the selected vocabulary term, or null when the selection is records only. */
    selectedTerm: string | null
  }
  interface SelectionActions {
    /** Selects a vocabulary term and highlights `standIn`; a null term id clears the term only. */
    selectTerm(termId: string | null, standIn: ZfaId | null): void
  }
}

export function createSelectionSlice(set: Set, get: Get): SelectionState & SelectionActions {
  /** Every record selection drops the term: the card follows the record from then on. */
  const dropTerm = (): void => {
    if (get().selectedTerm !== null) set({ selectedTerm: null })
  }
  return {
    selection: [],
    hover: null,
    pinnedLabels: [],
    selectedTerm: null,

    select(id, opts) {
      dropTerm()
      const { selection } = get()
      if (id === null) {
        if (selection.length > 0) set({ selection: [] })
        return
      }
      let next: ZfaId[] = selection
      if (opts?.add) {
        next = selection.includes(id) ? selection.filter((x) => x !== id) : [...selection, id]
        if (next.length > MAX_SELECTION) next = next.slice(next.length - MAX_SELECTION)
      } else if (selection.length !== 1 || selection[0] !== id) {
        next = [id]
      }
      if (next !== selection) set({ selection: next })
      const { jumpOnSelect, presentIds } = get()
      if (!opts?.add && jumpOnSelect && !presentIds.includes(id)) get().jumpToAppearance(id)
    },
    selectTerm(termId, standIn) {
      if (termId === null) {
        dropTerm()
        return
      }
      // select() runs first so the jump-on-select rule and the 12-id cap behave as for a record.
      if (standIn) get().select(standIn)
      else get().select(null)
      set({ selectedTerm: termId })
    },
    clearSelection() {
      dropTerm()
      if (get().selection.length > 0) set({ selection: [] })
    },
    setHover(id) {
      if (id !== get().hover) set({ hover: id })
    },
    togglePinnedLabel(id) {
      const { pinnedLabels } = get()
      set({ pinnedLabels: pinnedLabels.includes(id) ? pinnedLabels.filter((x) => x !== id) : [...pinnedLabels, id] })
    },
  }
}
