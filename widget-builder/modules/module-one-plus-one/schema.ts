import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const fallbackApiUrl = 'https://api.widgetis.com';

export const onePlusOneSchema = z.object({
  enabled: z.boolean().default(true),
  apiUrl: z.preprocess(
    (v) => (v === '' || v == null) ? fallbackApiUrl : v,
    z.string().url(),
  ),
});

export type OnePlusOneConfig = z.infer<typeof onePlusOneSchema>;
export type OnePlusOneInput = z.input<typeof onePlusOneSchema>;

export const onePlusOneI18nSchema = z.record(z.string(), z.object({
  badge: z.string(),
  tooltip: z.string(),
}));

export type OnePlusOneI18n = z.infer<typeof onePlusOneI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  onePlusOneSchema.parse(config);
  onePlusOneI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(onePlusOneSchema, 'OnePlusOneConfig'),
    i18n: zodToJsonSchema(onePlusOneI18nSchema, 'OnePlusOneI18n'),
  };
}

export function getDefaultConfig(): OnePlusOneInput {
  return {
    enabled: true,
    apiUrl: 'https://api.widgetis.com',
  };
}

export function getDefaultI18n(): OnePlusOneI18n {
  return {
    ua: {
      badge: '1+1=3',
      tooltip: 'Найдешевший товар у кошику — за 1 грн!',
    },
    ru: {
      badge: '1+1=3',
      tooltip: 'Самый дешёвый товар в корзине — за 1 грн!',
    },
  };
}
