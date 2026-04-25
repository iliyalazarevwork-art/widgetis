/**
 * module-min-order — smoke e2e test
 *
 * Page:     any page (module activates on all pages; floating widget appended to
 *           body; main widget inserted near cart summary or body)
 * Selector: #mo-widget-floating — the floating pill widget (id set in dom.ts)
 * Notes:    The floating widget is always rendered unless the page is a checkout
 *           AND floatingWidget=false. test-config sets floatingWidget=true.
 *           On non-checkout pages both main and floating widgets are inserted.
 *           console log uses "activated" (not "✅") — fallback pattern reflects
 *           the actual log string from index.ts.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-min-order mounts on ${site.name}`, async ({ page }) => {
    await page.goto(siteUrl(site, '/'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '#mo-widget-floating',
      consolePattern: /\[widgetality\] min-order: activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);
  });
}
