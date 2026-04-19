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

function addBuyButton(rectOverride?: Partial<DOMRect>): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'buy-btn';
  btn.textContent = 'Купити';
  document.body.appendChild(btn);

  if (rectOverride) {
    vi.spyOn(btn, 'getBoundingClientRect').mockReturnValue({
      top: 0, bottom: 50, left: 0, right: 100, width: 100, height: 50, x: 0, y: 0,
      toJSON: () => ({}),
      ...rectOverride,
    } as DOMRect);
  }

  return btn;
}

type IoMock = {
  callback: IntersectionObserverCallback | null;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

function mockIntersectionObserver(): IoMock {
  const mock: IoMock = { callback: null, observe: vi.fn(), disconnect: vi.fn() };
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn((cb: IntersectionObserverCallback) => {
      mock.callback = cb;
      return mock;
    }),
  );
  return mock;
}

function fireIo(
  mock: IoMock,
  target: Element,
  isIntersecting: boolean,
  rectTop: number,
) {
  if (!mock.callback) return;
  vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
    top: rectTop, bottom: rectTop + 50, left: 0, right: 100, width: 100, height: 50, x: 0, y: rectTop,
    toJSON: () => ({}),
  } as DOMRect);
  mock.callback(
    [{ isIntersecting, target, boundingClientRect: target.getBoundingClientRect() } as IntersectionObserverEntry],
    mock as unknown as IntersectionObserver,
  );
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

  it('монтирует панель и скрывает её при инициализации', () => {
    mockIntersectionObserver();
    addBuyButton();

    const cleanup = stickyBuyButton(config, i18n);

    const bar = document.getElementById(WIDGET_ID);
    expect(bar).not.toBeNull();
    expect(bar!.classList.contains(HIDDEN)).toBe(true);

    cleanup?.();
  });

  it('не показывает панель при скроле < 300px', () => {
    const io = mockIntersectionObserver();
    const btn = addBuyButton({ top: -10 });

    const cleanup = stickyBuyButton(config, i18n);
    const bar = document.getElementById(WIDGET_ID)!;

    setScrollY(100);
    window.dispatchEvent(new Event('scroll'));

    // IO fires: button out of view above — but hasScrolled still false
    fireIo(io, btn, false, -10);

    expect(bar.classList.contains(HIDDEN)).toBe(true);

    cleanup?.();
  });

  it('показывает панель сразу при скроле > 300px если кнопка уже выше вьюпорта', () => {
    const io = mockIntersectionObserver();

    // Button is above viewport when scroll happens
    addBuyButton({ top: -200, bottom: -150 });

    const cleanup = stickyBuyButton(config, i18n);
    const bar = document.getElementById(WIDGET_ID)!;
    expect(bar.classList.contains(HIDDEN)).toBe(true);

    setScrollY(400);
    window.dispatchEvent(new Event('scroll'));

    // Bar must be visible immediately — no need to wait for IO
    expect(bar.classList.contains(HIDDEN)).toBe(false);

    cleanup?.();
  });

  it('не показывает панель при скроле > 300px если кнопка ещё видна', () => {
    const io = mockIntersectionObserver();

    // Button is still in viewport (top > 0)
    addBuyButton({ top: 100, bottom: 150 });

    const cleanup = stickyBuyButton(config, i18n);
    const bar = document.getElementById(WIDGET_ID)!;

    setScrollY(400);
    window.dispatchEvent(new Event('scroll'));

    expect(bar.classList.contains(HIDDEN)).toBe(true);

    // IO also confirms: button visible → hide
    const btn = document.querySelector('.buy-btn')!;
    fireIo(io, btn, true, 100);
    expect(bar.classList.contains(HIDDEN)).toBe(true);

    cleanup?.();
  });

  it('скрывает панель когда пользователь скролит обратно к кнопке', () => {
    const io = mockIntersectionObserver();
    const btn = addBuyButton({ top: -200, bottom: -150 });

    const cleanup = stickyBuyButton(config, i18n);
    const bar = document.getElementById(WIDGET_ID)!;

    setScrollY(400);
    window.dispatchEvent(new Event('scroll'));

    // Bar is now visible
    expect(bar.classList.contains(HIDDEN)).toBe(false);

    // User scrolls back — button enters viewport
    fireIo(io, btn, true, 50);
    expect(bar.classList.contains(HIDDEN)).toBe(true);

    cleanup?.();
  });

  it('не монтирует панель на десктопе (> mobileBreakpoint)', () => {
    mockIntersectionObserver();
    setViewport(1024);
    addBuyButton();

    const cleanup = stickyBuyButton(config, i18n);

    expect(document.getElementById(WIDGET_ID)).toBeNull();

    cleanup?.();
  });

  it('не монтирует панель если config.enabled = false', () => {
    mockIntersectionObserver();
    addBuyButton();

    const result = stickyBuyButton({ ...config, enabled: false }, i18n);

    expect(document.getElementById(WIDGET_ID)).toBeNull();
    expect(result).toBeUndefined();
  });

  it('cleanup удаляет панель и стили из DOM', () => {
    mockIntersectionObserver();
    addBuyButton({ top: -200, bottom: -150 });

    const cleanup = stickyBuyButton(config, i18n)!;

    setScrollY(400);
    window.dispatchEvent(new Event('scroll'));

    expect(document.getElementById(WIDGET_ID)).not.toBeNull();

    cleanup();

    expect(document.getElementById(WIDGET_ID)).toBeNull();
    expect(document.getElementById('wdg-sticky-buy-styles')).toBeNull();
  });

  it('кнопка в панели кликает оригинальную кнопку', () => {
    mockIntersectionObserver();
    const btn = addBuyButton({ top: -200, bottom: -150 });
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
