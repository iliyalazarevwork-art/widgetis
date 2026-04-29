/**
 * Застосування купона у Horoshop.
 *
 * Стратегія (за пріоритетом):
 *   1. AjaxCart.getInstance().Cart.setCouponCode(code) — нативний API, якщо є.
 *   2. DOM-форма: показати .j-coupon-add-form (якщо прихована),
 *      заповнити .j-coupon-input, клікнути .j-coupon-submit.
 *      Цей шлях вимагає, щоб кошик був відкритий (drawer/page).
 *
 * Дедуплікація:
 *   • lastApplied — щоб не клікати на кожне оновлення.
 *   • sessionStorage 'wty_pd_applied' — переживає reload сторінки.
 *
 * Зчитування поточного купона:
 *   AjaxCart.getInstance().Cart.coupon?.code ?? Cart.couponCode ?? null.
 */

const STORAGE_KEY = 'wty_pd_applied';

let lastApplied: string | null = null;

function readStored(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStored(code: string | null): void {
  try {
    if (code === null) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore (private mode)
  }
}

export function getAppliedCoupon(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const inst = (window as any).AjaxCart?.getInstance?.();
    const fromCart = inst?.Cart?.coupon?.code ?? inst?.Cart?.couponCode ?? null;
    if (typeof fromCart === 'string' && fromCart.length > 0) return fromCart;
  } catch {
    // ignore
  }
  const input = document.querySelector<HTMLInputElement>('.j-coupon-input');
  if (input?.value && input.value.trim().length > 0) return input.value.trim();
  return lastApplied ?? readStored();
}

function applyViaAjaxCart(code: string): boolean {
  try {
    const inst = (window as any).AjaxCart?.getInstance?.();
    if (!inst?.Cart) return false;
    if (typeof inst.Cart.setCouponCode === 'function') {
      inst.Cart.setCouponCode(code);
      return true;
    }
    if (typeof inst.setCouponCode === 'function') {
      inst.setCouponCode(code);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function applyViaDom(code: string): boolean {
  const form = document.querySelector<HTMLElement>('.j-coupon-add-form');
  const input = document.querySelector<HTMLInputElement>('.j-coupon-input');
  const submit = document.querySelector<HTMLElement>('.j-coupon-submit');
  if (!input || !submit) return false;

  // Розгорнути форму, якщо прихована.
  if (form && getComputedStyle(form).display === 'none') {
    form.style.removeProperty('display');
    const toggle = document.querySelector<HTMLElement>('.j-coupon-add');
    toggle?.click();
  }

  input.focus();
  // нативний сетер value (React/Vue-friendly, та й нативні форми Horoshop теж)
  const proto = Object.getPrototypeOf(input);
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(input, code);
  else input.value = code;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  submit.click();
  return true;
}

export function applyCoupon(code: string): boolean {
  if (!code) return false;
  if (lastApplied === code) return false;
  if (getAppliedCoupon() === code) {
    lastApplied = code;
    writeStored(code);
    return false;
  }
  const ok = applyViaAjaxCart(code) || applyViaDom(code);
  if (ok) {
    lastApplied = code;
    writeStored(code);
    console.log('[widgetality] progressive-discount: ✅ applied', code);
  }
  return ok;
}

export function clearCoupon(): boolean {
  try {
    const inst = (window as any).AjaxCart?.getInstance?.();
    if (typeof inst?.Cart?.setCouponCode === 'function') {
      inst.Cart.setCouponCode('');
      lastApplied = null;
      writeStored(null);
      return true;
    }
  } catch {
    // ignore
  }
  const cancel = document.querySelector<HTMLElement>('.j-coupon-cancel');
  if (cancel) {
    cancel.click();
    lastApplied = null;
    writeStored(null);
    return true;
  }
  return false;
}

export function resetCouponState(): void {
  lastApplied = null;
  writeStored(null);
}
