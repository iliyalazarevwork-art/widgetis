/**
 * module-last-chance-popup — detailed DOM verification test
 *
 * Selector: #wdg-exit-intent
 * The popup is triggered by a mouseleave event with clientY < 0 (exit-intent).
 * Checks: element mounts, becomes visible after synthetic exit-intent trigger.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-last-chance-popup DOM check on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    await waitForModuleMount(page, {
      consolePattern: /\[widgetality\] (exit-intent|last-chance): ✅ activated/,
      timeoutMs: 14_000,
    });

    // Trigger exit-intent by dispatching mouseleave at the top of the viewport
    await page.evaluate(() => {
      document.dispatchEvent(
        new MouseEvent('mouseleave', { clientY: -5, bubbles: true }),
      );
    });
    await page.waitForTimeout(1_000);

    const dom = await getDomInfo(page, '#wdg-exit-intent');
    expect(dom, '#wdg-exit-intent must appear after exit-intent trigger').not.toBeNull();
    expect(dom!.inDOM).toBe(true);
    expect(dom!.visible).toBe(true);
  });
}
