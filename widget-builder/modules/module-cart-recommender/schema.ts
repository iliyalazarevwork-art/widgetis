import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// ─── Config ───────────────────────────────────────────────────

export const cartRecommenderSchema = z.object({
  enabled: z.boolean().default(true),
  apiBaseUrl: z.string().default(''),
  mountSelector: z.string().default('.j-cart-additional .carousel__wrapper'),
  headingI18nKey: z.string().default('heading'),
  maxItems: z.number().int().min(1).max(8).default(4),
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
