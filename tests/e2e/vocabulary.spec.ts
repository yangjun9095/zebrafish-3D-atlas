// The full ZFA vocabulary in the running app (D17): a term that no record draws is findable in
// search, opens the info card in its term state, highlights its stand-in, and survives a reload.
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { SEARCH_SELECTOR, openReady, requireHook, urlParam } from './helpers.ts'

/** Neural retina: a ZFA term with no record of its own, contained by the retina record. */
const TERM = 'ZFA:0000046'
const TERM_QUERY = 'neuroretina'
const RETINA = '0000152'
/** The midbrain hindbrain boundary; its ZFIN synonyms are "isthmus" and "mhb". */
const MHB = 'ZFA:0000042'

async function typeQuery(page: Page, query: string): Promise<void> {
  const field = await requireHook(page.locator(SEARCH_SELECTOR), 'no search field (UX-ST-01)')
  await field.click()
  await field.fill(query)
  // The vocabulary chunk is fetched on the first keystroke.
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 15_000 })
}

test.describe('ZFA vocabulary', () => {
  test('finds a term with no record and opens the term card', async ({ page }) => {
    await openReady(page, '/?t=48')
    await typeQuery(page, TERM_QUERY)

    const row = page.getByTestId('search-term').first()
    await expect(row).toBeVisible()
    await expect(row.getByTestId('search-badge')).toHaveText('part of retina')

    await row.click()
    await expect(page.getByTestId('term-standin')).toHaveText(/Modelled as part of: retina/)
    await expect(page.getByTestId('term-badge')).toHaveText('part of retina')
    await expect(page.getByTestId('term-kind')).toHaveText('structure')
    await expect(page.getByTestId('term-definition')).not.toBeEmpty()
    await expect(page.getByTestId('term-zfin-window')).toHaveText(/^ZFIN: /)
    await expect(page.getByTestId('term-zfin-link')).toHaveAttribute('href', `https://zfin.org/${TERM}`)
    await expect(page.getByTestId('term-jump')).toBeVisible()

    // The stand-in carries the selection outline, and the URL keeps both halves.
    await expect.poll(() => urlParam(page, 'term')).toBe(TERM.slice(4))
    await expect.poll(() => urlParam(page, 'sel')).toBe(RETINA)
  })

  test('restores the term from the link', async ({ page }) => {
    await openReady(page, `/?t=48&sel=${RETINA}&term=${TERM.slice(4)}`)
    await expect(page.getByTestId('term-standin')).toHaveText(/Modelled as part of: retina/, { timeout: 15_000 })
  })

  test('reads a term id from the sel key', async ({ page }) => {
    await openReady(page, `/?t=48&sel=${TERM.slice(4)}`)
    await expect(page.getByTestId('term-badge')).toHaveText('part of retina', { timeout: 15_000 })
  })

  test('finds ZFA:0000042 from "MHB" and from "isthmus"', async ({ page }) => {
    await openReady(page, '/?t=24')
    for (const query of ['MHB', 'isthmus']) {
      await typeQuery(page, query)
      await expect
        .poll(() => page.getByRole('option').evaluateAll((nodes) => nodes.map((n) => n.id)), { timeout: 15_000 })
        .toContain(`atlas-search-list-${MHB}`)
    }
  })

  test('leaves the term when a record is selected next', async ({ page }) => {
    await openReady(page, `/?t=48&sel=${RETINA}&term=${TERM.slice(4)}`)
    await expect(page.getByTestId('term-standin')).toBeVisible({ timeout: 15_000 })
    await typeQuery(page, 'notochord')
    await page.getByRole('option').first().click()
    await expect(page.getByTestId('term-standin')).toHaveCount(0)
    await expect.poll(() => urlParam(page, 'term')).toBeNull()
  })
})
