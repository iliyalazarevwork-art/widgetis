import { freeDeliveryBarSchema, freeDeliveryBarI18nSchema, type FreeDeliveryBarConfig, type FreeDeliveryBarInput } from './schema';
import { getLanguage, resolveCurrency } from '@laxarevii/core';
import { findTotalInfo, setupCartInterception, type CartTotalInfo } from './cart';

const STYLES_ID = 'wdg-fdb-styles';
const BAR_ID = 'wdg-fdb-bar';
const SPACER_ID = 'wdg-fdb-spacer';

type I18nEntry = { remaining: string; achieved: string };

type State = {
  initialized: boolean;
  lastTotal: number | null;
  lastCurrency: string | null;
  observer: MutationObserver | null;
};

const state: State = {
  initialized: false,
  lastTotal: null,
  lastCurrency: null,
  observer: null,
};

let updateTimer: number | null = null;

/** Reset module-level state — for unit tests only */
export function _resetState(): void {
  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }
  if (updateTimer !== null) {
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(updateTimer);
    else clearTimeout(updateTimer);
    updateTimer = null;
  }
  state.initialized = false;
  state.lastTotal = null;
  state.lastCurrency = null;
}

// ---------------------------------------------------------------------------
// Progress computation (exported for unit tests)
// ---------------------------------------------------------------------------

