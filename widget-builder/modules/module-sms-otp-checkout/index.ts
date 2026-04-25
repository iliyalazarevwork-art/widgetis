import {
  smsOtpCheckoutSchema,
  smsOtpCheckoutI18nSchema,
  type SmsOtpCheckoutConfig,
  type SmsOtpI18nEntry,
} from './schema';
import { getLanguage } from '@laxarevii/core';

// ─── Constants ──────────────────────────────────────────────────────────────

const CONTAINER_ID = 'wdg-smsotp-container';
const STYLES_ID = 'wdg-smsotp-styles';
const SESSION_TOKEN_KEY = 'wty_smsotp_token';
const SESSION_UTM_KEY = 'wty_utm_source';
const VERIFIED_KEY = 'wty_smsotp_verified';
const STATE_KEY_PREFIX = 'wty_smsotp_state:';

const GOOGLE_RE = /google\./i;
const FACEBOOK_RE = /facebook\.|fb\.com|instagram\./i;

// ─── State machine ───────────────────────────────────────────────────────────

type OtpState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'awaitingCode'; requestId: string; expiresAt: string }
  | { status: 'verifying'; requestId: string }
  | { status: 'verified'; phone: string; requestId: string }
  | { status: 'failed'; error: string };

interface PersistedState {
  status: OtpState['status'];
  requestId?: string;
  expiresAt?: string;
  phone?: string;
  savedAt: number;
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone;
  const start = phone.slice(0, Math.max(4, phone.length - 7));
  const end = phone.slice(-3);
  return `${start}****${end}`;
}

function log(msg: string, ...args: unknown[]): void {
  console.log(`[smsotp] ${msg}`, ...args);
}

function warn(msg: string, ...args: unknown[]): void {
  console.warn(`[smsotp] ${msg}`, ...args);
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function stateKey(phone: string): string {
  return `${STATE_KEY_PREFIX}${phone}`;
}

function saveState(phone: string, state: OtpState): void {
  try {
    const entry: PersistedState = {
      status: state.status,
      savedAt: Date.now(),
    };
    if (state.status === 'awaitingCode') {
      entry.requestId = state.requestId;
      entry.expiresAt = state.expiresAt;
    } else if (state.status === 'verifying') {
      entry.requestId = state.requestId;
    } else if (state.status === 'verified') {
      entry.phone = state.phone;
      entry.requestId = state.requestId;
    }
    localStorage.setItem(stateKey(phone), JSON.stringify(entry));
  } catch {
    // storage unavailable — no-op
  }
}

function loadState(phone: string, ttlSec: number): OtpState | null {
  try {
    const raw = localStorage.getItem(stateKey(phone));
    if (!raw) return null;
    const entry: PersistedState = JSON.parse(raw) as PersistedState;
    const ageSec = (Date.now() - entry.savedAt) / 1000;
    if (ageSec > ttlSec) {
      localStorage.removeItem(stateKey(phone));
      return null;
    }
    if (entry.status === 'awaitingCode' && entry.requestId && entry.expiresAt) {
      return { status: 'awaitingCode', requestId: entry.requestId, expiresAt: entry.expiresAt };
    }
    if (entry.status === 'verified' && entry.phone && entry.requestId) {
      return { status: 'verified', phone: entry.phone, requestId: entry.requestId };
    }
    // transient states (sending/verifying/failed) reset to idle on reload
    return null;
  } catch {
    return null;
  }
}

// ─── UTM detection ───────────────────────────────────────────────────────────

function detectUtmSource(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get('utm_source');
    if (utm) {
      sessionStorage.setItem(SESSION_UTM_KEY, utm);
      return utm;
    }
    const persisted = sessionStorage.getItem(SESSION_UTM_KEY);
    if (persisted) return persisted;

    const ref = document.referrer;
    if (GOOGLE_RE.test(ref)) {
      sessionStorage.setItem(SESSION_UTM_KEY, 'google');
      return 'google';
    }
    if (FACEBOOK_RE.test(ref)) {
      sessionStorage.setItem(SESSION_UTM_KEY, 'facebook');
      return 'facebook';
    }
    return null;
  } catch {
    return null;
  }
}

