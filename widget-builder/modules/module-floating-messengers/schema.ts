import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const CHANNEL_TYPES = ['whatsapp', 'telegram', 'viber', 'phone', 'email'] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

const channelSchema = z.object({
  type: z.enum(CHANNEL_TYPES),
  value: z.string().min(1),
  label: z.string().optional(),
});

export type Channel = z.infer<typeof channelSchema>;

export const floatingMessengersSchema = z.object({
  enabled: z.boolean().default(true),
  position: z.enum(['bottom-right', 'bottom-left']).default('bottom-right'),
  bottomOffsetDesktop: z.number().default(24),
  bottomOffsetMobile: z.number().default(80),
  sideOffset: z.number().default(20),
  channels: z.array(channelSchema).default([]),
  bubbleColor: z.string().default('#111827'),
  bubbleIconColor: z.string().default('#ffffff'),
  expandedBackground: z.string().default('#ffffff'),
  expandedTextColor: z.string().default('#111827'),
  borderColor: z.string().default('#e5e7eb'),
  borderRadius: z.number().default(16),
  zIndex: z.number().default(9000),
  showLabels: z.boolean().default(true),
  delaySec: z.number().default(3),
  pulseAnimation: z.boolean().default(true),
});

export type FloatingMessengersConfig = z.infer<typeof floatingMessengersSchema>;
export type FloatingMessengersInput = z.input<typeof floatingMessengersSchema>;

const i18nEntrySchema = z.object({
  greeting: z.string(),
  closeLabel: z.string(),
});

export const floatingMessengersI18nSchema = z
  .record(z.string(), i18nEntrySchema)
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type FloatingMessengersI18n = z.infer<typeof floatingMessengersI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  floatingMessengersSchema.parse(config);
  floatingMessengersI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(floatingMessengersSchema, 'FloatingMessengersConfig'),
    i18n: zodToJsonSchema(floatingMessengersI18nSchema, 'FloatingMessengersI18n'),
  };
}

export function getDefaultConfig(): FloatingMessengersInput {
  return floatingMessengersSchema.parse({});
}

export function getDefaultI18n(): FloatingMessengersI18n {
  return {
    ua: {
      greeting: "Зв'яжіться з нами",
      closeLabel: 'Закрити',
    },
    ru: {
      greeting: 'Свяжитесь с нами',
      closeLabel: 'Закрыть',
    },
    en: {
      greeting: 'Contact us',
      closeLabel: 'Close',
    },
  };
}
