export const STORAGE_KEY = 'wty_recently_viewed_v1';

export type ViewedProduct = {
  url: string;
  title: string;
  image: string;
  price?: number;
  currency?: string;
  at: number;
};

export function loadViewed(): ViewedProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ViewedProduct[];
  } catch {
    return [];
  }
}

export function saveViewed(items: ViewedProduct[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function pruneExpired(items: ViewedProduct[], expiryDays: number): ViewedProduct[] {
  const cutoff = Date.now() - expiryDays * 24 * 60 * 60 * 1000;
  return items.filter((item) => item.at > cutoff);
}

export function addViewed(
  existing: ViewedProduct[],
  entry: ViewedProduct,
  maxItems: number,
  expiryDays: number,
): ViewedProduct[] {
  // Dedupe by URL — remove any previous record for same URL
  const deduped = existing.filter((item) => item.url !== entry.url);
  // Newest first
  const updated = [entry, ...deduped];
  // Prune expired then cap
  return pruneExpired(updated, expiryDays).slice(0, maxItems);
}
