/**
 * DOM/page scraping fallback for module-cart-recommender.
 *
 * Used in two places:
 *   1. demo.ts — shims window.fetch for the suggest endpoint and returns
 *      products scraped from the live page (no backend catalog available).
 *   2. index.ts — when the production API returns an empty `data: []`
 *      (no relations for the source product, or catalog not synced),
 *      we try to find SOMETHING relevant on the page so the popup is not
 *      silently empty.
 *
 * Scraping priority (matches demo behaviour):
 *   1. PDP "Схожі товари" (associated products block) — same-niche.
 *   2. Cart "you might like" carousel — only on cart pages.
 *   3. Any product cards on the current page — category-page fallback.
 *   4. Fetch the store's home page and scrape product cards from it.
 *
 * The returned Product objects intentionally do NOT carry a `horoshop_id`
 * — `index.ts` resolves it on add-to-cart via fetchHoroshopProductId().
 */
import type { Product } from './dom';

const LOG = '[widgetality] cart-recommender (scrape):';

export interface ScrapedSticker {
  url: string;
  image: string;
  title: string;
  priceNew: number;
  priceOld?: number;
  currency: string;
}

// Title and price selectors valid across all known Horoshop themes.
// `.catalogCard-title` / `.catalogCard-priceBox` cover the camelCase modern
// theme used by alp.com.ua and others; the rest cover legacy/dash variants.
const TITLE_SELECTORS =
  '.catalogCard-title, .productSticker__name, .product-card__name, .catalog-card__title, .name, [itemprop="name"], h2, h3';
const PRICE_SELECTORS =
  '.catalogCard-priceBox, .productSticker__price, .product-card__price, .catalog-card__price, .price, [itemprop="price"]';

// Attributes commonly used to hold the real image URL on Horoshop / WP /
// Magento / common lazy-load libs. Order = priority.
const IMG_URL_ATTRS = [
  'data-src',
  'data-original',
  'data-lazy-src',
  'data-lazy',
  'data-image',
  'data-bg',
  'src',
];

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

/**
 * Rewrite a relative URL to go through the site-proxy when the page is
 * served via /site/{domain}/... On production pages (real merchant origin)
 * this is a no-op because URLs aren't pre-rooted to the proxy.
 */
function rewriteProxiedUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('//')) {
    return rawUrl;
  }
  const segs = window.location.pathname.split('/').filter(Boolean);
  if (segs[0] !== 'site' || segs.length < 2) return rawUrl;
  const proxyPrefix = `/site/${segs[1]}`;
  if (rawUrl.startsWith(`${proxyPrefix}/`) || rawUrl === proxyPrefix) return rawUrl;
  if (rawUrl.startsWith('/')) return `${proxyPrefix}${rawUrl}`;
  return `${proxyPrefix}/${rawUrl}`;
}

function pickImgUrl(img: HTMLImageElement | null): string {
  if (!img) return '';
  for (const attr of IMG_URL_ATTRS) {
    const v = img.getAttribute(attr);
    if (v && v.trim() && !v.startsWith('data:')) return v.trim();
  }
  for (const attr of ['srcset', 'data-srcset']) {
    const v = img.getAttribute(attr);
    if (v && v.trim()) {
      const first = v.split(',')[0]?.trim().split(/\s+/)[0];
      if (first && !first.startsWith('data:')) return first;
    }
  }
  if (img.src && !img.src.startsWith('data:')) return img.src;
  return '';
}

/**
 * Pick the first selector whose matched nodes ARE actually product cards
 * (i.e. each contains a link AND a recognisable title). Guards against
 * false positives — e.g. `.productSticker` on alp.com.ua matches an
 * internal badge wrapper, not a card.
 */
function pickValidNodes(root: ParentNode, candidates: readonly string[]): Element[] {
  for (const sel of candidates) {
    const matched = Array.from(root.querySelectorAll(sel));
    if (matched.length === 0) continue;
    const valid = matched.filter((n) => {
      const link = n.querySelector('a[href]');
      const title = n.querySelector(TITLE_SELECTORS);
      return Boolean(link && title);
    });
    if (valid.length > 0) return valid;
  }
  return [];
}

function extractSticker(node: Element, ownAlias: string | undefined): ScrapedSticker | null {
  if (!(node instanceof HTMLElement)) return null;
  const link = node.querySelector('a[href]') as HTMLAnchorElement | null;
  const img = node.querySelector('img') as HTMLImageElement | null;
  const titleEl = node.querySelector(TITLE_SELECTORS);
  const priceEl = node.querySelector(PRICE_SELECTORS);

  if (!link || !titleEl) return null;
  const rawUrl = link.getAttribute('href') ?? '';
  if (!rawUrl || rawUrl === '#') return null;
  if (ownAlias && rawUrl.includes(ownAlias)) return null;

  const title = (titleEl.textContent ?? '').trim();
  if (!title) return null;

  const rawImg = pickImgUrl(img);
  const priceText = (priceEl?.textContent ?? '').trim();

  return {
    url: rewriteProxiedUrl(rawUrl),
    image: rewriteProxiedUrl(rawImg),
    title,
    priceNew: parsePrice(priceText),
    currency: detectCurrency(node),
  };
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

    const image = pickImgUrl(img);
    const priceText = (priceEl?.textContent ?? '').trim();
    const priceNew = parsePrice(priceText);
    const url = link?.getAttribute('href') ?? '#';

    results.push({
      url: rewriteProxiedUrl(url),
      image: rewriteProxiedUrl(image),
      title,
      priceNew,
      currency: detectCurrency(item),
    });
  }
  return results;
}

