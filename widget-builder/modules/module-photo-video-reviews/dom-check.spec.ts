/**
 * module-photo-video-reviews — detailed DOM verification test
 *
 * Selector: .hs-photo-review__gallery
 * The widget only renders when the product page has review items in the DOM.
 * Checks: gallery is in DOM, contains at least one image or gallery item.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-photo-video-reviews DOM check on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    // Module only activates when the product page already has review items in DOM.
    // If there are none (tech stores, single-product stores, etc.) skip the test.
    await page.waitForTimeout(3_000);
    const reviewCount = await page.locator('.review-item').count();
    test.skip(reviewCount === 0, `No .review-item elements on ${site.name} product page`);

    await waitForModuleMount(page, {
      selector: '.hs-photo-review__gallery',
      consolePattern: /\[widgetality\] photo-(video-)?reviews?: ✅ activated/,
      timeoutMs: 14_000,
    });

    const dom = await getDomInfo(page, '.hs-photo-review__gallery');
    expect(dom, '.hs-photo-review__gallery must be present in DOM').not.toBeNull();
    expect(dom!.inDOM).toBe(true);

    const galleryItemCount = await page.evaluate(
      () =>
        document.querySelectorAll(
          '.hs-photo-review__gallery [class*="item"], .hs-photo-review__gallery img',
        ).length,
    );
    expect(galleryItemCount).toBeGreaterThan(0);
  });
}
