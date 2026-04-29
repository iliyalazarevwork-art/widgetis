import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const promoAutoApplySchema = z.object({
  enabled: z.boolean().default(true),
  /** localStorage key written by spin-the-wheel / exit-intent / etc. */
  storageKey: z.string().default('wty_active_prize'),
  /** Path substrings that identify a checkout/cart page (case-insensitive). */
  checkoutPathMatches: z
    .array(z.string())
    .default(['/checkout', '/order', '/cart']),
  /** How long (ms) to keep watching for the coupon form to appear. */
  watchTimeoutMs: z.number().default(15000),
  /** Show a toast when the code is auto-applied. */
  showToast: z.boolean().default(true),
  /** Toast position. */
  toastPosition: z.enum(['top', 'bottom']).default('top'),
  zIndex: z.number().default(8900),
  /** Toast colors. */
  backgroundColor: z.string().default('#10b981'),
  textColor: z.string().default('#ffffff'),
});

export type PromoAutoApplyConfig = z.infer<typeof promoAutoApplySchema>;
export type PromoAutoApplyInput = z.input<typeof promoAutoApplySchema>;

const i18nEntrySchema = z.object({
  /** Toast message. Supports {code} placeholder. */
  appliedMessage: z.string(),
});

export const promoAutoApplyI18nSchema = z
  .record(z.string(), i18nEntrySchema)
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type PromoAutoApplyI18nEntry = z.infer<typeof i18nEntrySchema>;
export type PromoAutoApplyI18n = z.infer<typeof promoAutoApplyI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  promoAutoApplySchema.parse(config);
  promoAutoApplyI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(promoAutoApplySchema, 'PromoAutoApplyConfig'),
    i18n: zodToJsonSchema(promoAutoApplyI18nSchema, 'PromoAutoApplyI18n'),
  };
}

export function getDefaultConfig(): PromoAutoApplyInput {
  return promoAutoApplySchema.parse({});
}

export function getDefaultI18n(): PromoAutoApplyI18n {
  return {
    ua: {
      appliedMessage: 'Промокод {code} застосовано',
    },
    ru: {
      appliedMessage: 'Промокод {code} применён',
    },
    en: {
      appliedMessage: 'Promo code {code} applied',
    },
  };
}
