import {
  spinTheWheelSchema,
  spinTheWheelI18nSchema,
  type SpinTheWheelConfig,
  type SpinTheWheelI18nEntry,
  type SpinTheWheelInput,
  type SpinSegment,
} from './schema';
import { ICONS, type IconType } from './icons';
import { getLanguage } from '@laxarevii/core';
// @ts-ignore — lucky-canvas ships TypeScript declarations but the import path needs ts-ignore
import { LuckyWheel } from 'lucky-canvas';

// ---------------------------------------------------------------------------
// SVG-icon → data-URL string, used in lucky-canvas imgs[].src.
// Icons in icons.ts use currentColor; we replace it with the segment text
// color to get white silhouettes on top of vivid segment backgrounds.
// ---------------------------------------------------------------------------

export function buildIconDataUrl(iconType: IconType, color: string): string {
  if (typeof btoa === 'undefined') return '';
  const svgRaw = ICONS[iconType];
  if (!svgRaw) return '';
  const svgColored = svgRaw.replace(/currentColor/g, color);
  try {
    return `data:image/svg+xml;base64,${btoa(svgColored)}`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOST_ID = 'wdg-stw-host';
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

  // ── Shadow DOM host ──────────────────────────────────────────────────────
  const hostEl = document.createElement('div');
  hostEl.id = HOST_ID;
  // Only fixed positioning on host — nothing else bleeds through
  hostEl.style.cssText = `position:fixed;inset:0;z-index:${config.zIndex};pointer-events:none;`;

  const shadow = hostEl.attachShadow({ mode: 'open' });

  // Inject all styles inside shadow root
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-stw', '');
  styleEl.textContent = buildStyles(config);
  shadow.appendChild(styleEl);

  let shown = false;
  let exitTimer: number | null = null;
  let delayTimer: number | null = null;

  function trigger(): void {
    if (shown) return;
    shown = true;
    renderModal(shadow, hostEl, config, i18n);
    document.body.appendChild(hostEl);
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
    hostEl.remove();
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
// Pointer overlay — chunky red triangle with drop shadow
// ---------------------------------------------------------------------------

function buildPointerSvg(color: string): string {
  return `
    <svg viewBox="0 0 32 36" xmlns="http://www.w3.org/2000/svg"
      style="width:32px;height:36px;display:block;filter:drop-shadow(0 4px 8px rgba(0,0,0,.4));">
      <polygon points="16,32 2,2 30,2" fill="${escapeAttr(color)}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
      <polygon points="16,26 8,8 24,8" fill="rgba(255,255,255,0.25)"/>
    </svg>
  `;
}

// ---------------------------------------------------------------------------
// Build lucky-canvas prize data from config
// ---------------------------------------------------------------------------

function buildLuckyWheelData(
  config: SpinTheWheelConfig,
  size: string,
  onEnd: (prize: object) => void,
): object {
  return {
    width: size,
    height: size,
    blocks: [
      {
        padding: '8px',
        background: config.decorativeColor,
      },
      {
        padding: '4px',
        background: '#ffffff',
      },
    ],
    prizes: config.segments.map((s, i) => {
      const bg = config.palette[i % config.palette.length];
      const iconDataUrl = s.iconType
        ? buildIconDataUrl(s.iconType as IconType, config.wheelTextColor)
        : '';

      return {
        background: bg,
        fonts: [
          {
            text: s.label,
            top: iconDataUrl ? '10%' : '20%',
            fontColor: config.wheelTextColor,
            fontSize: '13px',
            fontWeight: 'bold',
            wordWrap: true,
            lineClamp: 2,
          },
        ],
        imgs: iconDataUrl
          ? [
              {
                src: iconDataUrl,
                top: '52%',
                width: '30%',
              },
            ]
          : [],
      };
    }),
    buttons: [
      {
        radius: '32%',
        background: '#ffffff',
      },
      {
        radius: '24%',
        background: config.decorativeColor,
        imgs: [
          {
            src: buildIconDataUrl('gift', '#ffffff'),
            top: '-7%',
            width: '14%',
          },
        ],
      },
    ],
    defaultStyle: {
      background: '#ffffff',
      fontColor: config.wheelTextColor,
      fontSize: '13px',
    },
    end: onEnd,
  };
}

// ---------------------------------------------------------------------------
// Modal render — inside shadow root
// ---------------------------------------------------------------------------

function renderModal(
  shadow: ShadowRoot,
  hostEl: HTMLElement,
  config: SpinTheWheelConfig,
  i18n: SpinTheWheelI18nEntry,
): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'stw-wrapper';
  shadow.appendChild(wrapper);

  // Side tab (visible only when modal is minimized).
  // It is a non-button container so the inner × close button isn't a nested
  // <button> (invalid HTML); the open click is bound to the body element.
  const tab = document.createElement('div');
  tab.className = 'stw__tab';
  const tabBody = document.createElement('button');
  tabBody.type = 'button';
  tabBody.className = 'stw__tab-body';
  tabBody.setAttribute('aria-label', i18n.tabAriaLabel);
  tabBody.innerHTML = `
    <span class="stw__tab-icon" aria-hidden="true">${ICONS.gift}</span>
    <span class="stw__tab-label">${escapeHtml(i18n.tabLabel)}</span>
  `;
  const tabClose = document.createElement('button');
  tabClose.type = 'button';
  tabClose.className = 'stw__tab-close';
  tabClose.setAttribute('aria-label', i18n.tabCloseAriaLabel);
  tabClose.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  tab.appendChild(tabBody);
  tab.appendChild(tabClose);
  shadow.appendChild(tab);

  let previewWheel: InstanceType<typeof LuckyWheel> | null = null;

  function unmountPreview(): void {
    if (previewWheel) {
      try { previewWheel.stop?.(); } catch { /* ignore */ }
      previewWheel = null;
    }
  }

  function mountPreviewWheel(): void {
    const previewContainer = wrapper.querySelector<HTMLDivElement>('.stw__wheel-container--preview');
    if (!previewContainer || previewWheel) return;
    const rect = previewContainer.getBoundingClientRect();
    const sizePx = Math.round(Math.max(rect.width, rect.height));
    if (sizePx <= 0) {
      requestAnimationFrame(mountPreviewWheel);
      return;
    }
    try {
      previewWheel = new LuckyWheel(
        previewContainer,
        buildLuckyWheelData(config, `${sizePx}px`, () => {}),
      );
      previewWheel.init?.();
    } catch {
      // Canvas may not be supported in test environment
    }
  }

  function attachEmailGateHandlers(): void {
    wrapper.querySelector('.stw__backdrop')!.addEventListener('click', close);
    wrapper.querySelector('.stw__close')!.addEventListener('click', close);

    const form = wrapper.querySelector<HTMLFormElement>('.stw__email-form')!;
    form.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      const emailInput = wrapper.querySelector<HTMLInputElement>('.stw__email-input')!;
      const email = emailInput.value.trim();

      if (config.requireEmail && !EMAIL_RE.test(email)) {
        showEmailError(wrapper, email, i18n);
        return;
      }

      if (email) {
        try {
          window.localStorage.setItem(STORAGE_EMAIL_KEY, email);
        } catch {
          // ignore
        }
      }

      unmountPreview();
      showWheelStage(wrapper, hostEl, config, i18n, close);
    });
  }

  function renderEmailGate(): void {
    wrapper.innerHTML = buildEmailGateHtml(config, i18n);
    requestAnimationFrame(() => requestAnimationFrame(mountPreviewWheel));
    attachEmailGateHandlers();
  }

  function renderActivePrizeIfAny(): boolean {
    const prize = readActivePrize();
    if (!prize) return false;
    // Render the result stage directly so user can re-see their won code.
    wrapper.innerHTML = '<div class="stw__backdrop"></div><div class="stw__card" role="document"></div>';
    const card = wrapper.querySelector<HTMLElement>('.stw__card')!;
    const segment: SpinSegment = {
      code: prize.code,
      label: prize.label,
      weight: 1,
      iconType: prize.iconType ?? undefined,
    };
    showResultStage(wrapper, card, config, i18n, segment, close);
    wrapper.querySelector('.stw__backdrop')!.addEventListener('click', close);
    return true;
  }

  function renderInitialStage(): void {
    if (!renderActivePrizeIfAny()) {
      renderEmailGate();
    }
  }

  function close(): void {
    unmountPreview();
    hostEl.classList.remove('stw--visible');
    hostEl.classList.add('stw--minimized');
  }

  function reopenFromTab(): void {
    hostEl.classList.remove('stw--minimized');
    renderInitialStage();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      hostEl.classList.add('stw--visible');
    }));
  }

  tabBody.addEventListener('click', reopenFromTab);

  // Tab close: fully dismiss the widget for this session — no tab, no modal.
  tabClose.addEventListener('click', (e) => {
    e.stopPropagation();
    unmountPreview();
    hostEl.remove();
  });

  // Initial render + activate visibility
  renderInitialStage();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hostEl.classList.add('stw--visible');
      hostEl.style.removeProperty('pointer-events');
    });
  });
}

