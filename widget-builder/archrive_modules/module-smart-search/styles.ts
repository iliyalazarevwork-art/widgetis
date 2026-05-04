export function buildCSS(accent: string, theme: 'light' | 'dark'): string {
  const isDark = theme === 'dark';

  const panel = isDark ? '#15171c' : '#fff';
  const text = isDark ? '#e7e9ee' : '#0d0e12';
  const textMuted = isDark ? '#9aa1ad' : '#6b7280';
  const border = isDark ? '#23262d' : '#eef0f3';
  const itemHover = isDark ? '#1d2026' : '#f6f7f9';
  const chipBg = isDark ? '#1d2026' : '#fff';
  const chipBorder = isDark ? '#2c2f36' : '#e6e8ec';
  const chipText = isDark ? '#c8cdd6' : '#2c2f36';
  const footerBg = isDark ? '#13151a' : '#fbfbfc';
  const skeletonBase = isDark ? '#1d2026' : '#eef0f3';
  const skeletonShine = isDark ? '#252830' : '#f6f7f9';
  const historyChipBg = isDark ? '#1d2026' : '#f3f4f6';
  const historyChipText = isDark ? '#c8cdd6' : '#2c2f36';
  const historyChipHover = isDark ? '#252830' : '#eaecef';

  return (
    /* Custom property root — accent is injected here so color-mix() works everywhere */
    `.ssrch-root{--ssrch-accent:${accent}}` +

    /* Backdrop */
    `.ssrch-backdrop{position:fixed;inset:0;z-index:2147483640;display:flex;align-items:flex-start;justify-content:center;` +
    `background:rgba(13,14,18,.55);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);` +
    `opacity:0;transition:opacity 180ms ease-out;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;` +
    `-webkit-font-smoothing:antialiased;box-sizing:border-box}` +
    `.ssrch-backdrop.ssrch-open{opacity:1;pointer-events:auto}` +
    `@media(max-width:600px){.ssrch-backdrop{align-items:flex-end}}` +

    /* Panel */
    `.ssrch-panel{margin-top:clamp(40px,6vh,96px);max-width:1080px;width:calc(100% - 32px);background:${panel};` +
    `border-radius:20px;box-shadow:0 30px 80px -20px rgba(13,14,18,.45),0 0 0 1px rgba(0,0,0,.04);overflow:hidden;` +
    `transform:translateY(-12px) scale(.985);opacity:0;transition:transform 220ms cubic-bezier(.2,.8,.2,1),opacity 220ms cubic-bezier(.2,.8,.2,1)}` +
    `.ssrch-backdrop.ssrch-open .ssrch-panel{transform:none;opacity:1}` +
    `.ssrch-backdrop.ssrch-closing .ssrch-panel{transform:translateY(-12px) scale(.985);opacity:0}` +
    `@media(max-width:600px){` +
    `.ssrch-panel{margin-top:0;width:100%;border-radius:16px 16px 0 0;transform:translateY(100%);transition:transform 260ms cubic-bezier(.2,.8,.2,1),opacity 260ms cubic-bezier(.2,.8,.2,1)}` +
    `.ssrch-backdrop.ssrch-open .ssrch-panel{transform:translateY(0);opacity:1}` +
    `.ssrch-backdrop.ssrch-closing .ssrch-panel{transform:translateY(100%);opacity:0}}` +

    /* Grab handle (mobile) */
    `.ssrch-handle{display:none;width:36px;height:4px;background:#e0e2e6;border-radius:999px;margin:6px auto 0}` +
    `@media(max-width:600px){.ssrch-handle{display:block}}` +

    /* Header */
    `.ssrch-header{height:76px;padding:0 28px;display:flex;align-items:center;gap:14px;box-sizing:border-box}` +
    `.ssrch-header-border{border-bottom:1px solid ${border};display:none}` +
    `.ssrch-root.has-results .ssrch-header-border{display:block}` +
    `@media(max-width:600px){.ssrch-header{height:64px;padding:0 18px}}` +

    /* Search icon */
    `.ssrch-icon{width:22px;height:22px;flex-shrink:0;stroke:#9aa1ad;fill:none;transition:stroke 160ms}` +
    `.ssrch-header:focus-within .ssrch-icon{stroke:var(--ssrch-accent)}` +

    /* Input */
    `.ssrch-input{flex:1;border:0;outline:0;background:transparent;font-size:22px;font-weight:400;letter-spacing:-.015em;` +
    `color:${text};font-family:inherit;-webkit-font-smoothing:antialiased;min-width:0}` +
    `.ssrch-input::placeholder{color:#aab0b9}` +
    `@media(max-width:600px){.ssrch-input{font-size:18px}}` +

    /* KBD hint */
    `.ssrch-kbd{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;` +
    `padding:4px 8px;border-radius:6px;background:#f1f2f5;color:#6b7280;white-space:nowrap;flex-shrink:0}` +
    `@media(max-width:600px){.ssrch-kbd{display:none}}` +

    /* Close button */
    `.ssrch-close{width:32px;height:32px;border-radius:50%;border:0;background:transparent;cursor:pointer;` +
    `display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;padding:0;color:${textMuted};transition:background 120ms}` +
    `.ssrch-close:hover{background:${itemHover}}` +

    /* Category chips */
    `.ssrch-chips{display:flex;gap:8px;padding:14px 28px 6px;overflow-x:auto;scrollbar-width:none}` +
    `.ssrch-chips::-webkit-scrollbar{display:none}` +
    `.ssrch-chip{padding:7px 14px;border-radius:999px;font-size:13px;font-weight:500;` +
    `border:1px solid ${chipBorder};background:${chipBg};color:${chipText};flex-shrink:0;cursor:pointer;` +
    `transition:all 160ms;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}` +
    `.ssrch-chip:hover:not(.ssrch-chip--active){background:#f7f8fa}` +
    `.ssrch-chip--active{background:var(--ssrch-accent);color:#fff;border-color:transparent}` +
    `.ssrch-chip-count{opacity:.55;font-size:12px}` +

    /* Results area */
    `.ssrch-results{padding:8px 20px 24px;max-height:calc(100vh - 320px);min-height:200px;overflow-y:auto;scroll-behavior:smooth;box-sizing:border-box}` +

    /* Group */
    `.ssrch-group{margin-top:18px}` +
    `.ssrch-group-header{padding:6px 8px 10px;display:flex;align-items:baseline;justify-content:space-between}` +
    `.ssrch-group-title{font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:${textMuted}}` +
    `.ssrch-group-title--expanded{font-size:18px;font-weight:600;color:${text};text-transform:none;letter-spacing:normal}` +
    `.ssrch-group-viewall{font-size:12px;color:var(--ssrch-accent);opacity:.9;text-decoration:none}` +
    `.ssrch-group-viewall:hover{opacity:1}` +

    /* Item grid */
    `.ssrch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}` +
    `@media(max-width:980px){.ssrch-grid{grid-template-columns:repeat(2,1fr)}}` +
    `@media(max-width:600px){.ssrch-grid{grid-template-columns:1fr}}` +

    /* Item card */
    `.ssrch-item{display:grid;grid-template-columns:64px 1fr auto;gap:14px;align-items:center;` +
    `padding:10px;border-radius:12px;text-decoration:none;color:inherit;transition:background 120ms;box-sizing:border-box}` +
    `.ssrch-item:hover,.ssrch-item:focus-visible{background:${itemHover};outline:none}` +
    `.ssrch-item--oos{opacity:.55}` +

    /* Image wrapper */
    `.ssrch-img-wrap{position:relative;width:64px;height:64px;flex-shrink:0}` +
    `.ssrch-img{width:64px;height:64px;border-radius:10px;object-fit:contain;background:#fafbfc;display:block}` +
    `.ssrch-item--oos .ssrch-img{filter:grayscale(.6)}` +
    `.ssrch-oos-badge{position:absolute;bottom:2px;left:2px;font-size:10px;color:#fff;` +
    `background:rgba(13,14,18,.7);padding:2px 6px;border-radius:4px;white-space:nowrap;pointer-events:none}` +

    /* Item info */
    `.ssrch-vendor{font-size:11px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;color:#9aa1ad;margin-bottom:2px}` +
    `.ssrch-name{font-size:14px;font-weight:500;color:${text};line-height:1.35;` +
    `display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}` +

    /* Price */
    `.ssrch-price-col{text-align:right;display:flex;flex-direction:column;align-items:flex-end}` +
    `.ssrch-discount-badge{font-size:10px;font-weight:700;color:var(--ssrch-accent);` +
    `background:color-mix(in srgb,var(--ssrch-accent) 14%,transparent);padding:2px 6px;border-radius:4px;margin-bottom:4px;white-space:nowrap}` +
    `.ssrch-price-row{display:flex;align-items:baseline;gap:6px}` +
    `.ssrch-oldprice{font-size:12px;color:#aab0b9;text-decoration:line-through}` +
    `.ssrch-newprice{font-size:15px;font-weight:600;color:${text};white-space:nowrap}` +
    `.ssrch-newprice--sale{color:var(--ssrch-accent)}` +
    `.ssrch-currency{font-weight:400;color:${textMuted};font-size:12px;margin-left:3px}` +

    /* Highlight */
    `.ssrch-hl{background:color-mix(in srgb,var(--ssrch-accent) 16%,transparent);color:inherit;border-radius:3px;padding:0 2px;-webkit-box-decoration-break:clone;box-decoration-break:clone}` +

    /* Skeleton */
    `@keyframes ssrchShimmer{from{background-position:200% 0}to{background-position:-200% 0}}` +
    `.ssrch-skeleton-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:8px 20px 24px}` +
    `@media(max-width:980px){.ssrch-skeleton-grid{grid-template-columns:repeat(2,1fr)}}` +
    `@media(max-width:600px){.ssrch-skeleton-grid{grid-template-columns:1fr}}` +
    `.ssrch-skeleton-card{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:10px;border-radius:12px}` +
    `.ssrch-skeleton-img{width:64px;height:64px;border-radius:10px;` +
    `background:linear-gradient(90deg,${skeletonBase} 0%,${skeletonShine} 50%,${skeletonBase} 100%);` +
    `background-size:200% 100%;animation:ssrchShimmer 1.1s ease-in-out infinite;flex-shrink:0}` +
    `.ssrch-skeleton-info{display:flex;flex-direction:column;gap:8px}` +
    `.ssrch-skeleton-bar{height:12px;border-radius:8px;` +
    `background:linear-gradient(90deg,${skeletonBase} 0%,${skeletonShine} 50%,${skeletonBase} 100%);` +
    `background-size:200% 100%;animation:ssrchShimmer 1.1s ease-in-out infinite}` +
    `.ssrch-skeleton-bar--wide{width:80%}` +
    `.ssrch-skeleton-bar--narrow{width:40%}` +
    `.ssrch-skeleton-bar--price{width:55%;height:14px}` +

    /* Empty state */
    `.ssrch-empty{text-align:center;padding:64px 24px}` +
    `.ssrch-empty-title{font-size:17px;font-weight:600;color:${text};margin-top:18px}` +
    `.ssrch-empty-subtitle{font-size:14px;color:${textMuted};margin-top:6px}` +
    `.ssrch-popular-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:16px}` +
    `.ssrch-popular-label{font-size:12px;color:${textMuted};align-self:center;white-space:nowrap}` +
    `.ssrch-popular-chip{padding:6px 14px;border-radius:999px;border:1px solid ${chipBorder};background:${chipBg};` +
    `color:${chipText};font-size:13px;cursor:pointer;transition:background 120ms}` +
    `.ssrch-popular-chip:hover{background:${itemHover}}` +

    /* History */
    `.ssrch-history{padding:10px 18px 18px}` +
    `.ssrch-history-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}` +
    `.ssrch-history-title{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9aa1ad}` +
    `.ssrch-history-clear{font-size:12px;color:var(--ssrch-accent);cursor:pointer;background:none;border:0;padding:0}` +
    `.ssrch-history-chips{display:flex;flex-wrap:wrap;gap:8px}` +
    `.ssrch-history-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;` +
    `background:${historyChipBg};font-size:13px;color:${historyChipText};cursor:pointer;transition:background 120ms;position:relative}` +
    `.ssrch-history-chip:hover{background:${historyChipHover}}` +
    `.ssrch-history-chip-remove{display:none;width:14px;height:14px;line-height:1;font-size:14px;` +
    `color:${textMuted};background:none;border:0;padding:0;cursor:pointer;flex-shrink:0;align-items:center;justify-content:center}` +
    `.ssrch-history-chip:hover .ssrch-history-chip-remove{display:inline-flex}` +

    /* Correction */
    `.ssrch-correction{padding:10px 28px 0;font-size:13px;color:${textMuted}}` +
    `.ssrch-correction strong{color:var(--ssrch-accent);font-weight:600}` +

    /* Footer */
    `.ssrch-footer{display:none;align-items:center;justify-content:space-between;` +
    `padding:12px 22px;border-top:1px solid ${border};background:${footerBg}}` +
    `.ssrch-root.has-results .ssrch-footer{display:flex}` +
    `.ssrch-footer-count{font-size:12px;color:${textMuted}}` +
    `.ssrch-footer-cta{font-size:12px;font-weight:600;color:var(--ssrch-accent);` +
    `padding:7px 14px;border-radius:999px;border:1px solid color-mix(in srgb,var(--ssrch-accent) 40%,transparent);` +
    `background:transparent;cursor:pointer;text-decoration:none;display:inline-block;transition:background 120ms}` +
    `.ssrch-footer-cta:hover{background:color-mix(in srgb,var(--ssrch-accent) 8%,transparent)}` +

    /* Stagger animation */
    `@keyframes ssrchFadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}` +
    `.ssrch-stagger .ssrch-item{animation:ssrchFadeUp 240ms cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0) * 22ms)}`
  );
}
