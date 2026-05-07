import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// last-chance-popup (exit-intent) creates #wdg-exit-intent
const MODULE = 'module-last-chance-popup';

test.describe(MODULE, () => {
  test('appears after mouseleave exit-intent trigger', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        minTimeOnPageSec: 0,
        cooldownHours: 0,
        promoCode: 'SAVE10',
        collectEmail: false,
        imageUrl: '',
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        accentColor: '#ff5722',
        accentTextColor: '#ffffff',
        borderColor: '#333',
        borderRadius: 12,
        zIndex: 99999,
        hideOnUtmSources: [],
      },
      i18n: {
        ua: {
          title: 'Зачекайте!',
          subtitle: 'Ваш промокод',
          emailPlaceholder: 'Email',
          ctaButton: 'Копіювати',
          copyButton: 'Копіювати',
          copiedLabel: 'Скопійовано!',
          promoLabel: 'Промокод:',
          noThanks: 'Ні, дякую',
          successTitle: 'Дякуємо!',
          successText: 'Промокод скопійовано',
        },
      },
    });

    await waitForWidget(page);

    // Trigger exit-intent: mouse leaves the viewport from the top
    await page.evaluate(() => {
      document.dispatchEvent(
        new MouseEvent('mouseleave', {
          bubbles: true,
          cancelable: true,
          clientY: -1,
          relatedTarget: null,
        }),
      );
    });

    await expect(page.locator('#wdg-exit-intent')).toBeAttached({ timeout: 3000 });
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: false,
        minTimeOnPageSec: 0,
        cooldownHours: 0,
        promoCode: 'SAVE10',
        collectEmail: false,
        imageUrl: '',
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        accentColor: '#ff5722',
        accentTextColor: '#ffffff',
        borderColor: '#333',
        borderRadius: 12,
        zIndex: 99999,
        hideOnUtmSources: [],
      },
      i18n: {
        ua: {
          title: 'Зачекайте!',
          subtitle: 'Ваш промокод',
          emailPlaceholder: 'Email',
          ctaButton: 'Копіювати',
          copyButton: 'Копіювати',
          copiedLabel: 'Скопійовано!',
          promoLabel: 'Промокод:',
          noThanks: 'Ні, дякую',
          successTitle: 'Дякуємо!',
          successText: 'Промокод скопійовано',
        },
      },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('#wdg-exit-intent')).not.toBeAttached();
  });

  test('cleanup removes element', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'any',
      module: MODULE,
      config: {
        enabled: true,
        minTimeOnPageSec: 0,
        cooldownHours: 0,
        promoCode: 'SAVE10',
        collectEmail: false,
        imageUrl: '',
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        accentColor: '#ff5722',
        accentTextColor: '#ffffff',
        borderColor: '#333',
        borderRadius: 12,
        zIndex: 99999,
        hideOnUtmSources: [],
      },
      i18n: {
        ua: {
          title: 'Зачекайте!',
          subtitle: 'Ваш промокод',
          emailPlaceholder: 'Email',
          ctaButton: 'Копіювати',
          copyButton: 'Копіювати',
          copiedLabel: 'Скопійовано!',
          promoLabel: 'Промокод:',
          noThanks: 'Ні, дякую',
          successTitle: 'Дякуємо!',
          successText: 'Промокод скопійовано',
        },
      },
    });

    await waitForWidget(page);

    // Trigger the popup
    await page.evaluate(() => {
      document.dispatchEvent(
        new MouseEvent('mouseleave', { bubbles: true, cancelable: true, clientY: -1, relatedTarget: null }),
      );
    });

    await expect(page.locator('#wdg-exit-intent')).toBeAttached({ timeout: 3000 });

    await runCleanup(page);
    await expect(page.locator('#wdg-exit-intent')).not.toBeAttached();
  });
});
