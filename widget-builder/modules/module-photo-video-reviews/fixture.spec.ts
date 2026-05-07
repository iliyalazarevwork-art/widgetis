import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// photo-video-reviews injects .hs-photo-review__gallery inside review bodies
// that match the configured photos list (matched by author or body text contains).
const MODULE = 'module-photo-video-reviews';

test.describe(MODULE, () => {
  test('injects gallery into review on product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        reviewSelector: '.review-item',
        authorSelector: '.review-item__name',
        bodySelector: '.review-item__body',
        photos: [
          {
            // Match by text contained in review body
            contains: 'відмінний',
            urls: ['https://picsum.photos/seed/test/200/300'],
            alt: 'Фото відгуку',
          },
        ],
        fallbackUrls: [],
        openInLightbox: true,
        observeDom: false,
        showOnMobile: true,
        showOnDesktop: true,
        aspectRatio: '3/4',
        borderRadius: 12,
        enableUpload: false,
      },
      i18n: {
        ua: {
          viewPhotoLabel: 'Переглянути',
          closeLabel: 'Закрити',
          prevLabel: 'Назад',
          nextLabel: 'Далі',
          addMediaLabel: 'Додати фото',
          mediaHint: 'Формат: jpg/png',
          errPhotoMime: 'Невірний формат',
          errPhotoSize: 'Файл завеликий',
          errPhotoCount: 'Забагато файлів',
          errVideoMime: 'Невірний формат відео',
          errVideoSize: 'Відео завелике',
          errMixed: 'Мішані файли',
          removeLabel: 'Видалити',
        },
      },
    });

    await waitForWidget(page);
    await expect(page.locator('.hs-photo-review__gallery')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: false,
        reviewSelector: '.review-item',
        authorSelector: '.review-item__name',
        bodySelector: '.review-item__body',
        photos: [],
        fallbackUrls: [],
        openInLightbox: true,
        observeDom: false,
        showOnMobile: true,
        showOnDesktop: true,
        aspectRatio: '3/4',
        borderRadius: 12,
        enableUpload: false,
      },
      i18n: { ua: { viewPhotoLabel: 'Переглянути', closeLabel: 'Закрити', prevLabel: 'Назад', nextLabel: 'Далі', addMediaLabel: '', mediaHint: '', errPhotoMime: '', errPhotoSize: '', errPhotoCount: '', errVideoMime: '', errVideoSize: '', errMixed: '', removeLabel: '' } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('.hs-photo-review__gallery')).not.toBeAttached();
  });

  test('injects fallback gallery when no photos match but fallbackUrls set', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        reviewSelector: '.review-item',
        authorSelector: '.review-item__name',
        bodySelector: '.review-item__body',
        photos: [],
        fallbackUrls: ['https://picsum.photos/seed/fallback/200/300'],
        openInLightbox: true,
        observeDom: false,
        showOnMobile: true,
        showOnDesktop: true,
        aspectRatio: '3/4',
        borderRadius: 12,
        enableUpload: false,
      },
      i18n: {
        ua: {
          viewPhotoLabel: 'Переглянути',
          closeLabel: 'Закрити',
          prevLabel: 'Назад',
          nextLabel: 'Далі',
          addMediaLabel: '',
          mediaHint: '',
          errPhotoMime: '',
          errPhotoSize: '',
          errPhotoCount: '',
          errVideoMime: '',
          errVideoSize: '',
          errMixed: '',
          removeLabel: '',
        },
      },
    });

    await waitForWidget(page);
    await expect(page.locator('.hs-photo-review__gallery')).toBeAttached();
  });

  test('cleanup removes galleries', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        reviewSelector: '.review-item',
        authorSelector: '.review-item__name',
        bodySelector: '.review-item__body',
        photos: [],
        fallbackUrls: ['https://picsum.photos/seed/fallback/200/300'],
        openInLightbox: true,
        observeDom: false,
        showOnMobile: true,
        showOnDesktop: true,
        aspectRatio: '3/4',
        borderRadius: 12,
        enableUpload: false,
      },
      i18n: {
        ua: {
          viewPhotoLabel: 'Переглянути',
          closeLabel: 'Закрити',
          prevLabel: 'Назад',
          nextLabel: 'Далі',
          addMediaLabel: '',
          mediaHint: '',
          errPhotoMime: '',
          errPhotoSize: '',
          errPhotoCount: '',
          errVideoMime: '',
          errVideoSize: '',
          errMixed: '',
          removeLabel: '',
        },
      },
    });

    await waitForWidget(page);
    await expect(page.locator('.hs-photo-review__gallery')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('.hs-photo-review__gallery')).not.toBeAttached();
  });
});
