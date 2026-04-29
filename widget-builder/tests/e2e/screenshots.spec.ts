/**
 * Скриншоты новых виджетов на реальных Horoshop-сайтах через site-proxy.
 *
 * Запуск:
 *   docker compose -f docker-compose.dev.yml up -d site-proxy
 *   task build:demo
 *   pnpm exec playwright test --config tests/e2e/playwright.config.ts tests/e2e/screenshots.spec.ts
 *
 * Картинки появятся в widget-builder/test-results/screenshots/.
 */

import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { TEST_SITES, siteUrl, findProductPath } from './helpers';

const OUT_DIR = resolve(import.meta.dirname, '..', '..', 'test-results', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

type Variant = { name: string; viewport: { width: number; height: number }; userAgent?: string };

const VARIANTS: Variant[] = [
  {
    name: 'desktop',
    viewport: { width: 1366, height: 900 },
  },
  {
    name: 'mobile',
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  },
];

for (const site of TEST_SITES) {
  for (const variant of VARIANTS) {
    test(`screenshots/${site.name}/${variant.name}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: variant.viewport,
        userAgent: variant.userAgent,
      });
      const page = await context.newPage();

      try {
        const productPath = await findProductPath(site.domain);
        await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('load').catch(() => {});

        // Дать виджетам полностью маунтиться
        await page.waitForTimeout(4_000);

        // 1. Базовый скрин страницы (videoсь товарной страницы со всеми статичными виджетами)
        await page.screenshot({
          path: resolve(OUT_DIR, `${site.name}-${variant.name}-product.png`),
          fullPage: true,
        });

        // 2. Триггер exit-intent popup
        await page.evaluate(() => {
          const ev = new MouseEvent('mouseleave', { bubbles: true });
          Object.defineProperty(ev, 'clientY', { value: -5 });
          Object.defineProperty(ev, 'relatedTarget', { value: null });
          document.dispatchEvent(ev);
        });
        await page.waitForTimeout(800);
        const eip = page.locator('#wdg-exit-intent');
        if (await eip.count()) {
          await page.screenshot({
            path: resolve(OUT_DIR, `${site.name}-${variant.name}-exit-intent.png`),
            fullPage: false,
          });
          // закрыть для следующих скринов
          await page.evaluate(() => {
            document
              .querySelector<HTMLButtonElement>('#wdg-exit-intent .wdg-eip__close')
              ?.click();
          });
          await page.waitForTimeout(400);
        }

        // 3. Spin-the-wheel — теперь живёт в shadow DOM #wdg-stw-host
        await page.waitForTimeout(500);
        const stwHost = page.locator('#wdg-stw-host');
        if (await stwHost.count()) {
          await page.screenshot({
            path: resolve(OUT_DIR, `${site.name}-${variant.name}-spin-wheel.png`),
            fullPage: false,
          });
        }

        // 4. Floating messengers — раскрытое состояние
        const fmsgBubble = page.locator('.wdg-fmsg__bubble, [class*="fmsg"]').first();
        if (await fmsgBubble.count()) {
          await fmsgBubble.click({ force: true }).catch(() => {});
          await page.waitForTimeout(500);
          await page.screenshot({
            path: resolve(OUT_DIR, `${site.name}-${variant.name}-floating-messengers.png`),
            fullPage: false,
          });
        }

        // 5. Trust-badges — скрин в области product info
        const trust = page.locator('.wdg-trust').first();
        if (await trust.count()) {
          await trust.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          const box = await trust.boundingBox();
          if (box) {
            await page.screenshot({
              path: resolve(OUT_DIR, `${site.name}-${variant.name}-trust-badges.png`),
              clip: {
                x: Math.max(0, box.x - 20),
                y: Math.max(0, box.y - 20),
                width: Math.min(variant.viewport.width, box.width + 40),
                height: box.height + 40,
              },
            });
          }
        }

        // 6. Recently-viewed — скрин секции
        const rv = page.locator('.wdg-rv').first();
        if (await rv.count()) {
          await rv.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          await page.screenshot({
            path: resolve(OUT_DIR, `${site.name}-${variant.name}-recently-viewed.png`),
            fullPage: false,
          });
        }
      } finally {
        await context.close();
      }
    });
  }
}
