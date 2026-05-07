// source: https://coffeetrade.ua/
// extracted: 2026-05-07T21:18:50.310Z
// scripts: 5

// === script #1 (length=2599) ===
function getUrlVar(){
	  var urlVar = window.location.search;
	  var arrayVar = [];
	  var valueAndKey = [];
	  var resultArray = [];
	  arrayVar = (urlVar.substr(1)).split('&');
	  if(arrayVar[0]=="") return false;
	  for (i = 0; i < arrayVar.length; i ++) {
	    valueAndKey = arrayVar[i].split('=');
	    resultArray[valueAndKey[0]] = valueAndKey[1];
	  }
	  return resultArray;
	}
	var keepin_utm = getUrlVar();

	function keepinFormSubmit(form) {  
  return function(event){
  	console.log(`Form Submitted! `, event, form);
	  event.preventDefault();
	  let button = form.querySelector('.btn');
	  let loader = form.querySelector('.lds-ring');
	  let mess_success = form.querySelector('.keepin_form_message.success');
	  let mess_failed = form.querySelector('.keepin_form_message.failed');
	  button.disabled = true;
	  loader.style.display = 'inline-block';

	  let data = {
	    'title': form.title.value,
	    'name': form.name.value,
	    'phone': form.phone.value,
	    'webhook_id': form.webhook_id.value,	    
	    'utm_source': (keepin_utm['utm_source'] != undefined)?keepin_utm['utm_source']:'',
	    'utm_medium': (keepin_utm['utm_medium'] != undefined)?keepin_utm['utm_medium']:'',
	    'utm_campaign': (keepin_utm['utm_campaign'] != undefined)?keepin_utm['utm_campaign']:'',
	    'utm_content': (keepin_utm['utm_content'] != undefined)?keepin_utm['utm_content']:'',
	    'utm_term': (keepin_utm['utm_term'] != undefined)?keepin_utm['utm_term']:'',
	   };
	   console.log(`data `, data);

	  let url = "https://coffeetrade.adminka.pro/api/hook/horoshop";
		
	   fetch(url, {
			  method: "POST",
			  body: JSON.stringify(data),
			  headers: {
			    "Content-type": "application/json; charset=UTF-8"
			  }
			})
			  .then((response) => {
			  	console.log('response:', response);
			  	button.disabled = false;
			  	loader.style.display = 'none';
	  			mess_success.style.display = 'inline-block';
	  			form.name.value = "";
				  form.phone.value = ""
	  			setTimeout(() => {					  
					  mess_success.style.display = 'none';
					}, "3000");
			  })
			  .catch ((error) => {
			    console.error("Error:", error);
			    button.disabled = false;
			  	loader.style.display = 'none';
	  			mess_failed.style.display = 'inline-block';
	  			setTimeout(() => {
					  mess_failed.style.display = 'none';
					}, "3000");
		  });
  }
}

const keepin_forms = document.querySelectorAll('.keepin_form');

  for (let form of keepin_forms) {
    form.addEventListener("submit", keepinFormSubmit(form));
  }

