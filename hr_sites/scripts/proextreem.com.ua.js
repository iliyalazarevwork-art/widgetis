// source: https://proextreem.com.ua/
// extracted: 2026-05-07T21:19:22.673Z
// scripts: 2

// === script #1 (length=2705) ===
(()=>{

var pricePattern = '0 грн',
        pricePatternLang = (() => {
        let lang = document.documentElement.lang;
            switch (lang) {
                case 'ru' : return 'Цена: 0.00 грн';
                case 'uk' : return 'Ціна: 0.00 грн';
                default : return '0.00 грн';
            }
    })(),
        langText = (() => {
        let lang = document.documentElement.lang;
            switch (lang) {
                case 'ru' : return 'Актуальную цену <br>и наличие <br>уточняйте у менеджера';
                case 'uk' : return 'Актуальну ціну <br>та наявність <br>уточнюйте у менеджера';
                default : return 'Ask price';
            }
    })();

const miniCardPriceChage = () => {
    let priceItemsList = document.querySelectorAll('.j-catalog-card,.catalog-card');
    
    priceItemsList.forEach((el,i)=>{
        let price = el.querySelector('.catalogCard-price,.catalog-card__price');
        if(price.textContent.trim() == pricePattern.trim() || price.textContent.trim() == pricePatternLang.trim()){
        price.innerHTML = langText;
        try{
            el.querySelector('.j-buy-button-add').remove();
        }
        catch(e){};
        } 
    });

}
const productPagePriceChange = () => {
    let priceItemsList = document.querySelectorAll('.catalogCard-price,.product-price__item,.product-card__price');

    priceItemsList.forEach((e,i)=>{
        if(e.textContent.trim() == pricePattern.trim() || e.textContent.trim() == pricePatternLang.trim()){

            e.innerHTML = langText;
        try{
        document.querySelector('.j-buy-button-add').remove();
        }
        catch(e){};
        } 
    });

}

//================================== Функция для изменения цены

const priceChange = () => {

    if(document.querySelectorAll('.j-catalog-card,.catalog-card').length > 0) miniCardPriceChage()
        else productPagePriceChange();
    console.log('changed');
}


//================================== Ниже обсервер который следит за DOM и в случае изменения вызивает функцию priceChange()

(() => {

        var target = document.documentElement;
        
        const config = {
            attributes: true,
            childList: true,
            subtree: true
        }; 
        
        const callback = function(mutationsList, observer) {
            priceChange();
        };
        
        const observer = new MutationObserver(callback);
        
        observer.observe(target, config);
        

})();

//================================== При готовности дом вызвать функцию priceChange()
window.onload = priceChange();
})();

