/**
 * module-cart-recommender — vitest unit tests
 *
 * Behavior under test:
 *   - mobile-only guard (matchMedia max-width:768px)
 *   - prefetch on init: GET /api/v1/widget/cart-recommender/suggest?alias=...
 *   - patches window.AjaxCart.getInstance().appendProduct
 *   - on cart add → shows popup with prefetched products
 *   - clicking a popup card calls appendProduct with the correct Horoshop signature:
 *     ({type:'product', quantity:1, id:<horoshop_id>}, [])
 *   - falls back to HTML scrape if API didn't return horoshop_id
 *   - cleanup tears down popup, listeners, prefetch abort
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
}));

import cartRecommender from './index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  enabled: true,
  apiBaseUrl: 'http://localhost:9001',
  mountSelector: '.j-cart-additional .carousel__wrapper',
  maxItems: 4,
};

const DEFAULT_I18N = {
  ua: { buttonAddToCart: 'До кошика', heading: 'Часто беруть разом' },
  en: { buttonAddToCart: 'Add to cart', heading: 'Often bought together' },
};

const SAMPLE_PRODUCTS = [
  {
    id: 101,
    sku: 'SKU-101',
    horoshop_id: 1514,
    url: '/product-a/',
    image: '/img/a.jpg',
    title: { ua: 'Товар А', en: 'Product A' },
    price_new: 1000,
    currency: 'грн',
  },
  {
    id: 102,
    sku: 'SKU-102',
    horoshop_id: 2487,
    url: '/product-b/',
    image: '/img/b.jpg',
    title: { ua: 'Товар Б', en: 'Product B' },
    price_new: 2000,
    price_old: 2500,
    currency: 'грн',
  },
];

interface AppendProductCall {
  product: { type: string; quantity: number; id: number };
  related: unknown[];
}

function setupAjaxCart(): {
  appendCalls: AppendProductCall[];
  reloadHtmlCalls: { count: number };
  triggerAdd: () => void;
} {
  const appendCalls: AppendProductCall[] = [];
  const reloadHtmlCalls = { count: 0 };
  // Real Horoshop signature: (product, related) — two args, no third "openCart" parameter.
  const appendProduct = (
    product: { type: string; quantity: number; id: number },
    related: unknown[],
  ): void => {
    appendCalls.push({ product, related });
  };
  const reloadHtml = (): void => {
    reloadHtmlCalls.count++;
  };

  const instance = { appendProduct, reloadHtml };
  // Cast to global setup; TS sees this as window-level assignment.
  (window as unknown as { AjaxCart: { getInstance: () => typeof instance } }).AjaxCart = {
    getInstance: () => instance,
  };

  // Helper: simulate the user adding a product → calls the (now-patched) appendProduct.
  const triggerAdd = (): void => {
    const ac = (window as unknown as { AjaxCart: { getInstance: () => typeof instance } })
      .AjaxCart.getInstance();
    ac.appendProduct({ type: 'product', quantity: 1, id: 999 }, []);
  };

  return { appendCalls, reloadHtmlCalls, triggerAdd };
}

function clearAjaxCart(): void {
  delete (window as unknown as { AjaxCart?: unknown }).AjaxCart;
}

function mockFetchProducts(products = SAMPLE_PRODUCTS): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      // API request → JSON
      if (url.includes('/api/v1/widget/cart-recommender/suggest')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: products, meta: { live: true } }),
        });
      }
      // HTML scrape fallback (used when product has no horoshop_id)
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<button id="j-buy-button-counter-9999" />'),
      });
    }),
  );
}

function mockFetchEmpty(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: [], meta: {} }),
    }),
  );
}

function mockFetchError(): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
}

function setPathname(pathname: string): void {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, pathname, origin: 'http://example.com' },
    writable: true,
    configurable: true,
  });
}

function setMobileViewport(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function setDesktopViewport(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

async function flush(ms = 20): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('cartRecommender', () => {
  beforeEach(() => {
    setMobileViewport();
    document.body.innerHTML = '<main></main>';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
    clearAjaxCart();
  });

  // ── guards ────────────────────────────────────────────────────────────────

  it('does not call fetch when disabled', async () => {
    setPathname('/some-product/');
    mockFetchProducts();
    cartRecommender({ ...DEFAULT_CONFIG, enabled: false }, DEFAULT_I18N);
    await flush();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('does not call fetch on desktop viewport', async () => {
    setPathname('/some-product/');
    setDesktopViewport();
    mockFetchProducts();
    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);
    await flush();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('does not call fetch when pathname has no alias (root /)', async () => {
    setPathname('/');
    mockFetchProducts();
    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);
    await flush();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  // ── prefetch ──────────────────────────────────────────────────────────────

  it('prefetches suggest endpoint with alias from production pathname', async () => {
    setPathname('/postilna-bilizna-satin-z-ryushami/');
    mockFetchProducts();
    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        'http://localhost:9001/api/v1/widget/cart-recommender/suggest?alias=postilna-bilizna-satin-z-ryushami',
        expect.objectContaining({ credentials: 'omit' }),
      );
    });
  });

  it('prefetches suggest endpoint with alias from site-proxy pathname', async () => {
    setPathname('/site/benihome.com.ua/postilna-bilizna-satin-z-ryushami/');
    mockFetchProducts();
    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        'http://localhost:9001/api/v1/widget/cart-recommender/suggest?alias=postilna-bilizna-satin-z-ryushami',
        expect.objectContaining({ credentials: 'omit' }),
      );
    });
  });

  // ── popup behavior ────────────────────────────────────────────────────────

  it('does not show popup until AjaxCart.appendProduct is invoked', async () => {
    setPathname('/some-product/');
    mockFetchProducts();
    setupAjaxCart();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);
    await flush();

    expect(document.querySelector('.wgts-popup')).toBeNull();
  });

  it('shows popup with N cards when AjaxCart.appendProduct is invoked', async () => {
    setPathname('/some-product/');
    mockFetchProducts();
    const { triggerAdd } = setupAjaxCart();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);
    // Wait for prefetch to settle and the AjaxCart patch to be applied.
    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    await flush();

    triggerAdd();

    await vi.waitFor(() => {
      expect(document.querySelector('.wgts-popup')).not.toBeNull();
      const cards = document.querySelectorAll('.wgts-popup__row');
      expect(cards.length).toBe(SAMPLE_PRODUCTS.length);
    });
  });

  it('does not show popup when API returned empty data', async () => {
    setPathname('/some-product/');
    mockFetchEmpty();
    const { triggerAdd } = setupAjaxCart();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);
    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    await flush();

    triggerAdd();
    await flush();

    expect(document.querySelector('.wgts-popup')).toBeNull();
  });

  it('does not show popup when prefetch failed', async () => {
    setPathname('/some-product/');
    mockFetchError();
    const { triggerAdd } = setupAjaxCart();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);
    await flush();

    triggerAdd();
    await flush();

    expect(document.querySelector('.wgts-popup')).toBeNull();
  });

  // ── add-to-cart from popup (regression: correct Horoshop signature) ───────

  it('calls AjaxCart.appendProduct with correct Horoshop signature when "+" clicked', async () => {
    setPathname('/some-product/');
    mockFetchProducts();
    const { appendCalls, reloadHtmlCalls, triggerAdd } = setupAjaxCart();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);
    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    await flush();

    triggerAdd();
    await vi.waitFor(() => {
      expect(document.querySelector('.wgts-popup__add')).not.toBeNull();
    });

    // Track only calls made AFTER the popup is shown — the triggerAdd above
    // also appended a product through the patched method.
    const callsBefore = appendCalls.length;
    const reloadCallsBefore = reloadHtmlCalls.count;

    const addBtn = document.querySelectorAll<HTMLButtonElement>('.wgts-popup__add')[0];
    addBtn.click();

    await vi.waitFor(() => {
      expect(appendCalls.length).toBeGreaterThan(callsBefore);
    });

    const lastCall = appendCalls[appendCalls.length - 1];
    expect(lastCall.product).toEqual({
      type: 'product',
      quantity: 1,
      id: SAMPLE_PRODUCTS[0].horoshop_id,
    });
    expect(lastCall.related).toEqual([]);

    // Cart UI must be redrawn — without this Horoshop's drawer doesn't show
    // the new item until a page reload.
    expect(reloadHtmlCalls.count).toBeGreaterThan(reloadCallsBefore);
  });

  it('falls back to HTML scrape when product has no horoshop_id', async () => {
    setPathname('/some-product/');
    const productsNoId = [
      {
        ...SAMPLE_PRODUCTS[0],
        horoshop_id: null,
      },
    ];
    mockFetchProducts(productsNoId);
    const { appendCalls, triggerAdd } = setupAjaxCart();

    cartRecommender({ ...DEFAULT_CONFIG, maxItems: 1 }, DEFAULT_I18N);
    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    await flush();

    triggerAdd();
    await vi.waitFor(() => {
      expect(document.querySelector('.wgts-popup__add')).not.toBeNull();
    });
    const callsBefore = appendCalls.length;

    const addBtn = document.querySelector<HTMLButtonElement>('.wgts-popup__add')!;
    addBtn.click();

    await vi.waitFor(() => {
      expect(appendCalls.length).toBeGreaterThan(callsBefore);
    });

    // Scrape fallback returns id=9999 from the mocked HTML.
    const lastCall = appendCalls[appendCalls.length - 1];
    expect(lastCall.product).toEqual({ type: 'product', quantity: 1, id: 9999 });
    expect(lastCall.related).toEqual([]);
  });

  // ── popup close ───────────────────────────────────────────────────────────

  it('removes popup when close button is clicked', async () => {
    setPathname('/some-product/');
    mockFetchProducts();
    const { triggerAdd } = setupAjaxCart();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);
    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    await flush();
    triggerAdd();

    await vi.waitFor(() => {
      expect(document.querySelector('.wgts-popup__close')).not.toBeNull();
    });

    const closeBtn = document.querySelector<HTMLButtonElement>('.wgts-popup__close')!;
    closeBtn.click();

    await vi.waitFor(
      () => {
        expect(document.querySelector('.wgts-popup-root')).toBeNull();
      },
      { timeout: 1000 },
    );
  });

  // ── cleanup ───────────────────────────────────────────────────────────────

  it('cleanup is callable and does not throw', async () => {
    setPathname('/some-product/');
    mockFetchProducts();
    setupAjaxCart();

    const cleanup = cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);
    await flush();
    expect(() => cleanup?.()).not.toThrow();
  });
});
