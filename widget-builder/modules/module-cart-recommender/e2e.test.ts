/**
 * module-cart-recommender — smoke e2e test
 *
 * Page:     cart page (after adding a product) — the module only activates
 *           when `.j-cart-additional .carousel__wrapper` is present in the DOM,
 *           which Horoshop only renders when:
 *             1. A product has been added to the cart.
 *             2. The cart drawer or cart page is open/visible.
 *
 * Selector: `.j-cart-additional .carousel__wrapper [data-wdg-rec]` — the
 *           injected card root element (set by buildCard in dom.ts).
 *
 * Additionally, this module is mobile-only (`matchMedia('(max-width: 768px)')`).
 * Playwright's default viewport is 1280×720 (desktop), so the module would
 * silently no-op even if the cart is open.
 *
 * NOTE: This test is SKIPPED because verifying the mount requires:
 *   1. Emulating a mobile viewport.
 *   2. Adding a product to the cart so Horoshop renders `.j-cart-additional`.
 *   3. Opening the cart drawer / navigating to the cart page.
 *   Automating the full "add-to-cart → open cart → wait for carousel" flow is
 *   out of scope for a mount-only smoke test suite.
 *
 * To test manually:
 *   1. Open https://benihome.com.ua on a mobile device or with DevTools mobile
 *      emulation (≤768 px wide).
 *   2. Add any product to the cart.
 *   3. Open the cart drawer.
 *   4. Confirm `[data-wdg-rec]` appears at the start of
 *      `.j-cart-additional .carousel__wrapper` in the DevTools DOM.
 *   5. Tap "До кошика" on the injected card — the product should be added.
 */

import { test } from '@playwright/test';
import { TEST_SITES } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-cart-recommender mounts on ${site.name}`, async () => {
    test.skip(
      true,
      'Needs a real cart session with at least one product added — ' +
        'Horoshop only renders .j-cart-additional when the cart is non-empty. ' +
        'The module is also mobile-only (≤768 px). ' +
        `Test site: ${site.domain}. ` +
        'Manual verification: add product to cart on mobile, open cart drawer, ' +
        'inspect [data-wdg-rec] inside .j-cart-additional .carousel__wrapper.',
    );
  });
}
