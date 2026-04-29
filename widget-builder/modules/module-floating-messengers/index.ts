import {
  floatingMessengersSchema,
  floatingMessengersI18nSchema,
  type FloatingMessengersConfig,
  type FloatingMessengersInput,
  type Channel,
} from './schema';
import { getLanguage } from '@laxarevii/core';
import { BUBBLE_ICON, CHANNEL_ICONS } from './icons';

const WIDGET_ID = 'wdg-fmsg';
const STYLES_ID = 'wdg-fmsg-styles';
const EXPANDED_CLASS = 'wdg-fmsg--expanded';

type I18nEntry = { greeting: string; closeLabel: string };

export default function floatingMessengers(
  rawConfig: FloatingMessengersInput,
  rawI18n: Record<string, I18nEntry>,
): (() => void) | void {
  if (typeof document === 'undefined') return;

  const config = floatingMessengersSchema.parse(rawConfig);
  const i18nMap = floatingMessengersI18nSchema.parse(rawI18n);

  const lang = getLanguage();
  const i18n: I18nEntry =
    i18nMap[lang] ?? i18nMap.ua ?? i18nMap.ru ?? Object.values(i18nMap)[0]!;

  console.log('[widgetality] floating-messengers: ✅ activated');

  if (!config.enabled) return;

  // No channels — nothing to render, but module is activated (logged above)
  if (config.channels.length === 0) return;

  let widget: HTMLElement | null = null;
  let expanded = false;
  let delayTimer: ReturnType<typeof setTimeout> | null = null;

  function buildChannelHref(channel: Channel): string {
    const val = channel.value;
    switch (channel.type) {
      case 'whatsapp':
        return `https://wa.me/${val.replace(/\D/g, '')}`;
      case 'telegram':
        return `https://t.me/${val.replace(/^@/, '')}`;
      case 'viber':
        return `viber://chat?number=${val}`;
      case 'phone':
        return `tel:${val}`;
      case 'email':
        return `mailto:${val}`;
    }
  }

  function collapse(): void {
    if (!widget || !expanded) return;
    expanded = false;
    widget.classList.remove(EXPANDED_CLASS);
  }

  function onOutsideClick(e: MouseEvent): void {
    // The bubble has its own toggle handler; ignore clicks that originate inside the widget
    if (widget && !widget.contains(e.target as Node)) {
      collapse();
      document.removeEventListener('click', onOutsideClick);
    }
  }

  function buildWidget(): HTMLElement {
    const el = document.createElement('div');
    el.id = WIDGET_ID;

    // Bubble button
    const bubble = document.createElement('button');
    bubble.className = 'wdg-fmsg__bubble';
    bubble.setAttribute('aria-label', i18n.greeting);
    bubble.setAttribute('aria-expanded', 'false');
    bubble.innerHTML = BUBBLE_ICON;
    el.appendChild(bubble);

    // Expanded card
    const card = document.createElement('div');
    card.className = 'wdg-fmsg__card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', i18n.greeting);

    const header = document.createElement('div');
    header.className = 'wdg-fmsg__header';
    header.textContent = i18n.greeting;
    card.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'wdg-fmsg__list';

    for (const channel of config.channels) {
      const li = document.createElement('li');
      li.className = 'wdg-fmsg__item';

      const link = document.createElement('a');
      link.className = `wdg-fmsg__link wdg-fmsg__link--${channel.type}`;
      link.href = buildChannelHref(channel);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      const iconWrap = document.createElement('span');
      iconWrap.className = 'wdg-fmsg__icon';
      iconWrap.innerHTML = CHANNEL_ICONS[channel.type];
      link.appendChild(iconWrap);

      if (config.showLabels) {
        const labelEl = document.createElement('span');
        labelEl.className = 'wdg-fmsg__label';
        labelEl.textContent = channel.label ?? defaultChannelLabel(channel.type);
        link.appendChild(labelEl);
      }

      li.appendChild(link);
      list.appendChild(li);
    }

    card.appendChild(list);
    el.appendChild(card);

    bubble.addEventListener('click', () => {
      if (expanded) {
        collapse();
        bubble.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', onOutsideClick);
      } else {
        expanded = true;
        el.classList.add(EXPANDED_CLASS);
        bubble.setAttribute('aria-expanded', 'true');
        document.addEventListener('click', onOutsideClick);
      }
    });

    return el;
  }

  function mount(): void {
    if (document.getElementById(WIDGET_ID)) return;
    injectStyles(config);
    widget = buildWidget();
    document.body.appendChild(widget);
  }

  delayTimer = setTimeout(mount, config.delaySec * 1000);

  return () => {
    if (delayTimer !== null) clearTimeout(delayTimer);
    document.removeEventListener('click', onOutsideClick);
    document.getElementById(WIDGET_ID)?.remove();
    document.getElementById(STYLES_ID)?.remove();
    widget = null;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultChannelLabel(type: Channel['type']): string {
  switch (type) {
    case 'whatsapp':
      return 'WhatsApp';
    case 'telegram':
      return 'Telegram';
    case 'viber':
      return 'Viber';
    case 'phone':
      return 'Телефон';
    case 'email':
      return 'Email';
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function injectStyles(config: FloatingMessengersConfig): void {
  if (document.getElementById(STYLES_ID)) return;

  const isLeft = config.position === 'bottom-left';
  const sideKey = isLeft ? 'left' : 'right';
  const cardAlign = isLeft ? 'left' : 'right';

  const el = document.createElement('style');
  el.id = STYLES_ID;
  el.textContent = `
#${WIDGET_ID} {
  --fmsg-bubble: ${config.bubbleColor};
  --fmsg-bubble-icon: ${config.bubbleIconColor};
  --fmsg-bg: ${config.expandedBackground};
  --fmsg-fg: ${config.expandedTextColor};
  --fmsg-border: ${config.borderColor};
  --fmsg-radius: ${config.borderRadius}px;
  position: fixed;
  bottom: ${config.bottomOffsetMobile}px;
  ${sideKey}: ${config.sideOffset}px;
  z-index: ${config.zIndex};
  display: flex;
  flex-direction: column;
  align-items: ${isLeft ? 'flex-start' : 'flex-end'};
  gap: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  /*
   * Корневой контейнер физически перекрывает квадрат под раскрытую
   * карточку (90vw / max-width 280px). Без pointer-events: none он
   * захватывает клики по основному контенту даже когда карточка свёрнута.
   * Снимаем перехват с root и возвращаем его только на интерактивных детях.
   */
  pointer-events: none;
}
#${WIDGET_ID} .wdg-fmsg__bubble,
#${WIDGET_ID}.${EXPANDED_CLASS} .wdg-fmsg__card,
#${WIDGET_ID}.${EXPANDED_CLASS} .wdg-fmsg__link {
  pointer-events: auto;
}
.wdg-fmsg__bubble {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--fmsg-bubble);
  color: var(--fmsg-bubble-icon);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 4px 20px rgba(0,0,0,.22);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.18s ease, opacity 0.18s ease;
  flex-shrink: 0;
  order: 2;
}
.wdg-fmsg__bubble:active { transform: scale(0.93); opacity: 0.85; }
.wdg-fmsg__bubble svg { width: 26px; height: 26px; }
.wdg-fmsg__card {
  background: var(--fmsg-bg);
  border: 1px solid var(--fmsg-border);
  border-radius: var(--fmsg-radius);
  box-shadow: 0 8px 32px rgba(0,0,0,.15);
  padding: 16px;
  width: 90vw;
  max-width: 280px;
  color: var(--fmsg-fg);
  transform-origin: bottom ${cardAlign};
  transform: scale(0.85) translateY(8px);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.2s ease, opacity 0.2s ease;
  order: 1;
}
#${WIDGET_ID}.${EXPANDED_CLASS} .wdg-fmsg__card {
  transform: scale(1) translateY(0);
  opacity: 1;
  pointer-events: auto;
}
.wdg-fmsg__header {
  font-size: 13px;
  font-weight: 600;
  color: var(--fmsg-fg);
  margin-bottom: 12px;
  letter-spacing: .01em;
}
.wdg-fmsg__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.wdg-fmsg__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: calc(var(--fmsg-radius) - 4px);
  text-decoration: none;
  color: var(--fmsg-fg);
  font-size: 14px;
  font-weight: 500;
  transition: background 0.14s;
  -webkit-tap-highlight-color: transparent;
}
.wdg-fmsg__link:hover { background: rgba(0,0,0,.05); }
.wdg-fmsg__icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0,0,0,.07);
  color: var(--fmsg-fg);
}
.wdg-fmsg__icon svg { width: 18px; height: 18px; }
.wdg-fmsg__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Pulse animation */
${config.pulseAnimation ? `
@keyframes wdg-fmsg-pulse {
  0% { transform: scale(1); opacity: 0.6; }
  70% { transform: scale(1.55); opacity: 0; }
  100% { transform: scale(1.55); opacity: 0; }
}
@media (prefers-reduced-motion: no-preference) {
  .wdg-fmsg__bubble::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: var(--fmsg-bubble);
    animation: wdg-fmsg-pulse 2.4s ease-out infinite;
  }
  .wdg-fmsg__bubble { position: relative; }
}
` : ''}

/* Desktop: bigger offsets, smaller bubble */
@media (min-width: 641px) {
  #${WIDGET_ID} {
    bottom: ${config.bottomOffsetDesktop}px;
  }
  .wdg-fmsg__bubble {
    width: 56px;
    height: 56px;
  }
  .wdg-fmsg__bubble svg { width: 24px; height: 24px; }
  .wdg-fmsg__card { max-width: 300px; width: auto; min-width: 220px; }
}
`;
  document.head.appendChild(el);
}
