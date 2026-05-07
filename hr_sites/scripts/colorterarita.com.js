// source: https://colorterarita.com/
// extracted: 2026-05-07T21:19:49.774Z
// scripts: 7

// === script #1 (length=3360) ===
// МАСИВ ЗОБРАЖЕНЬ
    const images = [
      '/content/uploads/images/vdguk-1.png',
      '/content/uploads/images/vdguk-2.png',
      '/content/uploads/images/vdguk-3.png',
      '/content/uploads/images/vdguk-4.png',
      '/content/uploads/images/vdguk-5.png',
      '/content/uploads/images/vdguk-6.png',
      '/content/uploads/images/vdguk-7.png',
      '/content/uploads/images/vdguk-8.png',
      '/content/uploads/images/vdguk-9.png',
      '/content/uploads/images/vdguk-10.png'
    ];

    const clonesCount = 3;
    const carouselTrack = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Функція створення слайду з width/height
    function createSlide(src, index) {
      const slideDiv = document.createElement('div');
      slideDiv.classList.add('carousel-item');
      
      const img = document.createElement('img');
      img.src = src;
      // ALT – як і було раніше
      img.alt = `зображення відгуків про colorterarita.com-${index + 1}`;

      // Прописуємо фіксовані розміри (припустимо 400×500),
      // щоб браузер знав, скільки місця зарезервувати
      img.setAttribute('width', '400');
      img.setAttribute('height', '500');

      slideDiv.appendChild(img);
      return slideDiv;
    }

    const realSlides = [];

    // Додаємо справжні слайди
    images.forEach((src, i) => {
      const slide = createSlide(src, i);
      carouselTrack.appendChild(slide);
      realSlides.push(slide);
    });

    // Клони перших 3
    for (let i = 0; i < clonesCount; i++) {
      const clone = realSlides[i].cloneNode(true);
      carouselTrack.appendChild(clone);
    }

    // Клони останніх 3
    for (let i = images.length - clonesCount; i < images.length; i++) {
      const clone = realSlides[i].cloneNode(true);
      carouselTrack.insertBefore(clone, realSlides[0]);
    }

    const allSlides = carouselTrack.querySelectorAll('.carousel-item');
    let currentIndex = clonesCount;
    let slideWidth = allSlides[0].clientWidth;

    function updatePosition() {
      carouselTrack.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    }

    window.addEventListener('resize', () => {
      slideWidth = allSlides[0].clientWidth;
      updatePosition();
    });

    updatePosition();

    prevBtn.addEventListener('click', () => {
      currentIndex--;
      updatePosition();
    });

    nextBtn.addEventListener('click', () => {
      currentIndex++;
      updatePosition();
    });

    // Нескінченна карусель
    carouselTrack.addEventListener('transitionend', () => {
      if (currentIndex >= realSlides.length + clonesCount) {
        currentIndex = currentIndex - realSlides.length;
        carouselTrack.style.transition = 'none';
        updatePosition();
        requestAnimationFrame(() => {
          carouselTrack.style.transition = 'transform 0.5s ease';
        });
      } else if (currentIndex < clonesCount) {
        currentIndex = currentIndex + realSlides.length;
        carouselTrack.style.transition = 'none';
        updatePosition();
        requestAnimationFrame(() => {
          carouselTrack.style.transition = 'transform 0.5s ease';
        });
      }
    });

// === script #2 (length=1626) ===
// Перевірка параметру URL
window.addEventListener('DOMContentLoaded', function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get('promo') === 'COLORO10') {
    document.getElementById('promoModalO').style.display = 'flex';
    startPromoTimerO();

    if (!localStorage.getItem('promoO_expires')) {
      const now = new Date().getTime();
      const expiry = now + 24 * 60 * 60 * 1000;
      localStorage.setItem('promoO_expires', expiry);
    }
  }
});

