import { stockLeftSchema, stockLeftI18nSchema, type StockLeftInput } from './schema';
import { getLanguage, isHoroshopProductPage } from '@laxarevii/core';
import { injectStyles } from './styles';
import { createBadge, insertElement, removeExisting, updateCount } from './dom';
import { loadState, saveState, type StockState } from './state';

export default function stockLeft(
  rawConfig: StockLeftInput,
  rawI18n: Record<string, { label: string; unit?: string }>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = stockLeftSchema.parse(rawConfig);
  const i18nMap = stockLeftI18nSchema.parse(rawI18n);

  if (!config.enabled) {
    console.warn('[widgetality] stock-left: ⚠️ disabled');
    return;
  }
  if (config.selectors.length === 0) {
    console.warn('[widgetality] stock-left: ⚠️ no selectors configured — widget skipped');
    return;
  }
  if (!isHoroshopProductPage()) {
    console.warn('[widgetality] stock-left: ⚠️ skipped — not a product page');
    return;
  }
  if (!config.showForOutOfStock) {
    const outOfStock = document.querySelector(
      '.product__not-available, .out-of-stock, [data-product-not-available]',
    );
    if (outOfStock) return;
  }

  console.log('[widgetality] stock-left: ✅ activated');

  const lang = getLanguage();
  const i18n =
    i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? i18nMap.en ?? Object.values(i18nMap)[0]!;
  const unit = i18n.unit ?? 'шт';

  const path = location.pathname;
  let state = loadState(path);
  if (!state) {
    state = createInitialState(config, path);
  }
  saveState(state, path);

  injectStyles(config);

  const reference = findFirstSelector(config.selectors);
  if (!reference) return;

  removeExisting(reference.element);
  if (!reference.element.isConnected) return;

  const badge = createBadge(state.current, i18n.label, unit);
  try {
    insertElement(reference.element, badge, reference.insert);
  } catch {
    return;
  }

  if (!badge.isConnected) return;

  const stopUpdates = startUpdates(state, config, badge, path);

  return () => {
    stopUpdates();
    badge.remove();
    document.getElementById('wty-stock-left-styles')?.remove();
  };
}

function findFirstSelector(
  selectors: ReadonlyArray<{ selector: string; insert: 'before' | 'after' }>,
): { element: Element; insert: 'before' | 'after' } | null {
  for (const { selector, insert } of selectors) {
    try {
      const candidates = document.querySelectorAll(selector);
      for (const el of candidates) {
        if (isVisible(el)) return { element: el, insert };
      }
    } catch {
      // invalid selector — try next
    }
  }
  return null;
}

function isVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return el.getClientRects().length > 0;
  if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromPath(path: string): number {
  const cleaned = path.replace(/\/+$/, '');
  let sum = 0;
  for (let i = 0; i < cleaned.length; i++) sum = (sum + cleaned.charCodeAt(i) * 31) >>> 0;
  return sum || 12345;
}

function createInitialState(
  config: ReturnType<typeof stockLeftSchema.parse>,
  path: string,
): StockState {
  const rnd = seededRandom(seedFromPath(path));
  const range = config.maxCount - config.minCount + 1;
  const initial = config.minCount + Math.floor(rnd() * Math.max(range, 1));
  return {
    current: Math.max(initial, config.minRemaining),
    min: config.minCount,
    max: config.maxCount,
    minRemaining: config.minRemaining,
    createdAt: Date.now(),
    lastUpdate: Date.now(),
  };
}

function nextInterval(baseSeconds: number): number {
  const baseMs = baseSeconds * 1000;
  const jitter = (Math.random() - 0.5) * baseMs * 0.4;
  return Math.max(10_000, baseMs + jitter);
}

function startUpdates(
  state: StockState,
  config: ReturnType<typeof stockLeftSchema.parse>,
  badge: HTMLElement,
  path: string,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function tick(): void {
    if (!badge.isConnected) return;

    if (state.current > state.minRemaining && Math.random() < config.decrementProbability) {
      state.current = Math.max(state.current - 1, state.minRemaining);
      updateCount(badge, state.current);
      saveState(state, path);
    }

    timer = setTimeout(tick, nextInterval(config.updateInterval));
  }

  timer = setTimeout(tick, nextInterval(config.updateInterval));

  return () => {
    if (timer !== null) clearTimeout(timer);
  };
}
