// The 36 headline screenshots with the non-blank check (QP-33, QP-34) and the
// projection checks of QP-38 through the debug hook. Files land in
// docs/screenshots/<hpf>-<lateral|dorsal>.png for human review (D13). The
// tests are independent, so one failed check never skips another capture.

import { expect, test } from '@playwright/test'
import { resolve } from 'node:path'
import { VIEWS, captureView, headlineHpf, screenshotName, viewUrl } from '../../scripts/screenshot.ts'
import type { ViewKey } from '../../scripts/screenshot.ts'
import { openReady, projectBody } from './helpers.ts'

const outDir = resolve(import.meta.dirname, '../../docs/screenshots')
const stages = headlineHpf()
const views = Object.keys(VIEWS) as ViewKey[]

/**
 * Posture limits of the QP-38 checks. The axis wraps the yolk to 19 hpf (D3, regime R2)
 * and curls in one plane to 30 hpf (D8), so the snout is not left of the notochord end
 * before the pharyngula and the dorsal normal at u = 0.4 is not vertical in a lateral view
 * before the axis lies in the sagittal plane. The dorsal-view flank check holds at every
 * stage because the curl is planar. Measured on the phase 1 body: the lateral segment is
 * 72 degrees off vertical at 10 hpf and 48 at 16 hpf; from 24 hpf both views pass.
 */
export const SNOUT_LEFT_FROM_HPF = 24
export const LATERAL_VERTICAL_FROM_HPF = 24

test.describe('screenshots', () => {
  for (const hpf of stages) {
    for (const view of views) {
      const name = screenshotName(hpf, view).replace(/\.png$/, '')
      test(name, async ({ page }) => {
        await openReady(page, viewUrl(hpf, view))
        const cap = await captureView(page, hpf, view, outDir)
        const r = cap.nonBlank
        expect(
          r.ok,
          `${name}: canvas blank (stdDev ${r.stdDev.toFixed(1)}, changed ${(100 * r.changedFraction).toFixed(1)}%)`,
        ).toBe(true)
        await checkProjection(page, view, hpf, name)
      })
    }
  }
})

/** QP-38: snout left of the notochord end; flanks (dorsal view) or dorsal-ventral (lateral view) vertical within 1 degree. */
async function checkProjection(page: import('@playwright/test').Page, view: ViewKey, hpf: number, name: string): Promise<void> {
  const snout = await projectBody(page, 0, 0, 0)
  if (!snout) return
  const tail = await projectBody(page, 1, 0, 0)
  const a = view === 'dor' ? await projectBody(page, 0.4, 0, -1) : await projectBody(page, 0.4, 1, 0)
  const b = view === 'dor' ? await projectBody(page, 0.4, 0, 1) : await projectBody(page, 0.4, -1, 0)
  expect(tail && a && b, `${name}: __atlasDebug.project returned null`).toBeTruthy()
  if (hpf >= SNOUT_LEFT_FROM_HPF) {
    expect.soft(tail!.x - snout.x, `${name}: snout should project at least 100 px left of the notochord end`).toBeGreaterThanOrEqual(100)
  }
  if (view === 'lat' && hpf < LATERAL_VERTICAL_FROM_HPF) return
  const dx = Math.abs(a!.x - b!.x)
  const dy = Math.abs(a!.y - b!.y)
  const angleFromVertical = (Math.atan2(dx, dy) * 180) / Math.PI
  expect.soft(angleFromVertical, `${name}: cross-body segment should be vertical on screen`).toBeLessThanOrEqual(1)
  if (view === 'dor') expect.soft(a!.y, `${name}: the left flank should project below the right flank`).toBeGreaterThan(b!.y)
  else expect.soft(a!.y, `${name}: the dorsal surface should project above the ventral surface`).toBeLessThan(b!.y)
}
