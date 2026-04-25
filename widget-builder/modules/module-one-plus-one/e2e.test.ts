/**
 * module-one-plus-one — smoke e2e test
 *
 * Page:     any page (module initialises on all pages; it fetches the backend
 *           API when the cart changes but the initialisation itself is global)
 * Selector: #wdg-1plus1 — the <style> element injected by injectStyles()
 *           (id checked in index.ts line 526: `if (document.getElementById('wdg-1plus1')) return;`)
 * Notes:    The styles element is the only unconditional DOM marker — it is
 *           injected at the very start of onePlusOne() before any cart logic.
 *           console pattern is the "active, site=…" log at line 493.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-one-plus-one mounts on ${site.name}`, async ({ page }) => {
    await page.goto(siteUrl(site, '/'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '#wdg-1plus1',
      consolePattern: /\[widgetality\] 1\+1=3:.*active/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
