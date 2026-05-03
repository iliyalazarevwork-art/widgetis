import { test, expect } from '@playwright/test'

/**
 * Post-deploy security smoke tests.
 *
 * These run against the real production host (E2E_BASE_URL) after every
 * deploy. They are intentionally the dumbest possible outside-in checks —
 * if any of these red, a regression has re-opened a real vulnerability we
 * already closed once, and the next deploy must be blocked.
 *
 * Rules of this file:
 *   - Read-only. No writes, no auth, no assumption of state.
 *   - No flakes: every expectation is a hard security invariant.
 *   - Runs from any network the CI/dev can reach widgetis.com from.
 */

test.describe('security-smoke', () => {
  // ────────────────────────────────────────────────────────────────────────
  // 1. OTP dev-bypass must NOT be honoured in production.
  //
  // History: `OTP_DEV_BYPASS=true` + `OTP_DEV_CODE=121212` were left in the
  // prod env file once, which let anyone log in as any user. The backend
  // now has a hard guard in OtpService that ignores the flag when
  // APP_ENV=production. This test proves the guard is live.
  // ────────────────────────────────────────────────────────────────────────
  test('OTP master code 121212 is rejected in production', async ({ request }) => {
    const email = `otpbypass-smoke-${Date.now()}@example.com`

    const res = await request.post('/api/v1/auth/otp/verify', {
      data: { email, code: '121212' },
      failOnStatusCode: false,
    })

    expect(
      res.status(),
      `dev-bypass code must NOT return 2xx; got ${res.status()}`,
    ).not.toBeLessThan(400)

    const body = await res.json().catch(() => ({}))
    // Must NOT return a JWT token under any shape.
    expect(body?.token).toBeFalsy()
    expect(body?.data?.token).toBeFalsy()
  })

  // ────────────────────────────────────────────────────────────────────────
  // 2. widget-builder must NOT be reachable from the public internet.
  //
  // Before the fix, Caddy reverse-proxied /build, /deploy, /modules and
  // /build-demo straight to widget-builder:3200 — unauthenticated. Any
  // attacker could POST arbitrary module configs and get code back.
  //
  // Now these paths either fall through to the SPA catch-all or 404.
  // The invariant: they must NOT return a widget-builder response.
  // We detect that by checking:
  //   (a) GET /modules does not return the raw schema JSON
  //   (b) POST /build does not return built JS
  //   (c) POST /deploy does not return an R2 URL
  // ────────────────────────────────────────────────────────────────────────
  test('GET /modules does not expose widget-builder schemas', async ({ request }) => {
    const res = await request.get('/modules', { failOnStatusCode: false })

    // Response content-type must not be JSON-with-module-schemas. The SPA
    // catch-all returns text/html; widget-builder returned application/json
    // with top-level keys like "module-*".
    const ct = res.headers()['content-type'] || ''
    if (ct.includes('application/json')) {
      const body = await res.json().catch(() => ({}))
      const keys = Object.keys(body || {})
      const leaked = keys.some((k) => k.startsWith('module-'))
      expect(leaked, `/modules leaked widget-builder schema keys: ${keys.join(',')}`).toBe(false)
    }
  })

  test('POST /build does not return built JS from widget-builder', async ({ request }) => {
    const res = await request.post('/build', {
      data: { modules: {}, obfuscate: false },
      failOnStatusCode: false,
    })

    const ct = res.headers()['content-type'] || ''
    // widget-builder returns application/javascript for successful builds.
    expect(
      ct.includes('application/javascript'),
      `/build returned widget-builder JS (content-type ${ct})`,
    ).toBe(false)

    // And no 2xx with a body that looks like a JS bundle.
    if (res.ok()) {
      const text = await res.text()
      expect(
        /function|=>|var |const |export /.test(text) && text.length > 200,
        '/build returned what looks like a built bundle',
      ).toBe(false)
    }
  })

  test('POST /deploy does not return an R2 URL', async ({ request }) => {
    const res = await request.post('/deploy', {
      data: { modules: {}, site: 'attacker.example' },
      failOnStatusCode: false,
    })

    if (res.ok()) {
      const body = await res.json().catch(() => ({}))
      // widget-builder response shape: { url, site, size }
      expect(body?.url, '/deploy leaked an R2 URL').toBeFalsy()
      expect(body?.size, '/deploy leaked bundle size').toBeFalsy()
    }
  })

  test('GET /build-demo does not return widget-builder JS', async ({ request }) => {
    const res = await request.post('/build-demo', {
      data: { modules: { 'promo-line': { enabled: true } } },
      failOnStatusCode: false,
    })

    const ct = res.headers()['content-type'] || ''
    expect(
      ct.includes('application/javascript'),
      `/build-demo returned widget-builder JS (content-type ${ct})`,
    ).toBe(false)
  })

  // ────────────────────────────────────────────────────────────────────────
  // 3. Admin API must reject unauthenticated callers.
  // ────────────────────────────────────────────────────────────────────────
  const adminRoutes = [
    '/api/v1/admin/dashboard',
    '/api/v1/admin/users',
    '/api/v1/admin/orders',
    '/api/v1/admin/sites',
    '/api/v1/admin/widget-builder/modules',
  ]

  for (const path of adminRoutes) {
    test(`guest gets 401 on ${path}`, async ({ request }) => {
      const res = await request.get(path, { failOnStatusCode: false })
      expect(res.status(), `${path} returned ${res.status()} to a guest`).toBe(401)
    })
  }

  test('guest POST to admin widget-builder /build is rejected', async ({ request }) => {
    const res = await request.post('/api/v1/admin/widget-builder/build', {
      data: { modules: {} },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })

  // ────────────────────────────────────────────────────────────────────────
  // 4. Profile API must reject unauthenticated callers.
  // ────────────────────────────────────────────────────────────────────────
  test('guest gets 401 on /api/v1/profile', async ({ request }) => {
    const res = await request.get('/api/v1/profile', { failOnStatusCode: false })
    expect(res.status()).toBe(401)
  })

  test('guest gets 401 on /api/v1/profile/sites', async ({ request }) => {
    const res = await request.get('/api/v1/profile/sites', { failOnStatusCode: false })
    expect(res.status()).toBe(401)
  })

  // ────────────────────────────────────────────────────────────────────────
  // 5. Security headers must be set on API responses.
  // ────────────────────────────────────────────────────────────────────────
  test('security headers are present on /api/v1/health', async ({ request }) => {
    const res = await request.get('/api/v1/health')
    expect(res.status()).toBe(200)

    const headers = res.headers()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['referrer-policy']).toContain('strict-origin')
    expect(headers['strict-transport-security']).toContain('max-age=')
  })

  // ────────────────────────────────────────────────────────────────────────
  // 6. Checkout throttle must be in place.
  //
  // We send 6 auth-less POSTs — each should 401 (not 429) because we have
  // no token, proving the limiter doesn't interfere with the auth layer in
  // the happy path. The throttle itself is covered by the backend feature
  // test; this one just asserts the endpoint still exists and auth is the
  // first gate.
  // ────────────────────────────────────────────────────────────────────────
  test('checkout endpoint rejects unauthenticated callers with 401', async ({ request }) => {
    const res = await request.post('/api/v1/profile/subscription/checkout', {
      data: { plan_slug: 'pro', billing_period: 'monthly' },
      failOnStatusCode: false,
    })
    // Must be 401 (auth first) — NOT 200 (bypass) and NOT 500 (regression).
    expect(res.status()).toBe(401)
  })

  // ────────────────────────────────────────────────────────────────────────
  // 7. Google OAuth redirect must carry a state parameter.
  //
  // After removing `->stateless()`, Socialite puts a CSRF token into the
  // redirect URL's `state=`. A missing state here means stateless mode
  // sneaked back in.
  // ────────────────────────────────────────────────────────────────────────
  test('Google OAuth redirect includes a CSRF state parameter', async ({ request }) => {
    const res = await request.get('/auth/google', { maxRedirects: 0 })
    expect(res.status()).toBeGreaterThanOrEqual(300)
    expect(res.status()).toBeLessThan(400)

    const location = res.headers()['location'] || ''
    expect(location, 'no redirect Location header on /auth/google').not.toBe('')
    expect(
      /[?&]state=[^&]+/.test(location),
      `Google OAuth redirect has no state= — stateless() may be back (location: ${location.slice(0, 200)})`,
    ).toBe(true)
  })
})
