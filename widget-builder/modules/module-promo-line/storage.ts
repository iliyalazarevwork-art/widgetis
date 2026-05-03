const STORAGE_KEY = 'marquee_closed_until';

export function isClosed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    return Date.now() < ts;
  } catch {
    return false;
  }
}

export function persistClosed(ttlHours: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + ttlHours * 3_600_000));
  } catch {
    /* private browsing — ignore */
  }
}
