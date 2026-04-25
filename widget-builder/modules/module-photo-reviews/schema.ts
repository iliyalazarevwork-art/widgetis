import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const urlsField = z.preprocess(
  (v) => (typeof v === 'string' ? (v.length > 0 ? [v] : []) : v),
  z
    .array(z.string().min(1).describe('URL фото або відео (mp4/webm/mov → відео)'))
    .min(1)
    .describe('Фото та відео до відгуку'),
);

const photoEntrySchema = z
  .object({
    urls: urlsField,
    alt: z.string().optional().default('').describe('Альтернативний текст (опціонально)'),
    author: z
      .string()
      .optional()
      .default('')
      .describe('Ім\'я автора (підрядок, нечутливий до регістру)'),
    contains: z
      .string()
      .optional()
      .default('')
      .describe('Підрядок у тексті відгуку (нечутливий до регістру)'),
  })
  .refine((e) => e.urls.length > 0, { message: 'at least one photo url required' });

export const photoReviewsSchema = z.object({
  enabled: z.boolean().default(true).describe('Увімкнути віджет'),
  showOnMobile: z.boolean().default(true).describe('Показувати на мобільних'),
  showOnDesktop: z.boolean().default(true).describe('Показувати на десктопі'),

  reviewSelector: z.string().default('.review-item').describe('CSS-селектор блоку відгуку'),
  bodySelector: z.string().default('.review-item__body').describe('CSS-селектор тіла відгуку'),
  authorSelector: z
    .string()
    .default('.review-item__name')
    .describe('CSS-селектор імені автора'),

  photos: z
    .array(photoEntrySchema)
    .default([])
    .describe('Фото/відео прив\'язані до конкретних відгуків'),

  fallbackUrls: z
    .preprocess(
      (v) => (typeof v === 'string' ? (v.length > 0 ? [v] : []) : v),
      z.array(z.string().min(1).describe('URL фото або відео')),
    )
    .default([])
    .describe('Запасні медіа — показуються, якщо нічого не збіглось'),

  aspectRatio: z.string().default('4 / 5').describe('Співвідношення сторін (напр. 4 / 5)'),
  borderRadius: z.number().default(14).describe('Закруглення кутів (px)'),
  openInLightbox: z.boolean().default(true).describe('Відкривати фото в lightbox по тапу'),

  observeDom: z.boolean().default(true).describe('Слідкувати за AJAX-завантаженням відгуків'),
});

export type PhotoReviewsConfig = z.infer<typeof photoReviewsSchema>;
export type PhotoReviewsInput = z.input<typeof photoReviewsSchema>;

export const photoReviewsI18nSchema = z
  .record(
    z.string(),
    z.object({
      viewPhotoLabel: z.string(),
      closeLabel: z.string(),
      prevLabel: z.string(),
      nextLabel: z.string(),
    }),
  )
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type PhotoReviewsI18n = z.infer<typeof photoReviewsI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  photoReviewsSchema.parse(config);
  photoReviewsI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(photoReviewsSchema, 'PhotoReviewsConfig'),
    i18n: zodToJsonSchema(photoReviewsI18nSchema, 'PhotoReviewsI18n'),
  };
}

export function getDefaultConfig(): PhotoReviewsInput {
  return photoReviewsSchema.parse({});
}

export function getDefaultI18n(): PhotoReviewsI18n {
  return {
    ua: {
      viewPhotoLabel: 'Фото від клієнта',
      closeLabel: 'Закрити',
      prevLabel: 'Попереднє',
      nextLabel: 'Наступне',
    },
  };
}
