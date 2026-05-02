// SVG icon strings for spin-the-wheel segments.
// All icons use currentColor so they inherit the segment text color.
// Solid/filled style for maximum readability at small sizes on vivid backgrounds.

export type IconType =
  | 'percent'
  | 'gift'
  | 'truck'
  | 'star'
  | 'fire'
  | 'crown'
  | 'sparkle'
  | 'try-again';

export const ICONS: Record<IconType, string> = {
  percent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="5.5" cy="5.5" r="3.5" fill="currentColor"/><circle cx="18.5" cy="18.5" r="3.5" fill="currentColor"/><path d="M19 5 5 19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`,

  gift: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="8" width="18" height="4" rx="1.5"/><rect x="5" y="12" width="14" height="9" rx="1"/><path d="M12 8C12 8 10.5 2.5 7.5 3C5.5 3.5 5 6 7 7C9 8 12 8 12 8Z"/><path d="M12 8C12 8 13.5 2.5 16.5 3C18.5 3.5 19 6 17 7C15 8 12 8 12 8Z"/><rect x="11" y="8" width="2" height="13" fill="rgba(0,0,0,0.18)"/></svg>`,

  truck: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2 4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h14V4H2z"/><path d="M16 8h4.5L23 12v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,

  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,

  fire: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c0 0-3 3.5-3 7 0 1.5.5 2.5.5 2.5S8 10 7 9c0 0-2 3-2 6a7 7 0 0 0 14 0c0-5-4-10-4-10s0 3-1 4c-1 1-2 0-2-2z"/></svg>`,

  crown: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14a1 1 0 0 0 0-2H5a1 1 0 0 0 0 2z"/><path d="M3 7l3.5 5L12 3l5.5 9L21 7l-2 11H5L3 7z"/></svg>`,

  sparkle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/><path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z"/><path d="M5 16l.5 1.5L7 18l-1.5.5L5 20l-.5-1.5L3 18l1.5-.5L5 16z"/></svg>`,

  'try-again': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
};
