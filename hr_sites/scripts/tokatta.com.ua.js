// source: https://tokatta.com.ua/
// extracted: 2026-05-07T21:19:27.315Z
// scripts: 1

// === script #1 (length=5337) ===
(function () {

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* === ТВОЯ оригинальная логика определения карточки товара === */
  function isProductPage() {
    const words = [
      "Купить", "Купити",
      "В кредит", "Замовити швидко",
      "Повідомити, коли з'явиться",
      "Сообщить, когда появится"
    ];

    const all = document.querySelectorAll("button, a");

    return [...all].some(el => {
      let t = (el.textContent || "").trim();
      return words.some(w => t.includes(w));
    });
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
      .ai-share-wrapper {
        margin: 40px 0;
        padding: 10px 16px;
        text-align: left;
      }

      .ai-share-title {
        font-size: 17px;
        font-weight: 700;
        margin-bottom: 22px;
        color: #333;
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
        background: #f4f4f4 !important;
        color: #555 !important;
        text-decoration: none;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: .2s ease;
        box-shadow: 0 6px 18px rgba(0,0,0,0.12);
      }

      .ai-share-btn:hover {
        background: #e9e9e9 !important;
        color: #333 !important;
        transform: translateY(-2px);
        box-shadow: 0 8px 22px rgba(0,0,0,0.18);
      }

      @media(max-width:700px){
        .ai-share-row{
          overflow-x:auto;
          padding-bottom:4px;
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

  function buildLinks(lang) {
    const url = getCleanUrl();

    const ru = {
      chatgpt:    "Сделай подробный анализ этого товара: плюсы и ключевые характеристики - на основе страницы:+",
      perplexity: "Проанализируй товар на этой странице, выдели плюсы и ключевые особенности:+",
      google:     "Кратко опиши основные плюсы товара и его ключевые особенности:+",
      grok:       "Проанализируй товар на этой странице и перечисли его преимущества и недостатки:+"
    };

    const ua = {
      chatgpt:    "Зроби детальний аналіз цього товару: плюси і ключові характеристики - на основі сторінки:+",
      perplexity: "Проаналізуй товар на цій сторінці, виділи плюси та ключові особливості:+",
      google:     "Коротко опиши основні плюси і його ключові особливості:+",
      grok:       "Проаналізуй товар на цій сторінці та переліч його переваги:+"
    };

    const d = lang === "ru" ? ru : ua;

    return [
      { id:"chatgpt", label:"ChatGPT", href:"https://chatgpt.com/?q=" + encodeURIComponent(d.chatgpt + url) },
      { id:"google", label:"Google AI", href:"https://www.google.com/search?udm=50&aep=11&q=" + encodeURIComponent(d.google + url) },
      { id:"perplexity", label:"Perplexity", href:"https://www.perplexity.ai/search/new?q=" + encodeURIComponent(d.perplexity + url) },
      { id:"grok", label:"Grok", href:"https://grok.com/?q=" + encodeURIComponent(d.grok + url) }
    ];
  }

  /* === Единственное изменение — вставка перед футером === */
  function insertBeforeFooter() {
    injectStyles();

    const lang = getLang();
    const links = buildLinks(lang);

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
    if (isProductPage()) insertBeforeFooter();
  });

})();
