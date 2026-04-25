import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock @laxarevii/core ────────────────────────────────────────────────────
vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
}));

import smsOtpCheckout from './index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setPathname(path: string): void {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, pathname: path, search: '', href: `http://test.com${path}` },
    writable: true,
    configurable: true,
  });
}

function addPhoneInput(value = ''): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'tel';
  input.value = value;
  document.body.appendChild(input);
  return input;
}

function addSubmitButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'submit';
  document.body.appendChild(btn);
  return btn;
}

const BASE_CONFIG = {
  enabled: true,
  apiBaseUrl: 'https://api.test.com/api/v1',
  siteKey: 'test-key',
  triggerSources: ['all'] as const,
  phoneInputSelector: 'input[type="tel"]',
  submitButtonSelector: 'button[type="submit"]',
  codeLength: 6,
  resendCooldownSec: 60,
  codeTtlSec: 300,
  colors: { gradientStart: '#3B82F6', gradientEnd: '#A855F7' },
};

const I18N = {
  ua: {
    enterFullPhone: 'Введіть номер телефону',
    getConfirmationCode: 'Отримати код',
    enterSmsCode: 'Введіть код із SMS',
    confirm: 'Підтвердити',
    sendAgain: 'Надіслати знову',
    waitVerifying: 'Зачекайте {sec} сек...',
    verifying: 'Перевіряємо...',
    phoneConfirmed: 'Телефон підтверджено',
    invalidCode: 'Невірний код.',
    sendFailed: 'Не вдалося надіслати SMS.',
    tooManyAttempts: 'Забагато спроб.',
  },
};

// ─── UTM detector tests ───────────────────────────────────────────────────────

describe('UTM trigger detection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    sessionStorage.clear();
    localStorage.clear();
    setPathname('/checkout/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('activates when triggerSources includes "all"', () => {
    addPhoneInput('+380501234567');
    addSubmitButton();

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);

    expect(document.getElementById('wdg-smsotp-container')).not.toBeNull();
    cleanup?.();
  });

  it('activates for google referrer when "google" in triggerSources', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://www.google.com/search?q=test',
      configurable: true,
    });
    sessionStorage.clear();

    addPhoneInput('+380501234567');
    addSubmitButton();

    const cleanup = smsOtpCheckout(
      { ...BASE_CONFIG, triggerSources: ['google', 'facebook'] },
      I18N,
    );

    expect(document.getElementById('wdg-smsotp-container')).not.toBeNull();
    cleanup?.();

    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
  });

  it('does NOT activate for direct traffic when triggerSources=["google","facebook"]', () => {
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    sessionStorage.clear();

    Object.defineProperty(window, 'location', {
      value: { pathname: '/checkout/', search: '', href: 'http://test.com/checkout/' },
      writable: true,
      configurable: true,
    });

    addPhoneInput('+380501234567');
    addSubmitButton();

    const cleanup = smsOtpCheckout(
      { ...BASE_CONFIG, triggerSources: ['google', 'facebook'] },
      I18N,
    );

    expect(document.getElementById('wdg-smsotp-container')).toBeNull();
    cleanup?.();
  });

  it('persists utm source to sessionStorage from URL param', () => {
    sessionStorage.clear();
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/checkout/',
        search: '?utm_source=google',
        href: 'http://test.com/checkout/?utm_source=google',
      },
      writable: true,
      configurable: true,
    });

    addPhoneInput('+380501234567');
    addSubmitButton();

    const cleanup = smsOtpCheckout(
      { ...BASE_CONFIG, triggerSources: ['google', 'facebook'] },
      I18N,
    );

    expect(sessionStorage.getItem('wty_utm_source')).toBe('google');
    cleanup?.();
  });
});

// ─── Phone normalizer + validator ────────────────────────────────────────────

describe('phone validation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    sessionStorage.clear();
    localStorage.clear();
    setPathname('/checkout/');
  });

  it('enables "Get code" button when phone has 10+ digits', () => {
    const input = addPhoneInput('+380501234567');
    addSubmitButton();

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);
    const container = document.getElementById('wdg-smsotp-container');
    expect(container).not.toBeNull();

    // Phone is pre-populated, button may already be enabled
    input.dispatchEvent(new Event('input'));

    const btn = container!.querySelector<HTMLButtonElement>('[data-smsotp-getcode]');
    expect(btn).not.toBeNull();
    expect(btn!.disabled).toBe(false);

    cleanup?.();
  });

  it('keeps "Get code" disabled with short phone (< 10 digits)', () => {
    addPhoneInput('12345');
    addSubmitButton();

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);
    const container = document.getElementById('wdg-smsotp-container');

    const input = document.querySelector<HTMLInputElement>('input[type="tel"]')!;
    input.dispatchEvent(new Event('input'));

    const btn = container!.querySelector<HTMLButtonElement>('[data-smsotp-getcode]');
    expect(btn!.disabled).toBe(true);

    cleanup?.();
  });

  it('accepts phone with dashes and spaces by stripping non-digits', () => {
    addPhoneInput('+38 050 123-45-67');
    addSubmitButton();

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);
    const container = document.getElementById('wdg-smsotp-container');

    const input = document.querySelector<HTMLInputElement>('input[type="tel"]')!;
    input.dispatchEvent(new Event('input'));

    const btn = container!.querySelector<HTMLButtonElement>('[data-smsotp-getcode]');
    expect(btn!.disabled).toBe(false);

    cleanup?.();
  });
});

