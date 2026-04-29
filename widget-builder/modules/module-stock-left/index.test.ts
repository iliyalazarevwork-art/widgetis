import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import stockLeft from './index';
import { getDefaultConfig, getDefaultI18n } from './schema';

vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
  isHoroshopProductPage: vi.fn(() => true),
}));

import { isHoroshopProductPage } from '@laxarevii/core';

describe('stockLeft', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    window.localStorage.clear();
    vi.mocked(isHoroshopProductPage).mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('не монтирует остаток на не-товарной странице с товарной карточкой', () => {
    vi.mocked(isHoroshopProductPage).mockReturnValue(false);
    const cardPrice = document.createElement('div');
    cardPrice.className = 'product-card__price-box';
    document.body.appendChild(cardPrice);

    const result = stockLeft(getDefaultConfig(), getDefaultI18n());

    expect(document.querySelector('.wty-stock-left')).toBeNull();
    expect(result).toBeUndefined();
  });
});
