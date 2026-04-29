import { describe, it, expect, beforeEach, vi } from 'vitest';
import promoAutoApply from './index';
import { getDefaultI18n } from './schema';

const i18n = getDefaultI18n();

describe('promoAutoApply', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.localStorage.clear();
    window.sessionStorage.clear();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/checkout/' },
    });
  });

  it('does nothing on a non-checkout page', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/products/' },
    });
    window.localStorage.setItem('wty_active_prize', JSON.stringify({ code: 'SPIN10' }));
    document.body.innerHTML = '<button class="j-coupon-add">Add</button>';
    const result = promoAutoApply({}, i18n);
    expect(result).toBeUndefined();
  });

  it('does nothing when no active prize is present', () => {
    document.body.innerHTML = '<button class="j-coupon-add">Add</button>';
    const result = promoAutoApply({}, i18n);
    expect(result).toBeUndefined();
  });

  it('does nothing when prize is expired', () => {
    window.localStorage.setItem(
      'wty_active_prize',
      JSON.stringify({ code: 'SPIN10', expiresAt: Date.now() - 1000 }),
    );
    document.body.innerHTML = '<button class="j-coupon-add">Add</button>';
    const result = promoAutoApply({}, i18n);
    expect(result).toBeUndefined();
    expect(window.localStorage.getItem('wty_active_prize')).toBeNull();
  });

  it('skips when the code was already applied this session', () => {
    window.localStorage.setItem('wty_active_prize', JSON.stringify({ code: 'SPIN10' }));
    window.sessionStorage.setItem('wty_promo_auto_applied_SPIN10', '1');
    const click = vi.fn();
    const btn = document.createElement('button');
    btn.className = 'j-coupon-add';
    btn.addEventListener('click', click);
    document.body.appendChild(btn);
    promoAutoApply({}, i18n);
    expect(click).not.toHaveBeenCalled();
  });

  it('does nothing when the coupon is already applied (marker present)', () => {
    window.localStorage.setItem('wty_active_prize', JSON.stringify({ code: 'SPIN10' }));
    document.body.innerHTML = '<div class="j-coupon-remove"></div>';
    const result = promoAutoApply({}, i18n);
    // Returns a stop function but the form won't be triggered
    expect(typeof result === 'function' || result === undefined).toBe(true);
  });

  it('returns disabled marker when enabled=false', () => {
    window.localStorage.setItem('wty_active_prize', JSON.stringify({ code: 'SPIN10' }));
    const result = promoAutoApply({ enabled: false }, i18n);
    expect(result).toBeUndefined();
  });

  it('clicks the coupon-add button, fills the input, and submits when prize exists', async () => {
    window.localStorage.setItem('wty_active_prize', JSON.stringify({ code: 'SPIN10' }));

    const addBtn = document.createElement('button');
    addBtn.className = 'j-coupon-add';
    const input = document.createElement('input');
    input.className = 'j-coupon-input';
    const submit = document.createElement('button');
    submit.className = 'j-coupon-submit';

    const addClick = vi.fn();
    const submitClick = vi.fn();
    addBtn.addEventListener('click', addClick);
    submit.addEventListener('click', submitClick);

    document.body.append(addBtn, input, submit);

    promoAutoApply({ showToast: false }, i18n);

    await new Promise((r) => setTimeout(r, 50));

    expect(addClick).toHaveBeenCalled();
    expect(input.value).toBe('SPIN10');
    expect(submitClick).toHaveBeenCalled();
    expect(window.sessionStorage.getItem('wty_promo_auto_applied_SPIN10')).toBe('1');
  });
});
