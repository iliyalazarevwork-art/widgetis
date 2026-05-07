// source: https://teplorry.com.ua/
// extracted: 2026-05-07T21:18:54.568Z
// scripts: 14

// === script #1 (length=1272) ===
(function() {

  // --- Функция скрытия стикеров с промокодом ---
  function hidePromoStickers() {
    var stickers = document.querySelectorAll('.productSticker-item');
    for (var j = 0; j < stickers.length; j++) {
      var content = stickers[j].querySelector('.productSticker-content');
      if (content && /[-−]\d+%\s*по промокоду/i.test(content.textContent.trim())) {
        stickers[j].style.display = 'none';
      }
    }
  }

  // --- Проверка 1: бренд в таблице характеристик (страница товара) ---
  var brandRows = document.querySelectorAll('.product-features__row');
  for (var i = 0; i < brandRows.length; i++) {
    var th = brandRows[i].querySelector('.product-features__cell--h .product-features__cell-title');
    var td = brandRows[i].querySelector('td.product-features__cell');
    if (th && td && th.textContent.trim() === 'Бренд' && td.textContent.trim() === 'Fischer') {
      hidePromoStickers();
      return;
    }
  }

  // --- Проверка 2: бренд в карточке каталога ---
  var catalogBrands = document.querySelectorAll('.catalogCard-brand');
  for (var k = 0; k < catalogBrands.length; k++) {
    if (catalogBrands[k].textContent.trim() === 'Fischer') {
      hidePromoStickers();
      return;
    }
  }

})();

// === script #2 (length=5843) ===
(function () {
  const ruUrls = [
    "https://teplorry.com.ua/hazovyi-kotel-nova-florida-nibir-new-ctn-24-cu/",
    "https://teplorry.com.ua/hazovyi-kotel-nova-florida-delfis-new-ctn-24/",
    "https://teplorry.com.ua/hazovyi-kotel-rens-rgb-024-komplekt-dymokhoda/",
    "https://teplorry.com.ua/hazovyi-kotel-rens-rgb-028-komplekt-dymokhoda/",
    "https://teplorry.com.ua/hazovyi-kotel-rens-rgb-032-komplekt-dymokhoda/",
    "https://teplorry.com.ua/hazovyi-kotel-rens-rgb-036-komplekt-dymokhoda/",
    "https://teplorry.com.ua/hazovyi-kotel-rens-rgb-046-komplekt-dymokhoda/",
    "https://teplorry.com.ua/hazovyi-kotel-rens-rgb-040-komplekt-dymokhoda/",
    "https://teplorry.com.ua/hazovyi-kotel-rens-rgb-053-komplekt-dymokhoda/",
    "https://teplorry.com.ua/hazovyi-kotel-fondital-minorca-ctfs-24-cu/",
    "https://teplorry.com.ua/hazovyi-kotel-biasi-rinnova-light-24-kvt/",
    "https://teplorry.com.ua/hazovyi-kotel-biasi-rinnova-light-28-kvt/",
    "https://teplorry.com.ua/hazovyi-kotel-biasi-rinnova-light-32-kvt/",
    "https://teplorry.com.ua/gazovyy-kotel-immergas-nike-mini-28-kw-special/",
    "https://teplorry.com.ua/gazovyy-kotel-immergas-mini-eolo-28-3-e/",
    "https://teplorry.com.ua/hazovyi-kotel-e.c.a.-gelios-plus-28-nm-komplekt-dymokhoda/"
  ];
  const uaUrls = [
    "https://teplorry.com.ua/ua/hazovyi-kotel-nova-florida-nibir-new-ctn-24-cu/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-nova-florida-delfis-new-ctn-24/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-rens-rgb-024-komplekt-dymokhoda/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-rens-rgb-028-komplekt-dymokhoda/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-rens-rgb-032-komplekt-dymokhoda/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-rens-rgb-036-komplekt-dymokhoda/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-rens-rgb-046-komplekt-dymokhoda/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-rens-rgb-040-komplekt-dymokhoda/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-rens-rgb-053-komplekt-dymokhoda/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-fondital-minorca-ctfs-24-cu/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-biasi-rinnova-light-24-kvt/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-biasi-rinnova-light-28-kvt/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-biasi-rinnova-light-32-kvt/",
    "https://teplorry.com.ua/ua/gazovyy-kotel-immergas-nike-mini-28-kw-special/",
    "https://teplorry.com.ua/ua/gazovyy-kotel-immergas-mini-eolo-28-3-e/",
    "https://teplorry.com.ua/ua/hazovyi-kotel-e.c.a.-gelios-plus-28-nm-komplekt-dymokhoda/"
  ];

  const href = window.location.href.split("?")[0].split("#")[0];
  const isUA = href.includes("/ua/");
  if (![...ruUrls, ...uaUrls].includes(href)) return;

  const priceBlock = document.querySelector(".product-price");
  const orderBlock = document.querySelector(".product-order");
  const toolbarBlock = document.querySelector(".product__block .product-toolbar");

  const link = isUA
    ? "https://teplorry.com.ua/ua/kondensatsionnye-gazovye-kotly/"
    : "https://teplorry.com.ua/kondensatsionnye-gazovye-kotly/";

  const priceTextRu = "Модель снята с продажи. Информация на странице носит исключительно справочный характер и не является предложением к продаже.";
  const priceTextUa = "Модель знята з продажу. Інформація на сторінці носить виключно довідковий характер та не є пропозицією до продажу.";

  const orderTextRu = `Рекомендуем рассмотреть современные <a href="${link}" class="teplorry-link">конденсационные газовые котлы</a>.`;
  const orderTextUa = `Рекомендуємо розглянути сучасні <a href="${link}" class="teplorry-link">конденсаційні газові котли</a>.`;

  const styleTag = document.createElement("style");
  styleTag.innerHTML = `
    .teplorry-note {
      font-size: 16px;
      line-height: 1.6;
      color: #444;
      margin: 10px 0;
    }
    .teplorry-link {
      color: #444;
      text-decoration: underline;
      font-weight: 600;
    }
    .teplorry-note--mobile {
      margin: 10px 0 15px;
    }
  `;
  document.head.appendChild(styleTag);

  if (priceBlock) {
    priceBlock.innerHTML = `<div class="teplorry-note">${isUA ? priceTextUa : priceTextRu}</div>`;
  }

  if (orderBlock) {
    orderBlock.innerHTML = `<div class="teplorry-note">${isUA ? orderTextUa : orderTextRu}</div>`;
  }

  if (toolbarBlock) {
    toolbarBlock.style.display = "none";
  }

  // скрываем только tabs с Доставка/Оплата/Гарантія
  document.querySelectorAll(".product__group.product__group--tabs").forEach(group => {
    const nav = group.querySelector(".product-heading__nav");
    if (!nav) return;
    const text = nav.innerText.toLowerCase();
    if (text.includes("доставка") || text.includes("оплата") || text.includes("гарант")) {
      group.style.display = "none";
    }
  });

  // мобильная кнопка “Повідомити, коли з'явиться”
  const mobileNotify = document.querySelector(".product-card__notify");
  if (mobileNotify) mobileNotify.style.display = "none";

  const mobileOrderBox = document.querySelector(".product-card__order-box");
  if (mobileOrderBox) mobileOrderBox.style.display = "none";

  // мобильный текст перед product-card
  const mobileCard = document.querySelector(".product-card.product-card--main");
  if (mobileCard && !document.querySelector(".teplorry-note--mobile")) {
    const mobileNote = document.createElement("div");
    mobileNote.className = "teplorry-note teplorry-note--mobile";
    mobileNote.innerHTML = `
      <div>${isUA ? priceTextUa : priceTextRu}</div>
      <div style="margin-top:10px;">${isUA ? orderTextUa : orderTextRu}</div>
    `;
    mobileCard.parentNode.insertBefore(mobileNote, mobileCard);
  }

  document.documentElement.classList.remove("teplorry-hide");
})();

