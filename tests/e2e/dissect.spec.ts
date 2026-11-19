// The dissect slider (D17): the offsets the viewer draws at 0, 60 and 100 percent, the systems
// pulling apart in their own directions, the skin fade, the wider label budget of the inventory
// grid, picking after a structure has moved, and the `x` URL round trip.
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { eventually, openReady, urlParam } from './helpers.ts'

const SLIDER = '[data-testid="dissect-slider"] input[type="range"]'
const CARD = '[data-testid="info-card"]'
/** The retina: the eye hands off to it at 24 to 30 hpf (D9), so it is the drawn part at 48 hpf. */
const RETINA = 'ZFA:0000152'
const SKIN = 'ZFA:0001094'

interface Placed { id: string; system: string; x: number; y: number; z: number }

/** The dissect offset of every built structure, in millimetres, from the viewer runtime. */
async function offsets(page: Page): Promise<Placed[] | null> {
  return page.evaluate(() => {
    const dbg = (window as unknown as { __atlasDebug?: { runtime?: { handles?: Map<string, unknown> } } }).__atlasDebug
    const handles = dbg?.runtime?.handles
    if (!handles) return null
    const out: Placed[] = []
    for (const [id, raw] of handles as Map<string, {
      bounds: unknown
      isSkin: boolean
      record: { system: string }
      group: { parent: { name: string; position: { x: number; y: number; z: number } } | null }
    }>) {
      const parent = raw.group.parent
      if (!raw.bounds || raw.isSkin || !parent || !parent.name.startsWith('dissect:')) continue
      out.push({ id, system: raw.record.system, x: parent.position.x, y: parent.position.y, z: parent.position.z })
    }
    return out
  })
}

/** Page coordinates of a structure's centre after the dissect offset, or null. */
async function projectMoved(page: Page, id: string): Promise<{ x: number; y: number } | null> {
  return page.evaluate((id) => {
    const dbg = (window as unknown as {
      __atlasDebug?: { runtime?: { camera: unknown; canvas: HTMLCanvasElement | null; handles: Map<string, unknown> } }
    }).__atlasDebug
    const rt = dbg?.runtime
    const h = rt?.handles.get(id) as {
      bounds: unknown
      center: { clone(): { add(v: unknown): { project(c: unknown): { x: number; y: number } } } }
      group: { parent: { position: unknown } | null }
    } | undefined
    if (!rt || !h || !h.bounds || !h.group.parent || !rt.canvas) return null
    const v = h.center.clone().add(h.group.parent.position).project(rt.camera)
    if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) return null
    const rect = rt.canvas.getBoundingClientRect()
    return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height }
  }, id)
}

async function skinOpacity(page: Page): Promise<number | null> {
  return page.evaluate((id) => {
    const dbg = (window as unknown as { __atlasDebug?: { runtime?: { handles?: Map<string, { material?: { opacity: number } }> } } }).__atlasDebug
    const h = dbg?.runtime?.handles?.get(id)
    return h?.material ? h.material.opacity : null
  }, SKIN)
}

function meanY(placed: readonly Placed[], system: string): number | null {
  const rows = placed.filter((p) => p.system === system)
  if (rows.length === 0) return null
  return rows.reduce((sum, p) => sum + p.y, 0) / rows.length
}

/** Body length at the drawn time, in millimetres: the offsets are stated as a share of it. */
async function bodyLengthMm(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const dbg = (window as unknown as { __atlasDebug?: { runtime?: { lastFrame?: { bodyLengthMm: number; axisLengthMm: number } } } }).__atlasDebug
    const frame = dbg?.runtime?.lastFrame
    if (!frame) return null
    return frame.bodyLengthMm > 0 ? frame.bodyLengthMm : frame.axisLengthMm
  })
}

