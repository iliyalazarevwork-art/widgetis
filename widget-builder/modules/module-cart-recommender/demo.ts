/**
 * Demo entry for module-cart-recommender.
 *
 * In production, the widget calls /api/v1/widgets/cart-recommender/suggest to
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
import { Star, Crown, Gift, Flame, Sparkles, Percent, type IconNode } from 'lucide';

const LOG = '[widgetality] cart-recommender (demo):';
const SUGGEST_PATH = '/api/v1/widgets/cart-recommender/suggest';

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

function scrapeCartRelated(limit: number): ScrapedSticker[] {
  const items = document.querySelectorAll(
    '#cart .cart__related-goods .carousel__item .catalog-card--small, ' +
    '.j-cart-additional .carousel__item .catalog-card--small',
  );

  const results: ScrapedSticker[] = [];
  for (const item of items) {
    if (results.length >= limit) break;
    if (!(item instanceof HTMLElement)) continue;

    const img = item.querySelector('img') as HTMLImageElement | null;
    const titleEl = item.querySelector('.catalog-card__title');
    const priceEl = item.querySelector('.catalog-card__price');
    const link = item.querySelector('a[href]') as HTMLAnchorElement | null;

    const title = (titleEl?.textContent ?? '').trim();
    if (!title) continue;

    const image = img?.getAttribute('data-src') || img?.getAttribute('src') || '';
    const priceText = (priceEl?.textContent ?? '').trim();
    const priceNew = parsePrice(priceText);
    const url = link?.getAttribute('href') ?? '#';

    results.push({ url, image, title, priceNew, currency: detectCurrency(item) });
  }
  return results;
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

/** Build the store's home URL through the site-proxy (or direct origin). */
function buildStoreHomeUrl(): string {
  const segs = window.location.pathname.split('/').filter(Boolean);
  if (segs[0] === 'site' && segs.length >= 2) {
    return `${window.location.origin}/site/${segs[1]}/`;
  }
  return `${window.location.origin}/`;
}

/** Scrape product stickers from a parsed HTML document. */
function scrapeFromDoc(doc: Document, origin: string, limit: number): ScrapedSticker[] {
  const candidates = [
    '.productSticker',
    '.catalog-card--small',
    '.product-card',
    'article[data-product-id]',
  ];

  let nodes: Element[] = [];
  for (const sel of candidates) {
    nodes = Array.from(doc.querySelectorAll(sel));
    if (nodes.length > 0) break;
  }

  const results: ScrapedSticker[] = [];
  for (const node of nodes) {
    if (results.length >= limit) break;
    if (!(node instanceof Element)) continue;

    const link = node.querySelector('a[href]') as HTMLAnchorElement | null;
    const img = node.querySelector('img') as HTMLImageElement | null;
    const titleEl = node.querySelector(
      '.productSticker__name, .catalog-card__title, .product-card__name, [itemprop="name"], h2, h3',
    );
    const priceEl = node.querySelector(
      '.productSticker__price, .catalog-card__price, .product-card__price, [itemprop="price"]',
    );

    if (!link || !titleEl) continue;
    const href = link.getAttribute('href') ?? '';
    if (!href || href === '#') continue;

    const title = (titleEl.textContent ?? '').trim();
    if (!title) continue;

    const rawSrc = img?.getAttribute('src') ?? img?.getAttribute('data-src') ?? '';
    const image = rawSrc.startsWith('http') ? rawSrc : rawSrc ? `${origin}${rawSrc}` : '';

    const priceText = (priceEl?.textContent ?? '').trim();

    results.push({
      url: href,
      image,
      title,
      priceNew: parsePrice(priceText),
      currency: 'UAH',
    });
  }
  return results;
}

/** Fetch the store's home/catalog page and scrape products from it. */
async function fetchAndScrapeHome(maxItems: number): Promise<ScrapedSticker[]> {
  try {
    const homeUrl = buildStoreHomeUrl();
    console.log(LOG, 'fetching store home for product data:', homeUrl);
    const res = await fetch(homeUrl, { credentials: 'include' });
    if (!res.ok) return [];
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const found = scrapeFromDoc(doc, window.location.origin, maxItems);
    console.log(LOG, `scraped ${found.length} products from store home`);
    return found;
  } catch (err) {
    console.warn(LOG, 'fetchAndScrapeHome failed', err);
    return [];
  }
}

/**
 * Wait for product data to appear, polling the current page first.
 * If nothing is found within timeoutMs, fetch the store's home page as fallback.
 */
