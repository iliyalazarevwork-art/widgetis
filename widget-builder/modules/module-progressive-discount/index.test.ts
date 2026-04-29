/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import progressiveDiscount from './index';
import { progressiveDiscountSchema, getDefaultI18n } from './schema';

describe('module-progressive-discount', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (window as any).AjaxCart;
    try { window.sessionStorage.clear(); } catch { /* noop */ }
  });

  it('parses default config with 3 tiers (2/5%, 3/10%, 5/20%)', () => {
    const cfg = progressiveDiscountSchema.parse({});
    expect(cfg.tiers).toEqual([
      { minItems: 2, percent: 5, coupon: 'CASH5' },
      { minItems: 3, percent: 10, coupon: 'CASH10' },
      { minItems: 5, percent: 20, coupon: 'CASH20' },
    ]);
  });

  it('does nothing when cart is empty (no banner)', () => {
    const dispose = progressiveDiscount({}, getDefaultI18n());
    expect(document.getElementById('pd-banner')).toBeNull();
    if (typeof dispose === 'function') dispose();
  });

  it('mounts banner and applies CASH5 when cart has 2 items', () => {
    document.body.innerHTML = `
      <div id="cart">
        <div class="cart__content">
          <div class="coupon"></div>
          <div class="j-coupon-add-form">
            <input class="j-coupon-input" />
            <button class="j-coupon-submit">OK</button>
          </div>
        </div>
      </div>
    `;
    (window as any).AjaxCart = {
      getInstance: () => ({
        Cart: { total: { quantity: 2 }, products: {} },
        attachEventHandlers: vi.fn(),
      }),
    };
    const submitClick = vi.fn();
    document.querySelector<HTMLElement>('.j-coupon-submit')!.addEventListener('click', submitClick);

    const dispose = progressiveDiscount({}, getDefaultI18n());

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const banner = document.getElementById('pd-banner');
        expect(banner).not.toBeNull();
        expect(banner!.textContent).toContain('Прогресивна знижка');
        const input = document.querySelector<HTMLInputElement>('.j-coupon-input')!;
        expect(input.value).toBe('CASH5');
        expect(submitClick).toHaveBeenCalled();
        if (typeof dispose === 'function') dispose();
        resolve();
      }, 300);
    });
  });

  it('marks top tier as achieved when cart has 5+ items', () => {
    document.body.innerHTML = `
      <div id="cart">
        <div class="cart__content">
          <div class="coupon"></div>
          <input class="j-coupon-input" />
          <button class="j-coupon-submit">OK</button>
        </div>
      </div>
    `;
    (window as any).AjaxCart = {
      getInstance: () => ({
        Cart: { total: { quantity: 5 }, products: {} },
        attachEventHandlers: vi.fn(),
      }),
    };

    const dispose = progressiveDiscount({}, getDefaultI18n());

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const banner = document.getElementById('pd-banner')!;
        expect(banner.classList.contains('is-top')).toBe(true);
        expect(banner.textContent).toContain('20%');
        if (typeof dispose === 'function') dispose();
        resolve();
      }, 300);
    });
  });
});
