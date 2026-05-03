/**
 * module-photo-video-reviews — smoke e2e test
 *
 * Page:     product page (module guards with isHoroshopProductPage() — checks
 *           for .product-header, .j-product-block, etc. in the DOM)
 * Selector: #hs-photo-reviews-styles — the <style> element injected by
 *           ensureStyles() in index.ts. It is injected before any review
 *           scanning, so it is present even when no .review-item elements exist.
 * Notes:    The module logs ✅ activated only after the product-page guard passes.
 *           Using the style element as the primary marker ensures we confirm
 *           the module reached the activation path on a real product page.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-photo-video-reviews mounts on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '#hs-photo-reviews-styles',
      consolePattern: /\[widgetality\] photo-reviews: ✅ activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
