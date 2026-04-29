import { socialProofSchema, socialProofI18nSchema, type SocialProofInput } from './schema';
import { getLanguage, isHoroshopProductPage } from '@laxarevii/core';
import { injectStyles } from './styles';
import { createBadge, insertElement, removeExisting, updateCount } from './dom';
import { calculateRange, pickNextTarget, nextInterval } from './generator';
import { loadState, saveState, type ProofState } from './state';
import { clamp } from './random';

export default function socialProof(
  rawConfig: SocialProofInput,
  rawI18n: Record<string, { label: string }>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = socialProofSchema.parse(rawConfig);
  const i18nMap = socialProofI18nSchema.parse(rawI18n);
  if (!config.enabled) { console.warn('[widgetality] social-proof: ⚠️ disabled'); return; }
  if (config.selectors.length === 0) { console.warn('[widgetality] social-proof: ⚠️ no selectors configured — widget skipped'); return; }
  if (!isHoroshopProductPage()) { console.warn('[widgetality] social-proof: ⚠️ skipped — not a product page'); return; }
  console.log('[widgetality] social-proof: ✅ activated');

  if (!config.showForOutOfStock) {
    const outOfStock = document.querySelector('.product__not-available, .out-of-stock, [data-product-not-available]');
    if (outOfStock) return;
  }

  const lang = getLanguage();
  const i18n = i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  const range = calculateRange(config);

  let state = loadState(location.pathname);
  if (!state) {
    const initial = clamp(
      range.mean + Math.round(range.rnd() * 10 - 5),
      range.min,
      range.max,
    );
    state = {
      current: initial,
      target: pickNextTarget(initial, range),
      min: range.min,
      max: range.max,
      date: '',
      lastUpdate: Date.now(),
      nextTargetAt: Date.now() + config.updateInterval * 1000,
    };
  }
  saveState(state);

  injectStyles(config);

  const badges: HTMLElement[] = [];

  for (const { selector, insert } of config.selectors) {
    const reference = document.querySelector(selector);
    if (!reference) continue;

    removeExisting(reference);
    if (!reference.isConnected) continue;

    try {
      const badge = createBadge(state.current, i18n.label);
      insertElement(reference, badge, insert);
      badges.push(badge);
    } catch {
      // selector failed
    }
  }

  if (badges.length === 0) return;

  const stopUpdates = startUpdates(state, range, config, badges);

  return () => {
    stopUpdates();
    for (const b of badges) b.remove();
    document.getElementById('social-proof-styles')?.remove();
  };
}

function startUpdates(
  state: ProofState,
  range: ReturnType<typeof calculateRange>,
  config: { updateInterval: number },
  badges: HTMLElement[],
): () => void {
  let tickTimer: ReturnType<typeof setTimeout> | null = null;

  function tick() {
    const now = Date.now();

    if (now >= state.nextTargetAt) {
      state.target = pickNextTarget(state.current, range);
      state.nextTargetAt = now + nextInterval(config.updateInterval);
    }

    if (state.current < state.target) {
      state.current = Math.min(state.current + 1, state.target, state.max);
    } else if (state.current > state.target) {
      state.current = Math.max(state.current - 1, state.target, state.min);
    }

    for (const badge of badges) {
      if (badge.isConnected) updateCount(badge, state.current);
    }

    saveState(state);
    tickTimer = setTimeout(tick, nextInterval(config.updateInterval));
  }

  tickTimer = setTimeout(tick, nextInterval(config.updateInterval));

  return () => { if (tickTimer !== null) clearTimeout(tickTimer); };
}
