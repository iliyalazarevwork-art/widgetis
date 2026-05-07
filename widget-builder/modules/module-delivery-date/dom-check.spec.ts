/**
 * module-delivery-date — detailed DOM verification test
 *
 * Selector: .dd-wrapper
 * Checks: in DOM, visible, has date-related text, contains an image or SVG (Nova Poshta logo).
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-delivery-date DOM check on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    await waitForModuleMount(page, {
      selector: '.dd-wrapper',
      consolePattern: /\[widgetality\] delivery-date: ✅ activated/,
      timeoutMs: 14_000,
    });

    const dom = await getDomInfo(page, '.dd-wrapper');
    expect(dom, 'dd-wrapper must be present in DOM').not.toBeNull();
    expect(dom!.inDOM).toBe(true);
    expect(dom!.visible).toBe(true);
    expect(dom!.text.length).toBeGreaterThan(5);

    const hasMediaElement = await page.evaluate(
      () => !!document.querySelector('.dd-wrapper img, .dd-wrapper svg'),
    );
    expect(hasMediaElement).toBeTruthy();
  });
}
