// source: https://gold24.com.ua/
// extracted: 2026-05-07T21:20:37.851Z
// scripts: 2

// === script #1 (length=2290) ===
document.addEventListener("DOMContentLoaded", function () {
  // 👉 Автопрокрутка банера
  const swiperInstance = document.querySelector("#banners__slider")?.swiper;
  if (swiperInstance) {
    swiperInstance.params.autoplay = {
      delay: 3000,
      disableOnInteraction: false,
    };
    swiperInstance.autoplay.start();
  }

  // 👉 FAQ аккордеон
  const questions = document.querySelectorAll(".faq-question");
  questions.forEach((btn) => {
    btn.addEventListener("click", function () {
      const answer = this.nextElementSibling;
      const isOpen = answer.classList.contains("open");

      document.querySelectorAll(".faq-answer").forEach((a) => a.classList.remove("open"));
      document.querySelectorAll(".faq-question").forEach((q) => q.classList.remove("active"));

      if (!isOpen) {
        answer.classList.add("open");
        this.classList.add("active");
      }
    });
  });

  // 👉 Видалення "Хорошоп"
  function removeHoroshopElements() {
    const targets = [
      '.footer__development-link',
      '.footer__development',
      '.footer-powered',
      '.footer-powered-logo',
      'img[src*="horoshop"]',
      'img[alt*="Хорошоп"]',
      'a[href*="horoshop.ua"]',
    ];

    targets.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.closest("div")?.remove();
      });
    });
  }
  removeHoroshopElements();

  // ✅ Автопрокрутка "Хіти"
  const hitsSlider = document.querySelector('.promo-slider');
  if (hitsSlider) {
    new Swiper(hitsSlider, {
      loop: true,
      slidesPerView: 5,
      spaceBetween: 20,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: '.slideCarousel-nav-btn.__slideRight',
        prevEl: '.slideCarousel-nav-btn.__slideLeft',
      },
      breakpoints: {
        320: {
          slidesPerView: 1.2,
          spaceBetween: 10,
        },
        480: {
          slidesPerView: 2.2,
        },
        768: {
          slidesPerView: 3,
        },
        1024: {
          slidesPerView: 4,
        },
        1280: {
          slidesPerView: 5,
        }
      }
    });
  }
});

// === script #2 (length=902) ===
(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'9f83450a4c7fe13c',t:'MTc3ODE4ODgzNw=='};var a=document.createElement('script');a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
