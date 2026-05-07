import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

const MODULE = 'module-cart-goal';

test.describe(MODULE, () => {
  test('mounts main widget on any page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        threshold: 500,
        floatingWidget: false,
        minimum: 0,
        hideOnUtmSources: [],
        positionDesktop: 'bottom-right',
        positionMobile: 'bottom-right',
        desktopIconOnly: false,
        backgroundColor: '#4CAF50',
        textColor: '#fff',
        barColor: '#388E3C',
      },
      i18n: { ua: { text: 'До безкоштовної доставки', achieved: 'Безкоштовна доставка!' } },
    });

    await waitForWidget(page);
    // Widget inserts main (#cg-widget-main) or appends to body
    await expect(page.locator('#cg-widget-main')).toBeAttached();
  });

  test('mounts floating widget when floatingWidget enabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        threshold: 500,
        floatingWidget: true,
        minimum: 0,
        hideOnUtmSources: [],
        positionDesktop: 'bottom-right',
        positionMobile: 'bottom-right',
        desktopIconOnly: false,
        backgroundColor: '#4CAF50',
        textColor: '#fff',
        barColor: '#388E3C',
      },
      i18n: { ua: { text: 'До безкоштовної доставки', achieved: 'Безкоштовна доставка!' } },
    });

    await waitForWidget(page);
    await expect(page.locator('#cg-widget-floating')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: false,
        threshold: 500,
      },
      i18n: { ua: { text: 'До безкоштовної доставки', achieved: 'Безкоштовна доставка!' } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('#cg-widget-main')).not.toBeAttached();
    await expect(page.locator('#cg-widget-floating')).not.toBeAttached();
  });

  test('cleanup removes element', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        threshold: 500,
        floatingWidget: true,
        minimum: 0,
        hideOnUtmSources: [],
        positionDesktop: 'bottom-right',
        positionMobile: 'bottom-right',
        desktopIconOnly: false,
        backgroundColor: '#4CAF50',
        textColor: '#fff',
        barColor: '#388E3C',
      },
      i18n: { ua: { text: 'До безкоштовної доставки', achieved: 'Безкоштовна доставка!' } },
    });

    await waitForWidget(page);
    await expect(page.locator('#cg-widget-floating')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('#cg-widget-main')).not.toBeAttached();
    await expect(page.locator('#cg-widget-floating')).not.toBeAttached();
  });
});
