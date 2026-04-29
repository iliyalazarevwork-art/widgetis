import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { IconType } from './icons';

// ---------------------------------------------------------------------------
// Segment schema
// ---------------------------------------------------------------------------

const iconTypeSchema = z.enum([
  'percent',
  'gift',
  'truck',
  'star',
  'fire',
  'crown',
  'sparkle',
  'try-again',
]);

export const spinSegmentSchema = z.object({
  label: z.string(),
  code: z.string(),
  weight: z.number().min(0),
  iconType: iconTypeSchema.optional(),
});

export type SpinSegment = z.infer<typeof spinSegmentSchema>;

// ---------------------------------------------------------------------------
// Config schema
// ---------------------------------------------------------------------------

const VIBRANT_PALETTE = [
  '#ef4444',
  '#f59e0b',
  '#fbbf24',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
] as const;

export const spinTheWheelSchema = z.object({
  enabled: z.boolean().default(true),
  /** Seconds on page before showing (whichever trigger fires first) */
  delaySec: z.number().default(8),
  /** Hours before showing popup again */
  cooldownHours: z.number().default(168),
  /** Also trigger on mouse-leave top edge (desktop exit intent) */
  triggerOnExitIntent: z.boolean().default(true),
  /** Require email before showing wheel */
  requireEmail: z.boolean().default(true),
  /** Show marketing consent checkbox */
  requireConsent: z.boolean().default(true),
  /** Wheel segments */
  segments: z
    .array(spinSegmentSchema)
    .min(2)
    .default([
      { label: '10% знижка', code: 'SPIN10', weight: 4, iconType: 'percent' as IconType },
      { label: 'Безкошт. доставка', code: 'FREESHIP', weight: 3, iconType: 'truck' as IconType },
      { label: '5% знижка', code: 'SPIN5', weight: 5, iconType: 'percent' as IconType },
      { label: 'Спробуйте ще', code: '', weight: 2, iconType: 'try-again' as IconType },
      { label: '15% знижка', code: 'SPIN15', weight: 1, iconType: 'fire' as IconType },
      { label: 'Подарунок', code: 'GIFT', weight: 1, iconType: 'gift' as IconType },
    ]),
  /** Segment background colors — cycles through all segments */
  palette: z
    .array(z.string())
    .min(2)
    .default([...VIBRANT_PALETTE]),
  wheelTextColor: z.string().default('#ffffff'),
  backgroundColor: z.string().default('#ffffff'),
  textColor: z.string().default('#111827'),
  accentColor: z.string().default('#111827'),
  accentTextColor: z.string().default('#ffffff'),
  borderColor: z.string().default('#e5e7eb'),
  borderRadius: z.number().default(16),
  /** Highest layer used in the widget, sits above typical host-site chat
   *  popups (which usually park around 999999) while leaving headroom. */
  zIndex: z.number().default(9999999),
  /** Color used for the pointer triangle and decorative ring gradient */
  decorativeColor: z.string().default('#ef4444'),
  /** UTM sources for which the popup should be hidden */
  hideOnUtmSources: z.array(z.string()).default([]),
});

export type SpinTheWheelConfig = z.infer<typeof spinTheWheelSchema>;
export type SpinTheWheelInput = z.input<typeof spinTheWheelSchema>;

// ---------------------------------------------------------------------------
// i18n schema
// ---------------------------------------------------------------------------

const spinI18nEntrySchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  emailPlaceholder: z.string(),
  consentText: z.string(),
  spinButton: z.string(),
  spinningLabel: z.string(),
  resultTitleWin: z.string(),
  resultTitleLose: z.string(),
  resultSubtitleWin: z.string(),
  resultSubtitleLose: z.string(),
  copyButton: z.string(),
  copiedLabel: z.string(),
  promoLabel: z.string(),
  closeLabel: z.string(),
  errorEmptyEmail: z.string().default('Будь ласка, введіть e-mail'),
  errorInvalidEmail: z.string().default('Перевірте формат e-mail'),
  /** Vertical label shown on the side tab when the modal is minimized. */
  tabLabel: z.string().default('Промокод'),
  /** Aria-label for the tab (used by screen readers, also tooltip). */
  tabAriaLabel: z.string().default('Відкрити колесо фортуни'),
  /** Aria-label for the small × on the tab that dismisses the widget. */
  tabCloseAriaLabel: z.string().default('Сховати на цій сесії'),
});

