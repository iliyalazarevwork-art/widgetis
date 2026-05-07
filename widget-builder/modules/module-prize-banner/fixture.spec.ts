import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// prize-banner reads a prize from localStorage and shows a fixed banner
// The prize must be set BEFORE the page loads using page.addInitScript.
const MODULE = 'module-prize-banner';
const STORAGE_KEY = 'wdg_prize_test';

const PRIZE_DATA = JSON.stringify({
  code: 'PRIZE123',
  label: '10% знижка',
  awardedAt: Date.now(),
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  source: 'test',
});

test.describe(MODULE, () => {
  test('shows banner when prize is in localStorage', async ({ page }) => {
    // Set localStorage before page loads
    await page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key: STORAGE_KEY, value: PRIZE_DATA },
    );

    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        storageKey: STORAGE_KEY,
        hideOnCheckout: false,
        backgroundColor: '#ffd700',
        textColor: '#000',
        accentColor: '#ff5722',
        borderColor: '#e0e0e0',
        borderRadius: 12,
        zIndex: 9999,
      },
      i18n: {
        ua: {
          message: 'Ваш приз: {code}',
          copyLabel: 'Копіювати',
          copiedLabel: 'Скопійовано!',
          closeLabel: 'Закрити',
        },
      },
    });

    await waitForWidget(page);
    await expect(page.locator('#wdg-prize-banner-host')).toBeAttached();
  });

  test('does not show banner when localStorage is empty', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        storageKey: STORAGE_KEY,
        hideOnCheckout: false,
        backgroundColor: '#ffd700',
        textColor: '#000',
        accentColor: '#ff5722',
        borderColor: '#e0e0e0',
        borderRadius: 12,
        zIndex: 9999,
      },
      i18n: {
        ua: {
          message: 'Ваш приз: {code}',
          copyLabel: 'Копіювати',
          copiedLabel: 'Скопійовано!',
          closeLabel: 'Закрити',
        },
      },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('#wdg-prize-banner-host')).not.toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await page.addInitScript(
      ({ key, value }) => { localStorage.setItem(key, value); },
      { key: STORAGE_KEY, value: PRIZE_DATA },
    );

    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: false,
        storageKey: STORAGE_KEY,
        hideOnCheckout: false,
        backgroundColor: '#ffd700',
        textColor: '#000',
        accentColor: '#ff5722',
        borderColor: '#e0e0e0',
        borderRadius: 12,
        zIndex: 9999,
      },
      i18n: {
        ua: {
          message: 'Ваш приз: {code}',
          copyLabel: 'Копіювати',
          copiedLabel: 'Скопійовано!',
          closeLabel: 'Закрити',
        },
      },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('#wdg-prize-banner-host')).not.toBeAttached();
  });

  test('cleanup removes banner', async ({ page }) => {
    await page.addInitScript(
      ({ key, value }) => { localStorage.setItem(key, value); },
      { key: STORAGE_KEY, value: PRIZE_DATA },
    );

    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        storageKey: STORAGE_KEY,
        hideOnCheckout: false,
        backgroundColor: '#ffd700',
        textColor: '#000',
        accentColor: '#ff5722',
        borderColor: '#e0e0e0',
        borderRadius: 12,
        zIndex: 9999,
      },
      i18n: {
        ua: {
          message: 'Ваш приз: {code}',
          copyLabel: 'Копіювати',
          copiedLabel: 'Скопійовано!',
          closeLabel: 'Закрити',
        },
      },
    });

    await waitForWidget(page);
    await expect(page.locator('#wdg-prize-banner-host')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('#wdg-prize-banner-host')).not.toBeAttached();
  });
});
