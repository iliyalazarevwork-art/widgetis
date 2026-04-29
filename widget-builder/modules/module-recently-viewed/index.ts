import { recentlyViewedSchema, recentlyViewedI18nSchema, type RecentlyViewedConfig } from './schema';
import { loadViewed, saveViewed, addViewed, type ViewedProduct } from './storage';
import { getLanguage, isHoroshopProductPage } from '@laxarevii/core';

const ROOT_CLASS = 'wdg-rv';
const STYLES_ID = 'wdg-rv-styles';

type I18nEntry = { heading: string; viewAll?: string };

export default function recentlyViewed(
  rawConfig: unknown,
  rawI18n: unknown,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = recentlyViewedSchema.parse(rawConfig);
  const i18nMap = recentlyViewedI18nSchema.parse(rawI18n);

  if (!config.enabled) {
    console.warn('[widgetality] recently-viewed: ⚠️ disabled');
    return;
  }

  const lang = getLanguage();
  const i18n: I18nEntry =
    i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  // ---- Track current page if it's a product page -------------------------
  if (isHoroshopProductPage()) {
    trackCurrentProduct(config);
  }

  console.log('[widgetality] recently-viewed: ✅ activated');

  // ---- Render ------------------------------------------------------------
  const elements: HTMLElement[] = [];
  let mounted = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  function mount(): void {
    if (mounted) return;

    const currentUrl = relativeUrl(window.location.href);
    const allItems = loadViewed();
    const items = allItems.filter((item) => item.url !== currentUrl);

    if (items.length < config.minItems) return;

    injectStyles(config);

    for (const { selector, insert } of config.selectors) {
      const ref = document.querySelector(selector);
      if (!ref || !ref.isConnected) continue;
      const section = buildSection(config, i18n, items);
      try {
        ref.insertAdjacentElement(insert === 'before' ? 'beforebegin' : 'afterend', section);
        elements.push(section);
        mounted = true;
        return;
      } catch {
        // try next selector
      }
    }
  }

  mount();

  // SPA-friendly: poll up to ~5 s if DOM isn't ready yet
  if (!mounted) {
    let attempts = 0;
    const tick = (): void => {
      attempts++;
      mount();
      if (!mounted && attempts < 9) {
        retryTimer = setTimeout(tick, 600);
      }
    };
    retryTimer = setTimeout(tick, 400);
  }

  return () => {
    if (retryTimer !== null) clearTimeout(retryTimer);
    for (const el of elements) el.remove();
    document.getElementById(STYLES_ID)?.remove();
  };
}

// ---------------------------------------------------------------------------
// Tracking helpers
// ---------------------------------------------------------------------------

function relativeUrl(href: string): string {
  try {
    const u = new URL(href);
    return u.pathname + u.search;
  } catch {
    return href;
  }
}

function queryText(selectors: string[]): string {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = (el as HTMLMetaElement).content ?? el.textContent ?? '';
      const trimmed = text.trim();
      if (trimmed) return trimmed;
    }
  }
  return '';
}

function queryAttr(selectors: string[], attr: string): string {
  for (const sel of selectors) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) {
      const val = el.getAttribute(attr) ?? '';
      if (val.trim()) return val.trim();
    }
  }
  return '';
}

function parsePrice(text: string): number | undefined {
  const digits = text.replace(/[^\d.,]/g, '').replace(',', '.');
  const n = parseFloat(digits);
  return isNaN(n) ? undefined : n;
}

