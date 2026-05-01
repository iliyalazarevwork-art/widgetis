export type Item = {
  id: string;
  url: string;
  name: string;
  price: number;
  oldprice: number;
  picture: string;
  available: boolean;
  vendor?: string;
};

export type SearchResponse = {
  query: string;
  correction: string | null;
  total: number;
  loading?: boolean;
  accentColor?: string;
  currency?: string;
  categoryUrls: Record<string, string>;
  features?: {
    translit?: boolean;
    typo?: boolean;
    layout?: boolean;
    morphology?: boolean;
    synonyms?: boolean;
    history?: boolean;
  };
  groups: Record<string, { total: number; items: Item[] }>;
};

export class SearchError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'SearchError';
  }
}

export function buildSearchUrl(
  apiUrl: string,
  query: string,
  limit: number,
): string {
  const url = new URL(apiUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(limit));
  return url.toString();
}

export async function searchProducts(
  url: string,
  lang: string,
  signal: AbortSignal,
): Promise<SearchResponse> {
  const res = await fetch(url, { signal, headers: { 'Accept-Language': lang } });
  if (!res.ok) {
    throw new SearchError(res.status, `Search API error: ${res.status}`);
  }
  return res.json() as Promise<SearchResponse>;
}
