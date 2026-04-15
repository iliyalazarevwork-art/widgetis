import { test, expect } from '@playwright/test'

/**
 * Full account lifecycle against the LOCAL dev stack:
 *
 *   1. Open /signup, type a random email, get OTP form.
 *   2. Type master code 121212 (only valid in non-production — the
 *      OtpService guard makes this inert on prod).
 *   3. Confirm we're authenticated: JWT in localStorage, /api/v1/auth/user
 *      returns the same email, role=customer.
 *   4. Delete the user via the profile DELETE endpoint (real flow the
 *      user would trigger from the "delete account" button).
 *   5. Re-attempt /api/v1/auth/user with the now-revoked token — must 401.
 *   6. Re-create an account with the same email to verify cleanup was
 *      total (otherwise DB unique constraint would blow up).
 *
 * This covers: signup UI wiring, OTP verify, JWT issuance, profile read,
 * profile delete, and post-delete auth invalidation — one pass, one
 * assertion per checkpoint.
 *
 * Requires OTP_DEV_BYPASS=true on the local backend. This is never true
 * on prod (OtpService has a hard env guard), and this spec is excluded
 * from prod-smoke via playwright.config.ts.
 */

const MASTER_OTP = '121212'

function randomEmail(prefix = 'lifecycle'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@widgetis.local`
}

test.describe('real account lifecycle', () => {
  test('signup → authenticate → read profile → delete → re-register', async ({ page, request }) => {
    const email = randomEmail()

    // ── 1. Signup flow via the UI ──────────────────────────────────────
    await page.goto('/signup?plan=pro&billing=yearly')

    await page.locator('input[type="email"]').fill(email)
    await page.getByRole('button', { name: /надіслати код/i }).click()

    // OTP cells render — signup page uses .signup__otp-cell
    const otpCells = page.locator('.signup__otp-cell')
    await expect(otpCells).toHaveCount(6, { timeout: 10_000 })
    await otpCells.first().click()
    for (const digit of MASTER_OTP) {
      await page.keyboard.type(digit)
    }

    // Verified badge proves verify succeeded.
    await expect(page.getByText(/Підтверджено/)).toBeVisible({ timeout: 10_000 })

    // JWT is persisted under the agreed localStorage key.
    const token = await page.evaluate(() => localStorage.getItem('wty_token'))
    expect(token, 'no JWT stored after OTP verify').not.toBeNull()
    expect(token!.length).toBeGreaterThan(20)

    // ── 2. Read profile with the token ─────────────────────────────────
    const profileResponse = await request.get('/api/v1/auth/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(profileResponse.status(), `auth/user returned ${profileResponse.status()}`).toBe(200)

    const profileBody = await profileResponse.json()
    expect(profileBody.data.email).toBe(email)
    expect(profileBody.data.role).toBe('customer')

    // ── 3. Delete the account ──────────────────────────────────────────
    const deleteResponse = await request.delete('/api/v1/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(
      [200, 204].includes(deleteResponse.status()),
      `delete /api/v1/profile returned ${deleteResponse.status()}`,
    ).toBe(true)

    // ── 4. Token is useless after deletion ─────────────────────────────
    const afterDelete = await request.get('/api/v1/auth/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(
      afterDelete.status(),
      `deleted user's token still returned ${afterDelete.status()}`,
    ).toBe(401)

    // ── 5. Re-register with the same email succeeds ────────────────────
    // If the previous delete was a soft-delete leaving a unique-index
    // conflict, the next OTP verify would 500 or 422. A clean 200 here
    // proves the delete was total at the DB level.
    const resend = await request.post('/api/v1/auth/otp', {
      data: { email },
    })
    expect(resend.status(), `/auth/otp after delete returned ${resend.status()}`).toBe(200)

    const reverify = await request.post('/api/v1/auth/otp/verify', {
      data: { email, code: MASTER_OTP },
    })
    expect(
      reverify.status(),
      `/auth/otp/verify after delete returned ${reverify.status()} — leftover row?`,
    ).toBe(200)

    const reverifyBody = await reverify.json()
    expect(reverifyBody.token).toBeTruthy()
    expect(reverifyBody.user.email).toBe(email)

    // ── 6. Cleanup: delete the freshly-re-created user too ─────────────
    const cleanup = await request.delete('/api/v1/profile', {
      headers: { Authorization: `Bearer ${reverifyBody.token}` },
    })
    expect([200, 204]).toContain(cleanup.status())
  })

  test('admin account cannot be deleted via customer profile endpoint', async ({ request }) => {
    // Admin has role=admin; /api/v1/profile is gated by role:customer.
    // Deleting an admin via the customer delete must come back 403.
    const adminOtp = await request.post('/api/v1/auth/otp', {
      data: { email: 'admin@widgetis.com' },
    })
    expect(adminOtp.status()).toBe(200)

    const adminVerify = await request.post('/api/v1/auth/otp/verify', {
      data: { email: 'admin@widgetis.com', code: MASTER_OTP },
    })
    expect(adminVerify.status()).toBe(200)

    const adminToken = (await adminVerify.json()).token

    const deleteAdmin = await request.delete('/api/v1/profile', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    expect(
      deleteAdmin.status(),
      'admin account must NOT be deletable through /api/v1/profile (role=customer gate)',
    ).toBe(403)
  })

  test('profile delete without auth returns 401, never 500', async ({ request }) => {
    const res = await request.delete('/api/v1/profile')
    expect(res.status()).toBe(401)
  })

  test('cannot read a freshly-deleted users data by re-using its token', async ({ request }) => {
    const email = randomEmail('revoke')

    // Register
    await request.post('/api/v1/auth/otp', { data: { email } })
    const verify = await request.post('/api/v1/auth/otp/verify', {
      data: { email, code: MASTER_OTP },
    })
    const token = (await verify.json()).token

    // Read works
    const pre = await request.get('/api/v1/auth/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(pre.status()).toBe(200)

    // Delete
    await request.delete('/api/v1/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })

    // Read now 401 (and specifically not 500 — the pipeline must handle
    // "user_id in JWT points to a missing row" gracefully).
    const post = await request.get('/api/v1/auth/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(post.status()).toBe(401)
  })
})
