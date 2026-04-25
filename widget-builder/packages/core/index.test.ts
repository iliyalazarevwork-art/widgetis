import { describe, it, expect, beforeEach } from 'vitest';
import { isHoroshopProductPage } from './index';

function setBody(html: string): void {
  document.body.innerHTML = html;
}

describe('isHoroshopProductPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns false on empty document', () => {
    expect(isHoroshopProductPage()).toBe(false);
  });

  it('returns true when .product-header is present (Horoshop product page)', () => {
    setBody('<div class="product-header"><h1 class="product-title">X</h1></div>');
    expect(isHoroshopProductPage()).toBe(true);
  });

  it('returns true when .j-product-block is present', () => {
    setBody('<div class="j-product-block"></div>');
    expect(isHoroshopProductPage()).toBe(true);
  });

  it('returns true when .j-product-description is present', () => {
    setBody('<div class="j-product-description">desc</div>');
    expect(isHoroshopProductPage()).toBe(true);
  });

  it('returns true when .product__section--header is present', () => {
    setBody('<section class="product__section--header"></section>');
    expect(isHoroshopProductPage()).toBe(true);
  });

  it('returns false on a Horoshop category page (only j-product-container cards)', () => {
    setBody(`
      <div class="catalog">
        <div class="catalogCard-box j-product-container"></div>
        <div class="catalogCard-box j-product-container"></div>
      </div>
    `);
    expect(isHoroshopProductPage()).toBe(false);
  });

  it('returns false on the homepage (productSticker / products-menu only)', () => {
    setBody(`
      <ul class="products-menu">
        <li class="products-menu__item"></li>
      </ul>
      <div class="productSticker"></div>
    `);
    expect(isHoroshopProductPage()).toBe(false);
  });

  it('returns false on a contacts/static page', () => {
    setBody('<main class="contacts"><h1>Contacts</h1></main>');
    expect(isHoroshopProductPage()).toBe(false);
  });

  it('does not match generic class names containing "product"', () => {
    setBody(`
      <div class="products-menu"></div>
      <div class="j-product-container"></div>
      <div class="productSticker"></div>
      <div class="productsMenu-list"></div>
    `);
    expect(isHoroshopProductPage()).toBe(false);
  });

  it('accepts a custom Document (for tests with parsed HTML)', () => {
    const parsed = new DOMParser().parseFromString(
      '<html><body><div class="product-header"></div></body></html>',
      'text/html',
    );
    expect(isHoroshopProductPage(parsed)).toBe(true);
  });
});
