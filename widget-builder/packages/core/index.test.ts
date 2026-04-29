import { describe, it, expect, beforeEach } from 'vitest';
import { isHoroshopProductPage } from './index';

function setBody(html: string): void {
  document.body.innerHTML = html;
}

function setHead(html: string): void {
  document.head.innerHTML = html;
}

describe('isHoroshopProductPage', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('returns false on empty document', () => {
    expect(isHoroshopProductPage()).toBe(false);
  });

  it('returns true when og:type=product (most reliable Horoshop signal)', () => {
    setHead('<meta property="og:type" content="product">');
    expect(isHoroshopProductPage()).toBe(true);
  });

  it('returns false when og:type=website (homepage)', () => {
    setHead('<meta property="og:type" content="website">');
    setBody('<div class="j-product-block"></div>');
    expect(isHoroshopProductPage()).toBe(false);
  });

  it('returns false when og:type=product.group (category page)', () => {
    setHead('<meta property="og:type" content="product.group">');
    setBody('<div class="j-product-block"></div>');
    expect(isHoroshopProductPage()).toBe(false);
  });

  it('returns false when og:type=article (blog post)', () => {
    setHead('<meta property="og:type" content="article">');
    expect(isHoroshopProductPage()).toBe(false);
  });

  it('falls back to DOM selectors when og:type is missing — .product-header', () => {
    setBody('<div class="product-header"><h1 class="product-title">X</h1></div>');
    expect(isHoroshopProductPage()).toBe(true);
  });

  it('falls back to DOM selectors — .j-product-description', () => {
    setBody('<div class="j-product-description">desc</div>');
    expect(isHoroshopProductPage()).toBe(true);
  });

  it('falls back to DOM selectors — .product__section--header', () => {
    setBody('<section class="product__section--header"></section>');
    expect(isHoroshopProductPage()).toBe(true);
  });

  it('does not treat .j-product-block alone as a product page (catalog cards reuse it)', () => {
    setBody('<div class="j-product-block"></div>');
    expect(isHoroshopProductPage()).toBe(false);
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
      '<html><head><meta property="og:type" content="product"></head><body></body></html>',
      'text/html',
    );
    expect(isHoroshopProductPage(parsed)).toBe(true);
  });
});
