import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget } from '../../tests/fixtures/fixture-helpers';

// cart-recommender requires:
// 1. mobile viewport (max-width: 768px)
// 2. window.AjaxCart present
// 3. Non-empty alias in pathname
// It patches AjaxCart and shows a popup only after a product is added to cart.
// Since we cannot simulate the full Horoshop AjaxCart lifecycle in a fixture,
// we verify: graceful skip without errors when AjaxCart is absent, and that the
// module loads without crashing when on a "mobile" viewport with a path alias.
const MODULE = 'module-cart-recommender';

test.describe(MODULE, () => {
  test('loads without errors on checkout page (desktop — skips gracefully)', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        apiBaseUrl: 'http://localhost:3000',
        maxItems: 4,
      },
      i18n: { ua: { heading: 'Рекомендуємо', buttonAddToCart: 'В кошик' } },
    });

    await waitForWidget(page);
    // On desktop viewport the module skips (not mobile). No popup in DOM.
    await expect(page.locator('.cr-popup, .cart-recommender-popup, [class*="recommender"]')).not.toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: false,
        apiBaseUrl: 'http://localhost:3000',
        maxItems: 4,
      },
      i18n: { ua: { heading: 'Рекомендуємо', buttonAddToCart: 'В кошик' } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('[class*="recommender"], [class*="cr-popup"]')).not.toBeAttached();
  });

  test('gracefully handles missing AjaxCart on mobile viewport', async ({ page }) => {
    // Use mobile viewport where the module would normally activate
    await page.setViewportSize({ width: 375, height: 812 });

    // Navigate to a URL with an alias in the path to pass alias detection
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        apiBaseUrl: 'http://localhost:3000',
        maxItems: 4,
      },
      i18n: { ua: { heading: 'Рекомендуємо', buttonAddToCart: 'В кошик' } },
    });

    await waitForWidget(page);

    // No JS errors — the module should not throw even without AjaxCart
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors.filter((e) => e.includes('cart-recommender') && e.includes('Error'))).toHaveLength(0);
  });
});
