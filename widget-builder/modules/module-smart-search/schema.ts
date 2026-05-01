import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const smartSearchSchema = z.object({
  enabled: z.boolean().default(true),
  apiUrl: z.string().default('https://api.widgetis.com/api/v1/widgets/smart-search'),
  accentColor: z.string().default('#c050b0'),
  currency: z.string().default('грн'),
  searchHistory: z.boolean().default(true),
  minQueryLength: z.number().default(2),
  debounceMs: z.number().default(220),
  limitPreview: z.number().default(4),
  limitExpanded: z.number().default(50),
  popularQueries: z.array(z.string()).default([]),
  defaultLang: z.enum(['auto', 'ua', 'ru', 'en', 'pl']).default('auto'),
  theme: z.enum(['light', 'dark']).default('light'),
});

export type SmartSearchConfig = z.infer<typeof smartSearchSchema>;
export type SmartSearchInput = z.input<typeof smartSearchSchema>;

const i18nEntrySchema = z.object({
  search_placeholder: z.string(),
  no_results: z.string(),
  loading_text: z.string(),
  out_of_stock: z.string(),
  history_title: z.string(),
  history_clear: z.string(),
  results_count: z.string(),
  all_results: z.string(),
  correction_text: z.string(),
  error_text: z.string(),
  collapse: z.string(),
  more: z.string(),
  popular_title: z.string(),
  discount_label: z.string(),
  view_all: z.string(),
  kbd_hint: z.string(),
  empty_subtitle: z.string(),
});

export const smartSearchI18nSchema = z
  .record(z.string(), i18nEntrySchema)
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type SmartSearchI18n = z.infer<typeof smartSearchI18nSchema>;
export type SmartSearchI18nEntry = z.infer<typeof i18nEntrySchema>;

export function validate(config: unknown, i18n: unknown): void {
  smartSearchSchema.parse(config);
  smartSearchI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(smartSearchSchema, 'SmartSearchConfig'),
    i18n: zodToJsonSchema(smartSearchI18nSchema, 'SmartSearchI18n'),
  };
}

export function getDefaultConfig(): SmartSearchInput {
  return smartSearchSchema.parse({});
}

export function getDefaultI18n(): SmartSearchI18n {
  return {
    ua: {
      search_placeholder: 'Пошук товарів...',
      no_results: 'Нічого не знайдено',
      loading_text: 'Шукаємо...',
      out_of_stock: 'Немає в наявності',
      history_title: 'Нещодавні пошуки',
      history_clear: 'Очистити',
      results_count: 'Показано {count}',
      all_results: 'Всі результати',
      correction_text: 'Можливо, ви мали на увазі',
      error_text: 'Помилка. Спробуйте ще раз.',
      collapse: 'Згорнути',
      more: 'Більше',
      popular_title: 'Популярне',
      discount_label: '-{percent}%',
      view_all: 'Всі →',
      kbd_hint: 'ESC',
      empty_subtitle: 'Спробуйте змінити запит або перегляньте каталог',
    },
  };
}