async function waitForStickers(maxItems: number, timeoutMs: number): Promise<ScrapedSticker[]> {
  const fromCurrentPage = await new Promise<ScrapedSticker[]>((resolve) => {
    const start = Date.now();
    const tick = (): void => {
      const cartFound = scrapeCartRelated(maxItems);
      if (cartFound.length > 0) { resolve(cartFound); return; }
      const found = scrapeStickers(maxItems);
      if (found.length > 0) { resolve(found); return; }
      if (Date.now() - start >= timeoutMs) { resolve([]); return; }
      window.setTimeout(tick, 200);
    };
    tick();
  });

  if (fromCurrentPage.length > 0) return fromCurrentPage;

  return fetchAndScrapeHome(maxItems);
}

const DEMO_GRADIENTS: Array<readonly [string, string]> = [
  ['#F4B58E', '#C77A5C'],
  ['#A78BFA', '#6D5BD0'],
  ['#5EEAD4', '#0D9488'],
  ['#FDA4AF', '#E11D48'],
  ['#FCD34D', '#D97706'],
  ['#93C5FD', '#2563EB'],
];

const DEMO_ICONS: IconNode[] = [Star, Crown, Gift, Flame, Sparkles, Percent];

function iconNodeToSvgChildren(icon: IconNode): string {
  return icon
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${String(v)}"`)
        .join(' ');
      return `<${tag} ${attrStr}/>`;
    })
    .join('');
}

function buildDemoIcon(gradStart: string, gradEnd: string, idx: number): string {
  const gid = `wgr${idx}`;
  const icon = DEMO_ICONS[idx % DEMO_ICONS.length]!;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
      `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0%" stop-color="${gradStart}"/>` +
        `<stop offset="100%" stop-color="${gradEnd}"/>` +
      `</linearGradient></defs>` +
      `<rect width="64" height="64" rx="12" fill="url(#${gid})"/>` +
      `<g transform="translate(12 12) scale(1.667)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">` +
        iconNodeToSvgChildren(icon) +
      `</g>` +
    `</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function buildPicsumFallback(maxItems: number): ScrapedSticker[] {
  const samples: Array<{ title: string; price: number }> = [
    { title: 'Стильний аксесуар', price: 499 },
    { title: 'Хіт продажу', price: 899 },
    { title: 'Подарунок до замовлення', price: 199 },
    { title: 'Топ-вибір клієнтів', price: 1299 },
    { title: 'Новинка тижня', price: 749 },
    { title: 'Зі знижкою', price: 599 },
  ];
  const count = Math.max(1, Math.min(maxItems, samples.length));
  return samples.slice(0, count).map((s, i) => {
    const [a, b] = DEMO_GRADIENTS[i % DEMO_GRADIENTS.length]!;
    return {
      url: `#wty-demo-${i + 1}`,
      image: buildDemoIcon(a, b, i),
      title: s.title,
      priceNew: s.price,
      currency: 'UAH',
    };
  });
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
      return waitForStickers(maxItems, 2500).then((stickers) => {
        let source = 'scraped';
        let final = stickers;
        if (final.length === 0) {
          final = buildPicsumFallback(maxItems);
          source = 'picsum-fallback';
        }
        const data = stickersToProducts(final);
        console.log(LOG, `shimmed suggest endpoint with ${data.length} ${source} products`);
        return new Response(JSON.stringify({ data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });
    }

    return original.call(window, input as RequestInfo, init);
  } as typeof window.fetch;
}

/**
 * Temporarily forces `matchMedia('(max-width: 768px)').matches` to `true`
 * so the production module — which gates itself on a mobile viewport — also
 * activates on desktop during the demo. The override is restored immediately
 * after the synchronous init returns; cleanup paths and runtime code are
 * unaffected.
 */
function withMobileForced<T>(fn: () => T): T {
  const original = window.matchMedia;
  if (typeof original !== 'function') return fn();

  window.matchMedia = function patchedMatchMedia(query: string): MediaQueryList {
    if (/max-width:\s*768px/i.test(query)) {
      return {
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      } as MediaQueryList;
    }
    return original.call(window, query);
  } as typeof window.matchMedia;

  try {
    return fn();
  } finally {
    window.matchMedia = original;
  }
}

export default function cartRecommenderDemo(
  rawConfig: CartRecommenderInput,
  rawI18n: Record<string, CartRecommenderI18n[string]>,
): (() => void) | void {
  console.log(LOG, 'init — patching fetch for suggest endpoint + forcing mobile gate');
  // maxItems comes from the validated config, but at this point we only have
  // raw input. The real number is enforced inside the production module via
  // schema parsing; we just need a generous upper bound for scraping.
  const maxItems = typeof rawConfig?.maxItems === 'number' ? rawConfig.maxItems : 4;
  patchFetchForSuggest(maxItems);
  return withMobileForced(() => cartRecommender(rawConfig, rawI18n));
}