// ─── Submit blocking ──────────────────────────────────────────────────────────

describe('checkout submit blocking', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    sessionStorage.clear();
    localStorage.clear();
    setPathname('/checkout/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('blocks submit click when state is idle', () => {
    addPhoneInput('+380501234567');
    const submitBtn = addSubmitButton();

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    let defaultPrevented = false;
    submitBtn.addEventListener('click', (e) => {
      defaultPrevented = e.defaultPrevented;
    });

    submitBtn.dispatchEvent(clickEvent);
    expect(clickEvent.defaultPrevented).toBe(true);

    cleanup?.();
  });

  it('allows submit click after verified state', () => {
    addPhoneInput('+380501234567');
    const submitBtn = addSubmitButton();

    // Pre-seed verified state in localStorage
    const phone = '+380501234567';
    const persistedState = {
      status: 'verified',
      phone,
      requestId: 'req-123',
      savedAt: Date.now(),
    };
    localStorage.setItem(`wty_smsotp_state:${phone}`, JSON.stringify(persistedState));

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);

    // Give widget a tick to restore state
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    submitBtn.dispatchEvent(clickEvent);

    // After verified restoration, click should NOT be prevented
    expect(clickEvent.defaultPrevented).toBe(false);

    cleanup?.();
  });
});

// ─── API mocks: bootstrap + request + verify happy paths ────────────────────

describe('API flow (happy path)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    sessionStorage.clear();
    localStorage.clear();
    setPathname('/checkout/');
    vi.resetAllMocks();
    // Force token cache to expire between tests
    sessionStorage.removeItem('wty_smsotp_token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('bootstrap calls POST /widget/session and caches token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { token: 'tok-abc', expires_in: 3600 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    addPhoneInput('+380501234567');
    addSubmitButton();

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);
    const btn = document.querySelector<HTMLButtonElement>('[data-smsotp-getcode]')!;
    expect(btn.disabled).toBe(false);

    btn.click();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const bootstrapCall = fetchMock.mock.calls.find(
      (call) => (call[0] as string).includes('/widget/session'),
    );
    expect(bootstrapCall).toBeDefined();

    cleanup?.();
    vi.unstubAllGlobals();
  });

  it('requestOtp transitions to awaitingCode state', async () => {
    let fetchCallCount = 0;
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      fetchCallCount++;
      if ((url as string).includes('/widget/session')) {
        return { ok: true, json: async () => ({ data: { token: 'tok-abc', expires_in: 3600 } }) };
      }
      if ((url as string).includes('/sms-otp/request')) {
        return {
          ok: true,
          json: async () => ({
            data: { request_id: 'req-xyz', expires_at: new Date(Date.now() + 300000).toISOString() },
          }),
        };
      }
      return { ok: false, status: 500, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);

    addPhoneInput('+380501234567');
    addSubmitButton();

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);
    const btn = document.querySelector<HTMLButtonElement>('[data-smsotp-getcode]')!;
    btn.click();

    // Wait for all microtasks to flush
    await new Promise((resolve) => setTimeout(resolve, 20));

    const codeInput = document.querySelector<HTMLInputElement>('[data-smsotp-codeinput]');
    expect(codeInput).not.toBeNull();

    // At least the requestOtp call was made (bootstrap may be served from in-memory cache)
    expect(fetchCallCount).toBeGreaterThanOrEqual(1);
    const requestOtpCall = fetchMock.mock.calls.find(
      (call) => (call[0] as string).includes('/sms-otp/request'),
    );
    expect(requestOtpCall).toBeDefined();
    cleanup?.();
    vi.unstubAllGlobals();
  });

  it('verifyOtp transitions to verified state and persists to localStorage', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if ((url as string).includes('/widget/session')) {
        return { ok: true, json: async () => ({ data: { token: 'tok-abc', expires_in: 3600 } }) };
      }
      if ((url as string).includes('/sms-otp/request')) {
        return {
          ok: true,
          json: async () => ({
            data: { request_id: 'req-xyz', expires_at: new Date(Date.now() + 300000).toISOString() },
          }),
        };
      }
      if ((url as string).includes('/sms-otp/verify')) {
        return { ok: true, json: async () => ({ data: { verified: true } }) };
      }
      return { ok: false, status: 500, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);

    addPhoneInput('+380501234567');
    addSubmitButton();

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);
    const getBtn = document.querySelector<HTMLButtonElement>('[data-smsotp-getcode]')!;
    getBtn.click();

    await new Promise((resolve) => setTimeout(resolve, 20));

    const codeInput = document.querySelector<HTMLInputElement>('[data-smsotp-codeinput]');
    expect(codeInput).not.toBeNull();
    codeInput!.value = '123456';
    codeInput!.dispatchEvent(new Event('input'));

    const confirmBtn = document.querySelector<HTMLButtonElement>('[data-smsotp-confirm]')!;
    confirmBtn.click();

    await new Promise((resolve) => setTimeout(resolve, 20));

    const successEl = document.querySelector('.smsotp__success');
    expect(successEl).not.toBeNull();

    const verifiedValue = localStorage.getItem('wty_smsotp_verified');
    expect(verifiedValue).toContain('+380501234567');

    cleanup?.();
    vi.unstubAllGlobals();
  });
});

