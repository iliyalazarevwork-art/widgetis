/**
 * module-spin-the-wheel — smoke e2e test
 *
 * Strategy:
 *   1. Navigate to a product page via the site-proxy.
 *   2. Wait for the module to activate (console pattern).
 *   3. Trigger exit-intent via simulated mouseleave at clientY=-5.
 *   4. Assert the #wdg-spin-the-wheel modal appears in the DOM.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-spin-the-wheel mounts on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    // Wait enough for the module bundle to execute
    await page.waitForTimeout(3_000);

    // Trigger exit-intent
    await page.evaluate(() => {
      const ev = new MouseEvent('mouseleave', { bubbles: true });
      Object.defineProperty(ev, 'clientY', { value: -5 });
      Object.defineProperty(ev, 'relatedTarget', { value: null });
      document.dispatchEvent(ev);
    });

    const result = await waitForModuleMount(page, {
      selector: '#wdg-spin-the-wheel',
      consolePattern: /\[widgetality\] spin-the-wheel: ✅ activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
