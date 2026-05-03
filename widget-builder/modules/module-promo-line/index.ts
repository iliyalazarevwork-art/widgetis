import { marqueeSchema, marqueeI18nSchema, type MarqueeInput } from './schema';
import { getLanguage } from '@laxarevii/core';
import { buildCSS } from './styles';
import { isClosed, persistClosed } from './storage';
import { setPageOffset, setHeaderOffset, clearPageOffset } from './offset';
import { hasTopCollision } from './collision';
import { startAnimation } from './animation';
import { createRoot, createTrack, createCloseButton, mountRoot } from './dom';

const STYLE_ID = 'marquee-styles';
const ROOT_ATTR = 'data-marquee';

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = buildCSS(ROOT_ATTR);
  document.head.appendChild(el);
}

export default function marquee(rawConfig: MarqueeInput, rawI18n: Record<string, string[]>): (() => void) | void {
  const config = marqueeSchema.parse(rawConfig);
  const i18n = marqueeI18nSchema.parse(rawI18n);
  if (!config.enabled) { console.warn('[widgetality] marquee: ⚠️ disabled'); return; }
  if (isClosed()) { console.log('[widgetality] marquee: closed by user (TTL not expired)'); return; }
  console.log('[widgetality] marquee: ✅ activated');

  const lang = getLanguage();
  const messages = i18n[lang] ?? i18n.ua ?? i18n.ru ?? Object.values(i18n)[0];
  if (!messages) {
    throw new Error(
      `[marquee] No translations for language "${lang}". Available: ${Object.keys(i18n).join(', ')}`,
    );
  }

  injectStyles();

  const root = createRoot(config);
  const { inner, track } = createTrack(messages);
  const closeBtn = createCloseButton();

  root.appendChild(inner);
  root.appendChild(closeBtn);
  mountRoot(root, config);

  startAnimation(root, track, config.speed);

  if (config.isFixed) {
    const mode = config.mode === 'shift' && hasTopCollision(root) ? 'overlay' : config.mode;
    if (mode === 'shift') {
      const rect = root.getBoundingClientRect();
      const offset = rect.height + Math.max(0, rect.top);
      setPageOffset(offset);
      setHeaderOffset(offset);
    } else {
      clearPageOffset();
    }
  }

  if (window.matchMedia('(hover: hover) and (min-width: 769px)').matches) {
    root.addEventListener('mouseenter', () => root.classList.add('marquee--paused'));
    root.addEventListener('mouseleave', () => root.classList.remove('marquee--paused'));
  }

  closeBtn.addEventListener('click', () => {
    persistClosed(config.ttlHours);
    root.remove();
    if (config.isFixed) clearPageOffset();
  });

  return () => {
    root.remove();
    document.getElementById(STYLE_ID)?.remove();
    if (config.isFixed) clearPageOffset();
  };
}
