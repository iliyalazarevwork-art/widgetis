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

// Title and price selectors valid across all known Horoshop themes.
// `.catalogCard-title` / `.catalogCard-priceBox` cover the camelCase modern
// theme used by alp.com.ua and others; the rest cover legacy/dash variants.
const TITLE_SELECTORS =
  '.catalogCard-title, .productSticker__name, .product-card__name, .catalog-card__title, .name, [itemprop="name"], h2, h3';
const PRICE_SELECTORS =
  '.catalogCard-priceBox, .productSticker__price, .product-card__price, .catalog-card__price, .price, [itemprop="price"]';

/**
 * Pick the first selector whose matched nodes ARE actually product cards
 * (i.e. each contains a link AND a recognisable title element). This guards
 * against false positives — e.g. on alp.com.ua `.productSticker` is the
 * "Top sales / New / Video" badge wrapper INSIDE a card, not the card
 * itself; matching it returned 14 nodes with no link/title and the loop
 * silently produced 0 results.
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

/** Scrape the PDP's "Схожі товари / associated products" block. */
function scrapeAssociated(limit: number): ScrapedSticker[] {
  // The associated-products block on Horoshop PDPs:
  //   <div class="product__block product__block--associatedProducts_1 j-product-block">
  //     ...carousel of catalogCards...
  //   </div>
  // The numeric suffix (`_1`, `_2`, ...) varies — use a class*= match.
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

/**
 * Rewrite a relative URL extracted from the page to go through site-proxy.
 *
 * On localhost:3100 (site-proxy) the merchant's HTML is served at
 * /site/{domain}/... but the AJAX-loaded "associatedProducts" block returns
 * raw upstream HTML where image src/href is relative-root (e.g.
 * "/content/images/.../foo.jpg"). When we re-use that string elsewhere in
 * the page the browser resolves it against the page origin and drops the
 * /site/{domain}/ prefix → the proxy gets a request it can't route → 404.
 *
 * This helper detects the proxy prefix from window.location.pathname and
 * prepends it so relative URLs continue to work after they leave the
 * original DOM context.
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

// Attributes commonly used to hold the real image URL on Horoshop / WP /
// Magento / common lazy-load libs. Order = priority. We trust whichever
// attribute fires first with a non-placeholder value.
const IMG_URL_ATTRS = [
  'data-src',
  'data-original',
  'data-lazy-src',
  'data-lazy',
  'data-image',
  'data-bg',
  'src',
];

/**
 * Pull the image URL out of an `<img>` regardless of which lazy-load
 * scheme the merchant uses. Falls back to the live `img.src` property
 * (which the browser populates with the absolute URL after JS sets it,
 * even if no attribute is visible) and finally to the first URL of any
 * srcset variant. Skips `data:` placeholder URIs.
 */
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
  // img.src as a property returns the resolved absolute URL the browser
  // sees right now — works when JS set the src dynamically without our
  // attribute patches catching it.
  if (img.src && !img.src.startsWith('data:')) return img.src;
  return '';
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

function scrapeStickers(limit: number): ScrapedSticker[] {
  // Horoshop product cards live under varying class names depending on theme.
  // `.catalogCard` is the modern Horoshop card (alp.com.ua and similar).
  // `.productSticker` was historically the card class on older themes — kept
  // for compatibility but priority is below `.catalogCard` because on modern
  // themes `.productSticker` is a badge container INSIDE the card.
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
      // 1) PDP "Схожі товари" — most relevant; same-niche, same-vendor.
      const associated = scrapeAssociated(maxItems);
      if (associated.length > 0) { resolve(associated); return; }
      // 2) Cart "you might like" carousel — only present on cart page.
      const cartFound = scrapeCartRelated(maxItems);
      if (cartFound.length > 0) { resolve(cartFound); return; }
      // 3) Any product cards on the page — category page fallback.
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
        const data = stickersToProducts(stickers);
        console.log(LOG, `shimmed suggest endpoint with ${data.length} scraped products`);
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
