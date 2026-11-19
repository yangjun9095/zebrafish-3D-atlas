// Accessibility pass (WP-H2, spec 5.9, research 07 section 7): ARIA roles, focus handling and
// keyboard behaviour across src/ui/**. No new dependency: every check below reads the live DOM
// and computed styles through Playwright, rather than a third-party audit library.
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { INFO_CARD_SELECTOR, TRACK_SELECTOR, openReady } from './helpers.ts'

const HEART = '0000114'
const SEL_URL = `/?t=24&v=lat&sel=${HEART}`

// ---- accessible name (UX-AC-05) ----------------------------------------------------------

/**
 * A rough accessible-name computation, close enough for this audit: aria-label wins, then
 * aria-labelledby, then the trimmed text content, then the title attribute.
 */
async function accessibleNames(page: Page, selector: string): Promise<{ name: string; outerHTML: string }[]> {
  return page.$$eval(selector, (els) =>
    els.map((el) => {
      const label = el.getAttribute('aria-label')
      const pick = (s: string | null) => (s && s.trim().length > 0 ? s.trim() : null)
      let name = pick(label)
      if (!name) {
        const labelledby = el.getAttribute('aria-labelledby')
        if (labelledby) {
          const text = labelledby
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent ?? '')
            .join(' ')
          name = pick(text)
        }
      }
      if (!name) name = pick(el.textContent)
      if (!name) name = pick(el.getAttribute('title'))
      return { name: name ?? '', outerHTML: el.outerHTML.slice(0, 160) }
    }),
  )
}

// ---- visible focus ring (UX-AC-06) -------------------------------------------------------

/**
 * True when the focused element, or one of its descendants (a tree row, a slider thumb: the
 * indicator sits on a child in both), carries a non-default outline or box-shadow.
 */
async function focusRingVisible(page: Page): Promise<{ ok: boolean; detail: string }> {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null
    if (!active || active === document.body) return { ok: false, detail: 'no active element' }
    const candidates = [active, ...Array.from(active.querySelectorAll<HTMLElement>('*'))]
    for (const el of candidates) {
      const cs = getComputedStyle(el)
      const outlineOk = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
      const shadowOk = cs.boxShadow !== 'none' && cs.boxShadow.trim().length > 0
      if (outlineOk || shadowOk) {
        return { ok: true, detail: `${el.tagName.toLowerCase()}.${el.className}: outline ${cs.outlineStyle} ${cs.outlineWidth}, box-shadow ${cs.boxShadow}` }
      }
    }
    return { ok: false, detail: `${active.tagName.toLowerCase()}.${active.className} (and its descendants) carry no outline or box-shadow` }
  })
}

/** Presses Tab up to `max` times until `pred` matches the newly focused element, or gives up. */
async function tabUntil(page: Page, pred: (el: { role: string | null; tag: string; testid: string | null }) => boolean, max = 80): Promise<boolean> {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const hit = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      return el ? { role: el.getAttribute('role'), tag: el.tagName.toLowerCase(), testid: el.closest('[data-testid]')?.getAttribute('data-testid') ?? null } : null
    })
    if (hit && pred(hit)) return true
  }
  return false
}

// ---- contrast (UX-AC-08, UX-US-02) -------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '')
  // The production CSS build shortens #ffffff to #fff; expand a 3-digit hex before parsing.
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function srgbToLinear(c: number): number {
  const cs = c / 255
  return cs <= 0.03928 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4
}
function relativeLuminance([r, g, b]: readonly [number, number, number]): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}
/** WCAG contrast ratio between two hex colours (SC 1.4.3, SC 1.4.11). */
function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexToRgb(hexA))
  const l2 = relativeLuminance(hexToRgb(hexB))
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

interface Tokens {
  bg: string
  surface: string
  surface2: string
  text: string
  textMuted: string
  accent: string
  focus: string
}
async function readTokens(page: Page): Promise<Tokens> {
  return page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement)
    const get = (name: string) => cs.getPropertyValue(name).trim()
    return {
      bg: get('--bg'), surface: get('--surface'), surface2: get('--surface-2'),
      text: get('--text'), textMuted: get('--text-muted'), accent: get('--accent'), focus: get('--focus'),
    }
  })
}

