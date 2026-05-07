import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// module-buyer-count is named "social-proof" internally.
// The badge element uses class "sp-wrapper" inserted near the selector.
const MODULE = 'module-buyer-count';

test.describe(MODULE, () => {
  test('mounts correctly on product page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.product__section--price', insert: 'after' }],
        minCount: 5,
        maxCount: 50,
        backgroundColor: '#ff5722',
        textColor: '#fff',
      },
      i18n: { ua: { label: 'людей купили цей товар' } },
    });

    await waitForWidget(page);
    await expect(page.locator('.sp-wrapper')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: false,
        selectors: [{ selector: '.product__section--price', insert: 'after' }],
        minCount: 5,
        maxCount: 50,
      },
      i18n: { ua: { label: 'людей купили цей товар' } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('.sp-wrapper')).not.toBeAttached();
  });

  test('does not mount when no selectors match', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.nonexistent-element-xyz', insert: 'after' }],
        minCount: 5,
        maxCount: 50,
      },
      i18n: { ua: { label: 'людей купили цей товар' } },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('.sp-wrapper')).not.toBeAttached();
  });

  test('cleanup removes element', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        selectors: [{ selector: '.product__section--price', insert: 'after' }],
        minCount: 5,
        maxCount: 50,
        backgroundColor: '#ff5722',
        textColor: '#fff',
      },
      i18n: { ua: { label: 'людей купили цей товар' } },
    });

    await waitForWidget(page);
    await expect(page.locator('.sp-wrapper')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('.sp-wrapper')).not.toBeAttached();
  });
});
