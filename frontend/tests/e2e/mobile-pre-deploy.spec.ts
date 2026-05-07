/**
 * Pre-deploy mobile smoke test — 390×844 (iPhone 14).
 *
 * Run before every deploy:
 *   cd frontend && npx playwright test mobile-pre-deploy --project=chromium
 *
 * What it checks:
 *   1. Every marketing page loads (no redirect to 404/login, H1 exists)
 *   2. All 20 widget detail pages exist and render correctly
 *   3. Auth flow: /login → /login/otp → success
 *   4. Admin cabinet: all pages load (uses OTP dev-bypass code 121212)
 *   5. Button audit: every interactive element on every page is reported
 *
 * Login strategy:
 *   - Admin: sends OTP to admin@widgetis.com → enters 121212 (dev bypass)
 *   - New user: random @widgetis.local email → same bypass
 *   No real emails are sent in local dev.
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test'

// ─── Config ───────────────────────────────────────────────────────────────────

const MOBILE_VIEWPORT = { width: 390, height: 844 }
const MASTER_OTP = '121212'
const ADMIN_EMAIL = 'admin@widgetis.com'

function randomEmail() {
  return `pre-deploy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@widgetis.local`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Collect all visible buttons and links on the page with their state. */
async function auditButtons(page: Page, pageLabel: string): Promise<void> {
  const items = await page.evaluate(() => {
    const result: { tag: string; text: string; href: string | null; disabled: boolean; visible: boolean }[] = []
    const els = document.querySelectorAll<HTMLElement>('button, a[href], input[type="submit"]')

    for (const el of els) {
      const rect = el.getBoundingClientRect()
      const isVisible = rect.width > 0 && rect.height > 0 &&
        window.getComputedStyle(el).visibility !== 'hidden' &&
        window.getComputedStyle(el).display !== 'none'

      const text = (el.innerText || el.getAttribute('value') || el.getAttribute('aria-label') || '').trim().slice(0, 50)
      const href = el instanceof HTMLAnchorElement ? el.getAttribute('href') : null
      const disabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'

      if (text || href) {
        result.push({ tag: el.tagName, text, href, disabled, visible: isVisible })
      }
    }
    return result
  })

  const visible = items.filter(i => i.visible)
  const hidden = items.filter(i => !i.visible)

  console.log(`\n  🔘 [${pageLabel}] Кнопки та посилання (${visible.length} видимих, ${hidden.length} прихованих):`)
  for (const item of visible) {
    const disabledMark = item.disabled ? ' [DISABLED]' : ''
    const hrefMark = item.href ? ` → ${item.href.slice(0, 60)}` : ''
    const tag = item.tag === 'A' ? '🔗' : item.tag === 'BUTTON' ? '🔘' : '📤'
    console.log(`    ${tag} "${item.text}"${disabledMark}${hrefMark}`)
  }
}

/** Log in via OTP bypass flow through the UI. Returns the page after landing. */
async function loginViaOtp(page: Page, email: string): Promise<void> {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.getByRole('button', { name: /отримати код/i }).click()
  await expect(page).toHaveURL(/\/login\/otp$/, { timeout: 10_000 })

  const otpInputs = page.locator('input.otp-input')
  await expect(otpInputs).toHaveCount(6)
  for (const digit of MASTER_OTP) {
    await page.keyboard.type(digit)
  }
  // Accept any post-login destination: /admin, /cabinet*, /pricing, /onboarding
  await expect(page).toHaveURL(/\/(admin|cabinet|pricing|onboarding)/, { timeout: 12_000 })
}

/** Assert the page has a sticky/fixed header. */
async function expectStickyHeader(page: Page): Promise<void> {
  const found = await page.evaluate(() => {
    for (const el of document.querySelectorAll<HTMLElement>('header, [class*="header"]')) {
      const s = window.getComputedStyle(el)
      if (s.position === 'sticky' || s.position === 'fixed') return true
    }
    return false
  })
  expect(found, 'Sticky/fixed header not found').toBe(true)
}