// === script #3 (length=1934) ===
// === Налаштування параметрів розстрочки ===
var pl_options = {
  pl_type: 2,                     // Тип розстрочки
  pl_n1: "Три платежі",           // Варіант 1
  pl_n2: "Шість платежів",        // Варіант 2
  pl_n3: "Десять платежів",       // Варіант 3
  pl_bc: "#4e6bb2",               // Колір основного оформлення (блакитний)
  lang: "ukr"                     // Мова: ukr або ru
};

$(function () {
  // Определяем язык по URL
  var btnText = window.location.pathname.startsWith('/ua/') ? "Розстрочка" : "Рассрочка";

  // Находим кнопку "В кредит"
  var $creditBtnBlock = $('.product-order__block').has('a.btn.j-installment-button:contains("В кредит")');

  // Если на странице товара и кнопки еще нет
  if ($('.product-order').length > 0 && !$('#credit-paylater').length && $creditBtnBlock.length > 0) {
    // Вставляем кнопку после блока "В кредит"
    $creditBtnBlock.after(
      '<div class="product-order__block"><div id="credit-paylater" class="btn j-installment-button"><span class="btn-content">' + btnText + '</span></div></div>'
    );
  }

  $(document).on("click", "#credit-paylater", function () {
    let rawText = $('.product-header__code').text() || '';
    let article = rawText.replace(/Артикул/g, '').replace(/["\s]/g, '').trim();
    let name = $('.product-title').text().trim() || 'Без назви';
    let price = parseFloat(($('meta[itemprop="price"]').attr('content') || '0').replace(',', '.')).toFixed(2);

    let credit_data = {
      id: article,
      name: name,
      price: price
    };

    console.log('Дані для buyInCredit:', credit_data);
// --- Викликаємо функцію PayLate ---
    if (typeof buyInCredit === 'function') {
      let customerEmail = 'paylater7@gmail.com';
      buyInCredit(price, article, name, customerEmail);
    } else {
      console.warn("Функція buyInCredit не знайдена. Перевірте, чи підключено start.js");
    }
  });
});

// === script #4 (length=1409) ===
(function() {
    // Тексты для поиска (русский и украинский)
    var promoVariants = [
        '>>> УКАЗАТЬ ПРОМОКОД <<<',
        '>>> ВКАЗАТИ ПРОМОКОД <<<'
    ];

    function highlightPromoText() {
        var promoTexts = document.querySelectorAll('.link__text');
        promoTexts.forEach(function(span) {
            promoVariants.forEach(function(variant) {
                if (
                    span.textContent.includes(variant) &&
                    !span.innerHTML.includes('color: red')
                ) {
                    // Красим только нужную часть текста (только цвет)
                    span.innerHTML = span.textContent.replace(
                        variant,
                        '<span style="color: red;">' + variant + '</span>'
                    );
                }
            });
        });
    }

    // MutationObserver для динамических изменений (AJAX и пр.)
    var observer = new MutationObserver(function() {
        highlightPromoText();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            highlightPromoText();
            observer.observe(document.body, { childList: true, subtree: true });
        });
    } else {
        highlightPromoText();
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();

// === script #5 (length=2248) ===
document.addEventListener('DOMContentLoaded', function() {
    // Определяем язык: ua/uk или ru, дефолт — ua
    var lang = document.documentElement.lang || window.location.pathname.split('/')[1];
    lang = (lang === 'ua' || lang === 'uk') ? 'ua' : (lang === 'ru' ? 'ru' : 'ua');
    // Подписи
    var labels = {
        ua: {
            price_min: 'Мінімальна ціна',
            price_max: 'Максимальна ціна',
            vysotaMm_min: 'Мін. висота, мм',
            vysotaMm_max: 'Макс. висота, мм',
            shirinaMm_min: 'Мін. ширина, мм',
            shirinaMm_max: 'Макс. ширина, мм',
            glubinaMm_min: 'Мін. глибина, мм',
            glubinaMm_max: 'Макс. глибина, мм'
        },
        ru: {
            price_min: 'Минимальная цена',
            price_max: 'Максимальная цена',
            vysotaMm_min: 'Мин. высота, мм',
            vysotaMm_max: 'Макс. высота, мм',
            shirinaMm_min: 'Мин. ширина, мм',
            shirinaMm_max: 'Макс. ширина, мм',
            glubinaMm_min: 'Мин. глубина, мм',
            glubinaMm_max: 'Макс. глубина, мм'
        }
    };
    // Для всех фильтр-инпутов, если нет label — добавляем невидимый label
    document.querySelectorAll('.filter-price-field.field').forEach(function(input) {
        if (document.querySelector('label[for="' + input.id + '"]')) return;
        var name = input.getAttribute('data-name');
        if (!name) return;
        var key = '';
        if (name.includes('price')) key = name.includes('min') ? 'price_min' : 'price_max';
        else if (name.includes('vysotaMm')) key = name.includes('min') ? 'vysotaMm_min' : 'vysotaMm_max';
        else if (name.includes('shirinaMm')) key = name.includes('min') ? 'shirinaMm_min' : 'shirinaMm_max';
        else if (name.includes('glubinaMm')) key = name.includes('min') ? 'glubinaMm_min' : 'glubinaMm_max';
        else key = name;
        var labelText = labels[lang][key] || name;
        // Создаём невидимый label
        var label = document.createElement('label');
        label.setAttribute('for', input.id);
        label.className = 'sr-only';
        label.textContent = labelText;
        input.parentNode.insertBefore(label, input);
    });
});

// === script #6 (length=5140) ===
document.addEventListener('DOMContentLoaded', function () {
  try {
    var isMobile = window.innerWidth <= 768;
    var topLimit = isMobile ? 1000 : 800;

    function setLazy(img) {
      if (img && img.tagName === 'IMG') {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        img.removeAttribute('fetchpriority');
      }
    }

    function setPriorityFirstVisible(images) {
      var firstSet = false;
      images.forEach(function (img) {
        var rect = img.getBoundingClientRect();
        if (!firstSet && img.offsetParent !== null && rect.top >= 0 && rect.top < topLimit) {
          img.removeAttribute('loading');
          img.setAttribute('fetchpriority', 'high');
          img.setAttribute('decoding', 'async');
          firstSet = true;
        } else {
          setLazy(img);
        }
      });
    }

    // 0. Баннеры на главной
    function processBanners() {
      var banners = document.querySelectorAll('.banners__list .banner-img');
      banners.forEach(function (img, index) {
        if (index === 0) {
          img.removeAttribute('loading');
          img.setAttribute('fetchpriority', 'high');
          img.setAttribute('decoding', 'async');
        } else {
          setLazy(img);
        }
      });
    }
    processBanners();
    setTimeout(processBanners, 1000);

    // 1. Главное изображение товара в каталоге
    var catalogImages = document.querySelectorAll(
      '.catalogCard-img img, .catalog-card .image__src, .catalogCard-image img'
    );
    setPriorityFirstVisible(Array.from(catalogImages));

    // 2. Логотип в хедере
    var logoImg = document.querySelector('img.header__logo, .logo img, .header-logo-img');
    if (logoImg) {
      logoImg.removeAttribute('loading');
      logoImg.setAttribute('fetchpriority', 'high');
      logoImg.setAttribute('decoding', 'async');
    }

    // 3. Прочие изображения
    var lazySelectors = [
      '.footer__logo-img',
      '.catalog-menu__img',
      '.brand-card__img',
      '.children-pages-menu__image img',
      '.catalog-menu__image img',
      '.footer__payment img',
      '.productsMenu-submenu-image img',
      '.newsList-img',
      '.frontBrands-img',
      '.article-card__img',
      '.main-nav__icon .image__src',
      '.frontCategories-img',
      '.gallery__product-logo img',
      '.countdown__description img',
      '.product-set-card__img'
    ];
    lazySelectors.forEach(function (selector) {
      var imgs = document.querySelectorAll(selector);
      imgs.forEach(setLazy);
    });

    // 4. Новинки и акции (динамика)
    var promoContainer = document.querySelector('.tabs__body');
    if (promoContainer) {
      var promoObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              var imgs = node.querySelectorAll('img');
              imgs.forEach(setLazy);
            }
          });
        });
      });
      promoObserver.observe(promoContainer, { childList: true, subtree: true });
    }

    // 5. Слайдеры
    setTimeout(function () {
      var sliderImgs = document.querySelectorAll('.catalog-carousel img, .carousel img');
      sliderImgs.forEach(setLazy);
    }, 1000);

    // 6. Галерея карточки
    setPriorityFirstVisible(document.querySelectorAll('.gallery__img'));
    setPriorityFirstVisible(document.querySelectorAll('.gallery__photo-img'));

    // 7. Модальные окна
    var modalGalleryObserver = new MutationObserver(function () {
      setPriorityFirstVisible(document.querySelectorAll('.tmGallery-frame .tmGallery-image img'));
    });
    modalGalleryObserver.observe(document.body, { childList: true, subtree: true });

    // 8. Миниатюры под фото
    var thumbImgs = document.querySelectorAll('.gallery__thumb-img');
    thumbImgs.forEach(setLazy);

    // 9. Схожі товари и Дивіться також (динамика)
    var associatedObserver = new MutationObserver(function () {
      var associatedImgs = document.querySelectorAll('.productsSlider-img');
      associatedImgs.forEach(setLazy);
    });
    associatedObserver.observe(document.body, { childList: true, subtree: true });

    // 10. Товари, які ви переглянули (динамика с ожиданием контейнера)
    var recentObserver = new MutationObserver(function () {
      var recentImgs = document.querySelectorAll('.recentProducts-image img');
      recentImgs.forEach(setLazy);
    });
    var recentBlockCheck = setInterval(function () {
      var container = document.querySelector('.recentProducts-body');
      if (container) {
        recentObserver.observe(container, { childList: true, subtree: true });
        var imgs = container.querySelectorAll('img');
        imgs.forEach(setLazy);
        clearInterval(recentBlockCheck);
      }
    }, 500);

  } catch (err) {
    if (window.console) {
      console.error('Ошибка в скрипте оптимизации изображений:', err);
    }
  }
});

