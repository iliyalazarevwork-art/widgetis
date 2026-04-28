/**
 * module-stock-left — smoke e2e test
 *
 * Page:     product page (inserts .wty-stock-left-wrapper next to the buy button
 *           or fallback selectors configured in test-config).
 * Selector: .wty-stock-left-wrapper — the badge wrapper created by createBadge() in dom.ts
 * Notes:    module skips silently if all configured selectors are missing OR the
 *           product is out-of-stock and showForOutOfStock=false.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-stock-left mounts on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '.wty-stock-left-wrapper',
      consolePattern: /\[widgetality\] stock-left: ✅ activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
