import type { IconNode } from 'lucide';
import { Truck } from 'lucide';
import type { CartGoalConfig, PositionConfig } from './schema';

function iconToSvg(icon: IconNode): string {
  const children = icon
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs as Record<string, string>)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${tag} ${attrStr}/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

const TRUCK_SVG = iconToSvg(Truck);

export type WidgetRefs = {
  container: HTMLElement;
  bar: HTMLElement | null;
  label: HTMLElement | null;
  amount: HTMLElement | null;
  circleBar: HTMLElement | null;
  mobileRemaining: HTMLElement | null;
  expLabel: HTMLElement | null;
  expAmount: HTMLElement | null;
  mobileClose: HTMLElement | null;
};

export function createMainWidget(): WidgetRefs {
  const container = document.createElement('div');
  container.id = 'cg-widget-main';
  container.className = 'cg-widget';
  container.innerHTML = `
    <div class="cg-widget__layout">
      <div class="cg-widget__icon-col">
        <span class="cg-widget__delivery-icon">${TRUCK_SVG}</span>
      </div>
      <div class="cg-widget__content-col">
        <span class="cg-widget__label"></span>
        <span class="cg-widget__amount"></span>
        <div class="cg-widget__progress">
          <div class="cg-widget__bar"></div>
        </div>
      </div>
    </div>
  `;
  return {
    container,
    bar: container.querySelector('.cg-widget__bar'),
    label: container.querySelector('.cg-widget__label'),
    amount: container.querySelector('.cg-widget__amount'),
    circleBar: null,
    mobileRemaining: null,
    expLabel: null,
    expAmount: null,
    mobileClose: null,
  };
}

export function createFloatingWidget(): WidgetRefs {
  const container = document.createElement('div');
  container.id = 'cg-widget-floating';
  container.className = 'cg-widget cg-widget--floating';
  container.dataset.state = 'collapsed';
  container.innerHTML = `
    <div class="cg-widget__desktop">
      <div class="cg-widget__layout">
        <div class="cg-widget__icon-col">
          <span class="cg-widget__delivery-icon">${TRUCK_SVG}</span>
        </div>
        <div class="cg-widget__content-col">
          <span class="cg-widget__label"></span>
          <span class="cg-widget__amount"></span>
          <div class="cg-widget__progress">
            <div class="cg-widget__bar"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="cg-widget__mobile">
      <div class="cg-widget__collapsed">
        <div class="cg-mobile-icon"><img src="data:image/webp;base64,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" alt=""></div>
        <div class="cg-mobile-amount"></div>
        <div class="cg-mobile-progress">
          <div class="cg-mobile-progress-bar"></div>
        </div>
      </div>
      <div class="cg-widget__expanded">
        <div class="cg-exp-info">
          <span class="cg-exp-icon"><img src="data:image/webp;base64,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" alt=""></span>
          <span class="cg-exp-label"></span>
          <span class="cg-exp-amount"></span>
        </div>
        <button class="cg-mobile-close" aria-label="Close">\u00D7</button>
      </div>
    </div>
  `;
  return {
    container,
    bar: container.querySelector('.cg-widget__bar'),
    label: container.querySelector('.cg-widget__label'),
    amount: container.querySelector('.cg-widget__amount'),
    circleBar: container.querySelector('.cg-mobile-progress-bar'),
    mobileRemaining: container.querySelector('.cg-mobile-amount'),
    expLabel: container.querySelector('.cg-exp-label'),
    expAmount: container.querySelector('.cg-exp-amount'),
    mobileClose: container.querySelector('.cg-mobile-close'),
  };
}

export const INSERTION_POINTS: Array<{ selector: string; position: InsertPosition }> = [
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

export function applyPosition(container: HTMLElement, position: PositionConfig): void {
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

export function ensureBackdrop(): HTMLElement {
  let backdrop = document.getElementById('cg-widget-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'cg-widget-backdrop';
    backdrop.className = 'cg-widget-backdrop';
    document.body.appendChild(backdrop);
  }
  return backdrop;
}

export function setupMobileInteractions(
  refs: WidgetRefs,
  config: CartGoalConfig,
): void {
  const backdrop = ensureBackdrop();

  if ((refs.container as any)._mobileSetup) return;
  (refs.container as any)._mobileSetup = true;
  (refs.container as any)._shakePaused = false;

  const startShake = () => {
    if (
      (window.innerWidth <= 768 || config.desktopIconOnly) &&
      refs.container.dataset.state === 'collapsed' &&
      !(refs.container as any)._shakePaused
    ) {
      refs.container.classList.add('cg-shake');
      setTimeout(() => refs.container.classList.remove('cg-shake'), 800);
    }
  };

  setTimeout(startShake, 100);
  setInterval(startShake, config.shakeInterval);

  refs.container.addEventListener('click', (e) => {
    if (window.innerWidth > 768 && !config.desktopIconOnly) return;
    if ((e.target as HTMLElement).closest('.cg-mobile-close')) return;
    if (refs.container.dataset.state === 'expanded') return;

    (refs.container as any)._shakePaused = true;
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

export function resumeShake(refs: WidgetRefs | null): void {
  if (!refs) return;
  (refs.container as any)._shakePaused = false;
}
