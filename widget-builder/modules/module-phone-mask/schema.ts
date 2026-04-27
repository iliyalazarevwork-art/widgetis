import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { COUNTRIES } from './countries';

const COUNTRY_CODES = Object.keys(COUNTRIES) as [string, ...string[]];

export const phoneMaskSchema = z.object({
  enabled: z.boolean().default(true),

  /** CSS selector(s) used to find phone inputs on the page. */
  selector: z.string().min(1).default('.j-phone-masked, input[name*="phone"], input[type="tel"]'),

  /** ISO2 code of the country selected by default. Must be present in COUNTRIES. */
  defaultCountry: z.enum(COUNTRY_CODES).default('UA'),

  /**
   * Whitelist of allowed country ISO2 codes. If empty — all known countries are
   * available. Any code not in COUNTRIES is silently dropped.
   */
  allowedCountries: z.array(z.string()).default([]),

  /** If true, restore the previously selected country/phone from localStorage. */
  rememberLastChoice: z.boolean().default(true),

  /** If true, attempt to detect the country via GeoIP on first load. */
  geoip: z.boolean().default(false),

  /** GeoIP endpoint that returns `{ country_code: "UA" }`. */
  geoipUrl: z.string().url().default('https://ipapi.co/json/'),

  /** CDN base URL for country flag images: `${flagCdn}/24x18/{iso2}.png`. */
  flagCdn: z.string().url().default('https://flagcdn.com'),

  /** If true, hide the country picker (single-country mode). */
  hidePicker: z.boolean().default(false),

  /** If true, block form submission when the entered number is invalid. */
  blockSubmitOnInvalid: z.boolean().default(true),
});

export type PhoneMaskConfig = z.infer<typeof phoneMaskSchema>;
export type PhoneMaskInput = z.input<typeof phoneMaskSchema>;

export const phoneMaskI18nSchema = z
  .record(
    z.string(),
    z.object({
      searchPlaceholder: z.string(),
      hint: z.string(),
      invalid: z.string(),
    }),
  )
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type PhoneMaskI18n = z.infer<typeof phoneMaskI18nSchema>;

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(phoneMaskSchema, 'PhoneMaskConfig'),
    i18n: zodToJsonSchema(phoneMaskI18nSchema, 'PhoneMaskI18n'),
  };
}

export function getDefaultConfig(): PhoneMaskInput {
  return phoneMaskSchema.parse({});
}

export function getDefaultI18n(): PhoneMaskI18n {
  return {
    ua: {
      searchPlaceholder: 'Пошук країни або коду…',
      hint: 'Введіть номер у форматі країни',
      invalid: 'Невірний формат номера',
    },
    ru: {
      searchPlaceholder: 'Поиск страны или кода…',
      hint: 'Введите номер в формате страны',
      invalid: 'Неверный формат номера',
    },
    en: {
      searchPlaceholder: 'Search country or code…',
      hint: 'Enter the number for the selected country',
      invalid: 'Invalid phone number',
    },
  };
}
