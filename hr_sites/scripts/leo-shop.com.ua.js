// source: https://leo-shop.com.ua/
// extracted: 2026-05-07T21:19:13.646Z
// scripts: 2

// === script #1 (length=1473) ===
(function (k, w, i, z, b, o, t) {k['KwizbotWidget'] = b; k[b] = k[b] || function () { w.head.insertAdjacentHTML('beforeend', '<style type="text/css">.showAfterCssLoaded{display: none}</style>'); (k[b].q = k[b].q || []).push(arguments) }, k[b].l = 1 * new Date(); o = w.createElement(i), t = w.getElementsByTagName(i)[0]; o.async = 1; o.src = z; t.parentNode.insertBefore(o, t) })(window, document, 'script', 'https://widget-leoshop.kwizbot.io/kwjs.js', 'kw');
kw('init', {"language_code":"uk","bot_id":"2","params_from_site":{},"widgetButton":{"type":"multi","position":{"y":"bottom","x":"right","offset":25}},"multi_channel":{"button_title":"Напишіть нам","messengers":{"viber":"viber://pa?chatURI=inet_magaz","telegram":"https://t.me/info_mag_bot","facebook":"","whatsapp":""}},"launcher":{"type":"icon","closeIcon":"close","openIcon":"chat_bubble"},"colors":{"device":{"bg":"linear-gradient(130deg, #734FE1, #D14EE0)","dot":"#B8A6EE","border":"#E4E4E4","container":"linear-gradient(130deg, #594DA0, #7D5BAA)"},"keyboardButton":{"border":"#BB0044","bg":"#BB0044","text":"#FFFFFF"},"header":{"bg":"linear-gradient(130deg, #734FE1, #D14EE0)","dot":"#B8A6EE","text":"#ffffff"},"poweredLink":{"color":"#FFFFFF"},"userInput":{"bg":"linear-gradient(130deg, #594DA0, #7D5BAA)","border":"transparent","text":"#FFFFFF"},"sentMessage":{"bg":"#4e8cff","text":"#ffffff"},"receivedMessage":{"bg":"#eaeaea","text":"#222222"},"inlineKeyboardButton":{"bg":"#4e8cff","text":"#4e8cff"}}})

// === script #2 (length=7258) ===
// ======================
// 🌐 СТРАНИЦЫ ТОЛЬКО ЗАКАЗЫ/ЧАС
// ======================
const onlyOrdersPages = [
  "/",
  "/ua/",
  "/katalog/",
  "/ua/katalog/",
  "/katalog/search/",
  "/ua/katalog/search/"
];

function isOnlyOrdersPage() {
  let path = window.location.pathname;
  if (!path.endsWith("/")) path += "/";
  return onlyOrdersPages.includes(path);
}

// ======================
// 🌐 ЯЗЫК
// ======================
function getLang() {
  return window.location.pathname.startsWith('/ua') ? 'ua' : 'ru';
}

// ======================
// 📦 СТРАНИЦА ТОВАРА
// ======================
const buyBtn = document.querySelector('button[type="submit"], .buy-button, .product__buy, .addtocart');
const isProductPage = !!buyBtn;

function isOutOfStock() {
  const text = document.body.innerText.toLowerCase();
  return text.includes('немає в наявності') || text.includes('нет в наличии');
}

// ======================
// 🔢 RANDOM
// ======================
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ======================
// 🟢 POPUP ПОКУПКИ
// ======================
function showPurchasePopup() {

  const lang = getLang();

  const names = ["Олександр","Максим","Дмитро","Андрій","Ігор","Марія","Олена","Ірина","Оксана"];
  const cities = ["Київ","Львів","Одеса","Харків","Дніпро"];

  const texts = {
    ua: "оформив(ла) замовлення • щойно",
    ru: "оформил(а) заказ • только что"
  };

  const popup = document.createElement("div");

  popup.innerHTML = `
    <div style="display:flex; gap:10px; align-items:center;">
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:#77BA1A;color:#fff;
        display:flex;align-items:center;justify-content:center;
        font-weight:600;">
        ${names[0][0]}
      </div>

      <div style="font-size:14px;">
        <b>${names[random(0,names.length-1)]}</b> ${cities[random(0,cities.length-1)]}<br>
        ${texts[lang]}
      </div>
    </div>
  `;

  popup.style.position = "fixed";
  popup.style.left = "20px";
  popup.style.bottom = "20px";
  popup.style.background = "#fff";
  popup.style.padding = "12px";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
  popup.style.zIndex = "9999";

  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 6000);

  decreaseStock(); // 👈 ДОБАВИЛ ТОЛЬКО ЭТО
}

