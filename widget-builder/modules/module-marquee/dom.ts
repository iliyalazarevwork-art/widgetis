import type { MarqueeConfig } from './schema';
import { DEFAULT_COLORS } from './styles';
import { TRACK_COPIES } from './animation';

const CONTENT_REPEAT = 20;

export function createRoot(config: MarqueeConfig): HTMLElement {
  const root = document.createElement('div');
  root.setAttribute('data-marquee', config.isFixed ? 'fixed' : 'true');
  root.setAttribute('role', 'status');
  root.style.zIndex = String(config.zIndex);
  root.style.height = `${config.height}px`;
  root.style.borderBottom = `1px solid ${DEFAULT_COLORS.border}`;

  const desktop = config.colors?.desktop;
  const mobile = config.colors?.mobile;

  if (desktop?.backgroundColor) root.style.setProperty('--marquee-bg', desktop.backgroundColor);
  if (desktop?.textColor) root.style.setProperty('--marquee-text', desktop.textColor);
  root.style.setProperty(
    '--marquee-bg-mobile',
    mobile?.backgroundColor || desktop?.backgroundColor || DEFAULT_COLORS.bg,
  );
  root.style.setProperty(
    '--marquee-text-mobile',
    mobile?.textColor || desktop?.textColor || DEFAULT_COLORS.text,
  );

  return root;
}

export function createTrack(messages: string[]): { inner: HTMLElement; track: HTMLElement } {
  const inner = document.createElement('div');
  inner.className = 'marquee__inner';

  const track = document.createElement('div');
  track.className = 'marquee__track';

  for (let s = 0; s < TRACK_COPIES; s++) {
    const segment = document.createElement('div');
    segment.className = 'marquee__content';

    for (let r = 0; r < CONTENT_REPEAT; r++) {
      for (const text of messages) {
        const item = document.createElement('span');
        item.className = 'marquee__item';
        item.textContent = text;
        segment.appendChild(item);
      }
    }

    track.appendChild(segment);
  }

  inner.appendChild(track);
  return { inner, track };
}

export function createCloseButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'marquee__close';
  btn.setAttribute('aria-label', 'Close');
  btn.textContent = '×';
  return btn;
}

export function mountRoot(root: HTMLElement, config: MarqueeConfig): void {
  const mountSelector = config.mount?.selector?.trim();
  if (!mountSelector) {
    document.body.prepend(root);
    return;
  }

  const target = document.querySelector<HTMLElement>(mountSelector);
  if (!target || !target.parentElement) {
    document.body.prepend(root);
    return;
  }

  if (target === document.body) {
    if (config.mount?.insert === 'after') {
      document.body.append(root);
      return;
    }
    document.body.prepend(root);
    return;
  }

  if (config.mount?.insert === 'after') {
    target.insertAdjacentElement('afterend', root);
    return;
  }

  target.insertAdjacentElement('beforebegin', root);
}
