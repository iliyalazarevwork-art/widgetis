import { test, expect, type Page } from '@playwright/test'
import { hasSeparateApiHost, hosts } from './hosts'

/**
 * Post-deploy smoke tests.
 *
 * Run against https://widgetis.com (or whatever E2E_BASE_URL points to).
 * MUST NOT require auth, MUST NOT mutate state, MUST NOT depend on
 * OTP_DEV_BYPASS (which is local-only).
 *
 * If any of these red — the deploy is broken.
 */

// In production the SPA lives on widgetis.com and the JSON API on
// api.widgetis.com — two separate origins. If we hit /api/v1/* relative
// to the SPA host we get a 200 HTML shell (the SPA fallback) which
// silently makes API tests pass without ever touching the API.
//
// Host map (SPA / API / preview / manage) is centralised in ./hosts.ts —
// edit there to rebrand or point at staging.
const apiUrl = (path: string) => hosts().api + path
const spaUrl = (path: string) => hosts().spa + path

async function expectJsonContentType(res: { headers(): Record<string, string>; status(): number }, path: string) {
  const ct = res.headers()['content-type'] ?? ''
  expect(
    ct.toLowerCase(),
    `${path} returned non-JSON content-type "${ct}" (status ${res.status()}). ` +
      `If this is HTML, the request was almost certainly served by the SPA, not the API.`,
  ).toContain('application/json')
}

// A page is "OK" if it didn't 5xx and the document actually parsed a body.
// We also fail on JS errors that aren't third-party noise, so a silent white
// screen doesn't slip through.
async function assertPageOk(page: Page, path: string) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  const response = await page.goto(path)
  expect(response?.status(), `${path} returned ${response?.status()}`).toBeLessThan(400)

  // React must have mounted *something* — root div should not be empty.
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10_000 })

  const fatal = errors.filter(
    (e) => !/google-analytics|fonts\.googleapis|adsbygoogle|favicon|gtag|doubleclick/i.test(e),
  )
  expect(fatal, `${path}: ${fatal.join('\n')}`).toEqual([])
}

