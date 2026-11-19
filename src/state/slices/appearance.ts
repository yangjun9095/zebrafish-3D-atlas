// Appearance slice: theme, labels, quality, reduced motion, and the jump-on-select setting.
import type { AppearanceActions, AppearanceState, Get, Set } from './types.ts'

export function createAppearanceSlice(set: Set, get: Get): AppearanceState & AppearanceActions {
  return {
    theme: 'dark',
    themeSource: 'system',
    labels: false,
    quality: 'standard',
    reducedMotion: false,
    jumpOnSelect: false,

    setTheme(t) {
      set({ theme: t, themeSource: 'user' })
    },
    toggleTheme() {
      get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
    },
    setLabels(on) {
      if (on !== get().labels) set({ labels: on })
    },
    setQuality(q) {
      if (q !== get().quality) set({ quality: q })
    },
    setReducedMotion(on) {
      if (on !== get().reducedMotion) set({ reducedMotion: on })
    },
    setJumpOnSelect(on) {
      if (on !== get().jumpOnSelect) set({ jumpOnSelect: on })
    },
  }
}
