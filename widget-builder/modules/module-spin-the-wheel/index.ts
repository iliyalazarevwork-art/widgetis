import {
  spinTheWheelSchema,
  spinTheWheelI18nSchema,
  type SpinTheWheelConfig,
  type SpinTheWheelI18nEntry,
  type SpinTheWheelInput,
  type SpinSegment,
} from './schema';
import { getLanguage } from '@laxarevii/core';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROOT_ID = 'wdg-spin-the-wheel';
const STYLES_ID = 'wdg-spin-the-wheel-styles';
const STORAGE_SEEN_KEY = 'wty_spin_seen_at';
const STORAGE_EMAIL_KEY = 'wty_spin_email';
const STORAGE_WON_KEY = 'wty_spin_won_code';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function spinTheWheel(
  rawConfig: SpinTheWheelInput,
  rawI18n: Record<string, SpinTheWheelI18nEntry>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = spinTheWheelSchema.parse(rawConfig);
  const i18nMap = spinTheWheelI18nSchema.parse(rawI18n);

  if (!config.enabled) {
    console.warn('[widgetality] spin-the-wheel: ⚠️ disabled');
    return;
  }

  if (isSuppressedByCooldown(config.cooldownHours)) {
    console.warn('[widgetality] spin-the-wheel: ⏳ cooldown active, skipping');
    return;
  }

  if (isHiddenByUtm(config.hideOnUtmSources)) {
    console.warn('[widgetality] spin-the-wheel: 🚫 hidden by UTM source');
    return;
  }

  const lang = getLanguage();
  const i18n =
    i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  console.log('[widgetality] spin-the-wheel: ✅ activated');

  injectStyles(config);

  let shown = false;
  let root: HTMLElement | null = null;
  let exitTimer: number | null = null;
  let delayTimer: number | null = null;

  function trigger(): void {
    if (shown) return;
    shown = true;
    root = renderModal(config, i18n);
    document.body.appendChild(root);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root?.classList.add('wdg-stw--visible'));
    });
    rememberSeen();
  }

  // Delay trigger
  delayTimer = window.setTimeout(trigger, config.delaySec * 1000);

  // Exit-intent trigger
  function onMouseLeave(e: MouseEvent): void {
    if (
      config.triggerOnExitIntent &&
      e.clientY <= 0 &&
      (e.relatedTarget === null ||
        (e.relatedTarget as Node).nodeName === 'HTML')
    ) {
      trigger();
    }
  }

  if (config.triggerOnExitIntent) {
    document.addEventListener('mouseleave', onMouseLeave);
  }

  return () => {
    if (delayTimer !== null) clearTimeout(delayTimer);
    if (exitTimer !== null) clearTimeout(exitTimer);
    document.removeEventListener('mouseleave', onMouseLeave);
    root?.remove();
    document.getElementById(STYLES_ID)?.remove();
  };
}

// ---------------------------------------------------------------------------
// Weighted random segment picker
// ---------------------------------------------------------------------------

export function pickSegment(segments: SpinSegment[]): { index: number; segment: SpinSegment } {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < segments.length; i++) {
    rand -= segments[i].weight;
    if (rand <= 0) {
      return { index: i, segment: segments[i] };
    }
  }
  // Fallback to last
  return { index: segments.length - 1, segment: segments[segments.length - 1] };
}

// ---------------------------------------------------------------------------
// Cooldown / UTM helpers
// ---------------------------------------------------------------------------

