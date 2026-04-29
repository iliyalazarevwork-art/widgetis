import { trustBadgesSchema, trustBadgesI18nSchema, type TrustBadgesConfig, type TrustBadgesInput } from './schema';
import { getLanguage } from '@laxarevii/core';
import { ICONS } from './icons';

const ROOT_CLASS = 'wdg-trust';
const STYLES_ID = 'wdg-trust-styles';

type I18nEntry = { titles: Record<string, string> };

export default function trustBadges(
  rawConfig: TrustBadgesInput,
  rawI18n: Record<string, I18nEntry>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = trustBadgesSchema.parse(rawConfig);
  const i18nMap = trustBadgesI18nSchema.parse(rawI18n);

  if (!config.enabled) {
    console.warn('[widgetality] trust-badges: ⚠️ disabled');
    return;
  }

  if (config.badges.length === 0 || config.selectors.length === 0) {
    console.warn('[widgetality] trust-badges: ⚠️ no badges/selectors configured');
    return;
  }

  const lang = getLanguage();
  const i18n = i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  console.log('[widgetality] trust-badges: ✅ activated');

  injectStyles(config);

  const elements: HTMLElement[] = [];
  let mounted = false;

  function mount(): void {
    if (mounted) return;
    for (const { selector, insert } of config.selectors) {
      const ref = document.querySelector(selector);
      if (!ref || !ref.isConnected) continue;
      const strip = buildStrip(config, i18n);
      try {
        ref.insertAdjacentElement(insert === 'before' ? 'beforebegin' : 'afterend', strip);
        elements.push(strip);
        mounted = true;
        return;
      } catch {
        // try next
      }
    }
  }

  mount();

  // SPA-friendly: пробуем замаунтить если DOM ещё не готов
  let retryTimer: number | null = null;
  if (!mounted) {
    let attempts = 0;
    const tick = (): void => {
      attempts++;
      mount();
      if (!mounted && attempts < 12) {
        retryTimer = window.setTimeout(tick, 600);
      }
    };
    retryTimer = window.setTimeout(tick, 400);
  }

  return () => {
    if (retryTimer !== null) clearTimeout(retryTimer);
    for (const el of elements) el.remove();
    document.getElementById(STYLES_ID)?.remove();
  };
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function buildStrip(config: TrustBadgesConfig, i18n: I18nEntry): HTMLElement {
  const strip = document.createElement('div');
  strip.className = `${ROOT_CLASS} ${ROOT_CLASS}--${config.layout}`;

  for (const badge of config.badges) {
    const titleKey = badge.i18nKey ?? badge.icon;
    const title = i18n.titles[titleKey] ?? titleKey;
    const item = document.createElement('div');
    item.className = `${ROOT_CLASS}__item`;
    item.innerHTML = `
      <span class="${ROOT_CLASS}__icon">${ICONS[badge.icon] ?? ICONS.shield}</span>
      <span class="${ROOT_CLASS}__title">${escapeHtml(title)}</span>
    `;
    strip.appendChild(item);
  }

  return strip;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function injectStyles(config: TrustBadgesConfig): void {
  if (document.getElementById(STYLES_ID)) return;
  const el = document.createElement('style');
  el.id = STYLES_ID;
  el.textContent = `
.${ROOT_CLASS} {
  --tb-bg: ${config.backgroundColor};
  --tb-fg: ${config.textColor};
  --tb-icon: ${config.iconColor};
  --tb-border: ${config.borderColor};
  --tb-radius: ${config.borderRadius}px;
  display: grid;
  gap: 8px;
  margin: 14px 0;
  padding: ${config.showBorder ? '14px' : '0'};
  background: var(--tb-bg);
  color: var(--tb-fg);
  border: ${config.showBorder ? '1px solid var(--tb-border)' : 'none'};
  border-radius: var(--tb-radius);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.${ROOT_CLASS}--grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.${ROOT_CLASS}--row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px 8px;
}
.${ROOT_CLASS}__item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.${ROOT_CLASS}__icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center; justify-content: center;
  width: 26px; height: 26px;
  color: var(--tb-icon);
}
.${ROOT_CLASS}__icon svg { width: 22px; height: 22px; }
.${ROOT_CLASS}__title {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: .005em;
  color: var(--tb-fg);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mobile-first: 2 в ряд, чуть плотнее */
@media (max-width: 480px) {
  .${ROOT_CLASS} { gap: 6px 10px; padding: ${config.showBorder ? '12px' : '0'}; }
  .${ROOT_CLASS}--grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .${ROOT_CLASS}__icon { width: 22px; height: 22px; }
  .${ROOT_CLASS}__icon svg { width: 18px; height: 18px; }
  .${ROOT_CLASS}__title { font-size: 12px; }
}
@media (min-width: 769px) {
  .${ROOT_CLASS}--grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
`;
  document.head.appendChild(el);
}
