/**
 * module-last-chance-popup — smoke e2e test
 *
 * Page:     product page (any). Module activates after `minTimeOnPageSec`,
 *           then shows on mouse-leave or popstate.
 * Strategy: trigger popup explicitly via mouseleave at clientY=-5; assert
 *           #wdg-exit-intent appears in DOM. Falls back to console pattern.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-last-chance-popup mounts on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    // Активация листенеров минимум через minTimeOnPageSec=0 в test-config — попап триггерится сразу
    await page.waitForTimeout(2_500);

    // Имитируем mouseleave вверх
    await page.evaluate(() => {
      const ev = new MouseEvent('mouseleave', { bubbles: true });
      Object.defineProperty(ev, 'clientY', { value: -5 });
      Object.defineProperty(ev, 'relatedTarget', { value: null });
      document.dispatchEvent(ev);
    });

    const result = await waitForModuleMount(page, {
      selector: '#wdg-exit-intent',
      consolePattern: /\[widgetality\] exit-intent: ✅ activated/,
      timeoutMs: 10_000,
    });

    expect(result.ok).toBe(true);
  });
}
