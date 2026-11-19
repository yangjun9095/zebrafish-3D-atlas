// Info card smoke cases (spec 5.4; QP-35 step 8): the absent state and the UI-20 jump, the
// fields at 24 hpf, the ended state (UI-22), a group node (UI-23), a multi-selection (UI-21),
// keyboard close, the phone peek strip and sheet, and the presentation card.

import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { TRACK_SELECTOR, eventually, openReady, readT, urlParam } from './helpers.ts'

const CARD = '[data-testid="info-card"]'
const HEART = 'ZFA:0000114'

async function expectT(page: Page, hpf: number): Promise<void> {
  const t = await eventually(() => readT(page), (v) => v !== null && Math.abs(v - hpf) < 0.01, 4000)
  expect(t, `t should reach ${hpf}`).not.toBeNull()
  expect(Math.abs((t as number) - hpf)).toBeLessThan(0.01)
}

/** Opacity of a structure's material from the viewer runtime, or null without the hook. */
async function meshOpacity(page: Page, id: string): Promise<number | null> {
  return page.evaluate((id) => {
    const dbg = (window as unknown as { __atlasDebug?: { runtime?: { handles?: Map<string, { material?: { opacity: number } }> } } }).__atlasDebug
    const h = dbg?.runtime?.handles?.get(id)
    return h?.material ? h.material.opacity : null
  }, id)
}

