import {
  stickyBuyButtonSchema,
  stickyBuyButtonI18nSchema,
  type StickyBuyButtonConfig,
} from './schema';
import { getLanguage } from '@laxarevii/core';

const LOG = '[sticky-buy-button]';
const WIDGET_ID = 'wdg-sticky-buy';
const STYLES_ID = 'wdg-sticky-buy-styles';

export default function stickyBuyButton(
  rawConfig: unknown,
  rawI18n: Record<string, unknown>,
): (() => void) | void {
  console.log(LOG, 'init', { rawConfig, rawI18n });

  const config = stickyBuyButtonSchema.parse(rawConfig);
  const i18nMap = stickyBuyButtonI18nSchema.parse(rawI18n);

  if (!config.enabled) {
    console.log(LOG, 'disabled — exit');
    return;
  }

  const lang = getLanguage();
  console.log(LOG, 'lang:', lang);

  const i18n =
    i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0];
  if (!i18n) {
    console.warn(LOG, 'no i18n found — exit');
    return;
  }

  let bar: HTMLElement | null = null;
  let intersectionObserver: IntersectionObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Helpers ─────────────────────────────────────────────────

  function isMobile(): boolean {
    const result = window.innerWidth <= config.mobileBreakpoint;
    console.log(LOG, `isMobile: ${result} (${window.innerWidth}px <= ${config.mobileBreakpoint}px)`);
    return result;
  }

  function findOriginal(): HTMLElement | null {
    const el = document.querySelector<HTMLElement>(config.buttonSelector);
    console.log(LOG, `findOriginal("${config.buttonSelector}"):`, el ?? 'NOT FOUND');
    return el;
  }

  function readButtonText(original: HTMLElement): string {
    const text =
      original.querySelector('.btn-content')?.textContent?.trim() ||
      original.textContent?.trim() ||
      i18n.buttonText;
    console.log(LOG, 'button text:', text);
    return text;
  }

  // ── DOM ──────────────────────────────────────────────────────

  function injectStyles(cfg: StickyBuyButtonConfig): void {
    if (document.getElementById(STYLES_ID)) return;
    const s = document.createElement('style');
    s.id = STYLES_ID;
    s.textContent = `
      #${WIDGET_ID} {
        position: fixed;
        bottom: ${cfg.bottomOffset}px;
        left: 0;
        right: 0;
        padding: 10px 16px ${cfg.safeAreaPadding ? 'calc(10px + env(safe-area-inset-bottom))' : '10px'};
        background: #fff;
        box-shadow: 0 -2px 16px rgba(0,0,0,.13);
        z-index: ${cfg.zIndex};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.22s ease, opacity 0.22s ease;
      }
      #${WIDGET_ID}.wdg-sbuy--hidden {
        transform: translateY(100%);
        opacity: 0;
        pointer-events: none;
      }
      .wdg-sbuy__btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 520px;
        padding: 14px 24px;
        background: ${cfg.backgroundColor};
        color: ${cfg.textColor};
        border: none;
        border-radius: ${cfg.borderRadius};
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.15s;
        -webkit-tap-highlight-color: transparent;
      }
      .wdg-sbuy__btn:active {
        opacity: 0.8;
      }
      @media (min-width: ${cfg.mobileBreakpoint + 1}px) {
        #${WIDGET_ID} { display: none !important; }
      }
    `;
    document.head.appendChild(s);
    console.log(LOG, 'styles injected');
  }

  function buildBar(text: string): HTMLElement {
    const el = document.createElement('div');
    el.id = WIDGET_ID;
    el.setAttribute('aria-live', 'polite');
    const btn = document.createElement('button');
    btn.className = 'wdg-sbuy__btn';
    btn.type = 'button';
    btn.textContent = text;
    el.appendChild(btn);
    return el;
  }

  // ── Visibility ────────────────────────────────────────────────

  function show(): void {
    console.log(LOG, 'show bar');
    bar?.classList.remove('wdg-sbuy--hidden');
  }

  function hide(): void {
    console.log(LOG, 'hide bar (original visible)');
    bar?.classList.add('wdg-sbuy--hidden');
  }

  function watchOriginal(original: HTMLElement): void {
    intersectionObserver?.disconnect();
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        console.log(LOG, `IntersectionObserver: original isIntersecting=${visible}`);
        if (visible) hide();
        else show();
      },
      { threshold: 0.2 },
    );
    intersectionObserver.observe(original);
    console.log(LOG, 'watching original button with IntersectionObserver');
  }

  // ── Init ──────────────────────────────────────────────────────

  function mount(): void {
    console.log(LOG, 'mount() called, readyState:', document.readyState);

    if (!isMobile()) {
      console.log(LOG, 'not mobile — skip mount');
      return;
    }
    if (document.getElementById(WIDGET_ID)) {
      console.log(LOG, 'bar already exists — skip');
      return;
    }

    const original = findOriginal();
    if (!original) {
      console.log(LOG, `button "${config.buttonSelector}" not found, retry in 600ms`);
      retryTimer = setTimeout(mount, 600);
      return;
    }

    const text = readButtonText(original);
    injectStyles(config);
    bar = buildBar(text);

    bar.querySelector('.wdg-sbuy__btn')!.addEventListener('click', () => {
      console.log(LOG, 'sticky btn clicked → delegating to original');
      original.click();
    });

    bar.classList.add('wdg-sbuy--hidden');
    document.body.appendChild(bar);
    console.log(LOG, 'bar mounted to body');
    watchOriginal(original);

    mutationObserver = new MutationObserver(() => {
      const fresh = findOriginal();
      if (fresh && fresh !== original) {
        console.log(LOG, 'original button replaced by Horoshop JS — re-watching');
        watchOriginal(fresh);
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function onResize(): void {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!isMobile()) {
        console.log(LOG, 'resize → desktop, removing bar');
        document.getElementById(WIDGET_ID)?.remove();
        bar = null;
      } else if (!document.getElementById(WIDGET_ID)) {
        console.log(LOG, 'resize → mobile, re-mounting');
        mount();
      }
    }, 200);
  }

  // ── Bootstrap ─────────────────────────────────────────────────

  console.log(LOG, 'readyState at bootstrap:', document.readyState);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }

  window.addEventListener('resize', onResize, { passive: true });

  // ── Cleanup ───────────────────────────────────────────────────

  return () => {
    console.log(LOG, 'cleanup');
    intersectionObserver?.disconnect();
    mutationObserver?.disconnect();
    if (retryTimer) clearTimeout(retryTimer);
    if (resizeTimer) clearTimeout(resizeTimer);
    window.removeEventListener('resize', onResize);
    document.getElementById(WIDGET_ID)?.remove();
    document.getElementById(STYLES_ID)?.remove();
    bar = null;
  };
}
