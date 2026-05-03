import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import exitIntentPopup from './index';
import { getDefaultI18n } from './schema';

vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
}));

const ROOT = '#wdg-exit-intent';

const baseConfig = {
  enabled: true,
  cooldownHours: 24,
  minTimeOnPageSec: 0,
  promoCode: 'SAVE10',
  collectEmail: true,
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  accentColor: '#7c3aed',
  accentTextColor: '#ffffff',
  zIndex: 99999,
  imageUrl: '',
  hideOnUtmSources: [],
};

const i18n = getDefaultI18n();

function fireMouseLeave(): void {
  const ev = new MouseEvent('mouseleave', { bubbles: true });
  Object.defineProperty(ev, 'clientY', { value: -5 });
  Object.defineProperty(ev, 'relatedTarget', { value: null });
  document.dispatchEvent(ev);
}

describe('exitIntentPopup', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('активируется и не показывает попап до мин. времени на странице', () => {
    const cleanup = exitIntentPopup({ ...baseConfig, minTimeOnPageSec: 5 }, i18n);
    fireMouseLeave();
    expect(document.querySelector(ROOT)).toBeNull();
    cleanup?.();
  });

  it('показывает попап на mouseleave после мин. времени', () => {
    const cleanup = exitIntentPopup({ ...baseConfig, minTimeOnPageSec: 1 }, i18n);
    vi.advanceTimersByTime(1100);
    fireMouseLeave();
    expect(document.querySelector(ROOT)).not.toBeNull();
    cleanup?.();
  });

  it('не активируется при enabled=false', () => {
    const result = exitIntentPopup({ ...baseConfig, enabled: false }, i18n);
    expect(result).toBeUndefined();
  });

  it('cooldown подавляет показ если попап показывался недавно', () => {
    window.localStorage.setItem('wty_exit_intent_seen_at', String(Date.now()));
    const result = exitIntentPopup(baseConfig, i18n);
    expect(result).toBeUndefined();
  });

  it('закрытие по крестику убирает попап', () => {
    const cleanup = exitIntentPopup({ ...baseConfig, minTimeOnPageSec: 0 }, i18n);
    fireMouseLeave();
    const close = document.querySelector<HTMLButtonElement>('.wdg-eip__close')!;
    close.click();
    vi.advanceTimersByTime(300);
    expect(document.querySelector(ROOT)).toBeNull();
    cleanup?.();
  });

  it('cleanup удаляет попап и стили', () => {
    const cleanup = exitIntentPopup({ ...baseConfig, minTimeOnPageSec: 0 }, i18n)!;
    fireMouseLeave();
    expect(document.querySelector(ROOT)).not.toBeNull();
    cleanup();
    expect(document.querySelector(ROOT)).toBeNull();
    expect(document.getElementById('wdg-exit-intent-styles')).toBeNull();
  });

  it('CTA сохраняет email в localStorage', () => {
    const cleanup = exitIntentPopup({ ...baseConfig, minTimeOnPageSec: 0 }, i18n);
    fireMouseLeave();
    const input = document.querySelector<HTMLInputElement>('.wdg-eip__email')!;
    input.value = 'test@example.com';
    document.querySelector<HTMLButtonElement>('.wdg-eip__cta')!.click();
    expect(window.localStorage.getItem('wty_exit_intent_email')).toBe('test@example.com');
    cleanup?.();
  });

  it('UTM-источник из hideOnUtmSources блокирует показ', () => {
    const url = new URL('http://localhost/?utm_source=facebook');
    Object.defineProperty(window, 'location', { value: url, configurable: true });
    const result = exitIntentPopup({ ...baseConfig, hideOnUtmSources: ['facebook'] }, i18n);
    expect(result).toBeUndefined();
  });
});
