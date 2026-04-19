import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const stickyBuyButtonSchema = z.object({
  enabled: z.boolean().default(true),
  buttonSelector: z.string().default('.j-buy-button-add'),
  mobileBreakpoint: z.number().default(768),
  backgroundColor: z.string().default('#5c1f2e'),
  textColor: z.string().default('#ffffff'),
  borderRadius: z.string().default('8px'),
  zIndex: z.number().default(9998),
  bottomOffset: z.number().default(0),
  safeAreaPadding: z.boolean().default(true),
});

export type StickyBuyButtonConfig = z.infer<typeof stickyBuyButtonSchema>;
export type StickyBuyButtonInput = z.input<typeof stickyBuyButtonSchema>;

export const stickyBuyButtonI18nSchema = z
  .record(
    z.string(),
    z.object({
      buttonText: z.string(),
    }),
  )
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type StickyBuyButtonI18n = z.infer<typeof stickyBuyButtonI18nSchema>;

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(stickyBuyButtonSchema, 'StickyBuyButtonConfig'),
    i18n: zodToJsonSchema(stickyBuyButtonI18nSchema, 'StickyBuyButtonI18n'),
  };
}

export function getDefaultConfig(): StickyBuyButtonInput {
  return stickyBuyButtonSchema.parse({});
}

export function getDefaultI18n(): StickyBuyButtonI18n {
  return {
    ua: { buttonText: 'Замовити' },
    ru: { buttonText: 'Заказать' },
    en: { buttonText: 'Order' },
  };
}
