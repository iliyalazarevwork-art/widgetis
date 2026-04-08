const UTM_STORAGE_KEY = 'hide_cart_goal_bar';

function getUtmSource(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get('utm_source');
  } catch {
    return null;
  }
}

function getStoredUtmSource(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed.value || stored;
    } catch {
      return stored;
    }
  } catch {
    return null;
  }
}

function saveUtmSource(utmSource: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(UTM_STORAGE_KEY, utmSource.toLowerCase());
  } catch {}
}

function isProductPage(): boolean {
  if (typeof document === 'undefined') return false;
  return document.querySelector('.product__section.product__section--header') !== null;
}

export function shouldHideByUtmSource(hideOnUtmSources: string[]): boolean {
  if (!hideOnUtmSources.length) return false;

  const hideSet = new Set(hideOnUtmSources.map((s) => s.toLowerCase()));

  const storedUtm = getStoredUtmSource();
  if (storedUtm && hideSet.has(storedUtm)) return true;

  const currentUtm = getUtmSource();
  if (currentUtm && hideSet.has(currentUtm.toLowerCase())) {
    if (isProductPage()) {
      saveUtmSource(currentUtm);
      return true;
    }
  }

  return false;
}