function readActivePrize(): { code: string; label: string; iconType?: string | null } | null {
  try {
    const raw = window.localStorage.getItem('wty_active_prize');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code?: unknown; label?: unknown; iconType?: unknown; expiresAt?: unknown };
    if (typeof parsed.code !== 'string' || parsed.code.length === 0) return null;
    if (typeof parsed.label !== 'string') return null;
    if (typeof parsed.expiresAt === 'number' && Date.now() > parsed.expiresAt) return null;
    return {
      code: parsed.code,
      label: parsed.label,
      iconType: typeof parsed.iconType === 'string' ? parsed.iconType : null,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Stage builders
// ---------------------------------------------------------------------------

function buildEmailGateHtml(
  config: SpinTheWheelConfig,
  i18n: SpinTheWheelI18nEntry,
): string {
  const consentBlock = config.requireConsent
    ? `<label class="stw__consent">
        <input class="stw__consent-input" type="checkbox" checked />
        <span class="stw__consent-text">${escapeHtml(i18n.consentText)}</span>
       </label>`
    : '';

  const emailBlock = config.requireEmail
    ? `<div class="stw__email-field">
        <input
          class="stw__email-input"
          type="email"
          placeholder="${escapeAttr(i18n.emailPlaceholder)}"
          autocomplete="email"
          inputmode="email"
        />
        <span class="stw__email-error" aria-live="polite" style="display:none;"></span>
       </div>`
    : '';

  return `
    <div class="stw__backdrop"></div>
    <div class="stw__card" role="document">
      <button class="stw__close" aria-label="${escapeAttr(i18n.closeLabel)}" type="button">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <form class="stw__email-form" novalidate>
        <div class="stw__wheel-preview" aria-hidden="true">
          <div class="stw__wheel-ring">
            <div class="stw__wheel-container--preview"></div>
          </div>
          <div class="stw__pointer">${buildPointerSvg(config.decorativeColor)}</div>
        </div>
        <div class="stw__body">
          <h2 class="stw__title" id="stw-title">${escapeHtml(i18n.title)}</h2>
          <p class="stw__subtitle">${escapeHtml(i18n.subtitle)}</p>
          ${emailBlock}
          ${consentBlock}
          <button class="stw__cta" type="submit">${escapeHtml(i18n.spinButton)}</button>
        </div>
      </form>
    </div>
  `;
}

function showEmailError(wrapper: HTMLElement, email: string, i18n: SpinTheWheelI18nEntry): void {
  const errEl = wrapper.querySelector<HTMLElement>('.stw__email-error');
  const inputEl = wrapper.querySelector<HTMLInputElement>('.stw__email-input');
  if (!errEl || !inputEl) return;
  errEl.textContent = email.length === 0 ? i18n.errorEmptyEmail : i18n.errorInvalidEmail;
  errEl.style.display = 'block';
  inputEl.classList.add('stw__email-input--error');
}

function showWheelStage(
  wrapper: HTMLElement,
  hostEl: HTMLElement,
  config: SpinTheWheelConfig,
  i18n: SpinTheWheelI18nEntry,
  close: () => void,
): void {
  const card = wrapper.querySelector<HTMLElement>('.stw__card')!;
  const { index: winIndex, segment: winSegment } = pickSegment(config.segments);
  const spinDurationMs = 4500;

  card.innerHTML = `
    <button class="stw__close" aria-label="${escapeAttr(i18n.closeLabel)}" type="button">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="stw__wheel-stage">
      <div class="stw__wheel-wrap">
        <div class="stw__pointer stw__pointer--top">${buildPointerSvg(config.decorativeColor)}</div>
        <div class="stw__wheel-ring stw__wheel-ring--full">
          <div class="stw__wheel-container" id="stw-wheel-container"></div>
        </div>
      </div>
      <p class="stw__spinning-label">${escapeHtml(i18n.spinningLabel)}</p>
    </div>
  `;

  card.querySelector('.stw__close')!.addEventListener('click', close);

  const container = card.querySelector<HTMLDivElement>('#stw-wheel-container')!;
  let wheelInstance: InstanceType<typeof LuckyWheel> | null = null;

  function startWheel(): void {
    const rect = container.getBoundingClientRect();
    const sizePx = Math.round(Math.max(rect.width, rect.height));
    if (sizePx <= 0) {
      requestAnimationFrame(startWheel);
      return;
    }
    try {
      wheelInstance = new LuckyWheel(
        container,
        buildLuckyWheelData(config, `${sizePx}px`, (_prize: object) => {
          setTimeout(() => showResultStage(wrapper, card, config, i18n, winSegment, close), 200);
        }),
      );

      const initRes = wheelInstance.init?.();
      const startSpin = (): void => {
        wheelInstance!.play();
        setTimeout(() => wheelInstance!.stop(winIndex), spinDurationMs);
      };
      if (initRes && typeof (initRes as Promise<unknown>).then === 'function') {
        (initRes as Promise<unknown>)
          .then(startSpin)
          .catch(() => {
            setTimeout(() => showResultStage(wrapper, card, config, i18n, winSegment, close), spinDurationMs + 200);
          });
      } else {
        startSpin();
      }
    } catch {
      setTimeout(() => showResultStage(wrapper, card, config, i18n, winSegment, close), spinDurationMs + 200);
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(startWheel));

  // Cleanup wheel on close
  card.querySelector<HTMLElement>('.stw__close')!.addEventListener('click', () => {
    if (wheelInstance) {
      try { wheelInstance.stop?.(); } catch { /* ignore */ }
      wheelInstance = null;
    }
  }, { once: true });
}

function showResultStage(
  wrapper: HTMLElement,
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
      // Зв'язок приза з реальною вигодою: цей запис читає module-prize-banner
      // і показує тонку плашку «У вас активний приз» на всіх сторінках,
      // поки приз не закінчиться. Так клієнт бачить постійне нагадування про вигоду.
      const prize = {
        code: segment.code,
        label: segment.label,
        iconType: segment.iconType ?? null,
        awardedAt: Date.now(),
        // За замовчуванням приз діє 7 днів
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        source: 'spin-the-wheel',
      };
      window.localStorage.setItem('wty_active_prize', JSON.stringify(prize));
    } catch {
      // ignore
    }
  }

  // Winning segment color for promo pill
  const segmentIndex = config.segments.findIndex((s) => s.label === segment.label);
  const winColor = config.palette[segmentIndex % config.palette.length] ?? config.accentColor;

  const promoBlock = isWin
    ? `<div class="stw__promo">
        <div class="stw__promo-pill" style="background:${escapeAttr(winColor)};">
          <code class="stw__promo-code">${escapeHtml(segment.code)}</code>
        </div>
        <button class="stw__copy" type="button">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          ${escapeHtml(i18n.copyButton)}
        </button>
       </div>`
    : '';

  card.innerHTML = `
    <button class="stw__close" aria-label="${escapeAttr(i18n.closeLabel)}" type="button">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="stw__result-stage ${isWin ? '' : 'stw__result-stage--lose'}">
      <div class="stw__result-icon ${isWin ? '' : 'stw__result-icon--shake'}" aria-hidden="true">${isWin ? '🎉' : '😔'}</div>
      <h2 class="stw__title stw__title--result" id="stw-title">
        ${escapeHtml(isWin ? i18n.resultTitleWin : i18n.resultTitleLose)}
      </h2>
      <p class="stw__subtitle">
        ${escapeHtml(isWin ? i18n.resultSubtitleWin : i18n.resultSubtitleLose)}
      </p>
      <p class="stw__result-prize">${escapeHtml(segment.label)}</p>
      ${promoBlock}
      <button class="stw__close-btn" type="button">${escapeHtml(i18n.closeLabel)}</button>
    </div>
  `;

  card.querySelector('.stw__close')!.addEventListener('click', close);
  card.querySelector('.stw__close-btn')!.addEventListener('click', close);

  if (isWin) {
    const copyBtn = card.querySelector<HTMLButtonElement>('.stw__copy')!;
    copyBtn.addEventListener('click', () => {
      copyToClipboard(segment.code);
      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> ${escapeHtml(i18n.copiedLabel)}`;
      copyBtn.classList.add('stw__copy--copied');
    });

    // Confetti celebration
    spawnConfetti(card, config.palette);
  }
}

// ---------------------------------------------------------------------------
// Confetti
// ---------------------------------------------------------------------------

function spawnConfetti(card: HTMLElement, palette: string[]): void {
  const COUNT = 24;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < COUNT; i++) {
    const piece = document.createElement('div');
    piece.className = 'stw__confetti';
    const color = palette[i % palette.length];
    const left = 10 + Math.random() * 80; // 10–90%
    const delay = Math.random() * 0.8;
    const rot = Math.random() * 360;
    const size = 6 + Math.random() * 6; // 6–12px
    const shape = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.cssText = `
      left:${left}%;
      background:${color};
      width:${size}px;height:${size}px;
      border-radius:${shape};
      animation-delay:${delay}s;
      transform:rotate(${rot}deg);
    `;
    fragment.appendChild(piece);
  }

  card.appendChild(fragment);

  // Remove after animation completes
  setTimeout(() => {
    card.querySelectorAll('.stw__confetti').forEach((el) => el.remove());
  }, 3800);
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
// Styles (all scoped inside shadow root)
// ---------------------------------------------------------------------------

function buildStyles(config: SpinTheWheelConfig): string {
  return `
:host {
  all: initial;
  display: block;
  position: fixed;
  inset: 0;
  z-index: ${config.zIndex};
  pointer-events: none;
}

*,*::before,*::after { box-sizing: border-box; }

/* ── Wrapper (covers full fixed area) ── */
.stw-wrapper {
  --stw-bg: ${config.backgroundColor};
  --stw-fg: ${config.textColor};
  --stw-accent: ${config.accentColor};
  --stw-accent-fg: ${config.accentTextColor};
  --stw-border: ${config.borderColor};
  --stw-radius: ${config.borderRadius}px;
  --stw-decorative: ${config.decorativeColor};

  all: initial;
  font-family: system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 16px;
  line-height: 1.5;
  color: var(--stw-fg);
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transform: translateX(0);
  transition: opacity 0.25s ease, transform 0.4s cubic-bezier(.16,1,.3,1);
  z-index: 1;
}

/* Visibility is driven by class on the host element (outside shadow) via inline style + rAF */
:host(.stw--visible) .stw-wrapper {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
}
:host(.stw--minimized) .stw-wrapper {
  opacity: 0;
  pointer-events: none;
  transform: translateX(-30%);
  transition: opacity 0.25s ease, transform 0.4s cubic-bezier(.16,1,.3,1);
}

/* ── Side tab (visible when minimized) ── */
.stw__tab {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%) translateX(-110%);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  pointer-events: none;
  z-index: 2;
  transition: transform 0.4s cubic-bezier(.16,1,.3,1);
}
/* When the modal is fully visible — fully remove the tab from layout: no
   transform-flicker, nothing peeking from behind the card. */
:host(.stw--visible) .stw__tab {
  display: none;
}
:host(.stw--minimized) .stw__tab {
  transform: translateY(-50%) translateX(0);
  pointer-events: auto;
}

.stw__tab-body {
  all: unset;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px 16px 10px;
  background: var(--stw-decorative, ${config.decorativeColor});
  color: #ffffff;
  border-radius: 0 14px 14px 0;
  box-shadow: 4px 6px 18px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  pointer-events: auto;
  font-family: system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stw__tab-body:hover {
  transform: translateX(4px);
  box-shadow: 6px 8px 22px rgba(0, 0, 0, 0.28);
}
.stw__tab-body:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
.stw__tab-icon {
  display: block;
  width: 22px;
  height: 22px;
}
.stw__tab-icon svg {
  display: block;
  width: 100%;
  height: 100%;
  color: #ffffff;
}
.stw__tab-label {
  display: block;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  white-space: nowrap;
}

/* Small × to dismiss the tab entirely for the session */
.stw__tab-close {
  all: unset;
  position: absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  color: #111827;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease, background 0.15s ease;
}
.stw__tab-close:hover {
  background: #f3f4f6;
  transform: scale(1.08);
}
.stw__tab-close:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

/* ── Backdrop ── */
.stw__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.6);
  cursor: pointer;
}

/* ── Card ── */
.stw__card {
  position: relative;
  width: min(540px, 92vw);
  max-height: 92vh;
  overflow-y: auto;
  background: var(--stw-bg);
  color: var(--stw-fg);
  border-radius: var(--stw-radius);
  box-shadow: 0 32px 96px rgba(0,0,0,.42), 0 0 0 1px rgba(0,0,0,.06);
  transform: translateY(16px) scale(0.92);
  transition: transform 350ms cubic-bezier(.16,1,.3,1);
  will-change: transform;
}
:host(.stw--visible) .stw__card {
  transform: translateY(0) scale(1);
}

/* ── Close X button ── */
.stw__close {
  position: absolute;
  top: 12px; right: 12px;
  width: 36px; height: 36px;
  background: rgba(0,0,0,.06);
  border: 0;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--stw-fg);
  opacity: .6;
  cursor: pointer;
  transition: opacity .15s, background .15s;
  z-index: 2;
  padding: 0;
}
.stw__close:hover { opacity: 1; background: rgba(0,0,0,.12); }

/* ── Email gate layout ── */
.stw__email-form {
  display: flex;
  flex-direction: row;
}

.stw__wheel-preview {
  position: relative;
  flex: 0 0 220px;
  width: 220px; height: 220px;
  align-self: center;
  margin: 32px 0 32px 28px;
}

.stw__wheel-ring {
  width: 100%; height: 100%;
  /* lucky-canvas рисует обводку и фон сам через "blocks" — нам тут только
     контейнер для канваса, без своего background/border (иначе перекрывает
     сегменты). Glow оставляем — он на host-уровне виджета. */
  position: relative;
  border-radius: 50%;
  box-shadow: 0 0 40px rgba(239, 68, 68, .35);
  overflow: visible;
}
.stw__wheel-container--preview {
  width: 100%;
  height: 100%;
}
.stw__wheel-ring canvas {
  display: block;
}

.stw__wheel-ring--full {
  position: relative;
  width: min(300px, 70vw);
  height: min(300px, 70vw);
  border-radius: 0;
  box-shadow: none;
  background: none;
  border: none;
  overflow: visible;
}

.stw__pointer {
  position: absolute;
  top: -20px; left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  line-height: 0;
}

.stw__body {
  flex: 1;
  padding: 32px 28px 28px 20px;
  display: flex; flex-direction: column; gap: 14px;
}

.stw__title {
  margin: 0;
  font-size: 22px; font-weight: 700;
  line-height: 1.2; letter-spacing: -.01em;
  color: var(--stw-fg);
}

.stw__title--result {
  font-size: 28px;
  font-weight: 800;
}

.stw__subtitle {
  margin: 0;
  font-size: 14px;
  opacity: .72;
  line-height: 1.45;
  color: var(--stw-fg);
}

/* ── Email field ── */
.stw__email-field { display: flex; flex-direction: column; gap: 4px; }
.stw__email-input {
  all: unset;
  display: block;
  width: 100%; box-sizing: border-box;
  padding: 14px 16px;
  border-radius: calc(var(--stw-radius) * 0.6);
  border: 1.5px solid var(--stw-border);
  background: var(--stw-bg);
  color: var(--stw-fg);
  font-size: 16px;
  font-family: inherit;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.stw__email-input:focus {
  border-color: var(--stw-accent);
  box-shadow: 0 0 0 3px rgba(0,0,0,.08);
}
.stw__email-input--error { border-color: #ef4444 !important; }
.stw__email-error { font-size: 12px; color: #ef4444; padding-left: 4px; }

/* ── Consent ── */
.stw__consent {
  display: flex; align-items: flex-start; gap: 8px; cursor: pointer;
}
.stw__consent-input {
  margin-top: 2px; width: 16px; height: 16px; flex-shrink: 0;
  accent-color: var(--stw-accent);
}
.stw__consent-text { font-size: 12px; opacity: .7; line-height: 1.4; }

/* ── CTA button ── */
.stw__cta {
  all: unset;
  display: block;
  background: var(--stw-accent);
  color: var(--stw-accent-fg);
  border-radius: calc(var(--stw-radius) * 0.6);
  padding: 16px;
  font-size: 16px; font-weight: 700; letter-spacing: .01em;
  text-align: center;
  cursor: pointer;
  min-height: 52px;
  transition: filter .15s, transform .06s;
  -webkit-tap-highlight-color: transparent;
  font-family: inherit;
}
.stw__cta:hover { filter: brightness(1.1); }
.stw__cta:active { transform: scale(.98); }

/* ── Wheel stage ── */
.stw__wheel-stage {
  display: flex; flex-direction: column; align-items: center;
  padding: 44px 28px 36px;
  gap: 24px;
}
.stw__wheel-wrap {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
}
.stw__pointer--top {
  position: absolute;
  top: -20px; left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}
.stw__wheel-container {
  width: min(300px, 70vw);
  height: min(300px, 70vw);
  will-change: transform;
}

.stw__spinning-label {
  margin: 0; font-size: 15px; opacity: .65;
  animation: stw-pulse 1s ease-in-out infinite;
  color: var(--stw-fg);
}
@keyframes stw-pulse {
  0%, 100% { opacity: .65; }
  50%       { opacity: 1; }
}

/* ── Result stage ── */
.stw__result-stage {
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
  padding: 48px 32px 36px;
  gap: 14px;
  position: relative;
  overflow: hidden;
}
.stw__result-icon { font-size: 52px; line-height: 1; }
@keyframes stw-shake {
  0%,100% { transform: translateX(0); }
  20%     { transform: translateX(-6px); }
  40%     { transform: translateX(6px); }
  60%     { transform: translateX(-4px); }
  80%     { transform: translateX(4px); }
}
.stw__result-icon--shake { animation: stw-shake 0.5s ease-out; }
.stw__result-prize {
  margin: 0; font-size: 18px; font-weight: 700;
  color: var(--stw-accent);
}

/* ── Promo block ── */
.stw__promo {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  width: 100%; box-sizing: border-box;
}
.stw__promo-pill {
  display: flex; align-items: center; justify-content: center;
  padding: 14px 28px;
  border-radius: 9999px;
  box-shadow: 0 4px 16px rgba(0,0,0,.2);
}
.stw__promo-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 22px; font-weight: 700; letter-spacing: .1em;
  color: #ffffff;
}
.stw__copy {
  all: unset;
  display: flex; align-items: center; gap: 8px;
  background: var(--stw-accent);
  color: var(--stw-accent-fg);
  border-radius: calc(var(--stw-radius) * 0.6);
  padding: 14px 24px;
  font-size: 15px; font-weight: 700;
  cursor: pointer;
  transition: filter .15s, transform .06s;
  min-height: 48px;
  font-family: inherit;
}
.stw__copy:hover { filter: brightness(1.1); }
.stw__copy:active { transform: scale(.97); }
.stw__copy--copied { filter: brightness(0.85) !important; }

/* ── Close button (result stage) ── */
.stw__close-btn {
  all: unset;
  display: block;
  background: transparent;
  border: 1.5px solid var(--stw-border);
  border-radius: calc(var(--stw-radius) * 0.6);
  color: var(--stw-fg);
  opacity: .65;
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
  padding: 12px 28px;
  min-height: 48px;
  text-align: center;
  transition: opacity .15s, border-color .15s;
}
.stw__close-btn:hover { opacity: 1; border-color: var(--stw-fg); }

/* ── Confetti ── */
@keyframes stw-confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(340px) rotate(720deg); opacity: 0; }
}
.stw__confetti {
  position: absolute;
  top: 0;
  animation: stw-confetti-fall 3s ease-out forwards;
  pointer-events: none;
}

/* ── Mobile (bottom-sheet) ── */
@media (max-width: 640px) {
  .stw-wrapper {
    align-items: flex-end;
    justify-content: stretch;
  }
  .stw__card {
    width: 100%;
    max-width: 100%;
    max-height: 92vh;
    border-radius: 24px 24px 0 0;
    transform: translateY(100%);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  :host(.stw--visible) .stw__card {
    transform: translateY(0) scale(1);
  }
  .stw__email-form { flex-direction: column; }
  .stw__wheel-preview {
    flex: none;
    width: 92vw;
    height: 92vw;
    align-self: center;
    margin: 16px auto 0;
  }
  .stw__body { padding: 16px 20px 20px 20px; }
  .stw__title { font-size: 19px; }
  .stw__title--result { font-size: 24px; }
  .stw__cta { font-size: 15px; padding: 15px; }
  .stw__wheel-container {
    width: min(280px, 72vw);
    height: min(280px, 72vw);
  }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .stw-wrapper,
  .stw__card,
  .stw__wheel-container,
  .stw__cta,
  .stw__copy,
  .stw__spinning-label,
  .stw__confetti {
    transition: none !important;
    animation: none !important;
  }
}
`;
}
