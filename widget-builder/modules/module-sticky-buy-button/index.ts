import {
  stickyBuyButtonSchema,
  stickyBuyButtonI18nSchema,
  type StickyBuyButtonConfig,
} from './schema';
import { getLanguage } from '@laxarevii/core';

const WIDGET_ID = 'wdg-sticky-buy';
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

  let bar: HTMLElement | null = null;
  let intersectionObserver: IntersectionObserver | null = null;
  let mutationObserver: MutationObserver | null = null;
  let barResizeObserver: ResizeObserver | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  let hasScrolled = false;
  let savedBodyPadding: string | null = null;

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
        #${WIDGET_ID} { display: none !important; }
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

  function applyBodyPadding(): void {
    if (!bar) return;
    if (savedBodyPadding === null) {
      savedBodyPadding = document.body.style.paddingBottom;
    }
    const h = bar.offsetHeight;
    console.log(`[wdg-sticky-buy] bar height: ${h}px`);
    document.body.style.paddingBottom = h + 'px';
  }

  function removeBodyPadding(): void {
    if (savedBodyPadding !== null) {
      document.body.style.paddingBottom = savedBodyPadding;
      savedBodyPadding = null;
    }
  }

  function show(): void {
    if (!hasScrolled) return;
    bar?.classList.remove('wdg-sbuy--hidden');
    applyBodyPadding();
  }

  function hide(): void {
    bar?.classList.add('wdg-sbuy--hidden');
    removeBodyPadding();
  }

  function watchOriginal(original: HTMLElement): void {
    intersectionObserver?.disconnect();
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const rect = original.getBoundingClientRect();
        if (entries[0].isIntersecting) {
          hide();
        } else {
          if (rect.top < 0) show();
          else hide();
        }
      },
      { threshold: 0.2 },
    );
    intersectionObserver.observe(original);
  }

  function mount(): void {
    if (!isMobile()) return;
    if (document.getElementById(WIDGET_ID)) return;

    const original = findOriginal();
    if (!original) {
      retryTimer = setTimeout(mount, 600);
      return;
    }

    const text = readButtonText(original);
    injectStyles(config);
    bar = buildBar(text);

    bar.querySelector('.wdg-sbuy__btn')!.addEventListener('click', () => {
      original.click();
    });

    bar.classList.add('wdg-sbuy--hidden');
    document.body.appendChild(bar);
    watchOriginal(original);

    mutationObserver = new MutationObserver(() => {
      const fresh = findOriginal();
      if (fresh && fresh !== original) watchOriginal(fresh);
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function onResize(): void {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!isMobile()) {
        document.getElementById(WIDGET_ID)?.remove();
        bar = null;
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

  window.addEventListener('scroll', function onScrollThreshold() {
    if (hasScrolled) return;
    if (window.scrollY < 300) return;

    hasScrolled = true;
    window.removeEventListener('scroll', onScrollThreshold);
    intersectionObserver?.disconnect();

    const original = findOriginal();
    if (!original) return;

    // Immediately show if button is already above viewport — don't wait for IO callback
    const rect = original.getBoundingClientRect();
    if (rect.top < 0) show();

    watchOriginal(original);
  }, { passive: true });

  window.addEventListener('resize', onResize, { passive: true });

  return () => {
    intersectionObserver?.disconnect();
    mutationObserver?.disconnect();
    if (retryTimer) clearTimeout(retryTimer);
    if (resizeTimer) clearTimeout(resizeTimer);
    window.removeEventListener('resize', onResize);
    document.getElementById(WIDGET_ID)?.remove();
    document.getElementById(STYLES_ID)?.remove();
    removeBodyPadding();
    bar = null;
    hasScrolled = false;
  };
}
