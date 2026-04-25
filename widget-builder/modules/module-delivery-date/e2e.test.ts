/**
 * module-delivery-date — smoke e2e test
 *
 * Page:     product page (module inserts badge next to .j-product-block)
 * Selector: .dd-wrapper — the badge wrapper created by createBadge() in dom.ts
 * Notes:    test-config includes a broad fallback selector (.j-product-block)
 *           so the badge inserts even on stores with non-standard product layouts.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-delivery-date mounts on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '.dd-wrapper',
      consolePattern: /\[widgetality\] delivery-date: ✅ activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