// Таймер
function startPromoTimerO() {
  const timerEl = document.getElementById("promoTimerO");
  const expiry = parseInt(localStorage.getItem("promoO_expires"), 10);

  if (!timerEl || isNaN(expiry)) return;

  const interval = setInterval(function () {
    const now = new Date().getTime();
    const distance = expiry - now;

    if (distance <= 0) {
      clearInterval(interval);
      timerEl.innerText = "00:00:00";
      return;
    }

    const hours = Math.floor(distance / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    timerEl.innerText = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, 1000);
}

function pad(num) {
  return num.toString().padStart(2, "0");
}

document.getElementById('closePromoModalO').addEventListener('click', function () {
  document.getElementById('promoModalO').style.display = 'none';
});

function copyPromoCodeO() {
  navigator.clipboard.writeText("COLORO10").then(() => {
    alert("Промокод скопійовано!");
  });
}

// === script #3 (length=518) ===
document.addEventListener("DOMContentLoaded", function () {
  const imgs = document.querySelectorAll("img");

  imgs.forEach((img) => {
    const isHero = img.hasAttribute("data-hero") || img.hasAttribute("data-preload");

    if (isHero) {
      img.removeAttribute("loading");
      img.setAttribute("fetchpriority", "high");
      img.setAttribute("decoding", "async");
    } else {
      img.setAttribute("loading", "lazy");
      // по желанию: img.setAttribute("decoding","async");
    }
  });
});

// === script #4 (length=4704) ===
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".infinity-carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const prev  = carousel.querySelector(".prev");
    const next  = carousel.querySelector(".next");

    // Безпечний парсер JSON з фолбеком
    const parseJson = (raw, fallback=[]) => {
      if (!raw) return fallback;
      try { return JSON.parse(raw); } catch (e) { console.warn("Bad JSON in data-*", e, raw); return fallback; }
    };

    const images = parseJson(carousel.dataset.images).map(s => String(s)); // без toLowerCase — щоб не зламати шлях
    const alts   = parseJson(carousel.dataset.alts);
    const hrefs  = parseJson(carousel.dataset.hrefs);                      // опціонально
    const hrefTarget = carousel.dataset.hrefTarget || "_self";

    const slides = [];
    let currentIndex = 0;
    let loadedCount  = 0;

    const isBottom = carousel.classList.contains("carousel-bottom");
    const perView  = window.matchMedia("(max-width: 768px)").matches ? 1 : 3;

    const priorityCount     = isBottom ? 0 : (perView + 1);
    const initialEagerCount = isBottom ? 0 : priorityCount;
    const preloadInitial    = isBottom ? (perView + 1) : Math.max(priorityCount, 5);
    const preloadAhead      = isBottom ? 1 : 2;

    function loadImage(i) {
      if (i >= images.length || i < 0 || slides[i]) return;

      const item = document.createElement("div");
      item.classList.add("carousel-item");

      const img = document.createElement("img");
      img.src = images[i];
      img.alt = (alts[i] && String(alts[i]).trim()) ? alts[i] : `Чашка з фото – приклад ${i + 1}`;
      img.width = 400;
      img.height = 500;

      if (i < initialEagerCount) {
        img.removeAttribute("loading");
        if (!isBottom) img.setAttribute("fetchpriority","high");
        img.setAttribute("decoding","async");
      } else {
        img.loading = "lazy";
        img.setAttribute("decoding","async");
      }

      // Якщо є посилання — обгортаємо <a>
      const href = (Array.isArray(hrefs) && typeof hrefs[i] === "string") ? hrefs[i].trim() : "";
      if (href) {
        const a = document.createElement("a");
        a.className = "carousel-item-link";
        a.href = href;
        a.target = hrefTarget;
        if (a.target === "_blank") a.rel = "noopener";
        a.setAttribute("aria-label", img.alt || `Перейти до товару ${i + 1}`);
        a.style.display = "block"; a.style.width = "100%"; a.style.height = "100%";
        a.appendChild(img);
        item.appendChild(a);
      } else {
        item.appendChild(img);
      }

      slides[i] = item;
      track.appendChild(item);
      loadedCount++;
    }

    for (let i = 0; i < Math.min(preloadInitial, images.length); i++) loadImage(i);

    function updatePosition() {
      const slideWidth = slides[0]?.clientWidth || 0;
      track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    }

    function preloadNextImages() {
      const target = currentIndex + perView + preloadAhead;
      for (let i = loadedCount; i <= target && i < images.length; i++) {
        if (!slides[i]) loadImage(i);
      }
    }

    function eagerizeVisibleBottom() {
      if (!isBottom) return;
      const limit = Math.min(images.length, perView + 1);
      for (let i = 0; i < limit; i++) {
        if (!slides[i]) loadImage(i);
        const img = slides[i].querySelector('img');
        if (img && img.getAttribute('loading') === 'lazy') {
          img.removeAttribute('loading');
          img.setAttribute('decoding','async');
        }
      }
    }

    if (isBottom && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            eagerizeVisibleBottom();
            preloadNextImages();
            io.disconnect();
          }
        });
      }, { rootMargin: '350px' });
      io.observe(carousel);
    }

    prev?.addEventListener("click", () => {
      currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
      updatePosition();
      preloadNextImages();
    });

    next?.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % images.length;
      preloadNextImages();
      updatePosition();
    });

    window.addEventListener("resize", updatePosition);
    preloadNextImages();

    prev?.setAttribute("aria-label","Попередній слайд");
    next?.setAttribute("aria-label","Наступний слайд");
  });
});

