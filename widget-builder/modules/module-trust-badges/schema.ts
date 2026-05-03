import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const TRUST_BADGE_ICONS = [
  'shield',
  'truck',
  'return',
  'lock',
  'card',
  'guarantee',
  'support',
  'star',
  'leaf',
  'box',
] as const;

export type TrustBadgeIcon = (typeof TRUST_BADGE_ICONS)[number];

const badgeSchema = z.object({
  icon: z.enum(TRUST_BADGE_ICONS),
  /** Ключ заголовка из i18n.titles. Если не передано — используется `icon` */
  i18nKey: z.string().optional(),
});

const selectorSchema = z.object({
  selector: z.string().min(1),
  insert: z.enum(['before', 'after']).default('after'),
});

export const trustBadgesSchema = z.object({
  enabled: z.boolean().default(true),
  /** Куда вставлять полосу — несколько селекторов, до первого попадания */
  selectors: z.array(selectorSchema).default([
    { selector: '.product-card__order--normal', insert: 'after' },
    { selector: '.cart-buttons--full', insert: 'after' },
    { selector: '.cart-buttons', insert: 'after' },
    { selector: '.product-card__price-box', insert: 'after' },
  ]),
  badges: z.array(badgeSchema).default([
    { icon: 'shield' },
    { icon: 'truck' },
    { icon: 'return' },
    { icon: 'lock' },
  ]),
  layout: z.enum(['grid', 'row']).default('grid'),
  /** Универсальные нейтральные цвета — переопределяй под бренд */
  backgroundColor: z.string().default('transparent'),
  textColor: z.string().default('#374151'),
  iconColor: z.string().default('#111827'),
  borderColor: z.string().default('#e5e7eb'),
  borderRadius: z.number().default(12),
  showBorder: z.boolean().default(true),
});

export type TrustBadgesConfig = z.infer<typeof trustBadgesSchema>;
export type TrustBadgesInput = z.input<typeof trustBadgesSchema>;

const i18nEntrySchema = z.object({
  titles: z.record(z.string(), z.string()),
});

export const trustBadgesI18nSchema = z
  .record(z.string(), i18nEntrySchema)
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type TrustBadgesI18n = z.infer<typeof trustBadgesI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  trustBadgesSchema.parse(config);
  trustBadgesI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(trustBadgesSchema, 'TrustBadgesConfig'),
    i18n: zodToJsonSchema(trustBadgesI18nSchema, 'TrustBadgesI18n'),
  };
}

export function getDefaultConfig(): TrustBadgesInput {
  return trustBadgesSchema.parse({});
}

export function getDefaultI18n(): TrustBadgesI18n {
  return {
    ua: {
      titles: {
        shield: 'Безпечна оплата',
        truck: 'Швидка доставка',
        return: '14 днів на повернення',
        lock: 'SSL шифрування',
        card: 'Visa / Mastercard',
        guarantee: 'Офіційна гарантія',
        support: 'Підтримка 24/7',
        star: 'Перевірений магазин',
        leaf: 'Еко-упаковка',
        box: 'Безкоштовна упаковка',
      },
    },
    ru: {
      titles: {
        shield: 'Безопасная оплата',
        truck: 'Быстрая доставка',
        return: '14 дней на возврат',
        lock: 'SSL шифрование',
        card: 'Visa / Mastercard',
        guarantee: 'Официальная гарантия',
        support: 'Поддержка 24/7',
        star: 'Проверенный магазин',
        leaf: 'Эко-упаковка',
        box: 'Бесплатная упаковка',
      },
    },
    en: {
      titles: {
        shield: 'Secure payment',
        truck: 'Fast shipping',
        return: '14-day returns',
        lock: 'SSL encryption',
        card: 'Visa / Mastercard',
        guarantee: 'Official warranty',
        support: '24/7 support',
        star: 'Trusted store',
        leaf: 'Eco packaging',
        box: 'Free packaging',
      },
    },
  };
}
