import { describe, it, expect } from 'vitest';
import { localSearch } from './local-search';
import type { FeedIndex, FeedProduct } from './feed';

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<FeedProduct> = {}): FeedProduct {
  return {
    id: overrides.id ?? '1',
    url: overrides.url ?? 'https://shop.test/p/1',
    name: overrides.name ?? 'Тестовий товар',
    price: overrides.price ?? 100,
    oldprice: overrides.oldprice ?? 0,
    picture: overrides.picture ?? '',
    vendor: overrides.vendor ?? '',
    cat: overrides.cat ?? 'Іграшки',
    available: overrides.available ?? true,
    st: overrides.st ?? 'тестовий товар іграшки',
  };
}

function makeIndex(products: FeedProduct[], categoryUrls: Record<string, string> = {}): FeedIndex {
  return {
    version: '1:0',
    currency: 'грн',
    accentColor: null,
    categoryUrls,
    products,
  };
}

// ── Empty / trivial queries ────────────────────────────────────────────────

describe('empty and trivial queries', () => {
  it('returns empty groups for empty query string', () => {
    const index = makeIndex([makeProduct()]);
    const result = localSearch(index, '', 4, '');
    expect(result.groups).toEqual({});
    expect(result.total).toBe(0);
  });

  it('returns empty groups when all tokens are shorter than 2 chars', () => {
    const index = makeIndex([makeProduct({ st: 'a b c' })]);
    const result = localSearch(index, 'a b', 4, '');
    expect(result.groups).toEqual({});
    expect(result.total).toBe(0);
  });

  it('returns empty groups when no products match', () => {
    const index = makeIndex([makeProduct({ st: 'вібратор силіконовий' })]);
    const result = localSearch(index, 'ноутбук', 4, '');
    expect(result.groups).toEqual({});
    expect(result.total).toBe(0);
  });

  it('returns metadata from index even when no results', () => {
    const index = makeIndex([], { Іграшки: 'https://shop.test/toys' });
    const result = localSearch(index, 'xyz', 4, '');
    expect(result.currency).toBe('грн');
    expect(result.categoryUrls).toEqual({ Іграшки: 'https://shop.test/toys' });
    expect(result.loading).toBe(false);
    expect(result.correction).toBeNull();
  });
});

// ── Token matching ─────────────────────────────────────────────────────────

describe('token matching', () => {
  it('finds product when token matches substring of search_text', () => {
    const index = makeIndex([makeProduct({ st: 'анальна пробка', cat: 'Анал' })]);
    const result = localSearch(index, 'пробка', 4, '');
    expect(result.total).toBe(1);
    expect(Object.keys(result.groups)).toContain('Анал');
  });

  it('requires all tokens to be present in search_text', () => {
    const products = [
      makeProduct({ id: '1', st: 'вібратор силіконовий рожевий', cat: 'Вібратори' }),
      makeProduct({ id: '2', st: 'вібратор пластиковий синій', cat: 'Вібратори' }),
    ];
    const index = makeIndex(products);
    // "силіконовий" only matches product 1
    const result = localSearch(index, 'вібратор силіконовий', 10, '');
    const items = result.groups['Вібратори']?.items ?? [];
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('1');
  });

  it('excludes product when any token is missing from search_text', () => {
    const index = makeIndex([makeProduct({ st: 'вібратор рожевий', cat: 'V' })]);
    const result = localSearch(index, 'вібратор синій', 4, '');
    expect(result.total).toBe(0);
  });

  it('is case-insensitive', () => {
    const index = makeIndex([makeProduct({ st: 'вібратор силіконовий' })]);
    expect(localSearch(index, 'ВІБРАТОР', 4, '').total).toBe(1);
    expect(localSearch(index, 'Вібратор', 4, '').total).toBe(1);
  });
});

// ── Scoring ────────────────────────────────────────────────────────────────

describe('scoring', () => {
  it('assigns score 4 when token starts at index 0', () => {
    // "вібратор" starts at position 0 in st → score +4
    const p = makeProduct({ id: 'start', st: 'вібратор рожевий', cat: 'A' });
    const index = makeIndex([p]);
    const result = localSearch(index, 'вібратор', 10, '');
    // We can verify score indirectly through ordering
    expect(result.groups['A']?.items[0].id).toBe('start');
  });

  it('assigns score 2 when token starts after a space (word boundary)', () => {
    const wordStart = makeProduct({ id: 'word', st: 'купити вібратор', cat: 'A' });
    const substr = makeProduct({ id: 'sub', st: 'антивібраторний', cat: 'A' });
    const index = makeIndex([wordStart, substr]);
    const result = localSearch(index, 'вібратор', 10, '');
    const items = result.groups['A']?.items ?? [];
    // word-boundary hit (score 2) ranks above substring hit (score 1)
    expect(items[0].id).toBe('word');
    expect(items[1].id).toBe('sub');
  });

  it('assigns score 1 for mid-word substring match', () => {
    const mid = makeProduct({ id: 'mid', st: 'антивібраторний', cat: 'A' });
    const index = makeIndex([mid]);
    const result = localSearch(index, 'вібратор', 10, '');
    expect(result.total).toBe(1);
    expect(result.groups['A']?.items[0].id).toBe('mid');
  });

  it('ranks higher-score products before lower-score ones', () => {
    const products = [
      makeProduct({ id: 'sub', st: 'антивібраторний засіб', cat: 'A' }),   // score 1
      makeProduct({ id: 'start', st: 'вібратор силіконовий', cat: 'A' }),   // score 4
      makeProduct({ id: 'word', st: 'масло для вібраторів', cat: 'A' }),    // score 2 (plural differs but substr matches)
    ];
    const index = makeIndex(products);
    const result = localSearch(index, 'вібратор', 10, '');
    const ids = (result.groups['A']?.items ?? []).map((i) => i.id);
    expect(ids[0]).toBe('start'); // score 4
    expect(ids[1]).toBe('word');  // score 2
    expect(ids[2]).toBe('sub');   // score 1
  });
});

