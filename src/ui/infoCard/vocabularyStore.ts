// Lazy holder of the ZFA vocabulary (D17). The 750 kB chunk is fetched on demand: the search
// field asks for it on the first keystroke, and a link that names a term asks for it at start-up.
// Nothing here runs before one of those, so the first download and the first frame are unchanged.
import { useEffect, useSyncExternalStore } from 'react'
import type { Vocabulary } from '../../core/vocabulary.ts'

export interface VocabularyState {
  vocab: Vocabulary | null
  loading: boolean
  /** The chunk failed to load; search keeps working on the records alone. */
  failed: boolean
}

let state: VocabularyState = { vocab: null, loading: false, failed: false }
const listeners = new Set<() => void>()

function publish(next: VocabularyState): void {
  state = next
  for (const listener of listeners) listener()
}

export function subscribeVocabulary(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function vocabularyState(): VocabularyState {
  return state
}

/** Starts the fetch once. A second call while it is in flight, or after it landed, does nothing. */
export function requestVocabulary(): Promise<Vocabulary | null> {
  if (state.vocab) return Promise.resolve(state.vocab)
  if (state.failed) return Promise.resolve(null)
  if (!state.loading) publish({ vocab: null, loading: true, failed: false })
  // The import is dynamic so src/data/index.ts and its six JSON files stay out of the shell's
  // synchronous graph: InfoCard.tsx imports this file at start-up (spec 2.9 budget).
  return import('../../data/index.ts')
    .then((module) => module.loadVocabulary())
    .then(
      (vocab) => {
        publish({ vocab, loading: false, failed: false })
        return vocab
      },
      () => {
        publish({ vocab: null, loading: false, failed: true })
        return null
      },
    )
}

/** The vocabulary state; `enabled` starts the fetch after the render that first needs it. */
export function useVocabulary(enabled = true): VocabularyState {
  const current = useSyncExternalStore(subscribeVocabulary, vocabularyState, vocabularyState)
  useEffect(() => {
    if (enabled) void requestVocabulary()
  }, [enabled])
  return current
}
