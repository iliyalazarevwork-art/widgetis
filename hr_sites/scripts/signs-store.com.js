// source: https://signs-store.com/
// extracted: 2026-05-07T21:19:20.610Z
// scripts: 2

// === script #1 (length=5237) ===
(function () {

function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

// URL без UTM и трекинга
function getCleanUrl() {
  try {
    let u = new URL(location.href.split("#")[0]);
    ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","fbclid"]
      .forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch(e) { 
    return location.href; 
  }
}

// Язык по URL
function getLang() {
//  return location.pathname.includes("/ru/") ? "ru" : "ua";
return location.pathname.includes("/ru/") ? "ru" : (location.pathname.includes("/en/") ? "en" : "ua");
}

// Стили для блока
function injectStyles() {
  if (document.getElementById("ai-sharing-style")) return;

  const css = `
  .ai-share-wrapper {
    margin: 40px 0;
    padding: 10px 16px;
    text-align: left;
  }

  .ai-share-title {
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 22px;
    color: #000;
  }

  .ai-share-row {
    display: flex;
    gap: 14px;
    flex-wrap: nowrap;
  }

  .ai-share-btn {
    padding: 12px 28px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 600;
    background: #333 !important;
    color: #ffdd8a !important;
    text-decoration: none;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: .2s ease;
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  }

  .ai-share-btn:hover {
    background: #4a4a4a !important;
    color: #ffdd8a !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(0,0,0,0.18);
  }

  @media(max-width:700px){
    .ai-share-row{
      overflow-x:auto;
      padding-bottom:20px;
      -webkit-overflow-scrolling: touch;
    }
    .ai-share-btn{
      flex: 0 0 auto;
    }
  }
  `;

  const style = document.createElement("style");
  style.id = "ai-sharing-style";
  style.textContent = css;
  document.head.appendChild(style);
}

// Генерация ссылок под язык
function buildLinks(lang) {
  const url = getCleanUrl();

  const ru = {
    chatgpt: "Сделай подробный анализ этого товара: плюсы и ключевые характеристики - на основе страницы:+",
    perplexity: "Проанализируй товар на этой странице, выдели плюсы и ключевые особенности:+",
    google: "Кратко опиши основные плюсы товара и его ключевые особенности:+",
    grok: "Проанализируй товар на этой странице и перечисли его преимущества и недостатки:+"
  };

 const en = {
    chatgpt: "Make a detailed analysis of this product: advantages and key features - based on the page:+",
    perplexity: "Analyze the product on this page, highlight the advantages and key features:+",
    google: "Briefly describe the main advantages of the product and its key features:+",
    grok: "Analyze the product on this page and list its advantages and disadvantages:+"
  };

  const ua = {
    chatgpt: "Зроби детальний аналіз цього товару: плюси і ключові характеристики - на основі сторінки:+",
    perplexity: "Проаналізуй товар на цій сторінці, виділи плюси та ключові особливості:+",
    google: "Коротко опиши основні плюси і його ключові особливості:+",
    grok: "Проаналізуй товар на цій сторінці та переліч його переваги:+"
  };

 // const d = lang === "ru" ? ru : ua;
const d = lang === "ru" ? ru : (lang === "en" ? en : ua);

  return [
    { id:"chatgpt", label:"ChatGPT", href:"https://chatgpt.com/?q=" + encodeURIComponent(d.chatgpt + url) },
    { id:"google", label:"Google AI", href:"https://www.google.com/search?udm=50&aep=11&q=" + encodeURIComponent(d.google + url) },
    { id:"perplexity", label:"Perplexity", href:"https://www.perplexity.ai/search/new?q=" + encodeURIComponent(d.perplexity + url) },
    { id:"grok", label:"Grok", href:"https://grok.com/?q=" + encodeURIComponent(d.grok + url) }
  ];
}

// Вставка перед футером
function insertBeforeFooter() {
  injectStyles();

  const lang = getLang();
  const links = buildLinks(lang);

  const wrap = document.createElement("div");
  wrap.className = "ai-share-wrapper";

  const title = document.createElement("div");
  title.className = "ai-share-title";
  title.textContent = lang === "ru" ? "Больше информации в:" : (lang === "en" ? "More details in:" : "Більш детально в:");
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

  if (footer && footer.parentNode) {
    footer.parentNode.insertBefore(wrap, footer);
  } else {
    document.body.appendChild(wrap);
  }
}

onReady(() => {
  // БЕЗ проверки isProductPage — выполняем везде
  insertBeforeFooter();
});

})();

// === script #2 (length=2051) ===
(function() {
    const currentUrl = window.location.href;

    // 1. Исключаем страницы /en/ и /ru/
    if (currentUrl.startsWith('https://signs-store.com/en/') || 
        currentUrl.startsWith('https://signs-store.com/ru/')) {
        return; 
    }

    // 2. Ищем мета-тег SKU
    const skuElement = document.querySelector('meta[itemprop="sku"]');
    if (!skuElement || !skuElement.getAttribute('content')) return;

    const sku = skuElement.getAttribute('content').trim();
    
    // 3. ПРАВИЛЬНЫЙ ДОМЕН .com.ua и путь
    const jsonUrl = 'https://super-longma-e7eb11.netlify.app/' + sku + '.txt';

    // 4. Ищем существующий скрипт Product
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    let targetScript = null;

    for (let s of scripts) {
        if (s.textContent.includes('"@type": "Product"') || s.textContent.includes('"@type":"Product"')) {
            targetScript = s;
            break;
        }
    }

    // 5. Загружаем и очищаем от лишнего текста (типа - - - UA - - -)
    fetch(jsonUrl)
        .then(response => {
            if (!response.ok) throw new Error('Файл не найден: ' + jsonUrl);
            return response.text();
        })
        .then(rawText => {
            // Регулярное выражение находит всё от первой { до последней }
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('В файле не найден JSON-объект');
            
            const cleanJson = jsonMatch[0]; // Берем только найденный JSON

            if (targetScript) {
                targetScript.textContent = cleanJson;
            } else {
                const newScript = document.createElement('script');
                newScript.type = 'application/ld+json';
                newScript.text = cleanJson;
                document.head.appendChild(newScript);
            }
        })
        .catch(err => {
            console.warn('Ошибка микроразметки:', err.message);
        });
})();
