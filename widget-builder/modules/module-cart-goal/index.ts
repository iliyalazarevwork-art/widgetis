import { cartGoalSchema, cartGoalI18nSchema, type CartGoalConfig, type CartGoalInput } from './schema';
import { getLanguage, resolveCurrency, type CurrencyContext } from '@laxarevii/core';
import { injectStyles } from './styles';
import { findTotalInfo, setupCartInterception, type CartTotalInfo } from './cart';
import { shouldHideByUtmSource } from './utm';
import { computeProgress } from './progress';
import {
  createMainWidget,
  createFloatingWidget,
  applyPosition,
  setupMobileInteractions,
  resumeShake,
  INSERTION_POINTS,
  type WidgetRefs,
} from './dom';

type I18nEntry = { text: string; achieved: string };

type State = {
  initialized: boolean;
  main: WidgetRefs | null;
  floating: WidgetRefs | null;
  observer: MutationObserver | null;
  lastTotal: number | null;
  lastCurrency: string | null;
};

const state: State = {
  initialized: false,
  main: null,
  floating: null,
  observer: null,
  lastTotal: null,
  lastCurrency: null,
};

let updateTimer: number | null = null;
let mobileMenuInterval: ReturnType<typeof setInterval> | null = null;

function resolveFloatingPosition(config: CartGoalConfig) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  return isMobile ? config.positionMobile : config.positionDesktop;
}

function ensureWidgets(config: CartGoalConfig): { recreated: boolean } {
  let recreated = false;

  if (state.main && !state.main.container.isConnected) {
    state.main = null;
    recreated = true;
  }

  if (state.main) {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const mobileTarget = document.querySelector<HTMLElement>('.mm-menu.cart .cart__summary');
      if (mobileTarget && !mobileTarget.contains(state.main.container) && state.main.container.parentElement === document.body) {
        state.main.container.remove();
        state.main = null;
        recreated = true;
      }
    }
    if (state.main && state.main.container.parentElement === document.body) {
      for (const point of INSERTION_POINTS) {
        if (document.querySelector<HTMLElement>(point.selector)) {
          state.main.container.remove();
          state.main = null;
          recreated = true;
          break;
        }
      }
    }
  }

  if (!state.main) {
    const main = createMainWidget();
    main.container.classList.add('is-visible');
    let inserted = false;

    if (window.innerWidth <= 768) {
      const mobileTarget = document.querySelector<HTMLElement>('.mm-menu.cart .cart__summary');
      if (mobileTarget) {
        mobileTarget.insertAdjacentElement('beforebegin', main.container);
        inserted = true;
      }
    }

    if (!inserted) {
      for (const point of INSERTION_POINTS) {
        const target = document.querySelector<HTMLElement>(point.selector);
        if (target) {
          target.insertAdjacentElement(point.position, main.container);
          inserted = true;
          break;
        }
      }
    }

    if (!inserted) document.body.appendChild(main.container);
    state.main = main;
    recreated = true;
  }

  const isCheckout = window.location.pathname.includes('/checkout');
  if (!config.floatingWidget || isCheckout) {
    if (state.floating?.container.isConnected) state.floating.container.remove();
    state.floating = null;
    return { recreated };
  }

  if (state.floating && !state.floating.container.isConnected) state.floating = null;

  if (!state.floating) {
    const floating = createFloatingWidget();
    floating.container.classList.add('is-visible');
    if (config.desktopIconOnly) floating.container.classList.add('cg-widget--icon-only');
    applyPosition(floating.container, resolveFloatingPosition(config));
    document.body.appendChild(floating.container);
    setupMobileInteractions(floating, config);
    state.floating = floating;
  }

  return { recreated };
}

function updateWidgetContent(
  refs: WidgetRefs | null,
  totalInfo: CartTotalInfo,
  currency: CurrencyContext,
  threshold: number,
  i18n: I18nEntry,
): void {
  if (!refs) return;

  const total = totalInfo.amount;
  if (refs.container.id === 'cg-widget-main' && total <= 0) {
    refs.container.classList.remove('is-visible');
    refs.container.style.display = 'none';
    return;
  }
  if (refs.container.id === 'cg-widget-main') {
    refs.container.style.removeProperty('display');
  }

  const remaining = Math.max(0, threshold - total);
  const progress = computeProgress(threshold, total) * 100;
  const achieved = remaining <= 0;

  refs.container.classList.add('is-visible');
  refs.container.classList.toggle('is-achieved', achieved);

  if (refs.label) refs.label.textContent = achieved ? i18n.achieved : i18n.text;
  if (refs.amount) refs.amount.textContent = achieved ? '' : `${Math.ceil(remaining)} ${currency.code}`;
  if (refs.bar) refs.bar.style.width = `${achieved ? 100 : progress}%`;

  if (refs.mobileRemaining) refs.mobileRemaining.textContent = achieved ? '' : `${Math.ceil(remaining)} ${currency.symbol}`;
  if (refs.circleBar) refs.circleBar.style.width = `${achieved ? 100 : progress}%`;
  if (refs.expLabel) refs.expLabel.innerHTML = achieved ? i18n.achieved : i18n.text;
  if (refs.expAmount) refs.expAmount.textContent = achieved ? '' : `${Math.ceil(remaining)}${currency.symbol}`;
}

