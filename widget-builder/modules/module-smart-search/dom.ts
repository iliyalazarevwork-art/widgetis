import type { SmartSearchConfig, SmartSearchI18nEntry } from './schema';
import type { Item, SearchResponse } from './api';
import { escapeHtml, highlight } from './highlight';

export function buildOverlayShell(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'ssrch-backdrop';
  el.setAttribute('data-ssrch-root', 'true');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Search');
  return el;
}

export function buildPanel(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'ssrch-panel';
  return el;
}

export function buildHandle(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'ssrch-handle';
  el.setAttribute('aria-hidden', 'true');
  return el;
}

export function buildHeader(i18n: SmartSearchI18nEntry): {
  header: HTMLDivElement;
  input: HTMLInputElement;
  closeBtn: HTMLButtonElement;
  border: HTMLDivElement;
} {
  const header = document.createElement('div');
  header.className = 'ssrch-header';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'ssrch-icon');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML =
    '<circle cx="11" cy="11" r="7" stroke-width="1.8"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke-width="1.8" stroke-linecap="round"/>';

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'ssrch-input';
  input.placeholder = i18n.search_placeholder;
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('aria-label', i18n.search_placeholder);

  const kbd = document.createElement('span');
  kbd.className = 'ssrch-kbd';
  kbd.textContent = i18n.kbd_hint || 'ESC';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'ssrch-close';
  closeBtn.setAttribute('aria-label', 'Close search');
  closeBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  header.appendChild(icon);
  header.appendChild(input);
  header.appendChild(kbd);
  header.appendChild(closeBtn);

  const border = document.createElement('div');
  border.className = 'ssrch-header-border';

  return { header, input, closeBtn, border };
}

export function buildChipsRow(
  groups: SearchResponse['groups'],
  categoryUrls: Record<string, string>,
  i18n: SmartSearchI18nEntry,
  totalAll: number,
): { wrap: HTMLDivElement; chips: Map<string, HTMLButtonElement> } {
  const wrap = document.createElement('div');
  wrap.className = 'ssrch-chips';

  const chips = new Map<string, HTMLButtonElement>();

  const allChip = document.createElement('button');
  allChip.type = 'button';
  allChip.className = 'ssrch-chip ssrch-chip--active';
  allChip.dataset.category = '';
  allChip.innerHTML = `${escapeHtml(i18n.all_results)} <span class="ssrch-chip-count">${totalAll}</span>`;
  chips.set('', allChip);
  wrap.appendChild(allChip);

  for (const [key, group] of Object.entries(groups)) {
    const label = categoryUrls[key] !== undefined ? key : key;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'ssrch-chip';
    chip.dataset.category = key;
    chip.innerHTML = `${escapeHtml(label)} <span class="ssrch-chip-count">${group.total}</span>`;
    chips.set(key, chip);
    wrap.appendChild(chip);
  }

  return { wrap, chips };
}

export function buildResultsArea(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'ssrch-results';
  return el;
}

export function buildGroupBlock(
  groupKey: string,
  group: { total: number; items: Item[] },
  query: string,
  categoryUrl: string | undefined,
  i18n: SmartSearchI18nEntry,
  currency: string,
  isExpanded: boolean,
): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'ssrch-group';

  const header = document.createElement('div');
  header.className = 'ssrch-group-header';

  const title = document.createElement('span');
  title.className = isExpanded ? 'ssrch-group-title--expanded' : 'ssrch-group-title';
  title.textContent = groupKey;

  header.appendChild(title);

  if (categoryUrl && !isExpanded) {
    const viewAll = document.createElement('a');
    viewAll.className = 'ssrch-group-viewall';
    viewAll.href = categoryUrl;
    viewAll.textContent = i18n.view_all;
    header.appendChild(viewAll);
  }

  wrap.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'ssrch-grid ssrch-stagger';

  const cappedItems = group.items.slice(0, isExpanded ? group.items.length : 4);
  cappedItems.forEach((item, idx) => {
    const card = buildItemCard(item, query, currency, i18n);
    card.style.setProperty('--i', String(Math.min(idx, 12)));
    grid.appendChild(card);
  });

  wrap.appendChild(grid);
  return wrap;
}

