import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import stickyBuyButton from './index';

vi.mock('@laxarevii/core', () => ({ getLanguage: () => 'ua' }));

const WIDGET_ID = 'wdg-sticky-buy';
const HIDDEN = 'wdg-sbuy--hidden';

const config = {
  enabled: true,
  buttonSelector: '.buy-btn',
  mobileBreakpoint: 768,
  backgroundColor: '#000',
  textColor: '#fff',
  borderRadius: '4px',
  zIndex: 9999,
  bottomOffset: 0,
  safeAreaPadding: false,
};

const i18n = { ua: { buttonText: 'Замовити' } };

function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
}

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
}

function addBuyButton(): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'buy-btn';
  btn.textContent = 'Купити';
  document.body.appendChild(btn);
  return btn;
}

describe('stickyBuyButton', () => {
  beforeEach(() => {
    setViewport(375);
    setScrollY(0);
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('монтирует панель и скрывает её при инициализации (scrollY = 0)', () => {
    addBuyButton();

    const cleanup = stickyBuyButton(config, i18n);

    const bar = document.getElementById(WIDGET_ID);
    expect(bar).not.toBeNull();
    expect(bar!.classList.contains(HIDDEN)).toBe(true);

    cleanup?.();
  });

  it('не показывает панель при scrollY <= 300', () => {
    addBuyButton();

    const cleanup = stickyBuyButton(config, i18n);
    const bar = document.getElementById(WIDGET_ID)!;

    setScrollY(100);
    window.dispatchEvent(new Event('scroll'));
    expect(bar.classList.contains(HIDDEN)).toBe(true);

    setScrollY(300);
    window.dispatchEvent(new Event('scroll'));
    expect(bar.classList.contains(HIDDEN)).toBe(true);

    cleanup?.();
  });

  it('показывает панель при scrollY > 300', () => {
    addBuyButton();

    const cleanup = stickyBuyButton(config, i18n);
    const bar = document.getElementById(WIDGET_ID)!;

    setScrollY(301);
    window.dispatchEvent(new Event('scroll'));
    expect(bar.classList.contains(HIDDEN)).toBe(false);

    setScrollY(1000);
    window.dispatchEvent(new Event('scroll'));
    expect(bar.classList.contains(HIDDEN)).toBe(false);

    cleanup?.();
  });

  it('скрывает панель когда пользователь скролит обратно вверх (<= 300)', () => {
    addBuyButton();

    const cleanup = stickyBuyButton(config, i18n);
    const bar = document.getElementById(WIDGET_ID)!;

    setScrollY(500);
    window.dispatchEvent(new Event('scroll'));
    expect(bar.classList.contains(HIDDEN)).toBe(false);

    setScrollY(200);
    window.dispatchEvent(new Event('scroll'));
    expect(bar.classList.contains(HIDDEN)).toBe(true);

    cleanup?.();
  });

  it('не монтирует панель на десктопе (> mobileBreakpoint)', () => {
    setViewport(1024);
    addBuyButton();

    const cleanup = stickyBuyButton(config, i18n);

    expect(document.getElementById(WIDGET_ID)).toBeNull();

    cleanup?.();
  });

  it('не монтирует панель если config.enabled = false', () => {
    addBuyButton();

    const result = stickyBuyButton({ ...config, enabled: false }, i18n);

    expect(document.getElementById(WIDGET_ID)).toBeNull();
    expect(result).toBeUndefined();
  });

  it('cleanup удаляет панель и стили из DOM', () => {
    addBuyButton();

    const cleanup = stickyBuyButton(config, i18n)!;

    setScrollY(400);
    window.dispatchEvent(new Event('scroll'));

    expect(document.getElementById(WIDGET_ID)).not.toBeNull();

    cleanup();

    expect(document.getElementById(WIDGET_ID)).toBeNull();
    expect(document.getElementById('wdg-sticky-buy-styles')).toBeNull();
  });

  it('кнопка в панели кликает оригинальную кнопку', () => {
    const btn = addBuyButton();
    const clickSpy = vi.spyOn(btn, 'click');

    const cleanup = stickyBuyButton(config, i18n);

    setScrollY(400);
    window.dispatchEvent(new Event('scroll'));

    const stickyBtn = document.querySelector<HTMLButtonElement>('.wdg-sbuy__btn')!;
    stickyBtn.click();

    expect(clickSpy).toHaveBeenCalledOnce();

    cleanup?.();
  });
});
