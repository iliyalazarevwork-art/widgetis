/**
 * Demo entry for module-photo-video-reviews.
 *
 * Shims two backend endpoints so the widget works on any site without
 * real merchant data:
 *  - POST /api/v1/widgets/reviews/match → SVG placeholder galleries
 *  - POST /api/v1/widgets/reviews       → always accepts, returns fake ID
 *
 * Placeholders are generated inline as SVG data URLs — no external assets,
 * no copyright issues, works on every site. Three photo variants + one dark
 * video variant are distributed so consecutive reviews look different.
 */
import photoReviews from './index';

const LOG = '[widgetality] photo-reviews (demo):';
const MATCH_URL_FRAGMENT = '/api/v1/widgets/reviews/match';
const UPLOAD_URL_FRAGMENT = '/api/v1/widgets/reviews';

// ─── Language detection ───────────────────────────────────────────────────────

function getDemoLang(): 'ua' | 'ru' {
  const lang =
    (typeof document !== 'undefined' ? document.documentElement.lang : '') ||
    (typeof navigator !== 'undefined' ? navigator.language : '') ||
    'uk';
  return lang.toLowerCase().startsWith('ru') ? 'ru' : 'ua';
}

const TEXTS = {
  ua: { photo: ['Тут міг би бути', 'ваш фотовідгук'], video: ['Тут міг би бути', 'ваш відеовідгук'] },
  ru: { photo: ['Здесь мог бы быть', 'ваш фотоотзыв'], video: ['Здесь мог бы быть', 'ваш видеоотзыв'] },
};

// ─── SVG placeholder generators ──────────────────────────────────────────────

// Subtle background tints: neutral / warm / cool
const PHOTO_BG = ['#F8F9FA', '#FFF8F5', '#F5F8FF'] as const;
const PHOTO_STROKE = ['#DEE2E6', '#F0D9D0', '#D0DCF0'] as const;
const PHOTO_ICON = ['#CED4DA', '#D4B8B0', '#B0BED4'] as const;

function svgToDataUrl(svg: string): string {
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// 300×375 (4:5) — matches the default aspectRatio of the widget
function makePhotoPh(variant: number, line1: string, line2: string): string {
  const bg = PHOTO_BG[variant % 3];
  const st = PHOTO_STROKE[variant % 3];
  const ic = PHOTO_ICON[variant % 3];
  // Camera icon (Lucide, 24×24 native, scaled ×2.5 → 60×60, centered at 150,160)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 375" width="300" height="375">
<rect width="300" height="375" fill="${bg}"/>
<rect x="14" y="14" width="272" height="347" rx="12" fill="none" stroke="${st}" stroke-width="1.5" stroke-dasharray="7 5"/>
<g transform="translate(120,130) scale(2.5)" fill="none" stroke="${ic}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3L14.5 4z"/>
  <circle cx="12" cy="13" r="3.5"/>
</g>
<text x="150" y="228" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif" font-size="14" fill="#9CA3AF" text-anchor="middle">${line1}</text>
<text x="150" y="249" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif" font-size="14" fill="#9CA3AF" text-anchor="middle">${line2}</text>
<text x="150" y="358" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif" font-size="10" fill="${st}" text-anchor="middle">widgetis</text>
</svg>`;
  return svgToDataUrl(svg);
}

function makeVideoPh(line1: string, line2: string): string {
  // Dark card with play circle — visually distinct from photo placeholders
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 375" width="300" height="375">
<rect width="300" height="375" fill="#111827"/>
<rect x="14" y="14" width="272" height="347" rx="12" fill="none" stroke="#374151" stroke-width="1.5" stroke-dasharray="7 5"/>
<circle cx="150" cy="170" r="38" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
<polygon points="143,157 143,183 170,170" fill="rgba(255,255,255,0.75)"/>
<text x="150" y="235" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif" font-size="14" fill="rgba(255,255,255,0.45)" text-anchor="middle">${line1}</text>
<text x="150" y="256" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif" font-size="14" fill="rgba(255,255,255,0.45)" text-anchor="middle">${line2}</text>
<text x="150" y="358" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif" font-size="10" fill="rgba(255,255,255,0.12)" text-anchor="middle">widgetis</text>
</svg>`;
  return svgToDataUrl(svg);
}

// ─── Fake match distribution ──────────────────────────────────────────────────

function buildFakeMatches(
  candidates: Array<{ name: string; body: string }>,
): Array<{ name: string; body: string; media: Array<{ url: string }> }> {
  const lang = getDemoLang();
  const t = TEXTS[lang];

  // Pre-build the 4 placeholder URLs once for all reviews
  const ph0 = makePhotoPh(0, t.photo[0], t.photo[1]);
  const ph1 = makePhotoPh(1, t.photo[0], t.photo[1]);
  const ph2 = makePhotoPh(2, t.photo[0], t.photo[1]);
  const phV = makeVideoPh(t.video[0], t.video[1]);

  return candidates.map((c, idx) => {
    let media: Array<{ url: string }>;
    const pattern = idx % 3;

    if (pattern === 1) {
      // review #1, #4, #7 … → video tile first (wow), then 2 photo variants
      media = [{ url: phV }, { url: ph0 }, { url: ph1 }];
    } else if (pattern === 0) {
      // review #0, #3, #6 … → 3 photo variants (full gallery)
      media = [{ url: ph0 }, { url: ph1 }, { url: ph2 }];
    } else {
      // review #2, #5, #8 … → 2 photo variants
      media = [{ url: ph1 }, { url: ph2 }];
    }

    return { name: c.name, body: c.body, media };
  });
}

// ─── Fetch shim ───────────────────────────────────────────────────────────────

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

    // Check /match before /reviews — the latter is a substring of the former
    if (url.includes(MATCH_URL_FRAGMENT)) {
      console.log(LOG, 'shimmed match endpoint — injecting placeholder galleries');
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
        /* ignore */
      }
      return Promise.resolve(
        new Response(JSON.stringify({ matches: buildFakeMatches(candidates) }), {
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

// ─── Demo entry ───────────────────────────────────────────────────────────────

const photoReviewsDemo: typeof photoReviews = (config, i18n) => {
  console.log(LOG, 'init — SVG placeholder mode, shimming match + upload');
  shimFetch();
  return photoReviews(config, i18n);
};

export default photoReviewsDemo;
