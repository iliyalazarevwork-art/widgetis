import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const colorsSchema = z.object({
  backgroundColor: z.string().default('#1e1b4b'),
  textColor: z.string().default('#e0e7ff'),
});

const mountSchema = z.object({
  selector: z.string().min(1),
  insert: z.enum(['before', 'after']).default('before'),
});

export const marqueeSchema = z.object({
  enabled: z.boolean().default(true),
  speed: z.number().default(80),
  height: z.number().default(36),
  zIndex: z.number().default(999),
  mode: z.enum(['shift', 'overlay']).default('shift'),
  ttlHours: z.number().default(24),
  isFixed: z.boolean().default(true),
  mount: z.preprocess(
    (val) => {
      if (val && typeof val === 'object' && !(val as Record<string, unknown>).selector) return undefined;
      return val;
    },
    mountSchema.optional(),
  ),
  colors: z
    .object({
      desktop: colorsSchema.default({}),
      mobile: colorsSchema.default({}),
    })
    .default({}),
});

export type MarqueeConfig = z.infer<typeof marqueeSchema>;
export type MarqueeInput = z.input<typeof marqueeSchema>;

export const marqueeI18nSchema = z.record(z.string(), z.array(z.string()).min(1)).refine(
  (obj) => Object.keys(obj).length > 0,
  {
    message: 'At least one language must be provided',
  },
);

export type MarqueeI18n = z.infer<typeof marqueeI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  marqueeSchema.parse(config);
  marqueeI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(marqueeSchema, 'MarqueeConfig'),
    i18n: zodToJsonSchema(marqueeI18nSchema, 'MarqueeI18n'),
  };
}

export function getDefaultConfig(): MarqueeInput {
  return marqueeSchema.parse({});
}

export function getDefaultI18n(): MarqueeI18n {
  return {
    ua: ['АКЦIЯ', 'Офіційний магазин', 'Доставка по всій Україні'],
  };
}