function trackCurrentProduct(config: RecentlyViewedConfig): void {
  const title =
    queryText(['meta[property="og:title"]', 'h1']) ||
    document.title;

  const image =
    queryAttr(['meta[property="og:image"]'], 'content') ||
    queryAttr(['.product__photo img'], 'src') ||
    '';

  const url = relativeUrl(window.location.href);

  const priceText = queryText([
    '.product-card__price-actual',
    '.product-price__current',
    '.j-product-price',
  ]);
  const price = priceText ? parsePrice(priceText) : undefined;

  const entry: ViewedProduct = {
    url,
    title,
    image,
    price,
    at: Date.now(),
  };

  const existing = loadViewed();
  const updated = addViewed(existing, entry, config.maxItems, config.expiryDays);
  saveViewed(updated);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSection(
  config: RecentlyViewedConfig,
  i18n: I18nEntry,
  items: ViewedProduct[],
): HTMLElement {
  const section = document.createElement('section');
  section.className = ROOT_CLASS;
  section.setAttribute('aria-label', i18n.heading);

  const heading = document.createElement('h3');
  heading.className = `${ROOT_CLASS}__heading`;
  heading.textContent = i18n.heading;
  section.appendChild(heading);

  const list = document.createElement('div');
  list.className = `${ROOT_CLASS}__list`;

  for (const item of items) {
    const card = buildCard(item);
    list.appendChild(card);
  }

  section.appendChild(list);
  return section;
}

function buildCard(item: ViewedProduct): HTMLElement {
  const link = document.createElement('a');
  link.className = `${ROOT_CLASS}__card`;
  link.href = item.url;
  link.setAttribute('aria-label', item.title);

  const imgWrapper = document.createElement('div');
  imgWrapper.className = `${ROOT_CLASS}__img-wrapper`;

  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = '';
    img.loading = 'lazy';
    img.className = `${ROOT_CLASS}__img`;
    imgWrapper.appendChild(img);
  } else {
    imgWrapper.classList.add(`${ROOT_CLASS}__img-wrapper--empty`);
  }

  const body = document.createElement('div');
  body.className = `${ROOT_CLASS}__body`;

  const title = document.createElement('span');
  title.className = `${ROOT_CLASS}__title`;
  title.textContent = item.title;
  body.appendChild(title);

  if (item.price !== undefined) {
    const price = document.createElement('span');
    price.className = `${ROOT_CLASS}__price`;
    price.textContent = item.price.toLocaleString('uk-UA') + (item.currency ? ` ${item.currency}` : ' ₴');
    body.appendChild(price);
  }

  link.appendChild(imgWrapper);
  link.appendChild(body);
  return link;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function injectStyles(config: RecentlyViewedConfig): void {
  if (document.getElementById(STYLES_ID)) return;
  const el = document.createElement('style');
  el.id = STYLES_ID;
  el.textContent = `
.${ROOT_CLASS} {
  --rv-bg: ${config.backgroundColor};
  --rv-fg: ${config.textColor};
  --rv-price: ${config.priceColor};
  --rv-muted: ${config.mutedColor};
  --rv-border: ${config.borderColor};
  --rv-radius: ${config.borderRadius}px;
  --rv-card-w: ${config.cardWidthMobile}px;
  box-sizing: border-box;
  background: var(--rv-bg);
  color: var(--rv-fg);
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.${ROOT_CLASS} *, .${ROOT_CLASS} *::before, .${ROOT_CLASS} *::after {
  box-sizing: border-box;
}
.${ROOT_CLASS}__heading {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--rv-fg);
}
.${ROOT_CLASS}__list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}
.${ROOT_CLASS}__list::-webkit-scrollbar {
  display: none;
}
.${ROOT_CLASS}__card {
  flex: 0 0 var(--rv-card-w);
  width: var(--rv-card-w);
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--rv-border);
  border-radius: var(--rv-radius);
  overflow: hidden;
  transition: box-shadow 0.15s ease;
  min-height: 44px;
}
.${ROOT_CLASS}__card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.10);
}
.${ROOT_CLASS}__img-wrapper {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f3f4f6;
  overflow: hidden;
}
.${ROOT_CLASS}__img-wrapper--empty {
  min-height: 80px;
}
.${ROOT_CLASS}__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.${ROOT_CLASS}__body {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.${ROOT_CLASS}__title {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  color: var(--rv-fg);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.${ROOT_CLASS}__price {
  font-size: 13px;
  font-weight: 600;
  color: var(--rv-price);
  white-space: nowrap;
}

@media (min-width: 481px) {
  .${ROOT_CLASS} {
    --rv-card-w: ${config.cardWidthDesktop}px;
  }
  .${ROOT_CLASS}__heading {
    font-size: 16px;
  }
  .${ROOT_CLASS}__title {
    font-size: 13px;
  }
}
`;
  document.head.appendChild(el);
}
