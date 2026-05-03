import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const productVideoPreviewSchema = z.object({
  enabled: z.boolean().default(true),
  testVideoUrl: z.string().optional().default('http://localhost:3100/demo-unboxing.mp4'),
  mp4Selector: z.string().default('a[href$=".mp4"]'),
  desktopSize: z.number().default(180),
  mobileSize: z.number().default(160),
  desktopMinimizedSize: z.number().default(140),
  mobileMinimizedSize: z.number().default(120),
  insetDesktop: z.number().default(30),
  insetMobile: z.number().default(15),
  borderColor: z.string().default('#7c3aed'),
  observeSpa: z.boolean().default(true),
  showOnMobile: z.boolean().default(true),
  showOnDesktop: z.boolean().default(true),
});

export type ProductVideoPreviewConfig = z.infer<typeof productVideoPreviewSchema>;
export type ProductVideoPreviewInput = z.input<typeof productVideoPreviewSchema>;

export const productVideoPreviewI18nSchema = z
  .record(
    z.string(),
    z.object({
      tooltipText: z.string(),
      actionButtonText: z.string(),
      sizeGuideText: z.string(),
      closeLabel: z.string(),
    }),
  )
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type ProductVideoPreviewI18n = z.infer<typeof productVideoPreviewI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  productVideoPreviewSchema.parse(config);
  productVideoPreviewI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(productVideoPreviewSchema, 'ProductVideoPreviewConfig'),
    i18n: zodToJsonSchema(productVideoPreviewI18nSchema, 'ProductVideoPreviewI18n'),
  };
}

export function getDefaultConfig(): ProductVideoPreviewInput {
  return productVideoPreviewSchema.parse({});
}

export function getDefaultI18n(): ProductVideoPreviewI18n {
  return {
    ua: {
      tooltipText: 'Відео товару',
      actionButtonText: 'Дивитись відео',
      sizeGuideText: '',
      closeLabel: 'Закрити',
    },
  };
}
