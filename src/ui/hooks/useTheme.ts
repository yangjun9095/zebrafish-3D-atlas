import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

/** The localStorage key. index.html reads the same key before first paint. */
export const THEME_STORAGE_KEY = 'zfatlas.theme'
export const THEME_ATTRIBUTE = 'data-theme'

const listeners = new Set<() => void>()
let current: Theme | null = null

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}

/** The theme stored by an earlier visit, or null. */
export function readStoredTheme(): Theme | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null
    return isTheme(raw) ? raw : null
  } catch {
    return null
  }
}

/** The OS preference. Dark is the default theme (UX-US-06). */
export function systemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** Resolves the theme in the load order: root attribute, stored choice, OS preference. */
export function resolveInitialTheme(): Theme {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute(THEME_ATTRIBUTE)
    if (isTheme(attr)) return attr
  }
  return readStoredTheme() ?? systemTheme()
}

/** The current theme; resolves it on first use. */
export function getTheme(): Theme {
  if (current === null) current = resolveInitialTheme()
  return current
}

/** Writes the theme to the root attribute and, unless `persist` is false, to localStorage. */
export function applyTheme(theme: Theme, opts: { persist?: boolean } = {}): void {
  current = theme
  if (typeof document !== 'undefined') document.documentElement.setAttribute(THEME_ATTRIBUTE, theme)
  if (opts.persist !== false) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Storage can be blocked; the attribute still applies for this page.
    }
  }
  for (const cb of listeners) cb()
}

export function subscribeTheme(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export interface ThemeApi {
  theme: Theme
  setTheme: (theme: Theme, opts?: { persist?: boolean }) => void
  toggleTheme: () => void
}

/** Reads and sets the theme through the root `data-theme` attribute and localStorage. */
export function useTheme(): ThemeApi {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'dark' as Theme)
  const setTheme = useCallback((next: Theme, opts?: { persist?: boolean }) => applyTheme(next, opts), [])
  const toggleTheme = useCallback(() => applyTheme(getTheme() === 'dark' ? 'light' : 'dark'), [])
  return { theme, setTheme, toggleTheme }
}