function shouldTrigger(
  sources: SmsOtpCheckoutConfig['triggerSources'],
  detectedSource: string | null,
): boolean {
  if (sources.includes('all')) return true;
  if (!detectedSource) return false;
  if (detectedSource.includes('google') && sources.includes('google')) return true;
  if ((detectedSource.includes('facebook') || detectedSource.includes('instagram')) && sources.includes('facebook'))
    return true;
  return false;
}

// ─── Session token ───────────────────────────────────────────────────────────

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

function loadTokenFromSession(): TokenCache | null {
  try {
    const raw = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TokenCache;
    if (Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveTokenToSession(cache: TokenCache): void {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, JSON.stringify(cache));
  } catch {
    // no-op
  }
}

async function bootstrap(apiBaseUrl: string, siteKey: string): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const fromSession = loadTokenFromSession();
  if (fromSession) {
    tokenCache = fromSession;
    return fromSession.token;
  }

  log('bootstrapping widget session...');

  const res = await fetch(`${apiBaseUrl}/widget/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ siteKey }),
  });

  if (!res.ok) {
    throw new Error(`Bootstrap failed: HTTP ${res.status}`);
  }

  const json = (await res.json()) as { data?: { token?: string; expires_in?: number } };
  const token = json?.data?.token;
  if (!token) throw new Error('Bootstrap failed: no token in response');

  const expiresIn = json?.data?.expires_in ?? 3600;
  const cache: TokenCache = { token, expiresAt: Date.now() + expiresIn * 1000 - 60_000 };
  tokenCache = cache;
  saveTokenToSession(cache);

  log('session bootstrapped');
  return token;
}

async function requestOtp(
  apiBaseUrl: string,
  token: string,
  phone: string,
  locale: string,
): Promise<{ requestId: string; expiresAt: string }> {
  const res = await fetch(`${apiBaseUrl}/widget/sms-otp/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ phone, locale }),
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    const code = json?.error?.code ?? '';
    const message = json?.error?.message ?? `HTTP ${res.status}`;
    const err = new Error(message) as Error & { code?: string };
    err.code = code;
    throw err;
  }

  const json = (await res.json()) as { data?: { request_id?: string; expires_at?: string } };
  const requestId = json?.data?.request_id;
  const expiresAt = json?.data?.expires_at;
  if (!requestId || !expiresAt) throw new Error('requestOtp: malformed response');
  return { requestId, expiresAt };
}

