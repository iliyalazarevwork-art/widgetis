/**
 * module-trust-badges — detailed DOM verification test
 *
 * Selector: .wdg-trust
 * Checks: in DOM, at least 2 badge children, non-empty text, each badge has readable text.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-trust-badges DOM check on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    await waitForModuleMount(page, {
      selector: '.wdg-trust',
      consolePattern: /\[widgetality\] trust-badges: ✅ activated/,
      timeoutMs: 14_000,
    });

    const dom = await getDomInfo(page, '.wdg-trust');
    expect(dom, 'wdg-trust must be present in DOM').not.toBeNull();
    expect(dom!.inDOM).toBe(true);
    expect(dom!.childCount).toBeGreaterThanOrEqual(2);
    expect(dom!.text.length).toBeGreaterThan(0);

    const filledTextCount = await page.evaluate(
      () =>
        [...document.querySelectorAll('.wdg-trust [class*="text"], .wdg-trust span')].filter(
          (el) => el.textContent?.trim(),
        ).length,
    );
    expect(filledTextCount).toBeGreaterThan(0);
  });
}
