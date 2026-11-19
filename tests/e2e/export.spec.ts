// Export, share and URL sync smoke cases of WP-I3 (QP-35 steps 7, 9 and 10; AR-52, AR-55,
// AR-57, UI-34, UX-EX-08). Each test opens the app, drives the dialogs through their buttons
// and keys, and reads the downloaded PNG back.
import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { decodePng } from '../../scripts/lib/png.ts'
import { canvasLocator } from '../../scripts/screenshot.ts'
import { eventually, openReady, urlParam } from './helpers.ts'

function pngSize(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

async function openExport(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Export PNG' }).first().click()
  await expect(page.getByTestId('export-dialog')).toBeVisible()
}

async function download(page: Page): Promise<{ name: string; bytes: Uint8Array }> {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90_000 }), page.getByRole('button', { name: 'Download PNG' }).click()])
  const path = await dl.path()
  expect(path).not.toBeNull()
  return { name: dl.suggestedFilename(), bytes: new Uint8Array(readFileSync(path!)) }
}

test.describe('export', () => {
  test('step 9: a 2x viewport export measures twice the canvas CSS size and follows the file name pattern', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    const box = await canvasLocator(page).boundingBox()
    expect(box).not.toBeNull()
    await openExport(page)
    await expect(page.locator('[data-size="2x"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('export-size')).toContainText(`${Math.round(box!.width * 2)} × ${Math.round(box!.height * 2)}`)
    const { name, bytes } = await download(page)
    expect(name).toBe('zfatlas_24hpf_lateral_all_2x.png')
    expect(pngSize(bytes)).toEqual({ width: Math.round(box!.width * 2), height: Math.round(box!.height * 2) })
  })

  test('a transparent 1x export has alpha 0 outside the fish and opaque pixels inside', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await openExport(page)
    await page.locator('[data-size="1x"]').click()
    await page.getByRole('switch', { name: 'Transparent background' }).click()
    const { name, bytes } = await download(page)
    expect(name).toBe('zfatlas_24hpf_lateral_all_1x.png')
    const png = decodePng(bytes)
    expect(png.rgba[3]).toBe(0)
    let covered = 0
    let opaque = 0
    for (let i = 3; i < png.rgba.length; i += 4) {
      if (png.rgba[i] > 0) covered++
      if (png.rgba[i] === 255) opaque++
    }
    const n = png.width * png.height
    expect(covered / n).toBeGreaterThan(0.03)
    expect(covered / n).toBeLessThan(0.9)
    expect(opaque).toBeGreaterThan(0)
  })

  test('an opaque export paints the theme background, so a corner pixel equals --bg (AR-55)', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat&theme=dark')
    const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim())
    expect(bg).toMatch(/^#[0-9a-fA-F]{6}$/)
    const want = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16))
    await openExport(page)
    await page.locator('[data-size="1x"]').click()
    const { bytes } = await download(page)
    const png = decodePng(bytes)
    for (const [x, y] of [[0, 0], [png.width - 1, 0]]) {
      const i = (y * png.width + x) * 4
      expect(png.rgba[i + 3]).toBe(255)
      for (let c = 0; c < 3; c++) expect(Math.abs(png.rgba[i + c] - want[c])).toBeLessThanOrEqual(2)
    }
  })

  test('the 16:9 frame offers the 1920 by 1080 slide size', async ({ page }) => {
    await openReady(page, '/?t=48&v=lat')
    await openExport(page)
    await page.locator('[data-frame="16:9"]').click()
    await page.locator('[data-size="1920x1080"]').click()
    await expect(page.getByTestId('export-size')).toContainText('1920 × 1080')
    const { name, bytes } = await download(page)
    expect(name).toBe('zfatlas_48hpf_lateral_all_1920x1080.png')
    expect(pngSize(bytes)).toEqual({ width: 1920, height: 1080 })
  })

  test('the credit line is drawn by default and the switch removes it (release step 14)', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat&theme=dark')
    const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim())
    expect(bg).toMatch(/^#[0-9a-fA-F]{6}$/)
    const want = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16))
    // The credit sits at the top left, inside a 16 px margin, in a band the render leaves empty:
    // count the pixels there that differ from the background.
    const inkInCreditBand = (png: { width: number; rgba: Uint8Array }): number => {
      let n = 0
      for (let y = 12; y < 36; y++) {
        for (let x = 12; x < 320; x++) {
          const i = (y * png.width + x) * 4
          if (want.some((c, k) => Math.abs(png.rgba[i + k] - c) > 8)) n++
        }
      }
      return n
    }
    await openExport(page)
    await page.locator('[data-size="1x"]').click()
    await expect(page.getByRole('switch', { name: 'Include credit' })).toHaveAttribute('aria-checked', 'true')
    // The credit states the limit as well as the source, so a slide keeps its caveat (review C-08).
    await expect(page.getByText('Zebrafish 3D Atlas | Schematic model. Most sizes are estimates. | data: ZFIN CC BY 4.0')).toBeVisible()
    const withCredit = inkInCreditBand(decodePng((await download(page)).bytes))
    expect(withCredit).toBeGreaterThan(100)

    await page.getByRole('switch', { name: 'Include credit' }).click()
    await expect(page.getByRole('switch', { name: 'Include credit' })).toHaveAttribute('aria-checked', 'false')
    const without = inkInCreditBand(decodePng((await download(page)).bytes))
    expect(without).toBeLessThan(10)
  })

  test('Ctrl+Shift+S opens the export dialog and Escape closes it', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined)
    await page.keyboard.press('Control+Shift+S')
    await expect(page.getByTestId('export-dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('export-dialog')).toHaveCount(0)
  })
})