// === script #2 (length=5790) ===
(function($){
  if(!$) return;

  const Utils = {
    lang(){
      const l = (document.documentElement.getAttribute('lang')||'').toLowerCase();
      if (l.startsWith('uk')) return 'uk';
      if (l.startsWith('ru')) return 'ru';
      return 'en';
    },
    wait(sel, cb, ttl=6000, step=120){
      const t0 = Date.now();
      (function loop(){
        const $el = $(sel).first();
        if ($el.length) return cb($el);
        if (Date.now()-t0>ttl) return;
        setTimeout(loop, step);
      })();
    },
    once(q){ return $(q).length ? $(q).first() : null; }
  };

  const Marquee = (function(){
    const presets = {
      uk: ['Безкоштовна доставка по Україні від 5000 грн','Надсилаємо 2 розміри на примірку','Відправка в день замовлення'],
      ru: ['Бесплатная доставка по Украине от 5000 грн','Отправляем 2 размера на примерку','Отправка в день заказа'],
      en: ['Free shipping in Ukraine from ₴5000','Try 2 sizes at home','Same-day dispatch']
    };
    function dataPhrases(lang){
      const raw = $('html').attr('data-marquee-'+lang);
      return raw ? raw.split('|').map(s=>s.trim()).filter(Boolean) : null;
    }
    function phrases(lang){
      const byGlobal = (window.MARQUEE_PHRASES && window.MARQUEE_PHRASES[lang]) || null;
      return byGlobal || dataPhrases(lang) || presets[lang] || presets.en;
    }
    function view(items, repeat=5){
      const $w = $('<div class="marquee-wrapper">');
      const $i = $('<div class="marquee-inner">');
      for (let r=0;r<repeat;r++) items.forEach(t=> $('<div class="marquee-text">').text(t).appendTo($i));
      $w.append($i);
      return $w;
    }
    function mountAfter($anchor){
      if ($('.marquee-wrapper').length) return;
      $anchor.after(view(phrases(Utils.lang())));
    }
    function cloneAfterHeader(){
      const $src = $('.marquee-wrapper').first();
      if (!$src.length) return;
      $('#header').after($src.clone(true));
    }
    function init(){
      const lang = Utils.lang();
      if (!['uk','ru','en'].includes(lang)) return;
      const anchors = [
        'body > div.container > div.header > div > div.header__top',
        '#header',
        'body > div.marquee-wrapper'
      ];
      anchors.forEach(sel=>{
        Utils.wait(sel, $a=>{
          if (sel === '#header'){
            if (!$('.marquee-wrapper').length) mountAfter($a); else cloneAfterHeader();
          } else {
            mountAfter($a);
          }
        });
      });
    }
    return { init };
  })();

  const DeliveryDate = (function(){
    const defaults = {
      selectors: [],
      offsetDays: 2,
      texts: {
        uk: { prefix: 'Орієнтовна дата доставки' },
        ru: { prefix: 'Ориентировочная дата доставки' }
      },
      format(d){
        const dd = String(d.getDate()).padStart(2,'0');
        const mm = String(d.getMonth()+1).padStart(2,'0');
        const yyyy = d.getFullYear();
        return `${dd}.${mm}.${yyyy}`;
      },
      wrapper(prefix, dateStr){
        return `<div class="product__group-item j-product-block">
                  <div class="product__section mb-0">
                    <div class="delivery-date">${prefix} <strong>${dateStr}</strong></div>
                  </div>
                </div>`;
      },
      insert: 'before'
    };
    function computeDate(days){
      const d = new Date();
      d.setDate(d.getDate()+days);
      return d;
    }
    function place($ref, html, mode){
      if (mode==='append') $ref.append(html);
      else if (mode==='before') $ref.before(html);
      else $ref.after(html);
    }
    function init(userCfg){
      const cfg = Object.assign({}, defaults, userCfg||{});
      const lang = Utils.lang().startsWith('uk') ? 'uk' : 'ru';
      const prefix = (cfg.texts[lang]||cfg.texts.ru).prefix;
      const dateStr = cfg.format(computeDate(cfg.offsetDays));
      const html = cfg.wrapper(prefix, dateStr);
      cfg.selectors.forEach(sel=>{
        const $ref = Utils.once(sel);
        if (!$ref) return;
        $ref.closest('div').find('.delivery-date').closest('.j-product-block').remove();
        place($ref, html, cfg.insert);
      });
    }
    return { init };
  })();

  const SwiperTweaks = (function(){
    function apply(){
      (function loop(){
        const sw = window.App && window.App.productCarousel && window.App.productCarousel.swiper;
        if (!sw || !sw.params) return setTimeout(loop,100);
        $.extend(sw.params, {
          centeredSlides: true,
          centeredSlidesBounds: true,
          spaceBetween: 10,
          loop: false,
          freeMode: false,
          freeModeMomentum: false,
          slidesPerView: 1.5,
          preloadImages: true
        });
        if (sw.params.lazy) sw.params.lazy.enabled = false;
        sw.update();
        if (typeof sw.preloadImages==='function') sw.preloadImages();
      })();
    }
    return { apply };
  })();

  $(function(){
    Marquee.init();
     if (!$('.product-order .j-widget-favorites-add').length) {
                DeliveryDate.init({
                    selectors: [
                        "#page > main > div > div.product__grid > div.product__column.product__column--right > div.product__block.product__block--orderBox.j-product-block > div > div.product-card.product-card--main > div",
                        "#main > div.wrapper > section > div.product__grid > div.product__column.product__column--right.product__column--sticky > div > div:nth-child(2)"
                    ],
                    offsetDays: 2,
                    insert: 'before'
                });
            }
    SwiperTweaks.apply();
  });

})(window.jQuery);
