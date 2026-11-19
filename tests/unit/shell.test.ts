import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../src/App.tsx'
import { About } from '../../src/ui/About.tsx'
import { BadUrlNotice, ContextLostNotice, DataErrorCard, WebglUnavailable } from '../../src/ui/ErrorScreens.tsx'
import { ToastHost } from '../../src/ui/Toast.tsx'
import { Badge, Button, Combobox, IconButton, Kbd, Sheet, Slider, Switch, Tooltip } from '../../src/ui/primitives/index.ts'
import { findBinding, matchesBinding, shouldIgnoreKeyEvent, type KeyEventLike } from '../../src/ui/hooks/useKeyboard.ts'
import { clearToasts, dismissToast, getToasts, setToastErrorsOnly, showToast } from '../../src/ui/hooks/useToast.ts'
import { breakpointFor } from '../../src/ui/hooks/useBreakpoint.ts'

const css = readFileSync(fileURLToPath(new URL('../../src/styles.css', import.meta.url)), 'utf8')

// Spec 5.8.2: slot, D5 system id, dark hex, light hex.
const PALETTE: ReadonlyArray<[string, string, string]> = [
  ['nervous', '#5B8DEF', '#1863BF'],
  ['sensory', '#7FD3F5', '#2989A9'],
  ['cardiovascular', '#E4483C', '#B81A1D'],
  ['hematopoietic_immune', '#F28FA0', '#B15567'],
  ['muscular', '#F08A3C', '#B05500'],
  ['skeletal', '#F0EDE4', '#939088'],
  ['integument_pigment', '#C3CAD2', '#7A8188'],
  ['digestive', '#A9713B', '#84511C'],
  ['respiratory', '#66D1C2', '#028B7E'],
  ['excretory', '#C6D34A', '#7A8800'],
  ['reproductive', '#B067D6', '#8641AC'],
  ['endocrine', '#D34FA7', '#AA2382'],
  ['axial', '#3E9B4F', '#01722A'],
  ['fins', '#A9AFF2', '#6972B0'],
  ['early_embryo', '#D9C79A', '#8E7E55'],
]

