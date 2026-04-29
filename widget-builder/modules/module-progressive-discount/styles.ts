import type { ProgressiveDiscountConfig } from './schema';

const STYLE_ID = 'progressive-discount-styles';

export function injectStyles(config: ProgressiveDiscountConfig): void {
  if (document.getElementById(STYLE_ID)) return;

  const css = `
    .pd-banner {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 14px;
      margin: 12px 0;
      border-radius: 12px;
      background: ${config.background};
      color: ${config.textColor};
      font-family: inherit;
      font-size: 14px;
      line-height: 1.4;
      z-index: ${config.zIndex};
      transition: background 200ms ease;
    }
    .pd-banner.is-top { background: ${config.achievedBackground}; }
    .pd-banner__head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
    }
    .pd-banner__title { font-weight: 600; opacity: .9; }
    .pd-banner__current { font-weight: 700; color: ${config.accentColor}; font-size: 15px; }
    .pd-banner__hint { opacity: .85; }
    .pd-banner__hint b { color: ${config.accentColor}; font-weight: 700; }
    .pd-banner__bar {
      position: relative;
      height: 6px;
      border-radius: 999px;
      background: rgba(255,255,255,.15);
      overflow: hidden;
    }
    .pd-banner__bar-fill {
      position: absolute;
      inset: 0 auto 0 0;
      width: 0%;
      background: ${config.accentColor};
      border-radius: 999px;
      transition: width 320ms ease;
    }
    .pd-banner__tiers {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      font-size: 12px;
      opacity: .9;
    }
    .pd-banner__tier {
      flex: 1 1 0;
      text-align: center;
      padding: 4px 6px;
      border-radius: 8px;
      background: rgba(255,255,255,.06);
    }
    .pd-banner__tier.is-active {
      background: ${config.accentColor};
      color: ${config.background};
      font-weight: 700;
    }
  `;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}
