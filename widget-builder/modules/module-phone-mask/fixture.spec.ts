import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// phone-mask wraps phone inputs with .wdg-pm-wrap
const MODULE = 'module-phone-mask';

test.describe(MODULE, () => {
  test('wraps phone input on checkout page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        selector: '.j-phone-masked',
        defaultCountry: 'UA',
        hidePicker: false,
        allowedCountries: [],
        geoip: false,
        geoipUrl: 'https://api.country.is',
        rememberLastChoice: true,
        blockSubmitOnInvalid: false,
        flagCdn: 'https://flagcdn.com',
      },
      i18n: {
        ua: {
          searchPlaceholder: 'Пошук країни',
          hint: 'Формат',
          invalid: 'Невірний формат',
        },
      },
    });

    await waitForWidget(page);
    await expect(page.locator('.wdg-pm-wrap')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: false,
        selector: '.j-phone-masked',
        defaultCountry: 'UA',
        hidePicker: false,
        allowedCountries: [],
        geoip: false,
        geoipUrl: 'https://api.country.is',
        rememberLastChoice: true,
        blockSubmitOnInvalid: false,
        flagCdn: 'https://flagcdn.com',
      },
      i18n: { ua: { searchPlaceholder: 'Пошук країни', hint: 'Формат', invalid: 'Невірний формат' } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('.wdg-pm-wrap')).not.toBeAttached();
  });

  test('cleanup restores original input', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        selector: '.j-phone-masked',
        defaultCountry: 'UA',
        hidePicker: false,
        allowedCountries: [],
        geoip: false,
        geoipUrl: 'https://api.country.is',
        rememberLastChoice: true,
        blockSubmitOnInvalid: false,
        flagCdn: 'https://flagcdn.com',
      },
      i18n: {
        ua: {
          searchPlaceholder: 'Пошук країни',
          hint: 'Формат',
          invalid: 'Невірний формат',
        },
      },
    });

    await waitForWidget(page);
    await expect(page.locator('.wdg-pm-wrap')).toBeAttached();

    await runCleanup(page);
    // After cleanup the wrap is removed and the original input is exposed
    await expect(page.locator('.wdg-pm-wrap')).not.toBeAttached();
    await expect(page.locator('.j-phone-masked')).toBeAttached();
  });
});
