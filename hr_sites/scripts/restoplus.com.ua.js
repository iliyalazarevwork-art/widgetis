// source: https://restoplus.com.ua/
// extracted: 2026-05-07T21:19:12.489Z
// scripts: 5

// === script #1 (length=5788) ===
function writeCookie(name, val) {
    document.cookie = name + "=" + val + "; path=/";
  }
  function readCookie(name) {
    var matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }
  function validateEmail(email) {
    var re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return re.test(String(email).toLowerCase());
  }
  var sha256 = function sha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    };
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length'
    var i, j; // Used as a counter across the whole file
    var result = ''
    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;
    var hash = sha256.h = sha256.h || [];
    var k = sha256.k = sha256.k || [];
    var primeCounter = k[lengthProperty];
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80' // Append Ƈ' bit (plus zero padding)
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00' // More zero padding
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return; // ASCII check: only accept characters in range 0-255
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength)
    for (j = 0; j < words[lengthProperty];) {
      var w = words.slice(j, j += 16);
      var oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var i2 = i + j;
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
          + ((e & hash[5]) ^ ((~e) & hash[6])) // ch
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) // s0
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
          ) | 0
          );
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  };
  if (window.location.href.indexOf("checkout") > -1) {
    window.onload = function () {
      const form = document.getElementById("checkout-container");
      form.addEventListener("submit", function () {
        var global_sha256_email_address = '';
        var global_sha256_phone_number = '';

        var cookie_email = readCookie('global_sha256_email_address');
        if (cookie_email != 'undefined' && cookie_email != '')
          global_sha256_email_address = cookie_email;

        var cookie_phone_number = readCookie('global_sha256_phone_number');
        if (cookie_phone_number != 'undefined' && cookie_phone_number != '')
          global_sha256_phone_number = cookie_phone_number;

        var email_input = document.getElementsByName('Recipient[delivery_email]');
        if (email_input.length > 0) {
          var email_address = email_input[0].value;
          if (email_address != '' && validateEmail(email_address)) {
            var sha256_email_address = sha256(email_address);
            global_sha256_email_address = sha256_email_address; // запис у глобальну змінну
            writeCookie('global_sha256_email_address', sha256_email_address, 2); // запис у кукі
          } else {
            global_sha256_email_address = ''; // запису у глобальну змінну
            writeCookie('global_sha256_email_address', '', 2); // запис у кукі
          }
        }

        var phone_input = document.getElementsByName('Recipient[delivery_phone]');
        if (phone_input.length > 0) {
          var phone_number = phone_input[0].value;
          if (phone_number != '') {
            phone_number = phone_number.replace(/[\ \-\)\(\+]/g, '').trim();
            if (phone_number.match(/^\d+$/) && phone_number.length >= 12 && phone_number.length <= 14) {
              phone_number = '+' + phone_number;
              var sha256_phone_number = sha256(phone_number);
              global_sha256_phone_number = sha256_phone_number; // запис у глобальну змінну
              writeCookie('global_sha256_phone_number', sha256_phone_number, 2); // запис у кукі
            } else {
              global_sha256_phone_number = ''; // запис у глобальну змінну
              writeCookie('global_sha256_phone_number', '', 2); // запис у кукі
            }
          }
        }
        gtag('set', 'user_data', {
            "email": email_address,
            "phone_number": phone_number
        });
      });
    };
  }

// === script #2 (length=846) ===
(function(d) {
d.querySelectorAll('.j-phone-item').forEach(function (el) {
el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
})
})(document);
(function(d, w, s) {
var widgetHash = '6p3ays20dbcxpkecvodt', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
})(document, window, 'script');
const waitB = setInterval(() => {if (!!window.BinotelCallTracking) {
for (key in window.BinotelCallTracking) {
if(window.BinotelCallTracking[key]['initState']=="success"){
setTimeout(document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/\D/g, ''))),0)
clearInterval(waitB)}}}},1000)

