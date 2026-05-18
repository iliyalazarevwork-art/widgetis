import { describe, it, expect, beforeEach } from 'vitest';
import { detectPageType, matchesPage } from './page-type';

const CACHE_KEY = '__WIDGETIS_PAGE_TYPE__';

function makeWin(pathname: string): Window {
  return {
    location: { pathname },
  } as unknown as Window;
}

function makeDoc(headHtml = '', bodyHtml = ''): Document {
  const doc = document.implementation.createHTMLDocument('test');
  doc.head.innerHTML = headHtml;
  doc.body.innerHTML = bodyHtml;
  return doc;
}

beforeEach(() => {
  // Clear cache between tests
  delete (window as any)[CACHE_KEY];
});

// ---------------------------------------------------------------------------
// URL-based detection
// ---------------------------------------------------------------------------

describe('detectPageType — URL product', () => {
  it('detects /p123-abc as product', () => {
    expect(detectPageType(undefined, makeWin('/p123-abc'))).toBe('product');
  });

  it('detects /p999-foo-bar as product', () => {
    expect(detectPageType(undefined, makeWin('/p999-foo-bar'))).toBe('product');
  });

  it('detects /p42 (no slug) as product', () => {
    expect(detectPageType(undefined, makeWin('/p42'))).toBe('product');
  });
});

describe('detectPageType — URL category', () => {
  it('detects /g14001473-divany as category', () => {
    expect(detectPageType(undefined, makeWin('/g14001473-divany'))).toBe('category');
  });

  it('detects /g5 (no slug) as category', () => {
    expect(detectPageType(undefined, makeWin('/g5'))).toBe('category');
  });
});

describe('detectPageType — URL cart', () => {
  it('detects /cart as cart', () => {
    expect(detectPageType(undefined, makeWin('/cart'))).toBe('cart');
  });

  it('does NOT detect /cart-something as cart', () => {
    const result = detectPageType(makeDoc(), makeWin('/cart-something'));
    expect(result).not.toBe('cart');
  });

  it('does NOT detect /cart/checkout as cart', () => {
    const result = detectPageType(makeDoc(), makeWin('/cart/checkout'));
    // /cart/checkout matches checkout rule (has /checkout)
    expect(result).toBe('checkout');
  });
});

describe('detectPageType — URL checkout', () => {
  it('detects /checkout as checkout', () => {
    expect(detectPageType(undefined, makeWin('/checkout'))).toBe('checkout');
  });

  it('detects /order as checkout', () => {
    expect(detectPageType(undefined, makeWin('/order'))).toBe('checkout');
  });

  it('detects /checkout/payment as checkout', () => {
    expect(detectPageType(undefined, makeWin('/checkout/payment'))).toBe('checkout');
  });
});

describe('detectPageType — URL home', () => {
  it('detects / as home', () => {
    expect(detectPageType(undefined, makeWin('/'))).toBe('home');
  });
});

describe('detectPageType — URL other', () => {
  it('detects /about as other (falls back to DOM, empty DOM → other)', () => {
    expect(detectPageType(makeDoc(), makeWin('/about'))).toBe('other');
  });

  it('detects /blog/post-1 as other', () => {
    expect(detectPageType(makeDoc(), makeWin('/blog/post-1'))).toBe('other');
  });
});

// ---------------------------------------------------------------------------
// DOM fallback (when URL doesn't match a known pattern)
// ---------------------------------------------------------------------------

describe('detectPageType — DOM fallback', () => {
  it('returns product for og:type=product without matching URL', () => {
    const doc = makeDoc('<meta property="og:type" content="product">');
    const win = makeWin('/about');
    expect(detectPageType(doc, win)).toBe('product');
  });

  it('returns category for og:type=product.group', () => {
    const doc = makeDoc('<meta property="og:type" content="product.group">');
    const win = makeWin('/about');
    expect(detectPageType(doc, win)).toBe('category');
  });

  it('returns cart for body.cart class without matching URL', () => {
    const doc = makeDoc('', '');
    doc.body.className = 'cart';
    const win = makeWin('/some-other-path');
    expect(detectPageType(doc, win)).toBe('cart');
  });

  it('returns product for .product-header selector without matching URL', () => {
    const doc = makeDoc('', '<div class="product-header"></div>');
    const win = makeWin('/some-other-path');
    expect(detectPageType(doc, win)).toBe('product');
  });

  it('returns category for .catalog__products without matching URL', () => {
    const doc = makeDoc('', '<div class="catalog__products"></div>');
    const win = makeWin('/some-other-path');
    expect(detectPageType(doc, win)).toBe('category');
  });
});

// ---------------------------------------------------------------------------
// Caching
// ---------------------------------------------------------------------------

describe('detectPageType — caching', () => {
  it('returns cached value on second call even if URL would differ', () => {
    const win = makeWin('/p123-product') as any;
    const first = detectPageType(undefined, win);
    expect(first).toBe('product');
    expect(win[CACHE_KEY]).toBe('product');

    // Simulate a different URL — but cache should win
    win.location.pathname = '/';
    const second = detectPageType(undefined, win);
    expect(second).toBe('product');
  });

  it('clears and redetects when cache key is deleted between tests', () => {
    const win = makeWin('/p123-product') as any;
    detectPageType(undefined, win);
    expect(win[CACHE_KEY]).toBe('product');

    delete win[CACHE_KEY];
    win.location.pathname = '/';
    expect(detectPageType(undefined, win)).toBe('home');
  });
});

// ---------------------------------------------------------------------------
// matchesPage
// ---------------------------------------------------------------------------

describe('matchesPage', () => {
  it('returns true when current page is in the allowed list', () => {
    expect(matchesPage(['cart', 'checkout'], 'cart')).toBe(true);
  });

  it('returns true for "all" regardless of page', () => {
    expect(matchesPage('all', 'home')).toBe(true);
  });

  it('returns false when current page is NOT in the allowed list', () => {
    expect(matchesPage(['product'], 'cart')).toBe(false);
  });

  it('returns false for empty allowed array', () => {
    expect(matchesPage([], 'product')).toBe(false);
  });

  it('returns true when current is undefined and uses detectPageType fallback', () => {
    // With happy-dom the window has no location.pathname that matches, DOM empty → 'other'
    expect(matchesPage('all')).toBe(true);
  });
});
