import { test, expect } from '@playwright/test'

/**
 * E2E for the OTP login flow.
 *
 * The local backend has `OTP_DEV_BYPASS=true` and the master code `121212`
 * (see config/app.php). We use this dev bypass instead of plumbing the
 * real cache lookup — same path the human team uses for manual QA.
 */
test.describe('OTP login flow', () => {
  test('user lands in /cabinet after entering email + master OTP', async ({ page }) => {
    await page.goto('/login')

    // Email step
    const email = `e2e-${Date.now()}@widgetis.local`
    await page.locator('input[type="email"]').fill(email)
    await page.getByRole('button', { name: /отримати код/i }).click()

    // OTP step — six independent inputs, the page auto-advances on each digit.
    await expect(page).toHaveURL(/\/login\/otp$/, { timeout: 10_000 })

    const otpInputs = page.locator('input.otp-input')
    await expect(otpInputs).toHaveCount(6)

    // Type the master code one digit per input. Auto-submit fires once all
    // six inputs are filled.
    for (const digit of '121212') {
      await page.keyboard.type(digit)
    }

    // Successful verification redirects to /cabinet (or /admin for admin role).
    await expect(page).toHaveURL(/\/(cabinet|admin)/, { timeout: 10_000 })

    // JWT was persisted under the same key the api/client uses.
    const token = await page.evaluate(() => localStorage.getItem('wty_token'))
    expect(token).not.toBeNull()
    expect(token!.length).toBeGreaterThan(20)
  })

  test('OTP page redirects back to /login when accessed without email state', async ({
    page,
  }) => {
    await page.goto('/login/otp')

    await expect(page).toHaveURL(/\/login$/)
  })

  test('login page exposes a Google sign-in button', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })
})