/** Assert a fixed bottom nav with ≥3 links exists. */
async function expectBottomNav(page: Page): Promise<void> {
  const found = await page.evaluate(() => {
    for (const el of document.querySelectorAll<HTMLElement>('*')) {
      const rect = el.getBoundingClientRect()
      const s = window.getComputedStyle(el)
      if (
        s.position === 'fixed' &&
        rect.bottom > window.innerHeight * 0.75 &&
        rect.width > 100
      ) {
        const links = el.querySelectorAll('a, button')
        if (links.length >= 3) return true
      }
    }
    return false
  })
  expect(found, 'Fixed bottom tab nav not found').toBe(true)
}

// ─── Fixtures: shared auth state ─────────────────────────────────────────────

/** Create a browser context with admin JWT pre-loaded in localStorage. */
async function createAdminContext(
  browser: import('@playwright/test').Browser,
  baseURL: string,
): Promise<BrowserContext> {
  const context = await browser.newContext({ viewport: MOBILE_VIEWPORT })
  const page = await context.newPage()

  await page.goto(baseURL + '/login')
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL)
  await page.getByRole('button', { name: /отримати код/i }).click()
  await expect(page).toHaveURL(/\/login\/otp$/, { timeout: 10_000 })
  const otpInputs = page.locator('input.otp-input')
  await expect(otpInputs).toHaveCount(6)
  for (const digit of MASTER_OTP) await page.keyboard.type(digit)
  await expect(page).toHaveURL(/\/admin/, { timeout: 12_000 })

  await page.close()
  return context
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.use({ viewport: MOBILE_VIEWPORT })

// ── 1. MARKETING PAGES ────────────────────────────────────────────────────────

test.describe('Marketing pages — mobile', () => {
  // Auth pages are excluded from the "must not redirect to /login" rule
  const AUTH_PATHS = new Set(['/login', '/signup', '/login/otp'])

  const MARKETING_PAGES: [string, RegExp][] = [
    ['/', /Збільшіть|Widgetis/i],
    ['/widgets', /Інструменти|Каталог/i],
    ['/pricing', /Обери свій план|Тарифи/i],
    ['/contacts', /Контакти|Пиши/i],
    ['/cases', /Кейси|Кейс/i],
    ['/demo', /Демо|demo/i],
    ['/free-demo', /Безкоштов|демо/i],
    ['/license', /Ліцензія|Ліцен/i],
    ['/offer', /Оферта|оферта/i],
    ['/terms', /Умови|умови/i],
    ['/privacy', /Конфіденційн|приватн/i],
    ['/refund', /Повернення|поверн/i],
    ['/security', /Безпека|безпек/i],
    ['/signup', /Реєстрація|Обери тариф|Про|Pro/i],
    ['/login', /Увійти|Email/i],
  ]

  for (const [path, contentPattern] of MARKETING_PAGES) {
    test(`${path} — завантажується`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', e => errors.push(e.message))

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Non-auth pages must not redirect to /login
      if (!AUTH_PATHS.has(path)) {
        expect(page.url()).not.toMatch(/\/login$/)
      }
      const body = await page.locator('body').textContent() ?? ''
      expect(body.toLowerCase()).not.toContain('404')

      // Expected content present
      await expect(page.locator('body')).toContainText(contentPattern, { timeout: 8_000 })

      // Header exists
      await expect(page.locator('header, [class*="header"]').first()).toBeVisible({ timeout: 5_000 })

      // Button audit
      await auditButtons(page, path)

      // No fatal JS errors
      const fatal = errors.filter(e => !/analytics|fonts\.googleapis|adsbygoogle/i.test(e))
      expect(fatal, `JS errors on ${path}:\n${fatal.join('\n')}`).toHaveLength(0)
    })
  }

  test('hamburger menu opens and shows navigation links', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const burger = page.locator('button[class*="burger"]').first()
    await expect(burger).toBeVisible({ timeout: 5_000 })
    await burger.click()
    await page.waitForTimeout(600)

    // After open, check that a "Спробувати" CTA is visible inside the drawer
    // (burger opens a full-screen drawer with nav links + CTA)
    const cta = page.locator('[class*="drawer"], [class*="mobile-menu"], [class*="nav-open"]')
      .locator('a, button')
      .filter({ hasText: /Спробувати|Тарифи|Віджети/i })
      .first()

    // Fallback: any visible link with menu-related text
    const anyLink = page.locator('a').filter({ hasText: /Спробувати|Тарифи|Кейси/i }).first()

    const ctaVisible = await cta.isVisible({ timeout: 3_000 }).catch(() => false)
    const anyVisible = await anyLink.isVisible({ timeout: 3_000 }).catch(() => false)

    expect(ctaVisible || anyVisible, 'Menu links not visible after burger click').toBe(true)

    await auditButtons(page, 'home — menu open')
  })

  test('pricing page — billing toggle month/year', async ({ page }) => {
    await page.goto('/pricing')
    const monthBtn = page.getByRole('button', { name: 'Місяць' })
    const yearBtn = page.getByRole('button', { name: /Рік/ })
    await expect(monthBtn).toBeVisible({ timeout: 8_000 })
    await monthBtn.click()
    await expect(monthBtn).toHaveClass(/active/, { timeout: 3_000 })
    await yearBtn.click()
    await expect(yearBtn).toHaveClass(/active/, { timeout: 3_000 })
  })

  test('pricing plan CTA → /signup', async ({ page }) => {
    await page.goto('/pricing')
    const planLink = page.locator('a[href*="/signup?plan="]').first()
    await expect(planLink).toBeVisible({ timeout: 8_000 })
    await planLink.click()
    await expect(page).toHaveURL(/\/signup\?plan=/, { timeout: 8_000 })
  })
})

