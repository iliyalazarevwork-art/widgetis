import { onePlusOneSchema, onePlusOneI18nSchema, type OnePlusOneInput, type OnePlusOneI18n } from './schema';
import { getLanguage } from '@laxarevii/core';
import { getAjaxCart, getCartProducts, type AjaxCartInstance, type CartProduct } from './cart';

const LOG = '[widgetality] 1+1=3:';

// ─── Types ──────────────────────────────────────────────────

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

interface SwapRecord {
  originalId: number;
  originalArticle: string;
  originalPrice: number;
  cloneArticle: string;
  qty: number;
}

type Op =
  | { kind: 'add'; cloneId: number | null; article: string; qty: number }
  | { kind: 'set'; hash: string; qty: number }
  | { kind: 'remove'; hash: string };

// ─── Main ───────────────────────────────────────────────────

export default function onePlusOne(
  rawConfig: OnePlusOneInput,
  rawI18n: Record<string, OnePlusOneI18n[string]>,
): (() => void) | void {
  const config = onePlusOneSchema.parse(rawConfig);
  const i18n = onePlusOneI18nSchema.parse(rawI18n);

  if (!config.enabled || !config.apiUrl) return;

  const lang = getLanguage();
  const texts = i18n[lang] ?? i18n.ua ?? i18n.ru ?? Object.values(i18n)[0];

  // ─── State ──────────────────────────────────────────────────

  let minItems = 3;
  const cloneArticles = new Set<string>();
  let swaps: SwapRecord[] = [];
  const optedOut = new Set<string>();

  let busy = false;       // ops or fetch in progress
  let debounce: ReturnType<typeof setTimeout> | null = null;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;
  let settleMax: ReturnType<typeof setTimeout> | null = null;
  let settleCb: (() => void) | null = null;
  const timers: ReturnType<typeof setTimeout>[] = [];

  // ─── Spinner ────────────────────────────────────────────────

  injectStyles();
  let lockOverlay: HTMLElement | null = null;

  function showSpinner(): void {
    const drawer = document.querySelector<HTMLElement>('#cart-drawer');
    if (!drawer) return;
    if (!lockOverlay) {
      lockOverlay = document.createElement('div');
      lockOverlay.className = 'wdg-cart-lock';
      lockOverlay.innerHTML = `
        <div class="wdg-cart-lock__box">
          <div class="wdg-cart-lock__spin"></div>
          <div class="wdg-cart-lock__text">Обробляємо акцію 1+1, зачекайте\u2026</div>
        </div>`;
    }
    if (!lockOverlay.parentElement) drawer.appendChild(lockOverlay);
  }

  function hideSpinner(): void {
    lockOverlay?.parentElement?.removeChild(lockOverlay);
  }

  // ─── Settle ─────────────────────────────────────────────────
  // Instead of counting events (unreliable — Horoshop fires extras),
  // we wait for 800ms of silence after the last event.

  function startSettle(cb: () => void): void {
    busy = true;
    settleCb = cb;
    resetSettle();
    if (settleMax) clearTimeout(settleMax);
    settleMax = setTimeout(doSettle, 6000);
  }

  function resetSettle(): void {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(doSettle, 800);
  }

  function doSettle(): void {
    if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
    if (settleMax) { clearTimeout(settleMax); settleMax = null; }
    busy = false;
    const cb = settleCb;
    settleCb = null;
    cb?.();
  }

  function onSuppressed(): void {
    resetSettle();
  }

  // ─── Ops execution ─────────────────────────────────────────

  function execOp(op: Op, cart: AjaxCartInstance): void {
    console.log(LOG, 'exec:', op);
    if (op.kind === 'set') {
      cart.Cart.setProductQuantityByHash(op.hash, op.qty);
    } else if (op.kind === 'remove') {
      cart.Cart.removeProductByHash(op.hash);
    } else if (op.kind === 'add') {
      if (op.cloneId != null) {
        cart.appendProduct({ type: 'product', quantity: op.qty, id: op.cloneId }, []);
      }
    }
  }

  /** Run ops, wait for settle, call cb. */
  function fire(ops: Op[], cart: AjaxCartInstance, cb: () => void): void {
    if (ops.length === 0) { cb(); return; }
    startSettle(cb);
    for (const op of ops) execOp(op, cart);
  }

  /**
   * Run phases sequentially. Each phase settles before the next starts.
   * CRITICAL: clone ops and original ops MUST NOT run in parallel —
   * Horoshop resets one when the other changes concurrently.
   */
  function runPhases(phases: Op[][], cart: AjaxCartInstance, cb: () => void): void {
    const work = phases.filter((p) => p.length > 0);
    let i = 0;
    (function next() {
      if (i >= work.length) { cb(); return; }
      const phase = work[i++];
      console.log(LOG, `phase ${i}/${work.length}: ${phase.length} ops`);
      fire(phase, getAjaxCart() || cart, next);
    })();
  }

  // ─── Helpers ────────────────────────────────────────────────

  function isClone(p: CartProduct): boolean {
    return cloneArticles.has(p.article ?? '');
  }

  function nonClones(products: CartProduct[]): CartProduct[] {
    return products.filter((p) => !isClone(p));
  }

  /** Real qty of an original = cart qty + swapped qty */
  function realQty(p: CartProduct): number {
    const s = swaps.find((sw) => sw.originalId === p.id);
    return p.quantity + (s ? s.qty : 0);
  }

  /** Total real items (including fully-swapped originals not in cart) */
  function totalReal(products: CartProduct[]): number {
    const nc = nonClones(products);
    let n = nc.reduce((sum, p) => sum + realQty(p), 0);
    for (const s of swaps) {
      if (!nc.some((p) => p.id === s.originalId)) n += s.qty;
    }
    return n;
  }

  /** Build cart data to send to backend (with real quantities) */
  function buildCartData(products: CartProduct[]): Array<{ id: number; price: number; quantity: number; article: string }> {
    const nc = nonClones(products);
    const data = nc.map((p) => ({
      id: p.id,
      price: p.price,
      quantity: realQty(p),
      article: p.article ?? '',
    }));
    // Add fully-swapped originals (removed from cart but tracked)
    for (const s of swaps) {
      if (!nc.some((p) => p.id === s.originalId)) {
        data.push({
          id: s.originalId,
          price: s.originalPrice,
          quantity: s.qty,
          article: s.originalArticle,
        });
      }
    }
    return data;
  }

  // ─── Lock clone buttons ─────────────────────────────────────

  function lockClones(): void {
    if (cloneArticles.size === 0) return;
    const cart = getAjaxCart();
    if (!cart) return;

    const hashes = new Set<string>();
    for (const p of getCartProducts(cart)) {
      if (isClone(p)) hashes.add(p.hash);
    }
    if (hashes.size === 0) return;

    // Lock by data-cart-product-hash
    for (const row of document.querySelectorAll<HTMLElement>('[data-cart-product-hash]')) {
      if (!hashes.has(row.getAttribute('data-cart-product-hash') || '')) continue;
      for (const btn of row.querySelectorAll<HTMLButtonElement>('.j-increase-p, .j-decrease-p')) {
        btn.disabled = true;
        btn.classList.add('wdg-locked');
      }
      const inp = row.querySelector<HTMLInputElement>('input[type="text"], input[type="number"]');
      if (inp) { inp.readOnly = true; inp.classList.add('wdg-locked'); }
    }

    console.log(LOG, `locked ${hashes.size} clone(s)`);
  }

  // ─── Opt-out detection ──────────────────────────────────────

  function detectCloneRemoval(): boolean {
    if (cloneArticles.size === 0) return false;
    const cart = getAjaxCart();
    if (!cart) return false;

    const products = getCartProducts(cart);
    const removed: string[] = [];

    for (const art of cloneArticles) {
      if (!products.some((p) => p.article === art)) removed.push(art);
    }
    if (removed.length === 0) return false;

    for (const art of removed) {
      const s = swaps.find((sw) => sw.cloneArticle === art);
      if (s) {
        console.log(LOG, `opt-out: user removed clone ${art} → blocking ${s.originalArticle}`);
        optedOut.add(s.originalArticle);
      }
      cloneArticles.delete(art);
    }
    swaps = swaps.filter((s) => !removed.includes(s.cloneArticle));
    return true;
  }

  // ─── Evaluate ───────────────────────────────────────────────

  function schedule(): void {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(evaluate, 600);
  }

  async function evaluate(): Promise<void> {
    if (busy) return;

    const cart = getAjaxCart();
    if (!cart) return;
    const products = getCartProducts(cart);
    if (products.length === 0) {
      cloneArticles.clear();
      swaps = [];
      return;
    }

    const total = totalReal(products);
    console.log(LOG, `evaluate: ${total} real items (min=${minItems})`);

    if (total < minItems) {
      revert(products);
      return;
    }

    const cartData = buildCartData(products);
    if (cartData.length === 0) return;

    busy = true;
    showSpinner();
    try {
      const res = await fetch(`${config.apiUrl}/api/v1/widgets/one-plus-one/evaluate`, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ cart: cartData }),
      });
      if (!res.ok) { console.error(LOG, `HTTP ${res.status}`); hideSpinner(); return; }

      const data: EvaluateResponse = await res.json();
      console.log(LOG, 'response:', data);

      if (data.min_items) minItems = data.min_items;

      if (!data.promo_active) { revert(products); return; }

      applySwaps(products, data.swaps);
    } catch (e) {
      console.error(LOG, 'fetch failed', e);
      hideSpinner();
    } finally {
      busy = false;
    }
  }

  // ─── Apply swaps ────────────────────────────────────────────

  function applySwaps(products: CartProduct[], serverSwaps: SwapInstruction[]): void {
    const cart = getAjaxCart();
    if (!cart) return;

    const newClones = new Set<string>();
    const newSwaps: SwapRecord[] = [];
    const addOps: Op[] = [];
    const cloneOps: Op[] = [];
    const origOps: Op[] = [];

    for (const sw of serverSwaps) {
      // Opt-out check
      if (optedOut.has(sw.original_article)) {
        console.log(LOG, `skipped (opt-out): ${sw.original_article}`);
        continue;
      }

      newClones.add(sw.clone_article);

      const orig = products.find((p) => p.id === sw.original_id);
      const clone = products.find((p) => p.article === sw.clone_article);
      const prev = swaps.find((s) => s.originalId === sw.original_id);

      const rec: SwapRecord = {
        originalId: sw.original_id,
        originalArticle: sw.original_article,
        originalPrice: sw.original_price,
        cloneArticle: sw.clone_article,
        qty: sw.quantity,
      };

      // Case 1: original fully swapped (not in cart)
      if (!orig) {
        console.log(LOG, `orig ${sw.original_id} fully swapped`);
        newSwaps.push(rec);
        if (!clone) {
          addOps.push({ kind: 'add', cloneId: sw.clone_id, article: sw.clone_article, qty: sw.quantity });
        } else if (clone.quantity !== sw.quantity) {
          cloneOps.push({ kind: 'set', hash: clone.hash, qty: sw.quantity });
        }
        continue;
      }

      // Case 2: already in perfect state
      const rq = realQty(orig);
      const expectedOrigQty = rq - sw.quantity;
      if (clone && clone.quantity === sw.quantity && orig.quantity === expectedOrigQty) {
        console.log(LOG, `already exact: ${sw.clone_article} x${sw.quantity}`);
        newSwaps.push(rec);
        continue;
      }

      // Case 3: need to adjust
      newSwaps.push(rec);

      // Adjust original
      const newOrigQty = rq - sw.quantity;
      if (newOrigQty > 0) {
        origOps.push({ kind: 'set', hash: orig.hash, qty: newOrigQty });
      } else {
        origOps.push({ kind: 'remove', hash: orig.hash });
      }

      // Adjust clone
      if (clone) {
        if (clone.quantity !== sw.quantity) {
          cloneOps.push({ kind: 'set', hash: clone.hash, qty: sw.quantity });
        }
      } else {
        addOps.push({ kind: 'add', cloneId: sw.clone_id, article: sw.clone_article, qty: sw.quantity });
      }
    }

    // Remove stale clones
    for (const art of cloneArticles) {
      if (newClones.has(art)) continue;
      const clone = products.find((p) => p.article === art);
      if (clone) cloneOps.push({ kind: 'remove', hash: clone.hash });
      const old = swaps.find((s) => s.cloneArticle === art);
      if (old) {
        const o = products.find((p) => p.id === old.originalId);
        if (o) origOps.push({ kind: 'set', hash: o.hash, qty: o.quantity + old.qty });
      }
    }

    cloneArticles.clear();
    for (const a of newClones) cloneArticles.add(a);
    swaps = newSwaps;

    const total = addOps.length + cloneOps.length + origOps.length;
    if (total === 0) {
      console.log(LOG, 'no ops needed');
      hideSpinner();
      timers.push(setTimeout(lockClones, 300));
      return;
    }

    window.AjaxCart!.openCartOnAdd = false;
    showSpinner();

    // Phase 1: add new clones → Phase 2: set clone qty → Phase 3: adjust originals
    runPhases([addOps, cloneOps, origOps], cart, () => {
      console.log(LOG, 'done → reloadHtml');
      const c = getAjaxCart();
      if (c) c.reloadHtml();
      hideSpinner();
      timers.push(setTimeout(lockClones, 500));
    });
  }

  // ─── Revert ─────────────────────────────────────────────────

  function revert(products: CartProduct[]): void {
    const cart = getAjaxCart();
    if (!cart) return;

    const removeOps: Op[] = [];
    const restoreOps: Op[] = [];
    const addBackOps: Op[] = [];

    for (const s of swaps) {
      const orig = products.find((p) => p.id === s.originalId);
      if (orig) {
        restoreOps.push({ kind: 'set', hash: orig.hash, qty: orig.quantity + s.qty });
      } else {
        addBackOps.push({ kind: 'add', cloneId: s.originalId, article: s.originalArticle, qty: s.qty });
      }
    }

    for (const art of cloneArticles) {
      const clone = products.find((p) => p.article === art);
      if (clone) removeOps.push({ kind: 'remove', hash: clone.hash });
    }

    cloneArticles.clear();
    swaps = [];

    if (removeOps.length + restoreOps.length + addBackOps.length === 0) return;

    showSpinner();
    runPhases([removeOps, restoreOps, addBackOps], cart, () => {
      const c = getAjaxCart();
      if (c) c.reloadHtml();
      hideSpinner();
    });
  }

  // ─── Event hooks ────────────────────────────────────────────

  function hook(cart: AjaxCartInstance): void {
    cart.attachEventHandlers({
      onProductAdd() {
        if (busy) { onSuppressed(); return; }
        optedOut.clear();
        schedule();
      },
      onProductRemove() {
        if (busy) { onSuppressed(); return; }
        if (detectCloneRemoval()) {
          schedule();
          return;
        }
        optedOut.clear();
        schedule();
      },
      onQuantityChange() {
        if (busy) { onSuppressed(); return; }
        schedule();
      },
    });

    timers.push(setTimeout(evaluate, 1000));
    console.log(LOG, `active, apiUrl=${config.apiUrl}`);
    if (texts) console.log(LOG, `"${texts.badge}" — ${texts.tooltip}`);
  }

  function init(): void {
    const cart = getAjaxCart();
    if (!cart) { timers.push(setTimeout(init, 300)); return; }
    hook(cart);
  }

  const onInstanced = () => init();
  document.addEventListener('AjaxCartInstanced', onInstanced);
  if (window.AjaxCart?.instance) init();

  return () => {
    document.removeEventListener('AjaxCartInstanced', onInstanced);
    for (const t of timers) clearTimeout(t);
    timers.length = 0;
    if (debounce) clearTimeout(debounce);
    if (settleTimer) clearTimeout(settleTimer);
    if (settleMax) clearTimeout(settleMax);
    busy = false;
    settleCb = null;
    cloneArticles.clear();
    swaps = [];
    optedOut.clear();
    hideSpinner();
  };
}

// ─── Styles ───────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('wdg-1plus1')) return;
  const s = document.createElement('style');
  s.id = 'wdg-1plus1';
  s.textContent = `
    .wdg-cart-lock{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:center;justify-content:center}
    .wdg-cart-lock__box{background:#fff;border-radius:12px;padding:32px 40px;display:flex;flex-direction:column;align-items:center;gap:16px;box-shadow:0 4px 24px rgba(0,0,0,.15)}
    .wdg-cart-lock__spin{width:32px;height:32px;border:3px solid #e0e0e0;border-top-color:#333;border-radius:50%;animation:wdg-s .7s linear infinite}
    .wdg-cart-lock__text{font-size:15px;color:#333;font-weight:500;text-align:center}
    @keyframes wdg-s{to{transform:rotate(360deg)}}
    .wdg-locked{opacity:.4;pointer-events:none;cursor:not-allowed}
  `;
  document.head.appendChild(s);
}
