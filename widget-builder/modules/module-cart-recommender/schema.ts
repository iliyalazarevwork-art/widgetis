import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// ─── Product title ────────────────────────────────────────────

const productTitleSchema = z
  .object({
    ua: z.string().optional(),
    en: z.string().optional(),
    ru: z.string().optional(),
  })
  .refine((t) => t.ua != null || t.en != null || t.ru != null, {
    message: 'At least one locale (ua, en, ru) must be provided in title',
  });

// ─── Product ──────────────────────────────────────────────────

const productSchema = z.object({
  id: z.number().int().positive(),
  url: z.string().min(1),
  image: z.string().min(1),
  title: productTitleSchema,
  price_new: z.number().positive(),
  price_old: z.number().positive().optional(),
  currency: z.string().min(1),
});

// ─── Config ───────────────────────────────────────────────────

export const cartRecommenderSchema = z.object({
  enabled: z.boolean().default(true),
  products: z.array(productSchema).default([]),
});

export type CartRecommenderConfig = z.infer<typeof cartRecommenderSchema>;
export type CartRecommenderInput = z.input<typeof cartRecommenderSchema>;

// ─── I18n ─────────────────────────────────────────────────────

export const cartRecommenderI18nSchema = z.record(
  z.string(),
  z.object({
    buttonAddToCart: z.string(),
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
    products: [
      {
        id: 516,
        url: '/postilna-bilizna-satin-z-ryushamy-ta-kantom-beni-polutornyi-1/',
        image:
          '/content/images/17/480x720l85nn0/postilna-bilizna-satin-z-ryushamy-ta-kantom-beni-polutornyi-1-44942974776283.webp',
        title: {
          ua: 'Постільна білизна сатин з рюшами та кантом Beni',
        },
        price_new: 4340,
        price_old: 6200,
        currency: 'грн',
      },
    ],
  };
}

export function getDefaultI18n(): CartRecommenderI18n {
  return {
    ua: {
      buttonAddToCart: 'До кошика',
    },
    ru: {
      buttonAddToCart: 'В корзину',
    },
    en: {
      buttonAddToCart: 'Add to cart',
    },
  };
}
