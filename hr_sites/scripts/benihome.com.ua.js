// source: https://benihome.com.ua/
// extracted: 2026-05-07T21:20:54.975Z
// scripts: 1

// === script #1 (length=20698) ===
////////


  
  ;(function($){
    // вспомогательные функции
    function detectLang(){
      var htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
      if (htmlLang.startsWith('en')) return 'en';
      if (htmlLang.startsWith('uk') || htmlLang.startsWith('ua')) return 'uk';
      return 'ru';
    }
    function initSwiperConfig(){
      (function waitAndConfig(){
        var sw = window.App && window.App.productCarousel && window.App.productCarousel.swiper;
        if (!sw || !sw.params) return setTimeout(waitAndConfig, 100);
        $.extend(sw.params, {
          centeredSlides: true,
          centeredSlidesBounds: true,
          spaceBetween: 10,
          loop: false,
          freeMode: false,
          freeModeMomentum: false,
          slidesPerView: 1.2,
          preloadImages: true
        });
        if (sw.params.lazy) sw.params.lazy.enabled = false;
        sw.update();
        if (typeof sw.preloadImages === 'function') sw.preloadImages();
      })();
    }

    function initDeliveryDate(){
      var selectors = [
        //"#main > div > section > div.product__grid > div.product__column.product__column--right.product__column--sticky > div > div:nth-child(1) > div > div:nth-child(6)",
       // "#page > main > div > div.product__grid > div.product__column.product__column--right > div.product__block.product__block--orderBox.j-product-block > div > div.product-card.product-card--main > div"
      ];
      var d = new Date(); d.setDate(d.getDate() + 4);
      var dd = ("0"+d.getDate()).slice(-2),
              mm = ("0"+(d.getMonth()+1)).slice(-2),
              yyyy = d.getFullYear(),
              datestr = dd + "." + mm + "." + yyyy,
              prefix =
               detectLang() === 'en'
                 ? 'Estimated delivery date in Ukraine'
                 : detectLang() === 'uk'
                   ? 'Орієнтовна дата доставки в Україні'
                   : 'Ориентировочная дата доставки в Украине';

      selectors.forEach(function(sel){
        var $ref = $(sel).first();
        if (!$ref.length) return;
        $('<div class="product__group-item j-product-block"><div class="product__section mb-0"><span class="delivery-date">'+ prefix +' <strong>'+ datestr +'</strong></span></div></div>')
                .insertAfter($ref);
      });
    }







    function initMarquee(){
    var locale = detectLang();

    var phrases =
      locale === 'en'
        ? ['Import VAT and handling fee payable upon delivery', 'Individually tailored', 'Crafted from natural fabrics']
        : locale === 'uk'
          ? ['Індивідуальне пошиття', 'Гарантія 300 прань', 'Безкоштовна доставка від 150€/6000uah.']
          : ['Индивидуальный пошив', 'Гарантия 300 стирок', 'Бесплатная доставка от 150€/6000uah'];

      var $wrapper = $('<div class="marquee-wrapper">'),
              $inner   = $('<div class="marquee-inner">');

      for (var i = 0; i < 5; i++) {
        phrases.forEach(function(text){
          $('<div>').addClass('marquee-text').text(text).appendTo($inner);
        });
      }

      $wrapper.append($inner);
      $('.header__top').after($wrapper.clone(true));
      $('#header').after($wrapper.clone(true));
    }

// функція для підключення CSS
    function loadCSS(href) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }

/// сразу подключаем Slick CSS/JS и инициализируем слайдеры
    $('<link>', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.css' }).appendTo('head');
    $('<link>', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick-theme.css' }).appendTo('head');
    $('<script>', { src: 'https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js' })
            .on('load', function(){
              console.log(' сразу подключаем Slick CSS/JS и инициализируем слайдеры');
              $('#reviews .reviews__list').slick({
                infinite: true,
                slidesToShow: 3,
                slidesToScroll: 1,
                arrows: false,
                dots: true,
                prevArrow: '<button class="slick-prev" type="button"></button>',
                nextArrow: '<button class="slick-next" type="button"></button>',
                responsive: [
                  { breakpoint: 992, settings: { slidesToShow: 2 } },
                  { breakpoint: 576, settings: { slidesToShow: 1 } }
                ]
              });


              [
                '#page > main > div > div.product__bottom > div.product__group.product__group--tabs > div > div.tabs__body > div > div:nth-child(6) > div > p',
                '#main > div > section > div.product__grid > div.product__column.product__column--left.product__column--sticky > div > div:nth-child(2) > div > div:nth-child(5) > div > div > p'
              ].forEach(function(sel){
                var $node = $(sel).first();
                if (!$node.length) return;
                var $imgs = $node.find('img');
                if (!$imgs.length) return;

                var $wrapper2 = $('<div class="custom-slider">');
                $imgs.each(function(){
                  $wrapper2.append($('<div>').append($(this)));
                });
                $node.empty().append($wrapper2);
                $wrapper2.slick({
                  infinite: true,
                  slidesToShow: 3,
                  slidesToScroll: 1,
                  dots: true,
                  arrows: false,
                  autoplay: false,
                  responsive: [
                    { breakpoint: 768, settings: { slidesToShow: 2 } },
                    { breakpoint: 480, settings: { slidesToShow: 1 } }
                  ]
                });
              });
            })
            .appendTo('head');


    $(function(){
      initSwiperConfig();
      initDeliveryDate();
      initMarquee();
    });

  })(jQuery);

  (function(){
    // помечаем страницу
    document.body.classList.add('custom-slick-page');

    // подгружаем стили
    ['https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.css',
      'https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick-theme.css'
    ].forEach(function(href){
      if (!document.querySelector('link[href="'+href+'"]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
      }
    });

    // кастомные стили
    const css = `
    body.custom-slick-page .text ul li::before { content:""; }
    body.custom-slick-page .slick-prev::before,
    body.custom-slick-page .slick-next::before { color:#000!important; }
    body.custom-slick-page .slick-slide { display:flex!important; align-items:center!important; justify-content:center!important; }
    body.custom-slick-page .slick-prev { left:0!important; z-index:10!important; }
    body.custom-slick-page .slick-next { right:0!important; z-index:10!important; }
  `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // загрузка jQuery + Slick и старт
    function loadScript(src, cb){
      const s = document.createElement('script');
      s.src = src;
      s.onload = cb;
      document.head.appendChild(s);
    }

    function init(){
      var $ = window.jQuery;
      // ждём появления контейнера
      function tryInit(){
        var $list = $('#reviews .reviews__list');
        if (!$list.length) {
          return setTimeout(tryInit, 200);
        }
        // если уже был
        if ($list.hasClass('slick-initialized')) {
          $list.slick('unslick');
        }
        $list.slick({
          infinite: true,
          slidesToShow: 3,
          slidesToScroll: 1,
          arrows: false,
          dots: true,
          prevArrow: '<button type="button" class="slick-prev"></button>',
          nextArrow: '<button type="button" class="slick-next"></button>',
          responsive: [
            { breakpoint: 992, settings: { slidesToShow: 2 } },
            { breakpoint: 576, settings: { slidesToShow: 1 } }
          ]
        });
        // форс-обновление
        $list.slick('refresh');
      }
      //tryInit();
    }

    if (!window.jQuery) {
      loadScript('https://code.jquery.com/jquery-3.6.0.min.js', function(){
        loadScript('https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js', init);
      });
    } else {
      loadScript('https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js', init);
    }

  })();

  ;(function(){
    function detectLang(){
      var htmlLang = document.documentElement.getAttribute('lang');
      return htmlLang && htmlLang.toLowerCase().startsWith('uk') ? 'uk' : 'ru';
    }

    const uaDataUrl = 'https://gist.githubusercontent.com/Laxarevii/6d99a288180ace21421191c6b053a9c2/raw/a38c4bddaa2d15e6cde4c3849a8e640a54963ba5/items-colored-links-ua.json';

    const ruDataUrl = 'https://gist.githubusercontent.com/Laxarevii/104db186fe9da9dc8ab944a0df61aa35/raw/9cdf74d4900149062817f6de034536f5762cda3d/items-colored-links-ru.json';

    const locale = detectLang();
    const dataUrl = locale === 'uk' ? uaDataUrl : ruDataUrl;
    const labelText =
      locale === 'en' ? 'Color' :
      locale === 'uk' ? 'Колір' : 'Цвет';

    console.log(dataUrl);
    const primaryTitleSel  = '#main > div > section > div.product__grid > div.product__column.product__column--right.product__column--sticky > div > div:nth-child(1) > div > div:nth-child(1) h1';
    const fallbackTitleSel = '#page > main > div > div.product__top > div > div > div > h1';
    const containerSelectors = [
      '#main > div > section > div.product__grid > div.product__column.product__column--right.product__column--sticky > div > div:nth-child(1) > div > div:nth-child(5)',
      '#page > main > div > div.product__grid > div.product__column.product__column--right > div.product__block.product__block--modifications.j-product-block'
    ];

    fetch(dataUrl)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => {
              const h1el = document.querySelector(primaryTitleSel) || document.querySelector(fallbackTitleSel);
              if (!h1el) return;
              const title = h1el.textContent.trim();

              // Найти запись "два ..." динамически (для обеих локализаций)
              let twoEntry;
              for (const group of data) {
                for (const key in group) {
                  if (/два\s/i.test(key)) {
                    twoEntry = { group, key };
                    break;
                  }
                }
                if (twoEntry) break;
              }

              let colors;
              if (title.includes('&') && twoEntry) {
                colors = twoEntry.group[twoEntry.key].colors;
              }
              if (!colors) {
                for (const group of data) {
                  for (const key in group) {
                    if (title.startsWith(key)) {
                      colors = group[key].colors;
                      break;
                    }
                  }
                  if (colors) break;
                }
              }

              if (!colors || Object.keys(colors).length === 0) return;

              containerSelectors.forEach(sel => {
                const container = document.querySelector(sel);
                if (!container) return;

                const label = document.createElement('div');
                label.className = 'color-label modification__title';
                label.textContent = labelText;
                container.insertBefore(label, container.firstChild);

                const wrapper = document.createElement('div');
                wrapper.id = 'color-icons-wrapper-gist';

                Object.entries(colors).forEach(([color, info]) => {
                  const a = document.createElement('a');
                  a.href = info.url;
                  a.title = color;
                  a.className = 'color-icon-link';

                  const img = document.createElement('img');
                  img.src = info.img;
                  img.alt = color;
                  img.width = 45;
                  img.height = 45;
                  img.className = 'color-icon-img';

                  a.appendChild(img);
                  wrapper.appendChild(a);
                });

                container.insertBefore(wrapper, label.nextSibling);
              });
            })
            .catch(() => {});
  })();

  (function($){
    function mapReviewImages(){
      return;
      var mapping = {
        "все понравилось, благодарю": "/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-86498242590995_+da0bf3dc68.jpg",
        "дякую": "/content/images/43/666x1000l80tr20/copy_prostyradlo-z-tkanyny-satyn-blush-petal-89282711835894.webp",
        "замовляв самовивіз в дніпрі": "/content/images/26/666x1000l80tr20/copy_prostyradlo-varena-bavovna-cloud-48116799106451.webp",
        "усім рекомендую цей магазин": "/content/images/43/666x1000l80tr20/copy_prostyradlo-z-tkanyny-satyn-blush-petal-89282711835894.webp"
      };

      // Объединяем оба селектора в один
      var $reviews = $('.p-review__content, div.review-item__body > p');
      if (!$reviews.length) {
        console.log('mapReviewImages: ни одного отзыва не найдено, выход.');
        return;
      }

      console.log(`mapReviewImages: найдено ${$reviews.length} элементов с отзывами`);

      $reviews.each(function(){
        var $p = $(this);
        var text = $p.text().trim().toLowerCase();
        console.log(`mapReviewImages: проверяю текст «${text}»`);

        // Ищем ключ, который содержится в тексте
        var matchedKey = Object.keys(mapping).find(function(key){
          return text.includes(key);
        });

        if (!matchedKey) {
          console.log(`mapReviewImages: нет совпадений для «${text}»`);
          return;
        }

        console.log(`mapReviewImages: совпало с «${matchedKey}», вставляю картинку`);
        var $imgContainer = $('<div class="p-review__image-container">')
                .append(
                        $('<img>')
                                .attr('src', mapping[matchedKey])
                                .attr('alt', matchedKey)
                );

        $p.after($imgContainer);
      });

      console.log('mapReviewImages: завершено');
    }

    // Запускаем после загрузки DOM
    $(document).ready(mapReviewImages);
    (async function() {
      try {
        // ТУТ МЕНЯТЬ ФОТО ГАЛЕРЕИ
        const images = [
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-86498242590995_+da0bf3dc68.jpg",
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-60046517875129_+66b4bd0aee.jpg",
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-16160332287616_+c4872a18b5.jpg",
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-96920843064828_+883a493b90.jpg",
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-71026501419955_+0b22c5afeb.jpg",
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-59959247193777_+25cd1c88af.jpg",
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-41622539810915_+a5bd96d063.jpg",
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-20705561868919_+49a61384d9.jpg",
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-39146660102649_+7db538953c.jpg",
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-45662866946476_+261a012ae8.jpg",
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-54344096685905_+1986a34da9.jpg",
"/content/images/36/copy_postilna-bilyzna-satyn-z-riushamy-ta-kantom-beni-41721944593286_+834a918846.jpg"
];

        const perSlide  = 2;
        const MIN_SLIDES = 3;
        const slideCount = Math.max(Math.ceil(images.length / perSlide), MIN_SLIDES);

        const slides = Array.from({ length: slideCount }, (_, i) => [
          images[(i * perSlide)     % images.length],
          images[(i * perSlide + 1) % images.length]
        ]);

        function initSlider(root) {
          // очищаем содержимое контейнера
          root.innerHTML = '';

          // создаём обёртку Swiper
          const container = document.createElement('div');
          container.classList.add('swiper-container', 'benihome-slider');

          const wrapper = document.createElement('div');
          wrapper.classList.add('swiper-wrapper');
          container.appendChild(wrapper);

          // наполняем слайдами
          slides.forEach(imgs => {
            const slideEl = document.createElement('div');
            slideEl.classList.add('swiper-slide', 'slider-item');

            const imgsContainer = document.createElement('div');
            imgsContainer.classList.add('slide-images');

            imgs.forEach(src => {
              const img = document.createElement('img');
              img.src = src;
              img.loading = 'lazy';
              img.alt = '';
              imgsContainer.appendChild(img);
            });

            slideEl.appendChild(imgsContainer);
            wrapper.appendChild(slideEl);
          });

          // навигационные кнопки
          const prev = document.createElement('div');
          prev.classList.add('swiper-button-prev', 'slider-button', 'slider-prev');
          const next = document.createElement('div');
          next.classList.add('swiper-button-next', 'slider-button', 'slider-next');
          container.append(prev, next);

          // вставляем в корень
          root.appendChild(container);

          // инициализируем Swiper
          new Swiper(container, {
            slidesPerView: MIN_SLIDES,
            spaceBetween: parseInt(getComputedStyle(document.documentElement)
                    .getPropertyValue('--slide-gap') || '8'),
            loop: true,
            navigation: { prevEl: prev, nextEl: next },
          });
        }

        const selectors = [
          '.tabs__wrapper[data-content-id$="satin-0"] .text',
          '#main > div > section > div.product__bottom > div:nth-child(2) > div > div:nth-child(2) > div > div',
          '#page > main > div > div.product__bottom > div.product__block.product__block--raw.j-product-block > div:nth-child(2) > div',
          'div[data-content-id$="foto-galereja-vіdgukіv-0"]',

        ];

        selectors.forEach(sel => {
          const root = document.querySelector(sel);
          if (root) initSlider(root);
        });

        // Создаём новый div в секции about и инициализируем там слайдер
        const aboutSection = document.querySelector('#page > main > section.about > div');
        if (aboutSection) {
          // Создаём новый div для слайдера
          const sliderDiv = document.createElement('div');
          sliderDiv.classList.add('benihome-gallery-slider'); // добавляем класс для идентификации

          // Добавляем div в секцию
          aboutSection.appendChild(sliderDiv);

          // Инициализируем слайдер в новом div
          initSlider(sliderDiv);
        }

// Главная галерея
        const frontInfoSection = document.querySelector('#main > section.frontInfo');
        if (frontInfoSection) {
          // Создаём обёртку
          const wrapperDiv = document.createElement('div');
          wrapperDiv.classList.add('benihome-gallery-wrapper');

          // Создаём новый div для слайдера
          const sliderDiv = document.createElement('div');
          sliderDiv.classList.add('benihome-gallery-slider');

          // Вкладываем слайдер в обёртку
          wrapperDiv.appendChild(sliderDiv);

          // Добавляем обёртку в секцию
          frontInfoSection.appendChild(wrapperDiv);

          // Инициализируем слайдер внутри sliderDiv
          initSlider(sliderDiv);
        }


      } catch (e) {
        console.error('Slider error:', e);
      }
    })();


  })(jQuery);
