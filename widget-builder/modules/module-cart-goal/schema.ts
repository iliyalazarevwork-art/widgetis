import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const positionSchema = z.object({
  left: z.number().optional(),
  right: z.number().optional(),
  bottom: z.number().default(25),
});

export const cartGoalSchema = z.object({
  enabled: z.boolean().default(true),
  threshold: z.number().default(1000),
  minimum: z.number().default(0),
  floatingWidget: z.boolean().default(true),
  background: z.string().default('#172554'),
  achievedBackground: z.string().default('#14532d'),
  textColor: z.string().default('#bfdbfe'),
  positionDesktop: positionSchema.default({ right: 16, bottom: 25 }),
  positionMobile: positionSchema.default({ left: 16, bottom: 25 }),
  shakeInterval: z.number().default(3000),
  hideOnUtmSources: z.array(z.string()).default([]),
  desktopIconOnly: z.boolean().default(false),
  zIndex: z.number().default(999),
});

export type CartGoalConfig = z.infer<typeof cartGoalSchema>;
export type CartGoalInput = z.input<typeof cartGoalSchema>;

export type PositionConfig = z.infer<typeof positionSchema>;

export const cartGoalI18nSchema = z
  .record(
    z.string(),
    z.object({
      text: z.string(),
      achieved: z.string(),
    }),
  )
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type CartGoalI18n = z.infer<typeof cartGoalI18nSchema>;

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(cartGoalSchema, 'CartGoalConfig'),
    i18n: zodToJsonSchema(cartGoalI18nSchema, 'CartGoalI18n'),
  };
}

export function getDefaultConfig(): CartGoalInput {
  return cartGoalSchema.parse({});
}

export function getDefaultI18n(): CartGoalI18n {
  return {
    ua: {
      text: 'До безкоштовної доставки залишилось',
      achieved: '🎉 Вітаємо! Ви отримали безкоштовну доставку!',
    },
  };
}
