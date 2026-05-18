export type PageType = 'home' | 'category' | 'product' | 'cart' | 'checkout' | 'other';

const CACHE_KEY = '__WIDGETIS_PAGE_TYPE__';

/**
 * Horoshop sets `og:type` deterministically:
 *   home      → "website"
 *   category  → "product.group"
 *   product   → "product"
 *   content   → "article" (about, contacts, blog post, etc.)
 *
 * This is the most reliable signal — verified against 15 production stores
 * (see __fixtures__/horoshop). DOM selectors below cover cart/checkout where
 * og:type is not distinctive, and act as a fallback for non-Horoshop shops.
 */
const OG_TYPE_MAP: Record<string, PageType> = {
  product: 'product',
  'product.group': 'category',
  website: 'home',
  article: 'other',
};

const CART_SELECTORS = [
  'body.cart',
  '.cart-page',
  '#cart-page',
  '.j-cart-page',
  // Horoshop
  'body.b-cart',
].join(',');

const CHECKOUT_SELECTORS = [
  'body.checkout',
  '.checkout-page',
  '#checkout-form',
  '[data-checkout]',
  // Horoshop
  'body.b-checkout',
  '.checkout__form',
].join(',');

const CATEGORY_SELECTORS = [
  '.j-products-list',
  '.catalog__products',
  '.category__products',
  // Horoshop
  'body.b-category',
].join(',');

const PRODUCT_SELECTORS = [
  '.product-header',
  '.product__section--header',
  '.j-product-description',
  '#productPage',
  '.product__buy-button',
  // Horoshop
  'body.b-product',
].join(',');

const HOME_SELECTORS = [
  'body.home',
  '.home-page',
  'body[data-page="home"]',
  // Horoshop
  'body.main-page',
  'body.b-main',
  '.j-banner-adaptive',
  '.banners-group',
  '.main-banners',
].join(',');

function readOgType(doc: Document): string | null {
  const raw = doc
    .querySelector('meta[property="og:type"]')
    ?.getAttribute('content')
    ?.trim()
    .toLowerCase();
  return raw || null;
}

function detectFromDom(doc: Document): PageType {
  // Cart/checkout are not distinguished by og:type — check structural signals
  // before falling back to og:type, so that a customer who visits /cart on a
  // Horoshop store (where og:type="website" propagates from layout) is still
  // routed to 'cart'.
  if (doc.querySelector(CHECKOUT_SELECTORS)) return 'checkout';
  if (doc.querySelector(CART_SELECTORS)) return 'cart';

  const og = readOgType(doc);
  if (og && og in OG_TYPE_MAP) return OG_TYPE_MAP[og];

  if (doc.querySelector(CATEGORY_SELECTORS)) return 'category';
  if (doc.querySelector(PRODUCT_SELECTORS)) return 'product';
  if (doc.querySelector(HOME_SELECTORS)) return 'home';

  return 'other';
}

export function detectPageType(doc?: Document, win?: Window): PageType {
  const _win = win ?? (typeof window !== 'undefined' ? window : undefined);
  const _doc = doc ?? (typeof document !== 'undefined' ? document : undefined);

  if (_win && ((_win as any)[CACHE_KEY] as PageType | undefined)) {
    return (_win as any)[CACHE_KEY] as PageType;
  }

  const result: PageType = _doc ? detectFromDom(_doc) : 'other';

  if (_win) {
    (_win as any)[CACHE_KEY] = result;
  }

  return result;
}

export function matchesPage(allowed: PageType[] | 'all', current?: PageType): boolean {
  if (allowed === 'all') return true;
  const pageType = current ?? detectPageType();
  return allowed.includes(pageType);
}
