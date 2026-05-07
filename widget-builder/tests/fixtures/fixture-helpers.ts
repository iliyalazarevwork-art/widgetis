import type { Page } from '@playwright/test';

export const FIXTURE_BASE = 'http://localhost:5174';

export type FixturePage = 'product' | 'checkout' | 'any';

export interface GoToFixtureOptions {
  fixturePage: FixturePage;
  module: string;
  config?: Record<string, unknown>;
  i18n?: Record<string, unknown>;
}

const PAGE_MAP: Record<FixturePage, string> = {
  product: 'tests/fixtures/product-page.html',
  checkout: 'tests/fixtures/checkout-page.html',
  any: 'tests/fixtures/any-page.html',
};

export async function goToFixture(page: Page, opts: GoToFixtureOptions): Promise<void> {
  const params = new URLSearchParams();
  params.set('module', opts.module);
  if (opts.config) params.set('config', JSON.stringify(opts.config));
  if (opts.i18n) params.set('i18n', JSON.stringify(opts.i18n));

  const url = `${FIXTURE_BASE}/${PAGE_MAP[opts.fixturePage]}?${params}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

/** Wait for the module to finish loading (or fail) */
export async function waitForWidget(page: Page, timeoutMs = 8_000): Promise<void> {
  await page.waitForFunction(
    () => (window as any).__widgetLoaded === true || (window as any).__widgetError,
    { timeout: timeoutMs },
  );

  const err = await page.evaluate(() => (window as any).__widgetError);
  if (err) throw new Error(`Widget failed to load: ${err}`);
}

/** Run cleanup and verify element is removed */
export async function runCleanup(page: Page): Promise<void> {
  await page.evaluate(() => {
    const cleanup = (window as any).__widgetCleanup;
    if (typeof cleanup === 'function') cleanup();
  });
}
