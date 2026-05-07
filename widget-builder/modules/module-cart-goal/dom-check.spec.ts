/**
 * module-cart-goal — detailed DOM verification test
 *
 * Selector: #cg-widget-floating (floating widget, works on any page)
 * Checks: in DOM, visible, non-zero dimensions, has a progress bar element.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-cart-goal DOM check on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    await waitForModuleMount(page, {
      selector: '#cg-widget-floating',
      consolePattern: /\[widgetality\] cart-goal: ✅ activated/,
      timeoutMs: 14_000,
    });

    const dom = await getDomInfo(page, '#cg-widget-floating');
    expect(dom, '#cg-widget-floating must be present in DOM').not.toBeNull();
    expect(dom!.inDOM).toBe(true);
    expect(dom!.visible).toBe(true);
    expect(dom!.width).toBeGreaterThan(0);
    expect(dom!.height).toBeGreaterThan(0);

    const hasProgressBar = await page.evaluate(
      () =>
        !!document.querySelector(
          '#cg-widget-floating [class*="progress"], #cg-widget-floating [class*="bar"]',
        ),
    );
    expect(hasProgressBar).toBeTruthy();
  });
}
