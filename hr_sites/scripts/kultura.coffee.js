// source: https://kultura.coffee/
// extracted: 2026-05-07T21:19:20.699Z
// scripts: 4

// === script #1 (length=9569) ===
(function(){
  'use strict';

  var initialized = false;

  function init(){
    if (initialized) return;
    initialized = true;

    var root = document.getElementById('kc-blog-home');
    if (!root) return;

    var list = root.querySelector('.js-kc-blog-list');
    if (!list) return;

    var placeholder = root.querySelector('.kc-blog__placeholder');
    var moreWrap = root.querySelector('.kc-blog__more-wrap');
    var moreBtn = root.querySelector('.kc-blog__more');
    var allLinkEl = root.querySelector('.kc-blog__all-link');

    var isRu = location.pathname.indexOf('/ru/') === 0;
    var BLOG_URL = isRu ? '/ru/kultura-coffee-blog/' : '/kultura-coffee-blog/';
    var BATCH_SIZE = 3;

    // локализация коротких текстов
    if (isRu){
      if (placeholder) placeholder.textContent = 'Загружаем статьи…';
      if (moreBtn) moreBtn.textContent = 'Показать ещё статьи';
      if (allLinkEl){
        allLinkEl.textContent = 'Смотреть все статьи блога →';
        allLinkEl.href = BLOG_URL;
      }
    } else {
      if (placeholder) placeholder.textContent = 'Завантажуємо статті…';
      if (moreBtn) moreBtn.textContent = 'Показати ще статті';
      if (allLinkEl){
        allLinkEl.textContent = 'Дивитися всі статті блогу →';
        allLinkEl.href = BLOG_URL;
      }
    }

    var allItems = [];
    var renderedCount = 0;

    function escapeHtml(str){
      if (!str) return '';
      return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
    }

    function trimSpaces(str){
      if (!str) return '';
      return String(str).replace(/\s+/g,' ').trim();
    }

    function normalizeUrl(href){
      if (!href) return '#';
      href = href.trim();
      if (href.indexOf('http://') === 0 || href.indexOf('https://') === 0) return href;
      if (href.charAt(0) !== '/') href = '/' + href;
      return href;
    }

    function pickBestImage(imgNode){
      if (!imgNode) return '';

      var srcset = imgNode.getAttribute('data-srcset') ||
                   imgNode.getAttribute('srcset');
      var src = '';

      if (srcset){
        var parts = srcset.split(',');
        var first = parts[0].trim().split(' ')[0];
        src = first;
      } else {
        src = imgNode.getAttribute('data-src') ||
              imgNode.getAttribute('src') || '';
      }

      if (!src) return '';
      if (src.indexOf('http') !== 0){
        if (src.charAt(0) !== '/') src = '/' + src;
        src = location.origin + src;
      }
      return src;
    }

    function createCard(it){
      var card = document.createElement('article');
      card.className = 'kc-blog-card';

      var imgHtml = '';
      if (it.img){
        imgHtml =
          '<div class="kc-blog-card__img-wrap">' +
            '<img class="kc-blog-card__img" loading="lazy" src="' + escapeHtml(it.img) + '" alt="' + escapeHtml(it.title) + '">' +
          '</div>';
      }

      var bodyHtml =
        '<div class="kc-blog-card__body">' +
          (it.date ? '<div class="kc-blog-card__date">' + escapeHtml(it.date) + '</div>' : '') +
          '<h3 class="kc-blog-card__title">' + escapeHtml(it.title) + '</h3>' +
          (it.excerpt ? '<p class="kc-blog-card__excerpt">' + escapeHtml(it.excerpt) + '</p>' : '') +
        '</div>';

      card.innerHTML =
        '<a class="kc-blog-card__link" href="' + escapeHtml(it.url) + '">' +
          imgHtml + bodyHtml +
        '</a>';

      return card;
    }

    function renderMore(){
      if (!list || !allItems.length) return;

      var next = allItems.slice(renderedCount, renderedCount + BATCH_SIZE);
      if (!next.length) return;

      for (var i = 0; i < next.length; i++){
        list.appendChild(createCard(next[i]));
      }

      renderedCount += next.length;

      if (renderedCount >= allItems.length && moreWrap){
        moreWrap.style.display = 'none';
      }
    }

    function showEmpty(){
      if (!list) return;
      var text = isRu
        ? 'Пока нет статей для отображения. Загляните в блог →'
        : 'Поки немає статей для відображення. Загляньте в блог →';
      list.innerHTML = '<div class="kc-blog__empty">' + escapeHtml(text) + '</div>';
      if (moreWrap) moreWrap.style.display = 'none';
    }

    function parseDesktopEntries(doc){
      var items = [];
      var nodes = doc.querySelectorAll('.entries-list .entries-i');
      if (!nodes.length) return items;

      nodes.forEach(function(li){
        var linkNode = li.querySelector('.entries-i-title a');
        if (!linkNode) return;

        var href = normalizeUrl(linkNode.getAttribute('href') || '');
        var titleNode = li.querySelector('.entries-i-title .a-link') || linkNode;
        var title = trimSpaces(titleNode.textContent || '');
        if (!title) return;

        var dateNode = li.querySelector('.entries-i-date');
        var dateText = dateNode ? trimSpaces(dateNode.textContent || '') : '';

        var imgNode = li.querySelector('.entries-i-image img');
        var imgSrc = pickBestImage(imgNode);

        var excerptNode = li.querySelector('.entries-i-text, .entries-i-desc');
        var excerpt = excerptNode ? trimSpaces(excerptNode.textContent || '') : '';

        items.push({
          url: href,
          title: title,
          date: dateText,
          img: imgSrc,
          excerpt: excerpt
        });
      });

      return items;
    }

    function parseMobileEntries(doc){
      var items = [];
      var cards = doc.querySelectorAll('.blog__item .article-card, .article-card');
      if (!cards.length) return items;

      cards.forEach(function(card){
        var linkNode = card.querySelector('.article-card__link') ||
                       card.querySelector('a.article-card__image') ||
                       card.querySelector('a');
        if (!linkNode) return;

        var href = normalizeUrl(linkNode.getAttribute('href') || '');
        var title = trimSpaces(linkNode.textContent || '');
        if (!title) return;

        var dateNode = card.querySelector('.article-card__date');
        var dateText = dateNode ? trimSpaces(dateNode.textContent || '') : '';

        var imgNode = card.querySelector('.article-card__img, .image__src, img');
        var imgSrc = pickBestImage(imgNode);

        items.push({
          url: href,
          title: title,
          date: dateText,
          img: imgSrc,
          excerpt: ''
        });
      });

      return items;
    }

    function parseFallbackEntries(doc){
      var items = [];
      var rootNode = doc.querySelector('.blog, .entries, main') || doc;
      var links = rootNode.querySelectorAll('a');
      var map = {};

      links.forEach(function(a){
        var href = a.getAttribute('href') || '';
        var text = trimSpaces(a.textContent || '');
        if (!href || !text) return;
        if (href.indexOf('#') === 0) return;
        if (href.indexOf('http') === 0 && href.indexOf(location.origin) !== 0) return;
        if (/katalog|contacts|calculator|oplata|dostavka|garantiya|obmen|vozvrat|mapa-sajtu/i.test(href)) return;
        if (text.length < 18 || text.length > 110) return;

        href = normalizeUrl(href);
        if (map[href]) return;

        map[href] = {
          url: href,
          title: text,
          date: '',
          img: '',
          excerpt: ''
        };
      });

      Object.keys(map).forEach(function(key){
        items.push(map[key]);
      });

      return items;
    }

    function parseArticles(html){
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');

      var items = parseDesktopEntries(doc);
      if (items.length) return items;

      items = parseMobileEntries(doc);
      if (items.length) return items;

      return parseFallbackEntries(doc);
    }

    fetch(BLOG_URL, { credentials:'omit' })
      .then(function(resp){
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.text();
      })
      .then(function(text){
        var items = parseArticles(text);
        if (!items || !items.length){
          showEmpty();
          return;
        }

        allItems = items;
        if (placeholder) placeholder.remove();
        list.innerHTML = '';

        if (allItems.length > BATCH_SIZE){
          if (moreWrap) moreWrap.style.display = 'flex';
        } else if (moreWrap){
          moreWrap.style.display = 'none';
        }

        renderedCount = 0;
        renderMore();

        if (moreBtn){
          moreBtn.onclick = renderMore;
        }
      })
      .catch(function(){
        showEmpty();
      });
  }

  /* === v2: завантажуємо блог тільки коли блок наближається до viewport === */
  var target = document.getElementById('kc-blog-home');
  if (target && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) { io.disconnect(); init(); }
    }, { rootMargin: '400px' });
    io.observe(target);
  } else {
    /* fallback для старих браузерів — як було раніше */
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();

// === script #2 (length=9841) ===
(function(){
  'use strict';

  function initReviews(){
    var root = document.getElementById('kc-reviews-home');
    if (!root) return;

    var FEED_URL = 'https://kultura.coffee/marketplace-integration/google-review-feed/99316ff6939fb66bd89b5c891be0eb83?langId=3';
    var minRating = parseFloat(root.getAttribute('data-min-rating') || '5');
    var list = root.querySelector('.js-kc-reviews-list');

    var isRu = location.pathname.indexOf('/ru/') === 0;

    var texts = isRu ? {
      title: 'Отзывы покупателей Kultura Coffee',
      ratingLoading: 'Загружаем оценку…',
      countLoading: 'Загружаем количество отзывов…',
      note: 'Свежие отзывы от реальных заказов на kultura.coffee. Данные обновляются автоматически.',
      listLoading: 'Загружаем свежие отзывы…',
      btnMore: 'Показать ещё отзывы',
      buyer: 'Покупатель Kultura Coffee',
      summaryRatingPrefix: 'Средняя оценка: ',
      summaryRatingSuffix: ' из 5',
      summaryCountPrefix: 'на основе ',
      summaryCountSuffix: ' отзывов',
      ariaRatingLabelPrefix: 'Оценка ',
      ariaRatingLabelSuffix: ' из 5'
    } : {
      title: 'Відгуки покупців Kultura Coffee',
      ratingLoading: 'Завантажуємо оцінку…',
      countLoading: 'Завантажуємо кількість відгуків…',
      note: 'Свіжі відгуки від реальних замовлень на kultura.coffee. Дані оновлюються автоматично.',
      listLoading: 'Завантажуємо свіжі відгуки…',
      btnMore: 'Показати ще відгуки',
      buyer: 'Покупець Kultura Coffee',
      summaryRatingPrefix: 'Середня оцінка: ',
      summaryRatingSuffix: ' із 5',
      summaryCountPrefix: 'на основі ',
      summaryCountSuffix: ' відгуків',
      ariaRatingLabelPrefix: 'Оцінка ',
      ariaRatingLabelSuffix: ' із 5'
    };

    var isMobile = window.innerWidth <= 768;
    var BATCH_SIZE = isMobile ? 3 : 6;

    var allItems = [];
    var renderedCount = 0;
    var moreBtnWrap = null;
    var moreBtn = null;

    var titleEl = root.querySelector('.kc-reviews__title');
    var ratingEl = root.querySelector('.kc-reviews__rating');
    var countEl = root.querySelector('.kc-reviews__count');
    var noteEl = root.querySelector('.kc-reviews__note');
    var placeholderEl = root.querySelector('.kc-reviews__placeholder');

    if (titleEl) titleEl.textContent = texts.title;
    if (ratingEl) ratingEl.textContent = texts.ratingLoading;
    if (countEl) countEl.textContent = texts.countLoading;
    if (noteEl) noteEl.textContent = texts.note;
    if (placeholderEl) placeholderEl.textContent = texts.listLoading;

    function escapeHtml(str){
      if (!str) return '';
      return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
    }

    function truncateText(str, max){
      if (!str) return '';
      if (str.length <= max) return str;
      return str.slice(0, max).replace(/\s+\S*$/, '') + '…';
    }

    function safeRating(val){
      var n = parseFloat(val);
      if (!isFinite(n) || n <= 0) n = 5;
      if (n > 5) n = 5;
      return n;
    }

    function formatDate(input){
      if (!input) return '';
      var d = new Date(input);
      if (isNaN(d.getTime())) return '';
      try {
        return d.toLocaleDateString(isRu ? 'ru-RU' : 'uk-UA', {
          day:'2-digit', month:'short', year:'numeric'
        });
      } catch(e){
        var dd = ('0' + d.getDate()).slice(-2);
        var mm = ('0' + (d.getMonth()+1)).slice(-2);
        return dd + '.' + mm + '.' + d.getFullYear();
      }
    }

    function createCard(it){
      var card = document.createElement('article');
      card.className = 'kc-review-card';

      var cardLink = document.createElement('a');
      cardLink.className = 'kc-review-card__link';
      cardLink.href = escapeHtml(it.productUrl);

      var stars = '★★★★★'.slice(0, Math.round(it.rating));
      var ariaLabel = texts.ariaRatingLabelPrefix + it.rating.toFixed(1) + texts.ariaRatingLabelSuffix;

      cardLink.innerHTML =
        (it.productName ? '<div class="kc-review-card__product-title">' + escapeHtml(it.productName) + '</div>' : '') +
        '<div class="kc-review-card__rating" aria-label="' + escapeHtml(ariaLabel) + '">' +
          '<span class="kc-review-card__stars">' + stars + '</span>' +
          '<span class="kc-review-card__rating-num">' + it.rating.toFixed(1).replace('.', ',') + '</span>' +
        '</div>' +
        (it.text ? '<div class="kc-review-card__text">' + truncateText(escapeHtml(it.text), 200) + '</div>' : '') +
        '<div class="kc-review-card__footer">' +
          '<span class="kc-review-card__author">' + (it.author ? escapeHtml(it.author) : texts.buyer) + '</span>' +
          '<span class="kc-review-card__date">' + formatDate(it.date) + '</span>' +
        '</div>';

      card.appendChild(cardLink);
      return card;
    }

    function renderMore(){
      if (!list || !allItems.length) return;

      var nextItems = allItems.slice(renderedCount, renderedCount + BATCH_SIZE);
      if (!nextItems.length) return;

      for (var i = 0; i < nextItems.length; i++){
        list.appendChild(createCard(nextItems[i]));
      }

      renderedCount += nextItems.length;

      if (renderedCount >= allItems.length && moreBtnWrap){
        moreBtnWrap.style.display = 'none';
      }
    }

    function parseXmlAndInit(text){
      var parser = new DOMParser();
      var xml = parser.parseFromString(text, 'application/xml');
      var reviewNodes = xml.getElementsByTagName('review');

      if (!reviewNodes.length){
        root.style.display = 'none';
        return;
      }

      var items = [];
      var sum = 0, ratedCount = 0;

      for (var i = 0; i < reviewNodes.length; i++){
        var rNode = reviewNodes[i];

        var ratingNode = rNode.getElementsByTagName('overall')[0];
        var ratingVal = ratingNode ? ratingNode.textContent : '';
        var rating = safeRating(ratingVal);

        var tsNode = rNode.getElementsByTagName('review_timestamp')[0];
        var ts = tsNode ? tsNode.textContent : '';

        var contentNode = rNode.getElementsByTagName('content')[0];
        var content = contentNode ? contentNode.textContent : '';

        var nameNode = rNode.getElementsByTagName('name')[0];
        var author = nameNode ? nameNode.textContent : '';

        var productNameNode = rNode.getElementsByTagName('product_name')[0];
        var productName = productNameNode ? productNameNode.textContent : '';

        var productUrlNode = rNode.getElementsByTagName('product_url')[0];
        var productUrl = productUrlNode ? productUrlNode.textContent : '';

        if (!productUrl){
          var reviewUrlNode = rNode.getElementsByTagName('review_url')[0];
          productUrl = reviewUrlNode ? reviewUrlNode.textContent : '#';
        }

        if (!isNaN(parseFloat(ratingVal))){
          sum += parseFloat(ratingVal);
          ratedCount++;
        }

        items.push({
          rating: rating,
          ratingRaw: ratingVal,
          dateRaw: ts,
          date: ts,
          text: content,
          author: author,
          productName: productName,
          productUrl: productUrl
        });
      }

      var ratingEl2 = root.querySelector('.kc-reviews__rating');
      var countEl2 = root.querySelector('.kc-reviews__count');

      if (ratedCount && ratingEl2){
        var avg = (sum / ratedCount).toFixed(1).replace('.', ',');
        ratingEl2.textContent = texts.summaryRatingPrefix + avg + texts.summaryRatingSuffix;
      }
      if (countEl2){
        countEl2.textContent = texts.summaryCountPrefix + items.length + texts.summaryCountSuffix;
      }

      allItems = items.filter(function(it){
        return it.rating >= minRating;
      });

      allItems.sort(function(a, b){
        var da = new Date(a.dateRaw || 0).getTime();
        var db = new Date(b.dateRaw || 0).getTime();
        return db - da;
      });

      if (!allItems.length){
        root.style.display = 'none';
        return;
      }

      if (!list) return;
      list.innerHTML = '';

      if (allItems.length > BATCH_SIZE){
        moreBtnWrap = document.createElement('div');
        moreBtnWrap.className = 'kc-reviews__more-wrap';

        moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'kc-reviews__more';
        moreBtn.textContent = texts.btnMore;

        moreBtn.addEventListener('click', function(){ renderMore(); });

        root.appendChild(moreBtnWrap);
        moreBtnWrap.appendChild(moreBtn);
      }

      renderedCount = 0;
      renderMore();

      root.classList.add('kc-reviews--ready');
    }

    fetch(FEED_URL, { credentials: 'omit' })
      .then(function(resp){
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.text();
      })
      .then(function(text){
        parseXmlAndInit(text);
      })
      .catch(function(err){
        console.error('Kultura Coffee reviews widget error:', err);
        root.style.display = 'none';
      });
  }

  /* === v2: завантажуємо відгуки тільки коли блок наближається до viewport === */
  var target = document.getElementById('kc-reviews-home');
  if (target && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) { io.disconnect(); initReviews(); }
    }, { rootMargin: '400px' });
    io.observe(target);
  } else {
    /* fallback для старих браузерів */
    window.addEventListener('load', initReviews);
  }
})();

