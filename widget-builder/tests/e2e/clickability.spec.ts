/**
 * Кликабельность ключевых элементов на реальном tehnomix.com.ua
 * после монтирования всех виджетов. Цель — убедиться, что floating-
 * messengers и подобные не перехватывают клики по основной кнопке.
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, findProductPath } from './helpers';

test.describe.configure({ mode: 'serial' });

async function closeAnyOpenPopups(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    document
      .querySelectorAll('#wdg-exit-intent, #wdg-stw-host, .wdg-stw, .wdg-eip')
      .forEach((el) => el.remove());
  });
  await page.waitForTimeout(300);
}

for (const site of TEST_SITES) {
  test(`clickability on ${site.name} (desktop)`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const page = await context.newPage();
    try {
      const productPath = await findProductPath(site.domain);
      await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(4_000); // дать всем виджетам инициализироваться

      // В test-config попапы открываются мгновенно (delaySec=0). Закрываем их перед
      // проверкой кликабельности — мы тестируем «холодное» состояние страницы.
      await closeAnyOpenPopups(page);

      // Координата кнопки «Замовити» / buy
      const cta = page.locator('.j-buy-button-add, .buy-btn, [data-buy-button]').first();
      const ctaCount = await cta.count();
      expect(ctaCount, 'buy button must be present').toBeGreaterThan(0);
      await cta.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);

      const box = await cta.boundingBox();
      expect(box, 'buy button must have a layout box').not.toBeNull();
      const x = box!.x + box!.width / 2;
      const y = box!.y + box!.height / 2;

      // elementFromPoint должен вернуть кнопку (или её потомка), а не виджетный overlay
      const topEl = await page.evaluate(
        ([cx, cy]) => {
          const el = document.elementFromPoint(cx, cy);
          if (!el) return null;
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id,
            class: el.className,
            isWidgetOverlay: el.closest('[id^="wdg-"], [class^="wdg-"]') !== null,
          };
        },
        [x, y],
      );
      expect(topEl, 'must hit something at button center').not.toBeNull();
      expect(
        topEl!.isWidgetOverlay,
        `widget overlay blocks clicks: ${JSON.stringify(topEl)}`,
      ).toBe(false);
    } finally {
      await context.close();
    }
  });

  test(`clickability on ${site.name} (mobile)`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();
    try {
      const productPath = await findProductPath(site.domain);
      await page.goto(siteUrl(site, productPath), { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(4_000);
      await closeAnyOpenPopups(page);

      // На мобиле проверяем правый-нижний угол: floating-messengers НЕ должен
      // перекрывать клики там, где он не виден сам.
      // Точка чуть выше bubble (за пределами bubble, в зоне «фантомного» бокса карточки).
      const point = await page.evaluate(() => {
        const fm = document.getElementById('wdg-fmsg');
        if (!fm) return null;
        const r = fm.getBoundingClientRect();
        // Точка в верхнем правом углу root-контейнера, т.е. зона свёрнутой карточки
        return { x: r.right - 30, y: r.top + 20 };
      });

      if (point) {
        const topEl = await page.evaluate(
          ([cx, cy]: [number, number]) => {
            const el = document.elementFromPoint(cx, cy);
            if (!el) return null;
            return {
              tag: el.tagName.toLowerCase(),
              isFmsg:
                el.closest('#wdg-fmsg') !== null &&
                !el.matches('.wdg-fmsg__bubble') &&
                el.closest('.wdg-fmsg__bubble') === null,
            };
          },
          [point.x, point.y],
        );
        expect(
          topEl!.isFmsg,
          'fmsg root must not capture clicks above bubble area when collapsed',
        ).toBe(false);
      }
    } finally {
      await context.close();
    }
  });
}
