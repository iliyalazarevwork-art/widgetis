/**
 * module-minorder-goal — detailed DOM verification test
 *
 * The floating widget (#mo-widget-floating) is shown on any non-checkout page when
 * cart total > 0 AND cart total < threshold.
 *
 * On a real Horoshop product page the cart is usually empty (total = 0) so the module
 * removes the widget immediately. To force the widget to render we intercept
 * window.GLOBAL via Object.defineProperty before the page's own scripts run, ensuring
 * cart.total stays at 100 (below the default 500 threshold).
 *
 * Floating widget is checked because it is appended to document.body with no need for
 * specific cart-drawer insertion points (which may not exist on a product page).
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-minorder-goal DOM check on ${site.name}`, async ({ page }) => {
    // Override window.GLOBAL so cart.total = 100 survives any page reassignment.
    await page.addInitScript(() => {
      let _g: any = { cart: { total: 100 } };
      Object.defineProperty(window, 'GLOBAL', {
        get() { return _g; },
        set(v: any) {
          _g = v ?? {};
          if (!_g.cart) _g.cart = {};
          if (!_g.cart.total || _g.cart.total <= 0) _g.cart.total = 100;
        },
        configurable: true,
        enumerable: true,
      });
    });

    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    await waitForModuleMount(page, {
      consolePattern: /\[widgetality\] min-order: activated/,
      timeoutMs: 14_000,
    });

    // Give the rAF-scheduled updateWidget a tick to render
    await page.waitForTimeout(1_000);

    // On a product page the floating widget should be created (not disabled on non-checkout)
    const dom = await getDomInfo(page, '#mo-widget-floating');
    expect(dom, '#mo-widget-floating must be in DOM').not.toBeNull();
    expect(dom!.inDOM).toBe(true);

    const hasBar = await page.evaluate(
      () => !!document.querySelector('#mo-widget-floating .mo-widget__bar'),
    );
    expect(hasBar).toBeTruthy();
  });
}
