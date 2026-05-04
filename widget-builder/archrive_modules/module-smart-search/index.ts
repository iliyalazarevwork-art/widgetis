import { smartSearchSchema, smartSearchI18nSchema, type SmartSearchInput, type SmartSearchI18nEntry } from './schema';
import { getLanguage } from '@laxarevii/core';
import { buildCSS } from './styles';
import { buildSearchUrl, searchProducts, type SearchResponse } from './api';
import * as history from './history';
import { loadFeed, getFeedIndex } from './feed';
import { localSearch } from './local-search';
import {
  buildOverlayShell,
  buildPanel,
  buildHandle,
  buildHeader,
  buildChipsRow,
  buildResultsArea,
  buildGroupBlock,
  buildSkeletonGrid,
  buildEmptyState,
  buildCorrectionLine,
  buildHistoryWrap,
  buildStatusBar,
} from './dom';

const STYLE_ID = 'ssrch-styles';
const ROOT_ATTR = 'data-ssrch-root';

function injectStyles(accent: string, theme: 'light' | 'dark'): void {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = buildCSS(accent, theme);
  document.head.appendChild(el);
}

function resolveApiLang(lang: string): string {
  const map: Record<string, string> = { ua: 'uk', ru: 'ru', en: 'en', pl: 'pl' };
  return map[lang] ?? 'uk';
}