// === script #5 (length=4546) ===
document.addEventListener("DOMContentLoaded", function () {

  const placeholder = document.querySelector("[data-cta-999]");
  if (!placeholder) return;

  // ====== Автовизначення мови ======
  const path = (location.pathname || "").toLowerCase();
  const htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
  const isRu = path.startsWith("/ru/") || htmlLang.startsWith("ru");

  // ====== Тексти (UA/RU) ======
  const T = isRu ? {
    defaultTitle1: "Хотите печать с фото, свой принт или есть вопрос??",
    defaultTitle2: "Напишите нам.",
    btn: "НАПИСАТЬ",
    pStart: "Сделайте заказ прямо сейчас! Нажимайте:",
    or: "или",
    fastTitle: "Как заказать быстрее?",
    fastLead: "Напишите максимум информации сразу, в первом сообщении:",
    b1: "• что именно вас интересует: ",
    b1Strong: "кружка / бокал / магнит / бокс",
    b2: "• тип кружки (белая, цветная, хамелеон и т.д.), размер магнитов..",
    b3: "• что нужно напечатать: ",
    b3Strong: "фото / изображение / текст",
    b4: "• сразу добавьте все материалы",
    tip: "👉 Так мы быстрее обработаем ваш запрос."
  } : {
    defaultTitle1: "Бажаєте друк з фото, власний принт або є питання??",
    defaultTitle2: "Напишіть нам.",
    btn: "НАПИСАТИ",
    pStart: "Зробіть замовлення просто зараз! Натискайте:",
    or: "або",
    fastTitle: "Як замовити швидше?",
    fastLead: "Напишіть максимум інформації одразу, у першому повідомленні:",
    b1: "• що саме вас цікавить: ",
    b1Strong: "чашка / келих / магніт / бокс",
    b2: "• тип чашки (біла, кольорова, хамелеон тощо), розмір магнітів..",
    b3: "• що потрібно надрукувати: ",
    b3Strong: "фото / зображення / текст",
    b4: "• одразу додайте всі матеріали",
    tip: "👉 Так ми швидше обробимо ваш запит."
  };

  // ====== Заголовки з якоря ======
  const rawTitle1 = placeholder.getAttribute("data-title1");
  const rawTitle2 = placeholder.getAttribute("data-title2");

  const title1 = (rawTitle1 && rawTitle1.trim())
    ? rawTitle1.trim()
    : T.defaultTitle1;

  // КЛЮЧОВЕ: якщо data-title2 існує, але після trim це порожньо → не показуємо другий рядок
  let showTitle2 = true;
  let title2 = T.defaultTitle2;

  if (rawTitle2 !== null) {
    if (rawTitle2.trim() === "") {
      showTitle2 = false;
    } else {
      title2 = rawTitle2.trim();
    }
  }

  // ====== Рендер у якір ======
  placeholder.innerHTML = `
    <div class="cta-block-999">
      <p style="font-size:20px;font-weight:bold;color:#333;">${title1}</p>
      ${showTitle2 ? `<p style="font-size:20px;font-weight:bold;color:#333;">${title2}</p>` : ``}
      <button class="my-open-modal-btn-999" id="openMyModal999">${T.btn}</button>
    </div>

    <div class="my-modal-overlay-999" id="myModal999" style="display:none;">
      <div class="my-modal-999">
        <button class="my-close-modal-btn-999" id="closeMyModal999">X</button>

        <!-- 1) Як/Как замовити швидше -->
        <p><strong>${T.fastTitle}</strong><br>${T.fastLead}</p>

        <p>
          ${T.b1}<strong>${T.b1Strong}</strong><br>
          ${T.b2}<br>
          ${T.b3}<strong>${T.b3Strong}</strong><br>
          ${T.b4}
        </p>

        <p>${T.tip}</p>

        <!-- 2) Разделитель -->
        <hr>

        <!-- 3) Зробіть/Сделайте заказ прямо сейчас -->
        <p>${T.pStart}</p>

        <p>✔ <img src="/content/uploads/images/pngegg-30.pngv854v8.png" width="24" height="24" loading="lazy">
        Телеграм <a href="http://t.me/colorterarita" rel="nofollow"><strong>@colorterarita</strong></a></p>

        <p>${T.or}</p>

        <p>✔ <img src="/content/uploads/images/pngegg-5v441v5c4v31.png" width="24" height="24" loading="lazy">
        Viber <a class="phone-link-999" href="https://connect.viber.com/business/819c0d8a-d02e-11ef-b9fc-c6613cc9e07f?utm_source=manage&utm_medium=copy_link" rel="nofollow">096-029-37-31</a></p>

      </div>
    </div>
  `;

  // ====== Логіка модалки (без змін) ======
  const openBtn = document.getElementById("openMyModal999");
  const closeBtn = document.getElementById("closeMyModal999");
  const modal = document.getElementById("myModal999");

  if (!openBtn || !closeBtn || !modal) return;

  openBtn.addEventListener("click", () => modal.style.display = "flex");
  closeBtn.addEventListener("click", () => modal.style.display = "none");
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

});

