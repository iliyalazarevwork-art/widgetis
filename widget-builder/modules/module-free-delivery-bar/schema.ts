import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const freeDeliveryBarSchema = z.object({
  enabled: z.boolean().default(true),
  /** Free-shipping minimum cart total */
  threshold: z.number().default(1500),
  position: z.enum(['top', 'bottom']).default('top'),
  height: z.number().default(44),
  zIndex: z.number().default(9998),
  backgroundColor: z.string().default('#0f172a'),
  textColor: z.string().default('#f8fafc'),
  progressColor: z.string().default('#22c55e'),
  achievedColor: z.string().default('#16a34a'),
  borderRadius: z.number().default(0),
  hideOnCheckout: z.boolean().default(false),
  pulseOnUpdate: z.boolean().default(true),
});

export type FreeDeliveryBarConfig = z.infer<typeof freeDeliveryBarSchema>;
export type FreeDeliveryBarInput = z.input<typeof freeDeliveryBarSchema>;

const i18nEntrySchema = z.object({
  /** Message shown when cart is below threshold. Use {amount} as placeholder. */
  remaining: z.string(),
  /** Message shown when threshold is reached. */
  achieved: z.string(),
});

export const freeDeliveryBarI18nSchema = z
  .record(z.string(), i18nEntrySchema)
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type FreeDeliveryBarI18n = z.infer<typeof freeDeliveryBarI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  freeDeliveryBarSchema.parse(config);
  freeDeliveryBarI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(freeDeliveryBarSchema, 'FreeDeliveryBarConfig'),
    i18n: zodToJsonSchema(freeDeliveryBarI18nSchema, 'FreeDeliveryBarI18n'),
  };
}

export function getDefaultConfig(): FreeDeliveryBarInput {
  return freeDeliveryBarSchema.parse({});
}

export function getDefaultI18n(): FreeDeliveryBarI18n {
  return {
    ua: {
      remaining: 'Додайте ще {amount} до безкоштовної доставки',
      achieved: 'Безкоштовна доставка ваша 🎉',
    },
    ru: {
      remaining: 'Добавьте ещё {amount} до бесплатной доставки',
      achieved: 'Бесплатная доставка ваша 🎉',
    },
    en: {
      remaining: 'Add {amount} more for free shipping',
      achieved: 'Free shipping unlocked 🎉',
    },
    pl: {
      remaining: 'Dodaj jeszcze {amount} do darmowej dostawy',
      achieved: 'Darmowa dostawa odblokowana 🎉',
    },
  };
}
