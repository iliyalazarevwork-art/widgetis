/**
 * module-social-proof — smoke e2e test
 *
 * Page:     product page (inserts .sp-wrapper next to the product price box or
 *           the fallback .j-product-block selector in test-config)
 * Selector: .sp-wrapper — the badge wrapper created by createBadge() in dom.ts
 * Notes:    module skips silently if the target selector isn't present AND
 *           showForOutOfStock=false AND the product is out of stock.
 *           The console pattern is the reliable fallback.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-social-proof mounts on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '.sp-wrapper',
      consolePattern: /\[widgetality\] social-proof: ✅ activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