export const spinTheWheelI18nSchema = z
  .record(z.string(), spinI18nEntrySchema)
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type SpinTheWheelI18nEntry = z.infer<typeof spinI18nEntrySchema>;
export type SpinTheWheelI18n = z.infer<typeof spinTheWheelI18nSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function validate(config: unknown, i18n: unknown): void {
  spinTheWheelSchema.parse(config);
  spinTheWheelI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(spinTheWheelSchema, 'SpinTheWheelConfig'),
    i18n: zodToJsonSchema(spinTheWheelI18nSchema, 'SpinTheWheelI18n'),
  };
}

export function getDefaultConfig(): SpinTheWheelInput {
  return spinTheWheelSchema.parse({});
}

export function getDefaultI18n(): SpinTheWheelI18n {
  return {
    ua: {
      title: 'Крутіть колесо та виграйте!',
      subtitle: 'Введіть email і отримайте шанс виграти знижку або подарунок',
      emailPlaceholder: 'Ваш e-mail',
      consentText: 'Я погоджуюся отримувати маркетингові листи',
      spinButton: 'Крутити колесо!',
      spinningLabel: 'Крутимо...',
      resultTitleWin: 'Вітаємо! Ви виграли!',
      resultTitleLose: 'Спробуйте ще раз!',
      resultSubtitleWin: 'Ваш промокод — скопіюйте та застосуйте в кошику',
      resultSubtitleLose: 'На жаль, цього разу не пощастило',
      copyButton: 'Копіювати код',
      copiedLabel: 'Скопійовано!',
      promoLabel: 'Промокод',
      closeLabel: 'Закрити',
      errorEmptyEmail: 'Будь ласка, введіть e-mail',
      errorInvalidEmail: 'Перевірте формат e-mail',
    },
    ru: {
      title: 'Крутите колесо и выиграйте!',
      subtitle: 'Введите email и получите шанс выиграть скидку или подарок',
      emailPlaceholder: 'Ваш e-mail',
      consentText: 'Я соглашаюсь получать маркетинговые письма',
      spinButton: 'Крутить колесо!',
      spinningLabel: 'Крутим...',
      resultTitleWin: 'Поздравляем! Вы выиграли!',
      resultTitleLose: 'Попробуйте ещё раз!',
      resultSubtitleWin: 'Ваш промокод — скопируйте и применив в корзине',
      resultSubtitleLose: 'К сожалению, на этот раз не повезло',
      copyButton: 'Скопировать код',
      copiedLabel: 'Скопировано!',
      promoLabel: 'Промокод',
      closeLabel: 'Закрыть',
      errorEmptyEmail: 'Пожалуйста, введите e-mail',
      errorInvalidEmail: 'Проверьте формат e-mail',
    },
    en: {
      title: 'Spin the wheel and win!',
      subtitle: 'Enter your email for a chance to win a discount or gift',
      emailPlaceholder: 'Your email',
      consentText: 'I agree to receive marketing emails',
      spinButton: 'Spin to win!',
      spinningLabel: 'Spinning...',
      resultTitleWin: 'Congratulations! You won!',
      resultTitleLose: 'Try again!',
      resultSubtitleWin: 'Your promo code — copy and apply at checkout',
      resultSubtitleLose: 'Better luck next time!',
      copyButton: 'Copy code',
      copiedLabel: 'Copied!',
      promoLabel: 'Promo code',
      closeLabel: 'Close',
      errorEmptyEmail: 'Please enter your email',
      errorInvalidEmail: 'Please enter a valid email',
    },
  };
}
