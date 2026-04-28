/**
 * module-cart-recommender — vitest unit tests
 *
 * Tests the new API-driven flow:
 *   - alias extraction from various URL patterns
 *   - fetch called with correct URL
 *   - cards rendered on successful response
 *   - no render on empty data
 *   - no render on fetch failure / abort
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
  mountSelector: 'main',
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
    url: '/product-a/',
    image: '/img/a.jpg',
    title: { ua: 'Товар А', en: 'Product A' },
    price_new: 1000,
    currency: 'грн',
  },
  {
    id: 102,
    sku: 'SKU-102',
    url: '/product-b/',
    image: '/img/b.jpg',
    title: { ua: 'Товар Б', en: 'Product B' },
    price_new: 2000,
    price_old: 2500,
    currency: 'грн',
  },
];

function mockFetchSuccess(products = SAMPLE_PRODUCTS): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: products, meta: { live: true } }),
  }));
}

function mockFetchEmpty(): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: [], meta: {} }),
  }));
}

function mockFetchError(): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
}

function mockFetchAbort(): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
    Object.assign(new Error('AbortError'), { name: 'AbortError' }),
  ));
}

function setPathname(pathname: string): void {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, pathname },
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
  });

  // ── alias extraction ──────────────────────────────────────────────────────

  it('calls fetch with correct URL on a production pathname', async () => {
    setPathname('/postilna-bilizna-satin-z-ryushamy/');
    mockFetchSuccess();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        'http://localhost:9001/api/v1/widget/cart-recommender/suggest?alias=postilna-bilizna-satin-z-ryushamy',
        expect.objectContaining({ credentials: 'omit' }),
      );
    });
  });

  it('calls fetch with correct URL on a site-proxy pathname', async () => {
    setPathname('/site/benihome.com.ua/postilna-bilizna-satin-z-ryushamy/');
    mockFetchSuccess();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await vi.waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        'http://localhost:9001/api/v1/widget/cart-recommender/suggest?alias=postilna-bilizna-satin-z-ryushamy',
        expect.objectContaining({ credentials: 'omit' }),
      );
    });
  });

  it('does not call fetch when pathname has no alias (root /)', async () => {
    setPathname('/');
    mockFetchSuccess();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    // Give microtasks a tick to settle
    await new Promise((r) => setTimeout(r, 0));

    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  // ── render on success ─────────────────────────────────────────────────────

  it('renders N cards into mount target on successful API response', async () => {
    setPathname('/some-product/');
    mockFetchSuccess(SAMPLE_PRODUCTS);

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await vi.waitFor(() => {
      const cards = document.querySelectorAll('[data-wdg-rec]');
      expect(cards.length).toBe(SAMPLE_PRODUCTS.length);
    });
  });

  it('respects maxItems config', async () => {
    setPathname('/some-product/');
    // Provide 3 products but maxItems=1
    mockFetchSuccess(SAMPLE_PRODUCTS);

    cartRecommender({ ...DEFAULT_CONFIG, maxItems: 1 }, DEFAULT_I18N);

    await vi.waitFor(() => {
      const cards = document.querySelectorAll('[data-wdg-rec]');
      expect(cards.length).toBe(1);
    });
  });

  it('renders heading text inside container', async () => {
    setPathname('/some-product/');
    mockFetchSuccess(SAMPLE_PRODUCTS);

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await vi.waitFor(() => {
      const heading = document.querySelector('.wdg-cart-rec__heading');
      expect(heading).not.toBeNull();
      expect(heading!.textContent).toBe('Часто беруть разом');
    });
  });

  it('mounts container inside the correct mount target', async () => {
    setPathname('/some-product/');
    mockFetchSuccess(SAMPLE_PRODUCTS);

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await vi.waitFor(() => {
      const container = document.querySelector('main .wdg-cart-recommender');
      expect(container).not.toBeNull();
    });
  });

  // ── no render on empty data ───────────────────────────────────────────────

  it('does not render anything when API returns empty data array', async () => {
    setPathname('/some-product/');
    mockFetchEmpty();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await new Promise((r) => setTimeout(r, 20));

    expect(document.querySelector('[data-wdg-rec]')).toBeNull();
    expect(document.querySelector('.wdg-cart-recommender')).toBeNull();
  });

  // ── no render on fetch failure ────────────────────────────────────────────

  it('does not render anything on fetch error', async () => {
    setPathname('/some-product/');
    mockFetchError();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await new Promise((r) => setTimeout(r, 20));

    expect(document.querySelector('[data-wdg-rec]')).toBeNull();
  });

  it('does not render anything on fetch abort', async () => {
    setPathname('/some-product/');
    mockFetchAbort();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await new Promise((r) => setTimeout(r, 20));

    expect(document.querySelector('[data-wdg-rec]')).toBeNull();
  });

  // ── disabled ──────────────────────────────────────────────────────────────

  it('does not call fetch when module is disabled', async () => {
    setPathname('/some-product/');
    mockFetchSuccess();

    cartRecommender({ ...DEFAULT_CONFIG, enabled: false }, DEFAULT_I18N);

    await new Promise((r) => setTimeout(r, 0));

    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  // ── mobile guard ──────────────────────────────────────────────────────────

  it('does not call fetch on desktop viewport', async () => {
    setPathname('/some-product/');
    setDesktopViewport();
    mockFetchSuccess();

    cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await new Promise((r) => setTimeout(r, 0));

    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  // ── cleanup ───────────────────────────────────────────────────────────────

  it('cleanup removes inserted container from DOM', async () => {
    setPathname('/some-product/');
    mockFetchSuccess(SAMPLE_PRODUCTS);

    const cleanup = cartRecommender(DEFAULT_CONFIG, DEFAULT_I18N);

    await vi.waitFor(() => {
      expect(document.querySelector('.wdg-cart-recommender')).not.toBeNull();
    });

    cleanup?.();

    expect(document.querySelector('.wdg-cart-recommender')).toBeNull();
  });
});
