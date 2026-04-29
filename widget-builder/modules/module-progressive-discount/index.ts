import { getLanguage } from '@laxarevii/core';
import {
  progressiveDiscountSchema,
  progressiveDiscountI18nSchema,
  type ProgressiveDiscountConfig,
  type ProgressiveDiscountInput,
  type DiscountTier,
  type I18nEntry,
} from './schema';
import { getCartItemCount, setupCartInterception, hookAjaxCart } from './cart';
import { applyCoupon, clearCoupon } from './coupon';
import { injectStyles } from './styles';
import { createBanner, ensureBannerInserted, renderBanner, type BannerRefs } from './dom';

type State = {
  initialized: boolean;
  banner: BannerRefs | null;
  observer: MutationObserver | null;
  lastCount: number | null;
  lastActiveIndex: number | null;
};

const state: State = {
  initialized: false,
  banner: null,
  observer: null,
  lastCount: null,
  lastActiveIndex: null,
};

let updateTimer: number | null = null;

function shouldHideByUtm(sources: string[]): boolean {
  if (!sources.length || typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const src = (params.get('utm_source') ?? '').toLowerCase();
    return src.length > 0 && sources.map((s) => s.toLowerCase()).includes(src);
  } catch {
    return false;
  }
}

function pickTier(tiers: DiscountTier[], itemCount: number): number {
  const sorted = [...tiers].sort((a, b) => a.minItems - b.minItems);
  let idx = -1;
  for (let i = 0; i < sorted.length; i += 1) {
    if (itemCount >= sorted[i]!.minItems) idx = i;
    else break;
  }
  return idx;
}

function update(config: ProgressiveDiscountConfig, i18n: I18nEntry): void {
  const itemCount = getCartItemCount();
  const sortedTiers = [...config.tiers].sort((a, b) => a.minItems - b.minItems);
  const activeIndex = pickTier(sortedTiers, itemCount);

  // Якщо немає кошика взагалі — приховуємо банер.
  if (itemCount <= 0) {
    if (state.banner?.container.isConnected) state.banner.container.remove();
    state.lastCount = 0;
    state.lastActiveIndex = -1;
    return;
  }

  injectStyles(config);

  if (!state.banner) state.banner = createBanner();
  ensureBannerInserted(state.banner);

  // Рендер UI на кожне оновлення (дешево).
  renderBanner(state.banner, itemCount, sortedTiers, activeIndex, i18n);

  // Применяем купон.
  if (activeIndex >= 0) {
    const tier = sortedTiers[activeIndex]!;
    if (state.lastActiveIndex !== activeIndex) {
      applyCoupon(tier.coupon);
    }
  } else if (state.lastActiveIndex !== null && state.lastActiveIndex >= 0) {
    // Скотились нижче за поріг найменшого tier — знімаємо купон.
    clearCoupon();
  }

  state.lastCount = itemCount;
  state.lastActiveIndex = activeIndex;
}

function scheduleUpdate(config: ProgressiveDiscountConfig, i18n: I18nEntry): void {
  if (updateTimer !== null) {
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(updateTimer);
    else clearTimeout(updateTimer);
  }
  const runner = (): void => {
    updateTimer = null;
    update(config, i18n);
  };
  if (typeof requestAnimationFrame !== 'undefined') updateTimer = requestAnimationFrame(runner);
  else updateTimer = setTimeout(runner, 16) as unknown as number;
}

export default function progressiveDiscount(
  rawConfig: ProgressiveDiscountInput,
  rawI18n: Record<string, I18nEntry>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = progressiveDiscountSchema.parse(rawConfig);
  const i18nMap = progressiveDiscountI18nSchema.parse(rawI18n);

  if (!config.enabled) {
    console.warn('[widgetality] progressive-discount: ⚠️ disabled');
    return;
  }
  if (shouldHideByUtm(config.hideOnUtmSources)) {
    console.warn('[widgetality] progressive-discount: ⚠️ hidden by UTM source');
    return;
  }
  if (state.initialized) {
    console.log('[widgetality] progressive-discount: already initialized');
    return;
  }
  state.initialized = true;
  console.log('[widgetality] progressive-discount: ✅ activated');

  const lang = getLanguage();
  const i18n: I18nEntry = i18nMap[lang] ?? i18nMap.ua ?? Object.values(i18nMap)[0]!;

  const trigger = (): void => scheduleUpdate(config, i18n);

  setupCartInterception(trigger);
  hookAjaxCart(trigger);
  scheduleUpdate(config, i18n);

  // на випадок якщо drawer кошика рендериться пізніше / реактивно
  const observer = new MutationObserver(() => {
    if (state.banner?.container.isConnected) return;
    scheduleUpdate(config, i18n);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  state.observer = observer;

  return () => {
    state.observer?.disconnect();
    state.observer = null;
    if (updateTimer !== null) {
      if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(updateTimer);
      else clearTimeout(updateTimer);
      updateTimer = null;
    }
    if (state.banner?.container.isConnected) state.banner.container.remove();
    state.banner = null;
    state.initialized = false;
    state.lastCount = null;
    state.lastActiveIndex = null;
    document.getElementById('progressive-discount-styles')?.remove();
  };
}
