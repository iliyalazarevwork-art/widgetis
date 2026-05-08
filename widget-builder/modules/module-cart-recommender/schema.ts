import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// ─── Config ───────────────────────────────────────────────────

export const cartRecommenderSchema = z.object({
  enabled: z.boolean().default(true),
  apiBaseUrl: z.string().default(''),
  mountSelector: z.string().default('.j-cart-additional .carousel__wrapper'),
  headingI18nKey: z.string().default('heading'),
  maxItems: z.number().int().min(1).max(8).default(4),
  // Sheet popup colours. Defaults reproduce the original brown palette so
  // existing fixtures keep working; the picker overrides every key per-merchant.
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#3E2A1F'),
  priceColor: z.string().default('#7A5C4D'),
  borderColor: z.string().default('#d8c9b4'),
  accentColor: z.string().default('#C77A5C'),       // "+" round-button bg
  accentTextColor: z.string().default('#ffffff'),   // "+" icon
  ctaBackground: z.string().default('#3E2A1F'),     // "Оформити замовлення" bg
  ctaTextColor: z.string().default('#ffffff'),
  doneColor: z.string().default('#15803d'),         // post-add "✓" green
});

export type CartRecommenderConfig = z.infer<typeof cartRecommenderSchema>;
export type CartRecommenderInput = z.input<typeof cartRecommenderSchema>;

// ─── I18n ─────────────────────────────────────────────────────

export const cartRecommenderI18nSchema = z.record(
  z.string(),
  z.object({
    buttonAddToCart: z.string(),
    heading: z.string(),
  }),
);

export type CartRecommenderI18n = z.infer<typeof cartRecommenderI18nSchema>;

// ─── Exports ──────────────────────────────────────────────────

export function validate(config: unknown, i18n: unknown): void {
  cartRecommenderSchema.parse(config);
  cartRecommenderI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(cartRecommenderSchema, 'CartRecommenderConfig'),
    i18n: zodToJsonSchema(cartRecommenderI18nSchema, 'CartRecommenderI18n'),
  };
}

export function getDefaultConfig(): CartRecommenderInput {
  return {
    enabled: true,
    apiBaseUrl: '',
    mountSelector: '.b-product-info, .product-card, .b-product, .product, main',
    maxItems: 4,
  };
}

export function getDefaultI18n(): CartRecommenderI18n {
  return {
    ua: {
      buttonAddToCart: 'До кошика',
      heading: 'Часто беруть разом',
    },
    ru: {
      buttonAddToCart: 'В корзину',
      heading: 'Часто покупают вместе',
    },
    en: {
      buttonAddToCart: 'Add to cart',
      heading: 'Often bought together',
    },
  };
}
