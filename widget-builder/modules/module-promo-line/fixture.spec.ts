import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// promo-line (marquee) creates an element with [data-marquee] attribute
const MODULE = 'module-promo-line';

test.describe(MODULE, () => {
  test('mounts marquee on any page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        speed: 50,
        height: 40,
        isFixed: false,
        ttlHours: 0,
        mode: 'overlay',
        colors: {
          desktop: { background: '#ff5722', text: '#fff' },
          mobile: { background: '#ff5722', text: '#fff' },
        },
      },
      i18n: { ua: ['Безкоштовна доставка від 1000 ₴', 'Знижки до 30%', 'Новинки щотижня'] },
    });

    await waitForWidget(page);
    await expect(page.locator('[data-marquee]')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: false,
        speed: 50,
        height: 40,
        isFixed: false,
        ttlHours: 0,
        mode: 'overlay',
        colors: {
          desktop: { background: '#ff5722', text: '#fff' },
          mobile: { background: '#ff5722', text: '#fff' },
        },
      },
      i18n: { ua: ['Безкоштовна доставка від 1000 ₴'] },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('[data-marquee]')).not.toBeAttached();
  });

  test('marquee contains the configured messages', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        speed: 50,
        height: 40,
        isFixed: false,
        ttlHours: 0,
        mode: 'overlay',
        colors: {
          desktop: { background: '#ff5722', text: '#fff' },
          mobile: { background: '#ff5722', text: '#fff' },
        },
      },
      i18n: { ua: ['Безкоштовна доставка від 1000 ₴', 'Знижки до 30%'] },
    });

    await waitForWidget(page);
    const marqueeText = await page.locator('[data-marquee]').textContent();
    expect(marqueeText).toContain('Безкоштовна доставка від 1000 ₴');
  });

  test('cleanup removes marquee', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        speed: 50,
        height: 40,
        isFixed: false,
        ttlHours: 0,
        mode: 'overlay',
        colors: {
          desktop: { background: '#ff5722', text: '#fff' },
          mobile: { background: '#ff5722', text: '#fff' },
        },
      },
      i18n: { ua: ['Безкоштовна доставка від 1000 ₴', 'Знижки до 30%', 'Новинки щотижня'] },
    });

    await waitForWidget(page);
    await expect(page.locator('[data-marquee]')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('[data-marquee]')).not.toBeAttached();
  });
});
