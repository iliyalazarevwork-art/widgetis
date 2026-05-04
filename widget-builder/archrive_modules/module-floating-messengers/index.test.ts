import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import floatingMessengers from './index';
import { getDefaultConfig, getDefaultI18n } from './schema';

vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
}));

const WIDGET_ID = 'wdg-fmsg';
const EXPANDED_CLASS = 'wdg-fmsg--expanded';

const configWithChannels = {
  ...getDefaultConfig(),
  channels: [
    { type: 'whatsapp' as const, value: '+380991234567' },
    { type: 'telegram' as const, value: '@myshop' },
    { type: 'email' as const, value: 'hello@shop.ua' },
  ],
  delaySec: 0,
};

describe('floatingMessengers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('логирует активацию и не монтирует виджет если enabled=false', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = floatingMessengers({ ...configWithChannels, enabled: false }, getDefaultI18n());
    vi.runAllTimers();

    expect(consoleSpy).toHaveBeenCalledWith('[widgetality] floating-messengers: ✅ activated');
    expect(document.getElementById(WIDGET_ID)).toBeNull();
    expect(result).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('логирует активацию и не монтирует виджет если channels пустой', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = floatingMessengers(getDefaultConfig(), getDefaultI18n());
    vi.runAllTimers();

    expect(consoleSpy).toHaveBeenCalledWith('[widgetality] floating-messengers: ✅ activated');
    expect(document.getElementById(WIDGET_ID)).toBeNull();
    expect(result).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('монтирует виджет после delaySec', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const cleanup = floatingMessengers(configWithChannels, getDefaultI18n());

    // Before delay — not mounted yet
    expect(document.getElementById(WIDGET_ID)).toBeNull();

    vi.runAllTimers();

    // After delay — mounted
    expect(document.getElementById(WIDGET_ID)).not.toBeNull();

    cleanup?.();
  });

  it('пузырь разворачивает карточку по клику', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const cleanup = floatingMessengers(configWithChannels, getDefaultI18n());
    vi.runAllTimers();

    const widget = document.getElementById(WIDGET_ID)!;
    const bubble = widget.querySelector<HTMLButtonElement>('.wdg-fmsg__bubble')!;

    expect(widget.classList.contains(EXPANDED_CLASS)).toBe(false);
    expect(bubble.getAttribute('aria-expanded')).toBe('false');

    bubble.click();
    expect(widget.classList.contains(EXPANDED_CLASS)).toBe(true);
    expect(bubble.getAttribute('aria-expanded')).toBe('true');

    cleanup?.();
  });

  it('повторный клик на пузырь сворачивает карточку', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const cleanup = floatingMessengers(configWithChannels, getDefaultI18n());
    vi.runAllTimers();

    const widget = document.getElementById(WIDGET_ID)!;
    const bubble = widget.querySelector<HTMLButtonElement>('.wdg-fmsg__bubble')!;

    bubble.click();
    expect(widget.classList.contains(EXPANDED_CLASS)).toBe(true);

    bubble.click();
    expect(widget.classList.contains(EXPANDED_CLASS)).toBe(false);
    expect(bubble.getAttribute('aria-expanded')).toBe('false');

    cleanup?.();
  });

  it('строит корректные href для каждого типа канала', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const cleanup = floatingMessengers(configWithChannels, getDefaultI18n());
    vi.runAllTimers();

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.wdg-fmsg__link'));
    const hrefs = links.map((a) => a.href);

    // whatsapp: digits only
    expect(hrefs.find((h) => h.includes('wa.me'))).toBe('https://wa.me/380991234567');
    // telegram: strip @
    expect(hrefs.find((h) => h.includes('t.me'))).toBe('https://t.me/myshop');
    // email
    expect(hrefs.find((h) => h.includes('mailto'))).toBe('mailto:hello@shop.ua');

    cleanup?.();
  });

  it('cleanup удаляет виджет и стили из DOM', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const cleanup = floatingMessengers(configWithChannels, getDefaultI18n())!;
    vi.runAllTimers();

    expect(document.getElementById(WIDGET_ID)).not.toBeNull();

    cleanup();
    expect(document.getElementById(WIDGET_ID)).toBeNull();
    expect(document.getElementById('wdg-fmsg-styles')).toBeNull();
  });

  it('клик вне виджета сворачивает карточку', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const cleanup = floatingMessengers(configWithChannels, getDefaultI18n());
    vi.runAllTimers();

    const widget = document.getElementById(WIDGET_ID)!;
    const bubble = widget.querySelector<HTMLButtonElement>('.wdg-fmsg__bubble')!;

    bubble.click();
    expect(widget.classList.contains(EXPANDED_CLASS)).toBe(true);

    // Click outside — dispatch on document (JSDOM doesn't always bubble body → document)
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(widget.classList.contains(EXPANDED_CLASS)).toBe(false);

    cleanup?.();
  });

  it('отображает labels каналов при showLabels=true', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const cleanup = floatingMessengers({ ...configWithChannels, showLabels: true }, getDefaultI18n());
    vi.runAllTimers();

    const labels = Array.from(document.querySelectorAll('.wdg-fmsg__label')).map((el) => el.textContent);
    expect(labels).toContain('WhatsApp');
    expect(labels).toContain('Telegram');
    expect(labels).toContain('Email');

    cleanup?.();
  });

  it('не отображает labels при showLabels=false', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const cleanup = floatingMessengers({ ...configWithChannels, showLabels: false }, getDefaultI18n());
    vi.runAllTimers();

    expect(document.querySelector('.wdg-fmsg__label')).toBeNull();

    cleanup?.();
  });
});
