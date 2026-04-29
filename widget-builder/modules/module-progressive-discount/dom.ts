import type { DiscountTier, I18nEntry } from './schema';

export type BannerRefs = {
  container: HTMLElement;
  title: HTMLElement;
  current: HTMLElement;
  hint: HTMLElement;
  barFill: HTMLElement;
  tiers: HTMLElement;
};

export const INSERTION_POINTS: Array<{ selector: string; position: InsertPosition }> = [
  { selector: '#cart .coupon', position: 'beforebegin' },
  { selector: '#cart .j-coupon-add-form', position: 'beforebegin' },
  { selector: '#cart .cart__summary', position: 'beforebegin' },
  { selector: '.mm-menu.cart .cart__summary', position: 'beforebegin' },
  { selector: '#cart .cart__content', position: 'afterbegin' },
];

export function createBanner(): BannerRefs {
  const container = document.createElement('div');
  container.className = 'pd-banner';
  container.id = 'pd-banner';

  const head = document.createElement('div');
  head.className = 'pd-banner__head';

  const title = document.createElement('span');
  title.className = 'pd-banner__title';

  const current = document.createElement('span');
  current.className = 'pd-banner__current';

  head.append(title, current);

  const hint = document.createElement('div');
  hint.className = 'pd-banner__hint';

  const bar = document.createElement('div');
  bar.className = 'pd-banner__bar';
  const barFill = document.createElement('div');
  barFill.className = 'pd-banner__bar-fill';
  bar.appendChild(barFill);

  const tiers = document.createElement('div');
  tiers.className = 'pd-banner__tiers';

  container.append(head, hint, bar, tiers);
  return { container, title, current, hint, barFill, tiers };
}

export function ensureBannerInserted(refs: BannerRefs): boolean {
  if (refs.container.isConnected) return false;
  for (const point of INSERTION_POINTS) {
    const target = document.querySelector<HTMLElement>(point.selector);
    if (target) {
      target.insertAdjacentElement(point.position, refs.container);
      return true;
    }
  }
  return false;
}

function pluralUa(n: number, forms: string): string {
  // forms: "товар|товари|товарів" — для 1 / 2-4 / 5+ та інших
  const [one, few, many] = forms.split('|');
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one ?? '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few ?? '';
  return many ?? '';
}

export function renderBanner(
  refs: BannerRefs,
  itemCount: number,
  tiers: DiscountTier[],
  activeIndex: number,
  i18n: I18nEntry,
): void {
  const sorted = [...tiers].sort((a, b) => a.minItems - b.minItems);
  const top = sorted[sorted.length - 1]!;
  const active = activeIndex >= 0 ? sorted[activeIndex] : null;
  const next = activeIndex + 1 < sorted.length ? sorted[activeIndex + 1] : null;
  const isTop = active && active === top;

  refs.container.classList.toggle('is-top', !!isTop);
  refs.title.textContent = i18n.intro;

  if (active) {
    refs.current.textContent = i18n.currentLevel.replace('{percent}', String(active.percent));
  } else {
    refs.current.textContent = '';
  }

  if (isTop) {
    refs.hint.innerHTML = i18n.topReached.replace('{percent}', String(top.percent));
  } else if (next) {
    const remaining = Math.max(0, next.minItems - itemCount);
    const word = pluralUa(remaining, i18n.itemsWord);
    refs.hint.innerHTML = i18n.nextHint
      .replace('{remaining}', `<b>${remaining}</b>`)
      .replace('{items}', word)
      .replace('{percent}', `<b>${next.percent}%</b>`);
  } else {
    refs.hint.textContent = '';
  }

  // прогрес: від 0 до minItems останнього tier
  const ceiling = top.minItems;
  const pct = Math.min(100, (itemCount / ceiling) * 100);
  refs.barFill.style.width = `${pct}%`;

  // markers
  refs.tiers.innerHTML = '';
  for (const tier of sorted) {
    const cell = document.createElement('div');
    cell.className = 'pd-banner__tier';
    if (active && tier.minItems === active.minItems) cell.classList.add('is-active');
    cell.textContent = `${tier.minItems}+ → ${tier.percent}%`;
    refs.tiers.appendChild(cell);
  }
}
