import { describe, it, expect, vi, beforeEach } from 'vitest';

let productPageOverride: boolean | null = null;
vi.mock('@laxarevii/core', () => ({
  getLanguage: () => 'ua',
  isHoroshopProductPage: () =>
    productPageOverride ?? document.querySelector('.product-header, .j-product-block') !== null,
}));

import photoReviews from './index';

const config = {
  enabled: true,
  showOnMobile: true,
  showOnDesktop: true,
  reviewSelector: '.review-item',
  bodySelector: '.review-item__body',
  authorSelector: '.review-item__name',
  photos: [],
  fallbackUrls: ['https://example.com/img.jpg'],
  aspectRatio: '4 / 5',
  borderRadius: 14,
  openInLightbox: false,
  observeDom: false,
};

const i18n = {
  ua: {
    viewPhotoLabel: 'Фото від клієнта',
    closeLabel: 'Закрити',
    prevLabel: 'Попереднє',
    nextLabel: 'Наступне',
  },
};

function addReviewItem(): void {
  const item = document.createElement('div');
  item.className = 'review-item';
  item.innerHTML = `
    <div class="review-item__name">Хтось</div>
    <div class="review-item__body">Текст відгуку</div>
  `;
  document.body.appendChild(item);
}

describe('photo-reviews page-type guard', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    productPageOverride = null;
  });

  it('активується і додає галерею на сторінці товару', () => {
    productPageOverride = true;
    addReviewItem();

    photoReviews(config, i18n);

    const gallery = document.querySelector('.hs-photo-review__gallery');
    expect(gallery).not.toBeNull();
  });

  it('пропускає роботу на не-товарній сторінці (галерея не додається)', () => {
    productPageOverride = false;
    addReviewItem();

    photoReviews(config, i18n);

    const gallery = document.querySelector('.hs-photo-review__gallery');
    expect(gallery).toBeNull();
  });

  it('пропускає, коли enabled = false (навіть на товарній сторінці)', () => {
    productPageOverride = true;
    addReviewItem();

    photoReviews({ ...config, enabled: false }, i18n);

    const gallery = document.querySelector('.hs-photo-review__gallery');
    expect(gallery).toBeNull();
  });
});