function isSuppressedByCooldown(hours: number): boolean {
  try {
    const seen = window.localStorage.getItem(STORAGE_SEEN_KEY);
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
    window.localStorage.setItem(STORAGE_SEEN_KEY, String(Date.now()));
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
// SVG Wheel
// ---------------------------------------------------------------------------

function buildWheelSvg(config: SpinTheWheelConfig): string {
  const { segments, palette, wheelTextColor } = config;
  const n = segments.length;
  const anglePerSlice = (2 * Math.PI) / n;
  const r = 150; // SVG radius (viewBox 320x320, center 160,160)
  const cx = 160;
  const cy = 160;

  let paths = '';

  for (let i = 0; i < n; i++) {
    const startAngle = i * anglePerSlice - Math.PI / 2; // start at top
    const endAngle = startAngle + anglePerSlice;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const largeArc = anglePerSlice > Math.PI ? 1 : 0;
    const fill = palette[i % 2];

    const midAngle = startAngle + anglePerSlice / 2;
    const textR = r * 0.62;
    const tx = cx + textR * Math.cos(midAngle);
    const ty = cy + textR * Math.sin(midAngle);
    const textRotDeg = (midAngle * 180) / Math.PI + 90;

    const label = escapeHtml(segments[i].label);

    paths += `
      <path
        d="M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z"
        fill="${escapeAttr(fill)}"
        stroke="${escapeAttr(wheelTextColor)}"
        stroke-width="1"
      />
      <text
        x="${tx}"
        y="${ty}"
        text-anchor="middle"
        dominant-baseline="middle"
        transform="rotate(${textRotDeg}, ${tx}, ${ty})"
        font-size="11"
        font-weight="600"
        fill="${escapeAttr(wheelTextColor)}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        style="pointer-events:none; user-select:none;"
      >${label}</text>
    `;
  }

  // Center circle decoration
  paths += `<circle cx="${cx}" cy="${cy}" r="22" fill="rgba(255,255,255,0.15)" stroke="${escapeAttr(wheelTextColor)}" stroke-width="1.5"/>`;

  return `
    <svg
      id="wdg-stw-wheel-svg"
      viewBox="0 0 320 320"
      xmlns="http://www.w3.org/2000/svg"
      style="width:100%;height:100%;display:block;"
    >
      <g id="wdg-stw-wheel-group">
        ${paths}
      </g>
    </svg>
  `;
}

// Pointer/arrow above the wheel
function buildPointerSvg(): string {
  return `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:32px;height:32px;display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));">
      <polygon points="12,2 22,22 12,16 2,22" fill="var(--stw-accent)" stroke="var(--stw-accent-fg)" stroke-width="0.5"/>
    </svg>
  `;
}

// ---------------------------------------------------------------------------
// Modal render — Email gate
// ---------------------------------------------------------------------------

function renderModal(
  config: SpinTheWheelConfig,
  i18n: SpinTheWheelI18nEntry,
): HTMLElement {
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.className = 'wdg-stw';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'wdg-stw-title');

  root.innerHTML = buildEmailGateHtml(config, i18n);

  function close(): void {
    root.classList.remove('wdg-stw--visible');
    root.classList.add('wdg-stw--leaving');
    setTimeout(() => root.remove(), 300);
  }

  root.querySelector('.wdg-stw__backdrop')!.addEventListener('click', close);
  root.querySelector('.wdg-stw__close')!.addEventListener('click', close);

  const form = root.querySelector<HTMLFormElement>('.wdg-stw__email-form')!;
  form.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    const emailInput = root.querySelector<HTMLInputElement>('.wdg-stw__email-input')!;
    const email = emailInput.value.trim();

    if (config.requireEmail && !EMAIL_RE.test(email)) {
      showEmailError(root, email);
      return;
    }

    if (email) {
      try {
        window.localStorage.setItem(STORAGE_EMAIL_KEY, email);
      } catch {
        // ignore
      }
    }

    showWheelStage(root, config, i18n, close);
  });

  return root;
}

// ---------------------------------------------------------------------------
// Stage builders
// ---------------------------------------------------------------------------

function buildEmailGateHtml(
  config: SpinTheWheelConfig,
  i18n: SpinTheWheelI18nEntry,
): string {
  const consentBlock = config.requireConsent
    ? `<label class="wdg-stw__consent">
        <input class="wdg-stw__consent-input" type="checkbox" checked />
        <span class="wdg-stw__consent-text">${escapeHtml(i18n.consentText)}</span>
       </label>`
    : '';

  const emailBlock = config.requireEmail
    ? `<div class="wdg-stw__email-field">
        <input
          class="wdg-stw__email-input"
          type="email"
          placeholder="${escapeAttr(i18n.emailPlaceholder)}"
          autocomplete="email"
          inputmode="email"
        />
        <span class="wdg-stw__email-error" aria-live="polite" style="display:none;"></span>
       </div>`
    : '';

  return `
    <div class="wdg-stw__backdrop"></div>
    <div class="wdg-stw__card" role="document">
      <button class="wdg-stw__close" aria-label="${escapeAttr(i18n.closeLabel)}" type="button">×</button>
      <form class="wdg-stw__email-form" novalidate>
        <div class="wdg-stw__wheel-preview" aria-hidden="true">
          ${buildWheelSvg(config)}
          <div class="wdg-stw__pointer">${buildPointerSvg()}</div>
        </div>
        <div class="wdg-stw__body">
          <h2 class="wdg-stw__title" id="wdg-stw-title">${escapeHtml(i18n.title)}</h2>
          <p class="wdg-stw__subtitle">${escapeHtml(i18n.subtitle)}</p>
          ${emailBlock}
          ${consentBlock}
          <button class="wdg-stw__cta" type="submit">${escapeHtml(i18n.spinButton)}</button>
        </div>
      </form>
    </div>
  `;
}

