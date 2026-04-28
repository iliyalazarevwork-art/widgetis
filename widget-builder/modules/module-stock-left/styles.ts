import type { StockLeftConfig } from './schema';

const STYLE_ID = 'wty-stock-left-styles';

export function injectStyles(config: StockLeftConfig): void {
  if (document.getElementById(STYLE_ID)) return;

  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = buildCSS(config);
  document.head.appendChild(el);
}

function buildCSS(config: StockLeftConfig): string {
  const text = config.textColor;
  const accent = config.accentColor;
  const pulse = config.pulse;

  return `
.wty-stock-left-wrapper {
  display: block;
  width: 100%;
  margin: 10px 0 0;
  padding: 0;
  box-sizing: border-box;
  flex: none !important;
}
.wty-stock-left {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  color: ${text};
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  text-align: center;
  letter-spacing: 0.1px;
  box-sizing: border-box;
}
.wty-stock-left__dot {
  display: inline-block;
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${accent};
  box-shadow: 0 0 0 0 ${accent}66;
  ${pulse ? 'animation: wty-stock-left-pulse 1.8s ease-out infinite;' : ''}
}
.wty-stock-left__label { opacity: 0.9; }
.wty-stock-left__count {
  font-weight: 700;
  color: ${accent};
  font-variant-numeric: tabular-nums;
}
.wty-stock-left__unit { opacity: 0.9; }
.wty-stock-left--flash .wty-stock-left__count { animation: wty-stock-left-flash .5s ease; }
@keyframes wty-stock-left-pulse {
  0%   { box-shadow: 0 0 0 0 ${accent}66; }
  70%  { box-shadow: 0 0 0 8px ${accent}00; }
  100% { box-shadow: 0 0 0 0 ${accent}00; }
}
@keyframes wty-stock-left-flash {
  0%   { transform: scale(1.25); }
  100% { transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .wty-stock-left__dot, .wty-stock-left--flash .wty-stock-left__count { animation: none !important; }
}`;
}
