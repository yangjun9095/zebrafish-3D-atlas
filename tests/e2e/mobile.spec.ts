// Phone viewport check at 390 by 844 CSS px (QP-36, UI-44, UX-US-01).

import { expect, test } from '@playwright/test'
import { canvasLocator, checkNonBlank } from '../../scripts/screenshot.ts'
import { INFO_CARD_SELECTOR, TRACK_SELECTOR, openReady, projectStructure, requireHook } from './helpers.ts'

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })

test.describe('mobile', () => {
  test('layout: no horizontal scroll and no vertical overflow', async ({ page }) => {
    await page.goto('/?t=24&v=lat')
    await page.waitForLoadState('networkidle')
    const m = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
      innerHeight: window.innerHeight,
    }))
    expect(m.scrollWidth).toBeLessThanOrEqual(390)
    expect(m.scrollHeight).toBeLessThanOrEqual(m.innerHeight)
  })

  test('controls: the Layers button and the compact timeline bar are visible', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const track = await requireHook(page.locator(TRACK_SELECTOR), 'no timeline track yet (WP-06)')
    await expect(track).toBeVisible()
    const layers = page.getByRole('button', { name: /layers/i })
    test.skip((await layers.count()) === 0, 'no Layers button yet (WP-06)')
    await expect(layers.first()).toBeVisible()
    await layers.first().tap()
    await page.waitForTimeout(400)
    await expect(track).toBeVisible()
  })

  test('canvas: not blank at 24 hpf', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const r = checkNonBlank(new Uint8Array(await canvasLocator(page).screenshot()))
    expect(r.ok, `canvas blank: stdDev ${r.stdDev.toFixed(1)}, changed ${(100 * r.changedFraction).toFixed(1)}%`).toBe(true)
  })

  test('tap: the eye opens the info card at its 96 px peek height', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const eye = await projectStructure(page, 'ZFA:0000107')
    test.skip(eye === null, 'no __atlasDebug.projectStructure hook yet (WP-05)')
    await page.touchscreen.tap(eye!.x, eye!.y)
    const card = await requireHook(page.locator(INFO_CARD_SELECTOR), 'no info card yet (WP-I2)')
    await expect(card).toBeVisible()
    const box = await card.boundingBox()
    expect(box).not.toBeNull()
    expect(Math.round(box!.height)).toBeGreaterThanOrEqual(96)
  })

  test('targets: every focusable control is at least 44 by 44 px', async ({ page }) => {
    await page.goto('/?t=24&v=lat')
    await page.waitForLoadState('networkidle')
    const small = await page.evaluate(() => {
      const sel = 'button, [role="button"], a[href], input, select, textarea, [role="slider"], [tabindex]:not([tabindex="-1"])'
      const out: string[] = []
      for (const el of document.querySelectorAll<HTMLElement>(sel)) {
        const r = el.getBoundingClientRect()
        const visible = r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
        if (visible && (r.width < 44 || r.height < 44)) {
          out.push(`${el.tagName.toLowerCase()}[${el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 20) ?? ''}] ${Math.round(r.width)}x${Math.round(r.height)}`)
        }
      }
      return out
    })
    expect(small, `controls under 44 px: ${small.join(', ')}`).toEqual([])
  })
})
