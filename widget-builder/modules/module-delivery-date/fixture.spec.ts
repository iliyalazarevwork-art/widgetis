import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// delivery-date creates a .dd-wrapper badge element
const MODULE = 'module-delivery-date';

test.describe(MODULE, () => {
  test('mounts correctly on product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.product__section--price', insert: 'after' }],
        offsetDays: 3,
      },
      i18n: {
        ua: {
          prefix: 'Очікувана доставка',
          tomorrow: 'завтра',
          dayAfterTomorrow: 'післязавтра',
          monday: 'в понеділок',
          tuesday: 'у вівторок',
          wednesday: 'в середу',
          thursday: 'в четвер',
          friday: 'в п\'ятницю',
          saturday: 'в суботу',
          sunday: 'в неділю',
        },
      },
    });

    await waitForWidget(page);
    await expect(page.locator('.dd-wrapper')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: false,
        selectors: [{ selector: '.product__section--price', insert: 'after' }],
        offsetDays: 3,
      },
      i18n: { ua: { prefix: 'Очікувана доставка' } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('.dd-wrapper')).not.toBeAttached();
  });

  test('does not mount on non-product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.product__section--price', insert: 'after' }],
        offsetDays: 3,
      },
      i18n: {
        ua: {
          prefix: 'Очікувана доставка',
          tomorrow: 'завтра',
          dayAfterTomorrow: 'післязавтра',
          monday: 'в понеділок',
          tuesday: 'у вівторок',
          wednesday: 'в середу',
          thursday: 'в четвер',
          friday: 'в п\'ятницю',
          saturday: 'в суботу',
          sunday: 'в неділю',
        },
      },
    });

    await waitForWidget(page);
    await expect(page.locator('.dd-wrapper')).not.toBeAttached();
  });

  test('cleanup removes element', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.product__section--price', insert: 'after' }],
        offsetDays: 3,
      },
      i18n: {
        ua: {
          prefix: 'Очікувана доставка',
          tomorrow: 'завтра',
          dayAfterTomorrow: 'післязавтра',
          monday: 'в понеділок',
          tuesday: 'у вівторок',
          wednesday: 'в середу',
          thursday: 'в четвер',
          friday: 'в п\'ятницю',
          saturday: 'в суботу',
          sunday: 'в неділю',
        },
      },
    });

    await waitForWidget(page);
    await expect(page.locator('.dd-wrapper')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('.dd-wrapper')).not.toBeAttached();
  });
});