// Spec 5.8.1: token, dark, light.
const THEME_TOKENS: ReadonlyArray<[string, string, string]> = [
  ['bg', '#0E1116', '#F5F6F7'],
  ['surface', '#161B22', '#FFFFFF'],
  ['surface-2', '#1E252E', '#EEF1F4'],
  ['border', '#2A323C', '#D7DCE2'],
  ['text', '#E7EAEE', '#1B1F24'],
  ['text-muted', '#9AA3AD', '#5B6470'],
  ['accent', '#5FB8E8', '#0B6E99'],
  ['focus', '#FFD166', '#B45309'],
  ['danger', '#E4483C', '#B81A1D'],
]

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`)
  expect(start, `block ${selector}`).toBeGreaterThanOrEqual(0)
  return css.slice(start, css.indexOf('}', start))
}

describe('design tokens', () => {
  const dark = block(':root')
  const light = block('[data-theme="light"]')

  it('defines the nine theme tokens for both themes with the spec hex values', () => {
    for (const [name, d, l] of THEME_TOKENS) {
      expect(dark).toContain(`--${name}: ${d};`)
      expect(light).toContain(`--${name}: ${l};`)
    }
  })

  it('defines the 15 palette slots for both themes with the spec hex values', () => {
    expect(PALETTE).toHaveLength(15)
    for (const [id, d, l] of PALETTE) {
      expect(dark).toContain(`--sys-${id}: ${d};`)
      expect(light).toContain(`--sys-${id}: ${l};`)
    }
  })

  it('maps the tokens into the Tailwind theme and keeps the focus ring and reduced motion rules', () => {
    expect(css).toContain('@theme inline')
    for (const [id] of PALETTE) expect(css).toContain(`--color-sys-${id}: var(--sys-${id});`)
    expect(css).toContain('--color-accent: var(--accent);')
    expect(css).toContain('outline: 2px solid var(--focus);')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('--radius-sheet: 16px;')
  })
})

describe('App shell', () => {
  it('renders the five layout regions and the viewer wrapper', () => {
    const html = renderToString(h(App))
    for (const name of ['Top bar', 'Systems rail', '3D viewer', 'Info card', 'Timeline bar']) {
      expect(html).toContain(name)
    }
    expect(html).toContain('data-atlas-ready="false"')
    expect(html).toContain('data-presentation="false"')
    expect(html).toContain('aria-live="polite"')
  })

  it('exposes the presentation and embed hooks on the root', () => {
    const html = renderToString(h(App, { presentation: true, strip: 'top', cardOpen: false }))
    expect(html).toContain('data-presentation="true"')
    expect(html).toContain('data-strip="top"')
    expect(html).toContain('data-card="closed"')
  })
})

describe('primitives', () => {
  it('Button renders a type=button with aria-pressed and variant classes', () => {
    const html = renderToString(h(Button, { variant: 'primary', pressed: true }, 'Play'))
    expect(html).toContain('type="button"')
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('btn-primary')
  })

  it('IconButton carries an aria-label', () => {
    const html = renderToString(h(IconButton, { label: 'Play', shortcut: 'Space', children: 'x' }))
    expect(html).toContain('aria-label="Play"')
    expect(html).toContain('iconbtn')
  })

  it('Switch uses role=switch and aria-checked', () => {
    const html = renderToString(h(Switch, { checked: true, onChange: () => {}, label: 'Snap' }))
    expect(html).toContain('role="switch"')
    expect(html).toContain('aria-checked="true"')
    expect(html).toContain('Snap')
  })

  it('Slider renders a labelled range input with aria-valuetext', () => {
    const html = renderToString(
      h(Slider, { value: 60, onChange: () => {}, label: 'X-ray', formatValue: (v: number) => `${v}%` }),
    )
    expect(html).toContain('type="range"')
    expect(html).toContain('aria-valuetext="60%"')
    expect(html).toContain('--fill:60%')
  })

  it('Sheet renders a labelled dialog when open and nothing when closed', () => {
    const open = renderToString(h(Sheet, { open: true, onClose: () => {}, title: 'Layers', side: 'bottom', detent: 'peek', children: 'body' }))
    expect(open).toContain('role="dialog"')
    expect(open).toContain('aria-labelledby=')
    expect(open).toContain('data-detent="peek"')
    expect(renderToString(h(Sheet, { open: false, onClose: () => {}, title: 'Layers', children: 'body' }))).toBe('')
  })

  it('Combobox renders the combobox role with a controlled listbox', () => {
    const html = renderToString(
      h(Combobox, {
        value: '',
        onValueChange: () => {},
        items: [{ id: 'a', label: 'Heart', hint: 'Cardiovascular' }],
        onSelect: () => {},
        label: 'Search structures',
      }),
    )
    expect(html).toContain('role="combobox"')
    expect(html).toContain('aria-autocomplete="list"')
    expect(html).toContain('aria-expanded="false"')
  })

  it('Tooltip injects aria-describedby into its child; Badge and Kbd render', () => {
    const tip = renderToString(h(Tooltip, { label: 'Play', shortcut: 'Space', children: h('button', null, 'p') }))
    expect(tip).toContain('aria-describedby=')
    expect(renderToString(h(Badge, { tone: 'accent', children: '4 / 5' }))).toContain('badge-accent')
    expect(renderToString(h(Kbd, { keys: ['Ctrl', 'K'] }))).toContain('<kbd class="kbd">K</kbd>')
  })
})

describe('shell components', () => {
  it('error screens carry the spec texts', () => {
    const data = renderToString(h(DataErrorCard, { error: { file: 'structures.json', issues: [{ path: 'a.b', message: 'bad' }] } }))
    expect(data).toContain('Could not load the atlas data')
    expect(data).toContain('structures.json')
    expect(renderToString(h(WebglUnavailable, {}))).toContain('This browser cannot run the 3D viewer.')
    expect(renderToString(h(ContextLostNotice, { onReload: () => {} }))).toContain('The 3D view paused. Restoring…')
    const bad = renderToString(h(BadUrlNotice, { unknownIds: ['ZFA:9999999'], timeClamped: true }))
    expect(bad).toContain('Structure ZFA:9999999 is not in this atlas')
    expect(bad).toContain('Time clamped to 180 dpf')
  })

  it('About states the three facts and both ZFIN licences', () => {
    const html = renderToString(h(About, { ontologyRelease: '2026-07-16' }))
    expect(html).toContain('procedural')
    expect(html).toContain('28.5 C')
    expect(html).toContain('2026-07-16')
    expect(html).toContain('CC BY 3.0')
    expect(html).toContain('CC BY 4.0')
    expect(html).toContain('ATTRIBUTION.md')
  })
})

describe('toast queue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setToastErrorsOnly(false)
    clearToasts()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows one toast at a time and advances after its duration', () => {
    showToast('Link copied')
    showToast('Bad', { kind: 'error' })
    expect(getToasts().map((t) => t.text)).toEqual(['Link copied', 'Bad'])
    expect(renderToString(h(ToastHost))).toContain('role="status"')
    vi.advanceTimersByTime(2000)
    expect(getToasts().map((t) => t.text)).toEqual(['Bad'])
    vi.advanceTimersByTime(6000)
    expect(getToasts()).toHaveLength(0)
  })

  it('drops confirmations in presentation mode and dismisses by id', () => {
    setToastErrorsOnly(true)
    expect(showToast('Copied')).toBe(-1)
    const id = showToast('Bad', { kind: 'error' })
    dismissToast(id)
    expect(getToasts()).toHaveLength(0)
  })
})

describe('key dispatcher', () => {
  const ev = (over: Partial<KeyEventLike>): KeyEventLike => ({
    code: 'Space',
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    defaultPrevented: false,
    target: null,
    ...over,
  })

  it('matches on code and exact modifiers, with Command standing in for Ctrl', () => {
    expect(matchesBinding(ev({ code: 'Space' }), { code: 'Space', run: () => {} })).toBe(true)
    expect(matchesBinding(ev({ code: 'Space', shiftKey: true }), { code: 'Space', run: () => {} })).toBe(false)
    expect(matchesBinding(ev({ code: 'KeyK', metaKey: true }), { code: 'KeyK', ctrl: true, run: () => {} })).toBe(true)
    expect(matchesBinding(ev({ code: 'Minus', altKey: true }), { code: 'Minus', alt: true, run: () => {} })).toBe(true)
  })

  it('ignores handled events and events from text fields, buttons, sliders and listboxes', () => {
    expect(shouldIgnoreKeyEvent(ev({ defaultPrevented: true }))).toBe(true)
    const el = (tagName: string, role?: string) =>
      ({ tagName, getAttribute: (n: string) => (n === 'role' ? (role ?? null) : null) }) as unknown as EventTarget
    expect(shouldIgnoreKeyEvent(ev({ target: el('INPUT') }))).toBe(true)
    expect(shouldIgnoreKeyEvent(ev({ target: el('BUTTON') }))).toBe(true)
    expect(shouldIgnoreKeyEvent(ev({ target: el('DIV', 'slider') }))).toBe(true)
    expect(shouldIgnoreKeyEvent(ev({ target: el('UL', 'listbox') }))).toBe(true)
    expect(shouldIgnoreKeyEvent(ev({ target: el('DIV') }))).toBe(false)
  })

  it('returns the first enabled binding', () => {
    const hits: string[] = []
    const bindings = [
      { code: 'KeyP', when: () => false, run: () => hits.push('off') },
      { code: 'KeyP', run: () => hits.push('on') },
    ]
    findBinding(ev({ code: 'KeyP' }), bindings)?.run(new Event('keydown') as KeyboardEvent)
    expect(hits).toEqual(['on'])
  })
})

describe('breakpoints', () => {
  it('follows the spec widths', () => {
    expect(breakpointFor(390)).toBe('phone')
    expect(breakpointFor(640)).toBe('tablet')
    expect(breakpointFor(1279)).toBe('tablet')
    expect(breakpointFor(1280)).toBe('desktop')
  })
})