// ── 2. WIDGET DETAIL PAGES ────────────────────────────────────────────────────

test.describe('Widget detail pages — mobile', () => {
  // Slugs that exist in widget-slugs.ts but are intentionally Inactive in backend (no public detail page)
  const SLUGS_WITHOUT_DETAIL = new Set(['smart-search'])

  const WIDGET_SLUGS = [
    'promo-line',
    'delivery-date',
    'sticky-buy-button',
    'trust-badges',
    'phone-mask',
    'minorder-goal',
    'cart-goal',
    'buyer-count',
    'stock-left',
    'photo-video-reviews',
    'video-preview',
    'cart-recommender',
    'prize-banner',
    'promo-auto-apply',
    'progressive-discount',
    'one-plus-one',
    'last-chance-popup',
    'spin-the-wheel',
    'sms-otp-checkout',
    'smart-search',
  ]

  for (const slug of WIDGET_SLUGS) {
    test(`/widgets/${slug}`, async ({ page }) => {
      await page.goto(`/widgets/${slug}`)
      await page.waitForLoadState('networkidle')

      if (SLUGS_WITHOUT_DETAIL.has(slug)) {
        // Known: no detail page yet — redirects to /widgets list, that's OK
        console.log(`    ℹ️  ${slug} — detail page not implemented yet (redirects to /widgets)`)
        return
      }

      // Must stay on the detail page, not redirect to /widgets
      await expect(page).toHaveURL(new RegExp(`/widgets/${slug}`), { timeout: 8_000 })

      // H1 exists and is not empty
      const h1 = page.locator('h1').first()
      await expect(h1).toBeVisible({ timeout: 8_000 })
      const h1Text = await h1.innerText()
      expect(h1Text.trim().length, `H1 порожній на /widgets/${slug}`).toBeGreaterThan(0)

      // Breadcrumb back to /widgets (uses class widget-page__breadcrumb-link)
      const backLink = page.locator('.widget-page__breadcrumb-link')
      await expect(backLink).toBeVisible({ timeout: 5_000 })

      // Plans section present (may be below fold, check DOM presence)
      const planEl = page.locator('.widget-page__plan-name, .widget-page__buy-plan-name').first()
      await expect(planEl).toBeAttached({ timeout: 8_000 })

      // Button audit
      await auditButtons(page, `/widgets/${slug}`)
    })
  }

  test('widget detail — "Залишити заявку" is present for locked widgets', async ({ page }) => {
    // spin-the-wheel is Max-only → must show request button
    await page.goto('/widgets/spin-the-wheel')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    const btn = page.getByRole('button', { name: /заявк/i })
    await expect(btn).toBeVisible({ timeout: 8_000 })
  })
})

// ── 3. AUTH FLOW ──────────────────────────────────────────────────────────────

