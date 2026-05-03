/**
 * module-promo-line — smoke e2e test
 *
 * Page:     any page (marquee runs on every page load, no page-type guard)
 * Selector: [data-marquee] — the root element set by createRoot() in dom.ts
 * Notes:    ttlHours is 0 in test-config so the "closed" localStorage flag is
 *           never set and the banner always appears.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-promo-line mounts on ${site.name}`, async ({ page }) => {
    await page.goto(siteUrl(site, '/'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '[data-marquee]',
      consolePattern: /\[widgetality\] marquee: ✅ activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
