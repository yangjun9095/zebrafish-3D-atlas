// Theme actions shared by the theme button, the T key and the store sync (UX-US-06, UX-VS-02).
// The root attribute set by index.html before first paint is what the user sees; the store follows it.
import { useEffect } from 'react'
import { readAtlas, subscribeAtlas } from '../state/store.ts'
import { applyTheme, getTheme } from './hooks/useTheme.ts'
import type { Theme } from './hooks/useTheme.ts'

/** Sets the theme on the root, in localStorage and in the store. */
export function setThemeEverywhere(theme: Theme): void {
  applyTheme(theme)
  readAtlas().setTheme(theme)
}

/** Toggles from the theme that is shown, so a URL or system theme the store has not seen still flips. */
export function toggleThemeEverywhere(): void {
  setThemeEverywhere(getTheme() === 'dark' ? 'light' : 'dark')
}

/** Applies store theme changes (a key, a URL, a setting) to the root attribute. Skips the initial value. */
export function useThemeSync(): void {
  useEffect(
    () =>
      subscribeAtlas(
        (s) => s.theme,
        (theme) => {
          if (theme !== getTheme()) applyTheme(theme, { persist: readAtlas().themeSource === 'user' })
        },
      ),
    [],
  )
}
