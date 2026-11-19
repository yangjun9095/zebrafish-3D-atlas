// Smoke test of the interactions (QP-35). Each step is one test and skips with a
// reason while its DOM hook does not exist yet; later packages own the hooks.

import { expect, test } from '@playwright/test'
import { canvasLocator, checkNonBlank } from '../../scripts/screenshot.ts'
import {
  INFO_CARD_SELECTOR, SEARCH_SELECTOR, TRACK_SELECTOR, eventually, expectText, openReady, projectStructure,
  readT, requireHook, urlParam,
} from './helpers.ts'

test.describe('smoke', () => {
  test('load: the shell renders and WebGL 2 is available', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#root')).not.toBeEmpty()
    const renderer = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2')
      if (!gl) return null
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'unknown'
    })
    expect(renderer).not.toBeNull()
  })

  test('ready attribute: the canvas wrapper reports the first final frame', async ({ page }) => {
    await page.goto('/?t=24&v=lat')
    const marker = page.locator('[data-atlas-ready]')
    await marker.first().waitFor({ state: 'attached', timeout: 15_000 }).catch(() => undefined)
    test.skip((await marker.count()) === 0, 'no [data-atlas-ready] element yet (WP-05)')
    await page.waitForLoadState('networkidle')
    const canvases = await page.locator('canvas').count()
    test.skip(canvases === 0, 'the viewer is not mounted yet: [data-atlas-ready] is a placeholder without a canvas (WP-05)')
    await expect(marker.first()).toHaveAttribute('data-atlas-ready', /^(true|1)$/, { timeout: 45_000 })
  })

  test('step 1: readout shows 24 hpf and Prim-5 and the canvas is not blank', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const png = new Uint8Array(await canvasLocator(page).screenshot())
    const r = checkNonBlank(png)
    expect(r.ok, `canvas blank: stdDev ${r.stdDev.toFixed(1)}, changed ${(100 * r.changedFraction).toFixed(1)}%`).toBe(true)
    const readout = page.getByText(/\b24\s*hpf\b/)
    test.skip((await readout.count()) === 0, 'no readout text yet (WP-06)')
    await expectText(page, /\b24\s*hpf\b/)
    await expectText(page, /prim-5/i)
  })

  test('time keys: ArrowRight, ArrowLeft, Home, End and Space move t', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await requireHook(page.locator(TRACK_SELECTOR), 'no timeline track with role=slider yet (WP-06)')
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined)
    const at = async (expected: number) => {
      const t = await eventually(() => readT(page), (v) => v !== null && Math.abs(v - expected) < 0.01)
      expect(t, `t should be ${expected}`).not.toBeNull()
      expect(Math.abs((t as number) - expected)).toBeLessThan(0.01)
    }
    await page.keyboard.press('ArrowRight')
    await at(30)
    await page.keyboard.press('ArrowLeft')
    await at(24)
    await page.keyboard.press('Home')
    await at(0)
    await page.keyboard.press('End')
    await at(2160)
    await page.goto('/?t=24&v=lat')
    await page.keyboard.press('Space')
    await page.waitForTimeout(500)
    await page.keyboard.press('Space')
    const t1 = await readT(page)
    expect(t1).not.toBeNull()
    expect(t1 as number).toBeGreaterThan(24)
    await page.waitForTimeout(400)
    const t2 = await readT(page)
    expect(t2).toBe(t1)
  })

  test('select by click: a click on the eye opens the info card and writes sel=', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const card = page.locator(INFO_CARD_SELECTOR)
    const canvas = canvasLocator(page)
    const eye = await projectStructure(page, 'ZFA:0000107')
    if (eye) await page.mouse.click(eye.x, eye.y)
    else {
      const box = await canvas.boundingBox()
      test.skip(box === null, 'no canvas yet (WP-05)')
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
    }
    await card.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined)
    test.skip((await card.count()) === 0, 'no info card yet (WP-I2); no __atlasDebug.projectStructure hook (WP-05)')
    const text = (await card.first().innerText()) ?? ''
    expect(text).toMatch(/ZFA:\d{7}/)
    if (eye) {
      expect(text).toContain('ZFA:0000107')
      const sel = await eventually(() => Promise.resolve(urlParam(page, 'sel')), (v) => v !== null, 2000)
      expect(sel).toContain('0000107')
    }
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    const sel = await eventually(() => Promise.resolve(urlParam(page, 'sel')), (v) => v === null, 2000)
    expect(sel).toBeNull()
  })

  test('search: slash focuses the field and Enter on "heart" selects ZFA:0000114', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await page.keyboard.press('/')
    const field = page.locator(SEARCH_SELECTOR)
    test.skip((await field.count()) === 0, 'no search field yet (WP-I1)')
    await expect(field.first()).toBeFocused()
    await field.first().fill('heart')
    await page.keyboard.press('Enter')
    const card = await requireHook(page.locator(INFO_CARD_SELECTOR), 'no info card yet (WP-I2)')
    await expect(card).toContainText(/heart/i)
    const sel = await eventually(() => Promise.resolve(urlParam(page, 'sel')), (v) => v !== null, 2000)
    expect(sel).toContain('0000114')
  })

  test('presets: key 2 selects the dorsal view and v=dor loads it', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const dorsal = page.getByRole('button', { name: /^dor(sal)?$/i })
    const hasButton = (await dorsal.count()) > 0
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined)
    await page.keyboard.press('2')
    const v = await eventually(() => Promise.resolve(urlParam(page, 'v')), (x) => x === 'dor', 2000)
    test.skip(!hasButton && v !== 'dor', 'no view preset control and no URL sync yet (WP-06, WP-I3)')
    if (hasButton) await expect(dorsal.first()).toHaveAttribute('aria-pressed', 'true')
    expect(v).toBe('dor')
    await openReady(page, '/?t=24&v=dor')
    if (hasButton) await expect(dorsal.first()).toHaveAttribute('aria-pressed', 'true')
  })

  test('timeline bar: the rows fit --time-h and focusing a transport control never scrolls the shell (5.2.1)', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const sizes = await page.evaluate(() => {
      const tl = document.querySelector('.tl')
      const host = document.querySelector('.app-time')
      return tl && host ? { tlScroll: tl.scrollHeight, hostClient: host.clientHeight } : null
    })
    expect(sizes).not.toBeNull()
    expect(sizes!.tlScroll).toBeLessThanOrEqual(sizes!.hostClient)
    await page.getByRole('button', { name: 'Snap to stage' }).first().focus()
    await page.getByRole('button', { name: /Playback speed/ }).first().focus()
    expect(await page.evaluate(() => document.querySelector('.app')?.scrollTop ?? -1)).toBe(0)
    const top = await page.locator('.app-top').boundingBox()
    expect(top?.y ?? -1).toBeGreaterThanOrEqual(0)
  })

  test('URL round trip: t, v and sel survive a load and stay in the address bar', async ({ page }) => {
    await openReady(page, '/?t=48&v=dor&sel=0000114&theme=dark')
    await page.waitForTimeout(600)
    const t = urlParam(page, 't')
    test.skip(t === null, 'URL sync does not write the address bar yet (WP-I3)')
    expect(Number(t)).toBeCloseTo(48, 1)
    expect(urlParam(page, 'v')).toBe('dor')
    expect(urlParam(page, 'sel')).toBe('0000114')
    expect(urlParam(page, 'theme')).toBe('dark')
    const shown = await readT(page)
    expect(shown).not.toBeNull()
    expect(Math.abs((shown as number) - 48)).toBeLessThan(0.01)
  })

  test('theme: ?theme=light renders light under a dark colour scheme', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1600, height: 900 } })
    const page = await context.newPage()
    try {
      await page.goto('/?t=24&theme=light')
      const themed = page.locator('[data-theme]')
      test.skip((await themed.count()) === 0, 'no data-theme attribute yet (WP-I4)')
      await expect(themed.first()).toHaveAttribute('data-theme', 'light')
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
      const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bg)
      expect(m).not.toBeNull()
      const lum = (0.2126 * Number(m![1]) + 0.7152 * Number(m![2]) + 0.0722 * Number(m![3])) / 255
      expect(lum).toBeGreaterThan(0.5)
    } finally {
      await context.close()
    }
  })
})
