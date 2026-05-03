import { minOrderSchema, minOrderI18nSchema, type MinOrderConfig, type MinOrderInput } from './schema';
import { getLanguage, resolveCurrency } from '@laxarevii/core';
import { injectStyles } from './styles';
import { findTotalInfo, setupCartInterception } from './cart';
import {
  createMainWidget,
  createFloatingWidget,
  applyFloatingPosition,
  resolveFloatingPosition,
  setupMobileInteractions,
  INSERTION_POINTS,
  type WidgetRefs,
} from './dom';

type I18nEntry = { text: string; achieved: string };

type State = {
  initialized: boolean;
  main: WidgetRefs | null;
  floating: WidgetRefs | null;
  lastTotal: number | null;
  lastCurrency: string | null;
};

const state: State = {
  initialized: false,
  main: null,
  floating: null,
  lastTotal: null,
  lastCurrency: null,
};

let updateTimer: number | null = null;
let observer: MutationObserver | null = null;
let mobileMenuInterval: ReturnType<typeof setInterval> | null = null;

function isCheckoutPage(): boolean {
  return window.location.pathname.toLowerCase().includes('checkout');
}

function ensureMainWidget(): void {
  if (state.main && !state.main.container.isConnected) state.main = null;

  // Relocate main widget if a better insertion point appeared
  if (state.main) {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const mobileTarget = document.querySelector<HTMLElement>('.mm-menu.cart .cart__summary');
      if (mobileTarget && !mobileTarget.contains(state.main.container)
          && state.main.container.parentElement === document.body) {
        state.main.container.remove();
        state.main = null;
      }
    }

    if (state.main && state.main.container.parentElement === document.body) {
      for (const point of INSERTION_POINTS) {
        if (document.querySelector<HTMLElement>(point.selector)) {
          state.main.container.remove();
          state.main = null;
          break;
        }
      }
    }
  }

  if (!state.main) {
    const widget = createMainWidget();
    widget.container.classList.add('is-visible');
    let inserted = false;

    if (window.innerWidth <= 768) {
      const mobileTarget = document.querySelector<HTMLElement>('.mm-menu.cart .cart__summary');
      if (mobileTarget) {
        mobileTarget.insertAdjacentElement('beforebegin', widget.container);
        inserted = true;
      }
    }

    if (!inserted) {
      for (const point of INSERTION_POINTS) {
        const target = document.querySelector<HTMLElement>(point.selector);
        if (target) {
          target.insertAdjacentElement(point.position, widget.container);
          inserted = true;
          break;
        }
      }
    }

    if (inserted) state.main = widget;
  }
}

function ensureFloatingWidget(config: MinOrderConfig): void {
  if (!config.floatingWidget || isCheckoutPage()) {
    if (state.floating?.container.isConnected) state.floating.container.remove();
    state.floating = null;
    return;
  }

  if (state.floating && !state.floating.container.isConnected) state.floating = null;

  if (!state.floating) {
    const floating = createFloatingWidget();
    floating.container.classList.add('is-visible');
    if (config.desktopIconOnly) floating.container.classList.add('mo-widget--icon-only');
    applyFloatingPosition(floating.container, resolveFloatingPosition(config));
    document.body.appendChild(floating.container);
    setupMobileInteractions(floating, config);
    state.floating = floating;
  }
}

function updateWidgetContent(refs: WidgetRefs, total: number, threshold: number, remaining: number, currencyCode: string, i18n: I18nEntry): void {
  const progress = Math.min(1, Math.max(0, total / threshold)) * 100;
  if (refs.label) refs.label.textContent = i18n.text;
  if (refs.amount) refs.amount.textContent = `${Math.ceil(remaining)} ${currencyCode}`;
  if (refs.bar) refs.bar.style.width = `${progress}%`;
  if (refs.circleBar) refs.circleBar.style.width = `${progress}%`;
  if (refs.expLabel) refs.expLabel.textContent = i18n.text;
  if (refs.expAmount) refs.expAmount.textContent = `${Math.ceil(remaining)} ${currencyCode}`;
}

function updateWidget(config: MinOrderConfig, i18n: I18nEntry): void {
  const totalInfo = findTotalInfo();
  const currency = resolveCurrency(totalInfo.currencyCode);
  const threshold = config.threshold;
  const total = totalInfo.amount;

  if (threshold <= 0) {
    if (state.main?.container.isConnected) state.main.container.remove();
    if (state.floating?.container.isConnected) state.floating.container.remove();
    state.main = null;
    state.floating = null;
    return;
  }

  injectStyles(config);

  const remaining = Math.max(0, threshold - total);
  const achieved = remaining <= 0;

  if (achieved || total <= 0) {
    if (state.main?.container.isConnected) state.main.container.remove();
    if (state.floating?.container.isConnected) state.floating.container.remove();
    state.main = null;
    state.floating = null;
    return;
  }

  ensureMainWidget();
  ensureFloatingWidget(config);

  if (state.main) {
    state.main.container.classList.remove('is-hidden');
    state.main.container.classList.add('is-visible');
    updateWidgetContent(state.main, total, threshold, remaining, currency.code, i18n);
  }

  if (state.floating) {
    state.floating.container.classList.remove('is-hidden');
    state.floating.container.classList.add('is-visible');
    updateWidgetContent(state.floating, total, threshold, remaining, currency.code, i18n);
    applyFloatingPosition(state.floating.container, resolveFloatingPosition(config));
  }

  // Resume shake on cart total change
  if (state.floating && state.lastTotal !== null && state.lastTotal !== total) {
    (state.floating.container as any)._shakePaused = false;
  }

  state.lastTotal = total;
  state.lastCurrency = currency.code;
}

function scheduleUpdate(config: MinOrderConfig, i18n: I18nEntry): void {
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

export default function minOrder(
  rawConfig: MinOrderInput,
  rawI18n: Record<string, { text: string; achieved: string }>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = minOrderSchema.parse(rawConfig);
  const i18nMap = minOrderI18nSchema.parse(rawI18n);
  if (!config.enabled) { console.warn('[widgetality] min-order: disabled'); return; }
  if (state.initialized) { console.log('[widgetality] min-order: already initialized'); return; }
  state.initialized = true;
  console.log('[widgetality] min-order: activated');

  const lang = getLanguage();
  const i18n: I18nEntry = i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  const triggerUpdate = () => {
    state.lastTotal = null;
    scheduleUpdate(config, i18n);
  };

  setupCartInterception(triggerUpdate);
  scheduleUpdate(config, i18n);

  observer = new MutationObserver(() => scheduleUpdate(config, i18n));
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

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
    observer?.disconnect();
    observer = null;
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
    document.getElementById('min-order-widget-styles')?.remove();
  };
}
