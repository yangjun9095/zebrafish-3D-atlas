// 3D labels (AR-37, UX-VS-19): the placement pass of src/viewer/labelLayout.ts keeps the chips
// apart on screen, and the hint of UX-ST-04 appears when nothing is visible.
import { expect, test } from '@playwright/test'
import { openReady } from './helpers.ts'

interface Box { x: number; y: number; w: number; h: number }

const overlaps = (a: Box, b: Box): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

test.describe('labels and the empty hint', () => {
  test('eight labels at 120 hpf lateral never overlap and each stays inside the viewer', async ({ page }) => {
    await openReady(page, '/?t=120&v=lat&labels=1')
    await page.waitForTimeout(800)
    const boxes = await page.locator('.atlas-label:visible').evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect()
        return { x: r.left, y: r.top, w: r.width, h: r.height }
      }),
    )
    expect(boxes.length).toBeGreaterThanOrEqual(3)
    const viewer = await page.locator('.atlas-viewer').boundingBox()
    expect(viewer).not.toBeNull()
    for (let i = 0; i < boxes.length; i++) {
      expect(boxes[i].x).toBeGreaterThanOrEqual(viewer!.x - 1)
      expect(boxes[i].x + boxes[i].w).toBeLessThanOrEqual(viewer!.x + viewer!.width + 1)
      for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i], boxes[j]), `labels ${i} and ${j} overlap`).toBe(false)
    }
  })

  test('the None preset shows the nothing-visible hint and Show all removes it (UX-ST-04)', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat')
    await page.getByRole('button', { name: /^None$/ }).first().click()
    const hint = page.getByTestId('viewer-empty-hint')
    await expect(hint).toBeVisible()
    await expect(hint).toContainText('Nothing is visible at 24 hpf')
    await hint.getByRole('button', { name: 'Show all' }).click()
    await expect(hint).toHaveCount(0)
  })
})