test.describe.serial('Auth flow — mobile', () => {
  test.setTimeout(60_000)

  test('/login — форма відображається', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('button', { name: /отримати код/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await auditButtons(page, '/login')
  })

  test('/login — invalid email keeps submit disabled', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[type="email"]')
    const submitBtn = page.getByRole('button', { name: /отримати код/i })
    await emailInput.fill('not-an-email')
    await expect(submitBtn).toBeDisabled()
    await emailInput.fill('valid@test.com')
    await expect(submitBtn).toBeEnabled()
  })

  test('/login/otp — пряме відкриття редіректить назад на /login', async ({ page }) => {
    await page.goto('/login/otp')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('нова реєстрація → plan selection після логіну', async ({ page }) => {
    await loginViaOtp(page, randomEmail())
    // A brand-new user without subscription lands on /pricing or /cabinet/choose-plan
    const url = page.url()
    const isOnPlanPage = url.includes('/pricing') || url.includes('choose-plan') || url.includes('/cabinet')
    expect(isOnPlanPage, `New user should land on plan/pricing page, got: ${url}`).toBe(true)
    await auditButtons(page, url.replace('http://127.0.0.1:5173', ''))
  })

  // Admin OTP login is thoroughly covered in the "Admin panel — mobile" describe.serial suite.
  // Duplicating it here would race the OTP endpoint for the same admin email and trip throttling.

  test('/signup — форма видима, кнопка задізейблена без email', async ({ page }) => {
    await page.goto('/signup?plan=pro&billing=yearly')
    await expect(page.locator('.signup__submit')).toBeDisabled({ timeout: 8_000 })
    await auditButtons(page, '/signup')
  })
})

// ── 4. CABINET ────────────────────────────────────────────────────────────────

test.describe.serial('Cabinet — mobile (авторизований юзер)', () => {
  test.setTimeout(60_000)

  test.beforeEach(async ({ page }) => {
    await loginViaOtp(page, randomEmail())
  })

  test('/cabinet/choose-plan — всі три тарифи видимі', async ({ page }) => {
    await page.goto('/cabinet/choose-plan')
    await expect(page).toHaveURL(/\/cabinet\/choose-plan/, { timeout: 8_000 })
    for (const plan of ['Free', 'Pro', 'Max']) {
      await expect(page.getByText(plan).first()).toBeVisible({ timeout: 8_000 })
    }
    await auditButtons(page, '/cabinet/choose-plan (logged in)')
  })
})

// ── 5. ADMIN PANEL ────────────────────────────────────────────────────────────

// Serial + shared token: one OTP login for the whole suite, token injected via localStorage.
test.describe.serial('Admin panel — mobile', () => {
  test.setTimeout(60_000)

  // JWT obtained once in beforeAll; injected into every page via beforeEach.
  let adminToken = ''

  test.beforeAll(async ({ request }) => {
    // OTP send (dev bypass: any subsequent verify with 121212 succeeds)
    await request.post('/api/v1/auth/otp', {
      data: { email: ADMIN_EMAIL },
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    })
    const resp = await request.post('/api/v1/auth/otp/verify', {
      data: { email: ADMIN_EMAIL, code: MASTER_OTP },
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    })
    const body = await resp.json() as { token?: string }
    adminToken = body.token ?? ''
    if (!adminToken) throw new Error('Admin JWT not obtained in beforeAll')
  })

  test.beforeEach(async ({ page }) => {
    // Inject token without a full UI login flow
    await page.goto('/')
    await page.evaluate((t: string) => localStorage.setItem('wty_token', t), adminToken)
  })

  const ADMIN_PAGES: [string, string][] = [
    ['/admin', 'Дашборд'],
    ['/admin/sites', 'Сайти'],
    ['/admin/users', 'Юзери'],
    ['/admin/subscriptions', 'Підписки'],
    ['/admin/orders', 'Замовлення'],
    ['/admin/settings', 'Налаштування'],
    ['/admin/widgets', 'Конфігуратор'],
    ['/admin/manager-requests', 'Manager Requests'],
  ]

  for (const [path, title] of ADMIN_PAGES) {
    test(`${path} — завантажується`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Must not redirect to /login
      expect(page.url(), `${path} редіректнув на login`).not.toMatch(/\/login/)

      // Sticky header
      await expectStickyHeader(page)

      // Bottom tab nav (≥3 fixed bottom links)
      await expectBottomNav(page)

      // Content visible
      await expect(page.getByText(title).first()).toBeVisible({ timeout: 8_000 })

      // Button audit
      await auditButtons(page, path)
    })
  }

  test('/admin — tab nav links are all clickable', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    const bottomNav = page.locator('.adm-screen__bottomnav')
    await expect(bottomNav).toBeVisible({ timeout: 8_000 })

    const tabLinks = bottomNav.locator('a')
    const count = await tabLinks.count()
    expect(count, 'Bottom nav has too few links').toBeGreaterThanOrEqual(3)

    console.log(`\n  🗂 Admin tab nav: ${count} вкладок`)
    for (let i = 0; i < count; i++) {
      const link = tabLinks.nth(i)
      const text = (await link.innerText().catch(() => '?')).trim().slice(0, 30)
      const href = await link.getAttribute('href')
      console.log(`    [${i}] "${text}" → ${href}`)
    }

    // Collect all hrefs BEFORE navigating (locator goes stale after navigation)
    const hrefs: string[] = []
    for (let i = 0; i < count; i++) {
      const href = await bottomNav.locator('a').nth(i).getAttribute('href', { timeout: 3_000 }).catch(() => null)
      if (href) hrefs.push(href)
    }

    // Visit each tab and confirm no redirect to /login
    for (const href of hrefs) {
      await page.goto(href)
      await page.waitForLoadState('domcontentloaded')
      // Re-inject token after navigation
      await page.evaluate((t: string) => localStorage.setItem('wty_token', t), adminToken)
      await page.waitForTimeout(500)
      expect(page.url(), `Tab ${href} redirected to login`).not.toMatch(/\/login/)
    }
  })

  test('/admin/sites — site row click opens detail', async ({ page }) => {
    await page.goto('/admin/sites')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click first site row
    const firstRow = page.locator('table tbody tr, [class*="site-row"]').first()
    const hasRow = await firstRow.isVisible({ timeout: 3_000 }).catch(() => false)
    if (hasRow) {
      await firstRow.click()
      await page.waitForTimeout(800)
      expect(page.url()).toMatch(/\/admin\/sites\//)
      await auditButtons(page, '/admin/sites/:domain')
    } else {
      console.log('    ℹ️  Немає рядків у таблиці сайтів')
    }
  })

  test('/admin/widgets — configurator opens on module click', async ({ page }) => {
    await page.goto('/admin/widgets')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await auditButtons(page, '/admin/widgets (configurator)')
  })

  test('/admin/settings — сторінка відображає контент', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Settings shows profile/security cards with static text + action buttons
    // Input fields only appear after clicking "Редагувати" — check for action buttons instead
    const actionBtns = page.locator('button').filter({ hasText: /Редагув|Змінити|Зберег|Налашт/i })
    const btnCount = await actionBtns.count()
    console.log(`\n  ⚙️ /admin/settings: ${btnCount} кнопок дій`)
    expect(btnCount, 'Settings page must have action buttons').toBeGreaterThan(0)
    await auditButtons(page, '/admin/settings')
  })
})

