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
//
// Key failure modes we guard against:
//   1. JS/CSS chunk 404 — deploy uploaded new assets but old HTML still cached
//      (or vice versa). React lazy() silently shows nothing; #root stays non-empty
//      because the shell nav renders fine. We intercept HTTP responses for
//      /assets/*.js|css and fail immediately on any 404.
//   2. pageerror / console.error — unhandled exceptions, including the
//      "Failed to fetch dynamically imported module" that accompanies #1.
//   3. White screen behind a valid shell — caught by the per-page
//      `requiredSelector` that every public route now carries.
//
// waitUntil:'networkidle' ensures all async module fetches have settled
// before we read the error lists. The default 'load' fires too early and
// lets dynamic-import 404s escape undetected.
async function assertPageOk(page: Page, path: string, requiredSelector?: string) {
  const errors: string[] = []
  const failedChunks: string[] = []

  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('response', (resp) => {
    if (resp.status() === 404 && /\/assets\/[^/]+\.(js|css)(\?|$)/.test(resp.url())) {
      failedChunks.push(`404 ${resp.url()}`)
    }
  })

  const response = await page.goto(path, { waitUntil: 'networkidle' })
  expect(response?.status(), `${path} returned ${response?.status()}`).toBeLessThan(400)

  // React must have mounted *something* — root div should not be empty.
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10_000 })

  // If a requiredSelector is given, the lazy chunk for this route must have
  // rendered its own content — not just the shared shell/nav.
  if (requiredSelector) {
    await expect(
      page.locator(requiredSelector).first(),
      `${path}: requiredSelector "${requiredSelector}" not visible — the page chunk likely failed to load`,
    ).toBeVisible({ timeout: 10_000 })
  }

  expect(
    failedChunks,
    `${path}: JS/CSS chunks returned 404.\n` +
      `This usually means a new deploy uploaded assets with new hashes but the ` +
      `old HTML shell (cached by Caddy/CDN) still references old hashes — or vice versa.\n` +
      failedChunks.join('\n'),
  ).toEqual([])

  const fatal = errors.filter(
    (e) => !/google-analytics|fonts\.googleapis|adsbygoogle|favicon|gtag|doubleclick/i.test(e),
  )
  expect(fatal, `${path}: JS errors detected:\n${fatal.join('\n')}`).toEqual([])
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

  // ── Public pages: render + no JS errors + page-specific content ────────────
  // One test per page so a single bad route doesn't mask the others.
  //
  // `requiredSelector` must match an element that only the lazy page chunk
  // renders — not the shared shell. This is the main guard against a silent
  // white screen caused by a broken dynamic import.
  const publicPages: Array<{ path: string; title?: RegExp; requiredSelector?: string }> = [
    { path: '/', title: /widgetis/i, requiredSelector: 'a[href*="/pricing"]' },
    { path: '/widgets', requiredSelector: 'a[href*="/pricing?plan="]' },
    { path: '/pricing', requiredSelector: '[class*="pricing"], [class*="plan"], h1, h2' },
    { path: '/signup', requiredSelector: 'input[type="email"]' },
    { path: '/signup?plan=pro&billing=yearly', requiredSelector: 'input[type="email"]' },
    { path: '/demo', requiredSelector: 'iframe, [class*="demo"], input, button' },
    { path: '/contacts', requiredSelector: '[class*="contact"], h1, h2' },
    { path: '/cases', requiredSelector: '[class*="case"], h1, h2' },
    { path: '/license', requiredSelector: 'h1, h2, p' },
    { path: '/offer', requiredSelector: 'h1, h2, p' },
    { path: '/refund', requiredSelector: 'h1, h2, p' },
    { path: '/security', requiredSelector: 'h1, h2, p' },
  ]

  for (const { path, title, requiredSelector } of publicPages) {
    test(`public page renders: ${path}`, async ({ page }) => {
      await assertPageOk(page, path, requiredSelector)
      if (title) await expect(page).toHaveTitle(title)
    })
  }

  test('production analytics file is wired into the SPA shell', async ({ request }) => {
    const homeRes = await request.get(spaUrl('/'))
    expect(homeRes.status(), 'home page should be reachable').toBeLessThan(400)

    const html = await homeRes.text()
    expect(html, 'production HTML must load the local analytics bootstrap').toContain(
      '<script defer src="/analytics.js"></script>',
    )

    const analyticsRes = await request.get(spaUrl('/analytics.js'))
    expect(analyticsRes.status(), 'analytics.js should be served by the frontend').toBe(200)

    const contentType = (analyticsRes.headers()['content-type'] ?? '').toLowerCase()
    expect(contentType, 'analytics.js should be served as JavaScript').toContain('javascript')

    const script = await analyticsRes.text()
    expect(script).toContain("var gaMeasurementId = 'G-3CQ7CLTR6H'")
    expect(script).toContain("var clarityProjectId = 'wk1dnqivth'")
    expect(script).toContain('https://www.googletagmanager.com/gtag/js?id=')
    expect(script).toContain('https://www.clarity.ms/tag/')
  })

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
    // CTA "Почати N днів безкоштовно" — disabled until verification, but must render.
    await expect(page.getByRole('button', { name: /Почати \d+ днів/i })).toBeVisible()
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
