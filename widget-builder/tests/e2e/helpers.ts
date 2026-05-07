import type { Page } from '@playwright/test';

export const TEST_SITES = [
  { name: 'tehnomix', domain: 'tehnomix.com.ua' },
  { name: 'runabags', domain: 'runabags.com.ua' },
  { name: 'hollyskin', domain: 'hollyskin.com.ua' },
  { name: 'beelab', domain: 'beelab.ua' },
  { name: 'snackup', domain: 'snackup.com.ua' },
  { name: 'krkr', domain: 'krkr.com.ua' },
  { name: 'florashop', domain: 'florashop.com.ua' },
  { name: 'teysha', domain: 'teysha.com.ua' },
  { name: 'bujobox', domain: 'bujobox.com.ua' },
  { name: 'zaichyk', domain: 'zaichyk.com.ua' },
  { name: 'delikatto', domain: 'delikatto.com.ua' },
  { name: 'bag24', domain: 'bag24.com.ua' },
] as const;

export const PROXY_BASE = 'http://localhost:3100';

export type SiteFixture = (typeof TEST_SITES)[number];

/** Build a proxied URL like http://localhost:3100/site/{domain}{relative} */
export function siteUrl(site: SiteFixture, relative: string): string {
  const path = relative.startsWith('/') ? relative : `/${relative}`;
  return `${PROXY_BASE}/site/${site.domain}${path}`;
}

/** Cart/checkout path on Horoshop */
export function cartPath(): string {
  return '/checkout/';
}

// ── Product-path cache ────────────────────────────────────────────────────────

const productPathCache = new Map<string, string>();

/**
 * Return the path to a real Horoshop **product detail** page for a domain.
 *
 * IMPORTANT: must be a single product detail page (not a category listing)
 * because modules like photo-video-reviews use isHoroshopProductPage() which checks
 * for .j-product-block etc. — elements only present on product detail pages.
 *
 * Paths are verified against both test sites by running Playwright and checking
 * for `.j-product-block` in the live browser DOM (Horoshop renders the product
 * detail DOM entirely via JavaScript, so the static HTML is not sufficient).
 *
 * Result is cached in-memory per domain across the suite.
 */
export async function findProductPath(domain: string): Promise<string> {
  const cached = productPathCache.get(domain);
  if (cached) return cached;

  // Verified product detail paths (live browser DOM checked — og:type=product + j-buy-button-add present)
  const verifiedProductPaths: Record<string, string> = {
    'tehnomix.com.ua':
      '/besprovodnaya-bluetooth-kolonka-stereo-bt-tg-165-10-w-biruzovaya/',
    'runabags.com.ua':
      '/rhodes-suede-bag.-zhinocha-sumka-temno-korychneva-z-naturalnoi-zamshi/',
    'hollyskin.com.ua':
      '/syrovatka-salmon-dna-pdrn-hollyskin/',
    'beelab.ua':
      '/nasinnia-harbuza-z-medom-1000-ml/',
    'snackup.com.ua':
      '/dyspenserdliazhuvalnoihumkybubblegum300h/',
    'krkr.com.ua':
      '/dr.ceuracle-jeju-matcha-tea-essence-150-ml/',
    'florashop.com.ua':
      '/sadzhanets-vynohradu-kyshmysh-kesha-ranno-serednii-termin-dozrivannia/',
    'teysha.com.ua':
      '/lampa-s-yskusstvennym-yntellektom-o-nail-white/',
    'bujobox.com.ua':
      '/set-stikeriv-mriytadiy-dlia-kolazhiv-3-slidy-chasu-10kh15-sm/',
    'zaichyk.com.ua':
      '/hustyi-krem-zmazka-na-hibrydnii-osnovi-sensuva-ultrathick-hybrid-formula-50-ml-rn-zbalansovana/',
    'delikatto.com.ua':
      '/znamenytyi-norvezhskyi-karamelnyi-syr-synnve-brunost-fltemysost-480h-norvehiia/',
    'bag24.com.ua':
      '/ryukzak-bl-molodizhnij-mini-8-l-chornij-917-00508662-1121720888.html',
  };

  const path = verifiedProductPaths[domain] ?? '/';
  productPathCache.set(domain, path);
  return path;
}

// ── Module-mount waiter ───────────────────────────────────────────────────────

export interface WaitForModuleMountOptions {
  selector?: string;
  consolePattern?: RegExp;
  /** Milliseconds to wait. Default 12 000. */
  timeoutMs?: number;
}

export interface MountResult {
  ok: true;
  via: 'selector' | 'console';
}

/**
 * Wait for a module to activate.
 *
 * Strategy:
 *   1. If `selector` is given — poll for it every 200 ms inside timeoutMs.
 *   2. If selector is absent or not found, check captured console messages
 *      against `consolePattern`.
 *
 * Throws if neither condition is met within the timeout.
 */
export async function waitForModuleMount(
  page: Page,
  opts: WaitForModuleMountOptions,
): Promise<MountResult> {
  const { selector, consolePattern, timeoutMs = 12_000 } = opts;

  // Collect console messages via listener
  const consoleLogs: string[] = [];
  const consoleHandler = (msg: { text(): string }): void => {
    consoleLogs.push(msg.text());
  };
  page.on('console', consoleHandler);

  const deadline = Date.now() + timeoutMs;

  try {
    // Give the module bundle time to execute after DOMContentLoaded
    // (site-proxy injects the bundle and activates it inside a double-rAF)
    await page.waitForTimeout(2_500);

    if (selector) {
      // Poll for DOM selector
      while (Date.now() < deadline) {
        const found = await page.locator(selector).count();
        if (found > 0) {
          return { ok: true, via: 'selector' };
        }
        await page.waitForTimeout(200);
      }
    }

    // Fallback: console log
    if (consolePattern) {
      while (Date.now() < deadline) {
        if (consoleLogs.some((l) => consolePattern.test(l))) {
          return { ok: true, via: 'console' };
        }
        await page.waitForTimeout(200);
      }
      // One final check after draining
      if (consoleLogs.some((l) => consolePattern.test(l))) {
        return { ok: true, via: 'console' };
      }
    }
  } finally {
    page.off('console', consoleHandler);
  }

  const tried: string[] = [];
  if (selector) tried.push(`selector "${selector}"`);
  if (consolePattern) tried.push(`console pattern ${consolePattern}`);
  throw new Error(
    `Module did not mount within ${timeoutMs}ms. Tried: ${tried.join(', ')}.\n` +
      `Console output:\n${consoleLogs.slice(-20).join('\n')}`,
  );
}
