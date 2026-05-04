const STORAGE_KEY = 'ssrch_history';
const MAX_ENTRIES = 10;

export function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

export function write(list: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* private browsing — ignore */
  }
}

export function add(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  const current = read().filter((v) => v !== trimmed);
  write([trimmed, ...current].slice(0, MAX_ENTRIES));
}

export function remove(idx: number): void {
  const current = read();
  current.splice(idx, 1);
  write(current);
}

export function clear(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
