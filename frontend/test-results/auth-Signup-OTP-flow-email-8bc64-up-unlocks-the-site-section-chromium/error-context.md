# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Signup OTP flow >> email confirmation via OTP on /signup unlocks the site section
- Location: tests/e2e/auth.spec.ts:117:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Підтверджено/)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/Підтверджено/)

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "widgetis — на головну" [ref=e6] [cursor=pointer]:
        - /url: /
        - img [ref=e7]
        - generic [ref=e8]: widgetis
      - navigation [ref=e9]:
        - link "Віджети" [ref=e10] [cursor=pointer]:
          - /url: /widgets
        - link "Тарифи" [ref=e11] [cursor=pointer]:
          - /url: /pricing
        - link "Кейси" [ref=e12] [cursor=pointer]:
          - /url: /cases
        - link "Контакти" [ref=e13] [cursor=pointer]:
          - /url: /contacts
      - button "Спробувати" [ref=e15] [cursor=pointer]
  - main [ref=e16]:
    - generic [ref=e18]:
      - link "До тарифів" [ref=e19] [cursor=pointer]:
        - /url: /pricing
        - img [ref=e20]
        - text: До тарифів
      - generic [ref=e22]:
        - complementary [ref=e23]:
          - generic [ref=e24]:
            - img [ref=e26]
            - generic [ref=e28]:
              - paragraph [ref=e29]:
                - text: Pro
                - generic [ref=e30]: · Оптимально
              - paragraph [ref=e31]: 15 990 грн/рік · 2 міс у подарунок
          - generic [ref=e32]:
            - generic [ref=e33]: 1 333
            - generic [ref=e34]: грн/міс
          - generic [ref=e35]:
            - img [ref=e36]
            - text: 7 днів безкоштовно
          - link "Змінити план →" [ref=e40] [cursor=pointer]:
            - /url: /pricing
        - generic [ref=e41]:
          - generic [ref=e42]:
            - generic [ref=e43]:
              - generic [ref=e44]: 1. Підтвердження email
              - generic [ref=e45]:
                - img [ref=e46]
                - text: Код надіслано
            - generic [ref=e48]:
              - generic [ref=e49]:
                - img [ref=e50]
                - generic [ref=e53]: signup-1776211387805-xi9rdi@widgetis.local
              - button "Змінити" [ref=e54] [cursor=pointer]
            - generic [ref=e55]:
              - paragraph [ref=e56]: Введіть 6-значний код з листа
              - generic [ref=e58]:
                - generic [ref=e59]:
                  - textbox [ref=e60]: "1"
                  - textbox [ref=e61]: "2"
                  - textbox [ref=e62]: "1"
                  - textbox [ref=e63]: "2"
                  - textbox [ref=e64]: "1"
                  - textbox [active] [ref=e65]: "2"
                - generic [ref=e66]: Too Many Attempts.
              - generic [ref=e68]: Надіслати повторно через 50 с
          - generic [ref=e70]:
            - generic [ref=e72]: 2. Ваш магазин
            - generic [ref=e74]:
              - img [ref=e75]
              - textbox [ref=e78]:
                - /placeholder: store.com.ua
            - generic [ref=e79]:
              - button "Horoshop" [ref=e80] [cursor=pointer]
              - button "Shopify Скоро" [disabled] [ref=e81]:
                - text: Shopify
                - generic [ref=e82]: Скоро
              - button "WooCommerce Скоро" [disabled] [ref=e83]:
                - text: WooCommerce
                - generic [ref=e84]: Скоро
              - button "OpenCart Скоро" [disabled] [ref=e85]:
                - text: OpenCart
                - generic [ref=e86]: Скоро
          - generic [ref=e88]:
            - generic [ref=e89]:
              - img [ref=e90]
              - generic [ref=e92]: 3. Спосіб оплати
            - generic [ref=e93]:
              - button "LiqPay Visa · Mastercard · Apple Pay · Google Pay Тріал 7 днів LiqPay" [pressed] [ref=e94] [cursor=pointer]:
                - generic [ref=e95]:
                  - generic [ref=e96]: LiqPay
                  - generic [ref=e97]: Visa · Mastercard · Apple Pay · Google Pay
                  - generic [ref=e98]:
                    - img [ref=e99]
                    - text: Тріал 7 днів
                - img "LiqPay" [ref=e101]
              - button "plata by mono Apple Pay · Google Pay · картки будь-якого банку plata by mono" [ref=e102] [cursor=pointer]:
                - generic [ref=e103]:
                  - generic [ref=e104]: plata by mono
                  - generic [ref=e105]: Apple Pay · Google Pay · картки будь-якого банку
                - img "plata by mono" [ref=e106]
          - generic [ref=e109]:
            - generic [ref=e110]:
              - img [ref=e111]
              - text: Підтвердіть email, щоб продовжити
            - button "Почати 7 днів безкоштовно" [disabled] [ref=e114]:
              - text: Почати 7 днів безкоштовно
              - img [ref=e115]
            - paragraph [ref=e118]:
              - text: Натискаючи, Ви погоджуєтесь з
              - link "умовами використання" [ref=e119] [cursor=pointer]:
                - /url: /terms
              - text: та
              - link "політикою конфіденційності" [ref=e120] [cursor=pointer]:
                - /url: /privacy
        - paragraph [ref=e121]:
          - text: Вже є акаунт?
          - link "Увійти" [ref=e122] [cursor=pointer]:
            - /url: /login
  - contentinfo [ref=e123]:
    - generic [ref=e124]:
      - generic [ref=e125]:
        - generic [ref=e126]:
          - link "W widgetis" [ref=e127] [cursor=pointer]:
            - /url: /
            - generic [ref=e128]: W
            - generic [ref=e129]: widgetis
          - paragraph [ref=e130]: Готові віджети для e-commerce. Збільшуйте конверсію без розробників.
        - navigation [ref=e131]:
          - generic [ref=e132]:
            - heading "Навігація" [level=3] [ref=e133]
            - link "Віджети" [ref=e134] [cursor=pointer]:
              - /url: /widgets
            - link "Кейси" [ref=e135] [cursor=pointer]:
              - /url: /cases
            - link "Контакти" [ref=e136] [cursor=pointer]:
              - /url: /contacts
          - generic [ref=e137]:
            - heading "Документи" [level=3] [ref=e138]
            - link "Публічна оферта" [ref=e139] [cursor=pointer]:
              - /url: /offer
            - link "Повернення коштів" [ref=e140] [cursor=pointer]:
              - /url: /refund
            - link "Безпека даних" [ref=e141] [cursor=pointer]:
              - /url: /security
            - link "Ліцензія" [ref=e142] [cursor=pointer]:
              - /url: /license
          - generic [ref=e143]:
            - heading "Зв'язок" [level=3] [ref=e144]
            - link "+380 96 149 47 47" [ref=e145] [cursor=pointer]:
              - /url: tel:+380961494747
            - link "hello@widgetis.com" [ref=e146] [cursor=pointer]:
              - /url: mailto:hello@widgetis.com
            - link "Telegram" [ref=e147] [cursor=pointer]:
              - /url: https://t.me/widgetis
            - generic [ref=e148]:
              - text: вул. Сарми-Соколовського, 58,
              - text: Дніпро, 49000
      - generic [ref=e149]:
        - generic [ref=e150]:
          - generic [ref=e151]: © 2026 widgetis
          - generic [ref=e152]: ФОП Лазарєв Ілля Ігорович · ІПН 3660907893 · вул. Сарми-Соколовського, 58, Дніпро, 49000
        - generic [ref=e153]:
          - generic "Еквайринг" [ref=e154]:
            - img "plata by mono" [ref=e155]
            - img "LiqPay" [ref=e156]
          - generic "Способи оплати" [ref=e158]:
            - img "Visa" [ref=e159]
            - img "Mastercard" [ref=e160]
            - img "Apple Pay" [ref=e161]
            - img "Google Pay" [ref=e162]
  - link "Написати в Telegram":
    - /url: https://t.me/widgetis
    - img
  - region "Notifications alt+T"
