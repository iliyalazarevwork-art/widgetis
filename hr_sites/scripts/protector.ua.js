// source: https://protector.ua/
// extracted: 2026-05-07T21:22:26.723Z
// scripts: 1

// === script #1 (length=2073) ===
(function () {
  function resizeProductStickers() {
    const width = window.innerWidth;
    const isMobile = width <= 768;
    const isDesktop = width >= 1024;

    const path = window.location.pathname;

    const isCatalogPage = 
      path === '/products/' || 
      path.startsWith('/products') ||
      path.startsWith('/sport') ||
      path.startsWith('/outdoor') ||
      path.startsWith('/militari') ||
      path.startsWith('/workers') ||
      path.startsWith('/casual')|| 
      path.startsWith('/trekinhovi-shkarpetky-products');

    const isProductPage = 
      document.querySelector('.product-page') || 
      document.querySelector('[itemtype*="Product"]');

    const stickers = [
      ...document.querySelectorAll('.productSticker-img'),
      ...document.querySelectorAll('.productSticker-image'),
      ...document.querySelectorAll('.product-sticker__image')
    ];

    if (!stickers.length) return;

    stickers.forEach(function (sticker) {
      if (isCatalogPage && isDesktop) {
        sticker.style.setProperty('width', '54px', 'important');
        sticker.style.setProperty('height', 'auto', 'important');
      } else if (isProductPage && isMobile) {
        sticker.style.width = '72px';
        sticker.style.height = 'auto';
      } else {
        sticker.style.width = '';
        sticker.style.height = '';
      }
    });

    const stickerWrapper = document.querySelector('.j-product-stickers');

    if (stickerWrapper && isMobile) {
      let maxHeight = 0;
      const mobileStickers = stickerWrapper.querySelectorAll('.product-sticker__image');

      mobileStickers.forEach(sticker => {
        const h = sticker.offsetHeight;
        if (h > maxHeight) {
          maxHeight = h;
        }
      });

      stickerWrapper.style.height = maxHeight + 'px';
    } else if (stickerWrapper) {
      stickerWrapper.style.height = '';
    }
  }

  window.addEventListener('load', resizeProductStickers);
  window.addEventListener('resize', resizeProductStickers);
})();