/** Scrape the PDP's "Схожі товари / associated products" block. */
function scrapeAssociated(limit: number): ScrapedSticker[] {
  const blocks = document.querySelectorAll(
    '[class*="product__block--associatedProducts"], ' +
    '[data-view-block*="associatedProducts"], ' +
    '[class*="associated-products"], ' +
    '.j-similar-products',
  );
  if (blocks.length === 0) return [];

  const ownAlias = window.location.pathname.split('/').filter(Boolean).pop();
  const results: ScrapedSticker[] = [];

  for (const block of blocks) {
    if (results.length >= limit) break;
    const cards = pickValidNodes(block, [
      '.catalogCard',
      '.productSticker',
      '.product-card',
      '.catalog-card--small',
    ]);
    for (const card of cards) {
      if (results.length >= limit) break;
      const sticker = extractSticker(card, ownAlias);
      if (sticker) results.push(sticker);
    }
  }
  return results;
}

/** Scrape any product cards on the current page (category fallback). */
function scrapeStickers(limit: number): ScrapedSticker[] {
  const candidates = [
    '.catalogCard',
    '.products-list .productSticker',
    '.product-card',
    '.catalog-card--small',
    'article[data-product-id]',
    '.j-product-container',
    '.productSticker',
    '.product',
  ];

  const nodes = pickValidNodes(document, candidates);
  const ownAlias = window.location.pathname.split('/').filter(Boolean).pop();

  const results: ScrapedSticker[] = [];
  for (const node of nodes) {
    if (results.length >= limit) break;
    const sticker = extractSticker(node, ownAlias);
    if (sticker) results.push(sticker);
  }
  return results;
}

/** Build the store's home URL through the site-proxy (or direct origin). */
function buildStoreHomeUrl(): string {
  const segs = window.location.pathname.split('/').filter(Boolean);
  if (segs[0] === 'site' && segs.length >= 2) {
    return `${window.location.origin}/site/${segs[1]}/`;
  }
  return `${window.location.origin}/`;
}

function scrapeFromDoc(doc: Document, origin: string, limit: number): ScrapedSticker[] {
  const candidates = [
    '.catalogCard',
    '.catalog-card--small',
    '.product-card',
    'article[data-product-id]',
    '.productSticker',
  ];
  const nodes = pickValidNodes(doc, candidates);

  const results: ScrapedSticker[] = [];
  for (const node of nodes) {
    if (results.length >= limit) break;

    const link = node.querySelector('a[href]') as HTMLAnchorElement | null;
    const img = node.querySelector('img') as HTMLImageElement | null;
    const titleEl = node.querySelector(TITLE_SELECTORS);
    const priceEl = node.querySelector(PRICE_SELECTORS);

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

async function fetchAndScrapeHome(maxItems: number): Promise<ScrapedSticker[]> {
  try {
    const homeUrl = buildStoreHomeUrl();
    console.log(LOG, 'fetching store home for product data:', homeUrl);
    const res = await fetch(homeUrl, { credentials: 'include' });
    if (!res.ok) return [];
    if (typeof res.text !== 'function') return [];
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

export function stickersToProducts(stickers: ScrapedSticker[]): Product[] {
  return stickers.map((s, i) => ({
    id: 1_000_000 + i,
    sku: `scraped-${i + 1}`,
    horoshop_id: null,
    url: s.url,
    image: s.image,
    title: { ua: s.title, en: s.title, ru: s.title },
    price_new: s.priceNew,
    price_old: s.priceOld,
    currency: s.currency,
    source: 'scrape_fallback',
  }));
}

export interface ScrapeOptions {
  /**
   * If > 0, the in-page scrape is retried every 200ms up to this many
   * milliseconds before falling back to fetching the store home page.
   * Useful when cards lazy-load after init. Default: 0 (single pass).
   */
  pollTimeoutMs?: number;
}

/**
 * Run the full scrape pipeline and return up to `maxItems` products.
 * Order: PDP "associated" → cart-related → any cards on page → home-page fetch.
 * Returns [] if nothing was found anywhere.
 */
export async function scrapeFallbackStickers(
  maxItems: number,
  opts: ScrapeOptions = {},
): Promise<ScrapedSticker[]> {
  const pollTimeoutMs = opts.pollTimeoutMs ?? 0;

  const fromCurrentPage = await new Promise<ScrapedSticker[]>((resolve) => {
    const start = Date.now();
    const tick = (): void => {
      const associated = scrapeAssociated(maxItems);
      if (associated.length > 0) { resolve(associated); return; }
      const cartFound = scrapeCartRelated(maxItems);
      if (cartFound.length > 0) { resolve(cartFound); return; }
      const found = scrapeStickers(maxItems);
      if (found.length > 0) { resolve(found); return; }
      if (Date.now() - start >= pollTimeoutMs) { resolve([]); return; }
      window.setTimeout(tick, 200);
    };
    tick();
  });

  if (fromCurrentPage.length > 0) return fromCurrentPage;

  return fetchAndScrapeHome(maxItems);
}

/**
 * Convenience wrapper: scrape + convert to Product[].
 */
export async function scrapeFallbackProducts(
  maxItems: number,
  opts: ScrapeOptions = {},
): Promise<Product[]> {
  const stickers = await scrapeFallbackStickers(maxItems, opts);
  return stickersToProducts(stickers);
}
