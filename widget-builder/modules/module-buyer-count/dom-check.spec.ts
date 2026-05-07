/**
 * module-buyer-count (social-proof) — detailed DOM verification test
 *
 * The module inserts .sp-wrapper badges next to configured selectors.
 * Selector: .sp-wrapper
 * Checks: in DOM, visible, badge count display is non-empty, has sp-badge child.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-buyer-count DOM check on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    await waitForModuleMount(page, {
      selector: '.sp-wrapper',
      consolePattern: /\[widgetality\] social-proof: ✅ activated/,
      timeoutMs: 14_000,
    });

    const dom = await getDomInfo(page, '.sp-wrapper');
    expect(dom, '.sp-wrapper must be present in DOM').not.toBeNull();
    expect(dom!.inDOM).toBe(true);
    expect(dom!.visible).toBe(true);
    expect(dom!.childCount).toBeGreaterThan(0);

    // The badge count span must have a non-empty numeric text
    const countText = await page.evaluate(
      () => document.querySelector('.sp-badge__count')?.textContent?.trim() ?? '',
    );
    expect(countText).toMatch(/\d+/);
  });
}
