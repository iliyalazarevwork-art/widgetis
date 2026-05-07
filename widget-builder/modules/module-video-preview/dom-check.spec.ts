/**
 * module-video-preview — detailed DOM verification test
 *
 * Root element: #hs-product-video-preview
 * The widget only mounts when a product page has an mp4/YouTube link.
 * If the current test page has no video links, the test is skipped gracefully.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-video-preview DOM check on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    // Give time for the page JS to render
    await page.waitForTimeout(3_000);

    // Check if there is an mp4/YouTube video link on this product page
    const hasVideoLink = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href]')];
      return links.some(
        (a) =>
          /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test((a as HTMLAnchorElement).href) ||
          /youtube\.com|youtu\.be/i.test((a as HTMLAnchorElement).href),
      );
    });

    if (!hasVideoLink) {
      test.skip();
      return;
    }

    await waitForModuleMount(page, {
      selector: '#hs-product-video-preview',
      consolePattern: /\[widgetality\] product-video-preview: ✅ activated/,
      timeoutMs: 14_000,
    });

    const dom = await getDomInfo(page, '#hs-product-video-preview');
    expect(dom, '#hs-product-video-preview must be present in DOM').not.toBeNull();
    expect(dom!.inDOM).toBe(true);
    expect(dom!.visible).toBe(true);
    expect(dom!.width).toBeGreaterThan(0);
    expect(dom!.height).toBeGreaterThan(0);
  });
}
