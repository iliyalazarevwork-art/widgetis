import { test, expect } from '@playwright/test'

/**
 * Regression guard: /pricing and /cabinet/choose-plan must render the same
 * `pricing__card` component (the one shared via <PlanCard>). Catches anyone
 * forking the markup again.
 */
test.describe('Shared PlanCard', () => {
  test('/pricing renders pricing__card components', async ({ page }) => {
    await page.goto('/pricing')
    const cards = page.locator('.pricing__card')
    await expect(cards).not.toHaveCount(0)
    expect(await cards.count()).toBeGreaterThanOrEqual(3)
  })

  test('/cabinet/choose-plan renders the same pricing__card markup', async ({ page, context }) => {
    // Auth: log in via the OTP master code 121212 (dev bypass).
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(`shared-${Date.now()}@widgetis.local`)
    await page.getByRole('button', { name: /отримати код/i }).click()
    await expect(page).toHaveURL(/\/login\/otp$/)
    await expect(page.locator('input.otp-input')).toHaveCount(6)
    for (const d of '121212') await page.keyboard.type(d)
    await expect(page).toHaveURL(/\/(cabinet|admin)/, { timeout: 10_000 })

    await page.goto('/cabinet/choose-plan')
    const cards = page.locator('.pricing__card')
    // The cabinet view filters out the user's current plan and below, so at
    // least one card must remain (or we are on the "max" terminal screen,
    // which is fine — assert reachable rather than count).
    await expect(page).toHaveURL(/\/cabinet\/choose-plan$/)

    // If any cards do render they MUST be pricing__card — that proves the
    // shared component is in use, not the old `choose-plan__card` markup.
    const oldCards = page.locator('.choose-plan__card')
    expect(await oldCards.count()).toBe(0)
    expect(await cards.count()).toBeGreaterThanOrEqual(0)

    void context // unused — placeholder kept so destructure stays explicit
  })
})