/** Smallest distance between two structures of one system, in millimetres. */
function closestPair(rows: readonly Placed[], system: string): number | null {
  const own = rows.filter((p) => p.system === system)
  if (own.length < 2) return null
  let min = Infinity
  for (let i = 0; i < own.length; i++) {
    for (let j = i + 1; j < own.length; j++) {
      min = Math.min(min, Math.hypot(own[i].x - own[j].x, own[i].y - own[j].y, own[i].z - own[j].z))
    }
  }
  return min
}

/** Sets the slider through its input, the way a pointer drag ends. */
async function setSlider(page: Page, value: number): Promise<void> {
  await page.locator(SLIDER).fill(String(value))
  await page.locator(SLIDER).dispatchEvent('change')
}

test.describe('the dissect slider', () => {
  test('returns every structure to the body when the slider walks back to 0 percent', async ({ page }) => {
    // Opening at 0 proves nothing: the driver returns before it writes a single group position,
    // so the test would read the default position of a freshly mounted group. Drive 60 to 0 and
    // the write path and the delete both run.
    await openReady(page, '/?t=48&v=lat&x=60')
    await page.waitForTimeout(4000)
    const spread = await offsets(page)
    test.skip(spread === null, 'no __atlasDebug.runtime hook')
    expect((spread as Placed[]).length).toBeGreaterThan(10)
    expect((spread as Placed[]).some((p) => Math.hypot(p.x, p.y, p.z) > 0.05)).toBe(true)
    await setSlider(page, 0)
    await expect(page.locator(SLIDER)).toHaveValue('0')
    // The follow only steps on a rendered frame, and the demand frameloop renders one no faster
    // than the scene allows: on slow hardware a frame can land a second or more apart, so a fixed
    // sleep undercounts how many damping steps have run. Poll for the settled state instead of
    // guessing a sleep long enough for the slowest frame rate.
    const home = await eventually(
      () => offsets(page),
      (rows) => rows !== null && rows.every((p) => Math.hypot(p.x, p.y, p.z) < 1e-6),
      15000,
    )
    for (const p of home as Placed[]) {
      expect(Math.hypot(p.x, p.y, p.z), p.id).toBeLessThan(1e-6)
    }
  })

  test('pulls the systems apart in their own directions at 60 percent and fades the skin out', async ({ page }) => {
    await openReady(page, '/?t=48&v=lat&x=60')
    const placed = await offsets(page)
    test.skip(placed === null, 'no __atlasDebug.runtime hook')
    const rows = placed as Placed[]
    const moved = rows.filter((p) => Math.hypot(p.x, p.y) > 0.05)
    expect(moved.length, 'most structures moved out of the body').toBeGreaterThan(rows.length / 2)
    // D5 directions: nervous goes dorsal, digestive goes ventral (systems.json).
    const nervous = meanY(rows, 'nervous')
    const digestive = meanY(rows, 'digestive')
    if (nervous !== null) expect(nervous, 'nervous moves dorsally').toBeGreaterThan(0)
    if (digestive !== null) expect(digestive, 'digestive moves ventrally').toBeLessThan(0)
    if (nervous !== null && digestive !== null) expect(nervous - digestive).toBeGreaterThan(0.2)
    // D17 asks that siblings do not overlap, not merely that their offsets differ: a hash gives
    // distinct numbers however small the stagger is. The lattice pitch is the floor.
    const length = await bodyLengthMm(page)
    if (length !== null) {
      for (const system of ['nervous', 'skeletal', 'digestive', 'sensory']) {
        const closest = closestPair(rows, system)
        if (closest === null) continue
        expect(closest / length, `${system} siblings sit on one another`).toBeGreaterThan(0.05)
      }
    }
    const opacity = await skinOpacity(page)
    if (opacity !== null) expect(opacity, 'the skin is gone at 60 percent').toBeLessThan(0.01)
  })

  test('packs the inventory grid beside the body at 100 percent and never over it', async ({ page }) => {
    await openReady(page, '/?t=48&v=lat&x=100')
    const placed = await offsets(page)
    test.skip(placed === null, 'no __atlasDebug.runtime hook')
    const world = await page.evaluate(() => {
      const dbg = (window as unknown as {
        __atlasDebug?: { runtime?: { handles: Map<string, { bounds: unknown; isSkin: boolean; center: { x: number }; radius: number; group: { parent: { name: string; position: { x: number } } | null } }> } }
      }).__atlasDebug
      const rt = dbg?.runtime
      if (!rt) return null
      const out: { id: string; left: number }[] = []
      for (const [id, h] of rt.handles) {
        const parent = h.group.parent
        if (!h.bounds || h.isSkin || !parent || !parent.name.startsWith('dissect:')) continue
        out.push({ id, left: h.center.x + parent.position.x - h.radius })
      }
      return out
    })
    test.skip(world === null, 'no __atlasDebug.runtime hook')
    const bodyRight = await page.evaluate(() => {
      const dbg = (window as unknown as { __atlasDebug?: { project(u: number, v: number, w: number): unknown; runtime?: { lastFrame?: { stations: { p: number[] }[] } } } }).__atlasDebug
      const stations = dbg?.runtime?.lastFrame?.stations
      if (!stations) return null
      return Math.max(...stations.map((s) => s.p[0]))
    })
    test.skip(bodyRight === null, 'no body frame on the runtime')
    for (const row of world as { id: string; left: number }[]) {
      expect(row.left, `${row.id} sits over the body`).toBeGreaterThan(bodyRight as number)
    }
  })

  test('names the cells of the inventory grid, inside the wider budget', async ({ page }) => {
    await openReady(page, '/?t=48&v=lat&x=0')
    await page.waitForTimeout(2000)
    const before = await page.locator('.atlas-label:visible').count()
    // The camera refits to the dissect box (UI-65) and the chips place once it settles; a
    // software renderer draws this scene at about three frames a second, so the wait is generous.
    await openReady(page, '/?t=48&v=lat&x=100')
    await page.waitForTimeout(6000)
    const after = await page.locator('.atlas-label:visible').count()
    expect(before, 'labels are off below 60 percent').toBeLessThanOrEqual(8)
    expect(after, 'the grid names far more than the plain budget').toBeGreaterThan(24)
    expect(after).toBeLessThanOrEqual(120)
  })

  test('keeps picking and the info card working after a structure has moved', async ({ page }) => {
    await openReady(page, '/?t=48&v=lat&x=60')
    // The click reads a screen position, so the camera must have finished its refit (UI-65).
    await page.waitForTimeout(4000)
    const at = await projectMoved(page, RETINA)
    test.skip(at === null, 'the retina has no build at 48 hpf')
    await page.mouse.click((at as { x: number; y: number }).x, (at as { x: number; y: number }).y)
    await expect(page.locator(CARD).first()).toBeVisible()
    const sel = await eventually(() => Promise.resolve(urlParam(page, 'sel')), (v) => v !== null, 3000)
    expect(sel, 'a click on a dissected structure selects it').not.toBeNull()
  })

  test('round trips through the URL and steps with the D key', async ({ page }) => {
    await openReady(page, '/?t=48&v=lat&x=45')
    await expect(page.locator(SLIDER)).toHaveValue('45')
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.keyboard.press('KeyD')
    await expect(page.locator(SLIDER)).toHaveValue('60')
    const x = await eventually(() => Promise.resolve(urlParam(page, 'x')), (v) => v === '60', 3000)
    expect(x).toBe('60')
    await page.keyboard.press('Shift+KeyD')
    await expect(page.locator(SLIDER)).toHaveValue('30')
    // The reset button returns to 0, and the default drops the key from the link.
    await page.getByRole('button', { name: 'Reset dissect' }).click()
    await expect(page.locator(SLIDER)).toHaveValue('0')
    const cleared = await eventually(() => Promise.resolve(urlParam(page, 'x')), (v) => v === null, 3000)
    expect(cleared).toBeNull()
  })
})