function showEmailError(root: HTMLElement, email: string): void {
  const errEl = root.querySelector<HTMLElement>('.wdg-stw__email-error');
  const inputEl = root.querySelector<HTMLInputElement>('.wdg-stw__email-input');
  if (!errEl || !inputEl) return;
  errEl.textContent = email.length === 0 ? 'Please enter your email' : 'Please enter a valid email';
  errEl.style.display = 'block';
  inputEl.classList.add('wdg-stw__email-input--error');
}

function showWheelStage(
  root: HTMLElement,
  config: SpinTheWheelConfig,
  i18n: SpinTheWheelI18nEntry,
  close: () => void,
): void {
  const card = root.querySelector<HTMLElement>('.wdg-stw__card')!;
  const { index: winIndex, segment: winSegment } = pickSegment(config.segments);

  card.innerHTML = `
    <button class="wdg-stw__close" aria-label="${escapeAttr(i18n.closeLabel)}" type="button">×</button>
    <div class="wdg-stw__wheel-stage">
      <div class="wdg-stw__wheel-wrap">
        <div class="wdg-stw__pointer wdg-stw__pointer--top">${buildPointerSvg()}</div>
        <div class="wdg-stw__wheel-container" id="wdg-stw-wheel-container">
          ${buildWheelSvg(config)}
        </div>
      </div>
      <p class="wdg-stw__spinning-label">${escapeHtml(i18n.spinningLabel)}</p>
    </div>
  `;

  card.querySelector('.wdg-stw__close')!.addEventListener('click', close);

  // Spin animation
  const n = config.segments.length;
  const anglePerSlice = 360 / n;

  // We want the winning slice to end at the top (pointer is at top).
  // The wheel starts at rotation=0 where segment 0 starts at the top.
  // Segment i's midpoint is at i*anglePerSlice + anglePerSlice/2 from top.
  // To bring it to top (0°), we need to rotate by -(i * anglePerSlice + anglePerSlice/2).
  // Add N full spins (4–6) for drama.
  const extraSpins = 4 + Math.floor(Math.random() * 3); // 4–6
  const targetAngle = -(winIndex * anglePerSlice + anglePerSlice / 2);
  const totalRotation = extraSpins * 360 + targetAngle;

  const container = card.querySelector<HTMLElement>('#wdg-stw-wheel-container')!;

  // Trigger spin after next paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.style.transition = `transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
      container.style.transform = `rotate(${totalRotation}deg)`;
    });
  });

  // Show result after spin
  setTimeout(
    () => showResultStage(root, card, config, i18n, winSegment, close),
    4800,
  );
}

