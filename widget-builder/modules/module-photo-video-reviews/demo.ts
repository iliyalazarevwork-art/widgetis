/**
 * Demo entry for module-photo-video-reviews.
 *
 * Shims two backend endpoints so the widget works on any site without
 * real merchant data:
 *  - POST /api/v1/widgets/reviews/match → SVG placeholder galleries with
 *    the actual review text displayed inside each tile
 *  - POST /api/v1/widgets/reviews       → always accepts, returns fake ID
 */
import photoReviews from './index';

const LOG = '[widgetality] photo-reviews (demo):';
const MATCH_URL_FRAGMENT = '/api/v1/widgets/reviews/match';
const UPLOAD_URL_FRAGMENT = '/api/v1/widgets/reviews';

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function svgEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Breaks text into lines of ≤maxChars, max maxLines lines, adds "…" if cut. */
function wrapText(raw: string, maxChars: number, maxLines: number): string[] {
  const words = raw.trim().split(/\s+/);
  const lines: string[] = [];
  let cur = '';

  for (const word of words) {
    if (lines.length >= maxLines) break;
    const candidate = cur ? `${cur} ${word}` : word;
    if (candidate.length <= maxChars) {
      cur = candidate;
    } else {
      if (cur) lines.push(cur);
      cur = word.length > maxChars ? word.slice(0, maxChars - 1) + '…' : word;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);

  // Append ellipsis on last line if original text was longer
  const wascut = lines.join(' ').length < words.join(' ').length;
  if (wascut && lines.length > 0) {
    const last = lines[lines.length - 1];
    if (!last.endsWith('…'))
      lines[lines.length - 1] = last.slice(0, maxChars - 1) + '…';
  }
  return lines;
}

// ─── Placeholder generators ──────────────────────────────────────────────────

const PHOTO_BG     = ['#F8F9FA', '#FFF8F5', '#F5F8FF'] as const;
const PHOTO_STROKE = ['#DEE2E6', '#F0D9D0', '#D0DCF0'] as const;
const PHOTO_ICON   = ['#CED4DA', '#D4B8B0', '#B0BED4'] as const;

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif";

function makePhotoPh(variant: number, reviewText: string): string {
  const bg = PHOTO_BG[variant % 3];
  const st = PHOTO_STROKE[variant % 3];
  const ic = PHOTO_ICON[variant % 3];

  const lines = wrapText(reviewText, 25, 3);
  const lineH = 21;
  const textY = 225;
  const textNodes = lines
    .map((l, i) =>
      `<text x="150" y="${textY + i * lineH}" ` +
      `font-family="${FONT}" font-size="13" fill="#9CA3AF" text-anchor="middle">${svgEscape(l)}</text>`,
    )
    .join('');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 375" width="300" height="375">` +
    `<rect width="300" height="375" fill="${bg}"/>` +
    `<rect x="14" y="14" width="272" height="347" rx="12" fill="none" stroke="${st}" stroke-width="1.5" stroke-dasharray="7 5"/>` +
    // Camera icon: Lucide 24×24 scaled ×2.5, centered at (150,155)
    `<g transform="translate(120,130) scale(2.5)" fill="none" stroke="${ic}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3L14.5 4z"/>` +
    `<circle cx="12" cy="13" r="3.5"/>` +
    `</g>` +
    textNodes +
    `<text x="150" y="358" font-family="${FONT}" font-size="10" fill="${st}" text-anchor="middle">widgetis</text>` +
    `</svg>`;

  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function makeVideoPh(reviewText: string): string {
  const lines = wrapText(reviewText, 25, 3);
  const lineH = 21;
  const textY = 238;
  const textNodes = lines
    .map((l, i) =>
      `<text x="150" y="${textY + i * lineH}" ` +
      `font-family="${FONT}" font-size="13" fill="rgba(255,255,255,0.45)" text-anchor="middle">${svgEscape(l)}</text>`,
    )
    .join('');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 375" width="300" height="375">` +
    `<rect width="300" height="375" fill="#111827"/>` +
    `<rect x="14" y="14" width="272" height="347" rx="12" fill="none" stroke="#374151" stroke-width="1.5" stroke-dasharray="7 5"/>` +
    `<circle cx="150" cy="168" r="38" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>` +
    `<polygon points="143,155 143,181 170,168" fill="rgba(255,255,255,0.75)"/>` +
    textNodes +
    `<text x="150" y="358" font-family="${FONT}" font-size="10" fill="rgba(255,255,255,0.12)" text-anchor="middle">widgetis</text>` +
    `</svg>`;

  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// ─── Fake match distribution ──────────────────────────────────────────────────

function buildFakeMatches(
  candidates: Array<{ name: string; body: string }>,
): Array<{ name: string; body: string; media: Array<{ url: string }> }> {
  return candidates.map((c, idx) => {
    const text = c.body || c.name || '…';
    const pattern = idx % 3;
    let media: Array<{ url: string }>;

    if (pattern === 1) {
      // review #1, #4, #7 … → dark video tile first (wow), then 2 photo variants
      media = [
        { url: makeVideoPh(text) },
        { url: makePhotoPh(0, text) },
        { url: makePhotoPh(1, text) },
      ];
    } else if (pattern === 0) {
      // review #0, #3, #6 … → 3 photo variants
      media = [
        { url: makePhotoPh(0, text) },
        { url: makePhotoPh(1, text) },
        { url: makePhotoPh(2, text) },
      ];
    } else {
      // review #2, #5, #8 … → 2 photo variants
      media = [
        { url: makePhotoPh(1, text) },
        { url: makePhotoPh(2, text) },
      ];
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

    if (url.includes(MATCH_URL_FRAGMENT)) {
      console.log(LOG, 'shimmed match — injecting review-text placeholders');
      let candidates: Array<{ name: string; body: string }> = [];
      try {
        const raw = init?.body;
        const parsed = JSON.parse(typeof raw === 'string' ? raw : '{}') as { candidates?: unknown };
        if (Array.isArray(parsed.candidates))
          candidates = parsed.candidates as Array<{ name: string; body: string }>;
      } catch { /* ignore */ }
      return Promise.resolve(
        new Response(JSON.stringify({ matches: buildFakeMatches(candidates) }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }

    if (url.includes(UPLOAD_URL_FRAGMENT)) {
      console.log(LOG, 'shimmed upload — pretending success');
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
  console.log(LOG, 'init — review-text SVG placeholders, shimming match + upload');
  shimFetch();
  return photoReviews(config, i18n);
};

export default photoReviewsDemo;
