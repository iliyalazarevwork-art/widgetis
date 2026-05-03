import type { CartGoalConfig } from './schema';

const STYLE_ID = 'cart-goal-widget-styles';

export function injectStyles(config: CartGoalConfig): void {
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = buildCSS(config);
  document.head.appendChild(style);
}

function buildCSS(c: CartGoalConfig): string {
  return `
.cg-widget {
  --cg-bg: ${c.background};
  --cg-text: ${c.textColor};
  --cg-bg-achieved: ${c.achievedBackground};
  background: var(--cg-bg);
  color: var(--cg-text);
  border-radius: 8px;
  padding: 12px 16px;
  margin: 10px auto;
  max-width: 450px;
  width: 95%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  box-sizing: border-box;
  min-height: 65px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: opacity 0.3s ease, transform 0.3s ease, background 0.3s ease;
  opacity: 0;
  transform: translateY(10px);
  position: relative;
  z-index: ${c.zIndex};
}
.cg-widget.is-achieved {
  background: var(--cg-bg-achieved);
}
.cg-widget--floating {
  position: fixed;
  z-index: ${c.zIndex};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  margin: 0;
  width: calc(100vw - 32px);
  max-width: 320px;
}
.cg-widget.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.cg-widget__label {
  font-size: 13px;
  font-weight: 600;
  display: block;
  margin-bottom: 3px;
  line-height: 1.3;
  color: inherit;
}
.cg-widget__layout {
  display: flex;
  align-items: center;
  gap: 14px;
}
.cg-widget__icon-col {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
}
.cg-widget__delivery-icon {
  display: inline-flex;
  align-items: center;
}
.cg-widget__delivery-icon svg {
  display: block;
  width: 36px;
  height: 36px;
}
@media (max-width: 480px) {
  .cg-widget__delivery-icon svg {
    width: 24px;
    height: 24px;
  }
}
.cg-widget__content-col {
  flex: 1;
  min-width: 0;
}
.cg-widget__amount {
  font-weight: 700;
  display: block;
  margin-bottom: 6px;
}
.cg-widget.is-achieved .cg-widget__label {
  font-size: 16px;
  font-weight: 700;
}
.cg-widget.is-achieved .cg-widget__icon-col {
  display: none;
}
.cg-widget.is-achieved .cg-widget__amount {
  visibility: hidden;
  font-size: 0;
  line-height: 0;
  margin: 0;
  padding: 0;
}
.cg-widget__progress {
  background: rgba(255, 255, 255, 0.3);
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
}
.cg-widget__bar {
  background: #ffffff;
  height: 100%;
  width: 0%;
  transition: width 0.5s ease-out;
}
@media (max-width: 768px) {
  .cg-widget--floating {
    z-index: ${c.zIndex};
  }
  .cg-widget__label {
    font-size: 12px;
  }
}
.cg-widget__desktop {
  display: flex;
  flex-direction: column;
}
.cg-widget__mobile {
  display: none;
}
@media (max-width: 768px) {
  .cg-widget__desktop { display: none !important; }
  .cg-widget__mobile { display: block; }
  .cg-widget--floating[data-state="collapsed"] {
    width: 60px; height: 60px; min-width: 60px; min-height: 60px;
    max-width: 60px; max-height: 60px; border-radius: 12px; padding: 0;
    overflow: hidden;
    transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                border-radius 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                box-shadow 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    display: flex; flex-direction: column; justify-content: center;
    align-items: center; box-sizing: border-box;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  .cg-widget--floating[data-state="collapsed"] .cg-widget__collapsed {
    width: 100%; height: 100%; display: flex; flex-direction: column;
    justify-content: center; align-items: center; padding: 6px;
    box-sizing: border-box; gap: 1px;
  }
  .cg-widget--floating[data-state="expanded"] {
    width: calc(100vw - 32px); max-width: 320px; height: 60px;
    min-height: 60px; max-height: 60px; padding: 8px 12px;
    border-radius: 16px;
    transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                border-radius 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                box-shadow 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  }
  .cg-mobile-icon { font-size: 28px; line-height: 1; text-align: center; flex-shrink: 0; }
  .cg-mobile-icon img { width: 28px; height: 28px; }
  .cg-mobile-amount { display: none; }
  .cg-mobile-progress {
    width: 42px; height: 4px; background: rgba(255, 255, 255, 0.5);
    border-radius: 2px; overflow: hidden; flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  .cg-mobile-progress-bar {
    height: 100%; width: 0%; background: white;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
    transition: width 0.5s ease-out;
  }
  .cg-widget__collapsed {
    display: block; position: relative; width: 100%; height: 100%;
    opacity: 1; transition: opacity 0.2s ease;
  }
  .cg-widget__expanded { display: none; }
  [data-state="expanded"] .cg-widget__collapsed { display: none; }
  [data-state="expanded"] .cg-widget__expanded {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; height: 100%; gap: 8px;
  }
  .cg-widget__expanded .cg-exp-info,
  .cg-widget__expanded .cg-mobile-close { visibility: hidden; }
  [data-state="expanded"] .cg-widget__expanded .cg-exp-info,
  [data-state="expanded"] .cg-widget__expanded .cg-mobile-close {
    visibility: visible; transition: visibility 0s linear 0.5s;
  }
  .cg-exp-info {
    display: flex; align-items: center; gap: 10px; flex: 1;
    font-size: 12px; font-weight: 600; line-height: 1.3;
    min-height: 44px; max-height: 44px; overflow: hidden;
  }
  .cg-exp-icon { font-size: 22px; line-height: 1; flex-shrink: 0; }
  .cg-exp-icon img { width: 22px; height: 22px; }
  .cg-exp-label {
    width: 200px; flex-shrink: 1; min-width: 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; line-height: 1.2; align-self: center;
  }
  .cg-exp-amount { font-weight: 700; flex-shrink: 0; white-space: nowrap; }
  .cg-mobile-close {
    background: rgba(255, 255, 255, 0.2); border: none; color: inherit;
    font-size: 20px; line-height: 1; width: 28px; height: 28px;
    border-radius: 50%; cursor: pointer; display: flex; align-items: center;
    justify-content: center; padding: 0; margin: 0; flex-shrink: 0;
    transition: background 0.2s ease; font-family: Arial, sans-serif;
    text-align: center;
  }
  .cg-mobile-close:hover { background: rgba(255, 255, 255, 0.3); }
  .cg-mobile-close:active { background: rgba(255, 255, 255, 0.4); }
}
.cg-widget-backdrop {
  display: none; position: fixed; top: 0; left: 0;
  width: 100vw; height: 100vh; background: transparent;
  z-index: 2147482999;
}
@keyframes cg-chest-bounce {
  0%   { transform: scale(1) rotate(0deg) translateY(0); }
  10%  { transform: scale(1.05) rotate(-3deg) translateY(-2px); }
  20%  { transform: scale(1.08) rotate(3deg) translateY(-4px); }
  30%  { transform: scale(1.05) rotate(-2deg) translateY(-2px); }
  40%  { transform: scale(1.02) rotate(2deg) translateY(-1px); }
  50%  { transform: scale(1) rotate(0deg) translateY(0); }
  100% { transform: scale(1) rotate(0deg) translateY(0); }
}
@media (max-width: 768px) {
  .cg-widget--floating[data-state="collapsed"].cg-shake {
    animation: cg-chest-bounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}
/* Desktop icon-only mode */
.cg-widget--icon-only .cg-widget__desktop { display: none !important; }
.cg-widget--icon-only .cg-widget__mobile { display: block; }
.cg-widget--icon-only.cg-widget--floating { cursor: pointer; }
.cg-widget--icon-only.cg-widget--floating[data-state="collapsed"] {
  width: 60px; height: 60px; min-width: 60px; min-height: 60px;
  max-width: 60px; max-height: 60px; border-radius: 12px; padding: 0;
  overflow: hidden;
  transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              border-radius 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex; flex-direction: column; justify-content: center;
  align-items: center; box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.cg-widget--icon-only.cg-widget--floating[data-state="collapsed"] .cg-widget__collapsed {
  width: 100%; height: 100%; display: flex; flex-direction: column;
  justify-content: center; align-items: center; padding: 6px;
  box-sizing: border-box; gap: 1px;
}
.cg-widget--icon-only.cg-widget--floating[data-state="expanded"] {
  width: calc(100vw - 32px); max-width: 320px; height: 60px;
  min-height: 60px; max-height: 60px; padding: 8px 12px; border-radius: 16px;
  transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              border-radius 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}
.cg-widget--icon-only .cg-mobile-icon { font-size: 28px; line-height: 1; text-align: center; flex-shrink: 0; }
.cg-widget--icon-only .cg-mobile-icon img { width: 28px; height: 28px; }
.cg-widget--icon-only .cg-mobile-amount { display: none; }
.cg-widget--icon-only .cg-mobile-progress {
  width: 42px; height: 4px; background: rgba(255, 255, 255, 0.5);
  border-radius: 2px; overflow: hidden; flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.cg-widget--icon-only .cg-mobile-progress-bar {
  height: 100%; width: 0%; background: white;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
  transition: width 0.5s ease-out;
}
.cg-widget--icon-only .cg-widget__collapsed {
  display: block; position: relative; width: 100%; height: 100%;
  opacity: 1; transition: opacity 0.2s ease;
}
.cg-widget--icon-only .cg-widget__expanded { display: none; }
.cg-widget--icon-only[data-state="expanded"] .cg-widget__collapsed { display: none; }
.cg-widget--icon-only[data-state="expanded"] .cg-widget__expanded {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; height: 100%; gap: 8px;
}
.cg-widget--icon-only .cg-widget__expanded .cg-exp-info,
.cg-widget--icon-only .cg-widget__expanded .cg-mobile-close { visibility: hidden; }
.cg-widget--icon-only[data-state="expanded"] .cg-widget__expanded .cg-exp-info,
.cg-widget--icon-only[data-state="expanded"] .cg-widget__expanded .cg-mobile-close {
  visibility: visible; transition: visibility 0s linear 0.5s;
}
.cg-widget--icon-only .cg-exp-info {
  display: flex; align-items: center; gap: 10px; flex: 1;
  font-size: 12px; font-weight: 600; line-height: 1.3;
  min-height: 44px; max-height: 44px; overflow: hidden;
}
.cg-widget--icon-only .cg-exp-icon { font-size: 22px; line-height: 1; flex-shrink: 0; }
.cg-widget--icon-only .cg-exp-icon img { width: 22px; height: 22px; }
.cg-widget--icon-only .cg-exp-label {
  width: 200px; flex-shrink: 1; min-width: 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; line-height: 1.2; align-self: center;
}
.cg-widget--icon-only .cg-exp-amount { font-weight: 700; flex-shrink: 0; white-space: nowrap; }
.cg-widget--icon-only .cg-mobile-close {
  background: rgba(255, 255, 255, 0.2); border: none; color: inherit;
  font-size: 20px; line-height: 1; width: 28px; height: 28px;
  border-radius: 50%; cursor: pointer; display: flex; align-items: center;
  justify-content: center; padding: 0; margin: 0; flex-shrink: 0;
  transition: background 0.2s ease; font-family: Arial, sans-serif;
  text-align: center;
}
.cg-widget--icon-only .cg-mobile-close:hover { background: rgba(255, 255, 255, 0.3); }
.cg-widget--icon-only .cg-mobile-close:active { background: rgba(255, 255, 255, 0.4); }
.cg-widget--icon-only.cg-widget--floating[data-state="collapsed"].cg-shake {
  animation: cg-chest-bounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
`;
}