export function computeProgress(threshold: number, total: number): number {
  if (threshold <= 0) return 0;
  return Math.min(1, Math.max(0, total / threshold));
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function injectStyles(config: FreeDeliveryBarConfig): void {
  const existing = document.getElementById(STYLES_ID);
  if (existing) existing.remove();

  const el = document.createElement('style');
  el.id = STYLES_ID;
  el.textContent = `
#${BAR_ID} {
  --fdb-bg: ${config.backgroundColor};
  --fdb-fg: ${config.textColor};
  --fdb-progress: ${config.progressColor};
  --fdb-achieved: ${config.achievedColor};

  position: fixed;
  ${config.position === 'top' ? 'top: 0; left: 0; right: 0;' : 'bottom: 0; left: 0; right: 0;'}
  height: ${config.height}px;
  z-index: ${config.zIndex};
  background: var(--fdb-bg);
  color: var(--fdb-fg);
  border-radius: ${config.borderRadius}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  overflow: hidden;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  transition: background 0.4s ease;
}
#${BAR_ID}.is-achieved {
  background: var(--fdb-achieved);
}
#${BAR_ID}__text {
  position: relative;
  z-index: 1;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 16px;
  color: var(--fdb-fg);
}
@media (max-width: 640px) {
  #${BAR_ID}__text { font-size: 13px; }
}
#${BAR_ID}__progress-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255,255,255,0.2);
}
#${BAR_ID}__progress-fill {
  height: 100%;
  width: 0%;
  background: var(--fdb-progress);
  transition: width 0.5s ease-out;
}
#${BAR_ID}.is-achieved #${BAR_ID}__progress-track {
  display: none;
}
#${SPACER_ID} {
  display: block;
  flex-shrink: 0;
}
@keyframes fdb-pulse {
  0%   { opacity: 1; }
  50%  { opacity: 0.75; }
  100% { opacity: 1; }
}
#${BAR_ID}.fdb-pulse {
  animation: fdb-pulse 0.4s ease-in-out;
}
`;
  document.head.appendChild(el);
}

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------

function mountBar(config: FreeDeliveryBarConfig): HTMLElement {
  // Remove stale bar if present
  document.getElementById(BAR_ID)?.remove();
  document.getElementById(SPACER_ID)?.remove();

  const bar = document.createElement('div');
  bar.id = BAR_ID;
  bar.innerHTML = `
    <span id="${BAR_ID}__text"></span>
    <div id="${BAR_ID}__progress-track">
      <div id="${BAR_ID}__progress-fill"></div>
    </div>
  `;
  document.body.insertAdjacentElement('afterbegin', bar);

  // Spacer pushes body content down for top-positioned bar
  if (config.position === 'top') {
    const spacer = document.createElement('div');
    spacer.id = SPACER_ID;
    spacer.style.height = `${config.height}px`;
    bar.insertAdjacentElement('afterend', spacer);
  }

  return bar;
}

function formatMessage(template: string, amount: string): string {
  return template.replace('{amount}', amount);
}

function updateBar(config: FreeDeliveryBarConfig, i18n: I18nEntry): void {
  const totalInfo = findTotalInfo();
  const currency = resolveCurrency(totalInfo.currencyCode);
  const total = totalInfo.amount;

  // Skip redundant updates
  if (state.lastTotal === total && state.lastCurrency === currency.code) return;
  const prevTotal = state.lastTotal;
  state.lastTotal = total;
  state.lastCurrency = currency.code;

  const bar = document.getElementById(BAR_ID);
  if (!bar) return;
  const textEl = document.getElementById(`${BAR_ID}__text`);
  const fill = document.getElementById(`${BAR_ID}__progress-fill`);

  const remaining = Math.max(0, config.threshold - total);
  const achieved = remaining <= 0;
  const progress = computeProgress(config.threshold, total) * 100;

  bar.classList.toggle('is-achieved', achieved);

  if (textEl) {
    if (achieved) {
      textEl.textContent = i18n.achieved;
    } else {
      const amountStr = `${currency.symbol}${Math.ceil(remaining)}`;
      textEl.textContent = formatMessage(i18n.remaining, amountStr);
    }
  }

  if (fill) {
    fill.style.width = `${achieved ? 100 : progress}%`;
  }

  // Pulse animation on cart update (if enabled and total changed from a known value)
  if (config.pulseOnUpdate && prevTotal !== null && prevTotal !== total) {
    bar.classList.remove('fdb-pulse');
    // Force reflow to restart animation
    void bar.offsetWidth;
    bar.classList.add('fdb-pulse');
    bar.addEventListener('animationend', () => bar.classList.remove('fdb-pulse'), { once: true });
  }
}

// ---------------------------------------------------------------------------
// Checkout detection
// ---------------------------------------------------------------------------

function isCheckoutPage(): boolean {
  return typeof window !== 'undefined' && window.location.pathname.includes('/checkout');
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

function scheduleUpdate(config: FreeDeliveryBarConfig, i18n: I18nEntry): void {
  if (updateTimer !== null) {
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(updateTimer);
    else clearTimeout(updateTimer);
  }

  const runner = () => {
    updateTimer = null;
    updateBar(config, i18n);
  };

  if (typeof requestAnimationFrame !== 'undefined') updateTimer = requestAnimationFrame(runner);
  else updateTimer = setTimeout(runner, 16) as unknown as number;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export default function freeDeliveryBar(
  rawConfig: FreeDeliveryBarInput,
  rawI18n: Record<string, { remaining: string; achieved: string }>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = freeDeliveryBarSchema.parse(rawConfig);
  const i18nMap = freeDeliveryBarI18nSchema.parse(rawI18n);

  if (!config.enabled) {
    console.warn('[widgetality] free-delivery-bar: ⚠️ disabled');
    return;
  }

  if (config.threshold <= 0) {
    console.warn('[widgetality] free-delivery-bar: ⚠️ threshold not configured — widget hidden');
    return;
  }

  if (config.hideOnCheckout && isCheckoutPage()) {
    console.warn('[widgetality] free-delivery-bar: ⚠️ hidden on checkout');
    return;
  }

  if (state.initialized) {
    console.log('[widgetality] free-delivery-bar: already initialized');
    return;
  }
  state.initialized = true;

  console.log('[widgetality] free-delivery-bar: ✅ activated');

  const lang = getLanguage();
  const i18n: I18nEntry = i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  injectStyles(config);
  mountBar(config);

  const triggerUpdate = () => {
    state.lastTotal = null;
    scheduleUpdate(config, i18n);
  };

  setupCartInterception(triggerUpdate);
  scheduleUpdate(config, i18n);

  const observer = new MutationObserver(() => scheduleUpdate(config, i18n));
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  state.observer = observer;

  return () => {
    state.observer?.disconnect();
    state.observer = null;

    if (updateTimer !== null) {
      if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(updateTimer);
      else clearTimeout(updateTimer);
      updateTimer = null;
    }

    document.getElementById(BAR_ID)?.remove();
    document.getElementById(SPACER_ID)?.remove();
    document.getElementById(STYLES_ID)?.remove();

    state.initialized = false;
    state.lastTotal = null;
    state.lastCurrency = null;
  };
}