// === script #2 (length=3561) ===
(function($){
  "use strict";

  // (категорії + сторінки/блог + FAQ)
  const SEO_CTX = [
    '.catalog__seo-text',
    '#j-catalog-seo',
    'section.catalog__text',
    '.layout-main-seo',

    // BLOG / PAGES
    'article',
    '.page__content',
    '.article__content',
    '.blog-article',
    '.text-content',

    // ВАЖЛИВО: сам FAQ-контейнер (щоб клік працював всюди)
    '.schema-faq-code'
  ].join(', ');

  function getSeoContent(fromEl){
    const $ctx = $(fromEl).closest(SEO_CTX);
    if (!$ctx.length) return $();

    // Якщо клік у FAQ — "контентом" вважаємо найближчий великий контейнер сторінки/SEO
    // щоб refresh працював і в статтях, і в seo-текстах
    let $content =
      $ctx.find('.seo-text.j-seo-text.text-expander__content').first();
    if ($content.length) return $content;

    $content = $ctx.find('.seo-text.j-seo-text-expander').first();
    if ($content.length) return $content;

    // fallback
    return $ctx.find('.text-expander__content, .j-seo-text, .seo-text').first();
  }

  function refreshSeoAfterAction(fromEl){
    // Працюємо і для FAQ: якщо seo-текст не знайдено — просто вихід (нічого ламати не треба)
    const $content = getSeoContent(fromEl);
    if (!$content.length) return;

    const el = $content[0];

    const currentH = el.getBoundingClientRect().height;
    if (currentH && currentH < 120) return;

    const $inner = $content.find('.seo-text__content').first();
    const measureEl = $inner.length ? $inner[0] : el;

    const inlineH = el.style.height && el.style.height !== 'auto';
    const inlineMaxH = el.style.maxHeight && el.style.maxHeight !== 'none';

    const prevH = el.style.height;
    const prevMaxH = el.style.maxHeight;

    $content.css({ height: 'auto', 'max-height': 'none' });
    const need = measureEl.scrollHeight;

    if (inlineMaxH && !inlineH) {
      el.style.height = prevH || '';
      el.style.maxHeight = need + 'px';
    } else {
      el.style.maxHeight = prevMaxH || '';
      el.style.height = need + 'px';
    }

    el.offsetHeight; // force reflow
  }

  function refreshSeoSoft(fromEl){
    refreshSeoAfterAction(fromEl);
    setTimeout(()=>refreshSeoAfterAction(fromEl), 80);
    setTimeout(()=>refreshSeoAfterAction(fromEl), 260);
    setTimeout(()=>refreshSeoAfterAction(fromEl), 520);
  }

  // ===== FAQ: працює всюди, де є .schema-faq-code (SEO-тексти, статті, сторінки)
  $(document).on('click', '.schema-faq-code .faq-q', function(){
    const $q = $(this);

    // опціонально: якщо треба жорстко обмежити тільки "контентні" зони — лишаємо перевірку
    // але тепер вона завжди TRUE хоча б через '.schema-faq-code' в SEO_CTX
    if (!$q.closest(SEO_CTX).length) return;

    const $box = $q.closest('.faq-question');
    const $a = $box.find('.faq-a').first();
    if(!$a.length) return;

    if($a.is(':visible')){
      $q.removeClass('faq-q-open');
      $a.stop(true,true).slideUp(220, function(){ refreshSeoSoft($q); });
    } else {
      $q.addClass('faq-q-open');
      $a.stop(true,true).slideDown(220, function(){ refreshSeoSoft($q); });
    }
  });

  // ===== Розгортання SEO/тексту: тільки в дозволених зонах
  $(document).on('click',
    SEO_CTX + ' .btn.btn--block, ' +
    SEO_CTX + ' .js-toggle-button',
    function(){
      const el = this;
      setTimeout(()=>refreshSeoSoft(el), 40);
      setTimeout(()=>refreshSeoSoft(el), 280);
      setTimeout(()=>refreshSeoSoft(el), 560);
    }
  );

})(window.jQuery);

