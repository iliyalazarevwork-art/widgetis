import { describe, it, expect, beforeEach } from 'vitest';
import { detectPageType, matchesPage } from './page-type';

const CACHE_KEY = '__WIDGETIS_PAGE_TYPE__';

function makeWin(): Window {
  return {} as unknown as Window;
}

function makeDoc(headHtml = '', bodyHtml = '', bodyClass = ''): Document {
  const doc = document.implementation.createHTMLDocument('test');
  doc.head.innerHTML = headHtml;
  doc.body.innerHTML = bodyHtml;
  if (bodyClass) doc.body.className = bodyClass;
  return doc;
}

beforeEach(() => {
  delete (window as any)[CACHE_KEY];
});

// ---------------------------------------------------------------------------
// og:type
// ---------------------------------------------------------------------------

describe('detectPageType — og:type', () => {
  it('returns product for og:type=product', () => {
    expect(
      detectPageType(makeDoc('<meta property="og:type" content="product">'), makeWin()),
    ).toBe('product');
  });

  it('returns category for og:type=product.group', () => {
    expect(
      detectPageType(makeDoc('<meta property="og:type" content="product.group">'), makeWin()),
    ).toBe('category');
  });
});

// ---------------------------------------------------------------------------
// DOM selectors — generic
// ---------------------------------------------------------------------------

describe('detectPageType — generic DOM', () => {
  it('returns cart for body.cart', () => {
    expect(detectPageType(makeDoc('', '', 'cart'), makeWin())).toBe('cart');
  });

  it('returns checkout for #checkout-form', () => {
    expect(detectPageType(makeDoc('', '<form id="checkout-form"></form>'), makeWin())).toBe(
      'checkout',
    );
  });

  it('returns category for .catalog__products', () => {
    expect(
      detectPageType(makeDoc('', '<div class="catalog__products"></div>'), makeWin()),
    ).toBe('category');
  });

  it('returns product for .product-header', () => {
    expect(detectPageType(makeDoc('', '<div class="product-header"></div>'), makeWin())).toBe(
      'product',
    );
  });

  it('returns home for body.home', () => {
    expect(detectPageType(makeDoc('', '', 'home'), makeWin())).toBe('home');
  });

  it('returns other when no signals match', () => {
    expect(detectPageType(makeDoc(), makeWin())).toBe('other');
  });
});

// ---------------------------------------------------------------------------
// DOM selectors — Horoshop
// ---------------------------------------------------------------------------

describe('detectPageType — Horoshop DOM', () => {
  it('returns home for body.main-page', () => {
    expect(detectPageType(makeDoc('', '', 'main-page'), makeWin())).toBe('home');
  });

  it('returns home for body.b-main', () => {
    expect(detectPageType(makeDoc('', '', 'b-main'), makeWin())).toBe('home');
  });

  it('returns product for body.b-product', () => {
    expect(detectPageType(makeDoc('', '', 'b-product'), makeWin())).toBe('product');
  });

  it('returns category for body.b-category', () => {
    expect(detectPageType(makeDoc('', '', 'b-category'), makeWin())).toBe('category');
  });

  it('returns cart for body.b-cart', () => {
    expect(detectPageType(makeDoc('', '', 'b-cart'), makeWin())).toBe('cart');
  });

  it('returns checkout for body.b-checkout', () => {
    expect(detectPageType(makeDoc('', '', 'b-checkout'), makeWin())).toBe('checkout');
  });
});

// ---------------------------------------------------------------------------
// Priority — og:type beats selectors; checkout beats cart, etc.
// ---------------------------------------------------------------------------

describe('detectPageType — priority', () => {
  it('og:type=product wins over body.home', () => {
    expect(
      detectPageType(
        makeDoc('<meta property="og:type" content="product">', '', 'home'),
        makeWin(),
      ),
    ).toBe('product');
  });

  it('checkout selector wins over cart selector', () => {
    expect(
      detectPageType(makeDoc('', '<form id="checkout-form"></form>', 'cart'), makeWin()),
    ).toBe('checkout');
  });
});

// ---------------------------------------------------------------------------
// Caching
// ---------------------------------------------------------------------------

describe('detectPageType — caching', () => {
  it('caches the first detected value on window', () => {
    const win = makeWin() as any;
    const doc = makeDoc('', '<div class="product-header"></div>');
    expect(detectPageType(doc, win)).toBe('product');
    expect(win[CACHE_KEY]).toBe('product');

    // Even if the DOM changes, cache wins.
    const doc2 = makeDoc();
    expect(detectPageType(doc2, win)).toBe('product');
  });

  it('redetects after the cache key is cleared', () => {
    const win = makeWin() as any;
    detectPageType(makeDoc('', '<div class="product-header"></div>'), win);
    expect(win[CACHE_KEY]).toBe('product');

    delete win[CACHE_KEY];
    expect(detectPageType(makeDoc('', '', 'cart'), win)).toBe('cart');
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
});
