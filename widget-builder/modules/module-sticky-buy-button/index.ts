import {
  stickyBuyButtonSchema,
  stickyBuyButtonI18nSchema,
  type StickyBuyButtonConfig,
} from './schema';
import { getLanguage, isHoroshopProductPage } from '@laxarevii/core';

const WIDGET_ID = 'wdg-sticky-buy';
const SPACER_ID = 'wdg-sticky-buy-spacer';
const STYLES_ID = 'wdg-sticky-buy-styles';

export default function stickyBuyButton(
  rawConfig: unknown,
  rawI18n: Record<string, unknown>,
): (() => void) | void {
  const config = stickyBuyButtonSchema.parse(rawConfig);
  const i18nMap = stickyBuyButtonI18nSchema.parse(rawI18n);

  if (!config.enabled) return;

  const lang = getLanguage();
  const i18n =
    i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0];
  if (!i18n) return;

  const SCROLL_THRESHOLD = 300;

  let bar: HTMLElement | null = null;
  let spacer: HTMLElement | null = null;
  let mutationObserver: MutationObserver | null = null;
  let barResizeObserver: ResizeObserver | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  let originalEl: HTMLElement | null = null;

  function isMobile(): boolean {
    return window.innerWidth <= config.mobileBreakpoint;
  }

  function findOriginal(): HTMLElement | null {
    return document.querySelector<HTMLElement>(config.buttonSelector);
  }

  function readButtonText(original: HTMLElement): string {
    return (
      original.querySelector('.btn-content')?.textContent?.trim() ||
      original.textContent?.trim() ||
      i18n.buttonText
    );
  }

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
        #${WIDGET_ID}, #${SPACER_ID} { display: none !important; }
      }
    `;
    document.head.appendChild(s);
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

  function syncSpacerHeight(): void {
    if (!bar || !spacer) return;
    const h = bar.offsetHeight;
    spacer.style.height = h + 'px';
    console.log(`[wdg-sticky-buy] spacer height: ${h}px`);
  }

  function show(): void {
    bar?.classList.remove('wdg-sbuy--hidden');
  }

  function hide(): void {
    bar?.classList.add('wdg-sbuy--hidden');
  }

  function updateVisibility(): void {
    if (!bar) return;
    if (window.scrollY > SCROLL_THRESHOLD) show();
    else hide();
  }

  function mount(): void {
    console.log(`[wdg-sticky-buy] mount(): isMobile=${isMobile()} (width=${window.innerWidth})`);
    if (!isMobile()) return;
    if (!isHoroshopProductPage()) {
      console.warn('[wdg-sticky-buy] skipped — not a product page');
      return;
    }
    if (document.getElementById(WIDGET_ID)) return;

    const original = findOriginal();
    console.log(`[wdg-sticky-buy] findOriginal("${config.buttonSelector}"):`, original);
    if (!original) {
      retryTimer = setTimeout(mount, 600);
      return;
    }

    originalEl = original;
    const text = readButtonText(original);
    injectStyles(config);
    bar = buildBar(text);
    bar.classList.add('wdg-sbuy--hidden');
    document.body.appendChild(bar);

    // Spacer reserves space equal to bar height so content is never hidden under the bar.
    // It lives for the entire widget lifetime — page height stays constant during show/hide
    // cycles, which prevents scroll feedback loops with IntersectionObserver.
    spacer = document.createElement('div');
    spacer.id = SPACER_ID;
    spacer.style.cssText = 'pointer-events:none;';
    document.body.appendChild(spacer);

    barResizeObserver = new ResizeObserver((entries) => {
      const h = Math.round(entries[0].contentRect.height);
      console.log(`[wdg-sticky-buy] bar height changed: ${h}px`);
      syncSpacerHeight();
    });
    barResizeObserver.observe(bar);

    // Initial height sync after first paint so offsetHeight is accurate
    requestAnimationFrame(syncSpacerHeight);

    bar.querySelector('.wdg-sbuy__btn')!.addEventListener('click', () => {
      originalEl?.click();
    });

    updateVisibility();

    mutationObserver = new MutationObserver(() => {
      const fresh = findOriginal();
      if (fresh && fresh !== originalEl) originalEl = fresh;
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function onResize(): void {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!isMobile()) {
        document.getElementById(WIDGET_ID)?.remove();
        document.getElementById(SPACER_ID)?.remove();
        bar = null;
        spacer = null;
      } else if (!document.getElementById(WIDGET_ID)) {
        mount();
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }

  function onScroll(): void {
    updateVisibility();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  return () => {
    mutationObserver?.disconnect();
    barResizeObserver?.disconnect();
    if (retryTimer) clearTimeout(retryTimer);
    if (resizeTimer) clearTimeout(resizeTimer);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    document.getElementById(WIDGET_ID)?.remove();
    document.getElementById(SPACER_ID)?.remove();
    document.getElementById(STYLES_ID)?.remove();
    bar = null;
    spacer = null;
    originalEl = null;
  };
}
