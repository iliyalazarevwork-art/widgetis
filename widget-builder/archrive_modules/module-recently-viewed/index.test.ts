import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import recentlyViewed from './index';
import { getDefaultConfig, getDefaultI18n } from './schema';
import { STORAGE_KEY, type ViewedProduct } from './storage';

vi.mock('@laxarevii/core', () => ({
  getLanguage: vi.fn(() => 'ua'),
  isHoroshopProductPage: vi.fn(() => false),
}));

import { getLanguage, isHoroshopProductPage } from '@laxarevii/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItems(count: number, baseUrl = '/product-'): ViewedProduct[] {
  return Array.from({ length: count }, (_, i) => ({
    url: `${baseUrl}${i + 1}`,
    title: `Product ${i + 1}`,
    image: `https://example.com/img${i + 1}.jpg`,
    price: 100 * (i + 1),
    at: Date.now() - i * 1000,
  }));
}

function seedStorage(items: ViewedProduct[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('recentlyViewed', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    localStorage.clear();
    vi.mocked(getLanguage).mockReturnValue('ua');
    vi.mocked(isHoroshopProductPage).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('logs activation message when enabled', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    seedStorage(makeItems(4));
    const anchor = document.createElement('div');
    anchor.className = 'j-product-block';
    document.body.appendChild(anchor);

    recentlyViewed(getDefaultConfig(), getDefaultI18n());

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('✅ activated'));
    spy.mockRestore();
  });

  it('does not mount when enabled=false', () => {
    seedStorage(makeItems(4));
    const anchor = document.createElement('div');
    anchor.className = 'j-product-block';
    document.body.appendChild(anchor);

    const result = recentlyViewed({ ...getDefaultConfig(), enabled: false }, getDefaultI18n());
    expect(document.querySelector('.wdg-rv')).toBeNull();
    expect(result).toBeUndefined();
  });

  it('does not render when fewer than minItems entries are available', () => {
    vi.useFakeTimers();
    seedStorage(makeItems(2)); // minItems default is 3
    const anchor = document.createElement('div');
    anchor.className = 'j-product-block';
    document.body.appendChild(anchor);

    const cleanup = recentlyViewed(getDefaultConfig(), getDefaultI18n());
    expect(document.querySelector('.wdg-rv')).toBeNull();
    cleanup?.();
  });

  it('mounts carousel section when enough items exist', () => {
    seedStorage(makeItems(4));
    const anchor = document.createElement('div');
    anchor.className = 'j-product-block';
    document.body.appendChild(anchor);

    const cleanup = recentlyViewed(getDefaultConfig(), getDefaultI18n());
    expect(document.querySelector('.wdg-rv')).not.toBeNull();
    expect(document.querySelectorAll('.wdg-rv__card').length).toBe(4);
    cleanup?.();
  });

  it('excludes current page url from rendered cards', () => {
    // seed 4 items, one of which matches the current page
    const items = makeItems(4);
    // JSDOM default location is about:blank, relativeUrl gives '/' — use a distinct path
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/product-1' },
      writable: true,
    });
    seedStorage(items); // items[0].url === '/product-1'

    const anchor = document.createElement('div');
    anchor.className = 'j-product-block';
    document.body.appendChild(anchor);

    const cleanup = recentlyViewed(getDefaultConfig(), getDefaultI18n());
    // only 3 cards should render (product-1 excluded)
    expect(document.querySelectorAll('.wdg-rv__card').length).toBe(3);
    cleanup?.();
  });

  it('cleanup removes section and injected styles', () => {
    seedStorage(makeItems(4));
    const anchor = document.createElement('div');
    anchor.className = 'j-product-block';
    document.body.appendChild(anchor);

    const cleanup = recentlyViewed(getDefaultConfig(), getDefaultI18n())!;
    expect(document.querySelector('.wdg-rv')).not.toBeNull();
    cleanup();
    expect(document.querySelector('.wdg-rv')).toBeNull();
    expect(document.getElementById('wdg-rv-styles')).toBeNull();
  });

  it('shows ua heading by default', () => {
    vi.mocked(getLanguage).mockReturnValue('ua');
    seedStorage(makeItems(4));
    const anchor = document.createElement('div');
    anchor.className = 'j-product-block';
    document.body.appendChild(anchor);

    const cleanup = recentlyViewed(getDefaultConfig(), getDefaultI18n());
    const heading = document.querySelector('.wdg-rv__heading');
    expect(heading?.textContent).toBe('Ви нещодавно дивились');
    cleanup?.();
  });

  it('shows ru heading when language is ru', () => {
    vi.mocked(getLanguage).mockReturnValue('ru');
    seedStorage(makeItems(4));
    const anchor = document.createElement('div');
    anchor.className = 'j-product-block';
    document.body.appendChild(anchor);

    const cleanup = recentlyViewed(getDefaultConfig(), getDefaultI18n());
    const heading = document.querySelector('.wdg-rv__heading');
    expect(heading?.textContent).toBe('Вы недавно смотрели');
    cleanup?.();
  });

  it('renders price when present on card', () => {
    seedStorage(makeItems(4));
    const anchor = document.createElement('div');
    anchor.className = 'j-product-block';
    document.body.appendChild(anchor);

    const cleanup = recentlyViewed(getDefaultConfig(), getDefaultI18n());
    const prices = document.querySelectorAll('.wdg-rv__price');
    expect(prices.length).toBeGreaterThan(0);
    cleanup?.();
  });

  it('gracefully handles empty localStorage (no errors, no render)', () => {
    vi.useFakeTimers();
    // no items in storage
    const anchor = document.createElement('div');
    anchor.className = 'j-product-block';
    document.body.appendChild(anchor);

    expect(() => {
      const cleanup = recentlyViewed(getDefaultConfig(), getDefaultI18n());
      cleanup?.();
    }).not.toThrow();

    expect(document.querySelector('.wdg-rv')).toBeNull();
  });

  it('tracks product and saves to localStorage when on a product page', () => {
    vi.mocked(isHoroshopProductPage).mockReturnValue(true);

    // Provide a title via h1
    document.body.innerHTML = '<h1>My Awesome Product</h1>';
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/awesome-product' },
      writable: true,
    });

    // pre-seed 3 items so we don't block rendering (minItems=3, current page excluded)
    seedStorage(makeItems(3, '/other-'));

    const anchor = document.createElement('div');
    anchor.className = 'j-product-block';
    document.body.appendChild(anchor);

    recentlyViewed(getDefaultConfig(), getDefaultI18n());

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ViewedProduct[];
    const tracked = stored.find((item) => item.url === '/awesome-product');
    expect(tracked).toBeDefined();
    expect(tracked?.title).toBe('My Awesome Product');
  });
});
