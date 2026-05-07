import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// minorder-goal creates #mo-widget-main (main) and a floating widget
// The widget only appears when cart total > 0 AND total < threshold.
// The any-page.html has cart total = 0, so the widget is hidden after initial render.
// We use checkout-page.html which has cart total = 2500 and set threshold=5000.
const MODULE = 'module-minorder-goal';

test.describe(MODULE, () => {
  test('mounts main widget on checkout page when cart total is below threshold', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        threshold: 5000,
        floatingWidget: false,
        minimum: 0,
        positionDesktop: 'bottom-right',
        positionMobile: 'bottom-right',
        desktopIconOnly: false,
        backgroundColor: '#4CAF50',
        textColor: '#fff',
        barColor: '#388E3C',
      },
      i18n: { ua: { text: 'До мінімального замовлення', achieved: 'Мінімальне замовлення досягнуто!' } },
    });

    await waitForWidget(page);
    // wait a tick for async insertion
    await page.waitForTimeout(200);
    await expect(page.locator('#mo-widget-main')).toBeAttached();
  });

  test('mounts floating widget when floatingWidget enabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        threshold: 5000,
        floatingWidget: true,
        minimum: 0,
        positionDesktop: 'bottom-right',
        positionMobile: 'bottom-right',
        desktopIconOnly: false,
        backgroundColor: '#4CAF50',
        textColor: '#fff',
        barColor: '#388E3C',
      },
      i18n: { ua: { text: 'До мінімального замовлення', achieved: 'Мінімальне замовлення досягнуто!' } },
    });

    await waitForWidget(page);
    await page.waitForTimeout(200);
    await expect(page.locator('#mo-widget-floating')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: false,
        threshold: 5000,
      },
      i18n: { ua: { text: 'До мінімального замовлення', achieved: 'Мінімальне замовлення досягнуто!' } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('#mo-widget-main')).not.toBeAttached();
    await expect(page.locator('#mo-widget-floating')).not.toBeAttached();
  });

  test('cleanup removes element', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        threshold: 5000,
        floatingWidget: true,
        minimum: 0,
        positionDesktop: 'bottom-right',
        positionMobile: 'bottom-right',
        desktopIconOnly: false,
        backgroundColor: '#4CAF50',
        textColor: '#fff',
        barColor: '#388E3C',
      },
      i18n: { ua: { text: 'До мінімального замовлення', achieved: 'Мінімальне замовлення досягнуто!' } },
    });

    await waitForWidget(page);
    await page.waitForTimeout(200);
    await expect(page.locator('#mo-widget-floating')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('#mo-widget-main')).not.toBeAttached();
    await expect(page.locator('#mo-widget-floating')).not.toBeAttached();
  });
});
