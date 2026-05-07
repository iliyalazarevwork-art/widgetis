import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// progressive-discount creates #pd-banner inside the cart area.
// checkout-page.html has .mm-menu.cart .cart__summary which is an insertion point.
// The banner appears only when itemCount > 0 (cart has items).
const MODULE = 'module-progressive-discount';

test.describe(MODULE, () => {
  test('mounts banner on checkout page when cart has items', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        tiers: [
          { minItems: 2, percent: 5, coupon: 'DISC5' },
          { minItems: 3, percent: 10, coupon: 'DISC10' },
        ],
        hideOnUtmSources: [],
        backgroundColor: '#4CAF50',
        textColor: '#fff',
        accentColor: '#2e7d32',
        borderColor: '#e0e0e0',
        borderRadius: 8,
      },
      i18n: {
        ua: {
          intro: 'Знижки за кількість:',
          currentLevel: 'Поточна знижка: {percent}%',
          nextHint: 'Додайте ще {remaining} {items} для знижки {percent}',
          topReached: 'Максимальна знижка {percent}%!',
          itemsWord: 'товар|товари|товарів',
        },
      },
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#pd-banner')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: false,
        tiers: [{ minItems: 2, percent: 5, coupon: 'DISC5' }],
        hideOnUtmSources: [],
        backgroundColor: '#4CAF50',
        textColor: '#fff',
        accentColor: '#2e7d32',
        borderColor: '#e0e0e0',
        borderRadius: 8,
      },
      i18n: {
        ua: {
          intro: 'Знижки за кількість:',
          currentLevel: 'Поточна знижка: {percent}%',
          nextHint: 'Додайте ще {remaining} {items}',
          topReached: 'Максимальна знижка!',
          itemsWord: 'товар|товари|товарів',
        },
      },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('#pd-banner')).not.toBeAttached();
  });

  test('cleanup removes banner', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        tiers: [
          { minItems: 2, percent: 5, coupon: 'DISC5' },
          { minItems: 3, percent: 10, coupon: 'DISC10' },
        ],
        hideOnUtmSources: [],
        backgroundColor: '#4CAF50',
        textColor: '#fff',
        accentColor: '#2e7d32',
        borderColor: '#e0e0e0',
        borderRadius: 8,
      },
      i18n: {
        ua: {
          intro: 'Знижки за кількість:',
          currentLevel: 'Поточна знижка: {percent}%',
          nextHint: 'Додайте ще {remaining} {items}',
          topReached: 'Максимальна знижка!',
          itemsWord: 'товар|товари|товарів',
        },
      },
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#pd-banner')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('#pd-banner')).not.toBeAttached();
  });
});
