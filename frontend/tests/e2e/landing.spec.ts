import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('renders main hero without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')

    // Document loaded.
    await expect(page).toHaveTitle(/widgetis/i)

    // The header always renders the four main nav links — assert at least
    // one of them is visible to prove React mounted and the router resolved
    // the home route. We pick "Тарифи" because it is anchored to /pricing
    // (next test depends on the same target).
    await expect(
      page.getByRole('link', { name: 'Тарифи' }).first(),
    ).toBeVisible({ timeout: 10_000 })

    // Filter out third-party noise (analytics, fonts, ad blockers).
    const fatal = errors.filter(
      (e) => !/google-analytics|fonts\.googleapis|adsbygoogle|favicon/i.test(e),
    )
    expect(fatal, fatal.join('\n')).toEqual([])
  })

  test('navigation to /pricing works', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page).toHaveURL(/\/pricing$/)
  })
})