// === script #3 (length=3430) ===
(function () {
  // --- анти-спам: не запускати fill 100 разів підряд
  let timer = null;
  function scheduleFill(delay = 180) {
    clearTimeout(timer);
    timer = setTimeout(fillMyTable, delay);
  }

  function fillMyTable() {
    const table = document.querySelector('#my-table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    if (!rows.length) return;

    const seoProducts = document.querySelectorAll('.catalogCard-info');
    const regularProducts = document.querySelectorAll('.catalog-card__content');

    const collected = [];

    seoProducts.forEach(p => {
      if (collected.length >= 5) return;
      const title = p.querySelector('.catalogCard-title');
      const price = p.querySelector('.catalogCard-price');
      if (title && price) {
        collected.push({ title: title.innerHTML, price: price.innerHTML });
      }
    });

    regularProducts.forEach(p => {
      if (collected.length >= 5) return;
      const title = p.querySelector('.catalog-card__title');
      const price = p.querySelector('.catalog-card__price');
      if (title && price) {
        collected.push({ title: title.innerHTML, price: price.innerHTML });
      }
    });

    // якщо немає товарів (наприклад фільтр дав 0) — просто чистимо
    rows.forEach(r => {
      const nameCell  = r.querySelector('.slot-name');
      const priceCell = r.querySelector('.slot-price');
      if (nameCell)  nameCell.innerHTML  = '&nbsp;';
      if (priceCell) priceCell.innerHTML = '&nbsp;';
    });

    collected.forEach((item, i) => {
      if (!rows[i]) return;
      const nameCell  = rows[i].querySelector('.slot-name');
      const priceCell = rows[i].querySelector('.slot-price');
      if (nameCell && priceCell) {
        nameCell.innerHTML  = item.title;
        priceCell.innerHTML = item.price;
      }
    });
  }

  // 1) Перший запуск
  document.addEventListener('DOMContentLoaded', function () {
    scheduleFill(0);
  });

  // 2) Хук на fetch (часто Horoshop використовує fetch)
  if (window.fetch) {
    const _fetch = window.fetch;
    window.fetch = function () {
      return _fetch.apply(this, arguments).then(function (res) {
        // після завершення запиту даємо DOM оновитись і тоді читаємо карточки
        scheduleFill(220);
        return res;
      });
    };
  }

  // 3) Хук на XHR (якщо фільтр на XMLHttpRequest)
  const XHROpen = XMLHttpRequest.prototype.open;
  const XHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function () {
    this.__isCatalogReq = true; // не чіпаємо URL, просто тригеримо після будь-якого XHR
    return XHROpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    this.addEventListener('loadend', function () {
      scheduleFill(220);
    });
    return XHRSend.apply(this, arguments);
  };

  // 4) Якщо фільтр міняє URL через history API
  const _pushState = history.pushState;
  history.pushState = function () {
    const r = _pushState.apply(this, arguments);
    scheduleFill(220);
    return r;
  };

  const _replaceState = history.replaceState;
  history.replaceState = function () {
    const r = _replaceState.apply(this, arguments);
    scheduleFill(220);
    return r;
  };

  window.addEventListener('popstate', function () {
    scheduleFill(220);
  });

})();

// === script #4 (length=4613) ===
document.addEventListener("DOMContentLoaded", function () {

  // ===== список міст (UA + RU) =====
  const CITIES = [
    "дніпро","днепр",
    "запоріжжя","запорожье",
    "кременчук","кременчуг",
    "кривий ріг","кривой рог",
    "львів","львов",
    "миколаїв","николаев",
    "одеса","одесса",
    "полтава",
    "харків","харьков",
    "хмельницький","хмельницкий",
    "вінниця","винница",
    "рівне","ровно",
    "тернопіль","тернополь",
    "чернівці","черновцы",
    "житомир",
    "луцьк","луцк",
    "суми","сумы",
    "чернігів","чернигов",
    "івано-франківськ","ивано-франковск",
    "кропивницький","кропивницкий",
    "черкаси","черкассы",
    "ужгород",
    "київ","киев"
  ];

  function norm(s){
    return (s || "")
      .replace(/\u00A0/g," ")
      .replace(/\s+\d+\s*$/g,"") // прибрати лічильник " 1" в кінці
      .trim()
      .toLowerCase();
  }

  function hasCity(text){
    const t = norm(text);
    return CITIES.some(city => t.includes(city));
  }

  function isVisible(el){
    return !!(el && el.offsetParent !== null);
  }

  // 1) Ховаємо тільки значення з містами
  function hideCityOptions(){
    const nodes = document.querySelectorAll(
      ".filter a, .filters a, .catalog-filter a, " +
      ".filter label, .filters label, .catalog-filter label, " +
      ".filter li, .filters li, .catalog-filter li"
    );

    nodes.forEach(node => {
      const text = node.textContent || "";
      if(!hasCity(text)) return;

      const row =
        node.closest("li") ||
        node.closest(".filter__item") ||
        node.closest(".filter-item") ||
        node.closest(".checkbox") ||
        node.closest(".radio") ||
        node;

      if(row) row.style.display = "none";
    });
  }

  // 2) Прибираємо "пустоту" після розгортання:
  // НЕ розкриваємо все, НЕ змінюємо overflow.
  // Лише підтискаємо max-height/height, якщо вони стали більшими за реальний контент.
  function tightenExpandedHeights(){
    const lists = document.querySelectorAll(
      ".filter ul, .filters ul, .catalog-filter ul, " +
      ".filter__values, .filters__values, .filter-values"
    );

    lists.forEach(list => {
      // рахуємо реальну висоту видимих елементів
      const items = Array.from(list.querySelectorAll("li, .filter__item, .filter-item, label, a"))
        .filter(isVisible);

      if (!items.length) return;

      // scrollHeight вже враховує display:none (не врахує приховані елементи)
      const realH = list.scrollHeight;

      // працюємо ТІЛЬКИ якщо у Хорошоп вже задана висота/max-height (тобто список керований "Показати ще")
      // і вона більша за реальну -> тоді підтискаємо
      const inlineMaxH = list.style.maxHeight;  // якщо є
      const inlineH = list.style.height;        // якщо є

      // якщо є inline max-height (звично при розгортанні/згортанні)
      if (inlineMaxH && inlineMaxH !== "none") {
        const current = parseFloat(inlineMaxH);
        if (!isNaN(current) && current > realH + 4) {
          list.style.maxHeight = realH + "px";
        }
      }

      // якщо є inline height
      if (inlineH && inlineH !== "auto") {
        const currentH = parseFloat(inlineH);
        if (!isNaN(currentH) && currentH > realH + 4) {
          list.style.height = realH + "px";
        }
      }
    });
  }

  // 3) Після кліку "Показати ще" Хорошоп знову ставить висоту під стару кількість —
  // ми просто підтискаємо до актуальної (після приховання міст).
  function hookShowMore(){
    const toggles = Array.from(document.querySelectorAll("a, button"))
      .filter(el => {
        const t = (el.textContent || "").trim().toLowerCase();
        return t.startsWith("показати ще") || t.startsWith("показать еще");
      });

    toggles.forEach(btn => {
      if (btn.__cityFixBound) return;
      btn.__cityFixBound = true;

      btn.addEventListener("click", function(){
        // після того як Хорошоп перерахував/розгорнув — підтискаємо висоти
        setTimeout(runTighten, 0);
        setTimeout(runTighten, 60);
        setTimeout(runTighten, 200);
      }, { passive: true });
    });
  }

  function runTighten(){
    hideCityOptions();
    tightenExpandedHeights();
    hookShowMore();
  }

  // первинний запуск
  runTighten();

  // підстраховка на догрузку/перемальовування
  setTimeout(runTighten, 300);
  setTimeout(runTighten, 1200);

  const obs = new MutationObserver(() => runTighten());
  obs.observe(document.body,{childList:true,subtree:true});

});

// === script #5 (length=6289) ===
(function(){

function insertMiniCards(){

if(document.querySelector('.selection-grid')) return;

let lang = null;
let anchorImg = document.querySelector('img[alt="home-minicards-UA"]');

if(anchorImg){
  lang = 'ua';
}else{
  anchorImg = document.querySelector('img[alt="home-minicards-RU"]');
  if(anchorImg){
    lang = 'ru';
  }
}

if(!anchorImg) return;

const bannerGroup = anchorImg.closest('.banners-group');
if(!bannerGroup) return;

bannerGroup.style.display = 'none';

const css = `
<style>

.selection-grid{
display:grid;
grid-template-columns:repeat(6,minmax(0,1fr));
gap:18px;
max-width:1920px;
margin:40px auto;
padding:0 24px;
box-sizing:border-box;
}

.selection-card{
background:#fff;
border:1px solid #e7e7e7;
border-radius:18px;
transition:.28s cubic-bezier(.4,0,.2,1);
height:100%;
overflow:hidden;
}

.selection-card:hover{
border-color:#2db7a3;
box-shadow:0 12px 28px rgba(0,0,0,.06);
transform:translateY(-4px);
}

.selection-link{
display:flex;
flex-direction:column;
padding:22px;
height:100%;
text-decoration:none;
color:inherit;
box-sizing:border-box;
}

.selection-title{
font-weight:800;
font-size:17px;
line-height:1.25;
color:#133b67;
margin-bottom:8px;
min-height:58px;
text-align:center;
display:flex;
align-items:flex-start;
justify-content:center;
}

.selection-desc{
font-size:14px;
line-height:1.5;
color:#4a4a4a;
margin:0;
}

@media (max-width:991px){
.selection-grid{
grid-template-columns:repeat(2,1fr);
gap:14px;
margin:30px auto;
padding:0 16px;
}

.selection-title{
min-height:64px;
}
}

/* 🔥 МОБІЛЬНА ПРАВКА */
@media (max-width:575px){
.selection-grid{
grid-template-columns:1fr;
gap:10px;
margin:20px auto;
padding:0 12px;
}

.selection-link{
padding:16px;
}

.selection-title{
font-size:18px;
line-height:1.2;
min-height:auto;
margin-bottom:2px;
text-align:center;
display:block;
}

.selection-desc{
font-size:14px;
line-height:1.4;
margin-top:0;
}
}

</style>
`;

let block = '';

if(lang === 'ua'){

block = `
${css}
<div class="selection-grid">

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/kofe/">
<span class="selection-title">КАВА свіжообсмажена</span>
<span class="selection-desc">Ваша улюблена кава C&T в зернах, мелена прямо з ростера. Від м'якої арабіки до авторских блендів для дому та бізнесу</span>
</a>
</div>

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/chay/">
<span class="selection-title">ЧАЙ колекційний</span>
<span class="selection-desc">Чорний, зелений, фруктовий, трав'яний, Улун, Пуер. Все для ідеальної чайної церемонії або чайної карти для HoReCa</span>
</a>
</div>

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/kofemashiny/">
<span class="selection-title">КАВОМАШИНИ та КАВОВАРКИ</span>
<span class="selection-desc">Професійні та домашні рішення: від Delonghi, Melitta, Saeco, Philips та Jura до італійських Bezzera</span>
</a>
</div>

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/kofemolki/">
<span class="selection-title">КАВОМОЛКИ для дому і професіоналів</span>
<span class="selection-desc">Точний помел — основа смаку. Надійне обладнання для кав'ярень, офісів та поціновувачів якісної кави</span>
</a>
</div>

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/aksessuary/">
<span class="selection-title">АКСЕСУАРИ для кави та бариста</span>
<span class="selection-desc">Все необхідне для приготування: пітчери, темпери, посуд Hario та гейзерні кавоварки</span>
</a>
</div>

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/servis-kavovarok/">
<span class="selection-title">СЕРВІСНИЙ ЦЕНТР та турбота</span>
<span class="selection-desc">Ремонт кавоварок, догляд та підмінні кавомашини. Допомога та гайди від наших майстрів</span>
</a>
</div>

</div>
`;

}

if(lang === 'ru'){

block = `
${css}
<div class="selection-grid">

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/ru/kofe/">
<span class="selection-title">КОФЕ свежеобжаренный</span>
<span class="selection-desc">Ваш любимый кофе C&T в зернах, молотый прямо из ростера. От мягкой арабики до авторских блендов для дома и бизнеса</span>
</a>
</div>

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/ru/chay/">
<span class="selection-title">ЧАЙ коллекционный</span>
<span class="selection-desc">Чорный, зеленый, фруктовый, травяной, Улун, Пуэр. Всё для идеальной чайной церемонии или чайной карты для HoReCa</span>
</a>
</div>

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/ru/kofemashiny/">
<span class="selection-title">КОФЕМАШИНЫ и КОФЕВАРКИ</span>
<span class="selection-desc">Профессиональные и домашние решения: от Delonghi, Melitta, Saeco, Philips и Jura до итальянских Bezzera</span>
</a>
</div>

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/ru/kofemolki/">
<span class="selection-title">КОФЕМОЛКИ для дома и профессионалов</span>
<span class="selection-desc">Точный помол — основа вкуса. Надежное оборудование для кофеен, офисов и ценителей качественного кофе</span>
</a>
</div>

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/ru/aksessuary/">
<span class="selection-title">АКСЕССУАРЫ для кофе и бариста</span>
<span class="selection-desc">Всё необходимое для приготовления: питчеры, темперы, посуда Hario и гейзерные кофеварки</span>
</a>
</div>

<div class="selection-card">
<a class="selection-link" href="https://coffeetrade.ua/ru/servis-kavovarok/">
<span class="selection-title">СЕРВИСНЫЙ ЦЕНТР и забота</span>
<span class="selection-desc">Ремонт кофеварок, уход и подменные кофемашины. Помощь и гайды от наших мастеров</span>
</a>
</div>

</div>
`;

}

bannerGroup.insertAdjacentHTML('afterend', block);

}

document.addEventListener('DOMContentLoaded', insertMiniCards);
setTimeout(insertMiniCards, 1200);
setTimeout(insertMiniCards, 2500);
setTimeout(insertMiniCards, 4000);

})();
