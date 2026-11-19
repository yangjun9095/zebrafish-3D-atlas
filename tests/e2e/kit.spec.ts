// Slide kit smoke (spec UI-46, WP-I5): the starter kit in the URL, ArrowRight steps in presentation
// mode, the strip markers, Ctrl+B, and the JSON export and import round trip. Extra cases cover the
// marker click, the starter kit list of the sheet, and the row edits.
import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { KitRecord } from '../../src/core/schema/body.ts'
import type { Bookmark } from '../../src/core/schema/body.ts'
import { encodeKit } from '../../src/state/slices/url.ts'
import type { SlideKit } from '../../src/state/slices/types.ts'
import { eventually, openReady, readT, urlParam } from './helpers.ts'

const MARKER = '[data-kit-marker]'
const IMPORT_INPUT = 'input[aria-label="Import a kit file"]'

/** Starter kit `i` of src/data/kits.json as the full store form and its URL token. */
function starter(i: number): { kit: SlideKit; token: string } {
  const raw = JSON.parse(readFileSync('src/data/kits.json', 'utf8')) as unknown[]
  const rec = KitRecord.parse(raw[i])
  const kit: SlideKit = { id: rec.id, name: rec.name, bookmarks: rec.bookmarks as unknown as SlideKit['bookmarks'], index: 0 }
  return { kit, token: encodeKit(kit) }
}

/** The kit of the store through the QP-38 debug hook; null without the hook or without a kit. */
function readKit(page: Page): Promise<SlideKit | null> {
  return page.evaluate(() => {
    const dbg = (window as unknown as { __atlasDebug?: { state(): { kit?: unknown } } }).__atlasDebug
    return (dbg?.state().kit as SlideKit | undefined) ?? null
  })
}

/** The isolate flag of the store through the debug hook. */
function readIsolate(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const dbg = (window as unknown as { __atlasDebug?: { state(): { isolate?: boolean } } }).__atlasDebug
    return dbg?.state().isolate === true
  })
}

async function pressSteps(page: Page, key: string, n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press(key)
    await page.waitForTimeout(150)
  }
}

async function expectT(page: Page, expected: number): Promise<void> {
  const t = await eventually(() => readT(page), (v) => v !== null && Math.abs(v - expected) < 0.01, 4000)
  expect(t, `t should be ${expected}`).not.toBeNull()
  expect(Math.abs((t as number) - expected)).toBeLessThan(0.01)
}

test.describe('slide kit', () => {
  test('UI-46: ArrowRight steps the starter kit, markers follow, Ctrl+B adds, JSON round-trips', async ({ page }) => {
    const { kit, token } = starter(0)
    const bookmarks = kit.bookmarks as unknown as Bookmark[]
    expect(bookmarks).toHaveLength(8)
    await openReady(page, `/?present=1&theme=dark&kit=${token}`)
    await expectT(page, bookmarks[0].t)

    await pressSteps(page, 'ArrowRight', 3)
    await expectT(page, bookmarks[3].t)
    const markers = page.locator(MARKER)
    await expect(markers).toHaveCount(8)
    await expect(markers.nth(3)).toHaveAttribute('data-current', 'true')
    await expect(markers.nth(2)).toHaveAttribute('data-current', 'false')
    expect(await page.locator(`${MARKER}[data-current="true"]`).count()).toBe(1)

    await page.keyboard.press('Control+KeyB')
    const after = await eventually(() => readKit(page), (k) => k !== null && k.bookmarks.length === 9)
    expect(after?.bookmarks).toHaveLength(9)
    expect(after?.index).toBe(8)
    await expect(markers).toHaveCount(9)

    await page.keyboard.press('Shift+KeyB')
    const list = page.locator('[data-testid="kit-list"]')
    await expect(list).toBeVisible()
    await expect(list.locator('.kit-row')).toHaveCount(9)

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()])
    const path = await download.path()
    expect(path).not.toBeNull()
    const exported = JSON.parse(readFileSync(path as string, 'utf8')) as SlideKit
    expect(exported.bookmarks).toHaveLength(9)
    expect(exported).toEqual(after)

    // Change the loaded kit, then re-import the file: the store must match the file again.
    await page.keyboard.press('Control+KeyB')
    await eventually(() => readKit(page), (k) => k !== null && k.bookmarks.length === 10)
    await page.locator(IMPORT_INPUT).setInputFiles({ name: 'kit.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) })
    const imported = await eventually(() => readKit(page), (k) => k !== null && k.bookmarks.length === 9)
    expect(imported).toEqual(exported)
  })

  test('a marker click steps to its bookmark and the URL carries the kit', async ({ page }) => {
    const { kit, token } = starter(0)
    const bookmarks = kit.bookmarks as unknown as Bookmark[]
    await openReady(page, `/?present=1&theme=dark&kit=${token}`)
    await expect(page.locator(MARKER)).toHaveCount(8)
    await page.locator(MARKER).nth(5).click()
    await expectT(page, bookmarks[5].t)
    await expect(page.locator(MARKER).nth(5)).toHaveAttribute('data-current', 'true')
    const param = await eventually(() => Promise.resolve(urlParam(page, 'kit')), (v) => v !== null, 2000)
    expect(param).not.toBeNull()
    expect(param!.length).toBeLessThanOrEqual(2048)
  })

  test('the sheet lists both starter kits and loading one copies it into a user kit', async ({ page }) => {
    await openReady(page, '/?t=24&v=lat&theme=dark')
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => undefined)
    await page.keyboard.press('Shift+KeyB')
    const sheet = page.getByRole('dialog', { name: 'Slide kit' })
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole('button', { name: /Embryogenesis in 8 views/ })).toBeVisible()
    await sheet.getByRole('button', { name: /Organ origins/ }).click()
    const kit = await eventually(() => readKit(page), (k) => k !== null && k.bookmarks.length === 4)
    expect(kit?.name).toBe('Organ origins')
    expect(kit?.id).toMatch(/^kit_/)
    expect(kit?.bookmarks[0]).toMatchObject({ t: 22, iso: true, sel: ['ZFA:0000114'] })
    await expectT(page, 22)
    await expect(page.locator(MARKER)).toHaveCount(4)
    const stored = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('zfatlas:kits:v1') ?? '{}')))
    expect(stored).toContain(kit?.id)

    // Row edits: move the first row down, rename it, then delete it with the confirm step.
    const rows = sheet.locator('.kit-row')
    await rows.nth(0).getByRole('button', { name: 'Move down' }).click()
    await expect(rows.nth(1).locator('.kit-name')).toHaveText('Heart')
    await rows.nth(1).getByRole('button', { name: 'Rename' }).click()
    await sheet.getByLabel('Bookmark name').fill('Heart tube')
    await page.keyboard.press('Enter')
    await expect(rows.nth(1).locator('.kit-name')).toHaveText('Heart tube')
    await rows.nth(1).getByRole('button', { name: 'Delete' }).click()
    await sheet.getByRole('button', { name: 'Delete?' }).click()
    await expect(rows).toHaveCount(3)
    const edited = await readKit(page)
    expect(edited?.bookmarks.map((b) => b.name)).toEqual(['Pronephros', 'Liver', 'Swim bladder'])
    // The Escape order of 5.9.1: the loaded bookmark isolated the heart, so the first press exits isolate
    // and the sheet stays; the second press closes the sheet.
    expect(await readIsolate(page)).toBe(true)
    await page.keyboard.press('Escape')
    await expect(sheet).toBeVisible()
    expect(await eventually(() => readIsolate(page), (v) => v === false)).toBe(false)
    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
  })
})
