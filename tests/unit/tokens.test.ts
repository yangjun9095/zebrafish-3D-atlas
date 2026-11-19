// Theme tokens (src/viewer/tokens.ts): the two page themes read the live CSS variables and cache
// them per theme; the reporter preview variant is a constant that reads nothing from the document,
// so an export in the preview cannot hand the next export the wrong background (review item 4).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FLUORESCENCE_BACKGROUND } from '../../src/core/fluorescence.ts'
import { FOCUS_HEX } from '../../src/core/palette.ts'
import { readThemeTokens, variantFor } from '../../src/viewer/tokens.ts'

const LIGHT_CSS: Record<string, string> = { '--bg': '#F5F6F7', '--text-muted': '#5B6470', '--focus': '#0B57D0' }

/** A light-theme document that counts every variable read, so a test can prove there was none. */
function stubLightDocument(): { reads: number } {
  const counter = { reads: 0 }
  vi.stubGlobal('document', { documentElement: { getAttribute: () => 'light' } })
  vi.stubGlobal('getComputedStyle', () => ({
    getPropertyValue: (name: string): string => {
      counter.reads++
      return LIGHT_CSS[name] ?? ''
    },
  }))
  return counter
}

afterEach(() => { vi.unstubAllGlobals() })

describe('theme token variants (review items 4 and 10)', () => {
  it('holds the preview ground fixed and reads nothing from the document', () => {
    const counter = stubLightDocument()
    const tokens = readThemeTokens('fluorescence')
    expect(counter.reads).toBe(0)
    expect(tokens.bg).toBe(FLUORESCENCE_BACKGROUND)
    expect(tokens.variant).toBe('fluorescence')
    expect(tokens.theme).toBe('dark')
    expect(tokens.focus).toBe(FOCUS_HEX.dark)
  })

  it('leaves the dark tokens alone after a preview export made in the light theme', () => {
    stubLightDocument()
    expect(readThemeTokens('light').bg).toBe('#F5F6F7')
    readThemeTokens('fluorescence')
    vi.unstubAllGlobals()
    expect(readThemeTokens('dark').bg).toBe('#0E1116')
    expect(readThemeTokens('dark').textMuted).toBe('#9AA3AD')
  })

  it('picks the preview variant only while the preview is on', () => {
    expect(variantFor('light', true)).toBe('fluorescence')
    expect(variantFor('dark', true)).toBe('fluorescence')
    expect(variantFor('light', false)).toBe('light')
    expect(variantFor('dark', false)).toBe('dark')
  })
})