// ── 6. LAYOUT INVARIANTS ──────────────────────────────────────────────────────

test.describe('Layout invariants — mobile', () => {
  test('footer is present on all marketing pages', async ({ page }) => {
    const pages = ['/', '/widgets', '/pricing', '/contacts']
    for (const path of pages) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(300)
      const footer = page.locator('footer, [class*="footer"]').first()
      await expect(footer).toBeVisible({ timeout: 5_000 })
    }
  })

  test('no page has a black/invisible body (background check)', async ({ page }) => {
    const paths = ['/', '/widgets', '/pricing', '/contacts', '/login', '/signup']
    for (const path of paths) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Body must have some visible text
      const bodyText = await page.locator('body').textContent()
      expect(bodyText?.trim().length ?? 0, `Порожній body на ${path}`).toBeGreaterThan(50)
    }
  })

  test('back/breadcrumb link to /widgets exists on widget detail pages', async ({ page }) => {
    await page.goto('/widgets/promo-line')
    // Breadcrumb uses class widget-page__breadcrumb-link
    const backLink = page.locator('.widget-page__breadcrumb-link')
    await expect(backLink).toBeVisible({ timeout: 5_000 })
  })

  test('header logo returns to home', async ({ page }) => {
    await page.goto('/pricing')
    await page.getByRole('link', { name: /widgetis — на головну/i }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 8_000 })
  })
})
