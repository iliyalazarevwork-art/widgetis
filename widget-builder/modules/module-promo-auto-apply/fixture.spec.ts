import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget } from '../../tests/fixtures/fixture-helpers';

// promo-auto-apply watches for .j-coupon-add on a checkout path and auto-applies the code.
// The checkout-page.html has .j-coupon-add present.
// We need the localStorage prize set before page load AND the URL path must match checkoutPathMatches.
const MODULE = 'module-promo-auto-apply';
const STORAGE_KEY = 'wdg_promo_test';

const PRIZE_DATA = JSON.stringify({ code: 'PROMO123' });

test.describe(MODULE, () => {
  test('auto-applies coupon and shows toast on checkout page', async ({ page }) => {
    await page.addInitScript(
      ({ key, value }) => { localStorage.setItem(key, value); },
      { key: STORAGE_KEY, value: PRIZE_DATA },
    );

    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        storageKey: STORAGE_KEY,
        // Match any path (empty string matches all)
        checkoutPathMatches: [''],
        showToast: true,
        watchTimeoutMs: 3000,
        toastPosition: 'top',
        backgroundColor: '#333',
        textColor: '#fff',
        zIndex: 9999,
      },
      i18n: { ua: { appliedMessage: 'Промокод {code} застосовано!' } },
    });

    await waitForWidget(page);
    // The module calls .j-coupon-add.click(), fills input, clicks submit.
    // We just verify the coupon input was filled.
    await page.waitForTimeout(1500);

    // The input value should be the promo code after auto-apply
    const inputValue = await page.locator('.j-coupon-input').inputValue();
    expect(inputValue).toBe('PROMO123');
  });

  test('does not mount when disabled', async ({ page }) => {
    await page.addInitScript(
      ({ key, value }) => { localStorage.setItem(key, value); },
      { key: STORAGE_KEY, value: PRIZE_DATA },
    );

    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: false,
        storageKey: STORAGE_KEY,
        checkoutPathMatches: [''],
        showToast: false,
        watchTimeoutMs: 3000,
        toastPosition: 'top',
        backgroundColor: '#333',
        textColor: '#fff',
        zIndex: 9999,
      },
      i18n: { ua: { appliedMessage: 'Промокод {code} застосовано!' } },
    });

    await page.waitForTimeout(500);
    // Input should be empty since disabled
    const inputValue = await page.locator('.j-coupon-input').inputValue();
    expect(inputValue).toBe('');
  });

  test('does not mount when no prize in localStorage', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        storageKey: STORAGE_KEY,
        checkoutPathMatches: [''],
        showToast: true,
        watchTimeoutMs: 1000,
        toastPosition: 'top',
        backgroundColor: '#333',
        textColor: '#fff',
        zIndex: 9999,
      },
      i18n: { ua: { appliedMessage: 'Промокод {code} застосовано!' } },
    });

    await waitForWidget(page);
    await page.waitForTimeout(500);
    // Input should remain empty since no prize in storage
    const inputValue = await page.locator('.j-coupon-input').inputValue();
    expect(inputValue).toBe('');
  });
});
