import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// video-preview creates a #hs-product-video-preview floating circle on pages
// that have a video source (either an .mp4 link or testVideoUrl in config).
const MODULE = 'module-video-preview';

const CONFIG = {
  enabled: true,
  mp4Selector: 'a[href$=".mp4"]',
  testVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  showOnMobile: true,
  showOnDesktop: true,
  observeSpa: false,
  insetDesktop: 20,
  insetMobile: 12,
  desktopSize: 180,
  mobileSize: 140,
  desktopMinimizedSize: 80,
  mobileMinimizedSize: 60,
  borderColor: '#ff4c34',
};

const I18N = {
  ua: {
    tooltipText: 'Переглянути відео',
    actionButtonText: 'Вибрати розмір',
    sizeGuideText: '',
    closeLabel: 'Закрити',
  },
};

test.describe(MODULE, () => {
  test('mounts video preview widget on product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: CONFIG,
      i18n: I18N,
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#hs-product-video-preview')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: { ...CONFIG, enabled: false },
      i18n: I18N,
    });

    await page.waitForTimeout(500);
    await expect(page.locator('#hs-product-video-preview')).not.toBeAttached();
  });

  test('does not mount when showOnDesktop is false (desktop viewport)', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: { ...CONFIG, showOnDesktop: false },
      i18n: I18N,
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#hs-product-video-preview')).not.toBeAttached();
  });

  test('picks up mp4 link from product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: { ...CONFIG, testVideoUrl: '' },
      i18n: I18N,
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    // product-page.html has <a href="/test-video.mp4"> which matches mp4Selector
    await expect(page.locator('#hs-product-video-preview')).toBeAttached();
  });

  test('cleanup removes widget', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: CONFIG,
      i18n: I18N,
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#hs-product-video-preview')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('#hs-product-video-preview')).not.toBeAttached();
  });
});
