import { cartRecommenderSchema, cartRecommenderI18nSchema, type CartRecommenderInput, type CartRecommenderI18n } from './schema';
import { getLanguage } from '@laxarevii/core';
import { buildCard } from './dom';

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

// ─── Main ────────────────────────────────────────────────────────────────────

export default function cartRecommender(
  rawConfig: CartRecommenderInput,
  rawI18n: Record<string, CartRecommenderI18n[string]>,
): (() => void) | void {
  const config = cartRecommenderSchema.parse(rawConfig);
  const i18n = cartRecommenderI18nSchema.parse(rawI18n);

  console.log(LOG, 'init');

  if (!config.enabled || config.products.length === 0) {
    console.log(LOG, 'disabled or no products — skipping');
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

  const product = config.products[0];

  // ─── Inject card into a wrapper ──────────────────────────────────────────

  function inject(wrapper: Element): void {
    if (wrapper.getAttribute('data-wdg-rec-injected') === '1') return;

    const card = buildCard(product, lang, buttonText);
    wrapper.prepend(card);
    wrapper.setAttribute('data-wdg-rec-injected', '1');

    console.log(LOG, 'injected card for product', product.id, 'into wrapper', wrapper);
  }

  // ─── MutationObserver ────────────────────────────────────────────────────

  function findAndInject(): void {
    const wrapper = document.querySelector<Element>(
      '.j-cart-additional .carousel__wrapper',
    );
    if (!wrapper) return;
    inject(wrapper);
  }

  const observer = new MutationObserver(() => {
    findAndInject();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log(LOG, 'observer started');

  // Run immediately in case the carousel is already in DOM
  findAndInject();

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
    observer.disconnect();
    document.body.removeEventListener('click', onBodyClick);

    // Remove all injected nodes
    for (const node of document.querySelectorAll('[data-wdg-rec]')) {
      node.parentElement?.removeChild(node);
    }

    // Remove injected marker so if re-mounted it can inject again
    for (const wrapper of document.querySelectorAll('[data-wdg-rec-injected]')) {
      wrapper.removeAttribute('data-wdg-rec-injected');
    }

    console.log(LOG, 'cleanup done');
  };
}