// === script #6 (length=1403) ===
(function () {
  function apply() {
    // Ищем именно контактный блок (там где телефон)
    var nav = document.querySelector('ul.main-nav:has(a.main-nav__link.j-phone-item)');
    if (!nav) return;

    // Если уже вставили — не дублируем
    if (nav.querySelector('.js-messenger-note')) return;

    // Находим Telegram по иконке (это НЕ ссылка, а svg)
    var tgIcon = nav.querySelector('svg.icon--telegram');
    if (!tgIcon) return;

    var tgLi = tgIcon.closest('li');
    if (!tgLi) return;

    var noteLi = document.createElement('li');
    noteLi.className = 'main-nav__item js-messenger-note';
    noteLi.innerHTML = '<div class="main-nav__link js-messenger-note__text"></div>';

    var lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    noteLi.querySelector('.js-messenger-note__text').textContent =
      (lang === 'ru') ? 'Связь в мессенджерах' : 'Звязок в месенджерах';

    tgLi.insertAdjacentElement('afterend', noteLi);
  }

  // Пытаемся сразу и несколько раз (меню часто перерисовывается)
  apply();
  var t = 0;
  var timer = setInterval(function(){
    apply();
    t++;
    if (t > 20) clearInterval(timer); // ~10 сек
  }, 500);

  // И наблюдатель на изменения DOM (на случай перерисовки)
  var obs = new MutationObserver(apply);
  obs.observe(document.documentElement, {childList:true, subtree:true});
})();

// === script #7 (length=3633) ===
(function () {
  function qs(sel, root){ return (root || document).querySelector(sel); }

  function detectLang(){
    var l = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    if(l.indexOf('ru') === 0) return 'ru';
    if(l.indexOf('uk') === 0 || l.indexOf('ua') === 0) return 'ua';
    var p = (location.pathname || '').toLowerCase();
    var s = (location.search || '').toLowerCase();
    if(p.indexOf('/ru') === 0 || s.indexOf('lang=ru') !== -1) return 'ru';
    return 'ua';
  }

  function applyLang(){
    var lang = detectLang();
    document.querySelectorAll('[data-ua][data-ru]').forEach(function(el){
      el.textContent = (lang === 'ru') ? el.getAttribute('data-ru') : el.getAttribute('data-ua');
    });
  }

  function openModal989(){
    var overlay = qs('#myModal989');
    if(!overlay) return;
    applyLang();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeModal989(){
    var overlay = qs('#myModal989');
    if(!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  // TAP-ONLY защита от скролла на мобиле
  var touchMoved = false;
  var startX = 0, startY = 0;

  document.addEventListener('touchstart', function(e){
    touchMoved = false;
    if(!e.touches || !e.touches[0]) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, {passive:true});

  document.addEventListener('touchmove', function(e){
    if(!e.touches || !e.touches[0]) return;
    var dx = Math.abs(e.touches[0].clientX - startX);
    var dy = Math.abs(e.touches[0].clientY - startY);
    if(dx > 8 || dy > 8) touchMoved = true;
  }, {passive:true});

  // Перехват ТОЛЬКО по click (тап)
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="tel:"], a.j-phone-item');
    if(!a) return;
    if(a.getAttribute('data-allow-tel') === '1') return;

    if(touchMoved) return;

    e.preventDefault();
    e.stopPropagation();
    openModal989();
  }, true);

  // Закрытие модалки
  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'myModal989') closeModal989();
    if(e.target && e.target.classList.contains('my-modal-close-989')) closeModal989();
  });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeModal989();
  });

  // Десктоп: вставить кнопки в dropdown
  function injectDesktopMessengers(){
    var dropdown = qs('.phones__dropdown');
    var list = qs('.phones__list', dropdown);
    if(!dropdown || !list) return;
    if(qs('.phones__messengers-989', dropdown)) return;

    var wrap = document.createElement('div');
    wrap.className = 'phones__messengers-989';
    wrap.innerHTML =
      '<a href="https://connect.viber.com/business/819c0d8a-d02e-11ef-b9fc-c6613cc9e07f?utm_source=manage&amp;utm_medium=copy_link" rel="nofollow">' +
        '<img alt="Viber" height="18" loading="lazy" src="/content/uploads/images/pngegg-5v441v5c4v31.png" width="18" />' +
        '<span>Viber</span>' +
      '</a>' +
      '<a href="http://t.me/colorterarita" rel="nofollow">' +
        '<img alt="Telegram" height="18" loading="lazy" src="/content/uploads/images/pngegg-30.pngv854v8.png" width="18" />' +
        '<span>Telegram</span>' +
      '</a>';

    dropdown.appendChild(wrap);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', injectDesktopMessengers);
  } else {
    injectDesktopMessengers();
  }
})();
