// source: https://lalapka.com.ua/
// extracted: 2026-05-07T21:21:50.066Z
// scripts: 1

// === script #1 (length=2103) ===
/*
  LALAPKA — плавне збільшення банерів при наведенні (Хорошоп)
  Вставити у: Маркетинг → Маркетингові сервіси → "Код ініціалізації"
  Розташування: Перед тегом </body>
*/
(function () {
  // 1) Чисті стилі для ефекту (жодних overflow/z-index/позиціонувань)
  (function injectCSS(){
    var prev = document.getElementById('lp-zoom-style');
    if (prev) prev.remove();
    var css = `
      /* ціль збільшення */
      .lp-zoom-wrap .lp-zoom-target{
        transition: transform 320ms ease !important;
        transform-origin: center center !important;
        will-change: transform;
      }
      /* ефект на hover тільки для десктопів */
      @media (hover:hover) and (pointer:fine){
        .lp-zoom-wrap:hover .lp-zoom-target{
          transform: scale(1.06) !important;
        }
      }
    `;
    var s = document.createElement('style');
    s.id = 'lp-zoom-style';
    s.textContent = css;
    document.head.appendChild(s);
  })();

  // 2) Знаходимо банери й ставимо класи-мітки
  var BANNER_SELECTOR = '.banners .banner';

  function mark(el){
    if (!el || el.classList.contains('lp-zoom-wrap')) return;
    el.classList.add('lp-zoom-wrap');

    // Перевага — збільшувати саме зображення усередині банера
    var target = el.querySelector('.banner__image, picture, img');
    if (!target) target = el; // запасний варіант: масштабувати весь банер
    if (!target.classList.contains('lp-zoom-target')){
      target.classList.add('lp-zoom-target');
    }
  }

  function init(){
    document.querySelectorAll(BANNER_SELECTOR).forEach(mark);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 3) Підтримка довантаження DOM (наприклад, lazy-блоки)
  var mo = new MutationObserver(function(muts){
    var need = false;
    for (var i=0;i<muts.length;i++){
      if (muts[i].addedNodes && muts[i].addedNodes.length){ need = true; break; }
    }
    if (need) init();
  });
  mo.observe(document.body, {subtree:true, childList:true});
})();
