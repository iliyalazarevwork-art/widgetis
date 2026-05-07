/**
 * module-promo-line — detailed DOM verification test
 *
 * Selector: [data-marquee]
 * Checks: in DOM, visible, meaningful width (≥300 px), non-empty text.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-promo-line DOM check on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    await waitForModuleMount(page, {
      selector: '[data-marquee]',
      consolePattern: /\[widgetality\] marquee: ✅ activated/,
      timeoutMs: 14_000,
    });

    const dom = await getDomInfo(page, '[data-marquee]');
    expect(dom, '[data-marquee] must be present in DOM').not.toBeNull();
    expect(dom!.inDOM).toBe(true);
    expect(dom!.visible).toBe(true);
    expect(dom!.width).toBeGreaterThanOrEqual(300);
    expect(dom!.text.length).toBeGreaterThan(0);
  });
}
