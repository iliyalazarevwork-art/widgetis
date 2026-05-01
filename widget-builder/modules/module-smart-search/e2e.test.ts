/**
 * module-smart-search — smoke e2e test
 *
 * Page:     homepage (search hooks are present on every Horoshop page)
 * Selector: [data-ssrch-root] — the root element set by buildOverlayShell() in dom.ts
 * Notes:    the overlay is hidden by default; we simulate a search-button click
 *           to trigger the open flow, then check the panel is visible in DOM.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-smart-search mounts on ${site.name}`, async ({ page }) => {
    await page.goto(siteUrl(site, '/'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    // Wait for the module to activate (console log)
    const result = await waitForModuleMount(page, {
      selector: '[data-ssrch-root]',
      consolePattern: /\[widgetality\] smart-search: ✅ activated/,
      timeoutMs: 12_000,
    });

    expect(result.ok).toBe(true);

    // Verify the overlay root exists in DOM
    const root = page.locator('[data-ssrch-root]');
    await expect(root).toHaveCount(1);

    // Trigger open by clicking a search toggle if present, otherwise via keyboard shortcut
    const searchBtn = page.locator('.search__button, [data-button-action="search-toggle"], .search__input').first();
    const btnCount = await searchBtn.count();
    if (btnCount > 0) {
      await searchBtn.click({ force: true });
    } else {
      await page.keyboard.press('Control+k');
    }

    // Panel should become visible
    await expect(root).toHaveClass(/ssrch-open/, { timeout: 4_000 });
  });
}