// ─── State machine transitions ───────────────────────────────────────────────

describe('state persistence', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    sessionStorage.clear();
    localStorage.clear();
    setPathname('/checkout/');
  });

  it('restores verified state from localStorage on re-mount', () => {
    const phone = '+380501234567';
    localStorage.setItem(
      `wty_smsotp_state:${phone}`,
      JSON.stringify({
        status: 'verified',
        phone,
        requestId: 'req-restore',
        savedAt: Date.now(),
      }),
    );

    addPhoneInput(phone);
    addSubmitButton();

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);
    const successEl = document.querySelector('.smsotp__success');
    expect(successEl).not.toBeNull();

    cleanup?.();
  });

  it('ignores expired state (older than codeTtlSec)', () => {
    const phone = '+380501234567';
    const EXPIRED_TTL = 600; // seconds ago
    localStorage.setItem(
      `wty_smsotp_state:${phone}`,
      JSON.stringify({
        status: 'verified',
        phone,
        requestId: 'req-old',
        savedAt: Date.now() - EXPIRED_TTL * 1000 - 1000,
      }),
    );

    addPhoneInput(phone);
    addSubmitButton();

    // Use codeTtlSec shorter than EXPIRED_TTL
    const cleanup = smsOtpCheckout({ ...BASE_CONFIG, codeTtlSec: 300 }, I18N);
    // Should show idle, not verified
    const successEl = document.querySelector('.smsotp__success');
    expect(successEl).toBeNull();

    const getBtn = document.querySelector('[data-smsotp-getcode]');
    expect(getBtn).not.toBeNull();

    cleanup?.();
  });

  it('restores awaitingCode state from localStorage', () => {
    const phone = '+380501234567';
    localStorage.setItem(
      `wty_smsotp_state:${phone}`,
      JSON.stringify({
        status: 'awaitingCode',
        requestId: 'req-pending',
        expiresAt: new Date(Date.now() + 200000).toISOString(),
        savedAt: Date.now(),
      }),
    );

    addPhoneInput(phone);
    addSubmitButton();

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);
    const codeInput = document.querySelector('[data-smsotp-codeinput]');
    expect(codeInput).not.toBeNull();

    cleanup?.();
  });
});

// ─── Cleanup ─────────────────────────────────────────────────────────────────

describe('cleanup', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    sessionStorage.clear();
    localStorage.clear();
    setPathname('/checkout/');
  });

  it('removes container and styles on cleanup', () => {
    addPhoneInput('+380501234567');
    addSubmitButton();

    const cleanup = smsOtpCheckout(BASE_CONFIG, I18N);
    expect(document.getElementById('wdg-smsotp-container')).not.toBeNull();
    expect(document.getElementById('wdg-smsotp-styles')).not.toBeNull();

    cleanup?.();

    expect(document.getElementById('wdg-smsotp-container')).toBeNull();
    expect(document.getElementById('wdg-smsotp-styles')).toBeNull();
  });

  it('does not mount when enabled=false', () => {
    addPhoneInput('+380501234567');
    addSubmitButton();

    const result = smsOtpCheckout({ ...BASE_CONFIG, enabled: false }, I18N);
    expect(document.getElementById('wdg-smsotp-container')).toBeNull();
    expect(result).toBeUndefined();
  });
});
