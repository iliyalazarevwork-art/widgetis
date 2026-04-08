import type { MinOrderConfig, PositionConfig } from './schema';

export type WidgetRefs = {
  container: HTMLElement;
  bar: HTMLElement | null;
  label: HTMLElement | null;
  amount: HTMLElement | null;
  circleBar: HTMLElement | null;
  expLabel: HTMLElement | null;
  expAmount: HTMLElement | null;
  mobileClose: HTMLElement | null;
};

export const INSERTION_POINTS: { selector: string; position: InsertPosition }[] = [
  { selector: '#modal-overlay .cart__summary', position: 'beforebegin' },
  { selector: '#modal-overlay .cart-total', position: 'afterend' },
  { selector: '#cart-drawer .cart__summary', position: 'beforebegin' },
  { selector: '#cart-drawer .cart-total', position: 'afterend' },
  { selector: '.mm-menu.cart .cart__summary', position: 'beforebegin' },
  { selector: '.order-details__cost-item.j-delivery-commission', position: 'afterend' },
  { selector: '.cart__summary', position: 'beforebegin' },
  { selector: '.order-details__cost', position: 'beforebegin' },
  { selector: '.order-details__total', position: 'beforebegin' },
  { selector: '.cart-total', position: 'afterend' },
  { selector: '.order-total', position: 'afterend' },
  { selector: '.cart-summary', position: 'afterend' },
  { selector: '.order-details-i.j-delivery-commission', position: 'afterend' },
  { selector: '.checkout-total', position: 'beforebegin' },
  { selector: '.order-summary__total', position: 'beforebegin' },
  { selector: '.total-sum', position: 'afterend' },
  { selector: '.total-price', position: 'afterend' },
];

const WIDGET_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="mo-tgt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#EF5350"/><stop offset="100%" stop-color="#B71C1C"/></linearGradient><linearGradient id="mo-arrow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFD740"/><stop offset="100%" stop-color="#FF8F00"/></linearGradient></defs><circle cx="30" cy="34" r="24" fill="url(#mo-tgt)"/><circle cx="30" cy="34" r="17" fill="#fff"/><circle cx="30" cy="34" r="11" fill="url(#mo-tgt)"/><circle cx="30" cy="34" r="5" fill="#fff"/><circle cx="30" cy="34" r="2" fill="#B71C1C"/><line x1="40" y1="10" x2="30" y2="34" stroke="url(#mo-arrow)" stroke-width="3" stroke-linecap="round"/><polygon points="42,4 46,14 36,12" fill="url(#mo-arrow)"/></svg>`;

export function createMainWidget(): WidgetRefs {
  const container = document.createElement('div');
  container.id = 'mo-widget-main';
  container.className = 'mo-widget';
  container.innerHTML = `
    <div class="mo-widget__desktop">
      <div class="mo-widget__text">
        <span class="mo-widget__label"></span>
        <span class="mo-widget__amount"></span>
      </div>
      <div class="mo-widget__progress">
        <div class="mo-widget__bar"></div>
      </div>
    </div>`;
  return {
    container,
    bar: container.querySelector('.mo-widget__bar'),
    label: container.querySelector('.mo-widget__label'),
    amount: container.querySelector('.mo-widget__amount'),
    circleBar: null,
    expLabel: null,
    expAmount: null,
    mobileClose: null,
  };
}

export function createFloatingWidget(): WidgetRefs {
  const container = document.createElement('div');
  container.id = 'mo-widget-floating';
  container.className = 'mo-widget mo-widget--floating';
  container.dataset.state = 'collapsed';
  container.innerHTML = `
    <div class="mo-widget__desktop">
      <div class="mo-widget__text">
        <span class="mo-widget__label"></span>
        <span class="mo-widget__amount"></span>
      </div>
      <div class="mo-widget__progress">
        <div class="mo-widget__bar"></div>
      </div>
    </div>

    <div class="mo-widget__mobile">
      <div class="mo-widget__collapsed">
        <div class="mo-mobile-icon">${WIDGET_ICON}</div>
        <div class="mo-mobile-progress">
          <div class="mo-mobile-progress-bar"></div>
        </div>
      </div>

      <div class="mo-widget__expanded">
        <div class="mo-exp-info">
          <div class="mo-exp-icon">${WIDGET_ICON}</div>
          <span class="mo-exp-label"></span>
          <span class="mo-exp-amount"></span>
        </div>
        <button class="mo-mobile-close" aria-label="Close">\u00d7</button>
      </div>
    </div>
  `;

  return {
    container,
    bar: container.querySelector('.mo-widget__bar'),
    label: container.querySelector('.mo-widget__label'),
    amount: container.querySelector('.mo-widget__amount'),
    circleBar: container.querySelector('.mo-mobile-progress-bar'),
    expLabel: container.querySelector('.mo-exp-label'),
    expAmount: container.querySelector('.mo-exp-amount'),
    mobileClose: container.querySelector('.mo-mobile-close'),
  };
}

export function ensureBackdrop(): HTMLElement {
  let backdrop = document.querySelector<HTMLElement>('.mo-widget-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'mo-widget-backdrop';
    document.body.appendChild(backdrop);
  }
  return backdrop;
}

export function applyFloatingPosition(container: HTMLElement, position: PositionConfig): void {
  container.style.left = '';
  container.style.right = '';
  if (typeof position.left === 'number') {
    container.style.left = `${position.left}px`;
    container.style.right = 'auto';
  } else if (typeof position.right === 'number') {
    container.style.right = `${position.right}px`;
    container.style.left = 'auto';
  } else {
    container.style.right = '16px';
    container.style.left = 'auto';
  }
  container.style.bottom = `${position.bottom}px`;
}

export function resolveFloatingPosition(config: MinOrderConfig): PositionConfig {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  return isMobile ? config.positionMobile : config.positionDesktop;
}

export function setupMobileInteractions(refs: WidgetRefs, config: MinOrderConfig): void {
  const backdrop = ensureBackdrop();
  const el = refs.container as any;

  if (el._moInteractionsSetup) return;
  el._moInteractionsSetup = true;
  el._shakePaused = false;

  const startShake = () => {
    if (
      (window.innerWidth <= 768 || config.desktopIconOnly) &&
      refs.container.dataset.state === 'collapsed' &&
      !el._shakePaused
    ) {
      refs.container.classList.add('mo-cart-shake');
      setTimeout(() => refs.container.classList.remove('mo-cart-shake'), 800);
    }
  };

  setTimeout(startShake, 100);
  setInterval(startShake, config.shakeInterval);

  refs.container.addEventListener('click', (e) => {
    if (window.innerWidth > 768 && !config.desktopIconOnly) return;
    if ((e.target as HTMLElement).closest('.mo-mobile-close')) return;
    if (refs.container.dataset.state === 'expanded') return;
    el._shakePaused = true;
    refs.container.dataset.state = 'expanded';
    backdrop.style.display = 'block';
  });

  if (refs.mobileClose) {
    refs.mobileClose.addEventListener('click', (e) => {
      e.stopPropagation();
      refs.container.dataset.state = 'collapsed';
      backdrop.style.display = 'none';
    });
  }

  backdrop.addEventListener('click', () => {
    if (refs.container.dataset.state === 'expanded') {
      refs.container.dataset.state = 'collapsed';
      backdrop.style.display = 'none';
    }
  });
}
