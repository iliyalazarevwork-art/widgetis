export type FeedProduct = {
  id: string;
  url: string;
  name: string;
  price: number;
  oldprice: number;
  picture: string;
  vendor: string;
  cat: string;
  available: boolean;
  st: string;
};

export type FeedIndex = {
  version: string | number;
  currency: string;
  accentColor: string | null;
  categoryUrls: Record<string, string>;
  products: FeedProduct[];
};

let index: FeedIndex | null = null;
let loading = false;

export function getFeedIndex(): FeedIndex | null {
  return index;
}

export function isFeedLoading(): boolean {
  return loading;
}

export function loadFeed(feedUrl: string, lang: string): void {
  if (index !== null || loading) return;
  loading = true;

  fetch(feedUrl, { method: 'GET', headers: { 'Accept-Language': lang } })
    .then((res) => {
      if (!res.ok) return null;
      return res.json() as Promise<FeedIndex>;
    })
    .then((data) => {
      if (data && Array.isArray(data.products)) {
        index = data;
      }
    })
    .catch(() => {
      // Feed load failed — silent fallback to server-side search
    })
    .finally(() => {
      loading = false;
    });
}