// === script #3 (length=6818) ===
(function () {

function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

/* === Перевірка: чи це головна сторінка (ua/ru) === */
function isHomePage() {
  try {
    const p = (location.pathname || "").replace(/\/+$/, "");
    // "/" -> "" після replace, тому окремо обробляємо
    return p === "" || p === "/ru";
  } catch (e) {
    return false;
  }
}

/* === ТВОЯ оригинальная логика определения карточки товара === */
function isProductPage() {
  const words = [
    "Купить", "Купити",
    "Повідомити, коли з'явиться",
    "Сообщить, когда появится"
  ];

  const all = document.querySelectorAll("button, a");
  return [...all].some(el => {
    let t = (el.textContent || "").trim();
    return words.some(w => t.includes(w));
  });
}

/* === ТВОЇ 2 функції для каталогу === */
function isListingPage() {
  const og = document.querySelector('meta[property="og:type"]');
  if (!og) return false;

  const v = og.getAttribute("content") || "";
  return v === "product.group"; // ← Лістинг
}

function hasFilters() {
  return document.querySelector('.filterMenu, .catalog__sidebar') !== null;
}

function getCleanUrl() {
  try {
    let u = new URL(location.href.split("#")[0]);
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","fbclid"]
      .forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch(e) { return location.href; }
}

function getLang() {
  return location.pathname.includes("/ru/") ? "ru" : "ua";
}

function injectStyles() {
  if (document.getElementById("ai-sharing-style")) return;

  const css = `
.ai-share-wrapper { margin: 40px 0; padding: 10px 16px; text-align: left; }
.ai-share-title { font-size: 17px; font-weight: 700; margin-bottom: 22px; color: #333; }
.ai-share-row { display: flex; gap: 14px; flex-wrap: nowrap; }
.ai-share-btn {
  padding: 12px 28px; border-radius: 999px; font-size: 15px; font-weight: 600;
  background: #f4f4f4 !important; color: #555 !important; text-decoration: none;
  white-space: nowrap; display: inline-flex; align-items: center; justify-content: center;
  transition: .2s ease; box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}
.ai-share-btn:hover {
  background: #803888 !important; color: #fff !important;
  transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,0.18);
}
@media(max-width:700px){
  .ai-share-row{ overflow-x:auto; padding-bottom:4px; -webkit-overflow-scrolling: touch; }
  .ai-share-btn{ flex: 0 0 auto; }
}
`;
  const style = document.createElement("style");
  style.id = "ai-sharing-style";
  style.textContent = css;
  document.head.appendChild(style);
}

/* === ТИП СТОРІНКИ: + виключаємо головну === */
function getPageType() {
  if (isHomePage()) return "other";
  if (isListingPage() || hasFilters()) return "catalog";
  if (isProductPage()) return "product";
  return "other";
}

function buildLinks(lang, pageType) {
  const url = getCleanUrl();

  const ru = {
    product: {
      chatgpt: "Сделай подробный анализ этого товара: плюсы и ключевые характеристики - на основе страницы:+",
      perplexity: "Проанализируй товар на этой странице, выдели плюсы и ключевые особенности:+",
      google: "Кратко опиши основные плюсы товара и его ключевые особенности:+",
      grok: "Проанализируй товар на этой странице и перечисли его преимущества и недостатки:+"
    },
    catalog: {
      chatgpt: "Проанализируй эту страницу каталога: какие товары/подкатегории тут представлены, для кого они подходят, как выбрать по фильтрам, и на что обратить внимание:+",
      perplexity: "Сделай разбор страницы каталога: ключевые группы товаров, критерии выбора, важные фильтры и рекомендации:+",
      google: "Кратко опиши, что это за каталог, какие есть варианты и как выбрать с помощью фильтров:+",
      grok: "Проанализируй страницу каталога и подскажи, как выбрать товар по фильтрам и какие параметры важны:+"
    }
  };

  const ua = {
    product: {
      chatgpt: "Зроби детальний аналіз цього товару: плюси і ключові характеристики - на основі сторінки:+",
      perplexity: "Проаналізуй товар на цій сторінці, виділи плюси та ключові особливості:+",
      google: "Коротко опиши основні плюси товару і ключові особливості:+",
      grok: "Проаналізуй товар на цій сторінці та переліч його переваги:+"
    },
    catalog: {
      chatgpt: "Проаналізуй сторінку каталогу: які групи товарів тут є, кому вони підходять, як обирати через фільтри та на що звернути увагу:+",
      perplexity: "Зроби розбір каталогу: підкатегорії/типи товарів, критерії вибору, важливі фільтри та короткі рекомендації:+",
      google: "Коротко опиши, що це за каталог, які є варіанти і як вибрати через фільтри:+",
      grok: "Проаналізуй сторінку каталогу та підкажи, як вибрати товар за фільтрами і які параметри важливі:+"
    }
  };

  const dict = (lang === "ru" ? ru : ua);
  const d = (dict[pageType] || dict.product);

  return [
    { id:"chatgpt", label:"ChatGPT", href:"https://chatgpt.com/?q=" + encodeURIComponent(d.chatgpt + url) },
    { id:"google", label:"Google AI", href:"https://www.google.com/search?udm=50&aep=11&q=" + encodeURIComponent(d.google + url) },
    { id:"perplexity", label:"Perplexity", href:"https://www.perplexity.ai/search/new?q=" + encodeURIComponent(d.perplexity + url) },
    { id:"grok", label:"Grok", href:"https://grok.com/?q=" + encodeURIComponent(d.grok + url) }
  ];
}

function insertBeforeFooter(pageType) {
  injectStyles();

  const lang = getLang();
  const links = buildLinks(lang, pageType);

  const wrap = document.createElement("div");
  wrap.className = "ai-share-wrapper";

  const title = document.createElement("div");
  title.className = "ai-share-title";
  title.textContent = lang === "ru" ? "Поделиться в:" : "Поширити в:";
  wrap.appendChild(title);

  const row = document.createElement("div");
  row.className = "ai-share-row";

  links.forEach(item => {
    const a = document.createElement("a");
    a.className = "ai-share-btn ai-" + item.id;
    a.href = item.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.label;
    row.appendChild(a);
  });

  wrap.appendChild(row);

  const footer =
    document.querySelector("footer") ||
    document.querySelector(".footer") ||
    document.querySelector("footer.footer-wrapper");

  if (footer) {
    footer.parentNode.insertBefore(wrap, footer);
  } else {
    document.body.appendChild(wrap);
  }
}

onReady(() => {
  const pageType = getPageType();
  if (pageType === "product" || pageType === "catalog") {
    insertBeforeFooter(pageType);
  }
});

})();

// === script #4 (length=5708) ===
(function(){

try {

  /* --------------------------------------
      1) ВИЯВЛЕННЯ БЛОГУ
  --------------------------------------- */

  function isBlogPage() {
    const meta = document.querySelector('meta[property="article:section"]');
    return meta && meta.getAttribute("content") === "Блог";
  }


  /* --------------------------------------
      2) АВТО-ДОБАВЛЕННЯ КНОПОК
  --------------------------------------- */

  function insertShareButtons(){

    // мова
    const isRu = location.pathname.includes("/ru/");
    const t = isRu ? "Поделиться в:" : "Поширити в:";
    const u = location.href;

    const prompts = isRu
      ? {
          gpt: "Сделай подробный анализ этой статьи:+",
          px:  "Проанализируй статью и выдели ключевые факты:+",
          gl:  "Кратко опиши суть этой статьи:+",
          gr:  "Сформулируй основные вопросы и ответы по статье:+"
        }
      : {
          gpt: "Зроби структуроване резюме цієї статті:+",
          px:  "Перевір фактичні твердження та виділи підтверджену інформацію:+",
          gl:  "Коротко опиши основну тему статті:+",
          gr:  "Сформуй перелік запитань FAQ за статтею:+"
        };

    const html = `
      <div class="ai-sharing-wrapper">
        <div class="ai-sharing-title">${t}</div>
        <div class="ai-sharing">
          <a class="ai-chatgpt" target="_blank"
            href="https://chatgpt.com/?q=${encodeURIComponent(prompts.gpt + u)}">
            ChatGPT
          </a>
          <a class="ai-perplexity" target="_blank"
            href="https://www.perplexity.ai/search/new?q=${encodeURIComponent(prompts.px + u)}">
            Perplexity
          </a>
          <a class="ai-google" target="_blank"
            href="https://www.google.com/search?udm=50&aep=11&q=${encodeURIComponent(prompts.gl + u)}">
            Google AI
          </a>
          <a class="ai-grok" target="_blank"
            href="https://grok.com/?q=${encodeURIComponent(prompts.gr + u)}">
            Grok
          </a>
        </div>
      </div>
    `;

    const footer = document.querySelector("footer");
    if (footer) footer.insertAdjacentHTML("beforebegin", html);
  }


  function waitForArticle(callback){
    const timer = setInterval(() => {
      const el = document.querySelector(".article-text, .article");
      if (el) {
        clearInterval(timer);
        callback(el);
      }
    }, 50);
  }


  /* --------------------------------------
      4) ASK CHATGPT 
  --------------------------------------- */

  function initBubble(article){
    const isRu = location.pathname.includes("/ru/");
    const CHATGPT_BASE = "https://chatgpt.com/?q=";
    const MAX_LEN = 1800;

    // ТЕКСТИ ДЛЯ МОВ
    const UI_TEXT = isRu ? "Спросить у ChatGPT" : "Спитати у ChatGPT";
    const QUERY_TEXT = isRu 
        ? (txt) => `Объясни этот текст: "${txt}". Источник: ${location.href}`
        : (txt) => `Поясни цей текст: "${txt}". Джерело: ${location.href}`;

    const bubble = document.createElement("div");
    bubble.className = "askchatgpt-bubble is-hidden";
    bubble.innerHTML = `
      <img class="askchatgpt-icon" src="/content/uploads/images/logo_gpt.jpg">
      <span>${UI_TEXT}</span>
    `;
    document.body.appendChild(bubble);

    let lastText = "";

    function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }

    function getSelectionInside(){
      const sel = window.getSelection();
      if(!sel || !sel.rangeCount) return null;

      const range = sel.getRangeAt(0);
      if(range.collapsed) return null;

      let text = sel.toString().trim();
      if(!text) return null;

      let node = range.commonAncestorContainer;
      if(node.nodeType === 3) node = node.parentElement;
      if(!article.contains(node)) return null;

      let rect = range.getBoundingClientRect();
      if(rect.width === 0 && range.getClientRects().length)
        rect = range.getClientRects()[0];

      return {text, rect};
    }

    function showBubble(){
      const info = getSelectionInside();
      if(!info){ hideBubble(); return; }

      lastText = info.text;

      let top  = info.rect.top + window.scrollY - 40;
      let left = info.rect.left + window.scrollX;

      top  = clamp(top, 8, window.scrollY + window.innerHeight - 40);
      left = clamp(left, 8, window.scrollX + window.innerWidth - 200);

      bubble.style.top = top + "px";
      bubble.style.left = left + "px";
      bubble.classList.remove("is-hidden");
    }

    function hideBubble(){
      bubble.classList.add("is-hidden");
      lastText = "";
    }

    function openChatGPT(){
      if(!lastText) return;

      let txt = lastText;
      if(txt.length > MAX_LEN) txt = txt.slice(0,MAX_LEN)+"…";

      const q = QUERY_TEXT(txt);
      window.open(CHATGPT_BASE + encodeURIComponent(q), "_blank");

      hideBubble();
    }

    // Події
    document.addEventListener("selectionchange", ()=>setTimeout(showBubble,50));
    document.addEventListener("mouseup", ()=>setTimeout(showBubble,30));
    document.addEventListener("keyup", ()=>setTimeout(showBubble,30));
    document.addEventListener("touchend", ()=>setTimeout(showBubble,60));
    window.addEventListener("scroll", hideBubble);
    window.addEventListener("resize", hideBubble);
    bubble.addEventListener("click", openChatGPT);
}



  // Запуск бульбашки ТІЛЬКИ НА БЛОЗІ
  if (isBlogPage()) {
     // Запуск кнопок (працює завжди)
    insertShareButtons();
    waitForArticle(initBubble);
  }

} catch(e){
  console.error("ASKGPT SCRIPT ERROR:", e);
}

})();

// === script #5 (length=559) ===
(function(d) {
        d.querySelectorAll('.j-phone-item').forEach(function (el) {
            el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
        })
    })(document);
    (function(d, w, s) {
        var widgetHash = 's7mtyog78ilad2xhlp4y', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
        ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
        var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
      })(document, window, 'script');