// === script #3 (length=2633) ===
(function() {
    'use strict';
    
    if (window.innerWidth > 768) return;
    
    var initialized = false; // Защита от двойной инициализации
    var isAnimating = false; // Блокировка во время анимации
    
    function init() {
        if (initialized) return;
        
        var buttons = document.querySelectorAll('nav.tabs__nav-wrap > a.tabs__item');
        var container = document.querySelector('.product__group--tabs');
        
        if (!buttons.length || !container) return;
        
        initialized = true;
        console.log('✓ Swipe:', buttons.length, 'tabs');
        
        function getActiveIndex() {
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].classList.contains('is-active')) return i;
            }
            return 0;
        }
        
        function switchTab(index) {
            if (index < 0 || index >= buttons.length || isAnimating) return;
            
            isAnimating = true;
            
            buttons[index].click();
            console.log('→ Tab:', index, buttons[index].textContent.trim());
            
            // Разблокировать через 400ms
            setTimeout(function() {
                isAnimating = false;
            }, 400);
        }
        
        var startX = 0, startY = 0;
        
        container.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, {passive: true});
        
        container.addEventListener('touchend', function(e) {
            if (isAnimating) return; // Блокировка
            
            var endX = e.changedTouches[0].clientX;
            var endY = e.changedTouches[0].clientY;
            var dx = startX - endX;
            var dy = Math.abs(startY - endY);
            
            if (Math.abs(dx) > 50 && dy < 100) {
                var current = getActiveIndex();
                var next = dx > 0 ? current + 1 : current - 1;
                
                console.log('Swipe detected. Current:', current, 'Next:', next);
                
                if (next >= 0 && next < buttons.length) {
                    switchTab(next);
                    if (navigator.vibrate) navigator.vibrate(10);
                }
            }
        }, {passive: true});
        
        console.log('✓ Ready');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    setTimeout(init, 1000);
})();