test.describe('accessible names and duplicate ids', () => {
  test('every button has a non-empty accessible name', async ({ page }) => {
    await openReady(page, SEL_URL)
    const rows = await accessibleNames(page, 'button')
    expect(rows.length).toBeGreaterThan(10)
    const missing = rows.filter((r) => r.name.length === 0)
    expect(missing, JSON.stringify(missing, null, 2)).toEqual([])
  })

  test('every button keeps a name once the settings and shortcut sheets are open', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await page.keyboard.press(',')
    await expect(page.locator('[role="dialog"]').first()).toBeVisible()
    const missing = (await accessibleNames(page, 'button')).filter((r) => r.name.length === 0)
    expect(missing, JSON.stringify(missing, null, 2)).toEqual([])
  })

  test('no id is used twice', async ({ page }) => {
    await openReady(page, SEL_URL)
    await page.keyboard.press(',')
    const dupes = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll('[id]')).map((e) => e.id)
      const seen = new Set<string>()
      const dup = new Set<string>()
      for (const id of ids) {
        if (seen.has(id)) dup.add(id)
        seen.add(id)
      }
      return [...dup]
    })
    expect(dupes).toEqual([])
  })
})

test.describe('landmark roles', () => {
  test('banner, navigation, main, complementary and contentinfo are all present', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const counts = await page.evaluate(() => ({
      banner: document.querySelectorAll('header, [role="banner"]').length,
      navigation: document.querySelectorAll('nav, [role="navigation"]').length,
      main: document.querySelectorAll('main, [role="main"]').length,
      complementary: document.querySelectorAll('aside, [role="complementary"]').length,
      contentinfo: document.querySelectorAll('footer, [role="contentinfo"]').length,
    }))
    for (const [name, n] of Object.entries(counts)) expect(n, `${name} landmark`).toBeGreaterThan(0)
  })
})

test.describe('keyboard: tab order and focus visibility', () => {
  test('tab order reaches the timeline track, the structure tree and the info card', async ({ page }) => {
    await openReady(page, SEL_URL)
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined)
    const seen = { timeline: false, tree: false, card: false }
    for (let i = 0; i < 100 && !(seen.timeline && seen.tree && seen.card); i++) {
      await page.keyboard.press('Tab')
      const hit = await page.evaluate((infoSelector) => {
        const el = document.activeElement as HTMLElement | null
        if (!el) return { timeline: false, tree: false, card: false }
        return {
          timeline: el.matches('[role="slider"][aria-valuemax="4320"]'),
          tree: el.getAttribute('role') === 'treeitem' || Boolean(el.closest('[role="tree"]')),
          card: Boolean(el.closest(infoSelector)),
        }
      }, INFO_CARD_SELECTOR)
      seen.timeline ||= hit.timeline
      seen.tree ||= hit.tree
      seen.card ||= hit.card
    }
    expect(seen, 'tab order should reach the timeline, the tree and the info card').toEqual({ timeline: true, tree: true, card: true })
  })

  test('the first tab stop shows a visible focus ring', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined)
    await page.keyboard.press('Tab')
    const ring = await focusRingVisible(page)
    expect(ring.ok, ring.detail).toBe(true)
  })

  test('a focused tree row shows a visible focus ring (the ring sits on the child row)', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const reached = await tabUntil(page, (el) => el.role === 'treeitem')
    expect(reached, 'no treeitem reached within the tab budget').toBe(true)
    const ring = await focusRingVisible(page)
    expect(ring.ok, ring.detail).toBe(true)
  })

  test('the focused timeline track shows a visible focus ring (the ring sits on the thumb)', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const reached = await tabUntil(page, (el) => el.role === 'slider')
    expect(reached, 'no slider reached within the tab budget').toBe(true)
    const ring = await focusRingVisible(page)
    expect(ring.ok, ring.detail).toBe(true)
  })
})

test.describe('timeline slider (UX-AC-01)', () => {
  test('exposes aria-valuemin, aria-valuemax and a spoken aria-valuetext', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const track = page.locator(TRACK_SELECTOR)
    await expect(track).toHaveAttribute('aria-valuemin', '0')
    await expect(track).toHaveAttribute('aria-valuemax', '4320')
    await expect(track).toHaveAttribute('aria-valuenow', '24')
    const text = await track.getAttribute('aria-valuetext')
    expect(text).toMatch(/24 hours post fertilization/i)
    expect(text).toMatch(/prim-5/i)
    expect(text).toMatch(/period/i)
  })
})

