const STORAGE_PREFIX = 'wty_stock_left_';
const TTL_MS = 24 * 60 * 60 * 1000;

export type StockState = {
  current: number;
  min: number;
  max: number;
  minRemaining: number;
  createdAt: number;
  lastUpdate: number;
};

function key(path: string): string {
  return STORAGE_PREFIX + path;
}

export function loadState(path: string): StockState | null {
  try {
    const raw = localStorage.getItem(key(path));
    if (!raw) return null;

    const state: StockState = JSON.parse(raw);
    if (Date.now() - state.createdAt > TTL_MS) {
      localStorage.removeItem(key(path));
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function saveState(state: StockState, path: string = location.pathname): void {
  try {
    localStorage.setItem(
      key(path),
      JSON.stringify({ ...state, lastUpdate: Date.now() }),
    );
  } catch {
    // storage full or unavailable
  }
}