// ── Sorting tiebreakers ────────────────────────────────────────────────────

describe('sorting tiebreakers', () => {
  it('ranks available products before unavailable when scores are equal', () => {
    const products = [
      makeProduct({ id: 'out', st: 'вібратор', cat: 'A', available: false, price: 50 }),
      makeProduct({ id: 'in', st: 'вібратор', cat: 'A', available: true, price: 200 }),
    ];
    const index = makeIndex(products);
    const result = localSearch(index, 'вібратор', 10, '');
    const ids = (result.groups['A']?.items ?? []).map((i) => i.id);
    expect(ids[0]).toBe('in');
    expect(ids[1]).toBe('out');
  });

  it('ranks cheaper products first among equal-score equal-availability items', () => {
    const products = [
      makeProduct({ id: 'expensive', st: 'вібратор', cat: 'A', available: true, price: 500 }),
      makeProduct({ id: 'cheap', st: 'вібратор', cat: 'A', available: true, price: 100 }),
    ];
    const index = makeIndex(products);
    const result = localSearch(index, 'вібратор', 10, '');
    const ids = (result.groups['A']?.items ?? []).map((i) => i.id);
    expect(ids[0]).toBe('cheap');
    expect(ids[1]).toBe('expensive');
  });
});

// ── Grouping ───────────────────────────────────────────────────────────────

describe('grouping by category', () => {
  it('groups products by cat field', () => {
    const products = [
      makeProduct({ id: '1', st: 'вібратор', cat: 'Вібратори' }),
      makeProduct({ id: '2', st: 'вібратор анальний', cat: 'Анальні' }),
      makeProduct({ id: '3', st: 'вібратор класичний', cat: 'Вібратори' }),
    ];
    const index = makeIndex(products);
    const result = localSearch(index, 'вібратор', 10, '');
    expect(Object.keys(result.groups)).toContain('Вібратори');
    expect(Object.keys(result.groups)).toContain('Анальні');
    expect(result.groups['Вібратори']?.items).toHaveLength(2);
    expect(result.groups['Анальні']?.items).toHaveLength(1);
  });

  it('falls back to "Інше" when cat field is empty', () => {
    const index = makeIndex([makeProduct({ st: 'вібратор', cat: '' })]);
    const result = localSearch(index, 'вібратор', 10, '');
    expect(Object.keys(result.groups)).toContain('Інше');
  });

  it('group total reflects all matches, not just limited items', () => {
    const products = Array.from({ length: 10 }, (_, i) =>
      makeProduct({ id: String(i), st: 'вібратор', cat: 'All' }),
    );
    const index = makeIndex(products);
    const result = localSearch(index, 'вібратор', 3, '');
    expect(result.groups['All']?.total).toBe(10);
    expect(result.groups['All']?.items).toHaveLength(3);
  });
});

// ── limitPerGroup ─────────────────────────────────────────────────────────

describe('limitPerGroup', () => {
  it('respects limitPerGroup cap', () => {
    const products = Array.from({ length: 20 }, (_, i) =>
      makeProduct({ id: String(i), st: 'вібратор', cat: 'V' }),
    );
    const index = makeIndex(products);
    expect(localSearch(index, 'вібратор', 4, '').groups['V']?.items).toHaveLength(4);
    expect(localSearch(index, 'вібратор', 10, '').groups['V']?.items).toHaveLength(10);
    expect(localSearch(index, 'вібратор', 50, '').groups['V']?.items).toHaveLength(20);
  });
});

// ── categoryFilter ────────────────────────────────────────────────────────

