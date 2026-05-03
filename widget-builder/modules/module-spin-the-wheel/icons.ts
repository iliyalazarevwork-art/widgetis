// Lucide icon set — stroke-based, stroke="currentColor", fill="none".
// currentColor is replaced at runtime with the segment text color.
// Each icon is authored in a 24×24 viewBox; `centeredIconSvg` wraps it in
// a 32×32 viewBox with 4 px padding so every icon renders inside an
// identically-sized square — guaranteeing pixel-symmetric placement when
// `lucky-canvas` lays them out across wheel segments.

export type IconType =
  | 'percent'
  | 'gift'
  | 'truck'
  | 'star'
  | 'fire'
  | 'crown'
  | 'sparkle'
  | 'try-again'
  | 'pointer';

export const ICONS: Record<IconType, string> = {
  percent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,

  gift: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/></svg>`,

  truck: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,

  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>`,

  fire: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/></svg>`,

  crown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>`,

  sparkle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>`,

  'try-again': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,

  pointer: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 26" fill="currentColor"><polygon points="12,25 2,2 22,2" stroke="white" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
};

/**
 * Wrap a 24×24 Lucide icon in a 32×32 padded SVG with the requested stroke
 * color. The 4 px padding on every side gives every icon identical optical
 * weight — critical for symmetric placement on the wheel where icons of
 * different shapes (gift, truck, fire, etc.) are rendered side-by-side.
 *
 * The strokeWidth defaults to 2 (Lucide canonical). Linecap and linejoin
 * are forced to "round" for a soft, friendly look across all icons.
 */
// Per-icon optical-centre compensation. Lucide icons fill 0–24 in viewBox,
// but a few have content that doesn't align with the geometric centre
// (12, 12). For those we shift the wrapped <g> by a tiny offset so the
// VISUAL centre of the glyph lands at the centre of the 32×32 wrapper —
// critical when the icon is small (e.g. inside the wheel hub).
const ICON_VISUAL_OFFSET: Partial<Record<IconType, { x: number; y: number }>> = {
  // Gift content spans y=2..21 → visual centre y=11.5 (0.5 above geometric).
  gift: { x: 0, y: 0.5 },
  // Fire content sits in the lower half of the box.
  fire: { x: 0, y: -0.5 },
};

export function centeredIconSvg(
  iconType: IconType,
  color: string,
  strokeWidth: number = 2,
): string {
  const raw = ICONS[iconType];
  if (!raw) return '';
  // Strip outer <svg…> wrapper and just keep the children.
  const inner = raw
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  const offset = ICON_VISUAL_OFFSET[iconType] ?? { x: 0, y: 0 };
  const tx = (4 + offset.x).toFixed(2);
  const ty = (4 + offset.y).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(${tx} ${ty})">${inner}</g></svg>`;
}

// ---------------------------------------------------------------------------
// WCAG relative luminance — used to auto-pick a contrasting foreground
// (icons + labels) for each wheel segment. Light backgrounds (e.g. amber,
// yellow) use a warm dark foreground; dark backgrounds (rose, navy, etc.)
// keep white. This is what makes a 2-colour wheel readable end-to-end.
// ---------------------------------------------------------------------------

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Returns the foreground (icon + label) colour that pairs best with the
 * given segment background. Threshold 0.55 sits a hair above mid-grey,
 * tuned so amber/yellow correctly fall on the "use dark" side while rose,
 * sky and violet still use white.
 *
 * Dark fallback: a warm `#7c2d12` (orange-900) — works gracefully against
 * both amber and rose segments (no clash), and reads as intentional rather
 * than a generic "near-black".
 */
export function pickContrastColor(
  segmentBg: string,
  light: string = '#ffffff',
  dark: string = '#7c2d12',
): string {
  return relativeLuminance(segmentBg) > 0.55 ? dark : light;
}
