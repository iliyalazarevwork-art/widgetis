/**
 * module-cart-goal — smoke e2e test
 *
 * Page:     cart/checkout page (/checkout/) — the floating widget is suppressed
 *           on checkout but the main widget is always inserted; on non-checkout
 *           pages both main and floating widgets appear.
 *           We test on the homepage (any page) — the module initialises on every
 *           page load and injects both #cg-widget-main and #cg-widget-floating.
 * Selector: #cg-widget-floating — the floating pill widget appended to body.
 *           (main widget may be hidden if cart total is 0, but floating is always
 *           rendered unless we're on /checkout/ itself)
 * Notes:    The module also logs ✅ activated on every page, making the console
 *           pattern a reliable fallback.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-cart-goal mounts on ${site.name}`, async ({ page }) => {
    // Use homepage — cart-goal activates on every page
    await page.goto(siteUrl(site, '/'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '#cg-widget-floating',
      consolePattern: /\[widgetality\] cart-goal: ✅ activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
