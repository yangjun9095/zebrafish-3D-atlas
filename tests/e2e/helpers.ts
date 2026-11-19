// Shared helpers of the e2e specs. Every DOM hook is optional during phase 1:
// a helper returns null when the hook is absent so a test can skip with a reason.

import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { READY_SELECTOR, waitForReady } from '../../scripts/screenshot.ts'

export { READY_SELECTOR }

/** The timeline track (UX-AC-01). */
export const TRACK_SELECTOR = '[role="slider"][aria-valuemax="4320"]'
/** The docked or floating info card. WP-I2 marks it with data-testid="info-card". */
export const INFO_CARD_SELECTOR = '[data-testid="info-card"], [data-atlas-info-card], [aria-label="Structure information"], [role="complementary"]'
/** The search field (UX-ST-01). */
export const SEARCH_SELECTOR = 'input[type="search"], [role="combobox"], input[aria-label*="earch"]'

export const SKIP_NOT_READY = 'viewer not ready: no [data-atlas-ready] element (WP-05)'

/** Set once a page never became ready within the full timeout; later opens in this worker wait 3 s only. */
let viewerMissing = false

/** Opens `url` and waits for the ready attribute; skips the test when no viewer marks itself ready. */
export async function openReady(page: Page, url: string, timeoutMs = 45_000): Promise<void> {
  await page.goto(url)
  const ready = await waitForReady(page, viewerMissing ? 3_000 : timeoutMs)
  if (!ready) viewerMissing = true
  test.skip(!ready, SKIP_NOT_READY)
}

/** Skips the test when `locator` has no match. */
export async function requireHook(locator: Locator, reason: string): Promise<Locator> {
  const n = await locator.count()
  test.skip(n === 0, reason)
  return locator.first()
}

/** Current time in hpf from the track's aria-valuenow, else from the URL, else null. */
export async function readT(page: Page): Promise<number | null> {
  const track = page.locator(TRACK_SELECTOR)
  if ((await track.count()) > 0) {
    const v = await track.first().getAttribute('aria-valuenow')
    if (v !== null && v !== '' && Number.isFinite(Number(v))) return Number(v)
  }
  const t = new URL(page.url()).searchParams.get('t')
  return t !== null && Number.isFinite(Number(t)) ? Number(t) : null
}

export function urlParam(page: Page, name: string): string | null {
  return new URL(page.url()).searchParams.get(name)
}

/** Waits until `read()` settles on a value that passes `pred`, up to `timeoutMs`. */
export async function eventually<T>(read: () => Promise<T>, pred: (v: T) => boolean, timeoutMs = 3000): Promise<T> {
  const start = Date.now()
  let last = await read()
  while (!pred(last) && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 100))
    last = await read()
  }
  return last
}

export type DebugPoint = { x: number; y: number } | null

/** Projects a body coordinate through `window.__atlasDebug.project`, or null without the hook (QP-38). */
export async function projectBody(page: Page, u: number, v: number, w: number): Promise<DebugPoint> {
  return page.evaluate(
    ([u, v, w]) => {
      const dbg = (window as unknown as { __atlasDebug?: { project?: (u: number, v: number, w: number) => { x: number; y: number } | null } }).__atlasDebug
      if (!dbg || typeof dbg.project !== 'function') return null
      const p = dbg.project(u, v, w)
      return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? { x: p.x, y: p.y } : null
    },
    [u, v, w] as const,
  )
}

/** Projects the centre of a structure through `window.__atlasDebug.projectStructure(id)`, or null. */
export async function projectStructure(page: Page, id: string): Promise<DebugPoint> {
  return page.evaluate((id) => {
    const dbg = (window as unknown as { __atlasDebug?: { projectStructure?: (id: string) => { x: number; y: number } | null } }).__atlasDebug
    if (!dbg || typeof dbg.projectStructure !== 'function') return null
    const p = dbg.projectStructure(id)
    return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? { x: p.x, y: p.y } : null
  }, id)
}

/** Asserts that the page shows text matching `re` somewhere. */
export async function expectText(page: Page, re: RegExp): Promise<void> {
  await expect(page.getByText(re).first()).toBeVisible()
}
