import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// sticky-buy-button creates #wdg-sticky-buy bar on product page.
// It only renders when window.innerWidth <= mobileBreakpoint.
// We set mobileBreakpoint: 9999 so it works on any viewport in tests.
const MODULE = 'module-sticky-buy-button';

const CONFIG = {
  enabled: true,
  buttonSelector: '.j-buy-button-add',
  mobileBreakpoint: 9999,
  backgroundColor: '#e44',
  textColor: '#fff',
  borderRadius: '8px',
  bottomOffset: 0,
  safeAreaPadding: false,
  zIndex: 9998,
};

const I18N = { ua: { buttonText: 'Купити' } };

test.describe(MODULE, () => {
  test('mounts sticky bar on product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: CONFIG,
      i18n: I18N,
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#wdg-sticky-buy')).toBeAttached();
  });

  test('bar starts hidden (has wdg-sbuy--hidden class)', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: CONFIG,
      i18n: I18N,
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    // Before any scroll, bar should be hidden
    await expect(page.locator('#wdg-sticky-buy')).toHaveClass(/wdg-sbuy--hidden/);
  });

  test('bar becomes visible after scrolling past threshold', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: CONFIG,
      i18n: I18N,
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);

    // Scroll past threshold (300px)
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(200);

    await expect(page.locator('#wdg-sticky-buy')).not.toHaveClass(/wdg-sbuy--hidden/);
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: { ...CONFIG, enabled: false },
      i18n: I18N,
    });

    await page.waitForTimeout(500);
    await expect(page.locator('#wdg-sticky-buy')).not.toBeAttached();
  });

  test('does not mount on non-product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: CONFIG,
      i18n: I18N,
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#wdg-sticky-buy')).not.toBeAttached();
  });

  test('cleanup removes bar and spacer', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: CONFIG,
      i18n: I18N,
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#wdg-sticky-buy')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('#wdg-sticky-buy')).not.toBeAttached();
    await expect(page.locator('#wdg-sticky-buy-spacer')).not.toBeAttached();
  });
});
