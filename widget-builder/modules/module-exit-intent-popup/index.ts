import {
  exitIntentPopupSchema,
  exitIntentPopupI18nSchema,
  type ExitIntentPopupConfig,
  type ExitIntentPopupInput,
} from './schema';
import { getLanguage } from '@laxarevii/core';

const ROOT_ID = 'wdg-exit-intent';
const STYLES_ID = 'wdg-exit-intent-styles';
const STORAGE_KEY = 'wty_exit_intent_seen_at';
const EMAIL_KEY = 'wty_exit_intent_email';

type I18nEntry = {
  title: string;
  subtitle: string;
  emailPlaceholder: string;
  ctaButton: string;
  copyButton: string;
  copiedLabel: string;
  promoLabel: string;
  noThanks: string;
  successTitle: string;
  successText: string;
};

export default function exitIntentPopup(
  rawConfig: ExitIntentPopupInput,
  rawI18n: Record<string, I18nEntry>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = exitIntentPopupSchema.parse(rawConfig);
  const i18nMap = exitIntentPopupI18nSchema.parse(rawI18n);

  if (!config.enabled) {
    console.warn('[widgetality] exit-intent: ⚠️ disabled');
    return;
  }

  if (isSuppressedByCooldown(config.cooldownHours)) {
    console.warn('[widgetality] exit-intent: ⏳ cooldown active, skipping');
    return;
  }

  if (isHiddenByUtm(config.hideOnUtmSources)) {
    console.warn('[widgetality] exit-intent: 🚫 hidden by UTM source');
    return;
  }

  const lang = getLanguage();
  const i18n = i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  console.log('[widgetality] exit-intent: ✅ activated');

  injectStyles(config);

  const startedAt = Date.now();
  let armed = false;
  let shown = false;
  let root: HTMLElement | null = null;

  let armTimer: number | null = null;
  if (config.minTimeOnPageSec <= 0) {
    armed = true;
  } else {
    armTimer = window.setTimeout(() => {
      armed = true;
    }, config.minTimeOnPageSec * 1000);
  }

  function trigger(): void {
    if (shown || !armed) return;
    if (Date.now() - startedAt < config.minTimeOnPageSec * 1000) return;
    shown = true;
    root = renderPopup(config, i18n);
    document.body.appendChild(root);
    requestAnimationFrame(() => root?.classList.add('wdg-eip--visible'));
    rememberSeen();
  }

  function onMouseLeave(e: MouseEvent): void {
    // Только верхний край — типичный exit-intent
    if (e.clientY <= 0 && (e.relatedTarget === null || (e.relatedTarget as Node).nodeName === 'HTML')) {
      trigger();
    }
  }

  function onPopState(): void {
    // Mobile back-button intent
    trigger();
  }

  function onVisibility(): void {
    if (document.visibilityState === 'hidden') {
      // Не открывать сразу — ждём возврата вкладки
      return;
    }
  }

  document.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('popstate', onPopState);
  document.addEventListener('visibilitychange', onVisibility);

  // Push history state so first back-button click triggers popup instead of leaving site
  if (isMobile()) {
    try {
      history.pushState({ wdgExitIntent: true }, '', window.location.href);
    } catch {
      // ignore
    }
  }

  return () => {
    if (armTimer !== null) clearTimeout(armTimer);
    document.removeEventListener('mouseleave', onMouseLeave);
    window.removeEventListener('popstate', onPopState);
    document.removeEventListener('visibilitychange', onVisibility);
    root?.remove();
    document.getElementById(STYLES_ID)?.remove();
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768;
}

function isSuppressedByCooldown(hours: number): boolean {
  try {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) return false;
    const ts = parseInt(seen, 10);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < hours * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function rememberSeen(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

function isHiddenByUtm(sources: string[]): boolean {
  if (sources.length === 0) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const src = (params.get('utm_source') ?? '').toLowerCase();
    return sources.map((s) => s.toLowerCase()).includes(src);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function renderPopup(config: ExitIntentPopupConfig, i18n: I18nEntry): HTMLElement {
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.className = 'wdg-eip';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'wdg-eip-title');

  const imageBlock = config.imageUrl
    ? `<div class="wdg-eip__image" style="background-image:url('${escapeAttr(config.imageUrl)}')"></div>`
    : '';

  const emailBlock = config.collectEmail
    ? `<input class="wdg-eip__email" type="email" placeholder="${escapeAttr(i18n.emailPlaceholder)}" autocomplete="email" />`
    : '';

  root.innerHTML = `
    <div class="wdg-eip__backdrop"></div>
    <div class="wdg-eip__card" role="document">
      <button class="wdg-eip__close" aria-label="close" type="button">×</button>
      ${imageBlock}
      <div class="wdg-eip__body">
        <h2 class="wdg-eip__title" id="wdg-eip-title">${escapeHtml(i18n.title)}</h2>
        <p class="wdg-eip__subtitle">${escapeHtml(i18n.subtitle)}</p>
        <div class="wdg-eip__promo">
          <span class="wdg-eip__promo-label">${escapeHtml(i18n.promoLabel)}</span>
          <code class="wdg-eip__promo-code">${escapeHtml(config.promoCode)}</code>
          <button class="wdg-eip__copy" type="button">${escapeHtml(i18n.copyButton)}</button>
        </div>
        ${emailBlock}
        <button class="wdg-eip__cta" type="button">${escapeHtml(i18n.ctaButton)}</button>
        <button class="wdg-eip__no-thanks" type="button">${escapeHtml(i18n.noThanks)}</button>
      </div>
    </div>
  `;

  const close = (): void => {
    root.classList.remove('wdg-eip--visible');
    root.classList.add('wdg-eip--leaving');
    setTimeout(() => root.remove(), 220);
  };

  root.querySelector('.wdg-eip__close')!.addEventListener('click', close);
  root.querySelector('.wdg-eip__no-thanks')!.addEventListener('click', close);
  root.querySelector('.wdg-eip__backdrop')!.addEventListener('click', close);

  const copyButton = root.querySelector<HTMLButtonElement>('.wdg-eip__copy')!;
  copyButton.addEventListener('click', () => {
    copyToClipboard(config.promoCode);
    copyButton.textContent = i18n.copiedLabel;
    copyButton.classList.add('wdg-eip__copy--copied');
  });

  const cta = root.querySelector<HTMLButtonElement>('.wdg-eip__cta')!;
  cta.addEventListener('click', () => {
    const emailInput = root.querySelector<HTMLInputElement>('.wdg-eip__email');
    if (emailInput && emailInput.value) {
      try { window.localStorage.setItem(EMAIL_KEY, emailInput.value); } catch { /* ignore */ }
    }
    copyToClipboard(config.promoCode);
    showSuccess(root, i18n);
  });

  return root;
}

function showSuccess(root: HTMLElement, i18n: I18nEntry): void {
  const body = root.querySelector('.wdg-eip__body');
  if (!body) return;
  body.innerHTML = `
    <h2 class="wdg-eip__title">${escapeHtml(i18n.successTitle)}</h2>
    <p class="wdg-eip__subtitle">${escapeHtml(i18n.successText)}</p>
    <div class="wdg-eip__promo wdg-eip__promo--success">
      <code class="wdg-eip__promo-code">${escapeHtml(i18n.copiedLabel)}</code>
    </div>
  `;
}

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
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function injectStyles(config: ExitIntentPopupConfig): void {
  if (document.getElementById(STYLES_ID)) return;
  const el = document.createElement('style');
  el.id = STYLES_ID;
  el.textContent = `
.wdg-eip {
  position: fixed;
  inset: 0;
  z-index: ${config.zIndex};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  opacity: 0;
  transition: opacity .22s ease;
}
.wdg-eip.wdg-eip--visible { opacity: 1; }
.wdg-eip.wdg-eip--leaving { opacity: 0; }
.wdg-eip__backdrop {
  position: absolute; inset: 0;
  background: rgba(15, 23, 42, .55);
  backdrop-filter: blur(2px);
}
.wdg-eip__card {
  position: relative;
  display: flex;
  flex-direction: row;
  width: min(720px, 92vw);
  max-height: 92vh;
  background: ${config.backgroundColor};
  color: ${config.textColor};
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .35);
  overflow: hidden;
  transform: translateY(8px);
  transition: transform .22s ease;
}
.wdg-eip--visible .wdg-eip__card { transform: translateY(0); }
.wdg-eip__image {
  flex: 0 0 40%;
  background-size: cover;
  background-position: center;
  min-height: 320px;
}
.wdg-eip__body {
  flex: 1;
  padding: 28px 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.wdg-eip__close {
  position: absolute; top: 8px; right: 12px;
  width: 32px; height: 32px;
  background: transparent; border: 0;
  font-size: 26px; line-height: 1;
  color: ${config.textColor}; opacity: .55;
  cursor: pointer;
}
.wdg-eip__close:hover { opacity: 1; }
.wdg-eip__title {
  margin: 0; font-size: 22px; font-weight: 700; line-height: 1.2;
}
.wdg-eip__subtitle { margin: 0; font-size: 14px; opacity: .8; line-height: 1.45; }
.wdg-eip__promo {
  display: flex; align-items: center; gap: 8px;
  background: rgba(124, 58, 237, .08);
  border: 1px dashed ${config.accentColor};
  border-radius: 10px;
  padding: 10px 12px;
}
.wdg-eip__promo-label { font-size: 12px; opacity: .7; text-transform: uppercase; letter-spacing: .04em; }
.wdg-eip__promo-code {
  flex: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 16px; font-weight: 700;
  color: ${config.accentColor};
  letter-spacing: .04em;
  text-align: center;
}
.wdg-eip__copy {
  background: transparent; color: ${config.accentColor};
  border: 1px solid ${config.accentColor};
  border-radius: 8px; padding: 6px 10px;
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.wdg-eip__copy:hover { background: ${config.accentColor}; color: ${config.accentTextColor}; }
.wdg-eip__copy--copied { background: ${config.accentColor}; color: ${config.accentTextColor}; }
.wdg-eip__email {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  outline: none;
  transition: border-color .15s ease;
}
.wdg-eip__email:focus { border-color: ${config.accentColor}; }
.wdg-eip__cta {
  background: ${config.accentColor};
  color: ${config.accentTextColor};
  border: 0; border-radius: 10px;
  padding: 14px;
  font-size: 15px; font-weight: 700;
  cursor: pointer;
  transition: filter .15s ease, transform .05s ease;
}
.wdg-eip__cta:hover { filter: brightness(1.08); }
.wdg-eip__cta:active { transform: scale(.98); }
.wdg-eip__no-thanks {
  background: transparent; border: 0;
  color: ${config.textColor}; opacity: .55;
  cursor: pointer; font-size: 12px;
  text-decoration: underline;
}
.wdg-eip__no-thanks:hover { opacity: .9; }
.wdg-eip__promo--success { justify-content: center; }
@media (max-width: 640px) {
  .wdg-eip__card { flex-direction: column; }
  .wdg-eip__image { flex: 0 0 160px; min-height: 160px; }
  .wdg-eip__body { padding: 20px; }
  .wdg-eip__title { font-size: 19px; }
}
`;
  document.head.appendChild(el);
}
