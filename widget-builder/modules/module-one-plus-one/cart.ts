/**
 * Типы и хелперы для работы с Horoshop AjaxCart.
 */

export interface CartProduct {
  id: number;
  hash: string;
  price: number;
  quantity: number;
  type: string;
  article?: string;
  max_quantity?: number;
  related_to?: number;
}

export interface HoroshopCart {
  products: Record<string, CartProduct>;
  total: { default: number; sum: number; quantity: number };
  appendProduct(product: { type: string; quantity: number; id: number }, related: unknown[]): void;
  removeProductByHash(hash: string): void;
  setProductQuantityByHash(hash: string, quantity: number): void;
  reload(): void;
  attachEventHandlers(handlers: Record<string, (...args: unknown[]) => void>): void;
  attachEventHandler(event: string, handler: (...args: unknown[]) => void): void;
}

export interface AjaxCartInstance {
  Cart: HoroshopCart;
  appendProduct(product: { type: string; quantity: number; id: number }, related: unknown[]): void;
  removeProductByHash(hash: string): void;
  reloadHtml(): void;
  attachEventHandlers(handlers: Record<string, (...args: unknown[]) => void>): void;
  attachEventHandler(event: string, handler: (...args: unknown[]) => void): void;
}

export interface AjaxCartStatic {
  getInstance(): AjaxCartInstance;
  openCartOnAdd: boolean;
  instance: AjaxCartInstance | null;
}

declare global {
  interface Window {
    AjaxCart?: AjaxCartStatic;
  }
}

export function getAjaxCart(): AjaxCartInstance | null {
  if (typeof window.AjaxCart === 'undefined') return null;
  try {
    return window.AjaxCart!.getInstance();
  } catch {
    return null;
  }
}

export function getCartProducts(cart: AjaxCartInstance): CartProduct[] {
  const items = cart.Cart.products;
  const result: CartProduct[] = [];
  for (const hash of Object.keys(items)) {
    result.push(items[hash]);
  }
  return result;
}