function makeDebounce<T extends unknown[]>(fn: (...args: T) => void, ms: number): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: T) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export default function smartSearch(
  rawConfig: SmartSearchInput,
  rawI18n: Record<string, SmartSearchI18nEntry>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = smartSearchSchema.parse(rawConfig);
  const i18nMap = smartSearchI18nSchema.parse(rawI18n);

  if (!config.enabled) {
    console.warn('[widgetality] smart-search: ⚠️ disabled');
    return;
  }

  const detectedLang = config.defaultLang === 'auto' ? getLanguage() : config.defaultLang;
  const i18n: SmartSearchI18nEntry =
    i18nMap[detectedLang] ??
    i18nMap['ua'] ??
    i18nMap['ru'] ??
    (Object.values(i18nMap)[0] as SmartSearchI18nEntry);

  if (!i18n) {
    throw new Error(
      `[smart-search] No translations for language "${detectedLang}". Available: ${Object.keys(i18nMap).join(', ')}`,
    );
  }

  const apiLang = resolveApiLang(detectedLang);

  console.log('[widgetality] smart-search: ✅ activated');

  injectStyles(config.accentColor, config.theme);

  const feedUrl = config.apiUrl.endsWith('/') ? config.apiUrl + 'feed' : config.apiUrl + '/feed';
  loadFeed(feedUrl, apiLang);

  // ── State ──────────────────────────────────────────────────────────────────

  let isOpen = false;
  let activeCategory = '';
  let lastResponse: SearchResponse | null = null;
  let abortController: AbortController | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let savedOverflow = '';
  let touchStartY = 0;

  // ── DOM assembly ───────────────────────────────────────────────────────────

  const backdrop = buildOverlayShell();
  const panel = buildPanel();
  const handle = buildHandle();
  const { header, input, closeBtn, border } = buildHeader(i18n);

  const ssrchRoot = document.createElement('div');
  ssrchRoot.className = 'ssrch-root';

  const contentArea = document.createElement('div');

  panel.appendChild(handle);
  panel.appendChild(header);
  panel.appendChild(border);
  panel.appendChild(contentArea);

  ssrchRoot.appendChild(backdrop);
  backdrop.appendChild(panel);
  document.body.appendChild(ssrchRoot);

  // ── Open / Close ───────────────────────────────────────────────────────────

  function open(): void {
    if (isOpen) return;
    isOpen = true;

    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    backdrop.classList.add('ssrch-open');
    backdrop.classList.remove('ssrch-closing');

    requestAnimationFrame(() => {
      input.focus();
      renderHistory();
    });
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;

    backdrop.classList.add('ssrch-closing');
    backdrop.classList.remove('ssrch-open');

    document.body.style.overflow = savedOverflow;

    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    setTimeout(() => {
      backdrop.classList.remove('ssrch-closing');
    }, 260);
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function setHasResults(yes: boolean): void {
    if (yes) {
      ssrchRoot.classList.add('has-results');
    } else {
      ssrchRoot.classList.remove('has-results');
    }
  }

  function renderHistory(): void {
    if (!config.searchHistory) return;
    const entries = history.read();
    if (entries.length === 0) {
      contentArea.innerHTML = '';
      setHasResults(false);
      return;
    }

    contentArea.innerHTML = '';
    setHasResults(false);

    const wrap = buildHistoryWrap(entries, i18n);

    wrap.querySelector('.ssrch-history-clear')!.addEventListener('click', () => {
      history.clear();
      contentArea.innerHTML = '';
    });

    wrap.querySelectorAll<HTMLSpanElement>('.ssrch-history-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        const removeBtn = (e.target as Element).closest('.ssrch-history-chip-remove');
        if (removeBtn) {
          e.stopPropagation();
          const idx = Number(removeBtn.getAttribute('data-idx'));
          history.remove(idx);
          renderHistory();
          return;
        }
        const q = chip.dataset.query ?? '';
        input.value = q;
        triggerSearch(q);
      });
    });

    contentArea.appendChild(wrap);
  }

  function renderSkeleton(): void {
    contentArea.innerHTML = '';
    setHasResults(false);
    contentArea.appendChild(buildSkeletonGrid());
  }

  function renderResults(resp: SearchResponse, query: string): void {
    contentArea.innerHTML = '';

    const accentOverride = resp.accentColor ? `#${resp.accentColor}` : null;
    if (accentOverride) {
      ssrchRoot.style.setProperty('--ssrch-accent', accentOverride);
    }

    const currency = resp.currency ?? config.currency;
    const totalShown = Object.values(resp.groups).reduce(
      (sum, g) => sum + Math.min(g.items.length, activeCategory ? g.items.length : 4),
      0,
    );

    if (resp.correction) {
      contentArea.appendChild(buildCorrectionLine(resp.correction, i18n));
    }

    const groupEntries = Object.entries(resp.groups);

    if (groupEntries.length === 0) {
      setHasResults(false);
      contentArea.appendChild(buildEmptyState(query, i18n, config.popularQueries));
      attachPopularChipListeners(contentArea, query);
      return;
    }

    setHasResults(true);

    const totalGroupItems = Object.values(resp.groups).reduce((s, g) => s + g.total, 0);
    const { wrap: chipsWrap, chips } = buildChipsRow(
      resp.groups,
      resp.categoryUrls,
      i18n,
      totalGroupItems,
    );

    chips.forEach((chip, key) => {
      chip.addEventListener('click', () => {
        activeCategory = key;
        chips.forEach((c, k) => {
          c.classList.toggle('ssrch-chip--active', k === key);
        });
        renderResultsArea(resp, query, currency);
        if (key !== '') {
          triggerSearch(query, config.limitExpanded);
        }
      });
    });

    contentArea.appendChild(chipsWrap);

    const resultsArea = buildResultsArea();
    resultsArea.id = 'ssrch-results-area';
    contentArea.appendChild(resultsArea);

    renderResultsArea(resp, query, currency);

    const firstCategoryUrl = Object.values(resp.categoryUrls)[0];
    const footer = buildStatusBar(totalShown, resp.total, firstCategoryUrl, i18n);
    contentArea.appendChild(footer);
  }

  function renderResultsArea(resp: SearchResponse, query: string, currency: string): void {
    const area = contentArea.querySelector('#ssrch-results-area') as HTMLDivElement | null;
    if (!area) return;
    area.innerHTML = '';

    const groupEntries = Object.entries(resp.groups);
    const isExpanded = activeCategory !== '';

    for (const [key, group] of groupEntries) {
      if (isExpanded && key !== activeCategory) continue;
      const categoryUrl = resp.categoryUrls[key];
      const block = buildGroupBlock(key, group, query, categoryUrl, i18n, currency, isExpanded);
      area.appendChild(block);
    }
  }

  function attachPopularChipListeners(container: HTMLElement, _query: string): void {
    container.querySelectorAll<HTMLButtonElement>('.ssrch-popular-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const q = chip.dataset.query ?? '';
        input.value = q;
        triggerSearch(q);
      });
    });
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  async function performSearch(query: string, limit: number): Promise<void> {
    // Instant local search — no network round-trip
    const localIndex = getFeedIndex();
    if (localIndex !== null) {
      const resp = localSearch(
        localIndex,
        query,
        activeCategory === '' ? config.limitPreview : limit,
        activeCategory,
      );
      lastResponse = resp;
      renderResults(resp, query);
      return;
    }

    // Fallback: server-side search
    if (abortController) abortController.abort();
    abortController = new AbortController();

    renderSkeleton();

    const url = buildSearchUrl(config.apiUrl, query, limit);

    try {
      const resp = await searchProducts(url, apiLang, abortController.signal);
      lastResponse = resp;

      if (resp.loading) {
        // API still indexing — show shimmer and retry
        retryTimer = setTimeout(() => performSearch(query, limit), 2000);
        return;
      }

      renderResults(resp, query);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      contentArea.innerHTML = '';
      setHasResults(false);
      const errEl = document.createElement('div');
      errEl.className = 'ssrch-empty';
      errEl.innerHTML = `<div class="ssrch-empty-title">${i18n.error_text}</div>`;
      contentArea.appendChild(errEl);
    }
  }

  function triggerSearch(query: string, limit?: number): void {
    activeCategory = '';
    const q = query.trim();
    if (q.length < config.minQueryLength) {
      renderHistory();
      return;
    }
    performSearch(q, limit ?? config.limitPreview).catch(() => {});
  }

  const debouncedSearch = makeDebounce((q: string) => triggerSearch(q), config.debounceMs);

  // ── Input events ───────────────────────────────────────────────────────────

  function onInputChange(): void {
    debouncedSearch(input.value);
  }

  input.addEventListener('input', onInputChange);

  // ── Keyboard navigation ────────────────────────────────────────────────────

  function getFocusableItems(): HTMLAnchorElement[] {
    return Array.from(ssrchRoot.querySelectorAll<HTMLAnchorElement>('.ssrch-item'));
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = getFocusableItems();
      if (items.length === 0) return;

      const focused = document.activeElement;
      const idx = items.indexOf(focused as HTMLAnchorElement);

      if (e.key === 'ArrowDown') {
        const next = idx < items.length - 1 ? items[idx + 1] : items[0];
        next?.focus();
      } else {
        const prev = idx > 0 ? items[idx - 1] : items[items.length - 1];
        prev?.focus();
      }
      return;
    }

    if (e.key === 'Enter') {
      const focused = document.activeElement as HTMLAnchorElement | null;
      if (focused?.classList.contains('ssrch-item') && focused.href) {
        const q = input.value.trim();
        if (q) history.add(q);
        window.location.href = focused.href;
        e.preventDefault();
      }
    }
  }

  function onGlobalKeyDown(e: KeyboardEvent): void {
    const isK = e.key === 'k' || e.key === 'K';
    if ((e.metaKey || e.ctrlKey) && isK) {
      e.preventDefault();
      isOpen ? close() : open();
      return;
    }
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      close();
    }
  }

  document.addEventListener('keydown', onGlobalKeyDown);
  ssrchRoot.addEventListener('keydown', onKeyDown);

  // Dismiss on backdrop click (outside panel)
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  closeBtn.addEventListener('click', close);

  // Save history on item click
  ssrchRoot.addEventListener('click', (e) => {
    const item = (e.target as Element).closest<HTMLAnchorElement>('.ssrch-item');
    if (!item) return;
    const q = input.value.trim();
    if (q && config.searchHistory) history.add(q);
  });

  // ── Mobile swipe-down-to-close ─────────────────────────────────────────────

  panel.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0]?.clientY ?? 0;
  }, { passive: true });

  panel.addEventListener('touchend', (e) => {
    const endY = e.changedTouches[0]?.clientY ?? 0;
    const delta = endY - touchStartY;
    // Close if dragged down more than 80px
    if (delta > 80) close();
  }, { passive: true });

  // ── Horoshop search hooks ──────────────────────────────────────────────────

  const cleanupFns: Array<() => void> = [];

  function hookElement(
    el: Element,
    events: string[],
    handler: (e: Event) => void,
  ): void {
    for (const ev of events) {
      el.addEventListener(ev, handler);
      cleanupFns.push(() => el.removeEventListener(ev, handler));
    }
  }

  function hookSearchForm(): void {
    const forms = document.querySelectorAll('.header__section--search form');
    forms.forEach((form) => {
      hookElement(form, ['submit'], (e) => {
        e.preventDefault();
        open();
      });
    });
  }

  function hookSearchInput(): void {
    const inputs = document.querySelectorAll<HTMLInputElement>('.search__input');
    inputs.forEach((el) => {
      hookElement(el, ['focus', 'click'], (e) => {
        e.preventDefault();
        (el as HTMLInputElement).blur();
        open();
      });
    });
  }

  function hookSearchButton(): void {
    const buttons = document.querySelectorAll('.search__button');
    buttons.forEach((btn) => {
      hookElement(btn, ['click'], (e) => {
        e.preventDefault();
        open();
      });
    });
  }

  function hookSearchToggle(): void {
    const toggles = document.querySelectorAll<HTMLElement>('[data-button-action="search-toggle"]');
    toggles.forEach((el) => {
      // Prevent Horoshop's own handler from competing
      el.removeAttribute('href');
      el.removeAttribute('data-button-action');

      hookElement(el, ['click'], (e) => {
        e.preventDefault();
        // Close Horoshop's native search results panel if present
        const native = document.getElementById('search-results');
        if (native) native.style.display = 'none';
        open();
      });
    });
  }

  hookSearchForm();
  hookSearchInput();
  hookSearchButton();
  hookSearchToggle();

  // ── Cleanup ────────────────────────────────────────────────────────────────

  return () => {
    document.removeEventListener('keydown', onGlobalKeyDown);
    cleanupFns.forEach((fn) => fn());
    if (abortController) abortController.abort();
    if (retryTimer !== null) clearTimeout(retryTimer);
    if (isOpen) document.body.style.overflow = savedOverflow;
    ssrchRoot.remove();
    document.getElementById(STYLE_ID)?.remove();
  };
}
