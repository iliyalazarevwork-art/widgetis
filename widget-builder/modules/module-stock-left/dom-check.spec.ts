/**
 * module-stock-left — detailed DOM verification test
 *
 * Selector: .wty-stock-left-wrapper
 * Checks: element in DOM, visible, contains a stock count number, has children.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-stock-left DOM check on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    await waitForModuleMount(page, {
      selector: '.wty-stock-left-wrapper',
      consolePattern: /\[widgetality\] stock-left: ✅ activated/,
      timeoutMs: 14_000,
    });

    const dom = await getDomInfo(page, '.wty-stock-left-wrapper');
    expect(dom, 'wrapper must be present in DOM').not.toBeNull();
    expect(dom!.inDOM).toBe(true);
    expect(dom!.visible).toBe(true);
    expect(dom!.text).toMatch(/\d+/);
    expect(dom!.childCount).toBeGreaterThan(0);
  });
}
