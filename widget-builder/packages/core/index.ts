declare global {
  interface Window {
    horoshop?: {
      currency?: string;
    };
    GLOBAL?: {
      URI_PREFIX?: string;
    };
  }
}

function normalizeLanguageCode(lang: string): string {
  const normalized = lang.toLowerCase();
  return normalized === 'uk' ? 'ua' : normalized;
}

function getGlobalLanguage(): string | null {
  if (typeof window === 'undefined') return null;
  const prefix = window.GLOBAL?.URI_PREFIX;
  if (typeof prefix === 'string') {
    const match = prefix.toLowerCase().match(/\/([a-z]{2})\//);
    if (match) return match[1];
  }
  return null;
}

/**
 * Get page language with priority:
 * 1. GLOBAL.URI_PREFIX (Horoshop global)
 * 2. HTML lang attribute
 * 3. Fallback "ua"
 */
export function getLanguage(): string {
  const globalLang = getGlobalLanguage();
  const htmlLang = typeof document !== 'undefined' ? document.documentElement.lang : null;
  const lang = globalLang || htmlLang || 'ua';
  return normalizeLanguageCode(lang);
}

export function getCurrency(): string {
  return window.horoshop?.currency ?? 'UAH';
}

// ---------------------------------------------------------------------------
// Currency utilities
// ---------------------------------------------------------------------------

const CURRENCY_SYMBOLS: Record<string, string> = {
  UAH: '₴',
  USD: '$',
  EUR: '€',
  GBP: '£',
  PLN: 'zł',
};

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}

export type CurrencyContext = {
  code: string;
  symbol: string;
};

export function getGlobalCurrencyInfo(): { code?: string; symbol?: string } {
  if (typeof window === 'undefined') return {};
  const global = (window as any).GLOBAL;
  const code = global?.currency?.iso || global?.currency?.title;
  const symbol = global?.currency?.sign || global?.currency?.abbr;
  return {
    code: typeof code === 'string' ? code.toUpperCase() : undefined,
    symbol: typeof symbol === 'string' ? symbol : undefined,
  };
}

export function detectCurrencyCode(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (text.includes('₴') || lower.includes('грн') || lower.includes('uah')) return 'UAH';
  if (text.includes('€') || lower.includes('eur')) return 'EUR';
  if (text.includes('$') || lower.includes('usd')) return 'USD';
  return undefined;
}

export function resolveCurrency(currencyFromCart?: string): CurrencyContext {
  const global = getGlobalCurrencyInfo();
  const code = global.code ?? currencyFromCart ?? 'UAH';
  const symbol = global.symbol ?? getCurrencySymbol(code);
  return { code, symbol };
}

// ---------------------------------------------------------------------------
// Horoshop page-type detection
// ---------------------------------------------------------------------------

const HOROSHOP_PRODUCT_PAGE_SELECTOR = [
  '.product-header',
  '.product__section--header',
  '.j-product-description',
  '#productPage',
  '.product__buy-button',
].join(',');

/**
 * Detects whether the current page is a Horoshop product detail page.
 *
 * Strategy (in order of reliability):
 *  1. <meta property="og:type"> — Horoshop sets "product" on product pages,
 *     "website" / "product.group" / "article" elsewhere. Most reliable signal.
 *  2. Product-only DOM selectors — fallback when og:type is absent.
 *
 * Note: ".j-product-block" intentionally excluded — some Horoshop themes
 * reuse it on catalog cards (home/category pages) which produced false
 * positives.
 */
export function isHoroshopProductPage(doc: Document = document): boolean {
  const ogType = doc
    .querySelector('meta[property="og:type"]')
    ?.getAttribute('content')
    ?.trim()
    .toLowerCase();

  if (ogType) {
    return ogType === 'product';
  }

  return doc.querySelector(HOROSHOP_PRODUCT_PAGE_SELECTOR) !== null;
}
