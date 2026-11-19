// Theme tokens for the scene: `--bg` (background, hemisphere light), `--text-muted`
// (isolate ghosts) and `--focus` (selection outline), read from the CSS variables that
// src/styles.css defines per theme. The viewer never imports src/ui (AR-05).
import { FLUORESCENCE_BACKGROUND } from '../core/fluorescence.ts'
import type { Theme } from '../core/palette.ts'
import { FOCUS_HEX } from '../core/palette.ts'

/**
 * The token sets the scene renders with. `fluorescence` is the reporter preview of D18: one dark
 * ground whatever the page theme, so the background, the hemisphere light, the skin rim and the
 * export all read the same value. Its values are fixed and never come from the document, so an
 * export in the preview cannot store the live theme's colours under `dark` or `light`.
 */
export type ThemeVariant = Theme | 'fluorescence'

export interface ThemeTokens { bg: string; textMuted: string; focus: string; theme: Theme; variant: ThemeVariant }

const DARK: ThemeTokens = { bg: '#0E1116', textMuted: '#9AA3AD', focus: FOCUS_HEX.dark, theme: 'dark', variant: 'dark' }

const FALLBACK: Record<ThemeVariant, ThemeTokens> = {
  dark: DARK,
  light: { bg: '#F5F6F7', textMuted: '#5B6470', focus: FOCUS_HEX.light, theme: 'light', variant: 'light' },
  fluorescence: { ...DARK, bg: FLUORESCENCE_BACKGROUND, variant: 'fluorescence' },
}

function cssVar(name: string): string | null {
  if (typeof document === 'undefined') return null
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : null
}

/** The theme the document shows: the root attribute, else the store's choice. */
export function documentTheme(fallback: Theme): Theme {
  if (typeof document === 'undefined') return fallback
  const attr = document.documentElement.getAttribute('data-theme')
  return attr === 'light' || attr === 'dark' ? attr : fallback
}

/** The variant to render with: the preview ground while the reporter preview is on (D18). */
export function variantFor(theme: Theme, fluorescenceEnabled: boolean): ThemeVariant {
  return fluorescenceEnabled ? 'fluorescence' : theme
}

const cache = new Map<Theme, ThemeTokens>()

/** Tokens of one variant; the CSS values win over the built-in copies. Cached per theme. */
export function readThemeTokens(variant: ThemeVariant): ThemeTokens {
  // The preview ground is a constant: reading the document here would write the live theme's
  // values into this variant, and caching it under a theme would hand them to the next export.
  if (variant === 'fluorescence') return FALLBACK.fluorescence
  const hit = cache.get(variant)
  if (hit) return hit
  const base = FALLBACK[variant]
  const tokens: ThemeTokens = {
    theme: variant,
    variant,
    bg: cssVar('--bg') ?? base.bg,
    textMuted: cssVar('--text-muted') ?? base.textMuted,
    focus: cssVar('--focus') ?? base.focus,
  }
  // Cache only a value read from the live stylesheet; a fallback may precede the CSS.
  if (cssVar('--bg') !== null) cache.set(variant, tokens)
  return tokens
}
