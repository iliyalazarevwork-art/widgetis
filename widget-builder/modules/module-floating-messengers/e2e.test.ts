/**
 * module-floating-messengers — smoke e2e test
 *
 * Page:     any page (widget is floating, not page-specific)
 * Selector: #wdg-fmsg — floating messenger bubble
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-floating-messengers mounts on ${site.name}`, async ({ page }) => {
    await page.goto(siteUrl(site, '/'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '#wdg-fmsg',
      consolePattern: /\[widgetality\] floating-messengers: ✅ activated/,
      timeoutMs: 15_000,
    });

    expect(result.ok).toBe(true);
  });
}