function updateWidget(config: CartGoalConfig, i18n: I18nEntry): void {
  const totalInfo = findTotalInfo();
  const currency = resolveCurrency(totalInfo.currencyCode);
  const threshold = config.threshold;

  if (threshold <= 0) {
    if (state.main?.container.isConnected) state.main.container.remove();
    if (state.floating?.container.isConnected) state.floating.container.remove();
    state.main = null;
    state.floating = null;
    console.warn('[widgetality] cart-goal: ⚠️ threshold not configured — widget hidden');
    return;
  }

  if (config.minimum > 0 && totalInfo.amount < config.minimum) {
    if (state.main?.container.isConnected) state.main.container.style.display = 'none';
    if (state.floating?.container.isConnected) state.floating.container.style.display = 'none';
    return;
  }
  if (state.main?.container.isConnected) state.main.container.style.removeProperty('display');
  if (state.floating?.container.isConnected) state.floating.container.style.removeProperty('display');

  injectStyles(config);
  const { recreated } = ensureWidgets(config);
  const total = totalInfo.amount;

  if (recreated) {
    updateWidgetContent(state.main, totalInfo, currency, threshold, i18n);
    updateWidgetContent(state.floating, totalInfo, currency, threshold, i18n);
    if (state.floating) applyPosition(state.floating.container, resolveFloatingPosition(config));
    state.lastTotal = total;
    state.lastCurrency = currency.code;
    return;
  }

  if (state.lastTotal === total && state.lastCurrency === currency.code) return;

  resumeShake(state.floating);
  state.lastTotal = total;
  state.lastCurrency = currency.code;

  updateWidgetContent(state.main, totalInfo, currency, threshold, i18n);
  updateWidgetContent(state.floating, totalInfo, currency, threshold, i18n);
  if (state.floating) applyPosition(state.floating.container, resolveFloatingPosition(config));
}

function scheduleUpdate(config: CartGoalConfig, i18n: I18nEntry): void {
  if (updateTimer !== null) {
    if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(updateTimer);
    else clearTimeout(updateTimer);
  }

  const runner = () => {
    updateTimer = null;
    updateWidget(config, i18n);
  };

  if (typeof requestAnimationFrame !== 'undefined') updateTimer = requestAnimationFrame(runner);
  else updateTimer = setTimeout(runner, 16) as unknown as number;
}

export default function cartGoal(
  rawConfig: CartGoalInput,
  rawI18n: Record<string, { text: string; achieved: string }>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = cartGoalSchema.parse(rawConfig);
  const i18nMap = cartGoalI18nSchema.parse(rawI18n);
  if (!config.enabled) { console.warn('[widgetality] cart-goal: ⚠️ disabled'); return; }
  if (shouldHideByUtmSource(config.hideOnUtmSources)) { console.warn('[widgetality] cart-goal: ⚠️ hidden by UTM source'); return; }
  if (state.initialized) { console.log('[widgetality] cart-goal: already initialized'); return; }
  state.initialized = true;
  console.log('[widgetality] cart-goal: ✅ activated');

  const lang = getLanguage();
  const i18n: I18nEntry = i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  const triggerUpdate = () => {
    state.lastTotal = null;
    scheduleUpdate(config, i18n);
  };

  setupCartInterception(triggerUpdate);
  scheduleUpdate(config, i18n);

  const observer = new MutationObserver(() => scheduleUpdate(config, i18n));
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  state.observer = observer;

  if (window.innerWidth <= 768) {
    const checkMobileMenu = () => {
      if (document.querySelector('.mm-menu.cart') && state.main && !state.main.container.isConnected) {
        scheduleUpdate(config, i18n);
      }
    };
    mobileMenuInterval = setInterval(checkMobileMenu, 1000);
    setTimeout(() => { if (mobileMenuInterval !== null) { clearInterval(mobileMenuInterval); mobileMenuInterval = null; } }, 30000);
  }

  return () => {
    state.observer?.disconnect();
    state.observer = null;
    if (updateTimer !== null) {
      if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(updateTimer);
      else clearTimeout(updateTimer);
      updateTimer = null;
    }
    if (mobileMenuInterval !== null) { clearInterval(mobileMenuInterval); mobileMenuInterval = null; }
    if (state.main?.container.isConnected) state.main.container.remove();
    if (state.floating?.container.isConnected) state.floating.container.remove();
    state.main = null;
    state.floating = null;
    state.initialized = false;
    state.lastTotal = null;
    state.lastCurrency = null;
    document.getElementById('cart-goal-widget-styles')?.remove();
  };
}
