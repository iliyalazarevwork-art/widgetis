import {
  prizeBannerSchema,
  prizeBannerI18nSchema,
  type PrizeBannerConfig,
  type PrizeBannerInput,
  type PrizeBannerI18nEntry,
} from './schema';
import { getLanguage } from '@laxarevii/core';

const HOST_ID = 'wdg-prize-banner-host';
const SESSION_DISMISS_KEY = 'wty_prize_banner_dismissed_session';

type ActivePrize = {
  code: string;
  label: string;
  iconType?: string | null;
  awardedAt: number;
  expiresAt?: number;
  source?: string;
};

export default function prizeBanner(
  rawConfig: PrizeBannerInput,
  rawI18n: Record<string, PrizeBannerI18nEntry>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = prizeBannerSchema.parse(rawConfig);
  const i18nMap = prizeBannerI18nSchema.parse(rawI18n);

  if (!config.enabled) {
    console.warn('[widgetality] prize-banner: ⚠️ disabled');
    return;
  }

  console.log('[widgetality] prize-banner: ✅ activated');

  const lang = getLanguage();
  const i18n = i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  const prize = readActivePrize(config.storageKey);
  if (!prize) return;

  if (config.hideOnCheckout && isCheckoutPage()) return;
  if (isDismissedThisSession()) return;

  const hostEl = renderBanner(config, i18n, prize);
  document.body.appendChild(hostEl);

  return () => {
    hostEl.remove();
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readActivePrize(key: string): ActivePrize | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActivePrize;
    if (!parsed || typeof parsed.code !== 'string' || typeof parsed.label !== 'string') {
      return null;
    }
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key);
      return null;
    }
    if (parsed.code.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isCheckoutPage(): boolean {
  const path = (window.location.pathname || '').toLowerCase();
  return path.includes('/checkout') || path.includes('/order');
}

function isDismissedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberDismissed(): void {
  try {
    window.sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function renderBanner(
  config: PrizeBannerConfig,
  i18n: PrizeBannerI18nEntry,
  prize: ActivePrize,
): HTMLElement {
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = `position:fixed;left:0;right:0;bottom:0;z-index:${config.zIndex};pointer-events:none;`;

  const shadow = host.attachShadow({ mode: 'open' });
  const styleEl = document.createElement('style');
  styleEl.textContent = buildStyles(config);
  shadow.appendChild(styleEl);

  const text = i18n.message
    .replace('{label}', escapeHtml(prize.label))
    .replace('{code}', `<code class="pb__code">${escapeHtml(prize.code)}</code>`);

  const wrapper = document.createElement('div');
  wrapper.className = 'pb';
  wrapper.innerHTML = `
    <div class="pb__inner">
      <span class="pb__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13"/><path d="M3 12h18"/><path d="M7.5 8a2.5 2.5 0 1 1 0-5C9 3 12 5 12 8c0-3 3-5 4.5-5a2.5 2.5 0 1 1 0 5"/></svg>
      </span>
      <span class="pb__text">${text}</span>
      <button class="pb__copy" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span class="pb__copy-label">${escapeHtml(i18n.copyLabel)}</span>
      </button>
      <button class="pb__close" type="button" aria-label="${escapeAttr(i18n.closeLabel)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;
  shadow.appendChild(wrapper);

  const copyBtn = wrapper.querySelector<HTMLButtonElement>('.pb__copy')!;
  const copyLabelEl = wrapper.querySelector<HTMLElement>('.pb__copy-label')!;
  copyBtn.addEventListener('click', () => {
    copyToClipboard(prize.code);
    copyLabelEl.textContent = i18n.copiedLabel;
    copyBtn.classList.add('pb__copy--copied');
  });

  wrapper.querySelector<HTMLButtonElement>('.pb__close')!.addEventListener('click', () => {
    rememberDismissed();
    wrapper.classList.add('pb--leaving');
    setTimeout(() => host.remove(), 220);
  });

  return host;
}

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

function copyToClipboard(text: string): void {
  try {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      return;
    }
    fallbackCopy(text);
  } catch {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string): void {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  } catch {
    // ignore
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// ---------------------------------------------------------------------------
// Styles (inside shadow root only — host CSS не протекает)
// ---------------------------------------------------------------------------

function buildStyles(config: PrizeBannerConfig): string {
  return `
:host { all: initial; }
* { box-sizing: border-box; }
.pb {
  --pb-bg: ${config.backgroundColor};
  --pb-fg: ${config.textColor};
  --pb-accent: ${config.accentColor};
  --pb-border: ${config.borderColor};
  --pb-radius: ${config.borderRadius}px;
  pointer-events: auto;
  margin: 12px 12px calc(12px + env(safe-area-inset-bottom));
  background: var(--pb-bg);
  color: var(--pb-fg);
  border: 1px solid var(--pb-border);
  border-radius: var(--pb-radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .12);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  transition: opacity .22s ease, transform .22s ease;
  animation: pb-slide-in .35s cubic-bezier(.16, 1, .3, 1) both;
}
.pb.pb--leaving { opacity: 0; transform: translateY(8px); }
.pb__inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  flex-wrap: nowrap;
}
.pb__icon {
  flex: 0 0 auto;
  width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--pb-accent);
  color: #ffffff;
  border-radius: 50%;
}
.pb__icon svg { width: 18px; height: 18px; }
.pb__text {
  flex: 1 1 auto;
  font-size: 14px;
  line-height: 1.35;
  color: var(--pb-fg);
  overflow-wrap: anywhere;
}
.pb__code {
  display: inline-block;
  padding: 2px 8px;
  margin: 0 2px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  font-weight: 700;
  background: rgba(0, 0, 0, .06);
  border: 1px solid var(--pb-border);
  border-radius: 6px;
  letter-spacing: .04em;
  color: var(--pb-fg);
}
.pb__copy {
  flex: 0 0 auto;
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--pb-accent);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: filter .15s ease, transform .05s ease;
  min-height: 36px;
}
.pb__copy:hover { filter: brightness(1.07); }
.pb__copy:active { transform: scale(.97); }
.pb__copy--copied { filter: brightness(1.12); }
.pb__copy svg { width: 14px; height: 14px; }
.pb__close {
  flex: 0 0 auto;
  background: transparent;
  border: none;
  color: var(--pb-fg);
  opacity: .55;
  cursor: pointer;
  padding: 4px;
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
}
.pb__close:hover { opacity: 1; background: rgba(0, 0, 0, .05); }
.pb__close svg { width: 14px; height: 14px; }

@keyframes pb-slide-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Desktop — компактнее, ближе к нижнему правому углу */
@media (min-width: 720px) {
  :host { left: auto; right: 0; max-width: 520px; }
  .pb { margin: 16px; }
}
@media (max-width: 480px) {
  .pb__inner { gap: 8px; padding: 10px 12px; }
  .pb__text { font-size: 13px; }
  .pb__copy { padding: 7px 10px; font-size: 12px; min-height: 34px; }
  .pb__copy-label { display: none; } /* На очень узких — оставляем только иконку */
  .pb__icon { width: 28px; height: 28px; }
  .pb__icon svg { width: 16px; height: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .pb { animation: none; transition: none; }
}
`;
}
