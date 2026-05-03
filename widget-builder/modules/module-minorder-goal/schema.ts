import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const positionSchema = z.object({
  left: z.number().optional(),
  right: z.number().optional(),
  bottom: z.number().default(65),
});

export const minOrderSchema = z.object({
  enabled: z.boolean().default(true),
  threshold: z.number().default(500),
  background: z.string().default('#431407'),
  achievedBackground: z.string().default('#14532d'),
  textColor: z.string().default('#fed7aa'),
  zIndex: z.number().default(999),
  floatingWidget: z.boolean().default(true),
  positionDesktop: positionSchema.default({ left: 16, bottom: 65 }),
  positionMobile: positionSchema.default({ left: 16, bottom: 65 }),
  shakeInterval: z.number().default(3000),
  desktopIconOnly: z.boolean().default(true),
});

export type MinOrderConfig = z.infer<typeof minOrderSchema>;
export type MinOrderInput = z.input<typeof minOrderSchema>;
export type PositionConfig = z.infer<typeof positionSchema>;

export const minOrderI18nSchema = z
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

export type MinOrderI18n = z.infer<typeof minOrderI18nSchema>;

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(minOrderSchema, 'MinOrderConfig'),
    i18n: zodToJsonSchema(minOrderI18nSchema, 'MinOrderI18n'),
  };
}

export function getDefaultConfig(): MinOrderInput {
  return minOrderSchema.parse({});
}

export function getDefaultI18n(): MinOrderI18n {
  return {
    ua: {
      text: 'До суми мінімального замовлення залишилось',
      achieved: 'Мінімальну суму замовлення досягнуто!',
    },
  };
}
