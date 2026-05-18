export type PageType = 'home' | 'category' | 'product' | 'cart' | 'checkout' | 'other';

const CACHE_KEY = '__WIDGETIS_PAGE_TYPE__';

const CART_SELECTORS = ['body.cart', '.cart-page', '#cart-page', '.j-cart-page'].join(',');
const CHECKOUT_SELECTORS = ['body.checkout', '.checkout-page', '#checkout-form', '[data-checkout]'].join(',');
const HOME_SELECTORS = ['body.home', '.home-page', 'body[data-page="home"]'].join(',');
const CATEGORY_SELECTORS = ['.j-products-list', '.catalog__products', '.category__products'].join(',');
const PRODUCT_SELECTORS = [
  '.product-header',
  '.product__section--header',
  '.j-product-description',
  '#productPage',
  '.product__buy-button',
].join(',');

function detectFromUrl(pathname: string): PageType | null {
  // checkout
  if (/\/checkout(\/|$)/.test(pathname) || /\/order(\/|$)/.test(pathname)) return 'checkout';

  // cart — but NOT /cart-something or /cart/checkout
  if (/^\/cart$/.test(pathname)) return 'cart';

  // product: /p123-slug or /p123
  if (/^\/p\d+(-|$)/.test(pathname)) return 'product';

  // category: /g123-slug or /g123
  if (/^\/g\d+(-|$)/.test(pathname)) return 'category';

  // home
  if (pathname === '/') return 'home';

  return null;
}

function detectFromDom(doc: Document): PageType {
  const ogType = doc
    .querySelector('meta[property="og:type"]')
    ?.getAttribute('content')
    ?.trim()
    .toLowerCase();

  if (ogType === 'product') return 'product';
  if (ogType === 'product.group') return 'category';

  if (doc.querySelector(CHECKOUT_SELECTORS)) return 'checkout';
  if (doc.querySelector(CART_SELECTORS)) return 'cart';
  if (doc.querySelector(HOME_SELECTORS)) return 'home';
  if (doc.querySelector(CATEGORY_SELECTORS)) return 'category';
  if (doc.querySelector(PRODUCT_SELECTORS)) return 'product';

  return 'other';
}

export function detectPageType(doc?: Document, win?: Window): PageType {
  const _win = win ?? (typeof window !== 'undefined' ? window : undefined);
  const _doc = doc ?? (typeof document !== 'undefined' ? document : undefined);

  // Return cached value if available
  if (_win && ((_win as any)[CACHE_KEY] as PageType | undefined)) {
    return (_win as any)[CACHE_KEY] as PageType;
  }

  let result: PageType = 'other';

  // Step 1: URL-based detection
  if (_win?.location?.pathname) {
    const fromUrl = detectFromUrl(_win.location.pathname);
    if (fromUrl !== null) {
      result = fromUrl;
    } else if (_doc) {
      // Step 2: DOM fallback only when URL didn't match
      result = detectFromDom(_doc);
    }
  } else if (_doc) {
    // No window.location — use DOM only
    result = detectFromDom(_doc);
  }

  // Step 3: Cache result
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
