import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget } from '../../tests/fixtures/fixture-helpers';

// one-plus-one depends on window.AjaxCart and window.AjaxCart.instance.
// Without AjaxCart present, the module registers a listener but creates no DOM element.
// We verify graceful startup (no errors, no DOM element created).
const MODULE = 'module-one-plus-one';

test.describe(MODULE, () => {
  test('loads without errors on checkout page (no AjaxCart — waits gracefully)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        apiUrl: 'http://localhost:3000/api',
      },
      i18n: { ua: { badge: '1+1=3', tooltip: 'Додайте ще один товар безкоштовно' } },
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);

    // No JS errors from this module
    const moduleErrors = pageErrors.filter((e) => e.toLowerCase().includes('1+1') || e.toLowerCase().includes('oneplusone'));
    expect(moduleErrors).toHaveLength(0);

    // No spinner overlay without AjaxCart
    await expect(page.locator('.wdg-cart-lock')).not.toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: false,
        apiUrl: 'http://localhost:3000/api',
      },
      i18n: { ua: { badge: '1+1=3', tooltip: 'Додайте ще один товар безкоштовно' } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('.wdg-cart-lock')).not.toBeAttached();
  });

  test('does not mount when apiUrl is empty', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        apiUrl: '',
      },
      i18n: { ua: { badge: '1+1=3', tooltip: 'Додайте ще один товар безкоштовно' } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('.wdg-cart-lock')).not.toBeAttached();
  });
});
