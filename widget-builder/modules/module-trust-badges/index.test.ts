import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import trustBadges from './index';
import { getDefaultConfig, getDefaultI18n } from './schema';

vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
  isHoroshopProductPage: vi.fn(() => true),
}));

import { isHoroshopProductPage } from '@laxarevii/core';

describe('trustBadges', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    vi.mocked(isHoroshopProductPage).mockReturnValue(true);
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

  it('не монтирует на не-товарной странице, даже если есть кнопка покупки в карточке', () => {
    vi.mocked(isHoroshopProductPage).mockReturnValue(false);
    const card = document.createElement('div');
    card.className = 'product-card__price-box';
    document.body.appendChild(card);

    const result = trustBadges(getDefaultConfig(), getDefaultI18n());

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
