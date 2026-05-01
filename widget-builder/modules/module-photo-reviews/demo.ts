/**
 * Demo entry for module-photo-reviews.
 *
 * Production module POSTs uploaded photos/videos to
 * https://api.widgetis.com/api/v1/widgets/reviews. On the public demo we have
 * no merchant context — so we shim that endpoint and pretend the upload was
 * accepted. This lets visitors play with the «add photo» form without errors.
 *
 * The render path (gallery on existing reviews) does NOT depend on backend —
 * it uses `config.fallbackUrls` / `config.photos` straight from the bundle.
 * Lorem-ipsum-style placeholder photos for those galleries live in
 * widget-builder/demo-config.json (picsum.photos URLs).
 */
import photoReviews from './index';

const LOG = '[widgetality] photo-reviews (demo):';
const UPLOAD_URL_FRAGMENT = '/api/v1/widgets/reviews';

function shimFetch(): void {
  const original = window.fetch;
  if (!original) return;

  window.fetch = function patched(input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request)?.url ?? '';

    if (url.includes(UPLOAD_URL_FRAGMENT)) {
      console.log(LOG, 'shimmed review upload — pretending success');
      return Promise.resolve(
        new Response(
          JSON.stringify({ data: { id: `demo-${Date.now()}`, status: 'pending_moderation' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }

    return original.call(window, input as RequestInfo, init);
  } as typeof window.fetch;
}

const photoReviewsDemo: typeof photoReviews = (config, i18n) => {
  console.log(LOG, 'init — shimming review upload endpoint');
  shimFetch();
  return photoReviews(config, i18n);
};

export default photoReviewsDemo;
