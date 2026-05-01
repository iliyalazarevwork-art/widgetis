import type { FeedIndex, FeedProduct } from './feed';
import type { SearchResponse, Item } from './api';

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function scoreProduct(st: string, tokens: string[]): number {
  let score = 0;
  for (const token of tokens) {
    const idx = st.indexOf(token);
    if (idx === -1) return 0;
    if (idx === 0) score += 4;
    else if (st[idx - 1] === ' ') score += 2;
    else score += 1;
  }
  return score;
}

function toItem(p: FeedProduct): Item {
  return {
    id: p.id,
    url: p.url,
    name: p.name,
    price: p.price,
    oldprice: p.oldprice,
    picture: p.picture,
    available: p.available,
    vendor: p.vendor,
  };
}

export function localSearch(
  index: FeedIndex,
  query: string,
  limitPerGroup: number,
  categoryFilter: string,
): SearchResponse {
  const tokens = tokenize(query);

  if (tokens.length === 0) {
    return {
      query,
      correction: null,
      total: 0,
      loading: false,
      accentColor: index.accentColor ?? undefined,
      currency: index.currency,
      categoryUrls: index.categoryUrls,
      features: { translit: true, typo: false, morphology: false, synonyms: false, history: true },
      groups: {},
    };
  }

  type Scored = { p: FeedProduct; score: number };
  const groups: Record<string, Scored[]> = {};

  for (const p of index.products) {
    if (categoryFilter !== '' && p.cat !== categoryFilter) continue;
    const score = scoreProduct(p.st, tokens);
    if (score === 0) continue;
    const cat = p.cat || 'Інше';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push({ p, score });
  }

  const resultGroups: SearchResponse['groups'] = {};
  let total = 0;

  for (const [cat, items] of Object.entries(groups)) {
    items.sort(
      (a, b) =>
        b.score - a.score ||
        (b.p.available ? 1 : 0) - (a.p.available ? 1 : 0) ||
        a.p.price - b.p.price,
    );
    const catTotal = items.length;
    total += catTotal;
    resultGroups[cat] = {
      total: catTotal,
      items: items.slice(0, limitPerGroup).map(({ p }) => toItem(p)),
    };
  }

  return {
    query,
    correction: null,
    total,
    loading: false,
    accentColor: index.accentColor ?? undefined,
    currency: index.currency,
    categoryUrls: index.categoryUrls,
    features: { translit: true, typo: false, morphology: false, synonyms: false, history: true },
    groups: resultGroups,
  };
}
