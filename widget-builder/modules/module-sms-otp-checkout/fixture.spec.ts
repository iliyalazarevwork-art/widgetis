import { test, expect } from '@playwright/test';
import { goToFixture, waitForWidget, runCleanup } from '../../tests/fixtures/fixture-helpers';

// sms-otp-checkout detects checkout by checking for phone input + submit button.
// checkout-page.html has .j-phone-masked (phone) and .j-order-submit (submit).
// The module creates #wdg-smsotp-container after the phone input.
// It also checks triggerSources — we use 'all' to always trigger.
const MODULE = 'module-sms-otp-checkout';

test.describe(MODULE, () => {
  test('mounts OTP container on checkout page', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        apiBaseUrl: 'http://localhost:3000',
        siteKey: 'test-key',
        phoneInputSelector: '.j-phone-masked',
        submitButtonSelector: '.j-order-submit',
        triggerSources: ['all'],
        codeLength: 4,
        codeTtlSec: 300,
        resendCooldownSec: 60,
        colors: { gradientStart: '#667eea', gradientEnd: '#764ba2' },
      },
      i18n: {
        ua: {
          enterFullPhone: 'Введіть номер телефону',
          getConfirmationCode: 'Отримати код',
          enterSmsCode: 'Введіть код з SMS',
          confirm: 'Підтвердити',
          sendAgain: 'Надіслати ще раз',
          verifying: 'Перевіряємо...',
          phoneConfirmed: 'Телефон підтверджено',
          tooManyAttempts: 'Забагато спроб',
          sendFailed: 'Помилка відправки',
          invalidCode: 'Невірний код',
        },
      },
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#wdg-smsotp-container')).toBeAttached();
  });

  test('does not mount when disabled', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: false,
        apiBaseUrl: 'http://localhost:3000',
        siteKey: 'test-key',
        phoneInputSelector: '.j-phone-masked',
        submitButtonSelector: '.j-order-submit',
        triggerSources: ['all'],
        codeLength: 4,
        codeTtlSec: 300,
        resendCooldownSec: 60,
        colors: { gradientStart: '#667eea', gradientEnd: '#764ba2' },
      },
      i18n: {
        ua: {
          enterFullPhone: 'Введіть номер телефону',
          getConfirmationCode: 'Отримати код',
          enterSmsCode: 'Введіть код з SMS',
          confirm: 'Підтвердити',
          sendAgain: 'Надіслати ще раз',
          verifying: 'Перевіряємо...',
          phoneConfirmed: 'Телефон підтверджено',
          tooManyAttempts: 'Забагато спроб',
          sendFailed: 'Помилка відправки',
          invalidCode: 'Невірний код',
        },
      },
    });

    await page.waitForTimeout(500);
    await expect(page.locator('#wdg-smsotp-container')).not.toBeAttached();
  });

  test('does not mount on product page (no submit selector match)', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'product',
      module: MODULE,
      config: {
        enabled: true,
        apiBaseUrl: 'http://localhost:3000',
        siteKey: 'test-key',
        phoneInputSelector: '.j-phone-masked',
        submitButtonSelector: '.j-order-submit',
        triggerSources: ['all'],
        codeLength: 4,
        codeTtlSec: 300,
        resendCooldownSec: 60,
        colors: { gradientStart: '#667eea', gradientEnd: '#764ba2' },
      },
      i18n: {
        ua: {
          enterFullPhone: 'Введіть номер телефону',
          getConfirmationCode: 'Отримати код',
          enterSmsCode: 'Введіть код з SMS',
          confirm: 'Підтвердити',
          sendAgain: 'Надіслати ще раз',
          verifying: 'Перевіряємо...',
          phoneConfirmed: 'Телефон підтверджено',
          tooManyAttempts: 'Забагато спроб',
          sendFailed: 'Помилка відправки',
          invalidCode: 'Невірний код',
        },
      },
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#wdg-smsotp-container')).not.toBeAttached();
  });

  test('cleanup removes container', async ({ page }) => {
    await goToFixture(page, {
      fixturePage: 'checkout',
      module: MODULE,
      config: {
        enabled: true,
        apiBaseUrl: 'http://localhost:3000',
        siteKey: 'test-key',
        phoneInputSelector: '.j-phone-masked',
        submitButtonSelector: '.j-order-submit',
        triggerSources: ['all'],
        codeLength: 4,
        codeTtlSec: 300,
        resendCooldownSec: 60,
        colors: { gradientStart: '#667eea', gradientEnd: '#764ba2' },
      },
      i18n: {
        ua: {
          enterFullPhone: 'Введіть номер телефону',
          getConfirmationCode: 'Отримати код',
          enterSmsCode: 'Введіть код з SMS',
          confirm: 'Підтвердити',
          sendAgain: 'Надіслати ще раз',
          verifying: 'Перевіряємо...',
          phoneConfirmed: 'Телефон підтверджено',
          tooManyAttempts: 'Забагато спроб',
          sendFailed: 'Помилка відправки',
          invalidCode: 'Невірний код',
        },
      },
    });

    await waitForWidget(page);
    await page.waitForTimeout(300);
    await expect(page.locator('#wdg-smsotp-container')).toBeAttached();

    await runCleanup(page);
    await expect(page.locator('#wdg-smsotp-container')).not.toBeAttached();
  });
});
