import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const photoReviewsSchema = z.object({
  enabled: z.boolean().default(true).describe('Увімкнути віджет'),
  showOnMobile: z.boolean().default(true).describe('Показувати на мобільних'),
  showOnDesktop: z.boolean().default(true).describe('Показувати на десктопі'),

  reviewSelector: z
    .string()
    .default('.review-item, .p-review--full')
    .describe('CSS-селектор блоку відгуку (підтримує і стару карусель ".review-item", і нову сторінку відгуків ".p-review--full")'),
  bodySelector: z
    .string()
    .default('.review-item__body, .p-review__content')
    .describe('CSS-селектор тіла відгуку (стара або нова розмітка)'),
  authorSelector: z
    .string()
    .default('.review-item__name, .p-review-author__name')
    .describe('CSS-селектор імені автора (стара або нова розмітка)'),

  aspectRatio: z.string().default('4 / 5').describe('Співвідношення сторін (напр. 4 / 5)'),
  borderRadius: z.number().default(14).describe('Закруглення кутів (px)'),
  openInLightbox: z.boolean().default(true).describe('Відкривати фото в lightbox по тапу'),

  observeDom: z.boolean().default(true).describe('Слідкувати за AJAX-завантаженням відгуків'),

  // Upload form injection
  enableUpload: z.boolean().default(true).describe('Увімкнути форму завантаження фото/відео'),
  uploadFormSelector: z
    .string()
    .default('form[data-action$="/_widget/ajax_comments/submit/"]')
    .describe('CSS-селектор форми відгуку Horoshop'),
  uploadTextareaSelector: z
    .string()
    .default('textarea[name="form[text]"]')
    .describe('CSS-селектор textarea усередині форми'),
  maxPhotos: z.number().int().positive().default(5).describe('Максимум фото'),
  maxPhotoSizeMb: z.number().positive().default(5).describe('Макс. розмір фото (МБ)'),
  maxVideoSizeMb: z.number().positive().default(30).describe('Макс. розмір відео (МБ)'),
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
      // Upload form i18n — defaulted so existing per-site configs (with only render keys) keep working.
      addMediaLabel: z.string().default('Додати фото або відео'),
      mediaHint: z.string().default('До 5 фото (≤5 МБ кожне) або 1 відео (≤30 МБ)'),
      errPhotoMime: z.string().default('Підтримуються JPG, PNG, WEBP'),
      errPhotoSize: z.string().default('Фото більше 5 МБ'),
      errPhotoCount: z.string().default('Максимум 5 фото'),
      errVideoMime: z.string().default('Підтримуються MP4, WEBM, MOV'),
      errVideoSize: z.string().default('Відео більше 30 МБ'),
      errMixed: z.string().default('Не можна додати фото та відео одночасно'),
      removeLabel: z.string().default('Видалити'),
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
      addMediaLabel: 'Додати фото або відео',
      mediaHint: 'До 5 фото (≤5 МБ кожне) або 1 відео (≤30 МБ)',
      errPhotoMime: 'Підтримуються JPG, PNG, WEBP',
      errPhotoSize: 'Фото більше 5 МБ',
      errPhotoCount: 'Максимум 5 фото',
      errVideoMime: 'Підтримуються MP4, WEBM, MOV',
      errVideoSize: 'Відео більше 30 МБ',
      errMixed: 'Не можна додати фото та відео одночасно',
      removeLabel: 'Видалити',
    },
    en: {
      viewPhotoLabel: 'Customer photo',
      closeLabel: 'Close',
      prevLabel: 'Previous',
      nextLabel: 'Next',
      addMediaLabel: 'Add photo or video',
      mediaHint: 'Up to 5 photos (≤5 MB each) or 1 video (≤30 MB)',
      errPhotoMime: 'Supported formats: JPG, PNG, WEBP',
      errPhotoSize: 'Photo exceeds 5 MB',
      errPhotoCount: 'Maximum 5 photos',
      errVideoMime: 'Supported formats: MP4, WEBM, MOV',
      errVideoSize: 'Video exceeds 30 MB',
      errMixed: 'Photos and video cannot be uploaded together',
      removeLabel: 'Remove',
    },
    ru: {
      viewPhotoLabel: 'Фото от клиента',
      closeLabel: 'Закрыть',
      prevLabel: 'Предыдущее',
      nextLabel: 'Следующее',
      addMediaLabel: 'Добавить фото или видео',
      mediaHint: 'До 5 фото (≤5 МБ каждое) или 1 видео (≤30 МБ)',
      errPhotoMime: 'Поддерживаются JPG, PNG, WEBP',
      errPhotoSize: 'Фото больше 5 МБ',
      errPhotoCount: 'Максимум 5 фото',
      errVideoMime: 'Поддерживаются MP4, WEBM, MOV',
      errVideoSize: 'Видео больше 30 МБ',
      errMixed: 'Нельзя добавить фото и видео одновременно',
      removeLabel: 'Удалить',
    },
  };
}
