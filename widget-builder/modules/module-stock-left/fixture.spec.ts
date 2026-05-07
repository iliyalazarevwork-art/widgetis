import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// stock-left creates a .wty-stock-left-wrapper badge next to the price section
const MODULE = 'module-stock-left';

test.describe(MODULE, () => {
  test('mounts badge on product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.product__section--price', insert: 'after' }],
        minCount: 1,
        maxCount: 10,
        minRemaining: 1,
        decrementProbability: 0.6,
        updateInterval: 60,
        showForOutOfStock: false,
        pulse: true,
        backgroundColor: '#fef2f2',
        textColor: '#b91c1c',
        accentColor: '#dc2626',
      },
      i18n: { ua: { label: 'Залишилось', unit: 'шт' } },
    });

    await waitForWidget(page);
    await expect(page.locator('.wty-stock-left-wrapper')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: false,
        selectors: [{ selector: '.product__section--price', insert: 'after' }],
        minCount: 1,
        maxCount: 10,
        minRemaining: 1,
        decrementProbability: 0.6,
        updateInterval: 60,
        showForOutOfStock: false,
        pulse: true,
        backgroundColor: '#fef2f2',
        textColor: '#b91c1c',
        accentColor: '#dc2626',
      },
      i18n: { ua: { label: 'Залишилось', unit: 'шт' } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('.wty-stock-left-wrapper')).not.toBeAttached();
  });

  test('does not mount on non-product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.product__section--price', insert: 'after' }],
        minCount: 1,
        maxCount: 10,
        minRemaining: 1,
        decrementProbability: 0.6,
        updateInterval: 60,
        showForOutOfStock: false,
        pulse: true,
        backgroundColor: '#fef2f2',
        textColor: '#b91c1c',
        accentColor: '#dc2626',
      },
      i18n: { ua: { label: 'Залишилось', unit: 'шт' } },
    });

    await waitForWidget(page);
    await expect(page.locator('.wty-stock-left-wrapper')).not.toBeAttached();
  });

  test('cleanup removes badge', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.product__section--price', insert: 'after' }],
        minCount: 1,
        maxCount: 10,
        minRemaining: 1,
        decrementProbability: 0.6,
        updateInterval: 60,
        showForOutOfStock: false,
        pulse: true,
        backgroundColor: '#fef2f2',
        textColor: '#b91c1c',
        accentColor: '#dc2626',
      },
      i18n: { ua: { label: 'Залишилось', unit: 'шт' } },
    });

    await waitForWidget(page);
    await expect(page.locator('.wty-stock-left-wrapper')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('.wty-stock-left-wrapper')).not.toBeAttached();
  });
});
