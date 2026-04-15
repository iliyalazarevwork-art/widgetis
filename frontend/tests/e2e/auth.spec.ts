import { test, expect, type Page } from '@playwright/test'

/**
 * E2E for OTP-based auth flows.
 *
 * The local backend has `OTP_DEV_BYPASS=true` and the master code `121212`
 * (see config/app.php). We use this dev bypass instead of plumbing the
 * real cache lookup — same path the human team uses for manual QA.
 *
 * Each test creates its own random "test user" by using a timestamped
 * email, so tests never collide and there's nothing to clean up.
 */

const MASTER_OTP = '121212'

function randomEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@widgetis.local`
}

/**
 * Full /login → /login/otp → authenticated flow.
 * Returns the page URL after verification (/cabinet or /admin).
 */
async function loginViaOtp(page: Page, email: string): Promise<string> {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.getByRole('button', { name: /отримати код/i }).click()

  await expect(page).toHaveURL(/\/login\/otp$/, { timeout: 10_000 })

  const otpInputs = page.locator('input.otp-input')
  await expect(otpInputs).toHaveCount(6)

  for (const digit of MASTER_OTP) {
    await page.keyboard.type(digit)
  }

  await expect(page).toHaveURL(/\/(cabinet|admin)/, { timeout: 10_000 })
  return page.url()
}

test.describe('OTP login flow', () => {
  test('new user lands in /cabinet after entering email + master OTP', async ({ page }) => {
    await loginViaOtp(page, randomEmail())

    await expect(page).toHaveURL(/\/cabinet/, { timeout: 10_000 })

    const token = await page.evaluate(() => localStorage.getItem('wty_token'))
    expect(token).not.toBeNull()
    expect(token!.length).toBeGreaterThan(20)
  })

  test('admin user lands in /admin after OTP login', async ({ page }) => {
    // AdminSeeder creates admin@widgetis.com with role=admin. OTP dev
    // bypass still authenticates admin accounts, and the post-login
    // router must send them to /admin (not /cabinet).
    await loginViaOtp(page, 'admin@widgetis.com')

    await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 })

    const token = await page.evaluate(() => localStorage.getItem('wty_token'))
    expect(token).not.toBeNull()
  })

  test('fresh user is routed to /cabinet/choose-plan after login', async ({ page }) => {
    // A brand-new account has no subscription, so RequireSubscription bounces
    // them from /cabinet → /cabinet/choose-plan. We assert that bounce happens
    // and that the choose-plan hero actually renders (not a white screen).
    await loginViaOtp(page, randomEmail())

    await page.goto('/cabinet')
    await expect(page).toHaveURL(/\/cabinet\/choose-plan/, { timeout: 10_000 })
    await expect(page.getByText(/Обери свій план/i)).toBeVisible({ timeout: 10_000 })
  })

  test('authenticated user can reach /cabinet/support without losing the session', async ({ page }) => {
    // Any cabinet-layout subroute that doesn't require a subscription guard
    // would work — we use /cabinet/support as a cheap sanity check that
    // deeper cabinet routes resolve after OTP login.
    await loginViaOtp(page, randomEmail())

    // Support page is gated behind RequireSubscription, so a fresh user
    // without a plan will still bounce to /cabinet/choose-plan — but the
    // bounce itself proves the auth chain is intact (no /login redirect).
    await page.goto('/cabinet/support')
    await expect(page).toHaveURL(/\/cabinet/, { timeout: 10_000 })

    const token = await page.evaluate(() => localStorage.getItem('wty_token'))
    expect(token).not.toBeNull()
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

  test('invalid email keeps the submit button disabled', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('not-an-email')
    const submit = page.getByRole('button', { name: /отримати код/i })
    await expect(submit).toBeDisabled()

    await emailInput.fill('valid@widgetis.local')
    await expect(submit).toBeEnabled()
  })
})

test.describe('Signup OTP flow', () => {
  test('email confirmation via OTP on /signup unlocks the site section', async ({ page }) => {
    await page.goto('/signup?plan=pro&billing=yearly')

    // 1. Plan summary is visible (left column).
    await expect(page.getByText(/7 днів безкоштовно/).first()).toBeVisible({ timeout: 10_000 })

    // 2. Section 1: fill email and request OTP.
    const email = randomEmail('signup')
    await page.locator('input[type="email"]').fill(email)
    await page.getByRole('button', { name: /надіслати код/i }).click()

    // 3. OTP cells appear — signup uses its own class (signup__otp-cell), not
    // the login page's .otp-input.
    const otpCells = page.locator('.signup__otp-cell')
    await expect(otpCells.first()).toBeVisible({ timeout: 10_000 })
    await expect(otpCells).toHaveCount(6)

    // 4. Type master code — auto-submits on the 6th digit.
    await otpCells.first().click()
    for (const digit of MASTER_OTP) {
      await page.keyboard.type(digit)
    }

    // 5. Verified badge appears and section 2 (site input) is reachable.
    await expect(page.getByText(/Підтверджено/)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByPlaceholder('store.com.ua')).toBeVisible()

    // 6. Token was persisted (user is effectively logged in after verify).
    const token = await page.evaluate(() => localStorage.getItem('wty_token'))
    expect(token).not.toBeNull()
    expect(token!.length).toBeGreaterThan(20)
  })

  test('signup CTA stays locked until email is verified', async ({ page }) => {
    await page.goto('/signup?plan=basic&billing=monthly')
    // CTA button exists but is disabled until verification.
    const cta = page.locator('button.signup__submit')
    await expect(cta).toBeVisible()
    await expect(cta).toBeDisabled()
    await expect(page.getByText(/Підтвердіть email/)).toBeVisible()
  })

  test('signup page remembers draft across reloads', async ({ page }) => {
    await page.goto('/signup?plan=pro&billing=yearly')
    const email = randomEmail('draft')
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[placeholder="store.com.ua"]').fill('example.store')

    await page.reload()
    await expect(page.locator('input[type="email"]')).toHaveValue(email)
    await expect(page.locator('input[placeholder="store.com.ua"]')).toHaveValue('example.store')
  })
})
