import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const selectorSchema = z.object({
  selector: z.string().min(1),
  insert: z.enum(['before', 'after']).default('after'),
});

export const recentlyViewedSchema = z.object({
  enabled: z.boolean().default(true),
  /** Selectors to insert the widget after/before — first match wins */
  selectors: z.array(selectorSchema).default([
    { selector: '.j-product-block', insert: 'after' },
    { selector: '#cart .cart__summary', insert: 'after' },
    { selector: 'body', insert: 'before' },
  ]),
  /** Minimum number of other-page entries required before rendering */
  minItems: z.number().int().min(1).default(3),
  /** Max entries stored in localStorage */
  maxItems: z.number().int().min(1).default(12),
  /** How many days until an entry expires */
  expiryDays: z.number().int().min(1).default(30),
  /** Card width on desktop (px) */
  cardWidthDesktop: z.number().int().min(80).default(200),
  /** Card width on mobile (px) */
  cardWidthMobile: z.number().int().min(60).default(150),
  backgroundColor: z.string().default('transparent'),
  textColor: z.string().default('#111827'),
  priceColor: z.string().default('#111827'),
  mutedColor: z.string().default('#6b7280'),
  borderColor: z.string().default('#e5e7eb'),
  borderRadius: z.number().default(12),
  showOnProductPage: z.boolean().default(true),
  showOnCartPage: z.boolean().default(true),
  showOnAnyPage: z.boolean().default(true),
});

export type RecentlyViewedConfig = z.infer<typeof recentlyViewedSchema>;
export type RecentlyViewedInput = z.input<typeof recentlyViewedSchema>;

const i18nEntrySchema = z.object({
  heading: z.string(),
  viewAll: z.string().optional(),
});

export const recentlyViewedI18nSchema = z
  .record(z.string(), i18nEntrySchema)
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type RecentlyViewedI18n = z.infer<typeof recentlyViewedI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  recentlyViewedSchema.parse(config);
  recentlyViewedI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(recentlyViewedSchema, 'RecentlyViewedConfig'),
    i18n: zodToJsonSchema(recentlyViewedI18nSchema, 'RecentlyViewedI18n'),
  };
}

export function getDefaultConfig(): RecentlyViewedInput {
  return recentlyViewedSchema.parse({});
}

export function getDefaultI18n(): RecentlyViewedI18n {
  return {
    ua: { heading: 'Ви нещодавно дивились' },
    ru: { heading: 'Вы недавно смотрели' },
    en: { heading: 'Recently viewed' },
  };
}
