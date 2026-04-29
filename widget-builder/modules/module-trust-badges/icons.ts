import type { TrustBadgeIcon } from './schema';

const SVG = (path: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

export const ICONS: Record<TrustBadgeIcon, string> = {
  shield: SVG('<path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  truck: SVG('<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
  return: SVG('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  lock: SVG('<rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  card: SVG('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 11h18"/><path d="M7 16h3"/>'),
  guarantee: SVG('<circle cx="12" cy="9" r="6"/><path d="m9 8 2 2 4-4"/><path d="M8 14l-2 7 6-3 6 3-2-7"/>'),
  support: SVG('<path d="M4 12a8 8 0 1 1 16 0v4a3 3 0 0 1-3 3h-1v-7h4"/><path d="M4 12v4a3 3 0 0 0 3 3h1v-7H4"/>'),
  star: SVG('<polygon points="12 2 15 9 22 9.5 17 15 18.5 22 12 18.5 5.5 22 7 15 2 9.5 9 9"/>'),
  leaf: SVG('<path d="M5 21c0-9 7-15 16-16-1 9-7 16-16 16z"/><path d="M5 21c4-4 8-7 12-9"/>'),
  box: SVG('<path d="M21 8v12H3V8"/><path d="M1 5h22v3H1z"/><path d="M10 12h4"/>'),
};
