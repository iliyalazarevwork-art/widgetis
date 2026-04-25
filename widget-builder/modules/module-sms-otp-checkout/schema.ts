import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const smsOtpCheckoutSchema = z.object({
  enabled: z.boolean().default(true).describe('Увімкнути верифікацію телефону на касі'),
  apiBaseUrl: z
    .string()
    .default('https://api.widgetis.com/api/v1')
    .describe('Базовий URL API Widgetis'),
  siteKey: z.string().describe('Ключ сайту (встановлюється конфігуратором)'),
  triggerSources: z
    .array(z.enum(['google', 'facebook', 'direct', 'all']))
    .default(['google', 'facebook'])
    .describe('Джерела трафіку, для яких активується верифікація'),
  phoneInputSelector: z
    .string()
    .default('input[name*="phone"], .j-phone-masked, input[type="tel"]')
    .describe('CSS-селектор поля вводу телефону'),
  submitButtonSelector: z
    .string()
    .default('.checkout-form__submit, [type="submit"], .j-checkout-submit')
    .describe('CSS-селектор кнопки оформлення замовлення'),
  codeLength: z.number().int().min(4).max(8).default(6).describe('Кількість цифр у коді'),
  resendCooldownSec: z
    .number()
    .int()
    .min(15)
    .max(300)
    .default(60)
    .describe('Час повторного надсилання (сек)'),
  codeTtlSec: z.number().int().default(300).describe('Час дії коду (сек)'),
  colors: z
    .object({
      gradientStart: z.string().default('#3B82F6').describe('Початковий колір градієнту кнопки'),
      gradientEnd: z.string().default('#A855F7').describe('Кінцевий колір градієнту кнопки'),
    })
    .default({}),
});

export type SmsOtpCheckoutConfig = z.infer<typeof smsOtpCheckoutSchema>;
export type SmsOtpCheckoutInput = z.input<typeof smsOtpCheckoutSchema>;

export const smsOtpCheckoutI18nSchema = z.record(
  z.string(),
  z.object({
    enterFullPhone: z.string(),
    getConfirmationCode: z.string(),
    enterSmsCode: z.string(),
    confirm: z.string(),
    sendAgain: z.string(),
    waitVerifying: z.string(),
    verifying: z.string(),
    phoneConfirmed: z.string(),
    invalidCode: z.string(),
    sendFailed: z.string(),
    tooManyAttempts: z.string(),
  }),
);

export type SmsOtpCheckoutI18n = z.infer<typeof smsOtpCheckoutI18nSchema>;
export type SmsOtpI18nEntry = SmsOtpCheckoutI18n[string];

export function validate(config: unknown, i18n: unknown): void {
  smsOtpCheckoutSchema.parse(config);
  smsOtpCheckoutI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(smsOtpCheckoutSchema, 'SmsOtpCheckoutConfig'),
    i18n: zodToJsonSchema(smsOtpCheckoutI18nSchema, 'SmsOtpCheckoutI18n'),
  };
}

export function getDefaultConfig(): SmsOtpCheckoutInput {
  return smsOtpCheckoutSchema.parse({ siteKey: '' });
}

export function getDefaultI18n(): SmsOtpCheckoutI18n {
  return {
    ua: {
      enterFullPhone: 'Введіть номер телефону повністю',
      getConfirmationCode: 'Отримати код підтвердження',
      enterSmsCode: 'Введіть код із SMS',
      confirm: 'Підтвердити',
      sendAgain: 'Надіслати знову',
      waitVerifying: 'Зачекайте {sec} сек...',
      verifying: 'Перевіряємо...',
      phoneConfirmed: 'Телефон підтверджено',
      invalidCode: 'Невірний код. Спробуйте ще раз.',
      sendFailed: 'Не вдалося надіслати SMS. Спробуйте пізніше.',
      tooManyAttempts: 'Забагато спроб. Зачекайте та спробуйте знову.',
    },
    ru: {
      enterFullPhone: 'Введите номер телефона полностью',
      getConfirmationCode: 'Получить код подтверждения',
      enterSmsCode: 'Введите код из SMS',
      confirm: 'Подтвердить',
      sendAgain: 'Отправить снова',
      waitVerifying: 'Подождите {sec} сек...',
      verifying: 'Проверяем...',
      phoneConfirmed: 'Телефон подтверждён',
      invalidCode: 'Неверный код. Попробуйте ещё раз.',
      sendFailed: 'Не удалось отправить SMS. Попробуйте позже.',
      tooManyAttempts: 'Слишком много попыток. Подождите и попробуйте снова.',
    },
    en: {
      enterFullPhone: 'Enter your full phone number',
      getConfirmationCode: 'Get confirmation code',
      enterSmsCode: 'Enter SMS code',
      confirm: 'Confirm',
      sendAgain: 'Send again',
      waitVerifying: 'Wait {sec} sec...',
      verifying: 'Verifying...',
      phoneConfirmed: 'Phone confirmed',
      invalidCode: 'Invalid code. Please try again.',
      sendFailed: 'Failed to send SMS. Please try later.',
      tooManyAttempts: 'Too many attempts. Please wait and try again.',
    },
    pl: {
      enterFullPhone: 'Wpisz pełny numer telefonu',
      getConfirmationCode: 'Pobierz kod potwierdzający',
      enterSmsCode: 'Wpisz kod SMS',
      confirm: 'Potwierdź',
      sendAgain: 'Wyślij ponownie',
      waitVerifying: 'Poczekaj {sec} s...',
      verifying: 'Weryfikacja...',
      phoneConfirmed: 'Telefon potwierdzony',
      invalidCode: 'Nieprawidłowy kod. Spróbuj ponownie.',
      sendFailed: 'Nie udało się wysłać SMS. Spróbuj później.',
      tooManyAttempts: 'Zbyt wiele prób. Poczekaj i spróbuj ponownie.',
    },
  };
}
