import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const tierSchema = z.object({
  minItems: z.number().int().positive(),
  percent: z.number().positive(),
  coupon: z.string().min(1),
});

export const progressiveDiscountSchema = z.object({
  enabled: z.boolean().default(true),
  tiers: z
    .array(tierSchema)
    .min(1)
    .default([
      { minItems: 2, percent: 5, coupon: 'CASH5' },
      { minItems: 3, percent: 10, coupon: 'CASH10' },
      { minItems: 5, percent: 20, coupon: 'CASH20' },
    ]),
  background: z.string().default('#0f172a'),
  achievedBackground: z.string().default('#14532d'),
  textColor: z.string().default('#f8fafc'),
  accentColor: z.string().default('#fbbf24'),
  zIndex: z.number().default(50),
  hideOnUtmSources: z.array(z.string()).default([]),
});

export type ProgressiveDiscountConfig = z.infer<typeof progressiveDiscountSchema>;
export type ProgressiveDiscountInput = z.input<typeof progressiveDiscountSchema>;
export type DiscountTier = z.infer<typeof tierSchema>;

const i18nEntrySchema = z.object({
  intro: z.string(),
  currentLevel: z.string(),
  nextHint: z.string(),
  topReached: z.string(),
  itemsWord: z.string(),
});

export const progressiveDiscountI18nSchema = z
  .record(z.string(), i18nEntrySchema)
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one language must be provided' });

export type ProgressiveDiscountI18n = z.infer<typeof progressiveDiscountI18nSchema>;
export type I18nEntry = z.infer<typeof i18nEntrySchema>;

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(progressiveDiscountSchema, 'ProgressiveDiscountConfig'),
    i18n: zodToJsonSchema(progressiveDiscountI18nSchema, 'ProgressiveDiscountI18n'),
  };
}

export function getDefaultConfig(): ProgressiveDiscountInput {
  return progressiveDiscountSchema.parse({});
}

export function getDefaultI18n(): ProgressiveDiscountI18n {
  return {
    ua: {
      intro: 'Прогресивна знижка',
      currentLevel: 'Ваша знижка {percent}%',
      nextHint: 'Додайте ще {remaining} {items} — отримаєте {percent}%',
      topReached: '🎉 Максимальна знижка {percent}% активована!',
      itemsWord: 'товар|товари|товарів',
    },
  };
}
