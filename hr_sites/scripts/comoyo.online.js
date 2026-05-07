// source: https://comoyo.online/
// extracted: 2026-05-07T21:21:03.866Z
// scripts: 2

// === script #1 (length=2339) ===
document.addEventListener('DOMContentLoaded', function () {
    const sticky = document.getElementById('sticky-buy');
    const stickyPrice = document.getElementById('sticky-price');
    const stickyDiscount = document.getElementById('sticky-discount');
    const stickyOldPrice = document.getElementById('sticky-old-price');
    const stickyBtn = document.querySelector('.sticky-buy-button');
    const mainBtn = document.querySelector('.j-buy-button-add, .j-buy-button-remove');

    const productBlock = document.querySelector('.product-card--main');

    if (!sticky || !mainBtn || !stickyPrice || !stickyBtn || !productBlock) return;

    const priceNew = productBlock.querySelector('.product-card__price--new');
    const priceOld = productBlock.querySelector('.product-card__old-price');
    const discountEl = productBlock.querySelector('.product-card__discount-percent');
    const metaPrice = productBlock.querySelector('[itemprop="price"]');

    if (!metaPrice) return;

    // Ціна
    const displayPrice = priceNew?.textContent.trim() || (metaPrice.getAttribute('content') + ' грн');
    stickyPrice.textContent = displayPrice;

    // Знижка
    if (discountEl) {
      stickyDiscount.textContent = discountEl.textContent.trim();
      stickyDiscount.style.display = 'inline-block';
    }

    // Стара ціна
    if (priceOld) {
      stickyOldPrice.textContent = priceOld.textContent.trim();
      stickyOldPrice.style.display = 'block';
    }

    // Клік по кнопці
    stickyBtn.addEventListener('click', function () {
      mainBtn.click();
    });

    // Показ/приховування панелі
    function isInViewport(el) {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight;
    }

    function toggleSticky() {
      if (!isInViewport(mainBtn)) {
        sticky.classList.add('visible');
      } else {
        sticky.classList.remove('visible');
      }
    }

    window.addEventListener('scroll', toggleSticky);
    window.addEventListener('resize', toggleSticky);
    toggleSticky();

    // Синхронізація тексту кнопки
    const observer = new MutationObserver(() => {
      stickyBtn.textContent = mainBtn.textContent;
    });
    observer.observe(mainBtn, { childList: true, subtree: true });
  });

// === script #2 (length=500) ===
window.fbAsyncInit = function() {
    FB.init({
      appId      : '581096161604604',
      xfbml      : true,
      version    : 'v23.0'
    });
    FB.AppEvents.logPageView();
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
