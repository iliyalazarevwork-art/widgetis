/**
 * Demo entry for module-sms-otp-checkout.
 *
 * Shims the three backend endpoints used by the production module so the demo
 * shows the full UX without sending real SMS or hitting widgetis.com:
 *   POST /widget/session              → returns a fake token
 *   POST /widget/sms-otp/request      → returns a fake request_id
 *   POST /widget/sms-otp/verify       → accepts ANY 6-digit code as valid
 *
 * Settings (config + i18n) are passed through unchanged to the production
 * default export.
 */
import smsOtpCheckout from './index';

const LOG = '[widgetality] sms-otp-checkout (demo):';
const DEMO_TOKEN = 'demo-token';
const DEMO_REQUEST_ID = 'demo-req-1';

function shimFetch(): void {
  const original = window.fetch;
  if (!original) return;

  window.fetch = function patched(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request)?.url ?? '';

    if (url.endsWith('/widget/session')) {
      console.log(LOG, 'shimmed /widget/session');
      return Promise.resolve(
        new Response(
          JSON.stringify({ data: { token: DEMO_TOKEN, expires_in: 3600 } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }

    if (url.endsWith('/widget/sms-otp/request')) {
      console.log(LOG, 'shimmed /widget/sms-otp/request — code will be accepted');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      return Promise.resolve(
        new Response(
          JSON.stringify({ data: { request_id: DEMO_REQUEST_ID, expires_at: expiresAt } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }

    if (url.endsWith('/widget/sms-otp/verify')) {
      console.log(LOG, 'shimmed /widget/sms-otp/verify — accepting any code');
      return Promise.resolve(
        new Response(
          JSON.stringify({ data: { verified: true } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }

    return original.call(window, input as RequestInfo, init);
  } as typeof window.fetch;
}

const smsOtpDemo: typeof smsOtpCheckout = (config, i18n) => {
  console.log(LOG, 'init — shimming /widget endpoints');
  shimFetch();
  return smsOtpCheckout(config, i18n);
};

export default smsOtpDemo;
