import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import prizeBanner from './index';
import { getDefaultConfig, getDefaultI18n } from './schema';

vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
}));

const HOST = '#wdg-prize-banner-host';

function setActivePrize(prize: object): void {
  window.localStorage.setItem('wty_active_prize', JSON.stringify(prize));
}

function getShadow(): ShadowRoot {
  const host = document.querySelector<HTMLElement>(HOST)!;
  return host.shadowRoot!;
}

describe('prizeBanner', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('не монтируется если в localStorage нет приза', () => {
    const cleanup = prizeBanner(getDefaultConfig(), getDefaultI18n());
    expect(document.querySelector(HOST)).toBeNull();
    cleanup?.();
  });

  it('не монтируется если enabled=false', () => {
    setActivePrize({ code: 'X', label: 'Y', awardedAt: Date.now() });
    const result = prizeBanner({ ...getDefaultConfig(), enabled: false }, getDefaultI18n());
    expect(document.querySelector(HOST)).toBeNull();
    expect(result).toBeUndefined();
  });

  it('монтируется и показывает код приза в shadow root', () => {
    setActivePrize({ code: 'FREESHIP', label: 'Безкоштовна доставка', awardedAt: Date.now() });
    const cleanup = prizeBanner(getDefaultConfig(), getDefaultI18n());
    expect(document.querySelector(HOST)).not.toBeNull();
    const shadow = getShadow();
    expect(shadow.querySelector('.pb__code')?.textContent).toBe('FREESHIP');
    expect(shadow.querySelector('.pb__text')?.textContent).toContain('Безкоштовна доставка');
    cleanup?.();
  });

  it('игнорирует просроченный приз и удаляет его из localStorage', () => {
    setActivePrize({
      code: 'OLD',
      label: 'Стара знижка',
      awardedAt: Date.now() - 10 * 86_400_000,
      expiresAt: Date.now() - 1000,
    });
    const cleanup = prizeBanner(getDefaultConfig(), getDefaultI18n());
    expect(document.querySelector(HOST)).toBeNull();
    expect(window.localStorage.getItem('wty_active_prize')).toBeNull();
    cleanup?.();
  });

  it('игнорирует приз без кода (Try-again)', () => {
    setActivePrize({ code: '', label: 'Спробуйте ще', awardedAt: Date.now() });
    const cleanup = prizeBanner(getDefaultConfig(), getDefaultI18n());
    expect(document.querySelector(HOST)).toBeNull();
    cleanup?.();
  });

  it('cleanup убирает плашку из DOM', () => {
    setActivePrize({ code: 'A', label: 'B', awardedAt: Date.now() });
    const cleanup = prizeBanner(getDefaultConfig(), getDefaultI18n())!;
    expect(document.querySelector(HOST)).not.toBeNull();
    cleanup();
    expect(document.querySelector(HOST)).toBeNull();
  });

  it('закрытие пишет sessionStorage и при повторной активации не показывается', () => {
    setActivePrize({ code: 'A', label: 'B', awardedAt: Date.now() });
    const cleanup1 = prizeBanner(getDefaultConfig(), getDefaultI18n());
    const closeBtn = getShadow().querySelector<HTMLButtonElement>('.pb__close')!;
    closeBtn.click();
    cleanup1?.();

    const cleanup2 = prizeBanner(getDefaultConfig(), getDefaultI18n());
    expect(document.querySelector(HOST)).toBeNull();
    cleanup2?.();
  });

  it('hideOnCheckout прячет плашку на /checkout', () => {
    setActivePrize({ code: 'A', label: 'B', awardedAt: Date.now() });
    Object.defineProperty(window, 'location', {
      value: new URL('http://localhost/checkout/'),
      configurable: true,
    });
    const cleanup = prizeBanner(
      { ...getDefaultConfig(), hideOnCheckout: true },
      getDefaultI18n(),
    );
    expect(document.querySelector(HOST)).toBeNull();
    cleanup?.();
  });

  it('стили в shadow root, а не в document.head', () => {
    setActivePrize({ code: 'A', label: 'B', awardedAt: Date.now() });
    const cleanup = prizeBanner(getDefaultConfig(), getDefaultI18n());
    expect(document.head.querySelector('style')).toBeNull();
    expect(getShadow().querySelectorAll('style').length).toBeGreaterThan(0);
    cleanup?.();
  });
});
