/**
 * module-sticky-buy-button — detailed DOM verification test
 *
 * Mobile (≤768 px): widget mounts, starts hidden, becomes visible after scroll.
 * Desktop (1280 px): widget must NOT mount on a non-product page.
 *
 * Selector: #wdg-sticky-buy
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-sticky-buy-button mobile DOM check on ${site.name}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();

    try {
      const productPath = await findProductPath(site.domain);
      await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load').catch(() => {});

      await waitForModuleMount(page, {
        selector: '#wdg-sticky-buy',
        consolePattern: /\[wdg-sticky-buy\]/,
        timeoutMs: 14_000,
      });

      const dom = await getDomInfo(page, '#wdg-sticky-buy');
      expect(dom, '#wdg-sticky-buy must be present in DOM on mobile').not.toBeNull();
      expect(dom!.inDOM).toBe(true);
      expect(dom!.width).toBeGreaterThan(0);

      // Widget starts hidden
      await expect(page.locator('#wdg-sticky-buy')).toHaveClass(/wdg-sbuy--hidden/);

      // After scrolling to bottom it should reveal itself
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);
      await expect(page.locator('#wdg-sticky-buy')).not.toHaveClass(/wdg-sbuy--hidden/);
    } finally {
      await context.close();
    }
  });

  test(`module-sticky-buy-button desktop DOM check on ${site.name}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    try {
      const productPath = await findProductPath(site.domain);
      await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load').catch(() => {});

      // Give the bundle time to run; widget should NOT mount on desktop
      await page.waitForTimeout(4_000);

      await expect(page.locator('#wdg-sticky-buy')).not.toBeAttached();
    } finally {
      await context.close();
    }
  });
}
