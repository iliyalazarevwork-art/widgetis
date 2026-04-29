/**
 * Підрахунок кількості товарів у кошику Horoshop.
 *
 * Джерела (за пріоритетом):
 *   1. AjaxCart.getInstance().Cart.total.quantity — найточніше
 *   2. window.GLOBAL.cart.items / .products — підсумовуємо qty
 *   3. fallback: 0 (немає кошика)
 *
 * Підписка на зміни:
 *   • події AjaxCart: onChange / onQuantityChange / onProductAdd / onProductRemove
 *   • перехоплення fetch / XHR на /_widget/ajax_cart/* (дублює, на випадок,
 *     якщо AjaxCart ще не готовий під час маунту)
 */

let interceptionSetup = false;
let ajaxCartHooked = false;

export function getCartItemCount(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const ajax = (window as any).AjaxCart;
    const inst = ajax?.getInstance?.();
    const qty = inst?.Cart?.total?.quantity;
    if (typeof qty === 'number' && qty >= 0) return qty;
  } catch {
    // ignore
  }

  try {
    const global = (window as any).GLOBAL;
    const items = global?.cart?.items ?? global?.cart?.products ?? global?.cartItems;
    if (Array.isArray(items)) {
      let total = 0;
      for (const item of items) {
        const q = item.quantity ?? item.qty ?? item.count ?? 1;
        const n = typeof q === 'number' ? q : parseInt(String(q), 10);
        if (!Number.isNaN(n)) total += n;
      }
      return total;
    }
    if (global?.cart?.products && typeof global.cart.products === 'object') {
      let total = 0;
      for (const p of Object.values(global.cart.products) as any[]) {
        const q = p?.quantity ?? 1;
        if (typeof q === 'number') total += q;
      }
      return total;
    }
  } catch {
    // ignore
  }

  return 0;
}

function isCartApiUrl(url: string): boolean {
  if (!url) return false;
  return url.toLowerCase().includes('/_widget/ajax_cart/');
}

export function setupCartInterception(onUpdate: () => void): void {
  if (interceptionSetup) return;
  interceptionSetup = true;

  const fire = (): void => {
    setTimeout(onUpdate, 100);
  };

  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : (input as Request).url;
    return originalFetch.apply(this, [input, init]).then((res) => {
      if (isCartApiUrl(url)) fire();
      return res;
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
    (this as any)._pdUrl = typeof url === 'string' ? url : url.toString();
    return originalOpen.apply(this, [method, url, async ?? true, username, password]);
  };
  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
    const url = (this as any)._pdUrl;
    if (url && isCartApiUrl(url)) this.addEventListener('load', fire);
    return originalSend.apply(this, [body]);
  };
}

export function hookAjaxCart(onUpdate: () => void): void {
  if (ajaxCartHooked) return;

  const tryAttach = (): boolean => {
    const ajax = (window as any).AjaxCart;
    const inst = ajax?.getInstance?.();
    if (!inst?.attachEventHandlers) return false;
    ajaxCartHooked = true;
    inst.attachEventHandlers({
      onChange: () => setTimeout(onUpdate, 50),
      onQuantityChange: () => setTimeout(onUpdate, 50),
      onProductAdd: () => setTimeout(onUpdate, 50),
      onProductRemove: () => setTimeout(onUpdate, 50),
      onReload: () => setTimeout(onUpdate, 50),
      onCouponChange: () => setTimeout(onUpdate, 50),
    });
    return true;
  };

  if (tryAttach()) return;

  document.addEventListener('AjaxCartInstanced', () => tryAttach(), { once: false });
  const interval = setInterval(() => {
    if (tryAttach()) clearInterval(interval);
  }, 500);
  setTimeout(() => clearInterval(interval), 30_000);
}
