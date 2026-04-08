import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const selectorSchema = z.object({
  selector: z.string().min(1),
  insert: z.enum(['append', 'before', 'after']).default('before'),
});

export const deliveryDateSchema = z.object({
  enabled: z.boolean().default(true),
  selectors: z.array(selectorSchema).default([
    {
      selector:
        '#page > main > div > div.product__grid > div.product__column.product__column--right > div.product__block.product__block--orderBox.j-product-block > div > div.product-card.product-card--main > div',
      insert: 'before',
    },
    {
      selector:
        '#main > div.wrapper > section > div > div.product__column.product__column--right.product__column--sticky > div > div:nth-child(1) > div > div:nth-child(5)',
      insert: 'after',
    },
  ]),
  offsetDays: z.number().default(3),
});

export type DeliveryDateConfig = z.infer<typeof deliveryDateSchema>;
export type DeliveryDateInput = z.input<typeof deliveryDateSchema>;

export const deliveryDateI18nSchema = z
  .record(
    z.string(),
    z.object({
      prefix: z.string(),
      tomorrow: z.string().default('завтра'),
      dayAfterTomorrow: z.string().default('післязавтра'),
      monday: z.string().default('в понеділок'),
      tuesday: z.string().default('у вівторок'),
      wednesday: z.string().default('в середу'),
      thursday: z.string().default('в четвер'),
      friday: z.string().default('в п\'ятницю'),
      saturday: z.string().default('в суботу'),
      sunday: z.string().default('в неділю'),
    }),
  )
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one language must be provided',
  });

export type DeliveryDateI18n = z.infer<typeof deliveryDateI18nSchema>;

export function validate(config: unknown, i18n: unknown): void {
  deliveryDateSchema.parse(config);
  deliveryDateI18nSchema.parse(i18n);
}

export function getJsonSchema() {
  return {
    config: zodToJsonSchema(deliveryDateSchema, 'DeliveryDateConfig'),
    i18n: zodToJsonSchema(deliveryDateI18nSchema, 'DeliveryDateI18n'),
  };
}

export function getDefaultConfig(): DeliveryDateInput {
  return deliveryDateSchema.parse({});
}

export function getDefaultI18n(): DeliveryDateI18n {
  return {
    ua: {
      prefix: 'Очікувана доставка',
      tomorrow: 'завтра',
      dayAfterTomorrow: 'післязавтра',
      monday: 'в понеділок',
      tuesday: 'у вівторок',
      wednesday: 'в середу',
      thursday: 'в четвер',
      friday: 'в п\'ятницю',
      saturday: 'в суботу',
      sunday: 'в неділю',
    },
  };
}
