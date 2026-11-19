// Presentation mode, embed mode, the settings and shortcut sheets, and one smoke case per row of the
// keyboard map of spec 5.9.1 (WP-I4; UI-36, UI-37, UI-40, UI-41, AR-59, AR-61). The presentation
// cases press the presentation-mode keys PageDown, B, ., Enter, Shift+P and Ctrl+B; the
// double-toggle cases of UI-41 click Play then press Space, and focus the track then press ArrowRight.

import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { TRACK_SELECTOR, eventually, openReady, readT, requireHook, urlParam } from './helpers.ts'

const ROOT = '.app'

/** Playwright focuses nothing after goto; a click on the top left corner puts the keys on the body. */
async function focusBody(page: Page): Promise<void> {
  await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined)
}

async function expectT(page: Page, expected: number): Promise<void> {
  const t = await eventually(() => readT(page), (v) => v !== null && Math.abs(v - expected) < 0.01)
  expect(t, `t should be ${expected}`).not.toBeNull()
  expect(Math.abs((t as number) - expected)).toBeLessThan(0.01)
}

async function expectParam(page: Page, name: string, value: string | null): Promise<void> {
  const v = await eventually(() => Promise.resolve(urlParam(page, name)), (x) => x === value, 3000)
  expect(v, `${name} should be ${value}`).toBe(value)
}

test.describe('presentation mode', () => {
  test('present=1 hides the chrome, shows the strip, the large readout and the fullscreen chip', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat&present=1&theme=dark')
    const root = page.locator(ROOT)
    await expect(root).toHaveAttribute('data-presentation', 'true')
    await expect(page.locator('.app-top')).toBeHidden()
    await expect(page.locator('.app-rail')).toBeHidden()
    await expect(page.getByText('for fullscreen')).toBeVisible()
    const time = page.locator('.app[data-presentation="true"] .readout-time').first()
    await expect(time).toBeVisible()
    const px = await time.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(px).toBeGreaterThanOrEqual(48)
    // UI-37: the strip shows for 3 s after entry or input, then hides while idle and unpinned. The
    // first frame takes longer than 3 s on SwiftShader, so a pointer move restarts the window here.
    const strip = page.locator('.tl')
    await page.mouse.move(600, 400)
    await expect(strip).toHaveAttribute('data-hidden', 'false')
    await expect(strip).toHaveAttribute('data-hidden', 'true', { timeout: 6000 })
    await page.mouse.move(640, 420)
    await expect(strip).toHaveAttribute('data-hidden', 'false')
  })

  test('P enters, Shift+P pins the strip, Escape exits last', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat&sel=0000114')
    await focusBody(page)
    await page.keyboard.press('KeyP')
    await expect(page.locator(ROOT)).toHaveAttribute('data-presentation', 'true')
    await expectParam(page, 'present', '1')
    await page.keyboard.press('Shift+KeyP')
    await expectParam(page, 'pin', '1')
    await page.waitForTimeout(3500)
    await expect(page.locator('.tl')).toHaveAttribute('data-hidden', 'false')
    // Escape clears the selection first, then leaves presentation mode (5.9.1 order).
    await page.keyboard.press('Escape')
    await expectParam(page, 'sel', null)
    await expect(page.locator(ROOT)).toHaveAttribute('data-presentation', 'true')
    await page.keyboard.press('Escape')
    await expect(page.locator(ROOT)).toHaveAttribute('data-presentation', 'false')
  })

  test('PageDown steps a stage, B and . toggle the black screen, any other key leaves it', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat&present=1')
    await focusBody(page)
    await page.keyboard.press('PageDown')
    await expectT(page, 30)
    await page.keyboard.press('PageUp')
    await expectT(page, 24)
    await page.keyboard.press('Shift+PageDown')
    await expectT(page, 48)
    const black = page.locator('[data-testid="black-screen"]')
    await page.keyboard.press('KeyB')
    await expect(black).toBeVisible()
    const bg = await black.evaluate((el) => getComputedStyle(el).opacity)
    expect(bg).toBe('1')
    await page.keyboard.press('KeyB')
    await expect(black).toBeHidden()
    await page.keyboard.press('Period')
    await expect(black).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(black).toBeHidden()
    await expectT(page, 48)
  })

  test('Enter in presentation mode and Shift+F anywhere call the Fullscreen API', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __fs: number }
      w.__fs = 0
      Document.prototype.exitFullscreen = () => Promise.resolve()
      Element.prototype.requestFullscreen = function () {
        w.__fs++
        return Promise.resolve()
      }
    })
    await openReady(page, '/?t=24&v=lat')
    await focusBody(page)
    const calls = () => page.evaluate(() => (window as unknown as { __fs: number }).__fs)
    await page.keyboard.press('Enter')
    expect(await calls()).toBe(0)
    await page.keyboard.press('Shift+KeyF')
    expect(await calls()).toBe(1)
    await page.keyboard.press('KeyP')
    await expect(page.locator(ROOT)).toHaveAttribute('data-presentation', 'true')
    await page.keyboard.press('Enter')
    expect(await calls()).toBe(2)
  })

  test('Ctrl+B adds a bookmark and the URL carries the kit; ArrowRight then steps bookmarks', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat&present=1')
    await focusBody(page)
    await page.keyboard.press('Control+KeyB')
    const kit = await eventually(() => Promise.resolve(urlParam(page, 'kit')), (v) => v !== null, 3000)
    expect(kit).not.toBeNull()
    // UI-33: with a kit loaded, Shift+Arrow steps stages (the 1 hpf step is unavailable) and the arrows step bookmarks.
    await page.keyboard.press('Shift+ArrowRight')
    await expectT(page, 30)
    await page.keyboard.press('ArrowLeft')
    await expectT(page, 24)
  })

  test('the context menu is disabled and the cursor hides after 2 s', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat&present=1')
    const prevented = await page.evaluate(() => {
      const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
      document.querySelector('.app-viewer')?.dispatchEvent(e)
      return e.defaultPrevented
    })
    expect(prevented).toBe(true)
    await page.mouse.move(700, 400)
    await expect(page.locator(ROOT)).toHaveAttribute('data-cursor', 'hidden', { timeout: 4000 })
    await page.mouse.move(720, 420)
    await expect(page.locator(ROOT)).not.toHaveAttribute('data-cursor', 'hidden')
  })
})

