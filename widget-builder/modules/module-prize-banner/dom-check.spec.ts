/**
 * module-prize-banner — detailed DOM verification test
 *
 * Host: #wdg-prize-banner-host (shadow DOM)
 * Pre-condition: set localStorage prize key before navigation so the banner
 * renders immediately instead of waiting for a spin result.
 * Checks: host element is in DOM, shadow root has children.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getShadowDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-prize-banner DOM check on ${site.name}`, async ({ page }) => {
    // Inject prize into localStorage before the page loads.
    // readActivePrize() expects JSON {code, label, awardedAt}, plain string fails validation.
    await page.addInitScript(() =>
      localStorage.setItem(
        'wty_active_prize',
        JSON.stringify({ code: 'PRIZE10', label: 'Знижка 10%', awardedAt: Date.now() }),
      ),
    );

    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    await waitForModuleMount(page, {
      consolePattern: /\[widgetality\] prize-banner: ✅ activated/,
      timeoutMs: 14_000,
    });

    await page.waitForTimeout(500);

    const shadow = await getShadowDomInfo(page, '#wdg-prize-banner-host');
    expect(shadow, '#wdg-prize-banner-host must be present in DOM').not.toBeNull();
    expect(shadow!.hostInDOM).toBe(true);
    expect(shadow!.shadowChildCount).toBeGreaterThan(0);
  });
}
