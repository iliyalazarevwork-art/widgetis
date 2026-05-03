/**
 * module-video-preview — smoke e2e test
 *
 * Page:     product page (module logs ✅ activated unconditionally; the floating
 *           bubble only appears when a video link is found via mp4Selector, but
 *           the styles element is injected immediately on activation)
 * Selector: #hs-product-video-preview-styles — <style> element (STYLE_ID in
 *           index.ts) injected by injectStyles() immediately after activation.
 * Notes:    The module does NOT guard on isHoroshopProductPage() — it runs on
 *           any page but only renders a bubble when a matching video link exists.
 *           The styles element is the most reliable unconditional DOM marker.
 *           We use a product page so the module has the best chance of finding
 *           embedded video links on real store pages.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-video-preview mounts on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '#hs-product-video-preview-styles',
      consolePattern: /\[widgetality\] product-video-preview: ✅ activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
