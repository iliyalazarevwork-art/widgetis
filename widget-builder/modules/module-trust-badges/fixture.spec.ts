import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// trust-badges creates .wdg-trust strip inserted after the buy button area
const MODULE = 'module-trust-badges';

test.describe(MODULE, () => {
  test('mounts trust strip on product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [
          { selector: '.product-card__order--normal', insert: 'after' },
          { selector: '.cart-buttons--full', insert: 'after' },
          { selector: '.product-card__price-box', insert: 'after' },
        ],
        badges: [
          { icon: 'shield', i18nKey: 'shield' },
          { icon: 'truck', i18nKey: 'truck' },
        ],
        layout: 'grid',
        backgroundColor: 'transparent',
        textColor: '#374151',
        iconColor: '#111827',
        borderColor: '#e5e7eb',
        borderRadius: 12,
        showBorder: true,
      },
      i18n: {
        ua: {
          titles: {
            shield: 'Безпечна оплата',
            truck: 'Швидка доставка',
          },
        },
      },
    });

    await waitForWidget(page);
    await page.waitForTimeout(500);
    await expect(page.locator('.wdg-trust')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: false,
        selectors: [{ selector: '.product-card__order--normal', insert: 'after' }],
        badges: [{ icon: 'shield' }],
        layout: 'grid',
        backgroundColor: 'transparent',
        textColor: '#374151',
        iconColor: '#111827',
        borderColor: '#e5e7eb',
        borderRadius: 12,
        showBorder: true,
      },
      i18n: { ua: { titles: { shield: 'Безпечна оплата' } } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('.wdg-trust')).not.toBeAttached();
  });

  test('does not mount on non-product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.product-card__order--normal', insert: 'after' }],
        badges: [{ icon: 'shield' }],
        layout: 'grid',
        backgroundColor: 'transparent',
        textColor: '#374151',
        iconColor: '#111827',
        borderColor: '#e5e7eb',
        borderRadius: 12,
        showBorder: true,
      },
      i18n: { ua: { titles: { shield: 'Безпечна оплата' } } },
    });

    await waitForWidget(page);
    await expect(page.locator('.wdg-trust')).not.toBeAttached();
  });

  test('strip renders badge titles from i18n', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.cart-buttons--full', insert: 'after' }],
        badges: [
          { icon: 'shield', i18nKey: 'shield' },
          { icon: 'truck', i18nKey: 'truck' },
        ],
        layout: 'grid',
        backgroundColor: 'transparent',
        textColor: '#374151',
        iconColor: '#111827',
        borderColor: '#e5e7eb',
        borderRadius: 12,
        showBorder: true,
      },
      i18n: {
        ua: {
          titles: {
            shield: 'Безпечна оплата',
            truck: 'Швидка доставка',
          },
        },
      },
    });

    await waitForWidget(page);
    await page.waitForTimeout(500);
    const text = await page.locator('.wdg-trust').textContent();
    expect(text).toContain('Безпечна оплата');
    expect(text).toContain('Швидка доставка');
  });

  test('cleanup removes strip', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.cart-buttons--full', insert: 'after' }],
        badges: [{ icon: 'shield', i18nKey: 'shield' }],
        layout: 'grid',
        backgroundColor: 'transparent',
        textColor: '#374151',
        iconColor: '#111827',
        borderColor: '#e5e7eb',
        borderRadius: 12,
        showBorder: true,
      },
      i18n: { ua: { titles: { shield: 'Безпечна оплата' } } },
    });

    await waitForWidget(page);
    await page.waitForTimeout(500);
    await expect(page.locator('.wdg-trust')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('.wdg-trust')).not.toBeAttached();
  });
});
