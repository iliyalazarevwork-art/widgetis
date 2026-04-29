import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const prizeBannerSchema = z.object({
  enabled: z.boolean().default(true),
  /** localStorage-ключ, который пишут другие виджеты (spin-the-wheel) */
  storageKey: z.string().default('wty_active_prize'),
  /** Скрывать плашку на чекауте (там и так промокод вводят вручную) */
  hideOnCheckout: z.boolean().default(false),
  zIndex: z.number().default(8800),
  /** Цвета — нейтральные дефолты под любой бренд */
  backgroundColor: z.string().default('#f0fdf4'),
  textColor: z.string().default('#064e3b'),
  accentColor: z.string().default('#10b981'),
  borderColor: z.string().default('#a7f3d0'),
  borderRadius: z.number().default(12),
});

export type PrizeBannerConfig = z.infer<typeof prizeBannerSchema>;
export type PrizeBannerInput = z.input<typeof prizeBannerSchema>;

const i18nEntrySchema = z.object({
  /** Заголовок плашки. Поддерживает {label} и {code}. */
  message: z.string(),
  /** CTA — копировать код */
  copyLabel: z.string(),
  copiedLabel: z.string(),
  closeLabel: z.string(),
});

export const prizeBannerI18nSchema = z
  .record(z.string(), i18nEntrySchema)
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type PrizeBannerI18nEntry = z.infer<typeof i18nEntrySchema>;
export type PrizeBannerI18n = z.infer<typeof prizeBannerI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  prizeBannerSchema.parse(config);
  prizeBannerI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(prizeBannerSchema, 'PrizeBannerConfig'),
    i18n: zodToJsonSchema(prizeBannerI18nSchema, 'PrizeBannerI18n'),
  };
}

export function getDefaultConfig(): PrizeBannerInput {
  return prizeBannerSchema.parse({});
}

export function getDefaultI18n(): PrizeBannerI18n {
  return {
    ua: {
      message: 'У вас активний приз: {label} — код {code}. Скажіть менеджеру при оформленні замовлення.',
      copyLabel: 'Копіювати код',
      copiedLabel: 'Скопійовано!',
      closeLabel: 'Закрити',
    },
    ru: {
      message: 'У вас активный приз: {label} — код {code}. Скажите менеджеру при оформлении заказа.',
      copyLabel: 'Копировать код',
      copiedLabel: 'Скопировано!',
      closeLabel: 'Закрыть',
    },
    en: {
      message: 'You have an active prize: {label} — code {code}. Mention it to the manager at checkout.',
      copyLabel: 'Copy code',
      copiedLabel: 'Copied!',
      closeLabel: 'Close',
    },
  };
}
