// Browser regression check against an isolated single-file build, without touching dist/.
// node scripts/verify-fluorescence.ts [bundle/zebrafish-reporter-preview.html]
import { mkdtemp, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { AtlasStore } from '../src/state/store.ts'
import { GL_FLAGS } from './screenshot.ts'
import { decodePng } from './lib/png.ts'

const PANEL = 'Reporter preview'
/** src/core/fluorescence.ts FLUORESCENCE_BACKGROUND, as three.js prints it. */
const PREVIEW_BACKGROUND = '060c14'
/**
 * The optic tectum: anatomy the example leaves unlabelled, so the preview draws it at 0.06 opacity.
 * It is picked instead of the eye because the eye record hands its mesh to the retina and the lens
 * at this age and draws nothing itself, and instead of the retina because the lens sits in front of
 * the retina's centre. Its own centre projects onto its own mesh, so the click has one answer.
 */
const UNLABELLED = 'ZFA:0000445'

const url = pathToFileURL(resolve(process.argv[2] ?? 'bundle/zebrafish-reporter-preview.html')).href
const out = await mkdtemp('/tmp/zebrafish-fluorescence-check-')
console.log(`Browser verification artifacts: ${out}`)
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL_FLAGS })
const errors: string[] = []
const ready = async (page: Page) => { await page.locator('[data-atlas-ready="true"]').waitFor({ timeout: 60000 }) }

async function material(page: Page, id: string) {
  return page.evaluate((id) => {
    const h = window.__atlasDebug?.runtime.handles.get(id)
    return h ? { emission: h.material.emissive.getHexString(), intensity: h.material.emissiveIntensity, opacity: h.opacity, color: h.material.color.getHexString(), baseline: h.hex.replace('#', '').toLowerCase() } : null
  }, id)
}
async function setTime(page: Page, time: number) {
  await page.evaluate((time) => (window.__atlasDebug!.state() as unknown as AtlasStore).setTime(time), time)
}
async function store<T>(page: Page, read: (s: AtlasStore) => T): Promise<T> {
  return page.evaluate(`(${read.toString()})(window.__atlasDebug.state())`) as Promise<T>
}
/** The scene background, read through the scene graph the structure handles hang in. */
async function sceneBackground(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    interface SceneNode { parent: SceneNode | null; background?: { getHexString(): string } }
    const first = window.__atlasDebug?.runtime.handles.values().next().value
    let node = (first?.group ?? null) as unknown as SceneNode | null
    while (node?.parent) node = node.parent
    return node?.background?.getHexString() ?? null
  })
}

