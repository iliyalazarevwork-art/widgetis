import {
  promoAutoApplySchema,
  promoAutoApplyI18nSchema,
  type PromoAutoApplyConfig,
  type PromoAutoApplyInput,
  type PromoAutoApplyI18nEntry,
} from './schema';
import { getLanguage } from '@laxarevii/core';

const SESSION_APPLIED_PREFIX = 'wty_promo_auto_applied_';

type ActivePrize = {
  code: string;
  label?: string;
  expiresAt?: number;
};

export default function promoAutoApply(
  rawConfig: PromoAutoApplyInput,
  rawI18n: Record<string, PromoAutoApplyI18nEntry>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = promoAutoApplySchema.parse(rawConfig);
  const i18nMap = promoAutoApplyI18nSchema.parse(rawI18n);

  if (!config.enabled) {
    console.warn('[widgetality] promo-auto-apply: ⚠️ disabled');
    return;
  }

  if (!isCheckoutPage(config.checkoutPathMatches)) return;

  const prize = readActivePrize(config.storageKey);
  if (!prize) return;

  if (isAppliedThisSession(prize.code)) {
    console.log('[widgetality] promo-auto-apply: ⏭️ code already applied this session', prize.code);
    return;
  }

  const lang = getLanguage();
  const i18n = i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  console.log('[widgetality] promo-auto-apply: 🎯 watching for coupon form, code=', prize.code);

  const stopWatch = watchForCouponForm(config.watchTimeoutMs, () => {
    applyCoupon(prize.code).then((ok) => {
      if (!ok) {
        console.warn('[widgetality] promo-auto-apply: ❌ failed to apply', prize.code);
        return;
      }
      rememberAppliedThisSession(prize.code);
      console.log('[widgetality] promo-auto-apply: ✅ applied', prize.code);
      if (config.showToast) {
        showToast(config, i18n.appliedMessage.replace('{code}', prize.code));
      }
    });
  });

  return () => {
    stopWatch();
  };
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

function isCheckoutPage(matches: readonly string[]): boolean {
  const path = (window.location.pathname || '').toLowerCase();
  return matches.some((m) => path.includes(m.toLowerCase()));
}

function readActivePrize(key: string): ActivePrize | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActivePrize;
    if (!parsed || typeof parsed.code !== 'string' || parsed.code.length === 0) {
      return null;
    }
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isAppliedThisSession(code: string): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_APPLIED_PREFIX + code) === '1';
  } catch {
    return false;
  }
}

function rememberAppliedThisSession(code: string): void {
  try {
    window.sessionStorage.setItem(SESSION_APPLIED_PREFIX + code, '1');
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Coupon form watching & application (Horoshop-specific selectors)
// ---------------------------------------------------------------------------

const COUPON_ADD_SELECTORS = [
  'button.j-coupon-add:not(#bonus-block button.j-coupon-add):not(#bonus-block button.j-bonus-add-mobile)',
  'a.j-coupon-add:not(#bonus-block a.j-coupon-add):not(#bonus-block a.j-bonus-add)',
];
const COUPON_INPUT_SELECTOR =
  '.j-coupon-input:not(#bonus-block .j-coupon-input):not(#bonus-block .j-bonus-input)';
const COUPON_SUBMIT_SELECTORS = [
  'button.j-coupon-submit:not(#bonus-block button.j-coupon-submit)',
  'a.j-coupon-submit:not(#bonus-block a.j-coupon-submit)',
];
const COUPON_APPLIED_MARKER =
  '.j-coupon-remove, .coupon__name, .order-details__cost-name, .cart-discount-info';

function querySelectorFirst(selectors: readonly string[]): HTMLElement | null {
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) return el;
  }
  return null;
}

function watchForCouponForm(timeoutMs: number, onReady: () => void): () => void {
  let obs: MutationObserver | null = null;
  let timer: number | null = null;
  let done = false;

  const finish = (): void => {
    if (done) return;
    done = true;
    obs?.disconnect();
    if (timer !== null) clearTimeout(timer);
  };

  const checkOnce = (): 'applied' | 'ready' | 'not-yet' => {
    if (document.querySelector(COUPON_APPLIED_MARKER)) return 'applied';
    if (querySelectorFirst(COUPON_ADD_SELECTORS)) return 'ready';
    return 'not-yet';
  };

  const result = checkOnce();
  if (result === 'applied') {
    return () => {};
  }
  if (result === 'ready') {
    onReady();
    return () => {};
  }

  obs = new MutationObserver(() => {
    if (done) return;
    const r = checkOnce();
    if (r === 'applied') {
      finish();
    } else if (r === 'ready') {
      finish();
      onReady();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });

  timer = window.setTimeout(() => {
    finish();
    console.warn('[widgetality] promo-auto-apply: ⏱️ coupon form not found within', timeoutMs, 'ms');
  }, timeoutMs);

  return finish;
}

async function applyCoupon(code: string): Promise<boolean> {
  const addBtn = querySelectorFirst(COUPON_ADD_SELECTORS);
  if (!addBtn) return false;

  addBtn.click();

  const input = await waitForElement<HTMLInputElement>(COUPON_INPUT_SELECTOR, 2000);
  if (!input) return false;

  const submitBtn = querySelectorFirst(COUPON_SUBMIT_SELECTORS) as HTMLElement | null;
  if (!submitBtn) return false;

  input.value = code;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  submitBtn.click();
  return true;
}

function waitForElement<T extends Element>(selector: string, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const initial = document.querySelector<T>(selector);
    if (initial) {
      resolve(initial);
      return;
    }
    const obs = new MutationObserver(() => {
      const found = document.querySelector<T>(selector);
      if (found) {
        obs.disconnect();
        clearTimeout(timer);
        resolve(found);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    const timer = window.setTimeout(() => {
      obs.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

// ---------------------------------------------------------------------------
// Toast UI
// ---------------------------------------------------------------------------

function showToast(config: PromoAutoApplyConfig, message: string): void {
  const host = document.createElement('div');
  host.style.cssText =
    `position:fixed;left:0;right:0;${config.toastPosition}:24px;` +
    `display:flex;justify-content:center;z-index:${config.zIndex};` +
    `pointer-events:none;`;
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    .toast {
      background: ${config.backgroundColor};
      color: ${config.textColor};
      padding: 12px 20px;
      border-radius: 12px;
      font: 600 14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
      box-shadow: 0 8px 24px rgba(0,0,0,.18);
      max-width: 420px;
      transform: translateY(${config.toastPosition === 'top' ? '-' : ''}24px);
      opacity: 0;
      transition: transform .3s ease, opacity .3s ease;
    }
    .toast--visible { transform: translateY(0); opacity: 1; }
  `;
  shadow.appendChild(style);
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  shadow.appendChild(toast);
  document.body.appendChild(host);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
  });

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => host.remove(), 350);
  }, 4000);
}