```

# Test source

```ts
  41  | 
  42  | test.describe('OTP login flow', () => {
  43  |   test('new user lands in /cabinet after entering email + master OTP', async ({ page }) => {
  44  |     await loginViaOtp(page, randomEmail())
  45  | 
  46  |     await expect(page).toHaveURL(/\/cabinet/, { timeout: 10_000 })
  47  | 
  48  |     const token = await page.evaluate(() => localStorage.getItem('wty_token'))
  49  |     expect(token).not.toBeNull()
  50  |     expect(token!.length).toBeGreaterThan(20)
  51  |   })
  52  | 
  53  |   test('admin user lands in /admin after OTP login', async ({ page }) => {
  54  |     // AdminSeeder creates admin@widgetis.com with role=admin. OTP dev
  55  |     // bypass still authenticates admin accounts, and the post-login
  56  |     // router must send them to /admin (not /cabinet).
  57  |     await loginViaOtp(page, 'admin@widgetis.com')
  58  | 
  59  |     await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 })
  60  | 
  61  |     const token = await page.evaluate(() => localStorage.getItem('wty_token'))
  62  |     expect(token).not.toBeNull()
  63  |   })
  64  | 
  65  |   test('fresh user is routed to /cabinet/choose-plan after login', async ({ page }) => {
  66  |     // A brand-new account has no subscription, so RequireSubscription bounces
  67  |     // them from /cabinet → /cabinet/choose-plan. We assert that bounce happens
  68  |     // and that the choose-plan hero actually renders (not a white screen).
  69  |     await loginViaOtp(page, randomEmail())
  70  | 
  71  |     await page.goto('/cabinet')
  72  |     await expect(page).toHaveURL(/\/cabinet\/choose-plan/, { timeout: 10_000 })
  73  |     await expect(page.getByText(/Обери свій план/i)).toBeVisible({ timeout: 10_000 })
  74  |   })
  75  | 
  76  |   test('authenticated user can reach /cabinet/support without losing the session', async ({ page }) => {
  77  |     // Any cabinet-layout subroute that doesn't require a subscription guard
  78  |     // would work — we use /cabinet/support as a cheap sanity check that
  79  |     // deeper cabinet routes resolve after OTP login.
  80  |     await loginViaOtp(page, randomEmail())
  81  | 
  82  |     // Support page is gated behind RequireSubscription, so a fresh user
  83  |     // without a plan will still bounce to /cabinet/choose-plan — but the
  84  |     // bounce itself proves the auth chain is intact (no /login redirect).
  85  |     await page.goto('/cabinet/support')
  86  |     await expect(page).toHaveURL(/\/cabinet/, { timeout: 10_000 })
  87  | 
  88  |     const token = await page.evaluate(() => localStorage.getItem('wty_token'))
  89  |     expect(token).not.toBeNull()
  90  |   })
  91  | 
  92  |   test('OTP page redirects back to /login when accessed without email state', async ({
  93  |     page,
  94  |   }) => {
  95  |     await page.goto('/login/otp')
  96  |     await expect(page).toHaveURL(/\/login$/)
  97  |   })
  98  | 
  99  |   test('login page exposes a Google sign-in button', async ({ page }) => {
  100 |     await page.goto('/login')
  101 |     await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  102 |   })
  103 | 
  104 |   test('invalid email keeps the submit button disabled', async ({ page }) => {
  105 |     await page.goto('/login')
  106 |     const emailInput = page.locator('input[type="email"]')
  107 |     await emailInput.fill('not-an-email')
  108 |     const submit = page.getByRole('button', { name: /отримати код/i })
  109 |     await expect(submit).toBeDisabled()
  110 | 
  111 |     await emailInput.fill('valid@widgetis.local')
  112 |     await expect(submit).toBeEnabled()
  113 |   })
  114 | })
  115 | 
  116 | test.describe('Signup OTP flow', () => {
  117 |   test('email confirmation via OTP on /signup unlocks the site section', async ({ page }) => {
  118 |     await page.goto('/signup?plan=pro&billing=yearly')
  119 | 
  120 |     // 1. Plan summary is visible (left column).
  121 |     await expect(page.getByText(/7 днів безкоштовно/).first()).toBeVisible({ timeout: 10_000 })
  122 | 
  123 |     // 2. Section 1: fill email and request OTP.
  124 |     const email = randomEmail('signup')
  125 |     await page.locator('input[type="email"]').fill(email)
  126 |     await page.getByRole('button', { name: /надіслати код/i }).click()
  127 | 
  128 |     // 3. OTP cells appear — signup uses its own class (signup__otp-cell), not
  129 |     // the login page's .otp-input.
  130 |     const otpCells = page.locator('.signup__otp-cell')
  131 |     await expect(otpCells.first()).toBeVisible({ timeout: 10_000 })
  132 |     await expect(otpCells).toHaveCount(6)
  133 | 
  134 |     // 4. Type master code — auto-submits on the 6th digit.
  135 |     await otpCells.first().click()
  136 |     for (const digit of MASTER_OTP) {
  137 |       await page.keyboard.type(digit)
  138 |     }
  139 | 
  140 |     // 5. Verified badge appears and section 2 (site input) is reachable.
> 141 |     await expect(page.getByText(/Підтверджено/)).toBeVisible({ timeout: 10_000 })
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  142 |     await expect(page.getByPlaceholder('store.com.ua')).toBeVisible()
  143 | 
  144 |     // 6. Token was persisted (user is effectively logged in after verify).
  145 |     const token = await page.evaluate(() => localStorage.getItem('wty_token'))
  146 |     expect(token).not.toBeNull()
  147 |     expect(token!.length).toBeGreaterThan(20)
  148 |   })
  149 | 
  150 |   test('signup CTA stays locked until email is verified', async ({ page }) => {
  151 |     await page.goto('/signup?plan=basic&billing=monthly')
  152 |     // CTA button exists but is disabled until verification.
  153 |     const cta = page.locator('button.signup__submit')
  154 |     await expect(cta).toBeVisible()
  155 |     await expect(cta).toBeDisabled()
  156 |     await expect(page.getByText(/Підтвердіть email/)).toBeVisible()
  157 |   })
  158 | 
  159 |   test('signup page remembers draft across reloads', async ({ page }) => {
  160 |     await page.goto('/signup?plan=pro&billing=yearly')
  161 |     const email = randomEmail('draft')
  162 |     await page.locator('input[type="email"]').fill(email)
  163 |     await page.locator('input[placeholder="store.com.ua"]').fill('example.store')
  164 | 
  165 |     await page.reload()
  166 |     await expect(page.locator('input[type="email"]')).toHaveValue(email)
  167 |     await expect(page.locator('input[placeholder="store.com.ua"]')).toHaveValue('example.store')
  168 |   })
  169 | })
  170 | 
```