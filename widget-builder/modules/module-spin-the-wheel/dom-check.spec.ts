/**
 * module-spin-the-wheel — detailed DOM verification test
 *
 * Uses a shadow DOM host: #wdg-stw-host
 * Checks: host element is in DOM, shadow root has children rendered inside it.
 *
 * Note: the demo-bundle test-config sets delaySec=0 so the modal appears immediately.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getShadowDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-spin-the-wheel DOM check on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    // Shadow DOM doesn't expose a plain selector; rely on console log
    await waitForModuleMount(page, {
      consolePattern: /\[widgetality\] spin-the-wheel: ✅ activated/,
      timeoutMs: 14_000,
    });

    // Give the shadow DOM a moment to render
    await page.waitForTimeout(500);

    const shadow = await getShadowDomInfo(page, '#wdg-stw-host');
    expect(shadow, '#wdg-stw-host must be present in DOM').not.toBeNull();
    expect(shadow!.hostInDOM).toBe(true);
    expect(shadow!.shadowChildCount).toBeGreaterThan(0);
  });
}
