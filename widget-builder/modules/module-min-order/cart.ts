import { detectCurrencyCode } from '@laxarevii/core';

export type CartTotalInfo = {
  amount: number;
  currencyCode?: string;
};

const SELECTORS = [
  '#header .j-mini-cart-total',
  '#modal-overlay .j-total-sum',
  '#cart .j-total-sum',
  '.mm-menu.cart .j-total-sum',
];

let lastApiCartTotal: number | null = null;
let interceptionSetup = false;

export function parseAmount(text: string): number {
  const match = text.replace(/\u00a0/g, ' ').match(/[\d\s.,]+/);
  if (!match) return 0;
  let normalized = match[0].replace(/\s/g, '');
  if (normalized.includes(',') && normalized.includes('.')) {
    if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  } else {
    normalized = normalized.replace(',', '.');
  }
  const value = parseFloat(normalized);
  return Number.isNaN(value) ? 0 : value;
}

function getGlobalCartTotal(): CartTotalInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const global = (window as any).GLOBAL;
    if (!global) return null;

    if (global.cart) {
      const cartTotal = global.cart.total ?? global.cart.sum ?? global.cart.totalSum;
      if (typeof cartTotal === 'number' && cartTotal > 0) return { amount: cartTotal };
      if (typeof cartTotal === 'string') {
        const parsed = parseAmount(cartTotal);
        if (parsed > 0) return { amount: parsed };
      }
    }

    const miniCart = global.miniCart ?? global.minicart ?? global.miniCartData;
    if (miniCart) {
      const total = miniCart.total ?? miniCart.sum ?? miniCart.totalSum;
      if (typeof total === 'number' && total > 0) return { amount: total };
      if (typeof total === 'string') {
        const parsed = parseAmount(total);
        if (parsed > 0) return { amount: parsed };
      }
    }

    const items = global.cart?.items ?? global.cart?.products ?? global.cartItems;
    if (Array.isArray(items) && items.length > 0) {
      let total = 0;
      for (const item of items) {
        const price = item.price ?? item.total ?? item.sum ?? 0;
        const qty = item.quantity ?? item.qty ?? item.count ?? 1;
        total += (typeof price === 'number' ? price : parseAmount(String(price))) * qty;
      }
      if (total > 0) return { amount: total };
    }
  } catch {
    // fall through
  }
  return null;
}

export function findTotalInfo(): CartTotalInfo {
  if (typeof lastApiCartTotal === 'number' && lastApiCartTotal >= 0) {
    return { amount: lastApiCartTotal };
  }

  const globalTotal = getGlobalCartTotal();
  if (globalTotal && globalTotal.amount > 0) return globalTotal;

  for (const selector of SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) continue;
    const text = el.innerText || el.textContent || '';
    const amount = parseAmount(text);
    if (amount > 0) return { amount, currencyCode: detectCurrencyCode(text) };
  }
  return { amount: 0 };
}

function isCartApiUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('/_widget/ajax_cart/') ||
    lower.includes('/ajax_cart/') ||
    lower.includes('/cart/add') ||
    lower.includes('/cart/remove') ||
    lower.includes('/cart/update')
  );
}

function extractCartTotal(data: any): number | null {
  try {
    const total = data?.response?.total?.total;
    if (total) {
      const sum = total.sum ?? total.default;
      if (typeof sum === 'number') return sum;
    }
    const alt = data?.total?.total;
    if (alt) {
      const sum = alt.sum ?? alt.default;
      if (typeof sum === 'number') return sum;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setupCartInterception(onUpdate: () => void): void {
  if (interceptionSetup) return;
  interceptionSetup = true;

  const scheduleDelayed = (newTotal?: number | null) => {
    if (typeof newTotal === 'number') lastApiCartTotal = newTotal;
    setTimeout(onUpdate, 100);
  };

  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : (input as Request).url;
    return originalFetch.apply(this, [input, init]).then(async (response) => {
      if (isCartApiUrl(url)) {
        try {
          const data = await response.clone().json();
          scheduleDelayed(extractCartTotal(data));
        } catch {
          scheduleDelayed();
        }
      }
      return response;
    });
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ): void {
    (this as any)._minOrderUrl = typeof url === 'string' ? url : url.toString();
    return originalOpen.apply(this, [method, url, async ?? true, username, password]);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
    const xhr = this;
    const url = (xhr as any)._minOrderUrl;
    if (url && isCartApiUrl(url)) {
      xhr.addEventListener('load', () => {
        try {
          scheduleDelayed(extractCartTotal(JSON.parse(xhr.responseText)));
        } catch {
          scheduleDelayed();
        }
      });
    }
    return originalSend.apply(xhr, [body]);
  };
}