test.describe('timeline events reachable from the keyboard', () => {
  test('Shift+ArrowDown on the focused track opens the nearest event menu, and Escape returns focus', async ({ page }) => {
    // The event diamonds live in an aria-hidden SVG and used to open on a pointer press alone.
    // The gesture takes Shift because the slider pattern reserves plain ArrowDown for decrement.
    await openReady(page, '/?t=24&v=lat')
    const track = page.locator(TRACK_SELECTOR)
    await expect(track).toHaveAttribute('aria-haspopup', 'menu')
    await track.focus()
    await page.keyboard.press('Shift+ArrowDown')
    const menu = page.getByRole('menu', { name: 'Events' })
    await expect(menu).toBeVisible()
    const first = menu.locator('[role="menuitem"]').first()
    await expect(first).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(track).toBeFocused()
  })

  test('a menu item moves the time and hands focus back to the track', async ({ page }) => {
    // 27 hpf carries no event, so the nearest diamond sits at another time and the pick moves the thumb.
    await openReady(page, '/?t=27&v=lat')
    const track = page.locator(TRACK_SELECTOR)
    await track.focus()
    await page.keyboard.press('Shift+ArrowDown')
    const menu = page.getByRole('menu', { name: 'Events' })
    await expect(menu).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(menu).toHaveCount(0)
    await expect(track).toBeFocused()
    await expect(track).not.toHaveAttribute('aria-valuenow', '27')
  })
})

test.describe('timeline slider keys (WAI-ARIA slider pattern)', () => {
  test('ArrowUp and ArrowDown step the time, as the slider pattern requires', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const track = page.locator(TRACK_SELECTOR)
    await track.focus()
    await page.keyboard.press('ArrowUp')
    await expect(track).toHaveAttribute('aria-valuenow', '25')
    await page.keyboard.press('ArrowDown')
    await expect(track).toHaveAttribute('aria-valuenow', '24')
    await expect(page.getByRole('menu', { name: 'Events' })).toHaveCount(0)
  })
})

test.describe('structure tree (UX-AC-02, roving tabindex)', () => {
  test('exactly one row is in the tab sequence at a time, and it follows arrow keys', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const tree = page.getByRole('tree', { name: 'Structures' })
    await expect(tree).toBeVisible()
    const tabbable = tree.locator('[role="treeitem"][tabindex="0"]')
    await expect(tabbable).toHaveCount(1)
    const firstKey = await tabbable.getAttribute('data-key')
    await tabbable.focus()
    await page.keyboard.press('ArrowDown')
    await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1)
    const secondKey = await tree.locator('[role="treeitem"][tabindex="0"]').getAttribute('data-key')
    expect(secondKey).not.toBe(firstKey)
  })

  test('every row carries aria-level, aria-setsize and aria-posinset', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const rows = page.locator('[role="treeitem"]')
    const n = await rows.count()
    expect(n).toBeGreaterThan(0)
    for (let i = 0; i < Math.min(n, 20); i++) {
      const row = rows.nth(i)
      await expect(row).toHaveAttribute('aria-level', /\d+/)
      await expect(row).toHaveAttribute('aria-setsize', /\d+/)
      await expect(row).toHaveAttribute('aria-posinset', /\d+/)
    }
  })
})

test.describe('sheets: focus trap and Escape (UX-ST-03)', () => {
  test('the settings sheet is a labelled modal dialog that traps Tab and closes on Escape', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await page.keyboard.press(',')
    const sheet = page.locator('[role="dialog"]').first()
    await expect(sheet).toBeVisible()
    await expect(sheet).toHaveAttribute('aria-modal', 'true')
    await expect(sheet).toHaveAttribute('aria-labelledby', /.+/)
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]')
        return Boolean(dialog && dialog.contains(document.activeElement))
      })
      expect(inside, `Tab press ${i + 1} left the modal sheet`).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
  })
})

