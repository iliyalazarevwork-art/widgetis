/**
 * module-free-delivery-bar — smoke e2e test
 *
 * Checks that the sticky delivery-progress bar appears at the top of the page
 * and logs the activation message on a real Horoshop store.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-free-delivery-bar mounts on ${site.name}`, async ({ page }) => {
    await page.goto(siteUrl(site, '/'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '#wdg-fdb-bar',
      consolePattern: /\[widgetality\] free-delivery-bar: ✅ activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