async function verifyOtp(
  apiBaseUrl: string,
  token: string,
  requestId: string,
  code: string,
): Promise<void> {
  const res = await fetch(`${apiBaseUrl}/widget/sms-otp/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ request_id: requestId, code }),
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    const code2 = json?.error?.code ?? '';
    const message = json?.error?.message ?? `HTTP ${res.status}`;
    const err = new Error(message) as Error & { code?: string };
    err.code = code2;
    throw err;
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function injectStyles(cfg: SmsOtpCheckoutConfig): void {
  if (document.getElementById(STYLES_ID)) return;
  const s = document.createElement('style');
  s.id = STYLES_ID;
  s.textContent = `
    #${CONTAINER_ID} {
      margin-top: 10px;
      padding: 14px 16px;
      background: #141414;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #f0f0f0;
      box-shadow: 0 4px 18px rgba(0,0,0,0.25);
    }
    #${CONTAINER_ID} .smsotp__label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #888;
      margin-bottom: 10px;
    }
    #${CONTAINER_ID} .smsotp__hint {
      font-size: 12px;
      color: #888;
      margin-bottom: 10px;
    }
    #${CONTAINER_ID} .smsotp__code-row {
      display: flex;
      gap: 8px;
      align-items: stretch;
    }
    #${CONTAINER_ID} .smsotp__code-input {
      flex: 1;
      height: 42px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.12);
      background: #1a1a1a;
      color: #f0f0f0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-align: center;
      outline: none;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    #${CONTAINER_ID} .smsotp__code-input:focus {
      border-color: rgba(59,130,246,0.5);
    }
    #${CONTAINER_ID} .smsotp__code-input.smsotp__code-input--error {
      border-color: rgba(239,68,68,0.6);
    }
    #${CONTAINER_ID} .smsotp__btn {
      height: 42px;
      border-radius: 8px;
      border: none;
      padding: 0 16px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      white-space: nowrap;
      background: linear-gradient(135deg, ${cfg.colors.gradientStart} 0%, ${cfg.colors.gradientEnd} 100%);
      box-shadow: 0 4px 14px rgba(59,130,246,0.25);
      transition: opacity 0.15s, transform 0.15s;
      -webkit-tap-highlight-color: transparent;
      min-width: 110px;
    }
    #${CONTAINER_ID} .smsotp__btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      box-shadow: none;
    }
    #${CONTAINER_ID} .smsotp__btn:not(:disabled):active {
      opacity: 0.85;
      transform: scale(0.98);
    }
    #${CONTAINER_ID} .smsotp__get-btn {
      width: 100%;
      height: 42px;
      border-radius: 8px;
      border: none;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      background: linear-gradient(135deg, ${cfg.colors.gradientStart} 0%, ${cfg.colors.gradientEnd} 100%);
      box-shadow: 0 4px 14px rgba(59,130,246,0.25);
      transition: opacity 0.15s, transform 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    #${CONTAINER_ID} .smsotp__get-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      box-shadow: none;
    }
    #${CONTAINER_ID} .smsotp__get-btn:not(:disabled):active {
      opacity: 0.85;
      transform: scale(0.98);
    }
    #${CONTAINER_ID} .smsotp__resend-row {
      margin-top: 10px;
      font-size: 12px;
      color: #888;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #${CONTAINER_ID} .smsotp__resend-btn {
      background: none;
      border: none;
      padding: 0;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      color: #3b82f6;
      text-decoration: underline;
    }
    #${CONTAINER_ID} .smsotp__resend-btn:disabled {
      color: #888;
      cursor: not-allowed;
      text-decoration: none;
    }
    #${CONTAINER_ID} .smsotp__error {
      margin-top: 8px;
      font-size: 12px;
      color: #f87171;
    }
    #${CONTAINER_ID} .smsotp__success {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #34d399;
    }
    #${CONTAINER_ID} .smsotp__success-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(16,185,129,0.2);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    @keyframes smsotp-shake {
      0%,100% { transform: translateX(0); }
      20%,60% { transform: translateX(-5px); }
      40%,80% { transform: translateX(5px); }
    }
    #${CONTAINER_ID}.smsotp--shake {
      animation: smsotp-shake 0.4s ease;
    }
  `;
  document.head.appendChild(s);
}

// ─── DOM builders ─────────────────────────────────────────────────────────────

function buildIdleView(i18n: SmsOtpI18nEntry): HTMLElement {
  const wrap = document.createElement('div');
  const label = document.createElement('div');
  label.className = 'smsotp__label';
  label.textContent = 'SMS-підтвердження';

  const hint = document.createElement('div');
  hint.className = 'smsotp__hint';
  hint.textContent = i18n.enterFullPhone;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'smsotp__get-btn';
  btn.textContent = i18n.getConfirmationCode;
  btn.disabled = true;
  btn.setAttribute('data-smsotp-getcode', '1');

  wrap.appendChild(label);
  wrap.appendChild(hint);
  wrap.appendChild(btn);
  return wrap;
}

function buildAwaitingCodeView(i18n: SmsOtpI18nEntry, codeLength: number): HTMLElement {
  const wrap = document.createElement('div');

  const label = document.createElement('div');
  label.className = 'smsotp__label';
  label.textContent = 'SMS-підтвердження';

  const hint = document.createElement('div');
  hint.className = 'smsotp__hint';
  hint.textContent = i18n.enterSmsCode;

  const row = document.createElement('div');
  row.className = 'smsotp__code-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'numeric';
  input.pattern = '[0-9]*';
  input.maxLength = codeLength;
  input.className = 'smsotp__code-input';
  input.setAttribute('autocomplete', 'one-time-code');
  input.setAttribute('data-smsotp-codeinput', '1');

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'smsotp__btn';
  confirmBtn.textContent = i18n.confirm;
  confirmBtn.disabled = true;
  confirmBtn.setAttribute('data-smsotp-confirm', '1');

  row.appendChild(input);
  row.appendChild(confirmBtn);

  const resendRow = document.createElement('div');
  resendRow.className = 'smsotp__resend-row';
  resendRow.setAttribute('data-smsotp-resend-row', '1');

  const resendBtn = document.createElement('button');
  resendBtn.type = 'button';
  resendBtn.className = 'smsotp__resend-btn';
  resendBtn.textContent = i18n.sendAgain;
  resendBtn.disabled = true;
  resendBtn.setAttribute('data-smsotp-resend', '1');

  const countdown = document.createElement('span');
  countdown.setAttribute('data-smsotp-countdown', '1');

  resendRow.appendChild(resendBtn);
  resendRow.appendChild(countdown);

  wrap.appendChild(label);
  wrap.appendChild(hint);
  wrap.appendChild(row);
  wrap.appendChild(resendRow);
  return wrap;
}

function buildVerifiedView(i18n: SmsOtpI18nEntry): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'smsotp__success';

  const icon = document.createElement('span');
  icon.className = 'smsotp__success-icon';
  icon.innerHTML =
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#34d399" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const text = document.createElement('span');
  text.textContent = i18n.phoneConfirmed;

  wrap.appendChild(icon);
  wrap.appendChild(text);
  return wrap;
}

// ─── Main widget ─────────────────────────────────────────────────────────────

export default function smsOtpCheckout(
  rawConfig: unknown,
  rawI18n: Record<string, unknown>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  let config: SmsOtpCheckoutConfig;
  let i18nMap: ReturnType<typeof smsOtpCheckoutI18nSchema.parse>;
  try {
    config = smsOtpCheckoutSchema.parse(rawConfig);
    i18nMap = smsOtpCheckoutI18nSchema.parse(rawI18n);
  } catch (err) {
    warn('invalid config or i18n, widget disabled', err);
    return;
  }

  if (!config.enabled) {
    log('disabled via config');
    return;
  }

  const lang = getLanguage();
  const i18n: SmsOtpI18nEntry =
    i18nMap[lang] ?? i18nMap['ua'] ?? i18nMap['ru'] ?? Object.values(i18nMap)[0];
  if (!i18n) {
    warn('no i18n found, widget disabled');
    return;
  }

  // ─ Page detection ─
  const hasPhoneInput = (): boolean => document.querySelector(config.phoneInputSelector) !== null;
  const hasSubmitBtn = (): boolean => document.querySelector(config.submitButtonSelector) !== null;
  const isCheckoutPage = (): boolean =>
    /\/checkout\//i.test(window.location.pathname) || (hasPhoneInput() && hasSubmitBtn());

  if (!isCheckoutPage()) {
    log('not a checkout page, skipping');
    return;
  }

  // ─ UTM trigger ─
  const utmSource = detectUtmSource();
  if (!shouldTrigger(config.triggerSources, utmSource)) {
    log('utm trigger not matched (source=%s, triggers=%o)', utmSource, config.triggerSources);
    return;
  }

  log('activating on checkout page (utm=%s)', utmSource ?? 'n/a');
  injectStyles(config);

  // ─ State ─
  let currentState: OtpState = { status: 'idle' };
  let currentPhone = '';
  let resendTimer: ReturnType<typeof setInterval> | null = null;
  let container: HTMLElement | null = null;
  let phoneInput: HTMLElement | null = null;
  let submitListenerCleanup: (() => void) | null = null;
  let mutationObserver: MutationObserver | null = null;

  function setState(nextState: OtpState): void {
    currentState = nextState;
    if (currentPhone) saveState(currentPhone, nextState);
    render();
  }

  function shake(): void {
    if (!container) return;
    container.classList.remove('smsotp--shake');
    // force reflow to restart animation
    void container.offsetWidth;
    container.classList.add('smsotp--shake');
  }

  function startResendCountdown(): void {
    if (resendTimer) clearInterval(resendTimer);
    const resendBtn = container?.querySelector<HTMLButtonElement>('[data-smsotp-resend]');
    const countdown = container?.querySelector<HTMLElement>('[data-smsotp-countdown]');
    if (!resendBtn || !countdown) return;

    let remaining = config.resendCooldownSec;
    countdown.textContent = `(${remaining}s)`;
    resendBtn.disabled = true;

    resendTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(resendTimer!);
        resendTimer = null;
        if (countdown) countdown.textContent = '';
        if (resendBtn) resendBtn.disabled = false;
      } else {
        if (countdown) countdown.textContent = `(${remaining}s)`;
      }
    }, 1000);
  }

  function getCurrentPhone(): string {
    const el = document.querySelector<HTMLInputElement>(config.phoneInputSelector);
    return el ? normalizePhone(el.value) : '';
  }

  async function handleGetCode(): Promise<void> {
    const phone = getCurrentPhone();
    if (!isValidPhone(phone)) {
      shake();
      return;
    }

    currentPhone = phone;
    setState({ status: 'sending' });

    try {
      const token = await bootstrap(config.apiBaseUrl, config.siteKey);
      const { requestId, expiresAt } = await requestOtp(config.apiBaseUrl, token, phone, lang);
      log('OTP requested for %s', maskPhone(phone));
      setState({ status: 'awaitingCode', requestId, expiresAt });
      startResendCountdown();
    } catch (err) {
      const errCode = (err as { code?: string }).code ?? '';
      const message =
        errCode === 'TOO_MANY_ATTEMPTS'
          ? i18n.tooManyAttempts
          : i18n.sendFailed;
      warn('requestOtp failed', err);
      setState({ status: 'failed', error: message });
    }
  }

  async function handleConfirm(): Promise<void> {
    if (currentState.status !== 'awaitingCode') return;
    const requestId = currentState.requestId;

    const codeInput = container?.querySelector<HTMLInputElement>('[data-smsotp-codeinput]');
    if (!codeInput) return;
    const code = codeInput.value.trim();

    if (code.length !== config.codeLength) {
      codeInput.classList.add('smsotp__code-input--error');
      return;
    }

    setState({ status: 'verifying', requestId });

    try {
      const token = await bootstrap(config.apiBaseUrl, config.siteKey);
      await verifyOtp(config.apiBaseUrl, token, requestId, code);
      log('OTP verified for %s', maskPhone(currentPhone));

      // Mark phone as verified so checkout can proceed
      try {
        localStorage.setItem(VERIFIED_KEY, `${currentPhone}:${requestId}`);
      } catch {
        // no-op
      }

      setState({ status: 'verified', phone: currentPhone, requestId });
    } catch (err) {
      const errCode = (err as { code?: string }).code ?? '';
      const message =
        errCode === 'TOO_MANY_ATTEMPTS'
          ? i18n.tooManyAttempts
          : i18n.invalidCode;
      warn('verifyOtp failed', err);
      setState({ status: 'failed', error: message });
    }
  }

  function render(): void {
    if (!container) return;
    container.innerHTML = '';

    const state = currentState;

    if (state.status === 'idle' || state.status === 'sending') {
      const view = buildIdleView(i18n);
      const getBtn = view.querySelector<HTMLButtonElement>('[data-smsotp-getcode]')!;
      const phone = getCurrentPhone();
      getBtn.disabled = !isValidPhone(phone) || state.status === 'sending';
      if (state.status === 'sending') {
        getBtn.textContent = i18n.verifying;
      }
      getBtn.addEventListener('click', () => { void handleGetCode(); });
      container.appendChild(view);
      return;
    }

    if (state.status === 'awaitingCode' || state.status === 'verifying') {
      const view = buildAwaitingCodeView(i18n, config.codeLength);

      const codeInput = view.querySelector<HTMLInputElement>('[data-smsotp-codeinput]')!;
      const confirmBtn = view.querySelector<HTMLButtonElement>('[data-smsotp-confirm]')!;
      const resendBtn = view.querySelector<HTMLButtonElement>('[data-smsotp-resend]')!;

      if (state.status === 'verifying') {
        codeInput.disabled = true;
        confirmBtn.disabled = true;
        confirmBtn.textContent = i18n.verifying;
        resendBtn.disabled = true;
      } else {
        codeInput.addEventListener('input', () => {
          codeInput.classList.remove('smsotp__code-input--error');
          confirmBtn.disabled = codeInput.value.trim().length !== config.codeLength;
        });
        confirmBtn.addEventListener('click', () => { void handleConfirm(); });
        resendBtn.addEventListener('click', () => { void handleGetCode(); });
      }

      container.appendChild(view);

      if (state.status === 'awaitingCode') {
        startResendCountdown();
      }
      return;
    }

    if (state.status === 'verified') {
      container.appendChild(buildVerifiedView(i18n));
      return;
    }

    if (state.status === 'failed') {
      // Show idle view again with error message below
      const view = buildIdleView(i18n);
      const getBtn = view.querySelector<HTMLButtonElement>('[data-smsotp-getcode]')!;
      const phone = getCurrentPhone();
      getBtn.disabled = !isValidPhone(phone);
      getBtn.addEventListener('click', () => { void handleGetCode(); });

      const errMsg = document.createElement('div');
      errMsg.className = 'smsotp__error';
      errMsg.textContent = state.error;
      view.appendChild(errMsg);

      container.appendChild(view);
    }
  }

  function mount(): void {
    if (document.getElementById(CONTAINER_ID)) return;

    phoneInput = document.querySelector<HTMLElement>(config.phoneInputSelector);
    if (!phoneInput) {
      log('phone input not found yet, retrying...');
      return;
    }

    container = document.createElement('div');
    container.id = CONTAINER_ID;

    // Insert after phone input
    phoneInput.insertAdjacentElement('afterend', container);

    // Restore state from localStorage
    const normalizedPhone = normalizePhone(
      (phoneInput as HTMLInputElement).value ?? '',
    );
    if (normalizedPhone && isValidPhone(normalizedPhone)) {
      currentPhone = normalizedPhone;
      const restored = loadState(normalizedPhone, config.codeTtlSec);
      if (restored) {
        currentState = restored;
        log('restored state: %s for %s', restored.status, maskPhone(normalizedPhone));
      }
    }

    render();

    // Watch phone input changes to enable/disable get-code button
    phoneInput.addEventListener('input', () => {
      const phone = getCurrentPhone();
      if (phone !== currentPhone && currentState.status !== 'verified') {
        currentPhone = phone;
        if (currentState.status === 'idle' || currentState.status === 'failed') {
          const getBtn = container?.querySelector<HTMLButtonElement>('[data-smsotp-getcode]');
          if (getBtn) {
            getBtn.disabled = !isValidPhone(phone);
          }
        }
      }
    });

    // Block checkout submit if not verified
    const submitEl = document.querySelector<HTMLElement>(config.submitButtonSelector);
    if (submitEl) {
      const submitHandler = (e: Event): void => {
        if (currentState.status === 'verified') return;
        e.preventDefault();
        e.stopImmediatePropagation();
        container?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        shake();
        log('checkout blocked — phone not verified');
      };
      submitEl.addEventListener('click', submitHandler, true);
      submitListenerCleanup = () => submitEl.removeEventListener('click', submitHandler, true);
    }

    log('mounted');
  }

  // Observe DOM for phone input to appear (handles SPA/AJAX checkouts)
  function startObserver(): void {
    if (mutationObserver) return;
    mutationObserver = new MutationObserver(() => {
      if (!document.getElementById(CONTAINER_ID)) {
        mount();
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { mount(); startObserver(); }, { once: true });
  } else {
    mount();
    startObserver();
  }

  // Cleanup
  return () => {
    if (resendTimer) clearInterval(resendTimer);
    mutationObserver?.disconnect();
    submitListenerCleanup?.();
    document.getElementById(CONTAINER_ID)?.remove();
    document.getElementById(STYLES_ID)?.remove();
    container = null;
    phoneInput = null;
    log('cleaned up');
  };
}
