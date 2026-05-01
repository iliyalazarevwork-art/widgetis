import {
  cartRecommenderSchema,
  cartRecommenderI18nSchema,
  type CartRecommenderInput,
  type CartRecommenderI18n,
} from './schema';
import { getLanguage } from '@laxarevii/core';
import { buildPopup, animateOut, type Product } from './dom';

const LOG = '[widgetality] cart-recommender:';

interface AjaxCartAppendProduct {
  (
    product: { type: string; id: number; quantity?: number },
    related: unknown,
    isCallCart?: boolean,
  ): void;
}

interface AjaxCartInstance {
  appendProduct: AjaxCartAppendProduct;
  reloadHtml?: () => void;
}

interface AjaxCartStatic {
  getInstance(): AjaxCartInstance;
}

declare global {
  interface Window {
    AjaxCart?: AjaxCartStatic;
  }
}

interface ApiProduct {
  id: number;
  sku?: string;
  horoshop_id?: number | null;
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
}

function extractAlias(pathname: string): string | null {
  const segments = pathname.split('/').filter((s) => s.length > 0);
  if (segments.length === 0) return null;
  if (segments[0] === 'site' && segments.length >= 3) return segments[2] ?? null;
  return segments[0] ?? null;
}

function buildProductFetchUrl(productUrl: string): string {
  const segments = window.location.pathname.split('/').filter((s) => s.length > 0);
  const cleanPath = productUrl.replace(/^\//, '');
  if (segments[0] === 'site' && segments.length >= 2) {
    return `${window.location.origin}/site/${segments[1]}/${cleanPath}`;
  }
  return `${window.location.origin}/${cleanPath}`;
}

async function fetchHoroshopProductId(productUrl: string): Promise<number | null> {
  const url = buildProductFetchUrl(productUrl);
  console.log(LOG, 'fetching horoshop id from', url);
  const html = await fetch(url, { credentials: 'include' }).then((r) => r.text());
  const match = html.match(/id="j-buy-button-(?:counter|widget)-(\d+)"/);
  const id = match ? parseInt(match[1], 10) : null;
  console.log(LOG, 'horoshop product id =', id, 'for url', productUrl);
  return id;
}

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

  if (!matchMedia('(max-width: 768px)').matches) {
    console.log(LOG, 'not mobile — skipping');
    return;
  }

  const alias = extractAlias(window.location.pathname);
  if (!alias) {
    console.log(LOG, 'no alias detected in pathname — skipping');
    return;
  }

  const lang = ((): 'ua' | 'ru' | 'en' => {
    const l = getLanguage();
    if (l === 'ua' || l === 'ru' || l === 'en') return l;
    return 'ua';
  })();

  const localeTexts =
    i18n[lang] ?? i18n['ua'] ?? i18n['ru'] ?? i18n['en'] ?? Object.values(i18n)[0];
  const headingText = localeTexts?.heading ?? 'З цим товаром також беруть';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const apiUrl = `${config.apiBaseUrl}/api/v1/widgets/cart-recommender/suggest?alias=${encodeURIComponent(alias)}`;
  console.log(LOG, 'prefetching', apiUrl);

  let cachedProducts: Product[] | null = null;
  let fetchSettled = false;
  let isOpen = false;
  let patched = false;
  let observer: MutationObserver | null = null;

  const productsPromise: Promise<Product[]> = fetch(apiUrl, {
    credentials: 'omit',
    signal: controller.signal,
  })
    .then((res) => {
      clearTimeout(timeoutId);
      if (!res.ok) {
        console.log(LOG, 'API returned non-OK status', res.status);
        return [] as Product[];
      }
      return res.json().then((json: ApiResponse) => {
        const products = Array.isArray(json.data) ? json.data : [];
        const limited = products.slice(0, config.maxItems) as Product[];
        cachedProducts = limited;
        console.log(LOG, 'prefetch received', limited.length, 'products');
        return limited;
      });
    })
    .catch((err: unknown) => {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(LOG, 'fetch aborted (timeout or cleanup)');
      } else {
        console.error(LOG, 'fetch failed', err);
      }
      return [] as Product[];
    })
    .finally(() => {
      fetchSettled = true;
    });

  function showPopup(products: Product[]): void {
    isOpen = true;

    function closePopup(root: HTMLElement): void {
      isOpen = false;
      void animateOut(root).then(() => {
        root.parentElement?.removeChild(root);
      });
    }

    async function onAddToCart(product: Product): Promise<void> {
      const title = product.title?.ua ?? product.title?.en ?? product.sku ?? String(product.id);
      console.log(LOG, 'add-to-cart clicked:', title, '| sku:', product.sku, '| url:', product.url);

      let horoshopId: number | null = null;

      if (typeof product.horoshop_id === 'number' && Number.isFinite(product.horoshop_id)) {
        horoshopId = product.horoshop_id;
        console.log(LOG, 'horoshop id from API =', horoshopId);
      }

      if (horoshopId === null && product.url) {
        console.log(LOG, 'no horoshop_id from API — falling back to HTML scrape');
        horoshopId = await fetchHoroshopProductId(product.url);
      }

      if (horoshopId === null) {
        console.error(LOG, 'could not resolve horoshop id for', product.url ?? product.sku);
        throw new Error('no-horoshop-id');
      }

      try {
        const ac = window.AjaxCart?.getInstance();
        ac?.appendProduct({ type: 'product', id: horoshopId }, undefined, true);
        console.log(LOG, 'appendProduct called: type=product, id=' + horoshopId + ', sku=' + (product.sku ?? 'n/a'));
      } catch (e) {
        console.error(LOG, 'appendProduct failed', e);
        throw e;
      }
    }

    const root = buildPopup(products, lang, headingText, () => closePopup(root), onAddToCart);
    document.body.appendChild(root);

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        closePopup(root);
        document.removeEventListener('keydown', onKeyDown);
      }
    }
    document.addEventListener('keydown', onKeyDown);

    console.log(LOG, 'popup shown with', products.length, 'products');
  }

  function onProductAdded(): void {
    if (isOpen) return;

    if (cachedProducts !== null) {
      if (cachedProducts.length > 0) showPopup(cachedProducts);
      return;
    }

    if (!fetchSettled) {
      void productsPromise.then((products) => {
        if (isOpen) return;
        if (products.length > 0) showPopup(products);
      });
    }
  }

  function patchAjaxCart(): boolean {
    const ac = window.AjaxCart?.getInstance?.();
    if (!ac || patched) return false;
    const original = ac.appendProduct.bind(ac);
    ac.appendProduct = function (...args: Parameters<AjaxCartAppendProduct>) {
      original.apply(ac, args);
      onProductAdded();
    };
    patched = true;
    console.log(LOG, 'AjaxCart patched');
    return true;
  }

  if (!patchAjaxCart()) {
    observer = new MutationObserver(() => {
      if (patchAjaxCart()) {
        observer?.disconnect();
        observer = null;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log(LOG, 'waiting for AjaxCart via MutationObserver');
  }

  return () => {
    controller.abort();
    clearTimeout(timeoutId);
    observer?.disconnect();
    console.log(LOG, 'cleanup done');
  };
}
