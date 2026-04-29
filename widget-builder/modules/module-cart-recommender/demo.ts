/**
 * Demo entry for module-cart-recommender.
 *
 * In production, the widget calls /api/v1/widget/cart-recommender/suggest to
 * fetch personalized recommendations from the merchant's catalog. In demo we
 * have no catalog — so we shim window.fetch for that specific URL and return
 * products scraped from the live page DOM (Horoshop product stickers).
 *
 * The same default function from `index.ts` is then invoked, with identical
 * settings — only the data source differs.
 */
import type { CartRecommenderInput, CartRecommenderI18n } from './schema';
import type { Product } from './dom';
import cartRecommender from './index';

const LOG = '[widgetality] cart-recommender (demo):';
const SUGGEST_PATH = '/api/v1/widget/cart-recommender/suggest';

interface ScrapedSticker {
  url: string;
  image: string;
  title: string;
  priceNew: number;
  priceOld?: number;
  currency: string;
}

function parsePrice(text: string): number {
  // Horoshop stickers render prices like "1 234 ₴" or "1234.50 грн"
  const cleaned = text.replace(/\s+/g, '').replace(/[^\d.,]/g, '').replace(',', '.');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function detectCurrency(scope: HTMLElement): string {
  const text = scope.textContent ?? '';
  if (text.includes('₴') || /грн/i.test(text)) return 'UAH';
  if (text.includes('€')) return 'EUR';
  if (text.includes('$')) return 'USD';
  if (text.includes('zł')) return 'PLN';
  return 'UAH';
}

function scrapeStickers(limit: number): ScrapedSticker[] {
  // Horoshop product cards live under .productSticker (mobile + desktop).
  // Other themes may use generic .product, .product-card — try them as fallback.
  const candidates = [
    '.productSticker',
    '.products-list .productSticker',
    '.product-card',
    '.product',
    'article[data-product-id]',
    '.j-product-container',
  ];

  let nodes: Element[] = [];
  for (const sel of candidates) {
    nodes = Array.from(document.querySelectorAll(sel));
    if (nodes.length > 0) break;
  }

  // Filter out the current product page's own sticker (own product is not a recommendation)
  const ownAlias = window.location.pathname.split('/').filter(Boolean).pop();

  const results: ScrapedSticker[] = [];

  for (const node of nodes) {
    if (results.length >= limit) break;
    if (!(node instanceof HTMLElement)) continue;

    const link = node.querySelector('a[href]');
    const img = node.querySelector('img') as HTMLImageElement | null;
    const titleEl = node.querySelector(
      '.productSticker__name, .product-card__name, .name, h2, h3, [itemprop="name"]',
    );
    const priceEl = node.querySelector(
      '.productSticker__price, .product-card__price, .price, [itemprop="price"]',
    );

    if (!link || !titleEl) continue;
    const url = (link as HTMLAnchorElement).getAttribute('href') ?? '';
    if (!url || url === '#') continue;
    if (ownAlias && url.includes(ownAlias)) continue;

    const title = (titleEl.textContent ?? '').trim();
    if (!title) continue;

    const image = img?.getAttribute('src') ?? img?.getAttribute('data-src') ?? '';
    const priceText = (priceEl?.textContent ?? '').trim();
    const priceNew = parsePrice(priceText);

    results.push({
      url,
      image,
      title,
      priceNew,
      currency: detectCurrency(node),
    });
  }

  return results;
}

function stickersToProducts(stickers: ScrapedSticker[]): Product[] {
  return stickers.map((s, i) => ({
    id: 1_000_000 + i,
    sku: `demo-${i + 1}`,
    horoshop_id: null,
    url: s.url,
    image: s.image,
    title: { ua: s.title, en: s.title, ru: s.title },
    price_new: s.priceNew,
    price_old: s.priceOld,
    currency: s.currency,
    source: 'demo_scrape',
  }));
}

function patchFetchForSuggest(maxItems: number): void {
  const original = window.fetch;
  if (!original) return;

  window.fetch = function patched(input: RequestInfo | URL, init?: RequestInit) {
    let url = '';
    if (typeof input === 'string') url = input;
    else if (input instanceof URL) url = input.toString();
    else if (input && typeof input === 'object' && 'url' in input) url = (input as Request).url;

    if (url.includes(SUGGEST_PATH)) {
      const scraped = scrapeStickers(maxItems);
      const data = stickersToProducts(scraped);
      console.log(LOG, 'shimmed suggest endpoint with', data.length, 'scraped products');
      return Promise.resolve(
        new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }

    return original.call(window, input as RequestInfo, init);
  } as typeof window.fetch;
}

export default function cartRecommenderDemo(
  rawConfig: CartRecommenderInput,
  rawI18n: Record<string, CartRecommenderI18n[string]>,
): (() => void) | void {
  console.log(LOG, 'init — patching fetch for suggest endpoint');
  // maxItems comes from the validated config, but at this point we only have
  // raw input. The real number is enforced inside the production module via
  // schema parsing; we just need a generous upper bound for scraping.
  const maxItems = typeof rawConfig?.maxItems === 'number' ? rawConfig.maxItems : 4;
  patchFetchForSuggest(maxItems);
  return cartRecommender(rawConfig, rawI18n);
}
