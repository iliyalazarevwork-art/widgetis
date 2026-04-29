/**
 * module-trust-badges — smoke e2e test
 *
 * Page:     product page (selectors include .j-buy-button-add etc.)
 * Selector: .wdg-trust — polosa значків під кнопкою "Купити"
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-trust-badges mounts on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '.wdg-trust',
      consolePattern: /\[widgetality\] trust-badges: ✅ activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
