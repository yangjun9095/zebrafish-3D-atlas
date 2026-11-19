// React view of the theme tokens: follows the root `data-theme` attribute (set by
// index.html and src/ui) and the store's theme field.
import { useSyncExternalStore } from 'react'
import { atlasStore } from '../state/store.ts'
import { documentTheme, readThemeTokens } from './tokens.ts'
import type { ThemeTokens } from './tokens.ts'

let cached: ThemeTokens | null = null

function current(): ThemeTokens {
  const theme = documentTheme(atlasStore.getState().theme)
  if (!cached || cached.theme !== theme) cached = readThemeTokens(theme)
  return cached
}

function subscribe(cb: () => void): () => void {
  const unsub = atlasStore.subscribe((s) => s.theme, () => { cached = null; cb() })
  let observer: MutationObserver | null = null
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    observer = new MutationObserver(() => { cached = null; cb() })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  }
  return () => {
    unsub()
    observer?.disconnect()
  }
}

export function useThemeTokens(): ThemeTokens {
  return useSyncExternalStore(subscribe, current, current)
}
