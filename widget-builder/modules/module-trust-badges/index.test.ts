import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import trustBadges from './index';
import { getDefaultConfig, getDefaultI18n } from './schema';

vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
}));

describe('trustBadges', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('монтирует полосу значков под якорным селектором', () => {
    const ref = document.createElement('button');
    ref.className = 'j-buy-button-add';
    document.body.appendChild(ref);

    const cleanup = trustBadges(getDefaultConfig(), getDefaultI18n());

    expect(document.querySelector('.wdg-trust')).not.toBeNull();
    expect(document.querySelectorAll('.wdg-trust__item').length).toBe(4);
    cleanup?.();
  });

  it('не монтирует если enabled=false', () => {
    const ref = document.createElement('button');
    ref.className = 'j-buy-button-add';
    document.body.appendChild(ref);

    const result = trustBadges({ ...getDefaultConfig(), enabled: false }, getDefaultI18n());
    expect(document.querySelector('.wdg-trust')).toBeNull();
    expect(result).toBeUndefined();
  });

  it('падёт мягко (без исключений) если ни один селектор не найден', () => {
    vi.useFakeTimers();
    const cleanup = trustBadges(getDefaultConfig(), getDefaultI18n());
    expect(document.querySelector('.wdg-trust')).toBeNull();
    cleanup?.();
  });

  it('cleanup удаляет полосу и стили', () => {
    const ref = document.createElement('button');
    ref.className = 'j-buy-button-add';
    document.body.appendChild(ref);

    const cleanup = trustBadges(getDefaultConfig(), getDefaultI18n())!;
    expect(document.querySelector('.wdg-trust')).not.toBeNull();
    cleanup();
    expect(document.querySelector('.wdg-trust')).toBeNull();
    expect(document.getElementById('wdg-trust-styles')).toBeNull();
  });

  it('использует кастомные иконки и переводы', () => {
    const ref = document.createElement('button');
    ref.className = 'j-buy-button-add';
    document.body.appendChild(ref);

    const config = {
      ...getDefaultConfig(),
      badges: [{ icon: 'guarantee' as const }, { icon: 'support' as const }],
    };
    const cleanup = trustBadges(config, getDefaultI18n());
    const titles = Array.from(document.querySelectorAll('.wdg-trust__title')).map((e) => e.textContent);
    expect(titles).toContain('Офіційна гарантія');
    expect(titles).toContain('Підтримка 24/7');
    cleanup?.();
  });
});
