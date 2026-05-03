import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const selectorSchema = z.object({
  selector: z.string().min(1),
  insert: z.enum(['before', 'after']).default('before'),
});

export const socialProofSchema = z.object({
  enabled: z.boolean().default(true),
  selectors: z.array(selectorSchema).default([{
    selector:
      '#page > main > div > div.product__grid > div.product__column.product__column--right > div.product__block.product__block--orderBox.j-product-block > div > div.product-card.product-card--main > div.product-card__body > div.product-card__price-box',
    insert: 'after',
  }]),
  minCount: z.number().default(8),
  maxCount: z.number().default(50),
  updateInterval: z.number().default(45),
  showForOutOfStock: z.boolean().default(false),
  backgroundColor: z.string().default('#4c1d95'),
  textColor: z.string().default('#ede9fe'),
});

export type SocialProofConfig = z.infer<typeof socialProofSchema>;
export type SocialProofInput = z.input<typeof socialProofSchema>;

export const socialProofI18nSchema = z
  .record(
    z.string(),
    z.object({
      label: z.string(),
    }),
  )
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type SocialProofI18n = z.infer<typeof socialProofI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  socialProofSchema.parse(config);
  socialProofI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(socialProofSchema, 'SocialProofConfig'),
    i18n: zodToJsonSchema(socialProofI18nSchema, 'SocialProofI18n'),
  };
}

export function getDefaultConfig(): SocialProofInput {
  return socialProofSchema.parse({});
}

export function getDefaultI18n(): SocialProofI18n {
  return {
    ua: {
      label: 'людей купили цей товар',
    },
  };
}
