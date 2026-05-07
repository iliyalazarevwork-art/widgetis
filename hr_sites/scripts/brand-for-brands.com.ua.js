// source: https://brand-for-brands.com.ua/
// extracted: 2026-05-07T21:20:23.659Z
// scripts: 3

// === script #1 (length=6940) ===
(function(){
  if (document.getElementById('floating-buttons-wrapper')) return;

  var htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
  var isRu = location.pathname.startsWith('/ru') || htmlLang.startsWith('ru');

  var T = isRu ? {
    tgMsg: 'Напишите нам в Telegram — ответим как можно быстрее!',
    tgBtn: 'Открыть Telegram',
    callPopupTitle: 'Выберите действие',
    callBtnCall: 'Позвонить сейчас',
    callBtnCallback: 'Заказать обратный звонок'
  } : {
    tgMsg: 'Напишіть нам у Telegram — відповімо якомога швидше!',
    tgBtn: 'Відкрити Telegram',
    callPopupTitle: 'Оберіть дію',
    callBtnCall: 'Подзвонити зараз',
    callBtnCallback: 'Замовити зворотній дзвінок'
  };

  var TG_LINK = 'https://t.me/brandforbrands01';
  var CALL_NUMBER = '+380739744476';

  // --- Стили ---
  var style = document.createElement('style');
  style.textContent = `
    #floating-buttons-wrapper {
      position: fixed; bottom: 25px; right: 25px;
      display: flex; align-items: center; gap: 10px; z-index: 9999;
      background-color: #87715C;
      padding: 10px 14px;
      border-radius: 25px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: sans-serif;
      color: #fff;
      font-size: 16px; /* чуть больше текста */
    }
    #floating-buttons-wrapper .floating-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s ease;
    }
    #floating-buttons-wrapper .floating-button:hover {
      transform: scale(1.1);
    }
    #telegram-floating-button { background-color: #29a0da; }
    #call-floating-button { background-color: #b5a596; }
    #floating-buttons-wrapper .floating-button img {
      width: 24px; height: 24px;
    }
    /* Popup стили оставляем как есть */
    .floating-popup {
      display: none; position: fixed; right: 25px;
      background: #fff; border: 1px solid #ccc; padding: 16px;
      width: 260px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,.2);
      z-index: 9998;
    }
    #telegram-popup { bottom: 80px; }
    #call-choice-popup { bottom: 80px; width: 220px; text-align: center; }
    .floating-popup p { margin: 0 0 10px; font-family: sans-serif; font-size: 15px; color: #333; }
    .floating-popup a {
      display: block; background-color: #0088cc; color: #fff; text-align: center;
      padding: 10px; border-radius: 8px; text-decoration: none; font-weight: 700;
    }
    #call-choice-popup h4 { margin: 0 0 10px; font-size: 16px; }
    #call-choice-popup a, #call-choice-popup button {
      display: block; width: 100%; margin-bottom: 8px; padding: 10px;
      border: none; border-radius: 8px; font-weight: 700; cursor: pointer;
      text-decoration: none; box-sizing: border-box; max-width: 100%;
    }
    #btn-direct-call { background-color: #ff8800; color: #fff; }
    #btn-callback-form { background-color: #2c8f25; color: #fff; }
    .popup-close { text-align: right; cursor: pointer; font-size: 14px; color: #888; margin-bottom: 8px; }
  `;
  document.head.appendChild(style);

  // --- Блок с текстом и кнопками ---
  var wrap = document.createElement('div');
  wrap.id = 'floating-buttons-wrapper';
  wrap.innerHTML = `
    <span>Прийом замовлення</span>
    <button id="telegram-floating-button" class="floating-button" aria-label="Telegram">
      <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram">
    </button>
    <button id="call-floating-button" class="floating-button" aria-label="Call">
      <img src="https://cdn-icons-png.flaticon.com/512/597/597177.png" alt="Call">
    </button>
  `;
  document.body.appendChild(wrap);

  // --- Telegram popup ---
  var tgPopup = document.createElement('div');
  tgPopup.id = 'telegram-popup';
  tgPopup.className = 'floating-popup';
  tgPopup.innerHTML = `
    <div class="popup-close" data-close="tg">✕</div>
    <p>${T.tgMsg}</p>
    <a href="${TG_LINK}" target="_blank" rel="nofollow noopener">${T.tgBtn}</a>
  `;
  document.body.appendChild(tgPopup);

  // --- Popup выбора звонка ---
  var callChoicePopup = document.createElement('div');
  callChoicePopup.id = 'call-choice-popup';
  callChoicePopup.className = 'floating-popup';
  callChoicePopup.innerHTML = `
    <h4>${T.callPopupTitle}</h4>
    <a id="btn-direct-call" href="tel:${CALL_NUMBER}" data-action="call">${T.callBtnCall}</a>
    <button id="btn-callback-form">${T.callBtnCallback}</button>
  `;
  document.body.appendChild(callChoicePopup);

  // --- Общие функции ---
  function toggle(el){ el.style.display = (el.style.display === 'block') ? 'none' : 'block'; }
  function closeAll(){
    tgPopup.style.display = 'none';
    callChoicePopup.style.display = 'none';
  }

  document.getElementById('telegram-floating-button').addEventListener('click', function(e){
    e.stopPropagation(); closeAll(); toggle(tgPopup);
  });
  document.getElementById('call-floating-button').addEventListener('click', function(e){
    e.stopPropagation(); closeAll(); toggle(callChoicePopup);
  });

  document.getElementById('btn-callback-form').addEventListener('click', function(){
    callChoicePopup.style.display = 'none';

    var callbackForm = document.getElementById('call-me');
    if (callbackForm) {
      if (typeof window.Modal !== 'undefined' && typeof window.Modal.open === 'function') {
        window.Modal.open('#call-me');
      } else {
        callbackForm.style.display = 'block';
      }
      return;
    }

    var burger = document.querySelector('button:has(svg.icon--menu), div:has(svg.icon--menu)');
    if (!burger) {
      var icon = document.querySelector('svg.icon--menu');
      if (icon) burger = icon.closest('button, div');
    }

    var openCallback = () => {
      var callbackBtn = document.querySelector('a[data-menu="callback"], a[href*="callback"], a[href*="call-me"]');
      if (callbackBtn) callbackBtn.click();
      else console.warn('Кнопка "Обратный звонок" в меню не найдена.');
    };

    var menuOpened = document.body.classList.contains('menu-open') || document.body.classList.contains('is-open');
    if (burger && !menuOpened) {
      burger.click();
      setTimeout(openCallback, 700);
    } else {
      openCallback();
    }
  });

  tgPopup.querySelector('[data-close="tg"]').addEventListener('click', function(){ tgPopup.style.display='none'; });

  document.addEventListener('click', function(e){
    var inside = wrap.contains(e.target) || tgPopup.contains(e.target) || callChoicePopup.contains(e.target);
    if (!inside) closeAll();
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeAll();
  });
})();