// === script #7 (length=7543) ===
document.addEventListener("DOMContentLoaded", function () {
    const isUa = document.documentElement.lang === "uk" || location.href.includes("/ua");

    // --- Ограничения по артикулам ---
    const forbiddenArticles = [
        "11-1428", "11-1429", "11-1430", "11-1431", "11-1432",
        "11-1433", "11-1434", "11-1435", "11-1436", "11-1437",
        "11-1438", "11-1439"
    ];

    // --- Получение бренда из таблицы характеристик ---
    function getBrandNameFromTable() {
        const rows = document.querySelectorAll('.product-features__row');
        for (const row of rows) {
            const cells = row.querySelectorAll('td, th, .product-features__data');
            if (cells.length >= 2 && /Бренд/i.test(cells[0].textContent.trim())) {
                // Проверяем наличие ссылки внутри ячейки
                const link = cells[1].querySelector('a');
                if (link) {
                    return link.textContent.trim().replace(/\s/g, "");
                }
                return cells[1].textContent.trim().replace(/\s/g, "");
            }
        }
        return null;
    }
    
    const brandName = getBrandNameFromTable();
    const brandLower = brandName ? brandName.toLowerCase() : '';
    const isPrana = brandLower === "prana";
    
    // Проверка запрещенных брендов (кроме Prana)
    if (brandName && ["trosten", "gree", "hisense", "fischer"].includes(brandLower)) {
        return;
    }

    // --- Получение артикула товара ---
    let articleText = document.querySelector('.product-header__code')?.textContent.trim();
    let articleNum = articleText?.replace(/Артикул:\s*/, '');
    if (articleNum && forbiddenArticles.includes(articleNum)) {
        return;
    }

    // --- Проверка: есть ли старая цена (ПК + мобильная) ---
    const oldPriceElDesktop = document.querySelector(".product-price__old-price");
    const oldPriceElMobile = document.querySelector(".product-card__old-price");
    const hasOldPrice = !!oldPriceElDesktop || !!oldPriceElMobile;
    
    // Для Prana не удаляем баннер даже при старой цене
    if (hasOldPrice && !isPrana) {
        // Удалить баннер со счетчиком (ПК и моб)
        const countdown = document.querySelector(".product__section--countdown") || document.querySelector(".product__block--countdown");
        if (countdown) countdown.remove();

        // Удалить иконку промокода (ПК и моб)
        const promoStickers = document.querySelectorAll(".productSticker-item, .product-sticker__item");
        promoStickers.forEach(sticker => {
            if (sticker.textContent.includes("по промокоду") || sticker.textContent.includes("за промокодом")) {
                sticker.remove();
            }
        });

        return;
    }

    // --- Ищем стикер с промокодом ---
    const stickerEl = Array.from(document.querySelectorAll(".productSticker-content, .product-sticker__content")).find(el =>
        el.textContent.includes("по промокоду") || el.textContent.includes("за промокодом")
    );
    if (!stickerEl) return;

    // --- Извлекаем % скидки ---
    const match = stickerEl.textContent.match(/-(\d+)%/);
    if (!match) return;
    const discountPercent = parseInt(match[1]);

    // --- Получаем промокод (ищем <strong> рядом с "промокод") ---
    let promoCode = null;
    const strongTags = Array.from(document.querySelectorAll("strong"));
    for (let tag of strongTags) {
        const parentText = tag.closest("p")?.textContent || "";
        if (/промокод/i.test(parentText) && /^[a-zA-Z0-9]+$/.test(tag.textContent.trim())) {
            promoCode = tag.textContent.trim().toUpperCase();
            break;
        }
    }
    if (!promoCode) return;

    // --- ПК или мобильная карточка ---
    const isMobile = document.querySelector(".product-card__price-box");
    const priceWrapper = isMobile
        ? document.querySelector(".product-card__price-box")
        : document.querySelector(".product-price__box");
    const priceEl = isMobile
        ? document.querySelector(".product-card__price")
        : document.querySelector(".product-price__item");
    if (!priceEl || !priceWrapper || document.querySelector(".promo-discount-line")) return;

    const priceText = priceEl.textContent.replace(/\s/g, '').replace(/[^\d]/g, '');
    const originalPrice = parseFloat(priceText);
    if (isNaN(originalPrice)) return;

    const discountedPriceNum = Math.round(originalPrice * (1 - discountPercent / 100));
    const discountedPrice = discountedPriceNum.toLocaleString('uk-UA');
    const savedAmount = (originalPrice - discountedPriceNum).toLocaleString('uk-UA');

    // --- HTML для промокода с кнопкой копирования ---
    const copyHtml = `
        <span class="copy-code" title="${isUa ? 'Скопіювати промокод' : 'Скопировать промокод'}" data-code="${promoCode}">
            ${promoCode}
            <svg class="icon icon-copy" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z"/>
            </svg>
        </span>`;

    const promoText = isUa
        ? `З промокодом ${copyHtml} ціна — <b class="discounted-price">${discountedPrice} грн</b>`
        : `С промокодом ${copyHtml} цена — <b class="discounted-price">${discountedPrice} грн</b>`;

    const savedText = isUa
        ? `<span class="promo-saved-label">Ви заощаджуєте:</span> <span class="promo-saved-highlight">${savedAmount} ₴ (${discountPercent}%)</span>`
        : `<span class="promo-saved-label">Вы экономите:</span> <span class="promo-saved-highlight">${savedAmount} ₴ (${discountPercent}%)</span>`;

    // --- Вставляем на страницу ---
    const promoDiv = document.createElement("div");
    promoDiv.className = "promo-discount-line";
    promoDiv.innerHTML = promoText;
    const savedDiv = document.createElement("div");
    savedDiv.className = "promo-saved-line";
    savedDiv.innerHTML = savedText;

    if (isMobile) {
        promoDiv.classList.add("promo-discount-line--mobile");
        savedDiv.classList.add("promo-saved-line--mobile");
        const target = document.querySelector(".product-card__price-item");
        if (target) {
            target.parentNode.insertBefore(promoDiv, target.nextSibling);
            target.parentNode.insertBefore(savedDiv, promoDiv.nextSibling);
        }
    } else {
        const row = document.createElement("div");
        row.className = "product-price__row";
        const clonedPrice = priceEl.cloneNode(true);
        row.appendChild(clonedPrice);
        row.appendChild(promoDiv);
        priceWrapper.replaceChild(row, priceEl);
        priceWrapper.appendChild(savedDiv);
    }

    // --- Логика копирования промокода ---
    document.addEventListener('click', function (e) {
        const copyTarget = e.target.closest(".copy-code");
        if (copyTarget) {
            const text = copyTarget.dataset.code;
            navigator.clipboard.writeText(text).then(() => {
                copyTarget.title = isUa ? "Скопійовано" : "Скопировано!";
                copyTarget.classList.add("copied");
                setTimeout(() => {
                    copyTarget.classList.remove("copied");
                    copyTarget.title = isUa ? "Скопіювати промокод" : "Скопировать промокод";
                }, 1000);
            });
        }
    });
});