try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(url + '?lab=1&t=48&theme=dark')
  await ready(page)
  await expect(page.getByRole('dialog', { name: PANEL, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Try heart + liver + spinal cord', exact: true }).click()
  const rules = page.getByTestId('fluorescence-rule')
  await expect(rules).toHaveCount(3)
  await expect.poll(async () => (await material(page, 'ZFA:0000123'))?.emission).toBe('ff4265')
  await expect.poll(async () => (await material(page, 'ZFA:0000075'))?.emission).toBe('39f579')
  await page.screenshot({ path: out + '/48-fluorescence.png' })

  // The emission peak rides beside every reporter name, in the picker and in the legend.
  await expect(rules.first().getByLabel('Fluorescent protein', { exact: true }).locator('option').first()).toHaveText('EGFP, 507 nm')
  const legend = page.locator('.fp-legend')
  await expect(legend).toHaveAttribute('aria-label', `${PANEL} legend`)
  await expect(legend).toContainText('EGFP, 507 nm')
  await expect(legend).toContainText('Schematic reporter preview')

  // Duplicating a rule leaves the rendered color and intensity unchanged.
  const before = await material(page, 'ZFA:0000114')
  await rules.first().getByRole('button', { name: 'Duplicate target', exact: true }).click()
  await expect(rules).toHaveCount(4)
  await expect.poll(() => material(page, 'ZFA:0000114')).toEqual(before)
  await rules.last().getByLabel('Fluorescent protein', { exact: true }).selectOption('mcherry')
  await expect.poll(async () => (await material(page, 'ZFA:0000114'))?.emission).not.toBe('39f579')
  await page.getByLabel('View channel', { exact: true }).selectOption('egfp')
  await expect.poll(async () => (await material(page, 'ZFA:0000114'))?.emission).toBe('39f579')
  await expect.poll(async () => (await material(page, 'ZFA:0000123'))?.emission).toBe('000000')
  await page.getByLabel('View channel', { exact: true }).selectOption('all')
  await rules.last().getByRole('button', { name: 'Remove target', exact: true }).click()

  // Hover and visibility must not destroy or resurrect a reporter assignment.
  await page.evaluate(() => {
    const s = window.__atlasDebug!.state() as unknown as AtlasStore
    s.setHover('ZFA:0000123'); s.setStructureHidden('ZFA:0000123', true)
  })
  await expect.poll(async () => (await material(page, 'ZFA:0000123'))?.opacity).toBe(0)
  await page.evaluate(() => {
    const s = window.__atlasDebug!.state() as unknown as AtlasStore
    s.setStructureHidden('ZFA:0000123', false)
  })
  await expect.poll(async () => (await material(page, 'ZFA:0000123'))?.emission).toBe('ff4265')
  await page.evaluate(() => (window.__atlasDebug!.state() as unknown as AtlasStore).setHover(null))

  // Inclusive endpoints and snapshot rules, using actual live materials.
  await setTime(page, 72)
  await expect.poll(async () => (await material(page, 'ZFA:0000114'))?.intensity).toBe(1.15)
  await setTime(page, 72.01)
  await expect.poll(async () => (await material(page, 'ZFA:0000114'))?.intensity).toBeLessThan(1)
  await setTime(page, 120)
  await expect.poll(async () => (await material(page, 'ZFA:0000123'))?.intensity).toBe(1.15)
  await setTime(page, 120.01)
  await expect.poll(async () => (await material(page, 'ZFA:0000123'))?.intensity).toBeLessThan(1)
  await setTime(page, 48)
  await rules.nth(1).getByRole('button', { name: 'This time only', exact: true }).click()
  await setTime(page, 48.01)
  await expect.poll(async () => (await material(page, 'ZFA:0000123'))?.intensity).toBeLessThan(1)
  await setTime(page, 48)

  // Review item 7: Tab from From to Through commits the first field and leaves the focus in the
  // second one. The earlier build keyed the pair on its own values and unmounted both on commit.
  const firstRule = rules.first()
  await firstRule.getByLabel('From (hpf)', { exact: true }).fill('30')
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('Through (hpf)')
  expect(await store(page, (s) => s.fluorescence.rules[0].fromHpf)).toBe(30)
  await page.keyboard.press('Shift+Tab')
  expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('From (hpf)')
  await firstRule.getByLabel('From (hpf)', { exact: true }).fill('24')
  await firstRule.getByLabel('Through (hpf)', { exact: true }).click()
  await expect.poll(() => store(page, (s) => s.fluorescence.rules[0].fromHpf)).toBe(24)

  // Review items 1, 9: Escape closes the preview sheet first and clears the selection next, and a
  // faint unlabelled structure still takes a click while the preview is on.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: PANEL, exact: true })).toHaveCount(0)
  const faintAt = await page.evaluate((id) => window.__atlasDebug!.projectStructure(id), UNLABELLED)
  if (!faintAt) throw new Error(`the debug hook did not project ${UNLABELLED}; it has no mesh at 48 hpf`)
  await page.mouse.click(faintAt.x, faintAt.y)
  await expect.poll(() => store(page, (s) => s.selection.join(','))).toBe(UNLABELLED)
  await page.getByRole('button', { name: PANEL, exact: true }).click()
  await expect(page.getByRole('dialog', { name: PANEL, exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: PANEL, exact: true })).toHaveCount(0)
  expect(await store(page, (s) => s.selection.join(','))).toBe(UNLABELLED)
  await page.keyboard.press('Escape')
  await expect.poll(() => store(page, (s) => s.selection.length)).toBe(0)
  await page.getByRole('button', { name: PANEL, exact: true }).click()

  // URL reload restores config, including a snapshot and repeated reporter names.
  const config = await page.evaluate(() => (window.__atlasDebug!.state() as unknown as AtlasStore).fluorescence)
  await expect.poll(() => new URL(page.url()).searchParams.has('fp')).toBe(true)
  await page.waitForTimeout(500)
  const share = page.url()
  await page.reload()
  await ready(page)
  expect(await page.evaluate(() => (window.__atlasDebug!.state() as unknown as AtlasStore).fluorescence)).toEqual(config)
  await page.getByRole('checkbox', { name: 'Show fluorescence', exact: true }).uncheck()
  await expect.poll(async () => { const h = await material(page, 'ZFA:0000123'); return h?.color === h?.baseline && h?.emission === '000000' }).toBe(true)
  await page.getByRole('checkbox', { name: 'Show fluorescence', exact: true }).check()

  await page.getByRole('button', { name: 'Share link', exact: true }).click()
  const sharedUrl = await page.getByTestId('share-url').inputValue()
  expect(new URL(sharedUrl).protocol).toBe('file:')
  expect(new URL(sharedUrl).searchParams.has('fp')).toBe(true)
  await page.getByRole('dialog', { name: 'Share link', exact: true }).getByRole('button', { name: 'Close', exact: true }).click()

  // Export through the user-facing dialog. Preserve the downloaded image for visual inspection.
  await page.locator('.app-viewer').click({ position: { x: 30, y: 220 } })
  await page.keyboard.press('Control+Shift+KeyS')
  await expect(page.getByTestId('export-dialog')).toBeVisible()
  await expect(page.getByRole('switch', { name: /^Include legend/ })).toHaveAttribute('aria-checked', 'true')
  await page.locator('[data-size="1x"]').click()
  const downloadPromise = page.waitForEvent('download', { timeout: 60000 })
  await page.getByRole('button', { name: 'Download PNG', exact: true }).click()
  const download = await downloadPromise
  await download.saveAs(out + '/fluorescence-export.png')
  const png = decodePng(new Uint8Array(await readFile(out + '/fluorescence-export.png')))
  expect(png.width).toBeGreaterThan(500)
  let green = 0, red = 0
  for (let i = 0; i < png.rgba.length; i += 4) {
    const [r, g, b] = png.rgba.subarray(i, i + 3)
    if (g > 110 && g > r * 1.3 && g > b * 1.2) green++
    if (r > 110 && r > g * 1.3 && r > b * 1.1) red++
  }
  expect(green).toBeGreaterThan(50)
  expect(red).toBeGreaterThan(10)

  // Review item 10: the light theme must not wash the preview. The scene keeps the preview
  // background, and the viewer stays dark instead of turning into a near-white field.
  const lightUrl = new URL(share)
  lightUrl.searchParams.set('theme', 'light')
  await page.goto(lightUrl.href)
  await ready(page)
  await page.keyboard.press('Escape')
  expect(await sceneBackground(page)).toBe(PREVIEW_BACKGROUND)
  await page.waitForTimeout(1200)
  await page.locator('.app-viewer').screenshot({ path: out + '/light-fluorescence.png' })
  const light = decodePng(new Uint8Array(await readFile(out + '/light-fluorescence.png')))
  let bright = 0
  for (let i = 0; i < light.rgba.length; i += 4) {
    const [r, g, b] = light.rgba.subarray(i, i + 3)
    if (r > 235 && g > 235 && b > 235) bright++
  }
  const brightFraction = bright / (light.rgba.length / 4)
  console.log(`Light-theme viewer near-white fraction: ${brightFraction.toFixed(4)}`)
  expect(brightFraction).toBeLessThan(0.15)

  // Review item 3: a kit written by a newer build carries a fluorescence config this build cannot
  // read. Loading it must drop the field, not throw inside the handler that opened the kit.
  await page.goto(url + '?t=48')
  await ready(page)
  await page.evaluate(() => {
    const s = window.__atlasDebug!.state() as unknown as AtlasStore
    s.loadKit({ id: 'kit_probe', name: 'Probe', index: 0, bookmarks: [
      { name: 'Slide 1', t: 96, view: 'lateral', fluorescence: { version: 2 } },
    ] } as unknown as Parameters<AtlasStore['loadKit']>[0])
  })
  await expect.poll(() => store(page, (s) => s.kit?.bookmarks.length ?? 0)).toBe(1)
  expect(await store(page, (s) => s.kit?.bookmarks[0].fluorescence ?? 'dropped')).toBe('dropped')
  await expect.poll(() => store(page, (s) => Math.round(s.time))).toBe(96)

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  phone.on('pageerror', (e) => errors.push(e.message))
  await phone.goto(share)
  await ready(phone)
  await expect(phone.getByRole('dialog', { name: PANEL, exact: true })).toBeVisible()
  expect(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await phone.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(phone.getByRole('dialog', { name: PANEL, exact: true })).toHaveCount(0)
  await phone.screenshot({ path: out + '/phone-fluorescence.png' })
  await phone.getByRole('button', { name: PANEL, exact: true }).click()
  await expect(phone.getByRole('dialog', { name: PANEL, exact: true })).toBeVisible()
  await page.goto(url + '?t=48')
  await ready(page)
  await expect(page.getByRole('button', { name: PANEL, exact: true })).toHaveCount(0)
  expect(errors).toEqual([])
  console.log(`Fluorescence browser checks passed. Screenshots and PNG: ${out}`)
} finally {
  await browser.close()
}