// === script #2 (length=3591) ===
document.addEventListener("DOMContentLoaded", function () {
  const currentUrl = window.location.pathname;

  // Проверка страниц (главная UA/RU и страница отзывов UA/RU)
  if (
    currentUrl === "/" || currentUrl === "/ru/" ||
    currentUrl.includes("/vidhuky-nashykh-kliientiv") ||
    currentUrl.includes("/ru/otzyvy-nashikh-klientov")
  ) {
    // Определяем язык страницы
    const isRu = currentUrl.startsWith("/ru/") || currentUrl === "/ru/";
    const titleText = isRu ? "Видео отзывы наших клиентов" : "Відео відгуки наших клієнтів";

    // Подключаем Swiper CSS и JS
    const swiperCSS = document.createElement("link");
    swiperCSS.rel = "stylesheet";
    swiperCSS.href = "https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.min.css";
    document.head.appendChild(swiperCSS);

    const swiperJS = document.createElement("script");
    swiperJS.src = "https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.min.js";
    document.head.appendChild(swiperJS);

    swiperJS.onload = function () {
      // Создаём HTML-блок
      const section = document.createElement("section");
      section.innerHTML = `
      <div style="padding:50px 0; background:#fafafa;">
        <div style="max-width:1100px; margin:0 auto;">
          <h2 style="text-align:center; font-size:30px; font-weight:bold; margin-bottom:30px; color:#222;">
            ${titleText}
          </h2>

          <div class="swiper video-reviews">
            <div class="swiper-wrapper">
              ${[
                "naCTjBjw6NU",
                "VJy7GVtOW2w",
                "lrGicXinuyo",
                "OszOIeXgSo0",
                "jVuepvyzQew",
                "ZeHerFPEIk4",
                "vRHNqzZpvtQ",
                "CEzJUUBY6sY",
                "NEIlditfAb4",
                "ygDxb0R8PkM",
"cs_QdxTNfJg",
"24yOqeome68",
"lWk0ykZg08Q",
"swsRUAqMchI",
"F2-JVZ61Vj4",
"bKpKX0nh6gQ",
"PNlkA7QtcHs",
"dBNMAAwV6mc",
"dBNMAAwV6mc",
"JmmYeQ8f08E"
              ]
                .map(
                  (id) => `
                <div class="swiper-slide">
                  <iframe width="100%" height="250" src="https://www.youtube.com/embed/${id}?rel=0" 
                          frameborder="0" allowfullscreen></iframe>
                </div>
              `
                )
                .join("")}
            </div>

            <!-- Навигация -->
            <div class="swiper-pagination"></div>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
          </div>
        </div>
      </div>
      `;

      // Стили
      const style = document.createElement("style");
      style.textContent = `
        .video-reviews { width: 100%; }
        .video-reviews .swiper-slide { display: flex; justify-content: center; }
        .video-reviews iframe { border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
      `;
      document.head.appendChild(style);

      // Вставка перед футером
      const footer = document.querySelector("footer");
      if (footer) footer.parentNode.insertBefore(section, footer);

      // Инициализация Swiper без autoplay
      new Swiper('.video-reviews', {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: true,
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        breakpoints: { 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
      });
    };
  }
});

// === script #3 (length=2745) ===
(()=> {
  // язык сайта
  const LANG = (() => {
    const l = (document.documentElement.lang || '').toLowerCase();
    if (l.startsWith('ru') || location.pathname.includes('/ru/')) return 'ru';
    return 'uk';
  })();

  // тексты
  const T = {
    uk: {
      viewers: n => `👀 Зараз ${n} людей переглядають цей товар`,
      purchased: n => ` Сьогодні купили ${n} раз(и)`
    },
    ru: {
      viewers: n => `👀 Сейчас ${n} человек смотрят этот товар`,
      purchased: n => ` Сегодня купили ${n} раз(а)`
    }
  };

  // где искать цену (максимально «липко» к разным шаблонам Хорошопа)
  const PRICE_QS = [
    '.product-price__item',
    '.product-price__current',
    '.product-price__value',
    '.product-page__price',
    '.product__price',
    '.product-price',
    '[itemprop="offers"] [itemprop="price"]',
    '[itemprop="price"]'
  ].join(',');

  const isProductPage = () =>
    !!document.querySelector('[itemtype*="schema.org/Product"], [itemprop="price"], .product-price__item');

  const findPriceEl = () => document.querySelector(PRICE_QS);

  function insertBadges(){
    if (document.getElementById('bf-social-proof')) return true;

    const priceEl = findPriceEl();
    if (!priceEl) return false;

    const wrap = document.createElement('div');
    wrap.id = 'bf-social-proof';

    const viewers = document.createElement('div');
    viewers.className = 'bf-badge bf-badge-viewers';

    const purchased = document.createElement('div');
    purchased.className = 'bf-badge bf-badge-purchased';

    wrap.append(viewers, purchased);

    if (priceEl.parentNode) priceEl.parentNode.insertBefore(wrap, priceEl.nextSibling);
    else priceEl.after(wrap);

    const updateViewers = () => {
      const n = 3 + Math.floor(Math.random()*3); // 3–5
      viewers.textContent = T[LANG].viewers(n);
    };
    const setPurchased = () => {
      const n = 1 + Math.floor(Math.random()*2); // 1–2
      purchased.textContent = T[LANG].purchased(n);
    };

    updateViewers();
    setPurchased();
    setInterval(updateViewers, 15000);
    return true;
  }

  function init(){
    if (!isProductPage()) return;

    if (insertBadges()) return;

    // ждём подгрузку до ~20 сек
    let tries = 0;
    const iv = setInterval(() => {
      tries++;
      if (insertBadges() || tries > 80) clearInterval(iv);
    }, 250);

    // подстраховка на любые изменения DOM
    const mo = new MutationObserver(() => insertBadges());
    mo.observe(document.documentElement, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
