/**
 * Demo entry for module-photo-video-reviews.
 *
 * Shims two backend endpoints so the widget works on any site without
 * real merchant data:
 *  - POST /api/v1/widgets/reviews/match → fake galleries from config.fallbackUrls
 *  - POST /api/v1/widgets/reviews       → always accepts, returns fake ID
 *
 * The media pool comes from config.fallbackUrls (set in demo-config.json).
 * Distribution pattern so consecutive reviews look different:
 *  - review #0, #3, #6 … → 3 items from pool
 *  - review #1, #4, #7 … → first video found + 2 photos  (wow effect)
 *  - review #2, #5, #8 … → 2 items from pool
 */
import photoReviews from './index';
import type { PhotoReviewsConfig } from './schema';

const LOG = '[widgetality] photo-reviews (demo):';
const MATCH_URL_FRAGMENT = '/api/v1/widgets/reviews/match';
const UPLOAD_URL_FRAGMENT = '/api/v1/widgets/reviews';
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

function buildFakeMatches(
  candidates: Array<{ name: string; body: string }>,
  fallbackUrls: string[],
): Array<{ name: string; body: string; media: Array<{ url: string }> }> {
  if (fallbackUrls.length === 0) return [];

  const photos = fallbackUrls.filter((u) => !VIDEO_EXT_RE.test(u));
  const videos = fallbackUrls.filter((u) => VIDEO_EXT_RE.test(u));

  return candidates.map((c, idx) => {
    const media: Array<{ url: string }> = [];
    const pattern = idx % 3;

    if (pattern === 1 && videos.length > 0) {
      // Every 3rd review (1, 4, 7…): video first for the wow effect
      media.push({ url: videos[idx % videos.length] });
      media.push({ url: photos[(idx * 2) % Math.max(photos.length, 1)] });
      if (photos.length > 1) {
        media.push({ url: photos[(idx * 2 + 1) % photos.length] });
      }
    } else if (pattern === 0) {
      // Reviews 0, 3, 6…: 3 photos
      for (let i = 0; i < 3; i++) {
        media.push({ url: fallbackUrls[(idx * 3 + i) % fallbackUrls.length] });
      }
    } else {
      // Reviews 2, 5, 8…: 2 photos
      media.push({ url: fallbackUrls[(idx * 3) % fallbackUrls.length] });
      media.push({ url: fallbackUrls[(idx * 3 + 1) % fallbackUrls.length] });
    }

    return { name: c.name, body: c.body, media };
  });
}

function shimFetch(fallbackUrls: string[]): void {
  const original = window.fetch;
  if (!original) return;

  window.fetch = function patched(input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request)?.url ?? '';

    // Check match before upload because /reviews/match also contains /reviews
    if (url.includes(MATCH_URL_FRAGMENT)) {
      console.log(LOG, 'shimmed match endpoint — injecting demo galleries');
      let candidates: Array<{ name: string; body: string }> = [];
      try {
        const rawBody = init?.body;
        const parsed = JSON.parse(typeof rawBody === 'string' ? rawBody : '{}') as {
          candidates?: unknown;
        };
        if (Array.isArray(parsed.candidates)) {
          candidates = parsed.candidates as Array<{ name: string; body: string }>;
        }
      } catch {
        /* ignore parse errors */
      }
      return Promise.resolve(
        new Response(JSON.stringify({ matches: buildFakeMatches(candidates, fallbackUrls) }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }

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
  const fallbackUrls = (config as PhotoReviewsConfig & { fallbackUrls?: string[] }).fallbackUrls ?? [];
  console.log(LOG, `init — ${fallbackUrls.length} fallback URLs, shimming match + upload`);
  shimFetch(fallbackUrls);
  return photoReviews(config, i18n);
};

export default photoReviewsDemo;
