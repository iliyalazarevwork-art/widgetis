import type { MinOrderConfig } from './schema';

const STYLE_ID = 'min-order-widget-styles';

export function injectStyles(config: MinOrderConfig): void {
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = buildCSS(config);
  document.head.appendChild(style);
}

function buildCSS(c: MinOrderConfig): string {
  return `
.mo-widget {
  --mo-bg: ${c.background};
  --mo-text: ${c.textColor};
  --mo-bg-achieved: ${c.achievedBackground};
  background: var(--mo-bg);
  color: var(--mo-text);
  border-radius: 8px;
  padding: 12px 16px;
  margin: 10px auto;
  max-width: 450px;
  width: 95%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  box-sizing: border-box;
  min-height: 55px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: opacity 0.3s ease, transform 0.3s ease, background 0.3s ease;
  opacity: 0;
  transform: translateY(10px);
  position: relative;
  z-index: ${c.zIndex};
}
.mo-widget.is-visible { opacity: 1; transform: translateY(0); }
.mo-widget.is-hidden { display: none !important; }

/* ── Desktop view ── */
.mo-widget__desktop {
  display: flex;
  flex-direction: column;
}
.mo-widget__text {
  font-size: 14px; font-weight: 600; text-align: center;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 30px; color: inherit;
}
.mo-widget__amount { font-weight: 700; }
.mo-widget__progress {
  background: rgba(255,255,255,0.3); height: 6px; border-radius: 3px;
  overflow: hidden; margin-top: 8px;
}
.mo-widget__bar {
  background: #fff; height: 100%; width: 0%;
  transition: width 0.5s ease-out;
}

/* ── Floating widget ── */
.mo-widget--floating {
  position: fixed;
  z-index: ${c.zIndex};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  margin: 0;
  width: calc(100vw - 32px);
  max-width: 320px;
  cursor: pointer;
}

/* ── Mobile view ── */
.mo-widget__mobile { display: none; }

@media (max-width: 768px) {
  .mo-widget__text { font-size: 13px; flex-direction: column; gap: 2px; }
  .mo-widget--floating { z-index: 16778000; }
  .mo-widget--floating .mo-widget__desktop { display: none !important; }
  .mo-widget--floating .mo-widget__mobile { display: block; }

  /* Collapsed state (60x60 square) */
  .mo-widget--floating[data-state="collapsed"] {
    width: 60px; height: 60px;
    min-width: 60px; min-height: 60px;
    max-width: 60px; max-height: 60px;
    border-radius: 12px; padding: 0; overflow: hidden;
    transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                border-radius 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                box-shadow 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    box-sizing: border-box;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  .mo-widget--floating[data-state="collapsed"] .mo-widget__collapsed {
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    padding: 6px; box-sizing: border-box; gap: 1px;
  }

  /* Expanded state */
  .mo-widget--floating[data-state="expanded"] {
    width: calc(100vw - 32px); max-width: 320px;
    height: 60px; min-height: 60px; max-height: 60px;
    padding: 8px 12px; border-radius: 16px;
    transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                border-radius 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                box-shadow 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  }

  /* Mobile icon */
  .mo-mobile-icon {
    width: 28px; height: 28px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .mo-mobile-icon svg { width: 28px; height: 28px; }

  /* Mobile progress bar */
  .mo-mobile-progress {
    width: 42px; height: 4px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 2px; overflow: hidden; flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  .mo-mobile-progress-bar {
    height: 100%; width: 0%; background: white;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
    transition: width 0.5s ease-out;
  }

  /* Collapsed/Expanded content visibility */
  .mo-widget__collapsed {
    display: block; position: relative;
    width: 100%; height: 100%;
    opacity: 1; transition: opacity 0.2s ease;
  }
  .mo-widget__expanded { display: none; }
  [data-state="expanded"] .mo-widget__collapsed { display: none; }
  [data-state="expanded"] .mo-widget__expanded {
    display: flex; align-items: center;
    justify-content: space-between;
    width: 100%; height: 100%; gap: 8px;
  }

  /* Expanded content hidden by default */
  .mo-widget__expanded .mo-exp-info,
  .mo-widget__expanded .mo-mobile-close { visibility: hidden; }
  [data-state="expanded"] .mo-widget__expanded .mo-exp-info,
  [data-state="expanded"] .mo-widget__expanded .mo-mobile-close {
    visibility: visible; transition: visibility 0s linear 0.5s;
  }

  /* Expanded content layout */
  .mo-exp-info {
    display: flex; align-items: center; gap: 10px;
    flex: 1; font-size: 12px; font-weight: 600;
    line-height: 1.3; min-height: 44px; max-height: 44px; overflow: hidden;
  }
  .mo-exp-icon {
    width: 28px; height: 28px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .mo-exp-icon svg { width: 28px; height: 28px; }
  .mo-exp-label {
    width: 200px; flex-shrink: 1; min-width: 0;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
    line-height: 1.2; align-self: center;
  }
  .mo-exp-amount { font-weight: 700; flex-shrink: 0; white-space: nowrap; }

  /* Close button */
  .mo-mobile-close {
    background: rgba(255, 255, 255, 0.2); border: none;
    color: inherit; font-size: 20px; line-height: 1;
    width: 28px; height: 28px; border-radius: 50%;
    cursor: pointer; display: flex; align-items: center;
    justify-content: center; padding: 0; margin: 0; flex-shrink: 0;
    transition: background 0.2s ease;
    font-family: Arial, sans-serif; text-align: center;
  }
  .mo-mobile-close:hover { background: rgba(255, 255, 255, 0.3); }
  .mo-mobile-close:active { background: rgba(255, 255, 255, 0.4); }
}

/* ── desktop icon-only mode ── */
.mo-widget--icon-only .mo-widget__desktop { display: none !important; }
.mo-widget--icon-only .mo-widget__mobile { display: block; }
.mo-widget--icon-only.mo-widget--floating { cursor: pointer; }
.mo-widget--icon-only.mo-widget--floating[data-state="collapsed"] {
  width: 60px; height: 60px;
  min-width: 60px; min-height: 60px;
  max-width: 60px; max-height: 60px;
  border-radius: 12px; padding: 0; overflow: hidden;
  transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              border-radius 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.mo-widget--icon-only.mo-widget--floating[data-state="collapsed"] .mo-widget__collapsed {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  padding: 6px; box-sizing: border-box; gap: 1px;
}
.mo-widget--icon-only.mo-widget--floating[data-state="expanded"] {
  width: calc(100vw - 32px); max-width: 320px;
  height: 60px; min-height: 60px; max-height: 60px;
  padding: 8px 12px; border-radius: 16px;
  transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              border-radius 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}
.mo-widget--icon-only .mo-mobile-icon {
  width: 28px; height: 28px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.mo-widget--icon-only .mo-mobile-icon svg { width: 28px; height: 28px; }
.mo-widget--icon-only .mo-mobile-progress {
  width: 42px; height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px; overflow: hidden; flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.mo-widget--icon-only .mo-mobile-progress-bar {
  height: 100%; width: 0%; background: white;
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
  transition: width 0.5s ease-out;
}
.mo-widget--icon-only .mo-widget__collapsed {
  display: block; position: relative;
  width: 100%; height: 100%; opacity: 1;
  transition: opacity 0.2s ease;
}
.mo-widget--icon-only .mo-widget__expanded { display: none; }
.mo-widget--icon-only[data-state="expanded"] .mo-widget__collapsed { display: none; }
.mo-widget--icon-only[data-state="expanded"] .mo-widget__expanded {
  display: flex; align-items: center;
  justify-content: space-between;
  width: 100%; height: 100%; gap: 8px;
}
.mo-widget--icon-only .mo-widget__expanded .mo-exp-info,
.mo-widget--icon-only .mo-widget__expanded .mo-mobile-close { visibility: hidden; }
.mo-widget--icon-only[data-state="expanded"] .mo-widget__expanded .mo-exp-info,
.mo-widget--icon-only[data-state="expanded"] .mo-widget__expanded .mo-mobile-close {
  visibility: visible; transition: visibility 0s linear 0.5s;
}
.mo-widget--icon-only .mo-exp-info {
  display: flex; align-items: center; gap: 10px;
  flex: 1; font-size: 12px; font-weight: 600;
  line-height: 1.3; min-height: 44px; max-height: 44px; overflow: hidden;
}
.mo-widget--icon-only .mo-exp-icon {
  width: 28px; height: 28px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.mo-widget--icon-only .mo-exp-icon svg { width: 28px; height: 28px; }
.mo-widget--icon-only .mo-exp-label {
  width: 200px; flex-shrink: 1; min-width: 0;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.2; align-self: center;
}
.mo-widget--icon-only .mo-exp-amount { font-weight: 700; flex-shrink: 0; white-space: nowrap; }
.mo-widget--icon-only .mo-mobile-close {
  background: rgba(255, 255, 255, 0.2); border: none;
  color: inherit; font-size: 20px; line-height: 1;
  width: 28px; height: 28px; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; padding: 0; margin: 0; flex-shrink: 0;
  transition: background 0.2s ease;
}

/* Backdrop */
.mo-widget-backdrop {
  display: none; position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: transparent; z-index: 2147482999;
}

/* Cart bounce animation */
@keyframes mo-cart-bounce {
  0%   { transform: scale(1) rotate(0deg) translateY(0); }
  10%  { transform: scale(1.05) rotate(-3deg) translateY(-2px); }
  20%  { transform: scale(1.08) rotate(3deg) translateY(-4px); }
  30%  { transform: scale(1.05) rotate(-2deg) translateY(-2px); }
  40%  { transform: scale(1.02) rotate(2deg) translateY(-1px); }
  50%  { transform: scale(1) rotate(0deg) translateY(0); }
  100% { transform: scale(1) rotate(0deg) translateY(0); }
}
@media (max-width: 768px) {
  .mo-widget--floating[data-state="collapsed"].mo-cart-shake {
    animation: mo-cart-bounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}
.mo-widget--icon-only.mo-widget--floating[data-state="collapsed"].mo-cart-shake {
  animation: mo-cart-bounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
`;
}