test.describe('share and URL sync', () => {
  test('Shift+C shows the full link and Copy link toasts (UI-34, UX-EX-08)', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined)
    await openReady(page, '/?t=48&v=dor&sel=0000114')
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined)
    await page.keyboard.press('Shift+C')
    const field = page.getByTestId('share-url')
    await expect(field).toBeVisible()
    const url = await field.inputValue()
    const params = new URL(url).searchParams
    expect(params.get('t')).toBe('48')
    expect(params.get('v')).toBe('dor')
    expect(params.get('sel')).toBe('0000114')
    expect(params.get('theme')).toMatch(/^(dark|light)$/)
    // The info card carries its own "Copy link" button (WP-I2); scope to the share sheet.
    const dialog = page.getByTestId('share-dialog')
    await expect(dialog.getByRole('button', { name: /Copy link to/ })).toBeVisible()
    await dialog.getByRole('button', { name: 'Copy link', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: /Link copied/ })).toBeVisible()
    const copied = await page.evaluate(() => navigator.clipboard.readText().catch(() => null))
    expect(copied).toBe(url)
  })

  test('step 7 and 10: key 2 writes v=dor; a drag writes cam; a preset clears it', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined)
    await page.keyboard.press('2')
    expect(await eventually(() => Promise.resolve(urlParam(page, 'v')), (v) => v === 'dor', 3000)).toBe('dor')
    // The preset tween disables the controls for 500 ms (AR-39); a drag during it is not an orbit.
    await page.waitForTimeout(800)
    const box = await canvasLocator(page).boundingBox()
    expect(box).not.toBeNull()
    const cx = box!.x + box!.width / 2
    const cy = box!.y + box!.height / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + 120, cy + 40, { steps: 8 })
    await page.mouse.up()
    const cam = await eventually(() => Promise.resolve(urlParam(page, 'cam')), (c) => c !== null, 4000)
    expect(cam).not.toBeNull()
    expect(cam!.split(',')).toHaveLength(6)
    await page.keyboard.press('1')
    expect(await eventually(() => Promise.resolve(urlParam(page, 'cam')), (c) => c === null, 4000)).toBeNull()
    expect(urlParam(page, 'v')).toBeNull()
  })
})