export function buildItemCard(
  item: Item,
  query: string,
  currency: string,
  i18n: SmartSearchI18nEntry,
): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = 'ssrch-item' + (item.available ? '' : ' ssrch-item--oos');
  a.href = item.url;
  a.setAttribute('data-ssrch-item', item.id);
  a.setAttribute('tabindex', '0');

  const imgWrap = document.createElement('div');
  imgWrap.className = 'ssrch-img-wrap';

  const img = document.createElement('img');
  img.className = 'ssrch-img';
  img.src = item.picture;
  img.alt = item.name;
  img.loading = 'lazy';
  img.width = 64;
  img.height = 64;
  imgWrap.appendChild(img);

  if (!item.available) {
    const badge = document.createElement('span');
    badge.className = 'ssrch-oos-badge';
    badge.textContent = i18n.out_of_stock;
    imgWrap.appendChild(badge);
  }

  const info = document.createElement('div');

  if (item.vendor) {
    const vendor = document.createElement('div');
    vendor.className = 'ssrch-vendor';
    vendor.textContent = item.vendor;
    info.appendChild(vendor);
  }

  const name = document.createElement('div');
  name.className = 'ssrch-name';
  name.innerHTML = highlight(item.name, query);
  info.appendChild(name);

  const priceCol = document.createElement('div');
  priceCol.className = 'ssrch-price-col';

  const hasDiscount = item.oldprice > 0 && item.oldprice > item.price;
  if (hasDiscount) {
    const pct = Math.round(((item.oldprice - item.price) / item.oldprice) * 100);
    const badge = document.createElement('span');
    badge.className = 'ssrch-discount-badge';
    badge.textContent = i18n.discount_label.replace('{percent}', String(pct));
    priceCol.appendChild(badge);
  }

  const priceRow = document.createElement('div');
  priceRow.className = 'ssrch-price-row';

  if (hasDiscount) {
    const old = document.createElement('span');
    old.className = 'ssrch-oldprice';
    old.textContent = String(item.oldprice);
    priceRow.appendChild(old);
  }

  const newPrice = document.createElement('span');
  newPrice.className = 'ssrch-newprice' + (hasDiscount ? ' ssrch-newprice--sale' : '');
  newPrice.innerHTML =
    escapeHtml(String(item.price)) + `<span class="ssrch-currency">${escapeHtml(currency)}</span>`;
  priceRow.appendChild(newPrice);

  priceCol.appendChild(priceRow);

  a.appendChild(imgWrap);
  a.appendChild(info);
  a.appendChild(priceCol);

  return a;
}

export function buildSkeletonGrid(): HTMLDivElement {
  const grid = document.createElement('div');
  grid.className = 'ssrch-skeleton-grid';

  for (let i = 0; i < 6; i++) {
    const card = document.createElement('div');
    card.className = 'ssrch-skeleton-card';

    const img = document.createElement('div');
    img.className = 'ssrch-skeleton-img';

    const info = document.createElement('div');
    info.className = 'ssrch-skeleton-info';

    const bar1 = document.createElement('div');
    bar1.className = 'ssrch-skeleton-bar ssrch-skeleton-bar--wide';

    const bar2 = document.createElement('div');
    bar2.className = 'ssrch-skeleton-bar ssrch-skeleton-bar--narrow';

    const bar3 = document.createElement('div');
    bar3.className = 'ssrch-skeleton-bar ssrch-skeleton-bar--price';

    info.appendChild(bar1);
    info.appendChild(bar2);
    info.appendChild(bar3);

    card.appendChild(img);
    card.appendChild(info);
    grid.appendChild(card);
  }

  return grid;
}

