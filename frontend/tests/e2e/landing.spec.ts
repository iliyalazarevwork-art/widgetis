import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('renders main hero without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')

    await expect(page).toHaveTitle(/widgetis/i)

    // The header always renders the four main nav links — assert at least
    // one of them is visible to prove React mounted and the router resolved
    // the home route.
    await expect(
      page.getByRole('link', { name: 'Тарифи' }).first(),
    ).toBeVisible({ timeout: 10_000 })

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

test.describe('Header navigation', () => {
  test('clicking "Тарифи" from home navigates to /pricing', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Тарифи' }).first().click()
    await expect(page).toHaveURL(/\/pricing$/, { timeout: 10_000 })
    // Pricing hero loads — one of the plan names must appear.
    await expect(page.getByText(/Basic|Pro|Max/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('clicking "Віджети" from home navigates to /widgets', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Віджети' }).first().click()
    await expect(page).toHaveURL(/\/widgets$/, { timeout: 10_000 })
  })

  test('clicking the logo from /pricing returns home', async ({ page }) => {
    await page.goto('/pricing')
    // The logo link has "widgetis — на головну" as its accessible name.
    await page.getByRole('link', { name: /widgetis — на головну/i }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 })
  })

  test('direct deep-link to /contacts renders the page', async ({ page }) => {
    const response = await page.goto('/contacts')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10_000 })
  })
})

test.describe('Pricing page', () => {
  test('billing toggle switches between monthly and yearly', async ({ page }) => {
    await page.goto('/pricing')

    const monthlyBtn = page.getByRole('button', { name: 'Місяць' })
    const yearlyBtn = page.getByRole('button', { name: /Рік/ })

    await expect(monthlyBtn).toBeVisible({ timeout: 10_000 })
    await expect(yearlyBtn).toBeVisible()

    // Default is yearly — click monthly and the active class should flip.
    await monthlyBtn.click()
    await expect(monthlyBtn).toHaveClass(/pricing__seg-btn--active/)

    await yearlyBtn.click()
    await expect(yearlyBtn).toHaveClass(/pricing__seg-btn--active/)
  })

  test('shows all three plan names (Basic, Pro, Max)', async ({ page }) => {
    await page.goto('/pricing')
    for (const plan of ['Basic', 'Pro', 'Max']) {
      await expect(page.getByText(plan, { exact: false }).first()).toBeVisible({ timeout: 10_000 })
    }
  })

  test('clicking a plan CTA leads to /signup with the plan param', async ({ page }) => {
    await page.goto('/pricing')
    // Plan CTAs are rendered as <Link to="/signup?plan=...">; click the first one.
    const planLink = page.locator('a[href*="/signup?plan="]').first()
    await expect(planLink).toBeVisible({ timeout: 10_000 })
    await planLink.click()
    await expect(page).toHaveURL(/\/signup\?plan=/, { timeout: 10_000 })
  })
})

test.describe('Signup page', () => {
  test('shows Basic plan summary when ?plan=basic', async ({ page }) => {
    await page.goto('/signup?plan=basic&billing=monthly')
    // Left column shows the plan name badge.
    await expect(page.locator('.signup__plan-name')).toContainText(/Basic/i, { timeout: 10_000 })
  })

  test('shows Max plan summary when ?plan=max', async ({ page }) => {
    await page.goto('/signup?plan=max&billing=yearly')
    await expect(page.locator('.signup__plan-name')).toContainText(/Max/i, { timeout: 10_000 })
  })

  test('invalid plan param falls back to Pro', async ({ page }) => {
    await page.goto('/signup?plan=nonsense')
    await expect(page.locator('.signup__plan-name')).toContainText(/Pro/i, { timeout: 10_000 })
  })
})

test.describe('Widgets page', () => {
  test('renders widget catalog CTA strip with plan prices', async ({ page }) => {
    await page.goto('/widgets')
    // The CTA strip at the bottom lists all three plan links.
    const ctaPlanLinks = page.locator('a[href*="/pricing?plan="]')
    await expect(ctaPlanLinks.first()).toBeVisible({ timeout: 10_000 })
    expect(await ctaPlanLinks.count()).toBeGreaterThanOrEqual(3)
  })
})
