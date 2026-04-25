/**
 * module-sticky-buy-button — smoke e2e test
 *
 * Page:     product page, mobile viewport (module checks isHoroshopProductPage()
 *           AND window.innerWidth <= mobileBreakpoint before mounting)
 * Selector: #wdg-sticky-buy — the bar element created by buildBar() in index.ts
 * Notes:    The bar is appended to document.body and is only rendered when the
 *           viewport is ≤768 px. Test uses a mobile viewport width (375px) to
 *           ensure the mount() path is reached.
 *           The bar starts hidden (wdg-sbuy--hidden class) until scroll > 300px;
 *           we only assert DOM presence, not visibility.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-sticky-buy-button mounts on ${site.name}`, async ({ browser }) => {
    // Use a mobile viewport so the module's isMobile() check passes
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();

    try {
      const productPath = await findProductPath(site.domain);
      await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load').catch(() => {});

      const result = await waitForModuleMount(page, {
        selector: '#wdg-sticky-buy',
        consolePattern: /\[wdg-sticky-buy\] mount\(\)/,
        timeoutMs: 14_000,
      });

      expect(result.ok).toBe(true);
    } finally {
      await context.close();
    }
  });
}
