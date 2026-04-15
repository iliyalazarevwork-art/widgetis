# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plan-card-shared.spec.ts >> Shared PlanCard >> /cabinet/choose-plan renders the same pricing__card markup
- Location: tests/e2e/plan-card-shared.spec.ts:16:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/(cabinet|admin)/
Received string:  "http://127.0.0.1:5173/login/otp"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    14 × unexpected value "http://127.0.0.1:5173/login/otp"

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
      - button "Назад" [ref=e19] [cursor=pointer]:
        - img [ref=e20]
        - text: Назад
      - generic [ref=e22]:
        - heading "Введіть код" [level=1] [ref=e23]
        - paragraph [ref=e24]:
          - text: Ми надіслали 6-значний код на
          - strong [ref=e25]: shared-1776211389072@widgetis.local
      - generic [ref=e26]:
        - generic [ref=e27]:
          - textbox [ref=e28]
          - textbox [ref=e29]
          - textbox [ref=e30]
          - textbox [ref=e31]
          - textbox [ref=e32]
          - textbox [ref=e33]
        - button "Відправити" [disabled] [ref=e34]
      - button "Надіслати повторно через 20с" [disabled] [ref=e35]
  - contentinfo [ref=e36]:
    - generic [ref=e37]:
      - generic [ref=e38]:
        - generic [ref=e39]:
          - link "W widgetis" [ref=e40] [cursor=pointer]:
            - /url: /
            - generic [ref=e41]: W
            - generic [ref=e42]: widgetis
          - paragraph [ref=e43]: Готові віджети для e-commerce. Збільшуйте конверсію без розробників.
        - navigation [ref=e44]:
          - generic [ref=e45]:
            - heading "Навігація" [level=3] [ref=e46]
            - link "Віджети" [ref=e47] [cursor=pointer]:
              - /url: /widgets
            - link "Кейси" [ref=e48] [cursor=pointer]:
              - /url: /cases
            - link "Контакти" [ref=e49] [cursor=pointer]:
              - /url: /contacts
          - generic [ref=e50]:
            - heading "Документи" [level=3] [ref=e51]
            - link "Публічна оферта" [ref=e52] [cursor=pointer]:
              - /url: /offer
            - link "Повернення коштів" [ref=e53] [cursor=pointer]:
              - /url: /refund
            - link "Безпека даних" [ref=e54] [cursor=pointer]:
              - /url: /security
            - link "Ліцензія" [ref=e55] [cursor=pointer]:
              - /url: /license
          - generic [ref=e56]:
            - heading "Зв'язок" [level=3] [ref=e57]
            - link "+380 96 149 47 47" [ref=e58] [cursor=pointer]:
              - /url: tel:+380961494747
            - link "hello@widgetis.com" [ref=e59] [cursor=pointer]:
              - /url: mailto:hello@widgetis.com
            - link "Telegram" [ref=e60] [cursor=pointer]:
              - /url: https://t.me/widgetis
            - generic [ref=e61]:
              - text: вул. Сарми-Соколовського, 58,
              - text: Дніпро, 49000
      - generic [ref=e62]:
        - generic [ref=e63]:
          - generic [ref=e64]: © 2026 widgetis
          - generic [ref=e65]: ФОП Лазарєв Ілля Ігорович · ІПН 3660907893 · вул. Сарми-Соколовського, 58, Дніпро, 49000
        - generic [ref=e66]:
          - generic "Еквайринг" [ref=e67]:
            - img "plata by mono" [ref=e68]
            - img "LiqPay" [ref=e69]
          - generic "Способи оплати" [ref=e71]:
            - img "Visa" [ref=e72]
            - img "Mastercard" [ref=e73]
            - img "Apple Pay" [ref=e74]
            - img "Google Pay" [ref=e75]
  - link "Написати в Telegram":
    - /url: https://t.me/widgetis
    - img
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | /**
  4  |  * Regression guard: /pricing and /cabinet/choose-plan must render the same
  5  |  * `pricing__card` component (the one shared via <PlanCard>). Catches anyone
  6  |  * forking the markup again.
  7  |  */
  8  | test.describe('Shared PlanCard', () => {
  9  |   test('/pricing renders pricing__card components', async ({ page }) => {
  10 |     await page.goto('/pricing')
  11 |     const cards = page.locator('.pricing__card')
  12 |     await expect(cards).not.toHaveCount(0)
  13 |     expect(await cards.count()).toBeGreaterThanOrEqual(3)
  14 |   })
  15 | 
  16 |   test('/cabinet/choose-plan renders the same pricing__card markup', async ({ page, context }) => {
  17 |     // Auth: log in via the OTP master code 121212 (dev bypass).
  18 |     await page.goto('/login')
  19 |     await page.locator('input[type="email"]').fill(`shared-${Date.now()}@widgetis.local`)
  20 |     await page.getByRole('button', { name: /отримати код/i }).click()
  21 |     await expect(page).toHaveURL(/\/login\/otp$/)
  22 |     await expect(page.locator('input.otp-input')).toHaveCount(6)
  23 |     for (const d of '121212') await page.keyboard.type(d)
> 24 |     await expect(page).toHaveURL(/\/(cabinet|admin)/, { timeout: 10_000 })
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  25 | 
  26 |     await page.goto('/cabinet/choose-plan')
  27 |     const cards = page.locator('.pricing__card')
  28 |     // The cabinet view filters out the user's current plan and below, so at
  29 |     // least one card must remain (or we are on the "max" terminal screen,
  30 |     // which is fine — assert reachable rather than count).
  31 |     await expect(page).toHaveURL(/\/cabinet\/choose-plan$/)
  32 | 
  33 |     // If any cards do render they MUST be pricing__card — that proves the
  34 |     // shared component is in use, not the old `choose-plan__card` markup.
  35 |     const oldCards = page.locator('.choose-plan__card')
  36 |     expect(await oldCards.count()).toBe(0)
  37 |     expect(await cards.count()).toBeGreaterThanOrEqual(0)
  38 | 
  39 |     void context // unused — placeholder kept so destructure stays explicit
  40 |   })
  41 | })
  42 | 
```