// === script #8 (length=5286) ===
function applyPromoHintLines() {
    const isUa = document.documentElement.lang === "uk" || location.href.includes("/ua");
    // Список запрещённых артикулов
    const forbiddenArticles = [
        "11-1428", "11-1429", "11-1430", "11-1431", "11-1432",
        "11-1433", "11-1434", "11-1435", "11-1436", "11-1437",
        "11-1438", "11-1439"
    ];

    // Находим карточки каталога (и моб., и ПК)
    const cards = document.querySelectorAll(".catalogCard-info, .catalog-card__content");

    cards.forEach(card => {
        // Не добавлять второй раз!
        if (card.querySelector(".promo-hint-line")) return;

        // Проверка бренда (если есть)
        const brandText = card.querySelector(".catalogCard-brand, .catalog-card__brand")?.textContent.trim();
        if (brandText === "Trosten" || brandText === "Cooper&Hunter" || brandText === "Gree" || brandText === "Fischer" ||brandText === "Hisense") return;

        // Проверка артикула (по классу .catalogCard-code или .catalog-card__code)
        let articleText = card.querySelector(".catalogCard-code, .catalog-card__code")?.textContent.trim();
        // Оставляем только номер
        let articleNum = articleText?.replace(/Артикул:\s*/, '');
        if (articleNum && forbiddenArticles.includes(articleNum)) return;

        // Проверка наличия старой цены
        const oldPrice = card.querySelector(".catalogCard-oldPrice, .catalog-card__old-price");
        if (oldPrice) {
            // --- Удаляем иконку промокода если она есть ---
            const cardRoot = card.closest('.catalogCard') || card.closest('.catalog-card');
            if (cardRoot) {
                const promoStickers = cardRoot.querySelectorAll(".productSticker-item, .product-sticker__item");
                promoStickers.forEach(sticker => {
                    // Удаляем только если это именно ПРОМОКОД!
                    if (/промокод/.test(sticker.textContent)) {
                        sticker.remove();
                    }
                });
            }
            return; // Никаких promo-hint-line не вставляем!
        }

        // Находим .catalogCard или .catalog-card для поиска стикера
        const cardRoot = card.closest('.catalogCard') || card.closest('.catalog-card');

        // Найти стикер с промокодом
        const sticker = cardRoot?.querySelector(".productSticker-content, .product-sticker__content");
        if (!sticker || !/промокод/.test(sticker.textContent)) return;

        // Поиск процента скидки
        const match = sticker.textContent.match(/-(\d+)%/);
        if (!match) return;
        const discount = parseInt(match[1]);

        // Находим цену
        const priceEl = card.querySelector(".catalogCard-price, .catalog-card__price");
        if (!priceEl) return;

        const priceText = priceEl.textContent.replace(/\s/g, '').replace(/[^\d]/g, '');
        const price = parseFloat(priceText);
        if (isNaN(price)) return;

        const newPrice = Math.round(price * (1 - discount / 100)).toLocaleString('uk-UA');

        // Создаём promo-hint-line
        const line = document.createElement("div");
        line.className = "promo-hint-line";
        line.innerHTML = isUa
            ? `З промокодом за <b class="promo-price">${newPrice} грн</b>`
            : `С промокодом за <b class="promo-price">${newPrice} грн</b>`;

        // Вставляем после "В наявності"
        const afterEl = card.querySelector(".catalogCard-availability, .catalog-card__presence");
        if (afterEl) {
            afterEl.parentNode.insertBefore(line, afterEl.nextSibling);
        }
    });
}

// Добавляет пустую promo-hint-line только для мобильной версии
function addEmptyPromoHintLineMobile() {
    if (window.innerWidth > 600) return; // Только для мобильной

    const cards = document.querySelectorAll(".catalogCard-info, .catalog-card__content");
    cards.forEach(card => {
        // Если уже есть promo-hint-line — не добавлять!
        if (card.querySelector(".promo-hint-line")) return;
        // Если уже есть promo-hint-line--empty — не добавлять!
        if (card.querySelector(".promo-hint-line--empty")) return;

        const afterEl = card.querySelector(".catalogCard-availability, .catalog-card__presence");
        if (afterEl) {
            const emptyLine = document.createElement("div");
            emptyLine.className = "promo-hint-line promo-hint-line--empty";
            emptyLine.innerHTML = "&nbsp;";
            afterEl.parentNode.insertBefore(emptyLine, afterEl.nextSibling);
        }
    });
    // Удалить все promo-hint-line--empty на десктопе!
    if (window.innerWidth > 600) {
        document.querySelectorAll('.promo-hint-line--empty').forEach(e => e.remove());
    }
}