function showResultStage(
  root: HTMLElement,
  card: HTMLElement,
  config: SpinTheWheelConfig,
  i18n: SpinTheWheelI18nEntry,
  segment: SpinSegment,
  close: () => void,
): void {
  const isWin = segment.code.length > 0;

  if (isWin) {
    try {
      window.localStorage.setItem(STORAGE_WON_KEY, segment.code);
    } catch {
      // ignore
    }
  }

  const promoBlock = isWin
    ? `<div class="wdg-stw__promo">
        <span class="wdg-stw__promo-label">${escapeHtml(i18n.promoLabel)}</span>
        <code class="wdg-stw__promo-code">${escapeHtml(segment.code)}</code>
        <button class="wdg-stw__copy" type="button">${escapeHtml(i18n.copyButton)}</button>
       </div>`
    : '';

  card.innerHTML = `
    <button class="wdg-stw__close" aria-label="${escapeAttr(i18n.closeLabel)}" type="button">×</button>
    <div class="wdg-stw__result-stage">
      <div class="wdg-stw__result-icon" aria-hidden="true">${isWin ? '🎉' : '😔'}</div>
      <h2 class="wdg-stw__title" id="wdg-stw-title">
        ${escapeHtml(isWin ? i18n.resultTitleWin : i18n.resultTitleLose)}
      </h2>
      <p class="wdg-stw__subtitle">
        ${escapeHtml(isWin ? i18n.resultSubtitleWin : i18n.resultSubtitleLose)}
      </p>
      <p class="wdg-stw__result-prize">${escapeHtml(segment.label)}</p>
      ${promoBlock}
      <button class="wdg-stw__close-btn" type="button">${escapeHtml(i18n.closeLabel)}</button>
    </div>
  `;

  card.querySelector('.wdg-stw__close')!.addEventListener('click', close);
  card.querySelector('.wdg-stw__close-btn')!.addEventListener('click', close);

  if (isWin) {
    const copyBtn = card.querySelector<HTMLButtonElement>('.wdg-stw__copy')!;
    copyBtn.addEventListener('click', () => {
      copyToClipboard(segment.code);
      copyBtn.textContent = i18n.copiedLabel;
      copyBtn.classList.add('wdg-stw__copy--copied');
    });
  }
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

// ---------------------------------------------------------------------------
// Escape helpers
// ---------------------------------------------------------------------------

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

function injectStyles(config: SpinTheWheelConfig): void {
  if (document.getElementById(STYLES_ID)) return;
  const el = document.createElement('style');
  el.id = STYLES_ID;
  el.textContent = buildStyles(config);
  document.head.appendChild(el);
}

function buildStyles(config: SpinTheWheelConfig): string {
  return `
.wdg-stw {
  --stw-bg: ${config.backgroundColor};
  --stw-fg: ${config.textColor};
  --stw-accent: ${config.accentColor};
  --stw-accent-fg: ${config.accentTextColor};
  --stw-border: ${config.borderColor};
  --stw-radius: ${config.borderRadius}px;

  position: fixed; inset: 0;
  z-index: ${config.zIndex};
  display: flex; align-items: center; justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  opacity: 0; transition: opacity .25s ease;
  -webkit-font-smoothing: antialiased;
}
.wdg-stw.wdg-stw--visible { opacity: 1; }
.wdg-stw.wdg-stw--leaving { opacity: 0; pointer-events: none; }

.wdg-stw__backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.55);
}

.wdg-stw__card {
  position: relative;
  width: min(560px, 92vw);
  max-height: 92vh;
  overflow-y: auto;
  background: var(--stw-bg);
  color: var(--stw-fg);
  border-radius: var(--stw-radius);
  box-shadow: 0 24px 80px rgba(0,0,0,.38);
  transform: translateY(12px) scale(.97);
  transition: transform .28s cubic-bezier(.16,1,.3,1);
}
.wdg-stw--visible .wdg-stw__card {
  transform: translateY(0) scale(1);
}

.wdg-stw__close {
  position: absolute; top: 10px; right: 12px;
  width: 36px; height: 36px;
  background: transparent; border: 0;
  font-size: 28px; line-height: 1;
  color: var(--stw-fg); opacity: .5;
  cursor: pointer; border-radius: 50%;
  transition: opacity .15s, background .15s;
  z-index: 2;
}
.wdg-stw__close:hover { opacity: 1; background: rgba(0,0,0,.06); }

/* ── Email gate layout ── */
.wdg-stw__email-form {
  display: flex; flex-direction: row;
}
.wdg-stw__wheel-preview {
  position: relative;
  flex: 0 0 220px;
  width: 220px; height: 220px;
  align-self: center;
  margin: 28px 0 28px 28px;
}
.wdg-stw__pointer {
  position: absolute; top: -18px; left: 50%; transform: translateX(-50%);
  z-index: 2; line-height: 0;
}
.wdg-stw__body {
  flex: 1;
  padding: 32px 28px 28px 20px;
  display: flex; flex-direction: column; gap: 14px;
}
.wdg-stw__title {
  margin: 0; font-size: 22px; font-weight: 700;
  line-height: 1.2; letter-spacing: -.01em;
}
.wdg-stw__subtitle {
  margin: 0; font-size: 14px; opacity: .72; line-height: 1.45;
}

/* ── Email field ── */
.wdg-stw__email-field { display: flex; flex-direction: column; gap: 4px; }
.wdg-stw__email-input {
  width: 100%; box-sizing: border-box;
  padding: 14px 16px;
  border-radius: calc(var(--stw-radius) * 0.6);
  border: 1.5px solid var(--stw-border);
  background: var(--stw-bg); color: var(--stw-fg);
  font-size: 16px; outline: none;
  transition: border-color .15s, box-shadow .15s;
  -webkit-appearance: none; appearance: none;
}
.wdg-stw__email-input:focus {
  border-color: var(--stw-accent);
  box-shadow: 0 0 0 3px rgba(0,0,0,.06);
}
.wdg-stw__email-input--error {
  border-color: #ef4444 !important;
}
.wdg-stw__email-error {
  font-size: 12px; color: #ef4444; padding-left: 4px;
}

/* ── Consent ── */
.wdg-stw__consent {
  display: flex; align-items: flex-start; gap: 8px; cursor: pointer;
}
.wdg-stw__consent-input {
  margin-top: 2px; width: 16px; height: 16px; flex-shrink: 0;
  accent-color: var(--stw-accent);
}
.wdg-stw__consent-text { font-size: 12px; opacity: .7; line-height: 1.4; }

/* ── CTA button ── */
.wdg-stw__cta {
  background: var(--stw-accent); color: var(--stw-accent-fg);
  border: 0; border-radius: calc(var(--stw-radius) * 0.6);
  padding: 16px;
  font-size: 16px; font-weight: 700; letter-spacing: .01em;
  cursor: pointer; min-height: 52px;
  transition: filter .15s, transform .06s;
  -webkit-tap-highlight-color: transparent;
}
.wdg-stw__cta:hover { filter: brightness(1.1); }
.wdg-stw__cta:active { transform: scale(.98); }

/* ── Wheel stage ── */
.wdg-stw__wheel-stage {
  display: flex; flex-direction: column; align-items: center;
  padding: 44px 28px 32px;
  gap: 20px;
}
.wdg-stw__wheel-wrap {
  position: relative; display: flex; flex-direction: column; align-items: center;
}
.wdg-stw__pointer--top {
  position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
  z-index: 2;
}
.wdg-stw__wheel-container {
  width: min(360px, 75vw);
  height: min(360px, 75vw);
  will-change: transform;
}
.wdg-stw__spinning-label {
  margin: 0; font-size: 15px; opacity: .65;
  animation: wdg-stw-pulse 1s ease-in-out infinite;
}
@keyframes wdg-stw-pulse {
  0%, 100% { opacity: .65; }
  50%       { opacity: 1; }
}

/* ── Result stage ── */
.wdg-stw__result-stage {
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
  padding: 44px 32px 32px;
  gap: 12px;
}
.wdg-stw__result-icon { font-size: 48px; line-height: 1; }
.wdg-stw__result-prize {
  margin: 0; font-size: 18px; font-weight: 700; color: var(--stw-accent);
}

/* ── Promo block ── */
.wdg-stw__promo {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: rgba(0,0,0,.04);
  border: 1px dashed var(--stw-border);
  border-radius: calc(var(--stw-radius) * 0.6);
  padding: 12px 14px;
  width: 100%; box-sizing: border-box;
}
.wdg-stw__promo-label {
  font-size: 11px; opacity: .55; text-transform: uppercase;
  letter-spacing: .08em; font-weight: 600;
}
.wdg-stw__promo-code {
  flex: 1; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 18px; font-weight: 700; letter-spacing: .06em;
  color: var(--stw-fg); text-align: center;
}
.wdg-stw__copy {
  background: transparent; color: var(--stw-fg);
  border: 1px solid var(--stw-border);
  border-radius: calc(var(--stw-radius) * 0.5);
  padding: 8px 12px; font-size: 12px; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  transition: background .15s, color .15s, border-color .15s;
  min-height: 36px;
}
.wdg-stw__copy:hover, .wdg-stw__copy--copied {
  background: var(--stw-accent); color: var(--stw-accent-fg);
  border-color: var(--stw-accent);
}

/* ── Close button (result stage) ── */
.wdg-stw__close-btn {
  background: transparent; border: 1.5px solid var(--stw-border);
  border-radius: calc(var(--stw-radius) * 0.6);
  color: var(--stw-fg); opacity: .65;
  cursor: pointer; font-size: 14px;
  padding: 12px 24px; min-height: 48px;
  transition: opacity .15s, border-color .15s;
}
.wdg-stw__close-btn:hover { opacity: 1; border-color: var(--stw-fg); }

/* ── Mobile (bottom-sheet) ── */
@media (max-width: 600px) {
  .wdg-stw { align-items: flex-end; justify-content: stretch; }
  .wdg-stw__card {
    width: 100%; max-width: 100%; max-height: 92vh;
    border-radius: 20px 20px 0 0;
    transform: translateY(100%);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .wdg-stw--visible .wdg-stw__card { transform: translateY(0); }
  .wdg-stw__email-form { flex-direction: column; }
  .wdg-stw__wheel-preview {
    flex: none; width: 200px; height: 200px;
    align-self: center;
    margin: 20px auto 0;
  }
  .wdg-stw__body { padding: 16px 20px calc(20px + env(safe-area-inset-bottom)) 20px; }
  .wdg-stw__title { font-size: 19px; }
  .wdg-stw__cta { font-size: 15px; padding: 15px; }
  .wdg-stw__wheel-container {
    width: min(280px, 60vw);
    height: min(280px, 60vw);
  }
}
@media (prefers-reduced-motion: reduce) {
  .wdg-stw, .wdg-stw__card,
  .wdg-stw__wheel-container,
  .wdg-stw__cta, .wdg-stw__copy,
  .wdg-stw__spinning-label {
    transition: none !important;
    animation: none !important;
  }
}
`;
}
