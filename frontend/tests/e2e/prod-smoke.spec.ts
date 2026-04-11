import { test, expect } from '@playwright/test'

/**
 * Post-deploy smoke tests.
 *
 * Run against https://widgetis.com (or whatever E2E_BASE_URL points to).
 * MUST NOT require auth, MUST NOT mutate state, MUST NOT depend on
 * OTP_DEV_BYPASS (which is local-only).
 *
 * If any of these red — the deploy is broken.
 */
test.describe('prod-smoke', () => {
  test('GET /api/v1/health returns 200', async ({ request }) => {
    const res = await request.get('/api/v1/health')
    expect(res.status(), `expected 200 from /api/v1/health, got ${res.status()}`).toBe(200)
  })

  test('GET /api/v1/plans returns at least one plan', async ({ request }) => {
    const res = await request.get('/api/v1/plans')
    expect(res.ok(), `plans endpoint failed: ${res.status()}`).toBe(true)

    const body = await res.json()
    const data = body?.data ?? body
    expect(Array.isArray(data) || typeof data === 'object').toBe(true)

    const plans = Array.isArray(data) ? data : data?.data
    expect(Array.isArray(plans), `plans payload not an array: ${JSON.stringify(body).slice(0, 200)}`).toBe(true)
    expect(plans.length).toBeGreaterThan(0)
  })

  test('GET /api/v1/settings returns 200', async ({ request }) => {
    const res = await request.get('/api/v1/settings')
    expect(res.status()).toBe(200)
  })

  test('home page renders without server error', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status(), `home page returned ${response?.status()}`).toBeLessThan(400)
    await expect(page).toHaveTitle(/widgetis/i)
  })

  test('login page renders the email form', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 })
  })

  test('pricing page renders', async ({ page }) => {
    const response = await page.goto('/pricing')
    expect(response?.status()).toBeLessThan(400)
  })

  test('Google OAuth callback endpoint does not 500 with no params', async ({ request }) => {
    // The whole point of this morning's incident: a missing morph map
    // returned 500 when this URL was hit. The endpoint should redirect
    // (302) when called without a valid grant — never crash.
    const res = await request.get('/auth/google/callback', { maxRedirects: 0 })
    expect(res.status(), `expected redirect, got ${res.status()}`).toBeGreaterThanOrEqual(300)
    expect(res.status()).toBeLessThan(500)
  })
})
