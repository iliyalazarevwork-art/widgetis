// source: https://sigma-hilzy.com.ua/
// extracted: 2026-05-07T21:22:37.948Z
// scripts: 1

// === script #1 (length=1163) ===
(function() {
  function isProductPage() {
    // Десктоп: section.product
    // Мобільний: div.product.wrapper з itemtype Product
    return (
      document.querySelector('section.product[itemtype*="Product"]') !== null ||
      document.querySelector('div.product.wrapper[itemtype*="Product"]') !== null ||
      document.querySelector('[itemtype="https://schema.org/Product"]') !== null
    );
  }

  function showBanner() {
    if (!isProductPage()) return;
    if (window.location.href.indexOf('companeros-3-000') !== -1) return;

    var wrap = document.getElementById('sigma-promo-banner-wrap');
    if (!wrap) return;

    var main = document.querySelector('main');
    if (!main) return;

    // Десктоп: main > div.wrapper
    // Мобільний: main > div.product.wrapper
    var firstChild = main.firstElementChild;

    if (firstChild) {
      main.insertBefore(wrap, firstChild);
    } else {
      main.appendChild(wrap);
    }

    wrap.style.display = 'block';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