// === script #4 (length=11799) ===
(function(){
  "use strict";

  /* ---------- локаль и фразы ---------- */
  function isRU(){
    var lang=(document.documentElement.lang||"").toLowerCase();
    return location.pathname.indexOf("/ru/")===0 || lang.startsWith("ru");
  }
  function shippingText(){
    // Киевское время; дедлайн 14:00
    var now=new Date(new Date().toLocaleString("en-US",{timeZone:"Europe/Kyiv"}));
    var d=now.getDay(), h=now.getHours();
    var RU={today:"Отправка 1–3 дня", tomorrow:"Отправка 1–3 дня", monday:"Отправка 1–3 дня"};
    var UK={today:"Відправка 1-3 дні", tomorrow:"Відправка 1-3 дні", monday:"Відправка 1-3 дні"};
    var L=isRU()?RU:UK;

    var weekend=(d===0||d===6);
    var friAfter=(d===5&&h>=14);
    var beforeCut=(h<14&&d>=1&&d<=5);
    var afterCutMonThu=(h>=15&&d>=1&&d<=4);

    if(beforeCut) return L.today;
    if(friAfter||weekend) return L.monday;
    if(afterCutMonThu) return L.tomorrow;
    return L.tomorrow;
  }

  /* ---------- стрелка: десктоп →, мобилка ➔ ---------- */
  function arrowChar(){ return window.matchMedia("(max-width:1024px)").matches ? "➔" : "→"; }
  function buildHTML(){ return '<span class="kc-arr">'+arrowChar()+'</span> '+shippingText(); }

  /* ---------- распознавание статуса ---------- */
  var RE_IN  = /(есть\s+в\s*налич|в\s*налич|в\s*наявн|у\s*наявн|є\s*в\s*наявн|є\s*у\s*наявн)/i;
  var RE_OUT = new RegExp([
    'нет\\s*в\\s*налич','нема(є)?\\s*в\\s*наявн','відсут','отсутств',
    'закінчив','закончил','временно\\s*нет',
    'под\\s*заказ','під\\s*замовлення',
    'ожидает','очікує','очікується','скоро',
    'pre[-\\s]?order','out\\s*of\\s*stock',
    'сообщит(?:ь)?\\s*,?\\s*когда\\s+появится',
    'повідомит(?:и)?\\s*,?\\s*коли\\s+з[’\']явиться'
  ].join('|'),'i');

  /* ---------- селекторы основной зоны товара ---------- */
  var SEL_DESKTOP = ".product-header__availability";

  // мобильные кандидаты: максимально точный — первым
  var MOBILE_CANDIDATES = [
    ".product-card.product-card--main .product-card__presence .presence-status",
    ".product-card--main .product-card__presence .presence-status",
    ".product-card--main .presence-status",
    ".product-card--main [class*='presence'] .presence-status",
    ".product-card--main [class*='presence']",
    ".product-card--main .availability"
  ];

  var SEL_MOBILE_WRAP  = ".product-card.product-card--main .product-card__presence, .product-card--main .product-card__presence";
  var SEL_DESKTOP_WRAP = ".product-header, .product-header__availability";

  /* ---------- утилиты ---------- */
  function isElementVisible(el){
    if(!el) return false;
    var cs=getComputedStyle(el);
    if(cs.display==="none"||cs.visibility==="hidden"||cs.opacity==="0") return false;
    if(el.hasAttribute('hidden') || el.getAttribute('aria-hidden')==="true") return false;
    var r=el.getBoundingClientRect();
    return (r.width>0 || r.height>0);
  }
  function getProductRoot(){
    return document.querySelector('.product-card.product-card--main') ||
           document.querySelector('section.product') ||
           document.querySelector('.product.wrapper') ||
           document.querySelector('.product') || document;
  }
  function getVisibleText(el){
    if(!el) return "";
    var out="", walker=document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node){
        var p=node.parentElement; if(!p) return NodeFilter.FILTER_REJECT;
        if(p.closest && p.closest('.kc-ship-msg')) return NodeFilter.FILTER_REJECT;
        var cs=getComputedStyle(p);
        if(cs.display==="none"||cs.visibility==="hidden"||cs.opacity==="0") return NodeFilter.FILTER_REJECT;
        if(p.hasAttribute('hidden') || p.getAttribute('aria-hidden')==="true") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n; while(n=walker.nextNode()){ out += " " + n.nodeValue; }
    return out.toLowerCase().replace(/\s+/g,' ').trim();
  }

  function findDesktopHost(){ return document.querySelector(SEL_DESKTOP); }
  function findMobileHost(){
    var root=getProductRoot() || document;
    for(var i=0;i<MOBILE_CANDIDATES.length;i++){
      var h=root.querySelector(MOBILE_CANDIDATES[i]);
      if(h) return h;
    }
    return null;
  }

  // Фолбэк из <head>: meta property="product:availability" (instock / out of stock)
  function headAvailability(){
    var m = document.querySelector('meta[property="product:availability"]');
    if(!m) return null;
    var v = (m.content||"").toLowerCase();
    if(/in\s*stock|instock/.test(v)) return 'in';
    if(/out\s*of\s*stock|outofstock/.test(v)) return 'out';
    return null;
  }

  function uiInStock(){
    var root=getProductRoot(); if(!root) return null;
    var add = root.querySelector("button[name='to_cart'], .j-add-to-cart, .product-card__buy button, .product-card__buttons .button--primary");
    if(add && !add.disabled && isElementVisible(add)) return true;
    var nodes = root.querySelectorAll('a,button');
    for(var i=0;i<nodes.length;i++){
      var el=nodes[i]; if(!isElementVisible(el)) continue;
      var t=(el.textContent||"").toLowerCase();
      if(/повідомити.*з.?явиться|сообщить.*когда.*появится/.test(t)) return false;
    }
    return null;
  }

  function stockState(host){
    if(!host) return 'unknown';

    // микроразметка рядом с хостом
    var microIn  = host.querySelector('link[itemprop="availability"][href$="InStock"], meta[itemprop="availability"][content$="InStock"]');
    var microOut = host.querySelector('link[itemprop="availability"][href$="OutOfStock"], meta[itemprop="availability"][content$="OutOfStock"]');
    if(microIn)  return 'in';
    if(microOut) return 'out';

    // видимый текст статуса
    var t = getVisibleText(host);
    if(RE_OUT.test(t)) return 'out';
    if(RE_IN.test(t))  return 'in';

    // UI-признаки (кнопки)
    var ui = uiInStock();
    if(ui===true)  return 'in';
    if(ui===false) return 'out';

    // крайний фолбэк: мета в <head>
    var hv = headAvailability();
    if(hv==='in' || hv==='out') return hv;

    return 'unknown';
  }

  function ensureSpan(host){
    var span=host.querySelector(".kc-ship-msg");
    if(!span){
      span=document.createElement("span");
      span.className="kc-ship-msg";
      span.setAttribute('data-kc','1');
      host.appendChild(span);
    }
    return span;
  }

  /* ---------- состояние и «липкость» ---------- */
  var state = {
    desktop: { last:'unknown', lastShown:false, stickyUntil:0 },
    mobile:  { last:'unknown', lastShown:false, stickyUntil:0 }
  };
  function touch(which){
    var now=Date.now();
    state[which].stickyUntil = now + 3500; // ~3.5с после действия/мутации
  }
  function isSticky(which){ return Date.now() <= state[which].stickyUntil; }

  /* ---------- обновление одного места ---------- */
  function updateOne(which){
    var host = (which==='desktop') ? findDesktopHost() : findMobileHost();
    if(!host || !isElementVisible(host)) return false;

    var st = stockState(host);
    var span = host.querySelector(".kc-ship-msg");

    if(st === 'out'){
      if(span) span.remove();
      state[which].last='out';
      state[which].lastShown=false;
      return false;
    }

    if(st === 'unknown'){
      if(state[which].last==='in' || isSticky(which)){
        span = ensureSpan(host);
        var html=buildHTML();
        if(span.innerHTML!==html) span.innerHTML=html;
        state[which].last='in';
        state[which].lastShown=true;
        return true;
      }
      return !!span;
    }

    // in-stock
    span = ensureSpan(host);
    var html=buildHTML();
    if(span.innerHTML!==html) span.innerHTML=html;
    state[which].last='in';
    state[which].lastShown=true;
    return true;
  }

  function updateAll(){ var a=updateOne('desktop'), b=updateOne('mobile'); return a||b; }

  /* ---------- «бурст» перепроверок после изменений ---------- */
  var burst = { desktop:null, mobile:null };
  function startBurst(which, ms, step){
    if(burst[which]) clearInterval(burst[which]);
    var ticks=0, limit=Math.ceil(ms/step);
    burst[which]=setInterval(function(){
      ticks++; updateOne(which);
      if(ticks>=limit){ clearInterval(burst[which]); burst[which]=null; }
    }, step);
  }

  /* ---------- наблюдатели только за контейнерами статуса ---------- */
  var mobObs=null, deskObs=null, rafScheduled=false;
  function scheduleUpdate(fn){
    if(rafScheduled) return; rafScheduled=true;
    requestAnimationFrame(function(){ rafScheduled=false; fn(); });
  }
  function bindStatusObservers(){
    var root=getProductRoot() || document;
    if(mobObs){ mobObs.disconnect(); mobObs=null; }
    if(deskObs){ deskObs.disconnect(); deskObs=null; }

    var mWrap = root.querySelector(SEL_MOBILE_WRAP) || findMobileHost();
    var dWrap = document.querySelector(SEL_DESKTOP_WRAP) || findDesktopHost();

    if(mWrap){
      mobObs = new MutationObserver(function(){
        touch('mobile');
        scheduleUpdate(function(){ updateOne('mobile'); startBurst('mobile', 3600, 150); });
      });
      mobObs.observe(mWrap,{subtree:true, childList:true, characterData:true});
    }
    if(dWrap){
      deskObs = new MutationObserver(function(){
        touch('desktop');
        scheduleUpdate(function(){ updateOne('desktop'); startBurst('desktop', 3600, 150); });
      });
      deskObs.observe(dWrap,{subtree:true, childList:true, characterData:true});
    }
  }

  /* ---------- пользовательские события ---------- */
  function bindUserHandlers(){
    var root=getProductRoot() || document;
    var kick=function(){
      touch('desktop'); touch('mobile');
      updateAll();
      startBurst('desktop', 3600, 150);
      setTimeout(updateAll,120);
      setTimeout(updateAll,300);
      setTimeout(bindStatusObservers, 60);
      setTimeout(bindStatusObservers, 400);
    };
    root.addEventListener('click',       kick, true);
    root.addEventListener('change',      kick, true);
    root.addEventListener('input',       kick, true);
    root.addEventListener('touchstart',  kick, true);
    root.addEventListener('touchend',    kick, true);

    // пересобираем стрелку при изменении ширины
    window.addEventListener('resize', function(){
      document.querySelectorAll('.kc-ship-msg').forEach(function(s){
        var host=s.parentElement;
        if(host && isElementVisible(host)){ s.innerHTML = buildHTML(); }
      });
    });

    window.addEventListener('pageshow', function(){ updateAll(); bindStatusObservers(); });
    document.addEventListener('visibilitychange', function(){
      if(!document.hidden){ updateAll(); bindStatusObservers(); }
    });
  }

  /* ---------- мобильный «пульс» (≤1024px) ---------- */
  var pollId=null, mq=window.matchMedia("(max-width:1024px)");
  function startMobilePoll(){
    if(pollId || !mq.matches) return;
    pollId = setInterval(function(){ requestAnimationFrame(function(){ updateOne('mobile'); }); }, 400);
  }
  function stopMobilePoll(){ if(pollId){ clearInterval(pollId); pollId=null; } }
  if(mq.addEventListener){ mq.addEventListener('change', function(e){ e.matches ? startMobilePoll() : stopMobilePoll(); }); }
  else { mq.addListener(function(e){ e.matches ? startMobilePoll() : stopMobilePoll(); }); }

  /* ---------- init ---------- */
  function init(){
    updateAll();
    bindStatusObservers();
    bindUserHandlers();
    if(mq.matches) startMobilePoll();
  }
  (document.readyState==="loading") ? document.addEventListener("DOMContentLoaded", init)
                                    : init();
})();