document.addEventListener("DOMContentLoaded", function () {
    applyPromoHintLines();
    addEmptyPromoHintLineMobile();

    const observer = new MutationObserver(() => {
        applyPromoHintLines();
        addEmptyPromoHintLineMobile();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener('resize', () => {
        addEmptyPromoHintLineMobile();
    });
});

// === script #9 (length=4773) ===
/**
   * ✅ Скрипт для улучшения доступности (a11y) на Хорошоп
   * Версия: 1.6 | Автор: ChatGPT
   * Новое:
   * - Добавлен MutationObserver для постоянной слежки за появлением изображений
   * - Консольный лог показывает, какие alt были удалены
   */

  // Кнопки без текста — добавляем aria-label
  document.querySelectorAll('button').forEach(btn => {
    const hasText = btn.innerText.trim().length > 0;
    const hasLabel = btn.hasAttribute('aria-label');
    if (!hasText && !hasLabel) {
      const className = btn.className || '';
      if (className.includes('search')) btn.setAttribute('aria-label', 'Поиск');
      else if (className.includes('close')) btn.setAttribute('aria-label', 'Закрыть');
      else if (className.includes('menu')) btn.setAttribute('aria-label', 'Меню');
      else if (className.includes('contacts')) btn.setAttribute('aria-label', 'Контакты');
      else btn.setAttribute('aria-label', 'Кнопка');
    }
  });

  // Ссылки без текста — добавляем aria-label
  document.querySelectorAll('a').forEach(link => {
    const hasText = link.innerText.trim().length > 0;
    const hasLabel = link.hasAttribute('aria-label');
    const hasImg = link.querySelector('img');
    if (!hasText && !hasLabel) {
      const href = link.getAttribute('href') || '';
      let label = 'Ссылка';
      if (hasImg && hasImg.getAttribute('alt')) label = hasImg.getAttribute('alt');
      else if (href.includes('/cart')) label = 'Корзина';
      else if (href.includes('/comparison')) label = 'Сравнение';
      else if (href.includes('/search')) label = 'Поиск';
      else if (href.includes('/menu')) label = 'Меню';
      else if (href.includes('/contacts')) label = 'Контакты';
      else if (href) label = 'Ссылка на ' + href.split('/').filter(Boolean).pop();
      link.setAttribute('aria-label', label);
    }
  });

  // Ссылки соцсетей — исправляем data-fake-href и задаём aria-label
  document.querySelectorAll('a[data-fake-href]').forEach(link => {
    const href = link.getAttribute('data-fake-href') || '';
    if (!link.hasAttribute('href')) link.setAttribute('href', href);

    let label = 'Социальная сеть';
    if (href.includes('facebook.com')) label = 'Facebook';
    else if (href.includes('youtube.com')) label = 'YouTube';
    else if (href.includes('twitter.com')) label = 'Twitter';
    else if (href.includes('pinterest.com')) label = 'Pinterest';

    link.setAttribute('aria-label', label);
  });

  // Кнопки переключения вида — aria-label
  document.querySelectorAll('span[role="button"].catalog-type__item').forEach(btn => {
    const href = btn.getAttribute('data-layout-href') || '';
    if (!btn.hasAttribute('aria-label')) {
      if (href.includes('grid_view')) btn.setAttribute('aria-label', 'Переключить на вид плиткой');
      else if (href.includes('list_view')) btn.setAttribute('aria-label', 'Переключить на вид списком');
      else btn.setAttribute('aria-label', 'Переключить отображение');
    }
  });

  // Удаляем дублирующие alt
  function clearDuplicateAltTexts(container = document) {
    const targetImages = container.querySelectorAll('img.frontCategories-img[alt], img.catalog-menu__img[alt], img.image__src[alt]');
    targetImages.forEach(img => {
      const alt = img.getAttribute('alt')?.trim();
      if (!alt) return;

      const parent = img.closest('a, li, div, section') || img.parentElement;
      if (!parent) return;

      const textCandidates = [
        parent.querySelector('.frontCategories-title'),
        parent.querySelector('.catalog-menu__title'),
        parent.querySelector('.category-caption'),
        parent.querySelector('.category-name'),
        parent.querySelector('.title'),
        ...parent.querySelectorAll('*')
      ];

      for (let el of textCandidates) {
        if (!el || !el.innerText) continue;
        const text = el.innerText.trim().toLowerCase();
        if (text.includes(alt.toLowerCase())) {
          img.setAttribute('alt', '');
          console.log(`[a11y] Удалён alt: "${alt}"`);
          break;
        }
      }
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    clearDuplicateAltTexts();

    let repeats = 0;
    const interval = setInterval(() => {
      clearDuplicateAltTexts();
      repeats++;
      if (repeats >= 5) clearInterval(interval);
    }, 1000);

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            clearDuplicateAltTexts(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });

// === script #10 (length=2219) ===
const hideDuration = 3600000;
    const userIp = "188.47.99.202";

    async function getUserIP() {
        try {
            const response = await fetch('https://api64.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error("Не удалось получить IP-адрес", error);
            return null;
        }
    }

    async function initLanguagePanel() {
        const userCurrentIp = await getUserIP();
        const panel = document.getElementById('language-panel');

        // Проверка: панель не отображается на украинской версии
        if (window.location.pathname.startsWith('/ua')) {
            return;
        }

        // Если IP совпадает с вашим, всегда показывать панель без учета hideDuration
        if (userCurrentIp === userIp) {
            panel.style.display = 'flex';
            setupPanelActions(panel);
            return;
        }

        // Проверка времени последнего взаимодействия
        const lastInteraction = localStorage.getItem('languagePanelClosedAt');
        const now = Date.now();

        if (!lastInteraction || (now - lastInteraction) > hideDuration) {
            panel.style.display = 'flex';
            setupPanelActions(panel);

            // Установка таймера для автоматического скрытия через 20 секунд
            setTimeout(() => hidePanel(panel), 20000);
        }
    }

    function hidePanel(panel) {
        panel.style.display = 'none';
        localStorage.setItem('languagePanelClosedAt', Date.now());
    }

    function setupPanelActions(panel) {
        document.getElementById('ukrainian-yes').onclick = function() {
            if (!window.location.pathname.startsWith('/ua')) {
                window.location.href = window.location.origin + '/ua' + window.location.pathname;
            }
            hidePanel(panel);
        };

        document.getElementById('ukrainian-no').onclick = function() {
            hidePanel(panel);
        };

        document.getElementById('ukrainian-close').onclick = function() {
            hidePanel(panel);
        };
    }

    initLanguagePanel();

// === script #11 (length=5388) ===
// URL вашего веб-приложения Google Apps Script
        const apiUrl = 'https://script.google.com/macros/s/AKfycbz_JKK7pUFt6mRTnMKlxcTPPF1Vq0-HIt8t-dmTSXUvMCNLQh9RSxho_pcXNHTaRl9L/exec';

        // Проверяем, есть ли данные в локальном хранилище
        const cachedData = localStorage.getItem('googleReviewsData');
        const lastUpdateTime = localStorage.getItem('googleReviewsLastUpdate');
        const currentTime = Date.now();

        // Если данные устарели (больше 12 часов), делаем запрос
        if (!cachedData || !lastUpdateTime || (currentTime - lastUpdateTime) > 12 * 60 * 60 * 1000) {
            fetchDataFromServer();
        } else {
            // Если данные есть и они актуальны, используем их
            displayGoogleReviews(JSON.parse(cachedData));
        }

        async function fetchDataFromServer() {
            try {
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data && data.place_info && data.place_info.rating && data.place_info.reviews) {
                    // Сохраняем данные в локальное хранилище
                    localStorage.setItem('googleReviewsData', JSON.stringify(data));
                    localStorage.setItem('googleReviewsLastUpdate', Date.now().toString());

                    // Отображаем виджеты
                    displayGoogleReviews(data);
                } else {
                    document.getElementById("custom-reviews-widget").textContent = "Не удалось загрузить данные.";
                }
            } catch (error) {
                document.getElementById("custom-reviews-widget").textContent = "Ошибка загрузки данных.";
                console.error("Ошибка при загрузке отзывов:", error);
            }
        }

        function displayGoogleReviews(data) {
            const rating = data.place_info.rating;
            const user_ratings_total = data.place_info.reviews;

            // Шаблон для Google виджета
            const googleWidgetHTML = `
                <div class="google-widget">
                    <div>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google">
                    </div>
                    <div class="stars">★★★★★</div>
                    <div class="rating-info">
                        <strong>Оцінка ${rating.toFixed(1)}</strong> із <strong>${user_ratings_total}</strong> відгуків
                    </div>
                    <a href="https://search.google.com/local/writereview?placeid=ChIJ3Q5VJFDP1EARn-QR510vIpw" target="_blank" style="text-decoration: none;">
                        <button>Залиште відгук</button>
                    </a>
                </div>
            `;

            // Шаблон для двух виджетов (Google + Hotline)
            const combinedWidgetsHTML = `
                <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 20px;">
                    ${googleWidgetHTML}
                    <div id="hotline-widget-container"></div>
                </div>
            `;

            // Вставляем после subtitle, если найден
            const targetElement = document.querySelector(".store-reviews__subtitle p:last-of-type");
            if (targetElement) {
                targetElement.insertAdjacentHTML('afterend', combinedWidgetsHTML);
            } else {
                // Если subtitle не найден — вставляем в div-загрузчик
                document.getElementById("custom-reviews-widget").innerHTML = combinedWidgetsHTML;
            }

            document.getElementById("custom-reviews-widget").style.display = "none"; // Скрыть статус загрузки

            loadHotlineWidget();
        }

        // Функция для добавления loading="lazy" к img Hotline
        function setHotlineImgLazy() {
            const observer = new MutationObserver(() => {
                const hotlineImg = document.querySelector('#hotline-widget-container img');
                if (hotlineImg && !hotlineImg.hasAttribute('loading')) {
                    hotlineImg.setAttribute('loading', 'lazy');
                    observer.disconnect();
                }
            });
            const container = document.getElementById('hotline-widget-container');
            if (container) {
                observer.observe(container, {
                    childList: true,
                    subtree: true
                });
            }
        }

        // Функция для загрузки Hotline виджета
        function loadHotlineWidget() {
            const hotlineWidgetContainer = document.getElementById('hotline-widget-container');
            if (hotlineWidgetContainer) {
                hotlineWidgetContainer.innerHTML = '<div class="hotline-rating-informer" data-type="2" data-id="33870"></div>';

                const hotlineScript = document.createElement('script');
                hotlineScript.src = "//hotline.ua/api/widgets/widgets.min.js";
                hotlineScript.async = true;
                document.body.appendChild(hotlineScript);

                // После вставки скрипта запускаем отслеживание появления картинки для добавления loading="lazy"
                setHotlineImgLazy();
            }
        }

// === script #12 (length=23000) ===
document.addEventListener("DOMContentLoaded", function () {
    // -----------------------------------
    // 1. Ваш основной код виджета:
    // -----------------------------------

    // Функция создания SVG
    const createIconSVG = (pathData, customViewBox = "0 0 24 24") => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", customViewBox);
        svg.setAttribute("width", "24");
        svg.setAttribute("height", "24");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill", "currentColor");
        path.setAttribute("d", pathData);
        svg.appendChild(path);
        return svg;
    };

    // Иконка крестика
    const closeIcon = () => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z");
        path.setAttribute("fill", "currentColor");
        svg.appendChild(path);
        return svg;
    };

    // Brand colors
    const brandColors = {
        'Зателефонувати': '#269663',
        'Viber': '#7360F2',      // <-- фиолетовый Viber
        'Telegram': '#0088CC',
        'WhatsApp': '#25D366',
        'Apple Messages': '#808080',
        'Facebook Messenger': '#006AFF',
        'Email': '#EA4335'
    };

    // Иконки
    const icons = {
        phone: {
            path: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
            viewBox: "0 0 24 24"
        },
        viber: {
            path: "M560.65 65C544.09 49.72 477.17 1.14 328.11.48c0 0-175.78-10.6-261.47 68C18.94 116.19 2.16 186.39 2.16 272.55s-4.06 248.75 152.29 292.73l.15 0-.1 67.11s-1 27.17 16.89 32.71c21.64 6.72 34.34-13.93 55-36.19 11.34-12.22 27-30.17 38.8-43.89 106.93 9 189.17-11.57 198.51-14.61 21.59-7 143.76-22.65 163.63-184.84C646.07 218.4 615.64 112.66 560.65 65z M525.88 98.77c-14-12.72-74.43-50.69-200.52-51.24 0 0-149.31-9.81-221.79 55.84C63.23 143.2 49.64 202.43 48.15 274.71s-9.21 210.36 123 247.09h0s-.52 102.51-.58 111.52c0 6.3 1 10.61 4.6 11.5 2.59.63 6.47-.71 9.77-4 21.14-21.23 88.82-102.88 88.82-102.88 90.81 5.93 163.06-12 170.83-14.54C462.91 517.51 562 509 578.77 373.54 596.1 233.91 572.4 138.6 525.88 98.77z M389.47 268.77q-2.46-49.59-50.38-52.09 M432.72 283.27q1-46.2-27.37-77.2c-19-20.74-45.3-32.16-79.05-34.63 M477 300.59q-.61-80.17-47.91-126.28t-117.65-46.6 M340.76 381.68s11.85 1 18.23-6.86l12.44-15.65c6-7.76 20.48-12.71 34.66-4.81A366.67,366.67 0 0 1 437 374.1c9.41 6.92 28.68 23 28.74 23 9.18 7.75 11.3 19.13 5.05 31.13,0,.07-.05.19-.05.25a129.81,129.81,0,0,1-25.89,31.88c-.12.06-.12.12-.23.18q-13.38,11.18-26.29,12.71a17.39,17.39,0,0,1-3.84.24,35,35,0,0,1-11.18-1.72l-.28-.41c-13.26-3.74-35.4-13.1-72.27-33.44a430.39,430.39,0,0,1-60.72-40.11,318.31,318.31,0,0,1-27.31-24.22l-.92-.92-.92-.92h0l-.92-.92c-.31-.3-.61-.61-.92-.92a318.31,318.31,0,0,1-24.22-27.31,430.83,430.83,0,0,1-40.11-60.71c-20.34-36.88-29.7-59-33.44-72.28l-.41-.28a35,35,0,0,1-1.71-11.18,16.87,16.87,0,0,1,.23-3.84Q141,181.42,152.12,168c.06-.11.12-.11.18-.23a129.53,129.53,0,0,1,31.88-25.88c.06,0,.18-.06.25-.06,12-6.25,23.38-4.13,31.12,5,.06.06,16.11,19.33,23,28.74a366.67,366.67,0,0,1,19.74,30.94c7.9,14.17,2.95,28.68-4.81,34.66l-15.65,12.44c-7.9,6.38-6.86,18.23-6.86,18.23S254.15,359.57,340.76,381.68Z",
            viewBox: "0 0 631.99 666.43",
            // меню-версия иконки (фиолетовая)
            menuIcon: () => {
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("viewBox", "0 0 631.99 666.43");
                svg.setAttribute("width", "24");
                svg.setAttribute("height", "24");
                
                const paths = [
                    {
                        d: "M560.65,65C544.09,49.72,477.17,1.14,328.11.48c0,0-175.78-10.6-261.47,68C18.94,116.19,2.16,186,.39,272.55S-3.67,521.3,152.68,565.28l.15,0-.1,67.11s-1,27.17,16.89,32.71c21.64,6.72,34.34-13.93,55-36.19,11.34-12.22,27-30.17,38.8-43.89Z",
                        fill: "#fff"
                    },
                    {
                        d: "M525.88,98.77c-14-12.72-74.43-50.69-200.52-51.24,0,0-149.31-9.81-221.79,55.84C63.23,143.2,49.64,202.43,48.15,274.71s-9.21,210.36,123,247.09h0s-.52,102.51-.58,111.52c0,6.3,1,10.61,4.6,11.5,2.59.63,6.47-.71,9.77-4,21.14-21.23,88.82-102.88,88.82-102.88,90.81,5.93,163.06-12,170.83-14.54C462.91,517.51,562,509,578.77,373.54,596.1,233.91,572.4,138.6,525.88,98.77Z",
                        fill: "#7360f2"  // <-- фиолетовая заливка Viber
                    },
                    {
                        d: "M389.47,268.77q-2.46-49.59-50.38-52.09",
                        fill: "none",
                        stroke: "#fff",
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "16.86px"
                    },
                    {
                        d: "M432.72,283.27q1-46.2-27.37-77.2c-19-20.74-45.3-32.16-79.05-34.63",
                        fill: "none",
                        stroke: "#fff",
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "16.86px"
                    },
                    {
                        d: "M477,300.59q-.61-80.17-47.91-126.28t-117.65-46.6",
                        fill: "none",
                        stroke: "#fff",
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round",
                        "stroke-width": "16.86px"
                    },
                    {
                        d: "M340.76,381.68s11.85,1,18.23-6.86l12.44-15.65c6-7.76,20.48-12.71,34.66-4.81A366.67,366.67,0,0,1,437,374.1c9.41,6.92,28.68,23,28.74,23,9.18,7.75,11.3,19.13,5.05,31.13,0,.07-.05.19-.05.25a129.81,129.81,0,0,1-25.89,31.88c-.12.06-.12.12-.23.18q-13.38,11.18-26.29,12.71a17.39,17.39,0,0,1-3.84.24,35,35,0,0,1-11.18-1.72l-.28-.41c-13.26-3.74-35.4-13.1-72.27-33.44a430.39,430.39,0,0,1-60.72-40.11,318.31,318.31,0,0,1-27.31-24.22l-.92-.92-.92-.92h0l-.92-.92c-.31-.3-.61-.61-.92-.92a318.31,318.31,0,0,1-24.22-27.31,430.83,430.83,0,0,1-40.11-60.71c-20.34-36.88-29.7-59-33.44-72.28l-.41-.28a35,35,0,0,1-1.71-11.18,16.87,16.87,0,0,1,.23-3.84Q141,181.42,152.12,168c.06-.11.12-.11.18-.23a129.53,129.53,0,0,1,31.88-25.88c.06,0,.18-.06.25-.06,12-6.25,23.38-4.13,31.12,5,.06.06,16.11,19.33,23,28.74a366.67,366.67,0,0,1,19.74,30.94c7.9,14.17,2.95,28.68-4.81,34.66l-15.65,12.44c-7.9,6.38-6.86,18.23-6.86,18.23S254.15,359.57,340.76,381.68Z",
                        fill: "#fff"
                    }
                ];

                paths.forEach(p => {
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    Object.entries(p).forEach(([key, value]) => {
                        path.setAttribute(key, value);
                    });
                    svg.appendChild(path);
                });

                return svg;
            }
        },
        telegram: {
            path: "M9.78,18.65L10.06,14.42L17.74,7.5C18.08,7.19 17.67,7.04 17.22,7.31L7.74,13.3L3.64,12C2.76,11.75 2.75,11.14 3.84,10.7L19.81,4.54C20.54,4.21 21.24,4.72 20.96,5.84L18.24,18.65C18.05,19.56 17.5,19.78 16.74,19.36L12.6,16.3L10.61,18.23C10.38,18.46 10.19,18.65 9.78,18.65Z",
            viewBox: "0 0 24 24"
        },
        whatsapp: {
            path: "M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z",
            viewBox: "0 0 24 24"
        },
        messages: {
            path: "M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z",
            viewBox: "0 0 24 24"
        },
        messenger: {
            path: "M12,2C6.36,2 2,6.13 2,11.7C2,14.61 3.19,17.14 5.14,18.87C5.3,19 5.4,19.22 5.41,19.44L5.46,21.22C5.5,21.79 6.07,22.16 6.59,21.93L8.57,21.06C8.74,21 8.93,20.97 9.1,21C10,21.27 11,21.4 12,21.4C17.64,21.4 22,17.27 22,11.7C22,6.13 17.64,2 12,2M18,9.46L15.07,14.13C14.6,14.86 13.6,15.05 12.9,14.5L10.56,12.77C10.35,12.61 10.05,12.61 9.84,12.77L6.68,15.17C6.26,15.5 5.71,15 6,14.54L8.93,9.87C9.4,9.14 10.4,8.95 11.1,9.47L13.44,11.23C13.66,11.39 13.95,11.39 14.16,11.23L17.32,8.83C17.74,8.5 18.29,9 18,9.46Z",
            viewBox: "0 0 24 24"
        },
        email: {
            path: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z",
            viewBox: "0 0 24 24"
        }
    };

    // Создание контейнера
    const widget = document.createElement("div");
    widget.style.position = "fixed";
    widget.style.bottom = "30px";
    widget.style.right = "309px";
    widget.style.zIndex = "9999";
    widget.style.fontFamily = "Arial, sans-serif";

    // Адаптация для планшетов и мобильных (<= 1082px)
    if (window.innerWidth <= 1082) {
        widget.style.bottom = "152px";
        widget.style.right = "11px";
    }

    // Иконка виджета
    const icon = document.createElement("div");
    Object.assign(icon.style, {
        backgroundColor: "#269663",
        width: "56px",
        height: "56px",
        borderRadius: "20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.2s, box-shadow 0.2s",
        color: "white",
        fontSize: "9px",
        textAlign: "center",
        overflow: "hidden"
    });

    // Анимация
    const animationContent = document.createElement("div");
    Object.assign(animationContent.style, {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    });

    const animatedElement = document.createElement("div");
    Object.assign(animatedElement.style, {
        position: "absolute",
        transition: "opacity 0.5s ease",
        whiteSpace: "normal",
        wordWrap: "break-word",
        width: "100%",
        padding: "0 5px",
        fontSize: "9px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "2px"
    });

    const animationSequence = [
        createIconSVG(icons.viber.path, icons.viber.viewBox),
        createIconSVG(icons.telegram.path, icons.telegram.viewBox),
        createIconSVG(icons.messenger.path, icons.messenger.viewBox),
        createIconSVG(icons.email.path, icons.email.viewBox),
        "Зв'язатись з Теплорі"
    ];

    let currentIndex = 0;
    let animationInterval = setInterval(animateIcon, 2000);

    function animateIcon() {
        currentIndex = (currentIndex + 1) % animationSequence.length;
        animatedElement.style.opacity = "0";
        
        setTimeout(() => {
            animatedElement.innerHTML = '';
            if (typeof animationSequence[currentIndex] === 'string') {
                animatedElement.textContent = animationSequence[currentIndex];
            } else {
                const current = animationSequence[currentIndex];
if (typeof current === 'string') {
  animatedElement.textContent = current;
} else {
  animatedElement.appendChild(current.cloneNode(true));
}
            }
            animatedElement.style.opacity = "1";
        }, 500);
    }

    // Обработчики событий для десктопов (>1024px)
    if (window.innerWidth > 1024) {
        icon.addEventListener("mouseover", () => {
            clearInterval(animationInterval);
            animatedElement.innerHTML = "Зв'язатись з Теплорі";
            animatedElement.style.opacity = "1";
            icon.style.transform = "scale(1.1)";
            icon.style.boxShadow = "0 6px 8px rgba(0, 0, 0, 0.2)";
        });

        icon.addEventListener("mouseout", () => {
            clearInterval(animationInterval); // Очищаем предыдущий интервал
            currentIndex = animationSequence.length - 1;
            animateIcon();
            animationInterval = setInterval(animateIcon, 2000);
            icon.style.transform = "scale(1)";
            icon.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
        });
    }

    animationContent.appendChild(animatedElement);
    icon.appendChild(animationContent);

    // Меню
    const menu = document.createElement("div");
    Object.assign(menu.style, {
        display: "none",
        position: "absolute",
        bottom: "70px",
        right: "0",
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        width: "200px",
        padding: "10px"
    });

    // Крестик для меню
    const menuCloseButton = document.createElement("div");
    Object.assign(menuCloseButton.style, {
        position: "absolute",
        top: "-2px",
        right: "-3px",
        width: "22px",
        height: "22px",
        cursor: "pointer",
        backgroundColor: "white",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        zIndex: "1"
    });
    menuCloseButton.appendChild(closeIcon());
    menu.appendChild(menuCloseButton);

    // Функция управления меню
    let isMenuOpen = false;
    const toggleMenu = (state) => {
        isMenuOpen = state;
        menu.style.display = state ? "block" : "none";
        
        if (state) {
            if (window.innerWidth <= 1024) {
                clearInterval(animationInterval);
                animatedElement.style.opacity = "1";
            }
            animatedElement.innerHTML = '';
            const closeBtn = closeIcon();
            closeBtn.style.color = "white";
            animatedElement.appendChild(closeBtn);
        } else {
            clearInterval(animationInterval); // Очищаем предыдущий интервал
            currentIndex = animationSequence.length - 1;
            animateIcon();
            animationInterval = setInterval(animateIcon, 2000);
        }
    };

    // Обработчик клика на иконку
    icon.addEventListener("click", function(e) {
        e.stopPropagation();
        
        if (window.innerWidth <= 1024) {
            if (!isMenuOpen) {
                toggleMenu(true);
            }
        } else {
            toggleMenu(!isMenuOpen);
        }
    });

    // Обработчик клика по документу
    document.addEventListener("click", function(e) {
        if (!widget.contains(e.target)) {
            toggleMenu(false);
        }
    });

    // Обработчик клика на кружок анимации (если меню открыто)
    animatedElement.addEventListener("click", function(e) {
        if (isMenuOpen) {
            e.stopPropagation();
            toggleMenu(false);
        }
    });

    // Обработчик клика на крестик меню
    menuCloseButton.addEventListener("click", function(e) {
        e.stopPropagation();
        toggleMenu(false);
    });

    // Элементы меню
    const items = [
        { text: "Зателефонувати", href: "tel:+380636018189", icon: icons.phone },
        { text: "Viber", href: "viber://chat?number=+380975668321", icon: icons.viber },
        { text: "Telegram", href: "https://t.me/teplorry_com_ua", icon: icons.telegram },
        { text: "WhatsApp", href: "https://wa.me/380975668321", icon: icons.whatsapp },
        { text: "Apple Messages", href: "imessage://maksymmaievskyi@icloud.com", icon: icons.messages },
        { text: "Facebook Messenger", href: "https://m.me/teplorry", icon: icons.messenger },
        { text: "Email", href: "mailto:teplorry@gmail.com", icon: icons.email }
    ];

    items.forEach(({ text, href, icon }) => {
        const item = document.createElement("a");
        Object.assign(item.style, {
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "#333",
            padding: "8px 10px",
            borderBottom: "1px solid #f0f0f0",
            transition: "background 0.2s"
        });
        item.href = href;
        item.target = "_blank";

        item.addEventListener("mouseover", () => item.style.background = "#f8f8f8");
        item.addEventListener("mouseout", () => item.style.background = "transparent");

        const iconElement = (text === "Viber" && icons.viber.menuIcon)
            ? icons.viber.menuIcon() 
            : createIconSVG(icon.path, icon.viewBox);

        // Если это НЕ viber, даём цвет из brandColors
        if (text !== "Viber") {
            iconElement.style.color = brandColors[text] || "#333";
        }
        
        Object.assign(iconElement.style, {
            marginRight: "10px",
            width: "24px",
            height: "24px",
            flexShrink: "0"
        });

        item.appendChild(iconElement);
        item.appendChild(document.createTextNode(text));
        menu.appendChild(item);
    });

    // Убираем нижнюю границу у последнего пункта
    if (menu.lastChild) {
        menu.lastChild.style.borderBottom = "none";
    }

    // Сборка виджета
    widget.appendChild(icon);
    widget.appendChild(menu);
    document.body.appendChild(widget);

    // --------------------------------------------
    // 2. Динамическое отслеживание (только для ПК)
    //    * По тексту в #bwc-widget-action
    // --------------------------------------------
    if (window.innerWidth > 1024) {
        let lastState = null; // "online" или "offline"

        // Функция проверяет текст и возвращает "online"/"offline" или null
        function getChatStateByText(chatEl) {
            // В чате ищем элементы: .bwc-invitations span
            const spans = chatEl.querySelectorAll('.bwc-invitations span');
            if (!spans || spans.length === 0) return null;

            let combined = '';
            spans.forEach(s => { combined += s.textContent.trim() + ' '; });
            combined = combined.trim();

            // Проверяем ключевые слова:
            // Онлайн: "Ми на зв'язку" / "та готові допомогти!"
            // Оффлайн: "Потрібна допомога?" / "Залиште повідомлення"
            // Можете расширить логику, если нужен более точный поиск
            if (combined.includes('Ми на зв\'язку') || combined.includes('готові допомогти')) {
                return 'online';
            }
            if (combined.includes('Потрібна допомога') || combined.includes('Залиште повідомлення')) {
                return 'offline';
            }
            return null;
        }

        function setWidgetPosition(state) {
            // Для online => 309px, иначе => 325px
            const newRight = (state === 'online') ? '309px' : '325px';
            if (widget.style.right !== newRight) {
                widget.style.right = newRight;
            }
        }

        // Смотрим текст и обновляем положение, если состояние чата реально изменилось
        function updatePositionIfNeeded(el) {
            const newState = getChatStateByText(el);
            if (!newState) return; // не удалось определить текст — не меняем

            if (newState !== lastState) {
                lastState = newState;
                setWidgetPosition(newState);
            }
        }

        function observeChatElement(chatEl) {
            // Сразу проверим при старте
            updatePositionIfNeeded(chatEl);

            const chatObserver = new MutationObserver(() => {
                // При любом изменении внутри chatEl снова проверяем текст
                updatePositionIfNeeded(chatEl);
            });
            chatObserver.observe(chatEl, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }

        // Ждём появления #bwc-widget-action в DOM
        const bodyObserver = new MutationObserver((mutations, obs) => {
            const chatEl = document.getElementById("bwc-widget-action");
            if (chatEl) {
                obs.disconnect();
                observeChatElement(chatEl);
            }
        });
        bodyObserver.observe(document.body, { childList: true, subtree: true });

        // Если чат уже есть
        const existingChat = document.getElementById("bwc-widget-action");
        if (existingChat) {
            bodyObserver.disconnect();
            observeChatElement(existingChat);
        }
    }
});

// === script #13 (length=1162) ===
/**
 * Скрипт откладывает загрузку фонового изображения футера,
 * чтобы ускорить первоначальную загрузку страницы и улучшить метрику LCP.
 * 
 * Механика:
 * - Ждёт появления футера в зоне видимости (или почти в зоне).
 * - Затем устанавливает фон через style.backgroundImage.
 * - Фоновое изображение задаётся вручную внутри скрипта.
 */
document.addEventListener("DOMContentLoaded", function () {
    const footer = document.querySelector(".footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    footer.style.backgroundImage = "url('https://teplorry.com.ua/images/editor/4/bg_(2).webp')";
                    footer.style.backgroundSize = "cover";
                    footer.style.backgroundPosition = "center";
                    footer.style.backgroundRepeat = "no-repeat";
                    obs.unobserve(footer);
                }
            });
        },
        { rootMargin: "300px 0px" } // предварительная подгрузка
    );

    observer.observe(footer);
});

// === script #14 (length=641) ===
(function() {
  function setIconSizes() {
    const icons = document.querySelectorAll('img.installments-button__icon');

    icons.forEach(img => {
      if (!img.hasAttribute('width')) img.setAttribute('width', '24');
      if (!img.hasAttribute('height')) img.setAttribute('height', '24');
    });
  }

  // Запуск сразу после загрузки DOM
  document.addEventListener('DOMContentLoaded', setIconSizes);

  // Повторная установка при динамической подгрузке
  const observer = new MutationObserver(() => {
    setIconSizes();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
