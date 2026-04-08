const DEFAULT_COLORS = {
  bg: '#111827',
  text: '#f8fafc',
  border: 'rgba(255,255,255,0.1)',
};

export { DEFAULT_COLORS };

export function buildCSS(rootAttr: string): string {
  const s = rootAttr;
  const bg = DEFAULT_COLORS.bg;
  const txt = DEFAULT_COLORS.text;

  return (
    `[${s}]{position:static;display:flex;align-items:center;gap:0;overflow:hidden;box-sizing:border-box;padding-inline:0;width:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.2;backdrop-filter:blur(6px);contain:layout style;user-select:none;-webkit-user-select:none;background:var(--marquee-bg,${bg});color:var(--marquee-text,${txt})}` +
    `[${s}="fixed"]{position:fixed;inset-inline:0;top:env(safe-area-inset-top,0px)}` +
    `[${s}] .marquee__inner{flex:1;overflow:hidden;mask-image:linear-gradient(to right,transparent 0%,black 24px,black calc(100% - 24px),transparent 100%);-webkit-mask-image:linear-gradient(to right,transparent 0%,black 24px,black calc(100% - 24px),transparent 100%)}` +
    `[${s}] .marquee__track{display:flex;gap:32px;align-items:center;white-space:nowrap;will-change:transform;animation:none}` +
    `@media(hover:hover) and (min-width:769px){[${s}]:hover .marquee__track,[${s}].marquee--paused .marquee__track,[${s}] .marquee__track:focus-within{animation-play-state:paused!important}}` +
    `[${s}] .marquee__content{display:flex;gap:32px;flex-shrink:0}` +
    `[${s}] .marquee__item{font-size:14px;font-weight:600;letter-spacing:.01em;white-space:nowrap;flex-shrink:0}` +
    `[${s}] .marquee__close{border:none;background:transparent;color:inherit;width:32px;min-width:32px;height:32px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0}` +
    `[${s}] .marquee__close:hover{background:rgba(255,255,255,.08)}` +
    `[${s}] .marquee__close:focus-visible{outline:2px solid currentColor;outline-offset:2px}` +
    `@keyframes marquee-scroll{from{transform:translateX(0)}to{transform:translateX(calc(-1 * var(--marquee-shift,50%)))}}` +
    `@media(max-width:767px){[${s}]{background:var(--marquee-bg-mobile,var(--marquee-bg,${bg}));color:var(--marquee-text-mobile,var(--marquee-text,${txt}))}}`
  );
}
