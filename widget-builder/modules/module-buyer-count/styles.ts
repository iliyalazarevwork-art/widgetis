import type { SocialProofConfig } from './schema';

const STYLE_ID = 'social-proof-styles';

export function injectStyles(config: SocialProofConfig): void {
  if (document.getElementById(STYLE_ID)) return;

  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = buildCSS(config);
  document.head.appendChild(el);
}

function buildCSS(config: SocialProofConfig): string {
  const bg = config.backgroundColor;
  const text = config.textColor;

  return `
.sp-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  background: ${bg};
  border-radius: 20px;
  color: ${text};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  margin: 6px 0;
  line-height: 1;
  white-space: nowrap;
  cursor: default;
  transition: opacity .2s ease;
}
.sp-badge__icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}
.sp-badge__icon svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.sp-badge__count {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.sp-badge__label {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.92;
}
@media (max-width: 768px) {
  .sp-badge {
    font-size: 12px;
    padding: 4px 12px;
    gap: 6px;
  }
  .sp-badge__count { font-size: 14px; }
  .sp-badge__label { font-size: 12px; }
  .sp-badge__icon svg { width: 14px; height: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .sp-badge { transition: none; }
}`;
}