test.describe('info card', () => {
  test('absent state: the heart at 10 hpf and the jump to the first fully visible time (UX-IN-23, UI-20)', async ({ page }) => {
    await openReady(page, '/?t=10&sel=0000114')
    const card = page.locator(CARD).first()
    await expect(card).toBeVisible()
    await expect(card.locator('.info-title')).toHaveText('heart')
    await expect(card).toContainText(HEART)
    const badge = card.locator('[data-testid="info-presence"]')
    await expect(badge).toHaveAttribute('data-kind', 'before')
    await expect(badge).toContainText('Not present at 10 hpf')
    const jump = card.locator('[data-testid="info-jump"]')
    await expect(jump).toContainText(/^Jump to 20-25 somites \(19\.\d hpf\)$/)
    await jump.click()
    await expectT(page, 19.15)
    await expect(badge).toHaveAttribute('data-kind', 'present')
    await expect(badge).toHaveText('Present')
    const opacity = await eventually(() => meshOpacity(page, HEART), (o) => o !== null && o >= 0.999, 3000)
    expect(opacity, 'no __atlasDebug.runtime hook').not.toBeNull()
    expect(opacity as number).toBeGreaterThanOrEqual(0.999)
    // The button stays enabled while present and moves t back to the first appearance. The key
    // dispatcher skips a focused button (UI-41), so focus leaves the card before ArrowRight.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.keyboard.press('ArrowRight')
    await expectT(page, 22)
    await jump.click()
    await expectT(page, 19.15)
  })

  test('fields at 24 hpf: alias term, ZFIN link, windows, definition, events, sources, attribution', async ({ page }) => {
    await openReady(page, '/?t=24&sel=0000114')
    const card = page.locator(CARD).first()
    await expect(card.locator('.info-chip[data-system="cardiovascular"]')).toContainText('Cardiovascular')
    await expect(card.locator('[data-testid="info-alias"]')).toContainText('heart tube (ZFA:0000360), 24 to 42 hpf')
    await expect(card.locator('[data-testid="info-zfin-link"]')).toHaveAttribute('href', 'https://zfin.org/ZFA:0000360')
    await expect(card.locator('[data-testid="info-zfin-window"]')).toHaveText('ZFIN: High-pec (42 hpf) to Adult')
    await expect(card.locator('[data-testid="info-model-window"]')).toContainText('Model: 19 to 4320 hpf')
    await expect(card.locator('[data-testid="info-definition"]')).toContainText('Blood pumping organ')
    const events = card.locator('[data-testid="info-events"] li')
    expect(await events.count()).toBeGreaterThan(5)
    await expect(card.locator('[data-testid="info-events"] button[data-active="true"]')).toContainText('26 hpf')
    await card.locator('[data-testid="info-events"] button', { hasText: 'Heart looping begins' }).click()
    await expectT(page, 30)
    await expect(card.locator('[data-testid="info-events"] button[data-active="true"]')).toContainText('36 hpf')
    const sources = card.locator('[data-testid="info-sources"]')
    await expect(sources.locator('summary')).toContainText(/^Sources \(\d+\)$/)
    await sources.locator('summary').click()
    expect(await sources.locator('a[href^="https://"]').count()).toBeGreaterThan(0)
    // The literature and the modelling notes are two labelled lists, not one column (review M9).
    await expect(sources).toContainText('Literature (')
    await expect(sources.locator('[data-testid="info-sources-literature"] a[href^="https://"]').first()).toBeVisible()
    await expect(sources.locator('[data-testid="info-sources-notes"]')).toBeVisible()
    // The correction form carries the ZFA id and the hour (review C-18).
    const correction = card.locator('[data-testid="info-correction"]')
    await expect(correction).toHaveAttribute('href', /issues\/new\?template=anatomy-correction\.yml&title=/)
    await expect(correction).toHaveAttribute('href', /ZFA%3A0000114.*hpf/)
    const attribution = card.locator('[data-testid="info-attribution"]')
    await expect(attribution).toContainText('ZFIN')
    await expect(attribution).toContainText('CC BY 4.0')
    await expect(attribution).toContainText('CC BY 3.0')
    await expect(attribution).toContainText('Geometry is schematic')
    await expect(attribution.locator('a[href="https://creativecommons.org/licenses/by/4.0/"]')).toHaveCount(1)
    await expect(attribution.locator('a[href="https://creativecommons.org/licenses/by/3.0/"]')).toHaveCount(1)
    await expect(attribution.locator('a[href$="ATTRIBUTION.md"]')).toHaveCount(1)
  })

  test('alias before the model window: the heart at 15 hpf names the heart primordium (UI-24)', async ({ page }) => {
    await openReady(page, '/?t=15&sel=0000114')
    const card = page.locator(CARD).first()
    const badge = card.locator('[data-testid="info-presence"]')
    await expect(badge).toHaveAttribute('data-kind', 'aliasBefore')
    await expect(badge).toContainText('ZFIN describes the heart primordium at 15 hpf')
    await expect(card.locator('[data-testid="info-zfin-link"]')).toHaveAttribute('href', 'https://zfin.org/ZFA:0000028')
  })

  test('ended state: the yolk at 200 hpf reads "Modelled until" and jumps to the last stage (UI-22)', async ({ page }) => {
    await openReady(page, '/?t=200&sel=0000084&u=hpf')
    const card = page.locator(CARD).first()
    const badge = card.locator('[data-testid="info-presence"]')
    await expect(badge).toHaveAttribute('data-kind', 'after')
    await expect(badge).toContainText('Modelled until 168 hpf (Days 7-13)')
    const jump = card.locator('[data-testid="info-jump"]')
    await expect(jump).toHaveText('Jump to Day 6 (144 hpf)')
    await jump.click()
    await expectT(page, 144)
    await expect(badge).toHaveAttribute('data-kind', 'present')
  })

  test('group node: the brain shows the UI-23 note, its parts, and no jump button', async ({ page }) => {
    await openReady(page, '/?t=24&sel=0000008')
    const card = page.locator(CARD).first()
    await expect(card.locator('.info-title')).toHaveText('brain')
    await expect(card).toContainText('No 3D geometry for this term. Its parts are listed below.')
    await expect(card.locator('[data-testid="info-parts"]')).toContainText('forebrain')
    await expect(card.locator('[data-testid="info-jump"]')).toHaveCount(0)
    await card.locator('[data-testid="info-parts"] button', { hasText: 'forebrain' }).click()
    await expect(card.locator('.info-title')).toHaveText('forebrain')
    const sel = await eventually(() => Promise.resolve(urlParam(page, 'sel')), (v) => v === '0000109', 2000)
    expect(sel).toBe('0000109')
  })

  test('multi-selection: two rows, remove one, and the URL sel follows (UI-21, AR-19)', async ({ page }) => {
    await openReady(page, '/?t=24&sel=0000114,0000107')
    const card = page.locator(CARD).first()
    await expect(card).toContainText('2 selected')
    const members = card.locator('[data-testid="info-members"] li')
    await expect(members).toHaveCount(2)
    await expect(members.nth(0)).toContainText('heart')
    await expect(members.nth(1)).toContainText('eye')
    await card.getByRole('button', { name: 'Remove eye' }).click()
    await expect(card.locator('.info-title')).toHaveText('heart')
    const sel = await eventually(() => Promise.resolve(urlParam(page, 'sel')), (v) => v === '0000114', 2000)
    expect(sel).toBe('0000114')
  })

  test('keyboard: Escape inside the card exits isolate, then clears the selection', async ({ page }) => {
    await openReady(page, '/?t=24&sel=0000114')
    const card = page.locator(CARD).first()
    const isolate = card.getByRole('button', { name: 'Isolate' })
    await isolate.click()
    await expect(isolate).toHaveAttribute('aria-pressed', 'true')
    await isolate.focus()
    await page.keyboard.press('Escape')
    await expect(isolate).toHaveAttribute('aria-pressed', 'false')
    await expect(card.locator('.info-title')).toHaveText('heart')
    await card.locator('[data-testid="info-jump"]').focus()
    await page.keyboard.press('Escape')
    const sel = await eventually(() => Promise.resolve(urlParam(page, 'sel')), (v) => v === null, 2000)
    expect(sel).toBeNull()
    // Desktop: the docked card falls back to the stage card (UX-LY-08).
    const stage = page.locator('[data-testid="stage-info"]')
    await expect(stage).toBeVisible()
    await expect(stage.locator('[data-testid="stage-info-title"]')).toHaveText('Prim-5')
    await expect(stage).toContainText('ZFS:0000029')
  })

  test('the adult stage card states what is drawn and its milestones instead of an empty list (review C-14)', async ({ page }) => {
    await openReady(page, '/?t=4320')
    const stage = page.locator('[data-testid="stage-info"]')
    await expect(stage.locator('[data-testid="stage-info-title"]')).toHaveText('Adult')
    await expect(stage).toContainText('No modelled structure starts in this stage.')
    const present = stage.locator('[data-testid="stage-present"]')
    await expect(present).toContainText(/\d+ of \d+ structures, in \d+ systems\./)
    await expect(stage.locator('[data-testid="stage-milestones"] li').first()).toBeVisible()
    // The length carries its measure and the standard length beside it (review B09).
    await expect(stage).toContainText('30.0 mm total length; 25.0 mm standard length')
  })

  test('phone: a 96 px peek strip, the sheet opens on expand and the timeline stays visible', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
    const page = await context.newPage()
    try {
      await openReady(page, '/?t=24&sel=0000114')
      const peek = page.locator(CARD).first()
      await expect(peek).toBeVisible()
      const box = await peek.boundingBox()
      expect(box).not.toBeNull()
      expect(Math.round(box!.height)).toBeGreaterThanOrEqual(96)
      await expect(peek).toContainText('heart')
      await expect(peek).toContainText(HEART)
      await peek.locator('[data-testid="info-expand"]').tap()
      const sheet = page.locator('[data-testid="info-sheet"]')
      await expect(sheet).toBeVisible()
      await expect(sheet.locator('[data-testid="info-definition"]')).toContainText('Blood pumping organ')
      await expect(page.locator(TRACK_SELECTOR).first()).toBeVisible()
      // The dialog panel (not its scrolling body) stops at the top of the timeline bar (spec 5.1.4).
      const panelBox = await page.getByRole('dialog').boundingBox()
      const trackBox = await page.locator(TRACK_SELECTOR).first().boundingBox()
      expect(panelBox).not.toBeNull()
      expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(trackBox!.y + 1)
      await page.getByRole('dialog').getByRole('button', { name: 'Close' }).tap()
      await expect(sheet).toHaveCount(0)
      await expect(peek).toBeVisible()
    } finally {
      await context.close()
    }
  })

  test('presentation: the floating card shows the name and collapses the definition (AR-59)', async ({ page }) => {
    await openReady(page, '/?t=24&sel=0000114&present=1')
    const card = page.locator(CARD).first()
    await expect(card).toBeVisible()
    // The floating card sits inside the viewport at the top right (AR-59), not below the grid.
    const box = await card.boundingBox()
    const viewport = page.viewportSize()!
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y).toBeLessThan(64)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
    await expect(card.locator('.info-title')).toHaveText('heart')
    const definition = card.locator('[data-testid="info-definition"]')
    await expect(definition).toBeHidden()
    await card.locator('summary', { hasText: 'Definition' }).click()
    await expect(definition).toBeVisible()
  })
})
