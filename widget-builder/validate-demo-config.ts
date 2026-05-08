// Validate a demo-session config payload against each module's real Zod schema.
//
// Usage (from project root, via the widget-builder container):
//   cat cfg.json | docker compose -f docker-compose.dev.yml exec -T widget-builder \
//     node node_modules/.bin/jiti validate-demo-config.ts
//
// Input shape (matches POST /api/v1/admin/demo-sessions `config` body):
//   { demo_code?: string,
//     brand?: { primary_color?, accent_color?, text_color? },
//     modules: { <slug>: { is_enabled?, config?, i18n? } } }
//
// The validator uses each module's own Zod schema with .deepPartial() so that
// user overrides only need to provide the keys they want to change — the
// bundle deep-merges them on top of baked-in defaults at runtime, so the
// override surface and the schema surface are the same shape.
//
// Exit codes:
//   0 — config valid (or no enabled modules)
//   1 — validation errors (printed as JSON on stdout)
//   2 — input malformed / IO error

import { readFileSync } from 'node:fs';
import { z, type ZodTypeAny } from 'zod';

import { socialProofSchema, socialProofI18nSchema } from './modules/module-buyer-count/schema';
import { cartGoalSchema, cartGoalI18nSchema } from './modules/module-cart-goal/schema';
import { cartRecommenderSchema, cartRecommenderI18nSchema } from './modules/module-cart-recommender/schema';
import { deliveryDateSchema, deliveryDateI18nSchema } from './modules/module-delivery-date/schema';
import { exitIntentPopupSchema, exitIntentPopupI18nSchema } from './modules/module-last-chance-popup/schema';
import { minOrderSchema, minOrderI18nSchema } from './modules/module-minorder-goal/schema';
import { onePlusOneSchema, onePlusOneI18nSchema } from './modules/module-one-plus-one/schema';
import { phoneMaskSchema, phoneMaskI18nSchema } from './modules/module-phone-mask/schema';
import { photoReviewsSchema, photoReviewsI18nSchema } from './modules/module-photo-video-reviews/schema';
import { prizeBannerSchema, prizeBannerI18nSchema } from './modules/module-prize-banner/schema';
import { progressiveDiscountSchema, progressiveDiscountI18nSchema } from './modules/module-progressive-discount/schema';
import { promoAutoApplySchema, promoAutoApplyI18nSchema } from './modules/module-promo-auto-apply/schema';
import { marqueeSchema, marqueeI18nSchema } from './modules/module-promo-line/schema';
import { smsOtpCheckoutSchema, smsOtpCheckoutI18nSchema } from './modules/module-sms-otp-checkout/schema';
import { spinTheWheelSchema, spinTheWheelI18nSchema } from './modules/module-spin-the-wheel/schema';
import { stickyBuyButtonSchema, stickyBuyButtonI18nSchema } from './modules/module-sticky-buy-button/schema';
import { stockLeftSchema, stockLeftI18nSchema } from './modules/module-stock-left/schema';
import { trustBadgesSchema, trustBadgesI18nSchema } from './modules/module-trust-badges/schema';
import { productVideoPreviewSchema, productVideoPreviewI18nSchema } from './modules/module-video-preview/schema';

interface SchemaPair {
  config: ZodTypeAny;
  i18n: ZodTypeAny | null;
}

const SCHEMAS: Record<string, SchemaPair> = {
  'buyer-count':         { config: socialProofSchema,         i18n: socialProofI18nSchema },
  'cart-goal':           { config: cartGoalSchema,            i18n: cartGoalI18nSchema },
  'cart-recommender':    { config: cartRecommenderSchema,     i18n: cartRecommenderI18nSchema },
  'delivery-date':       { config: deliveryDateSchema,        i18n: deliveryDateI18nSchema },
  'last-chance-popup':   { config: exitIntentPopupSchema,     i18n: exitIntentPopupI18nSchema },
  'minorder-goal':       { config: minOrderSchema,            i18n: minOrderI18nSchema },
  'one-plus-one':        { config: onePlusOneSchema,          i18n: onePlusOneI18nSchema },
  'phone-mask':          { config: phoneMaskSchema,           i18n: phoneMaskI18nSchema },
  'photo-video-reviews': { config: photoReviewsSchema,        i18n: photoReviewsI18nSchema },
  'prize-banner':        { config: prizeBannerSchema,         i18n: prizeBannerI18nSchema },
  'progressive-discount':{ config: progressiveDiscountSchema, i18n: progressiveDiscountI18nSchema },
  'promo-auto-apply':    { config: promoAutoApplySchema,      i18n: promoAutoApplyI18nSchema },
  'promo-line':          { config: marqueeSchema,             i18n: marqueeI18nSchema },
  'sms-otp-checkout':    { config: smsOtpCheckoutSchema,      i18n: smsOtpCheckoutI18nSchema },
  'spin-the-wheel':      { config: spinTheWheelSchema,        i18n: spinTheWheelI18nSchema },
  'sticky-buy-button':   { config: stickyBuyButtonSchema,     i18n: stickyBuyButtonI18nSchema },
  'stock-left':          { config: stockLeftSchema,           i18n: stockLeftI18nSchema },
  'trust-badges':        { config: trustBadgesSchema,         i18n: trustBadgesI18nSchema },
  'video-preview':       { config: productVideoPreviewSchema, i18n: productVideoPreviewI18nSchema },
};

