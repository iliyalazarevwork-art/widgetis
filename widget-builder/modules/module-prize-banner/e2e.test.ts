/**
 * module-prize-banner — smoke e2e
 *
 * Pre-condition: записать приз в localStorage до перезагрузки страницы,
 * иначе виджет ничего не отрендерит.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath, waitForModuleMount } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-prize-banner mounts on ${site.name}`, async ({ page }) => {
    const productPath = await findProductPath(site.domain);
    await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    // Записать приз и перезагрузить — модуль читает localStorage на старте
    await page.evaluate(() => {
      localStorage.setItem(
        'wty_active_prize',
        JSON.stringify({
          code: 'TESTPRIZE',
          label: 'Безкоштовна доставка',
          awardedAt: Date.now(),
          expiresAt: Date.now() + 7 * 86_400_000,
          source: 'spin-the-wheel',
        }),
      );
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    const result = await waitForModuleMount(page, {
      selector: '#wdg-prize-banner-host',
      consolePattern: /\[widgetality\] prize-banner: ✅ activated/,
      timeoutMs: 10_000,
    });

    expect(result.ok).toBe(true);
  });
}