test.describe('prod-smoke', () => {
  // ── API health ────────────────────────────────────────────────────────────
  // Every assertion below also checks content-type=application/json. Without
  // that check the SPA fallback (text/html, 200) would silently make these
  // tests pass even when the API is misrouted or completely down.
  test('GET /api/v1/health returns 200 JSON', async ({ request }) => {
    const url = apiUrl('/api/v1/health')
    const res = await request.get(url)
    expect(res.status(), `expected 200 from ${url}, got ${res.status()}`).toBe(200)
    await expectJsonContentType(res, url)
  })

  test('GET /api/v1/plans returns at least one plan', async ({ request }) => {
    const url = apiUrl('/api/v1/plans')
    const res = await request.get(url)
    expect(res.ok(), `plans endpoint failed: ${res.status()}`).toBe(true)
    await expectJsonContentType(res, url)

    const body = await res.json()
    const data = body?.data ?? body
    expect(Array.isArray(data) || typeof data === 'object').toBe(true)

    const plans = Array.isArray(data) ? data : data?.data
    expect(Array.isArray(plans), `plans payload not an array: ${JSON.stringify(body).slice(0, 200)}`).toBe(true)
    expect(plans.length).toBeGreaterThan(0)
  })

  test('GET /api/v1/settings returns 200 JSON', async ({ request }) => {
    const url = apiUrl('/api/v1/settings')
    const res = await request.get(url)
    expect(res.status()).toBe(200)
    await expectJsonContentType(res, url)
  })

  // Guard against the false-positive class that broke today's deploy:
  // if /api/v1/* on the SPA host ever stops returning HTML and starts
  // returning real JSON, our routing has changed and this test will
  // catch it. Conversely, if api.widgetis.com starts returning HTML,
  // the JSON tests above will catch it. Belt + suspenders.
  // Filament admin panel was removed — manage.* must not serve a working
  // app anymore. Either Caddy returns no certificate (TLS handshake fails)
  // or the request errors out at connect. Anything else means the panel
  // is back up by accident.
  test('manage subdomain is dead (Filament admin removed)', async ({ request }) => {
    if (!hasSeparateApiHost()) test.skip(true, 'only meaningful in deployed env')

    const manageUrl = hosts().manage + '/login'
    let reachable = false
    try {
      const res = await request.get(manageUrl, { maxRedirects: 0, timeout: 5_000 })
      // Caddy with no matching site_block returns 308 from default catch-all
      // OR connection fails. Either way: NOT a 200 with HTML form.
      reachable = res.status() < 400
    } catch {
      reachable = false
    }
    expect(reachable, `${manageUrl} answered like a live app — Filament must be fully removed`).toBe(false)
  })

  test('SPA host does not pretend to serve the JSON API', async ({ request }) => {
    if (!hasSeparateApiHost()) test.skip(true, 'only meaningful when SPA + API are on different origins')

    const res = await request.get(spaUrl('/api/v1/plans'))
    const ct = (res.headers()['content-type'] ?? '').toLowerCase()
    expect(
      ct.includes('text/html'),
      `${hosts().spa}/api/v1/plans should fall through to the SPA shell (text/html), got "${ct}". ` +
        `If this changed, the API may now be reachable via the SPA host — update routing assumptions.`,
    ).toBe(true)
  })

  // ── Public pages: render + no JS errors ──────────────────────────────────
  // One test per page so a single bad route doesn't mask the others.
  const publicPages: Array<{ path: string; title?: RegExp }> = [
    { path: '/', title: /widgetis/i },
    { path: '/widgets' },
    { path: '/pricing' },
    { path: '/signup' },
    { path: '/signup?plan=pro&billing=yearly' },
    { path: '/demo' },
    { path: '/contacts' },
    { path: '/cases' },
    { path: '/license' },
    { path: '/offer' },
    { path: '/refund' },
    { path: '/security' },
  ]

  for (const { path, title } of publicPages) {
    test(`public page renders: ${path}`, async ({ page }) => {
      await assertPageOk(page, path)
      if (title) await expect(page).toHaveTitle(title)
    })
  }

  // ── Page-specific content ────────────────────────────────────────────────
  test('home page exposes main nav links', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('link', { name: 'Тарифи' }).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('login page renders the email form', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 })
  })

  test('login page exposes Google sign-in button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })

  test('signup page renders the email field and plan summary', async ({ page }) => {
    await page.goto('/signup?plan=pro&billing=yearly')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 })
    // CTA "Почати 7 днів безкоштовно" — disabled until verification, but must render.
    await expect(page.getByRole('button', { name: /Почати 7 днів/i })).toBeVisible()
    // Plan summary block (left column) must render the trial badge.
    await expect(page.locator('.signup__trial-badge')).toBeVisible()
  })

  test('pricing page shows plan cards', async ({ page }) => {
    await page.goto('/pricing')
    // At least one plan name should appear.
    await expect(page.getByText(/Basic|Pro|Max/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('widgets page renders the plan cards section', async ({ page }) => {
    await page.goto('/widgets')
    // The widgets landing page includes a CTA strip linking to /pricing with
    // the three plan names — that proves the page hydrated past its hero.
    await expect(page.locator('a[href*="/pricing?plan="]').first()).toBeVisible({ timeout: 10_000 })
  })

  // ── Protected routes: must redirect, never crash ─────────────────────────
  test('/cabinet redirects to /login when unauthenticated', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/cabinet')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('/admin redirects to /login when unauthenticated', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('/login/otp redirects to /login when accessed without email state', async ({ page }) => {
    await page.goto('/login/otp')
    await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 })
  })

  // ── Backend edge cases we've been burned by ──────────────────────────────
  test('Google OAuth callback endpoint does not 500 with no params', async ({ request }) => {
    // The whole point of this morning's incident: a missing morph map
    // returned 500 when this URL was hit. The endpoint should redirect
    // (302) when called without a valid grant — never crash.
    const url = apiUrl('/auth/google/callback')
    const res = await request.get(url, { maxRedirects: 0 })
    expect(res.status(), `expected redirect from ${url}, got ${res.status()}`).toBeGreaterThanOrEqual(300)
    expect(res.status()).toBeLessThan(500)
  })

  test('unknown route does not 500', async ({ page }) => {
    // Prod may return its own 404 shell (not the SPA) — we only guard
    // against 5xx here.
    const response = await page.goto('/definitely-does-not-exist-xyz')
    expect(response?.status()).toBeLessThan(500)
  })
})
