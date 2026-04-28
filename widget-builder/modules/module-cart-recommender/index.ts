import { cartRecommenderSchema, cartRecommenderI18nSchema, type CartRecommenderInput, type CartRecommenderI18n } from './schema';
import { getLanguage } from '@laxarevii/core';
import { buildCard, buildCards, buildContainer, type Product } from './dom';

const LOG = '[widgetality] cart-recommender:';

// ─── AjaxCart types (minimal, mirrors module-one-plus-one/cart.ts) ──────────

interface AjaxCartAppendProduct {
  (product: { type: string; id: number }, related: undefined, openCart: boolean): void;
}

interface AjaxCartStatic {
  getInstance(): { appendProduct: AjaxCartAppendProduct };
}

declare global {
  interface Window {
    AjaxCart?: AjaxCartStatic;
  }
}

// ─── API response types ──────────────────────────────────────────────────────

interface ApiProduct {
  id: number;
  sku?: string;
  url: string;
  image: string;
  title: { ua?: string; en?: string; ru?: string };
  price_new: number;
  price_old?: number;
  currency: string;
  rationale?: { ua?: string; en?: string; ru?: string };
  source?: string;
}

interface ApiResponse {
  data: ApiProduct[];
  meta?: {
    source_product_id?: number;
    source_sku?: string;
    live?: boolean;
  };
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

/**
 * Extract the product URL alias from window.location.pathname.
 *
 * Site-proxy URL:  /site/benihome.com.ua/postilna-bilizna-.../
 *   → alias: 'postilna-bilizna-...'
 * Production URL: /postilna-bilizna-.../
 *   → alias: 'postilna-bilizna-...'
 */
function extractAlias(pathname: string): string | null {
  const segments = pathname.split('/').filter((s) => s.length > 0);

  if (segments.length === 0) return null;

  // Drop 'site' + hostname prefix when running through site-proxy
  if (segments[0] === 'site' && segments.length >= 3) {
    // segments[0] = 'site', segments[1] = hostname, segments[2] = alias
    return segments[2] ?? null;
  }

  // Production: first (and typically only) segment is the alias
  return segments[0] ?? null;
}

// ─── Mount target helpers ────────────────────────────────────────────────────

function findMountTarget(mountSelector: string): Element | null {
  const selectors = mountSelector.split(',').map((s) => s.trim()).filter(Boolean);
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function cartRecommender(
  rawConfig: CartRecommenderInput,
  rawI18n: Record<string, CartRecommenderI18n[string]>,
): (() => void) | void {
  const config = cartRecommenderSchema.parse(rawConfig);
  const i18n = cartRecommenderI18nSchema.parse(rawI18n);

  console.log(LOG, 'init');

  if (!config.enabled) {
    console.log(LOG, 'disabled — skipping');
    return;
  }

  // Extract alias from current URL
  const alias = extractAlias(window.location.pathname);
  if (!alias) {
    console.log(LOG, 'no alias detected in pathname — skipping');
    return;
  }

  // Mobile-only guard
  if (!matchMedia('(max-width: 768px)').matches) {
    console.log(LOG, 'not mobile — skipping');
    return;
  }

  const lang = ((): 'ua' | 'ru' | 'en' => {
    const l = getLanguage();
    if (l === 'ua' || l === 'ru' || l === 'en') return l;
    return 'ua';
  })();

  const localeTexts =
    i18n[lang] ?? i18n['ua'] ?? i18n['ru'] ?? i18n['en'] ?? Object.values(i18n)[0];
  const buttonText = localeTexts?.buttonAddToCart ?? 'До кошика';
  const headingText = localeTexts?.heading ?? 'Часто беруть разом';

  // ─── Inserted nodes tracker ──────────────────────────────────────────────

  const insertedNodes: Element[] = [];

  // ─── Fetch + render ──────────────────────────────────────────────────────

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const apiUrl = `${config.apiBaseUrl}/api/v1/widget/cart-recommender/suggest?alias=${encodeURIComponent(alias)}`;

  console.log(LOG, 'fetching', apiUrl);

  fetch(apiUrl, {
    credentials: 'omit',
    signal: controller.signal,
  })
    .then((res) => {
      clearTimeout(timeoutId);
      if (!res.ok) {
        console.log(LOG, 'API returned non-OK status', res.status);
        return null;
      }
      return res.json() as Promise<ApiResponse>;
    })
    .then((json) => {
      if (!json) return;

      const products = json.data;
      if (!Array.isArray(products) || products.length === 0) {
        console.log(LOG, 'empty data — nothing to render');
        return;
      }

      const limited = products.slice(0, config.maxItems) as Product[];

      const mountTarget = findMountTarget(config.mountSelector);
      if (!mountTarget) {
        console.log(LOG, 'mount target not found for selector', config.mountSelector);
        return;
      }

      const container = buildContainer(headingText);
      const cards = buildCards(limited, lang, buttonText);
      container.appendChild(cards);

      mountTarget.appendChild(container);
      insertedNodes.push(container);

      console.log(LOG, 'rendered', limited.length, 'cards into', mountTarget);
    })
    .catch((err: unknown) => {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(LOG, 'fetch aborted (timeout or cleanup)');
      } else {
        console.error(LOG, 'fetch failed', err);
      }
    });

  // ─── Click handler (delegated) ───────────────────────────────────────────

  function onBodyClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const btn = target.closest<HTMLElement>('[data-wdg-rec-add]');
    if (!btn) return;

    const idStr = btn.getAttribute('data-wdg-rec-add');
    if (!idStr) return;

    const id = Number(idStr);
    if (!Number.isFinite(id)) return;

    console.log(LOG, 'add to cart clicked, product id', id);

    try {
      window.AjaxCart?.getInstance().appendProduct(
        { type: 'product', id },
        undefined,
        true,
      );
    } catch (e) {
      console.error(LOG, 'appendProduct failed', e);
    }
  }

  document.body.addEventListener('click', onBodyClick);

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  return () => {
    controller.abort();
    clearTimeout(timeoutId);

    document.body.removeEventListener('click', onBodyClick);

    for (const node of insertedNodes) {
      node.parentElement?.removeChild(node);
    }

    // Also remove any stray data-wdg-rec nodes (legacy cleanup)
    for (const node of document.querySelectorAll('[data-wdg-rec]')) {
      node.parentElement?.removeChild(node);
    }

    console.log(LOG, 'cleanup done');
  };
}
