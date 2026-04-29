import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const exitIntentPopupSchema = z.object({
  enabled: z.boolean().default(true),
  /** Не показывать чаще раза в N часов */
  cooldownHours: z.number().default(24),
  /** Минимальное время на странице (сек) до возможности показа */
  minTimeOnPageSec: z.number().default(8),
  /** Промокод, который показывается клиенту */
  promoCode: z.string().default('SAVE10'),
  /** Где собирается email (true — показывать поле и копировать в localStorage) */
  collectEmail: z.boolean().default(true),
  /** Hex-цвета */
  /**
   * Цвета подобраны нейтрально, чтобы виджет не конфликтовал с дизайном магазина.
   * Магазин может переопределить любой через конфиг.
   */
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#111827'),
  accentColor: z.string().default('#111827'),
  accentTextColor: z.string().default('#ffffff'),
  borderColor: z.string().default('#e5e7eb'),
  /** Радиус скругления карточки (px) — 0 = квадратный, 24 = очень мягкий */
  borderRadius: z.number().default(16),
  zIndex: z.number().default(99999),
  /** Картинка слева (URL) — пустая = без картинки */
  imageUrl: z.string().default(''),
  /** Скрывать на этих UTM-источниках */
  hideOnUtmSources: z.array(z.string()).default([]),
});

export type ExitIntentPopupConfig = z.infer<typeof exitIntentPopupSchema>;
export type ExitIntentPopupInput = z.input<typeof exitIntentPopupSchema>;

export const exitIntentPopupI18nSchema = z
  .record(
    z.string(),
    z.object({
      title: z.string(),
      subtitle: z.string(),
      emailPlaceholder: z.string(),
      ctaButton: z.string(),
      copyButton: z.string(),
      copiedLabel: z.string(),
      promoLabel: z.string(),
      noThanks: z.string(),
      successTitle: z.string(),
      successText: z.string(),
    }),
  )
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type ExitIntentPopupI18n = z.infer<typeof exitIntentPopupI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  exitIntentPopupSchema.parse(config);
  exitIntentPopupI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(exitIntentPopupSchema, 'ExitIntentPopupConfig'),
    i18n: zodToJsonSchema(exitIntentPopupI18nSchema, 'ExitIntentPopupI18n'),
  };
}

export function getDefaultConfig(): ExitIntentPopupInput {
  return exitIntentPopupSchema.parse({});
}

export function getDefaultI18n(): ExitIntentPopupI18n {
  return {
    ua: {
      title: 'Зачекайте! Маємо для вас подарунок',
      subtitle: 'Знижка 10% на ваше перше замовлення — встигніть скористатись',
      emailPlaceholder: 'Ваш e-mail',
      ctaButton: 'Отримати знижку',
      copyButton: 'Копіювати код',
      copiedLabel: 'Скопійовано!',
      promoLabel: 'Промокод',
      noThanks: 'Ні, дякую',
      successTitle: 'Готово 🎉',
      successText: 'Промокод скопійовано — застосуйте його в кошику',
    },
    ru: {
      title: 'Подождите! У нас для вас подарок',
      subtitle: 'Скидка 10% на первый заказ — успейте воспользоваться',
      emailPlaceholder: 'Ваш e-mail',
      ctaButton: 'Получить скидку',
      copyButton: 'Скопировать код',
      copiedLabel: 'Скопировано!',
      promoLabel: 'Промокод',
      noThanks: 'Нет, спасибо',
      successTitle: 'Готово 🎉',
      successText: 'Промокод скопирован — примените его в корзине',
    },
    en: {
      title: 'Wait! Here is a gift',
      subtitle: 'Get 10% off your first order — limited time',
      emailPlaceholder: 'Your email',
      ctaButton: 'Get my discount',
      copyButton: 'Copy code',
      copiedLabel: 'Copied!',
      promoLabel: 'Promo code',
      noThanks: 'No, thanks',
      successTitle: 'Done 🎉',
      successText: 'Promo code copied — apply it at checkout',
    },
  };
}
