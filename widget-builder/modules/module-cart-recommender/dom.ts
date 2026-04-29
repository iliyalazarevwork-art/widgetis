export interface Product {
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

export function formatPrice(n: number, currency: string): string {
  const formatted = n.toLocaleString('uk-UA').replace(/\s/g, ' ');
  return `${formatted} ${currency}`;
}

function pickLocale<T>(
  obj: { ua?: T; en?: T; ru?: T } | undefined,
  lang: 'ua' | 'ru' | 'en',
): T | undefined {
  if (!obj) return undefined;
  return obj[lang] ?? obj.ua ?? obj.en ?? obj.ru;
}

const STYLE_ID = 'wgts-popup-styles';

const STYLES = `.wgts-popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99998;opacity:0;transition:opacity 200ms ease-out}
.wgts-popup{position:fixed;bottom:0;left:0;right:0;background:#fff;border-radius:16px 16px 0 0;z-index:99999;padding:16px 16px 24px;transform:translateY(100%);transition:transform 280ms ease-out;max-height:85vh;overflow-y:auto}
.wgts-popup__header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.wgts-popup__title{font-size:15px;font-weight:600;color:#3E2A1F;line-height:1.3}
.wgts-popup__close{width:32px;height:32px;border-radius:999px;border:1.5px solid #d8c9b4;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;color:#3E2A1F;flex-shrink:0;line-height:1;font-weight:400;transition:background 150ms ease}
.wgts-popup__list{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
.wgts-popup__row{display:flex;align-items:center;gap:12px}
.wgts-popup__img{width:56px;height:56px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#f0e8d8}
.wgts-popup__body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.wgts-popup__name{font-size:13px;line-height:1.3;color:#3E2A1F;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.wgts-popup__price{font-size:12px;color:#7A5C4D}
.wgts-popup__add{width:36px;height:36px;background:#C77A5C;color:#fff;border:0;border-radius:999px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;position:relative;transition:background 200ms ease,transform 100ms ease}.wgts-popup__add:active{transform:scale(.9)}.wgts-popup__add::before,.wgts-popup__add::after{content:'';position:absolute;background:#fff;border-radius:2px}.wgts-popup__add::before{width:14px;height:2px}.wgts-popup__add::after{width:2px;height:14px}.wgts-popup__add--done{background:#4CAF50;font-size:16px;font-weight:600}.wgts-popup__add--done::before,.wgts-popup__add--done::after{display:none}
.wgts-popup__cta{width:100%;padding:14px;border-radius:999px;background:#3E2A1F;color:#fff;font-size:14px;font-weight:600;border:0;cursor:pointer;font-family:inherit}`;

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}

export function buildPopup(
  products: Product[],
  lang: 'ua' | 'ru' | 'en',
  headingText: string,
  onClose: () => void,
  onAddToCart: (product: Product) => Promise<void>,
): HTMLElement {
  ensureStyles();

  const root = document.createElement('div');
  root.className = 'wgts-popup-root';

  const overlay = document.createElement('div');
  overlay.className = 'wgts-popup-overlay';
  overlay.addEventListener('click', onClose);

  const panel = document.createElement('div');
  panel.className = 'wgts-popup';

  const header = document.createElement('div');
  header.className = 'wgts-popup__header';

  const title = document.createElement('div');
  title.className = 'wgts-popup__title';
  title.textContent = `✨ ${headingText}`;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'wgts-popup__close';
  closeBtn.type = 'button';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', onClose);

  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const list = document.createElement('div');
  list.className = 'wgts-popup__list';

  for (const product of products) {
    const row = document.createElement('div');
    row.className = 'wgts-popup__row';

    const img = document.createElement('img');
    img.className = 'wgts-popup__img';
    img.src = product.image;
    img.alt = pickLocale(product.title, lang) ?? '';
    img.loading = 'lazy';

    const body = document.createElement('div');
    body.className = 'wgts-popup__body';

    const name = document.createElement('div');
    name.className = 'wgts-popup__name';
    name.textContent = pickLocale(product.title, lang) ?? product.sku ?? '';

    const price = document.createElement('div');
    price.className = 'wgts-popup__price';
    price.textContent = formatPrice(product.price_new, product.currency);

    body.appendChild(name);
    body.appendChild(price);

    const addBtn = document.createElement('button');
    addBtn.className = 'wgts-popup__add';
    addBtn.type = 'button';
    addBtn.setAttribute('data-wdg-rec-add', String(product.id));
    if (product.sku) addBtn.setAttribute('data-wdg-rec-sku', product.sku);

    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (addBtn.disabled) return;
      addBtn.disabled = true;
      addBtn.style.opacity = '0.5';

      void onAddToCart(product).then(() => {
        // Sticky success: button stays green with ✓ until popup closes.
        // We don't re-enable it — the user already added this item, no
        // reason to let them double-add from the same popup card.
        addBtn.textContent = '✓';
        addBtn.style.opacity = '';
        addBtn.classList.add('wgts-popup__add--done');
      }).catch(() => {
        addBtn.textContent = '✗';
        addBtn.style.opacity = '';
        setTimeout(() => {
          addBtn.textContent = '';
          addBtn.disabled = false;
        }, 1500);
      });
    });

    row.appendChild(img);
    row.appendChild(body);
    row.appendChild(addBtn);
    list.appendChild(row);
  }

  panel.appendChild(list);

  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'wgts-popup__cta';
  ctaBtn.type = 'button';
  ctaBtn.textContent = 'Оформити замовлення';
  ctaBtn.addEventListener('click', () => {
    onClose();
    const orderLink = document.querySelector<HTMLAnchorElement>('.cart__order a');
    if (orderLink?.href) {
      window.location.href = orderLink.href;
    }
  });

  panel.appendChild(ctaBtn);

  root.appendChild(overlay);
  root.appendChild(panel);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.opacity = '0.5';
      panel.style.transform = 'translateY(0)';
    });
  });

  return root;
}

export function animateOut(root: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const overlay = root.querySelector<HTMLElement>('.wgts-popup-overlay');
    const panel = root.querySelector<HTMLElement>('.wgts-popup');

    if (overlay) overlay.style.opacity = '0';
    if (panel) panel.style.transform = 'translateY(100%)';

    const timeoutId = setTimeout(resolve, 300);

    if (panel) {
      panel.addEventListener(
        'transitionend',
        () => {
          clearTimeout(timeoutId);
          resolve();
        },
        { once: true },
      );
    }
  });
}
