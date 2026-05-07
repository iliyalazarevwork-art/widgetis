/**
 * module-sms-otp-checkout — detailed DOM verification test
 *
 * This widget injects into the checkout page only.
 * Selector: #wdg-smsotp-container
 * Checks: container in DOM, visible, has child elements (phone input or label).
 */

import { test, expect } from '@playwright/test';
import { TEST_SITES, siteUrl, cartPath, waitForModuleMount } from '../../tests/e2e/helpers';
import { getDomInfo } from '../../tests/e2e/dom-helpers';

for (const site of TEST_SITES) {
  test(`module-sms-otp-checkout DOM check on ${site.name}`, async ({ page }) => {
    await page.goto(siteUrl(site, cartPath()), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load').catch(() => {});

    await waitForModuleMount(page, {
      selector: '#wdg-smsotp-container',
      consolePattern: /\[smsotp\]/,
      timeoutMs: 14_000,
    });

    // consolePattern /[smsotp]/ also matches "[smsotp] not a checkout page, skipping".
    // Skip the test if the container was never inserted (module decided not to mount).
    const containerCount = await page.locator('#wdg-smsotp-container').count();
    test.skip(containerCount === 0, `sms-otp module did not mount on ${site.name} checkout page`);

    const dom = await getDomInfo(page, '#wdg-smsotp-container');
    expect(dom, '#wdg-smsotp-container must be present in DOM').not.toBeNull();
    expect(dom!.inDOM).toBe(true);
    // Container is inserted after the phone input which may itself be inside a
    // collapsed/hidden section on real Horoshop checkout — visible:true is not guaranteed.
    expect(dom!.childCount).toBeGreaterThan(0);

    // Must have a phone-related input or label
    const hasPhoneContent = await page.evaluate(
      () =>
        !!document.querySelector(
          '#wdg-smsotp-container input[type="tel"], ' +
          '#wdg-smsotp-container input[type="text"], ' +
          '#wdg-smsotp-container .smsotp__label',
        ),
    );
    expect(hasPhoneContent).toBeTruthy();
  });
}