export function buildEmptyState(
  query: string,
  i18n: SmartSearchI18nEntry,
  popularQueries: string[],
): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'ssrch-empty';

  el.innerHTML =
    `<svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<rect x="30" y="20" width="80" height="90" rx="8" stroke="#cdd2d9" stroke-width="1.5"/>` +
    `<line x1="44" y1="40" x2="96" y2="40" stroke="#cdd2d9" stroke-width="1.5" stroke-dasharray="4 3"/>` +
    `<line x1="44" y1="52" x2="86" y2="52" stroke="#cdd2d9" stroke-width="1.5" stroke-dasharray="4 3"/>` +
    `<line x1="44" y1="64" x2="90" y2="64" stroke="#cdd2d9" stroke-width="1.5" stroke-dasharray="4 3"/>` +
    `<circle cx="118" cy="80" r="28" stroke="#cdd2d9" stroke-width="1.5"/>` +
    `<line x1="138" y1="100" x2="152" y2="116" stroke="#cdd2d9" stroke-width="2" stroke-linecap="round"/>` +
    `<text x="105" y="87" font-size="22" fill="#cdd2d9" font-family="serif">?</text>` +
    `</svg>` +
    `<div class="ssrch-empty-title">${escapeHtml(query ? '' : '')}${escapeHtml(query || '')}</div>` +
    `<div class="ssrch-empty-subtitle">${escapeHtml(i18n.empty_subtitle)}</div>`;

  const titleEl = el.querySelector('.ssrch-empty-title') as HTMLElement;
  titleEl.textContent = query
    ? `"${query}" — ${i18n.no_results}`
    : i18n.no_results;

  if (popularQueries.length > 0) {
    const row = document.createElement('div');
    row.className = 'ssrch-popular-row';

    const label = document.createElement('span');
    label.className = 'ssrch-popular-label';
    label.textContent = i18n.popular_title + ':';
    row.appendChild(label);

    for (const q of popularQueries) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ssrch-popular-chip';
      chip.dataset.query = q;
      chip.textContent = q;
      row.appendChild(chip);
    }

    el.appendChild(row);
  }

  return el;
}

export function buildCorrectionLine(
  correction: string,
  i18n: SmartSearchI18nEntry,
): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'ssrch-correction';
  el.innerHTML = `${escapeHtml(i18n.correction_text)}: <strong>${escapeHtml(correction)}</strong>`;
  return el;
}

export function buildHistoryWrap(
  entries: string[],
  i18n: SmartSearchI18nEntry,
): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'ssrch-history';

  const header = document.createElement('div');
  header.className = 'ssrch-history-header';

  const title = document.createElement('span');
  title.className = 'ssrch-history-title';
  title.textContent = i18n.history_title;

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'ssrch-history-clear';
  clearBtn.textContent = i18n.history_clear;

  header.appendChild(title);
  header.appendChild(clearBtn);
  wrap.appendChild(header);

  const chips = document.createElement('div');
  chips.className = 'ssrch-history-chips';

  for (let idx = 0; idx < entries.length; idx++) {
    const entry = entries[idx]!;
    const chip = document.createElement('span');
    chip.className = 'ssrch-history-chip';
    chip.dataset.idx = String(idx);
    chip.dataset.query = entry;

    const clockSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    clockSvg.setAttribute('width', '13');
    clockSvg.setAttribute('height', '13');
    clockSvg.setAttribute('viewBox', '0 0 16 16');
    clockSvg.setAttribute('fill', 'none');
    clockSvg.setAttribute('aria-hidden', 'true');
    clockSvg.innerHTML = '<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><polyline points="8,5 8,8 10,10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';

    const text = document.createElement('span');
    text.textContent = entry;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'ssrch-history-chip-remove';
    removeBtn.setAttribute('aria-label', 'Remove');
    removeBtn.dataset.idx = String(idx);
    removeBtn.innerHTML = '&times;';

    chip.appendChild(clockSvg);
    chip.appendChild(text);
    chip.appendChild(removeBtn);
    chips.appendChild(chip);
  }

  wrap.appendChild(chips);
  return wrap;
}

export function buildStatusBar(
  shownCount: number,
  total: number,
  ctaUrl: string | undefined,
  i18n: SmartSearchI18nEntry,
): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'ssrch-footer';

  const count = document.createElement('span');
  count.className = 'ssrch-footer-count';
  count.textContent = i18n.results_count.replace('{count}', String(shownCount));
  el.appendChild(count);

  if (ctaUrl) {
    const cta = document.createElement('a');
    cta.className = 'ssrch-footer-cta';
    cta.href = ctaUrl;
    cta.textContent = i18n.all_results;
    el.appendChild(cta);
  }

  return el;
}
