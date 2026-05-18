import { describe, it, expect } from 'vitest';
import widgetalityPlugin, { type ModuleConfigs } from './index';
import type { Plugin } from 'vite';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Invoke the plugin's `load` hook directly to get the generated entry source.
 * We bypass the vite resolution chain and call load('\0virtual:widgetality-entry').
 */
function getGeneratedEntry(modules: ModuleConfigs): string {
  const plugin = widgetalityPlugin({ site: 'test', modules }) as Plugin;
  const load = plugin.load as (id: string) => string | undefined;
  const RESOLVED_ID = '\0virtual:widgetality-entry';
  const result = load(RESOLVED_ID);
  if (!result) throw new Error('Plugin returned no entry for RESOLVED_VIRTUAL_MODULE_ID');
  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('vite-plugin-widgetality — page guard codegen', () => {
  it('emits __wgtsMatchesPage import and guard when module has pages array', () => {
    const modules: ModuleConfigs = {
      'module-sticky-buy-button': {
        config: { enabled: true },
        i18n: {},
        pages: ['product'],
      },
    };

    const entry = getGeneratedEntry(modules);

    expect(entry).toContain("import { matchesPage as __wgtsMatchesPage } from '@laxarevii/core'");
    expect(entry).toContain('__wgtsMatchesPage(["product"])');
    expect(entry).toContain("skipped — wrong page type");
  });

  it('does NOT emit __wgtsMatchesPage import when no module has pages', () => {
    const modules: ModuleConfigs = {
      'module-promo-line': {
        config: { enabled: true },
        i18n: {},
        // no pages key
      },
    };

    const entry = getGeneratedEntry(modules);

    expect(entry).not.toContain('__wgtsMatchesPage');
    expect(entry).not.toContain("matchesPage");
  });

  it('does NOT emit guard when pages is "all"', () => {
    const modules: ModuleConfigs = {
      'module-promo-line': {
        config: { enabled: true },
        i18n: {},
        pages: 'all',
      },
    };

    const entry = getGeneratedEntry(modules);

    expect(entry).not.toContain('__wgtsMatchesPage');
  });

  it('emits correct pages array literal for multi-page module', () => {
    const modules: ModuleConfigs = {
      'module-cart-goal': {
        config: { enabled: true },
        i18n: {},
        pages: ['home', 'category', 'product', 'cart'],
      },
    };

    const entry = getGeneratedEntry(modules);

    expect(entry).toContain('__wgtsMatchesPage(["home","category","product","cart"])');
  });

  it('skips disabled modules entirely (no guard emitted)', () => {
    const modules: ModuleConfigs = {
      'module-sticky-buy-button': {
        config: { enabled: false },
        i18n: {},
        pages: ['product'],
      },
    };

    const entry = getGeneratedEntry(modules);

    // Disabled module should not appear in output at all
    expect(entry).not.toContain('sticky_buy_button');
    expect(entry).not.toContain('__wgtsMatchesPage');
  });
});
