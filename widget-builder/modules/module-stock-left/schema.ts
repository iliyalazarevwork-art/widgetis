import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const selectorSchema = z.object({
  selector: z.string().min(1),
  insert: z.enum(['before', 'after']).default('before'),
});

export const stockLeftSchema = z.object({
  enabled: z.boolean().default(true),
  selectors: z.array(selectorSchema).default([
    { selector: '.product__section--price', insert: 'after' },
    { selector: '.product-card__price-box', insert: 'after' },
    { selector: '.product-price', insert: 'after' },
    { selector: '.cart-buttons--full', insert: 'after' },
    { selector: '.cart-buttons', insert: 'after' },
    { selector: '.j-product-block', insert: 'after' },
  ]),
  minCount: z.number().int().min(1).default(3),
  maxCount: z.number().int().min(1).default(12),
  minRemaining: z.number().int().min(1).default(1),
  decrementProbability: z.number().min(0).max(1).default(0.6),
  updateInterval: z.number().int().min(10).default(60),
  showForOutOfStock: z.boolean().default(false),
  pulse: z.boolean().default(true),
  backgroundColor: z.string().default('#fef2f2'),
  textColor: z.string().default('#b91c1c'),
  accentColor: z.string().default('#dc2626'),
});

export type StockLeftConfig = z.infer<typeof stockLeftSchema>;
export type StockLeftInput = z.input<typeof stockLeftSchema>;

export const stockLeftI18nSchema = z
  .record(
    z.string(),
    z.object({
      label: z.string(),
      unit: z.string().default('шт'),
    }),
  )
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type StockLeftI18n = z.infer<typeof stockLeftI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  stockLeftSchema.parse(config);
  stockLeftI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(stockLeftSchema, 'StockLeftConfig'),
    i18n: zodToJsonSchema(stockLeftI18nSchema, 'StockLeftI18n'),
  };
}

export function getDefaultConfig(): StockLeftInput {
  return stockLeftSchema.parse({});
}

export function getDefaultI18n(): StockLeftI18n {
  return {
    ua: { label: 'Залишилось', unit: 'шт' },
    ru: { label: 'Осталось', unit: 'шт' },
    en: { label: 'Only', unit: 'left' },
  };
}