interface ValidationError {
  slug: string;
  field: 'config' | 'i18n';
  path: (string | number)[];
  expected: string;
  received: string;
  message: string;
}

interface Result {
  ok: boolean;
  validated_modules: string[];
  errors: ValidationError[];
}

function readStdin(): string {
  try {
    return readFileSync(0, 'utf-8');
  } catch (e) {
    process.stderr.write(`failed to read stdin: ${(e as Error).message}\n`);
    process.exit(2);
  }
}

/**
 * Programmatic API used by `widget-builder/server.ts` for the HTTP /validate
 * endpoint. The CLI at the bottom of this file calls the same function.
 *
 * Returns a Result; never throws on validation failures. Throws only on truly
 * malformed input shape (non-object payload), which the caller should treat
 * as a 400.
 */
export function validateDemoPayload(payload: unknown): Result {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload must be a JSON object');
  }
  const cfg = payload as Record<string, unknown>;
  // Accept both the inner `{ modules, brand?, demo_code? }` and the full POST
  // body `{ domain, config: { modules, ... } }` — peel one layer.
  const inner = (
    !('modules' in cfg) && 'config' in cfg && cfg.config && typeof cfg.config === 'object'
      ? cfg.config
      : cfg
  ) as Record<string, unknown>;
  const modules = (inner.modules ?? {}) as Record<string, unknown>;
  if (typeof modules !== 'object' || Array.isArray(modules)) {
    throw new Error('payload.modules must be an object');
  }

  const result: Result = { ok: true, validated_modules: [], errors: [] };

  for (const [slug, raw] of Object.entries(modules)) {
    const pair = SCHEMAS[slug];
    if (!pair) {
      result.ok = false;
      result.errors.push({
        slug, field: 'config', path: [], expected: 'known module slug', received: 'unknown',
        message: `Unknown module slug "${slug}". Valid slugs: ${Object.keys(SCHEMAS).sort().join(', ')}`,
      });
      continue;
    }
    if (!raw || typeof raw !== 'object') {
      result.ok = false;
      result.errors.push({
        slug, field: 'config', path: [], expected: 'object', received: typeof raw,
        message: `modules.${slug} must be an object`,
      });
      continue;
    }
    const entry = raw as { is_enabled?: unknown; config?: unknown; i18n?: unknown };
    if (entry.is_enabled === false) continue; // disabled — config does not run

    result.validated_modules.push(slug);

    if (entry.config !== undefined && entry.config !== null) {
      const partialSchema = (pair.config as unknown as { deepPartial?: () => ZodTypeAny }).deepPartial?.()
        ?? (pair.config as unknown as { partial?: () => ZodTypeAny }).partial?.()
        ?? pair.config;
      const parsed = partialSchema.safeParse(entry.config);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          result.ok = false;
          result.errors.push({
            slug,
            field: 'config',
            path: issue.path,
            expected: 'expected' in issue ? String((issue as { expected?: unknown }).expected) : issue.code,
            received: 'received' in issue ? String((issue as { received?: unknown }).received) : '',
            message: issue.message,
          });
        }
      }
    }

    if (entry.i18n !== undefined && entry.i18n !== null && pair.i18n) {
      const i18nPartial = (pair.i18n as unknown as { deepPartial?: () => ZodTypeAny }).deepPartial?.()
        ?? (pair.i18n as unknown as { partial?: () => ZodTypeAny }).partial?.()
        ?? pair.i18n;
      const parsed = i18nPartial.safeParse(entry.i18n);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          result.ok = false;
          result.errors.push({
            slug,
            field: 'i18n',
            path: issue.path,
            expected: 'expected' in issue ? String((issue as { expected?: unknown }).expected) : issue.code,
            received: 'received' in issue ? String((issue as { received?: unknown }).received) : '',
            message: issue.message,
          });
        }
      }
    }
  }

  return result;
}

// CLI entry point. Skipped when this file is imported as a module
// (e.g. by widget-builder/server.ts for the HTTP /validate endpoint).
function runCli(): void {
  const raw = readStdin();
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    process.stderr.write(`invalid JSON on stdin: ${(e as Error).message}\n`);
    process.exit(2);
  }

  let result: Result;
  try {
    result = validateDemoPayload(payload);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    process.exit(2);
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 1);
}

// argv[1] is the script jiti is executing. Match by basename so dev-mode
// (`/app/validate-demo-config.ts`) and any CLI alias both fire.
if (process.argv[1] && /validate-demo-config\.(ts|mjs|cjs|js)$/.test(process.argv[1])) {
  runCli();
}

// Touch z to keep import (no-op).
void z;
