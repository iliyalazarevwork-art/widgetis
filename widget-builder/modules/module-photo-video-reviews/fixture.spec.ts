import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// photo-video-reviews fetches POST /api/v1/widgets/reviews/match for every
// review block in DOM and renders .hs-photo-review__gallery only for those
// the backend reports media for. The fixture intercepts that endpoint with
// page.route() so the test runs without a live backend.
const MODULE = 'module-photo-video-reviews';
const MATCH_URL = '**/api/v1/widgets/reviews/match';

const baseConfig = {
  enabled: true,
  reviewSelector: '.review-item',
  authorSelector: '.review-item__name',
  bodySelector: '.review-item__body',
  openInLightbox: true,
  observeDom: false,
  showOnMobile: true,
  showOnDesktop: true,
  aspectRatio: '3/4',
  borderRadius: 12,
  enableUpload: false,
};

const baseI18n = {
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
};

test.describe(MODULE, () => {
  test('renders gallery for reviews the API returns media for', async ({ page }) => {
    await page.route(MATCH_URL, async (route) => {
      const payload = route.request().postDataJSON() as { candidates: Array<{ name: string; body: string }> };
      // Echo back the first candidate as a match — the fixture only has one
      // .review-item, so this guarantees a hit regardless of fixture text.
      const first = payload.candidates[0];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matches: first
            ? [{ name: first.name, body: first.body, media: [{ url: 'https://picsum.photos/seed/test/200/300' }] }]
            : [],
        }),
      });
    });

    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: baseConfig,
      i18n: baseI18n,
    });

    await waitForWidget(page);
    await expect(page.locator('.hs-photo-review__gallery')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: { ...baseConfig, enabled: false },
      i18n: baseI18n,
    });

    await page.waitForTimeout(500);
    await expect(page.locator('.hs-photo-review__gallery')).not.toBeAttached();
  });

  test('renders nothing when API returns no matches', async ({ page }) => {
    await page.route(MATCH_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ matches: [] }),
      }),
    );

    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: baseConfig,
      i18n: baseI18n,
    });

    await page.waitForTimeout(500);
    await expect(page.locator('.hs-photo-review__gallery')).not.toBeAttached();
  });

  test('cleanup removes galleries', async ({ page }) => {
    await page.route(MATCH_URL, async (route) => {
      const payload = route.request().postDataJSON() as { candidates: Array<{ name: string; body: string }> };
      const first = payload.candidates[0];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          matches: first
            ? [{ name: first.name, body: first.body, media: [{ url: 'https://picsum.photos/seed/cleanup/200/300' }] }]
            : [],
        }),
      });
    });

    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: baseConfig,
      i18n: baseI18n,
    });

    await waitForWidget(page);
    await expect(page.locator('.hs-photo-review__gallery')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('.hs-photo-review__gallery')).not.toBeAttached();
  });
});