describe('categoryFilter', () => {
  it('only returns products matching the categoryFilter when set', () => {
    const products = [
      makeProduct({ id: '1', st: 'вібратор', cat: 'Вібратори' }),
      makeProduct({ id: '2', st: 'вібратор', cat: 'Анальні' }),
    ];
    const index = makeIndex(products);
    const result = localSearch(index, 'вібратор', 10, 'Вібратори');
    expect(Object.keys(result.groups)).toEqual(['Вібратори']);
    expect(result.groups['Вібратори']?.items[0].id).toBe('1');
  });

  it('returns all categories when categoryFilter is empty string', () => {
    const products = [
      makeProduct({ id: '1', st: 'вібратор', cat: 'A' }),
      makeProduct({ id: '2', st: 'вібратор', cat: 'B' }),
    ];
    const index = makeIndex(products);
    const result = localSearch(index, 'вібратор', 10, '');
    expect(Object.keys(result.groups)).toHaveLength(2);
  });

  it('returns empty groups when categoryFilter matches no products', () => {
    const index = makeIndex([makeProduct({ st: 'вібратор', cat: 'Вібратори' })]);
    const result = localSearch(index, 'вібратор', 10, 'Анальні');
    expect(result.groups).toEqual({});
    expect(result.total).toBe(0);
  });
});

// ── Response shape ─────────────────────────────────────────────────────────

describe('response shape', () => {
  it('returns SearchResponse-compatible object', () => {
    const index = makeIndex([makeProduct({ st: 'вібратор' })]);
    const result = localSearch(index, 'вібратор', 4, '');
    expect(result).toHaveProperty('query');
    expect(result).toHaveProperty('correction');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('loading');
    expect(result).toHaveProperty('currency');
    expect(result).toHaveProperty('categoryUrls');
    expect(result).toHaveProperty('groups');
    expect(result).toHaveProperty('features');
  });

  it('query field matches the input query', () => {
    const index = makeIndex([makeProduct({ st: 'вібратор' })]);
    expect(localSearch(index, 'вібратор', 4, '').query).toBe('вібратор');
  });

  it('loading is always false', () => {
    const index = makeIndex([]);
    expect(localSearch(index, 'anything', 4, '').loading).toBe(false);
    expect(localSearch(index, '', 4, '').loading).toBe(false);
  });

  it('item shape has all required fields', () => {
    const p = makeProduct({
      id: 'p1',
      url: 'https://shop.test/p/1',
      name: 'Вібратор',
      price: 999,
      oldprice: 1200,
      picture: 'https://cdn.test/img.jpg',
      available: true,
      vendor: 'Tenga',
      st: 'вібратор tenga',
    });
    const result = localSearch(makeIndex([p]), 'вібратор', 4, '');
    const item = Object.values(result.groups)[0]?.items[0];
    expect(item).toBeDefined();
    expect(item!.id).toBe('p1');
    expect(item!.url).toBe('https://shop.test/p/1');
    expect(item!.name).toBe('Вібратор');
    expect(item!.price).toBe(999);
    expect(item!.oldprice).toBe(1200);
    expect(item!.picture).toBe('https://cdn.test/img.jpg');
    expect(item!.available).toBe(true);
    expect(item!.vendor).toBe('Tenga');
  });

  it('categoryUrls is forwarded from the index', () => {
    const urls = { Іграшки: 'https://shop.test/toys' };
    const index = makeIndex([makeProduct({ st: 'вібратор' })], urls);
    expect(localSearch(index, 'вібратор', 4, '').categoryUrls).toEqual(urls);
  });

  it('accentColor is forwarded from index when set', () => {
    const index: FeedIndex = { ...makeIndex([makeProduct({ st: 'вібратор' })]), accentColor: 'ff0000' };
    expect(localSearch(index, 'вібратор', 4, '').accentColor).toBe('ff0000');
  });

  it('accentColor is undefined when index accentColor is null', () => {
    const index = makeIndex([makeProduct({ st: 'вібратор' })]);
    expect(localSearch(index, 'вібратор', 4, '').accentColor).toBeUndefined();
  });
});

// ── Multi-token edge cases ─────────────────────────────────────────────────

describe('multi-token queries', () => {
  it('scores sum across all tokens', () => {
    // "lovense вібратор": p1 has both at start/word-boundary, p2 has only one
    const p1 = makeProduct({ id: 'both', st: 'lovense вібратор рожевий', cat: 'A' });
    const p2 = makeProduct({ id: 'one', st: 'купити вібратор lovense дешево', cat: 'A' });
    const index = makeIndex([p1, p2]);
    const result = localSearch(index, 'lovense вібратор', 10, '');
    const ids = (result.groups['A']?.items ?? []).map((i) => i.id);
    // p1: lovense at 0 (score 4) + вібратор after space (score 2) = 6
    // p2: вібратор after space (score 2) + lovense after space (score 2) = 4
    expect(ids[0]).toBe('both');
    expect(ids[1]).toBe('one');
  });

  it('filters out single-char tokens from multi-token query', () => {
    // "а вібратор": "а" is 1 char → filtered; only "вібратор" used
    const index = makeIndex([makeProduct({ st: 'вібратор' })]);
    const result = localSearch(index, 'а вібратор', 4, '');
    expect(result.total).toBe(1);
  });
});