// ======================
// 🔥 POPUP ЗАКАЗЫ ЗА ЧАС
// ======================
function showOrdersHourPopup() {

  const lang = getLang();

  const texts = {
    ua: "замовлень за останню годину",
    ru: "заказов за последний час"
  };

  const popup = document.createElement("div");

  popup.innerHTML = `
    <div style="font-size:14px;">
      🔥 <b style="color:#77BA1A;">${random(200,400)}</b> ${texts[lang]}
    </div>
  `;

  popup.style.position = "fixed";
  popup.style.left = "20px";
  popup.style.bottom = "20px";
  popup.style.background = "#fff";
  popup.style.padding = "12px";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
  popup.style.zIndex = "9999";

  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 6000);
}

// ======================
// 👁 ПРОСМОТРЫ
// ======================
function createViewingBadge() {

  if (!isProductPage || isOutOfStock()) return;

  const lang = getLang();

  const texts = {
    ua: "👁 Зараз переглядають цей товар",
    ru: "👁 Сейчас смотрят этот товар"
  };

  const badge = document.createElement("div");

  badge.innerHTML = `
    ${texts[lang]} 
    <b style="color:#77BA1A;">${random(15,40)} людей </b>
  `;

  badge.style.margin = "5px 0";
  badge.style.fontSize = "14px";
  badge.style.fontFamily = "Rubik, sans-serif";
  badge.style.background = "rgba(119,186,26,0.08)";
  badge.style.padding = "8px 12px";
  badge.style.borderRadius = "10px";

  const elements = document.querySelectorAll("div, span, p");
  let target = null;

  elements.forEach(el => {
    const text = el.innerText?.toLowerCase() || "";
    if (text.includes("оптовые цены") || text.includes("оптові ціни")) {
      target = el;
    }
  });

  if (target && target.parentNode && target.parentNode.parentNode) {
    target.parentNode.parentNode.insertBefore(badge, target.parentNode);
  }
}

// ======================
// 🟠 СЧЕТЧИК АКЦИИ
// ======================
function getProductKey() {
  let path = window.location.pathname;
  path = path.replace(/^\/ua\//, '/');
  return "stock_" + path;
}

function getStockSession() {
  const key = getProductKey();
  let data = localStorage.getItem(key);

  if (data) {
    data = JSON.parse(data);
    if (Date.now() - data.time < 600000) return data;
  }

  const newData = {
    count: random(30, 60),
    time: Date.now()
  };

  localStorage.setItem(key, JSON.stringify(newData));
  return newData;
}

// ======================
// 📉 УМЕНЬШЕНИЕ (ДОБАВИЛИ)
// ======================
function decreaseStock() {
  const key = getProductKey();
  let data = localStorage.getItem(key);

  if (!data) return;

  data = JSON.parse(data);

  if (data.count > 1) {
    data.count -= 1;
    localStorage.setItem(key, JSON.stringify(data));
  }

  renderStockBadge();
}

// ======================
// 🎯 ОТРИСОВКА СЧЕТЧИКА
// ======================
function renderStockBadge() {

  if (!isProductPage || isOutOfStock()) return;

  const lang = getLang();

  const texts = {
    ua: "🔥 Залишилось товарів по акції:",
    ru: "🔥 Осталось товаров по акции:"
  };

  let badge = document.getElementById("stock-badge");
  const data = getStockSession();

  if (!badge) {
    badge = document.createElement("div");
    badge.id = "stock-badge";

    badge.style.margin = "10px auto";
    badge.style.textAlign = "center";
    badge.style.background = "rgba(119,186,26,0.08)";
    badge.style.padding = "12px";
    badge.style.borderRadius = "12px";
    badge.style.maxWidth = "350px";

    const elements = document.querySelectorAll("div, span, p");
    let target = null;

    elements.forEach(el => {
      const t = el.innerText?.toLowerCase() || "";
      if (t.includes("до кінця акції") || t.includes("до конца акции")) {
        target = el;
      }
    });

    if (target && target.parentNode) {
      target.parentNode.insertBefore(badge, target);
    } else {
      document.body.appendChild(badge);
    }
  }

  badge.innerHTML = `
    ${texts[lang]}
    <span style="color:#77BA1A; font-weight:600;">
      ${data.count} шт
    </span>
  `;
}

// ======================
// 🚀 ЗАПУСК
// ======================

if (isOnlyOrdersPage()) {

  function loop() {
    showOrdersHourPopup();
    setTimeout(loop, random(12000,15000));
  }

  setTimeout(loop, 2000);

} else {

  if (isProductPage) {
    createViewingBadge();

    function loop() {
      if (!isOutOfStock()) showPurchasePopup();
      setTimeout(loop, random(12000,15000));
    }

    setTimeout(loop, 2000);
  }

  setTimeout(renderStockBadge, 1000);
}
