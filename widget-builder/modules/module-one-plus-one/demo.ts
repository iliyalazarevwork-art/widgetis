/**
 * Demo entry for module-one-plus-one.
 *
 * The production module POSTs the cart to /api/v1/widgets/one-plus-one/evaluate
 * to learn which item should be marked as the "1+1" gift. In demo we have no
 * widgetis backend — so we shim that endpoint and compute the response right
 * here from the cart payload: the cheapest item in the cart becomes a gift
 * (clone_price = 1) when there are at least 2 items.
 *
 * Settings (config + i18n) are passed through unchanged.
 */
import onePlusOne from './index';

const LOG = '[widgetality] 1+1=3 (demo):';
const ENDPOINT = '/api/v1/widgets/one-plus-one/evaluate';

interface CartItem {
  id: number;
  price: number;
  quantity: number;
  article: string;
}

interface SwapInstruction {
  original_id: number;
  original_article: string;
  clone_article: string;
  clone_id: number | null;
  quantity: number;
  original_price: number;
  clone_price: number;
}

interface EvaluateResponse {
  promo_active: boolean;
  min_items: number;
  total_items: number;
  gift_count: number;
  swaps: SwapInstruction[];
}

function evaluateCart(cart: CartItem[], minItems = 2): EvaluateResponse {
  const totalItems = cart.reduce((sum, x) => sum + x.quantity, 0);
  if (totalItems < minItems) {
    return { promo_active: false, min_items: minItems, total_items: totalItems, gift_count: 0, swaps: [] };
  }

  // Cheapest item becomes the gift (1 unit).
  const sorted = [...cart].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0];
  if (!cheapest || cheapest.price <= 0) {
    return { promo_active: false, min_items: minItems, total_items: totalItems, gift_count: 0, swaps: [] };
  }

  const swap: SwapInstruction = {
    original_id: cheapest.id,
    original_article: cheapest.article,
    clone_article: `${cheapest.article}_GIFT`,
    clone_id: null,
    quantity: 1,
    original_price: cheapest.price,
    clone_price: 1,
  };

  return {
    promo_active: true,
    min_items: minItems,
    total_items: totalItems,
    gift_count: 1,
    swaps: [swap],
  };
}

function shimFetch(): void {
  const original = window.fetch;
  if (!original) return;

  window.fetch = async function patched(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request)?.url ?? '';

    if (url.includes(ENDPOINT)) {
      try {
        const body = init?.body;
        const parsed = typeof body === 'string' ? (JSON.parse(body) as { cart?: CartItem[] }) : { cart: [] };
        const cart = Array.isArray(parsed.cart) ? parsed.cart : [];
        const data = evaluateCart(cart);
        console.log(LOG, 'shimmed evaluate →', data);
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.error(LOG, 'demo evaluator failed', err);
        return new Response(JSON.stringify({ promo_active: false, min_items: 2, total_items: 0, gift_count: 0, swaps: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return original.call(window, input as RequestInfo, init);
  } as typeof window.fetch;
}

const onePlusOneDemo: typeof onePlusOne = (config, i18n) => {
  console.log(LOG, 'init — shimming evaluate endpoint');
  shimFetch();
  return onePlusOne(config, i18n);
};

export default onePlusOneDemo;