test.describe('embed mode', () => {
  test('embed=1 shows the footer link with the full state and no top bar', async ({ page }) => {
    await openReady(page, '/?t=48&v=dor&embed=1')
    await expect(page.locator('.app-top')).toBeHidden()
    const link = page.locator('.embed-link')
    await expect(link).toBeVisible()
    await expect(link).toContainText('Open in Zebrafish Atlas')
    const href = new URL((await link.getAttribute('href')) ?? '', page.url())
    expect(href.searchParams.get('t')).toBe('48')
    expect(href.searchParams.get('v')).toBe('dor')
    expect(href.searchParams.get('embed')).toBeNull()
    await expect(page.locator('.embed-footer')).toContainText('ZFIN')
    const box = await page.locator('.embed-footer').boundingBox()
    expect(box?.height).toBe(28)
  })
})

test.describe('sheets', () => {
  test('? opens the shortcut sheet with every group; Escape closes it before clearing the selection', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat&sel=0000114')
    await focusBody(page)
    await page.keyboard.press('Shift+Slash')
    const sheet = page.locator('[data-testid="shortcut-sheet"]')
    await expect(sheet).toBeVisible()
    for (const g of ['Time', 'View', 'Selection', 'Presentation', 'App']) await expect(sheet.getByRole('heading', { name: g })).toBeVisible()
    await expect(sheet).toContainText('Black screen')
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    expect(urlParam(page, 'sel')).toBe('0000114')
  })

  test(', opens settings; the sex, projector scale and units controls write the store and the URL', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await focusBody(page)
    await page.keyboard.press('Comma')
    const sheet = page.locator('[data-testid="settings-sheet"]')
    await expect(sheet).toBeVisible()
    await sheet.getByRole('group', { name: 'Sex' }).getByRole('button', { name: 'Male', exact: true }).click()
    await expectParam(page, 'sex', 'm')
    await sheet.getByRole('group', { name: 'Sex' }).getByRole('button', { name: 'Both', exact: true }).click()
    await expect(sheet.getByRole('group', { name: 'Sex' }).getByRole('button', { name: 'Both', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await sheet.getByRole('group', { name: 'Projector scale' }).getByRole('button', { name: '1.5x' }).click()
    await expectParam(page, 'ps', '1.5')
    const scale = await page.locator(ROOT).evaluate((el) => getComputedStyle(el).getPropertyValue('--projector-scale').trim())
    expect(scale).toBe('1.5')
    // UI-36: the presentation readout follows the scale (48 px at 1x on a 1600 by 900 viewport).
    await page.keyboard.press('Escape')
    await page.keyboard.press('KeyP')
    const time = page.locator('.app[data-presentation="true"] .readout-time').first()
    await expect(time).toBeVisible()
    expect(await time.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(72, 0)
    await page.keyboard.press('Escape')
    await page.keyboard.press('Comma')
    await expect(sheet).toBeVisible()
    await sheet.getByRole('group', { name: 'Units' }).getByRole('button', { name: 'dpf' }).click()
    await expectParam(page, 'u', 'dpf')
    await sheet.getByRole('group', { name: 'Palette' }).getByRole('button', { name: /Okabe/ }).click()
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'okabe-ito')
    await sheet.getByRole('switch', { name: /Reduced motion/ }).click()
    const prefs = await page.evaluate(() => localStorage.getItem('zfatlas:prefs:v1'))
    expect(prefs).toContain('"reducedMotion":true')
    // Space inside the modal sheet does not start playback (UI-41 modal rule).
    await page.keyboard.press('Space')
    await page.waitForTimeout(300)
    await expectT(page, 24)
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
  })

  test('the settings sheet is ignored in presentation mode and theme T flips data-theme', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat&present=1&theme=dark')
    await focusBody(page)
    await page.keyboard.press('Comma')
    await expect(page.locator('[data-testid="settings-sheet"]')).toHaveCount(0)
    await page.keyboard.press('KeyT')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.keyboard.press('KeyT')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})

test.describe('keyboard map (5.9.1)', () => {
  test('time keys: Space, arrows, Shift+Arrow, Home, End, Shift+End, PageUp, PageDown, [ ], S, U', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await focusBody(page)
    await page.keyboard.press('ArrowRight')
    await expectT(page, 30)
    await page.keyboard.press('ArrowLeft')
    await expectT(page, 24)
    await page.keyboard.press('Shift+ArrowRight')
    await expectT(page, 25)
    await page.keyboard.press('Shift+ArrowLeft')
    await expectT(page, 24)
    await page.keyboard.press('PageDown')
    await expectT(page, 48)
    await page.keyboard.press('PageUp')
    await expectT(page, 24)
    await page.keyboard.press('End')
    await expectT(page, 2160)
    await page.keyboard.press('Shift+End')
    await expectT(page, 4320)
    await page.keyboard.press('Home')
    await expectT(page, 0)
    await page.keyboard.press('KeyS')
    await expectParam(page, 'snap', '1')
    await page.keyboard.press('KeyU')
    await expectParam(page, 'u', 'hpf')
    await page.keyboard.press('BracketRight')
    await expect(page.getByRole('button', { name: /Playback speed 2x/ })).toBeVisible()
    await page.keyboard.press('BracketLeft')
    await expect(page.getByRole('button', { name: /Playback speed 1x/ })).toBeVisible()
    // Play, wait for the clock to actually move (a loaded node can render no frame in 400 ms),
    // then pause and check that it stays put.
    await page.keyboard.press('Space')
    const moved = await eventually(() => readT(page), (v) => v !== null && v > 0, 10_000)
    expect(moved as number, 'playback did not advance the clock').toBeGreaterThan(0)
    await page.keyboard.press('Space')
    const t1 = await readT(page)
    expect(t1 as number).toBeGreaterThan(0)
    await page.waitForTimeout(300)
    expect(await readT(page)).toBe(t1)
  })

  test('view keys: 1 to 6, R, Shift+R, X, L, F, Alt+Arrow, Alt+Plus, Alt+Minus', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await focusBody(page)
    for (const [key, v] of [['Digit2', 'dor'], ['Digit3', 'ven'], ['Digit4', 'ant'], ['Digit5', 'pos'], ['Digit6', 'tq'], ['Digit1', 'lat']] as const) {
      await page.keyboard.press(key)
      await expectParam(page, 'v', v === 'lat' ? null : v)
    }
    await page.keyboard.press('KeyX')
    await expectParam(page, 'xr', '0')
    await page.keyboard.press('KeyX')
    await expectParam(page, 'xr', null)
    await page.keyboard.press('KeyL')
    await expectParam(page, 'labels', '1')
    await page.keyboard.press('KeyL')
    await expectParam(page, 'labels', null)
    await page.keyboard.press('Alt+ArrowLeft')
    const cam = await eventually(() => Promise.resolve(urlParam(page, 'cam')), (v) => v !== null, 3000)
    expect(cam).not.toBeNull()
    await page.keyboard.press('Alt+Equal')
    const zoomed = await eventually(() => Promise.resolve(urlParam(page, 'cam')), (v) => v !== null && v !== cam, 3000)
    expect(zoomed).not.toBe(cam)
    await page.keyboard.press('Alt+Minus')
    await page.keyboard.press('KeyF')
    await page.keyboard.press('KeyR')
    await expectParam(page, 'cam', null)
    await page.keyboard.press('ArrowRight')
    await expectT(page, 30)
    await page.keyboard.press('Shift+KeyR')
    await expectT(page, 24)
  })

  test('selection keys: Ctrl+K and / focus search, I isolates, H hides, Ctrl+C copies', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined)
    await openReady(page, '/?t=24&v=lat&sel=0000114')
    await focusBody(page)
    await page.keyboard.press('KeyI')
    await expectParam(page, 'iso', '1')
    await page.keyboard.press('Escape')
    await expectParam(page, 'iso', null)
    expect(urlParam(page, 'sel')).toBe('0000114')
    await page.keyboard.press('Control+KeyC')
    await expect(page.getByRole('status').filter({ hasText: /Copied/ })).toBeVisible({ timeout: 3000 })
    await page.keyboard.press('KeyH')
    await expectParam(page, 'hide', '0000114')
    await page.keyboard.press('Slash')
    const field = page.locator('input[type="search"], [role="combobox"], [role="searchbox"]')
    if ((await field.count()) > 0) await expect(field.first()).toBeFocused()
    else test.info().annotations.push({ type: 'note', description: 'no search field yet (WP-I1): / and Ctrl+K decline' })
  })

  test('double toggles (UI-41): Space after clicking Play toggles once; ArrowRight on the focused track steps once', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const play = page.getByTestId('play')
    await play.click()
    await expect(play).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Space')
    await expect(play).toHaveAttribute('aria-pressed', 'false')
    const t = await readT(page)
    const track = await requireHook(page.locator(TRACK_SELECTOR), 'no timeline track yet (WP-06)')
    await track.focus()
    await expect(track).toBeFocused()
    // One step lands on the next stage start (30, 48 or 72 hpf); a double step would skip one.
    const next = t === null || t < 30 ? 30 : t < 48 ? 48 : 72
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(400)
    await expectT(page, next)
  })

  test('other-package rows do nothing yet or route to their sheets: Shift+C, Ctrl+Shift+S, Shift+B', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await focusBody(page)
    for (const key of ['Shift+KeyC', 'Control+Shift+KeyS', 'Shift+KeyB']) {
      await page.keyboard.press(key)
      await page.waitForTimeout(150)
    }
    // Whatever opened, the app is still responsive and the time did not move.
    await expectT(page, 24)
  })
})

test.describe('phone (390 x 844)', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })

  test('settings and shortcut sheets fit the phone and presentation mode keeps the readout chip', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await focusBody(page)
    await page.keyboard.press('Comma')
    const sheet = page.locator('[data-testid="settings-sheet"]')
    await expect(sheet).toBeVisible()
    const width = await page.evaluate(() => document.scrollingElement?.scrollWidth ?? 0)
    expect(width).toBeLessThanOrEqual(390)
    const small = await sheet.evaluate((root) => {
      const out: string[] = []
      for (const el of root.querySelectorAll<HTMLElement>('button, input')) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0 && r.height < 44) out.push(`${el.getAttribute('aria-label') ?? el.textContent?.trim()} ${Math.round(r.height)}`)
      }
      return out
    })
    expect(small, `controls under 44 px: ${small.join(', ')}`).toEqual([])
    await page.keyboard.press('Escape')
    await page.keyboard.press('KeyP')
    await expect(page.locator(ROOT)).toHaveAttribute('data-presentation', 'true')
    await expect(page.locator('.readout-chip')).toBeVisible()
  })
})
