const STORAGE_PREFIX = 'hsp_social_proof_';

export type ProofState = {
  current: number;
  target: number;
  min: number;
  max: number;
  date: string;
  lastUpdate: number;
  nextTargetAt: number;
};

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadState(path: string): ProofState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + path);
    if (!raw) return null;

    const state: ProofState = JSON.parse(raw);
    if (state.date !== todayString()) {
      localStorage.removeItem(STORAGE_PREFIX + path);
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

export function saveState(state: ProofState, path: string = location.pathname): void {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + path,
      JSON.stringify({ ...state, date: todayString(), lastUpdate: Date.now() }),
    );
  } catch {
    // storage full or unavailable
  }
}
