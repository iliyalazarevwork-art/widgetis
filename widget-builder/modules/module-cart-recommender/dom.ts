// ─── Product interface ────────────────────────────────────────

export interface Product {
  id: number;
  sku?: string;
  url: string;
  image: string;
  title: { ua?: string; en?: string; ru?: string };
  price_new: number;
  price_old?: number;
  currency: string;
  rationale?: { ua?: string; en?: string; ru?: string };
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Format a price number with thousands separated by non-breaking space,
 * followed by the currency symbol.
 * e.g. formatPrice(4340, 'грн') → '4 340 грн'
 */
export function formatPrice(n: number, currency: string): string {
  const formatted = n.toLocaleString('uk-UA').replace(/\s/g, ' ');
  return `${formatted} ${currency}`;
}

/**
 * Pick the best available locale string from a title object.
 */
function pickLocale(
  obj: { ua?: string; en?: string; ru?: string },
  lang: 'ua' | 'ru' | 'en',
): string {
  return obj[lang] ?? obj.ua ?? obj.en ?? obj.ru ?? '';
}

// ─── Card builder ─────────────────────────────────────────────

/**
 * Build a `.carousel__item` element that visually matches Horoshop's
 * existing markup so it slides in seamlessly with their carousel JS.
 *
 * User-controlled strings are set via textContent (never innerHTML)
 * to prevent XSS.
 */
export function buildCard(
  product: Product,
  lang: 'ua' | 'ru' | 'en',
  buttonText: string,
): HTMLElement {
  const title = pickLocale(product.title, lang);
  const priceNew = formatPrice(product.price_new, product.currency);

  // ── Outer wrapper ──────────────────────────────────────────
  const item = document.createElement('div');
  item.className = 'carousel__item';
  item.setAttribute('data-wdg-rec', String(product.id));

  // ── catalog-card ──────────────────────────────────────────
  const card = document.createElement('div');
  card.className = 'catalog-card catalog-card--small';

  // ── Link ──────────────────────────────────────────────────
  const link = document.createElement('a');
  link.href = product.url;
  link.className = 'catalog-card__link link link--touch';

  // ── Image section ─────────────────────────────────────────
  const imageSection = document.createElement('div');
  imageSection.className = 'catalog-card__image';

  const imageDiv = document.createElement('div');
  imageDiv.className = 'image';

  const imageBox = document.createElement('div');
  imageBox.className = 'image__box';

  const img = document.createElement('img');
  img.alt = title;
  img.title = title;
  img.className = 'image__src';
  img.src = product.image;

  imageBox.appendChild(img);
  imageDiv.appendChild(imageBox);
  imageSection.appendChild(imageDiv);

  // ── Title ─────────────────────────────────────────────────
  const titleDiv = document.createElement('div');
  titleDiv.className = 'catalog-card__title';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'link';
  titleSpan.textContent = title;

  titleDiv.appendChild(titleSpan);

  // ── Prices ────────────────────────────────────────────────
  const pricesDiv = document.createElement('div');
  pricesDiv.className = 'catalog-card__prices';

  const priceNewDiv = document.createElement('div');
  priceNewDiv.className = 'catalog-card__price catalog-card__price--new';
  priceNewDiv.textContent = priceNew;

  pricesDiv.appendChild(priceNewDiv);

  if (product.price_old != null) {
    const priceOldDiv = document.createElement('div');
    priceOldDiv.className = 'catalog-card__old-price';
    priceOldDiv.textContent = formatPrice(product.price_old, product.currency);
    pricesDiv.appendChild(priceOldDiv);
  }

  // Assemble link
  link.appendChild(imageSection);
  link.appendChild(titleDiv);
  link.appendChild(pricesDiv);

  // ── Add-to-cart button ────────────────────────────────────
  const orderDiv = document.createElement('div');
  orderDiv.className = 'catalog-card__order';

  const btn = document.createElement('div');
  btn.className = 'btn btn--small btn--primary';
  btn.setAttribute('data-wdg-rec-add', String(product.id));
  btn.textContent = buttonText;

  orderDiv.appendChild(btn);

  // Assemble card
  card.appendChild(link);
  card.appendChild(orderDiv);

  item.appendChild(card);

  return item;
}

/**
 * Build a wrapper element containing all product cards.
 */
export function buildCards(
  products: Product[],
  lang: 'ua' | 'ru' | 'en',
  buttonText: string,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'wdg-cart-rec__carousel';

  for (const product of products) {
    wrapper.appendChild(buildCard(product, lang, buttonText));
  }

  return wrapper;
}

/**
 * Build the outer container block with heading and an inner grid/carousel area.
 * Append the cards wrapper returned by buildCards() into the returned element.
 */
export function buildContainer(headingText: string): HTMLElement {
  const container = document.createElement('div');
  container.className = 'wdg-cart-recommender';
  container.setAttribute('data-wdg-rec-container', '1');

  const heading = document.createElement('div');
  heading.className = 'wdg-cart-rec__heading';
  heading.textContent = headingText;

  container.appendChild(heading);

  return container;
}
