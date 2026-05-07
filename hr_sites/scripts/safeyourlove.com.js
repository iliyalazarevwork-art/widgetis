// source: https://safeyourlove.com/
// extracted: 2026-05-07T21:18:59.383Z
// scripts: 3

// === script #1 (length=833) ===
(function() {
  var v = new URLSearchParams(window.location.search).get("kim_clickid");
  var us = new URLSearchParams(window.location.search).get("utm_source");

  // Лише ці utm_source вважаються валідними для KIM
  var allowedSources = ["kim-affiliates"];

  // Якщо utm_source присутній і НЕ kim → видаляємо affclick
  if (us && !allowedSources.includes(us)) {
    document.cookie = "affclick=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    localStorage.removeItem("affclick");
    return;
  }

  // Зберігаємо kim_clickid, якщо він є
  if (v !== null) {
    var dateAf = new Date();
    dateAf.setTime(dateAf.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 днів
    document.cookie = "affclick=" + v + "; expires=" + dateAf.toUTCString() + "; path=/";
    localStorage.setItem('affclick', v);
  }
})();

// === script #2 (length=2624) ===
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    var loader = document.getElementById("insta-feed-loader");

    // 1) Якір у місці віджета (щоб було що спостерігати у в’юпорті)
    var anchor = document.getElementById("insta-feed-anchor");
    if (!anchor) {
      anchor = document.createElement("div");
      anchor.id = "insta-feed-anchor";
      loader.parentNode.insertBefore(anchor, loader.nextSibling);
    }

    var created = false;

    // Функція для додавання CSS стилів виправлення
    function addFixStyles() {
      if (document.getElementById('elfsight-fix-styles')) return;

      var style = document.createElement('style');
      style.id = 'elfsight-fix-styles';
      style.textContent = `
        .elfsight-app-3cb21d85-eb98-4d91-aa20-026878400c93 {
          width: calc(100% + 32px) !important;
          margin-left: -16px !important;
          margin-right: -16px !important;
          max-width: none !important;
          overflow-x: hidden !important;
        }

      `;
      document.head.appendChild(style);
    }
    function mountWidget() {
      if (created) return;
      created = true;

      // Додаємо CSS стилі виправлення одразу
      addFixStyles();

      // 2) Створюємо контейнер віджета одразу за якірним елементом
      var widgetDiv = document.createElement("div");
      widgetDiv.id = "insta-feed";
      widgetDiv.className = "elfsight-app-3cb21d85-eb98-4d91-aa20-026878400c93";
      widgetDiv.setAttribute("data-elfsight-app-lazy", "");
      anchor.parentNode.insertBefore(widgetDiv, anchor.nextSibling);

      // 3) Підвантажуємо платформу Elfsight ОДИН раз на сайті
      if (!window.__ELFSIGHT_PLATFORM_LOADED__) {
        var s = document.createElement("script");
        s.src = "https://elfsightcdn.com/platform.js";
        s.defer = true;
        s.async = true;
        s.setAttribute("data-use-service-core", "");
        document.head.appendChild(s);
        window.__ELFSIGHT_PLATFORM_LOADED__ = true;
      }
    }

    // 4) Ледачий старт: коли якір видно у вікні
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function(entries) {
        if (entries.some(function(e) { return e.isIntersecting; })) {
          mountWidget();
          io.disconnect();
        }
      }, {
        rootMargin: "0px" // можеш поставити "200px 0px" щоб підвантажувати трохи раніше
      });
      io.observe(anchor);
    } else {
      // Фолбек для дуже старих браузерів — вантажимо одразу
      mountWidget();
    }
  });
})();

// === script #3 (length=909) ===
document.addEventListener('DOMContentLoaded', function () {
  var article = document.querySelector('.article-text, .article .text');
  var recommend = document.querySelector('.article__associated-products, .related-goods');
  if (!article || !recommend) return;

  var h2s = article.querySelectorAll('h2');
  if (h2s.length < 3) return;

  var thirdH2 = h2s[2];
  thirdH2.parentNode.insertBefore(recommend, thirdH2);

  // ВАЖЛИВО: після переміщення примусово переініціалізуємо Swiper,
  // щоб він перерахував розміри слайдів під нову ширину контейнера
  setTimeout(function () {
    try {
      if (window.Face && typeof window.Face.initAssociatedProductsSwipers === 'function') {
        window.Face.initAssociatedProductsSwipers();
      }
      // Також тригеримо resize, щоб Swiper-Update спрацював
      window.dispatchEvent(new Event('resize'));
    } catch (e) {}
  }, 100);
});