test.describe('menus support arrow keys (WAI-ARIA menu pattern)', () => {
  test('the playback speed menu opens with focus inside, follows arrow keys and Escape returns focus', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const trigger = page.locator('.tl-speed')
    await trigger.click()
    const menu = page.getByRole('menu', { name: 'Playback speed' })
    await expect(menu).toBeVisible()
    const checked = menu.locator('[aria-checked="true"]')
    await expect(checked).toBeFocused()
    const before = await checked.textContent()
    await page.keyboard.press('ArrowDown')
    const after = await page.evaluate(() => document.activeElement?.textContent ?? null)
    expect(after).not.toBeNull()
    expect(after).not.toBe(before)
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})

test.describe('visually-hidden live regions (UX-AC-04)', () => {
  test('.sr-only elements are clipped from view but stay in the accessibility tree', async ({ page }) => {
    await openReady(page, SEL_URL)
    const rows = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('.sr-only')).map((el) => {
        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        return { display: cs.display, position: cs.position, width: r.width, height: r.height }
      }),
    )
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(r.display, 'display:none would also hide it from assistive tech').not.toBe('none')
      expect(r.position).toBe('absolute')
      expect(r.width).toBeLessThanOrEqual(1)
      expect(r.height).toBeLessThanOrEqual(1)
    }
  })
})

test.describe('reduced motion (UX-AC-07)', () => {
  test('prefers-reduced-motion cuts a CSS transition to near zero; normal mode keeps it', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const cardDuration = () =>
      page.evaluate(() => {
        const el = document.querySelector('[data-testid="stage-card"]')
        return el ? getComputedStyle(el).transitionDuration : null
      })
    const normal = await cardDuration()
    expect(normal).not.toBeNull()
    const maxNormalMs = Math.max(...(normal as string).split(',').map((d) => parseFloat(d))) * 1000
    expect(maxNormalMs, 'the stage card should declare a real transition in normal mode').toBeGreaterThan(50)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    const reduced = await cardDuration()
    expect(reduced).not.toBeNull()
    const maxReducedMs = Math.max(...(reduced as string).split(',').map((d) => parseFloat(d))) * 1000
    expect(maxReducedMs, `transition-duration should be cut to ~0.01ms, got ${reduced}`).toBeLessThanOrEqual(0.02)
  })
})

test.describe('color contrast of the text tokens (UX-AC-08, UX-US-02)', () => {
  // Force the theme param rather than trust the OS default: a headless browser's own
  // prefers-color-scheme default (often "light") would otherwise pick the theme for us.
  const cases: readonly { name: 'dark' | 'light'; url: string }[] = [
    { name: 'dark', url: '/?t=24&v=lat&theme=dark' },
    { name: 'light', url: '/?t=24&v=lat&theme=light' },
  ]
  for (const { name, url } of cases) {
    test(`${name} theme: body text is at least 4.5:1, the focus ring is at least 3:1`, async ({ page }) => {
      await openReady(page, url)
      await expect(page.locator('html')).toHaveAttribute('data-theme', name)
      const t = await readTokens(page)
      const bodyTextPairs: readonly [string, string, string][] = [
        ['text on bg', t.text, t.bg],
        ['text on surface', t.text, t.surface],
        ['text on surface-2', t.text, t.surface2],
        ['text-muted on bg', t.textMuted, t.bg],
        ['text-muted on surface', t.textMuted, t.surface],
        ['text-muted on surface-2', t.textMuted, t.surface2],
        ['accent (link text) on bg', t.accent, t.bg],
        ['accent (link text) on surface', t.accent, t.surface],
        ['accent (link text) on surface-2', t.accent, t.surface2],
      ]
      for (const [label, fg, bg] of bodyTextPairs) {
        expect(contrastRatio(fg, bg), `${label}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
      }
      const uiPairs: readonly [string, string, string][] = [
        ['focus ring on bg', t.focus, t.bg],
        ['focus ring on surface', t.focus, t.surface],
      ]
      for (const [label, fg, bg] of uiPairs) {
        expect(contrastRatio(fg, bg), `${label}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(3)
      }
    })
  }
})

// A small self-check on the contrast function itself, against the WCAG worked examples.
test('contrastRatio: black on white is 21:1, a colour against itself is 1:1', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
  expect(contrastRatio('#5FB8E8', '#5FB8E8')).toBeCloseTo(1, 5)
})
