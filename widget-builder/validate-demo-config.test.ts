import { describe, expect, it } from 'vitest';

import { validateDemoPayload } from './validate-demo-config';

describe('validateDemoPayload', () => {
  it('skips schema validation for modules disabled via config.enabled', () => {
    const result = validateDemoPayload({
      modules: {
        'module-cart-recommender': {
          config: {
            enabled: false,
          },
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.validated_modules).toEqual([]);
  });

  it('skips schema validation for modules disabled via is_enabled', () => {
    const result = validateDemoPayload({
      modules: {
        'module-last-chance-popup': {
          is_enabled: false,
          config: {},
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.validated_modules).toEqual([]);
  });

  it('still validates enabled modules and reports schema issues', () => {
    const result = validateDemoPayload({
      modules: {
        'module-cart-recommender': {
          is_enabled: true,
          config: {
            enabled: true,
            apiBaseUrl: 123,
          },
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.slug).toBe('module-cart-recommender');
    expect(result.validated_modules).toEqual(['cart-recommender']);
  });

  it('treats null override fields as omitted across module configs', () => {
    const result = validateDemoPayload({
      modules: {
        'module-last-chance-popup': {
          is_enabled: true,
          config: {
            promoCode: 'SAVE10',
            imageUrl: null,
          },
          i18n: {
            en: {
              title: 'Wait',
              subtitle: 'Save now',
              emailPlaceholder: 'Email',
              ctaButton: 'Go',
              copyButton: 'Copy',
              copiedLabel: 'Copied',
              promoLabel: 'Promo',
              noThanks: 'No thanks',
              successTitle: 'Done',
              successText: 'Applied',
            },
          },
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.validated_modules).toEqual(['last-chance-popup']);
  });
});
