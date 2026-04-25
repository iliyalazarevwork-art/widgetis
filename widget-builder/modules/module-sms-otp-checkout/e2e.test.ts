/**
 * module-sms-otp-checkout — smoke e2e test
 *
 * Page:     checkout page (/checkout/) — the module guards strictly:
 *           `if (!isCheckoutPage()) { log('not a checkout page, skipping'); return; }`
 *           where isCheckoutPage checks /\/checkout\//i in the URL.
 *
 * Activation requirement: the checkout page must contain a phone input AND a
 * submit button for the module to inject the OTP container (#wdg-smsotp-container).
 * On a bare /checkout/ with no items in cart, Horoshop may redirect to the cart
 * page — the DOM markers will not appear without a real checkout session.
 *
 * Selector: #wdg-smsotp-container — the OTP overlay container (CONTAINER_ID)
 *
 * NOTE: This test is SKIPPED because a real checkout flow requires items in the
 * cart, a valid session, and Horoshop not redirecting away from /checkout/.
 * Automating the full add-to-cart → checkout flow is out of scope for a
 * mount-only smoke test suite.
 *
 * To test manually: add a product to the cart on either test site, navigate to
 * /checkout/, and confirm #wdg-smsotp-container appears in the DevTools DOM.
 */

import { test } from '@playwright/test';
import { TEST_SITES } from '../../tests/e2e/helpers';

for (const site of TEST_SITES) {
  test(`module-sms-otp-checkout mounts on ${site.name}`, async () => {
    test.skip(
      true,
      'Needs a real checkout session with items in cart — ' +
        'Horoshop redirects empty /checkout/ away before the module can activate. ' +
        `Test site: ${site.domain}. ` +
        'Manual verification: add product to cart, go to /checkout/, inspect #wdg-smsotp-container.',
    );
  });
}
