// source: https://toolbase.com.ua/
// extracted: 2026-05-07T21:23:00.744Z
// scripts: 5

// === script #1 (length=5838) ===
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
            "sha256_email_address": global_sha256_email_address,
            "sha256_phone_number": global_sha256_phone_number
        });
      });
    };
  }

// === script #2 (length=4646) ===
document.addEventListener("DOMContentLoaded", function () {

  function getPrice(text) {
    return parseFloat((text || "").replace(/[^\d]/g, ""));
  }

  function formatPrice(num) {
    return num.toLocaleString("uk-UA") + " грн";
  }

  /* ===== ДЕСКТОП ===== */
  function renderDesktop() {
    document.querySelectorAll(".product-price").forEach(function (block) {
      const newPriceEl = block.querySelector(".product-price__item, .product-price__item--new");
      const oldPriceEl = block.querySelector(".product-price__old-price");

      if (!newPriceEl || !oldPriceEl) return;

      const newPrice = getPrice(newPriceEl.textContent);
      const oldPrice = getPrice(oldPriceEl.textContent);

      if (!newPrice || !oldPrice || oldPrice <= newPrice) return;

      let topRow = block.querySelector(".price-top-row");

      if (!topRow) {
        topRow = document.createElement("div");
        topRow.className = "price-top-row";
        block.prepend(topRow);
      }

      if (!topRow.contains(oldPriceEl)) {
        topRow.appendChild(oldPriceEl);
      }

      let save = topRow.querySelector(".price-save");

      if (!save) {
        save = document.createElement("span");
        save.className = "price-save";
        topRow.appendChild(save);
      }

      save.textContent = `-${(oldPrice - newPrice).toLocaleString("uk-UA")} грн`;
    });
  }

  /* ===== МОБІЛЬНА (БЕЗ ЛОМАННЯ МІКРОРОЗМІТКИ) ===== */
  function renderMobile() {
    if (window.innerWidth > 768) return;

    document.querySelectorAll(".product-card__price-box").forEach(function (priceBox) {
      const items = priceBox.querySelectorAll(".product-card__price-item");
      if (!items.length) return;

      const newPriceEl = items[0].querySelector(".product-card__price, .product-card__price--new");
      if (!newPriceEl) return;

      const oldPriceEl = items[1]
        ? items[1].querySelector(".product-card__old-price, .product-card__price--old, .product-card__price")
        : null;

      const newPrice = getPrice(newPriceEl.textContent);
      const oldPrice = oldPriceEl ? getPrice(oldPriceEl.textContent) : 0;

      if (!newPrice) return;

      /* ховаємо тільки візуальні старі елементи, але НЕ видаляємо їх з DOM */
      items.forEach(function (item) {
        item.style.display = "none";
      });

      const nativeDiscount = priceBox.parentElement
        ? priceBox.parentElement.querySelector(".product-card__discount")
        : null;

      if (nativeDiscount) {
        nativeDiscount.style.display = "none";
      }

      let customBox = priceBox.querySelector(".mobile-custom-price");

      if (!customBox) {
        customBox = document.createElement("div");
        customBox.className = "mobile-custom-price";
        customBox.style.display = "block";
        customBox.style.width = "100%";
        customBox.style.margin = "0";
        customBox.style.padding = "0";

        priceBox.appendChild(customBox);
      }

      if (oldPriceEl && oldPrice && oldPrice > newPrice) {
        customBox.innerHTML = `
          <div style="display:block;width:100%;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="font-size:16px;color:#8f8f8f;text-decoration:line-through;">
                ${formatPrice(oldPrice)}
              </span>
              <span style="
                background:#ffd9df;
                color:#ff0033;
                font-size:13px;
                font-weight:600;
                border-radius:6px;
                padding:2px 8px;
                white-space:nowrap;
              ">
                -${formatPrice(oldPrice - newPrice)}
              </span>
            </div>
            <div style="
              font-size:30px;
              font-weight:800;
              color:#e60023;
              line-height:1.1;
            ">
              ${formatPrice(newPrice)}
            </div>
          </div>
        `;
      } else {
        customBox.innerHTML = `
          <div style="display:block;width:100%;">
            <div style="
              font-size:30px;
              font-weight:800;
              color:#000;
              line-height:1.1;
            ">
              ${formatPrice(newPrice)}
            </div>
          </div>
        `;
      }
    });
  }

  function renderAll() {
    renderDesktop();
    renderMobile();
  }

  renderAll();
  setTimeout(renderAll, 500);
  setTimeout(renderAll, 1200);
  setTimeout(renderAll, 2000);

});

// === script #3 (length=4999) ===
function updateDeliveryLabels() {
  const rows = document.querySelectorAll(".tb-row");
  if (!rows.length) return;

  const statusNodes = document.querySelectorAll(".product-header__availability, .presence-status");
  const statuses = Array.from(statusNodes)
    .map(function (el) {
      return el.textContent.replace(/\s+/g, " ").trim().toLowerCase();
    })
    .filter(Boolean);

  const titleEl =
    document.querySelector(".product-title") ||
    document.querySelector("h1") ||
    document.querySelector(".page-title") ||
    document.querySelector("[itemprop='name']");

  const productTitle = titleEl
    ? titleEl.textContent.replace(/\s+/g, " ").trim().toLowerCase()
    : "";

  const brands = [
    "yato", "airkraft", "auarita", "standart", "toptul", "torin", "protester",
    "launch", "vitals", "ingco", "nowa", "powercraft", "кентавр",
    "gtm", "ego", "dewalt", "sequoia", "milwaukee"
  ];

  const hasBrand = brands.some(function (b) {
    return productTitle.includes(b);
  });

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  const htmlLang = (document.documentElement.lang || "").toLowerCase();
  const isRu = htmlLang.startsWith("ru") || /^\/ru(\/|$)/.test(location.pathname);

  function has(text) {
    return statuses.some(function (s) {
      return s.includes(text);
    });
  }

  const statusToday = has("відправимо сьогодні") || has("отправим сегодня");

  const statusOut =
    has("немає в наявності") ||
    has("нема в наявності") ||
    has("нет в наличии");

  const statusInStock =
    !statusOut && (has("в наявності") || has("в наличии"));

  function phrase(key) {
    const ua = {
      shipToday: "Відправимо сьогодні",
      shipTomorrow: "Відправимо завтра",
      shipMonday: "Відправимо у понеділок",
      shipTuesday: "Відправимо у вівторок",
      shipStock: "Відправимо 1-3 дні",
      pickupToday: "Отримати сьогодні",
      pickupTomorrow: "Отримати завтра",
      pickupMonday: "Отримати в понеділок"
    };

    const ru = {
      shipToday: "Отправим сегодня",
      shipTomorrow: "Отправим завтра",
      shipMonday: "Отправим в понедельник",
      shipTuesday: "Отправим во вторник",
      shipStock: "Отправим 1-3 дня",
      pickupToday: "Получить сегодня",
      pickupTomorrow: "Получить завтра",
      pickupMonday: "Получить в понедельник"
    };

    return (isRu ? ru : ua)[key];
  }

  let shipText = "";
  let pickupText = "";

  if (statusOut) {
    shipText = "";
    pickupText = "";
  } else if (day === 6) {
    if (statusToday || hasBrand) {
      shipText = phrase("shipMonday");
    } else if (statusInStock) {
      shipText = phrase("shipTuesday");
    }

    if (statusToday) {
      pickupText = phrase("pickupMonday");
    }
  } else if (day === 0) {
    if (statusToday || hasBrand) {
      shipText = phrase("shipTomorrow");
    } else if (statusInStock) {
      shipText = phrase("shipTuesday");
    }

    if (statusToday) {
      pickupText = phrase("pickupTomorrow");
    }
  } else if (day === 5 && hour >= 16) {
    if (statusToday) {
      shipText = phrase("shipMonday");
      pickupText = phrase("pickupMonday");
    } else if (hasBrand) {
      shipText = phrase("shipMonday");
    } else if (statusInStock) {
      shipText = phrase("shipTuesday");
    }
  } else {
    if (statusToday) {
      shipText = hour < 15 ? phrase("shipToday") : phrase("shipTomorrow");
      pickupText = hour < 17 ? phrase("pickupToday") : phrase("pickupTomorrow");
    } else if (hasBrand) {
      shipText = phrase("shipTomorrow");
    } else if (statusInStock) {
      shipText = phrase("shipStock");
    }
  }

  rows.forEach(function (row) {
    const ship = row.querySelector(".tb-ship");
    const nameEl = row.querySelector(".tb-name");
    if (!ship || !nameEl) return;

    const deliveryName = nameEl.textContent.replace(/\s+/g, " ").trim().toLowerCase();

    const isPickup =
      deliveryName.includes("самовивіз") ||
      deliveryName.includes("самовывоз");

    const isAddressCourier =
      deliveryName.includes("кур'єр на вашу адресу") ||
      deliveryName.includes("курьер на ваш адрес") ||
      deliveryName.includes("києв") ||
      deliveryName.includes("киев");

    if (isAddressCourier) {
      ship.textContent = "";
      return;
    }

    const raw = ship.innerHTML.replace(/&nbsp;/g, "").trim();
    if (raw === "") return;

    if (isPickup) {
      ship.textContent = pickupText;
    } else {
      ship.textContent = shipText;
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  updateDeliveryLabels();
  setTimeout(updateDeliveryLabels, 300);
  setTimeout(updateDeliveryLabels, 800);
  setTimeout(updateDeliveryLabels, 1500);
});

window.addEventListener("load", function () {
  updateDeliveryLabels();
  setTimeout(updateDeliveryLabels, 300);
});

// === script #4 (length=8085) ===
(function () {
  if (document.getElementById('toolbase-premium-style')) return;

  var style = document.createElement('style');
  style.id = 'toolbase-premium-style';

  style.innerHTML = `

  /* BIG / SMALL full-width images */
  .tb-product-description .image-block{
    width:100% !important;
    margin:28px 0 !important;
    overflow:hidden !important;
    border-radius:18px !important;
  }

  .tb-product-description .image-block img{
    display:block !important;
    width:100% !important;
    height:auto !important;
    border-radius:18px !important;
    transition:transform .45s ease, box-shadow .45s ease !important;
    transform:scale(1) !important;
  }

  .tb-product-description .image-block img:hover{
    transform:scale(1.04) !important;
  }

  /* MINI style */
  .tb-style-mini .tb-short-intro{
    font-size:17px !important;
    line-height:1.6 !important;
    margin:0 0 18px !important;
  }

  .tb-style-mini .tb-product-image-single{
    margin:20px 0 !important;
    text-align:center !important;
  }

  .tb-style-mini .tb-product-image-single img{
    display:block !important;
    width:100% !important;
    max-width:420px !important;
    height:auto !important;
    margin:0 auto !important;
    border-radius:16px !important;
    transition:transform .45s ease !important;
  }

  .tb-style-mini .tb-product-image-single img:hover{
    transform:scale(1.04) !important;
  }

  .tb-style-mini .tb-advantages-grid{
    grid-template-columns:repeat(3,1fr) !important;
  }

  @media (min-width:769px){

    .tb-product-description,
    .tb-product-description *{
      box-sizing:border-box !important;
    }

    .tb-feature-card,
    .tb-feature-card.right{
      display:flex !important;
      align-items:center !important;
      width:100% !important;
      max-width:100% !important;
      padding:16px 20px !important;
      margin:18px 0 !important;
      background:#fff !important;
      border:1px solid #e1ebe6 !important;
      border-radius:18px !important;
      box-shadow:0 3px 12px rgba(0,0,0,0.04) !important;
      overflow:hidden !important;
      clear:both !important;
    }

    .tb-feature-content{
      display:flex !important;
      align-items:center !important;
      gap:28px !important;
      width:100% !important;
      min-height:0 !important;
    }

    .tb-feature-card.right .tb-feature-content{
      flex-direction:row-reverse !important;
    }

    .tb-universal-img{
      display:block !important;
      width:24% !important;
      max-width:260px !important;
      max-height:210px !important;
      height:auto !important;
      object-fit:contain !important;
      border-radius:14px !important;
      margin:0 !important;
      flex-shrink:0 !important;
      transition:transform .45s ease !important;
    }

    .tb-universal-img:hover{
      transform:scale(1.06) !important;
    }

    .tb-feature-text{
      flex:1 !important;
      min-width:0 !important;
    }

    .tb-feature-text h3{
      margin:0 0 10px !important;
      font-size:22px !important;
      line-height:1.3 !important;
      color:#0f4b3f !important;
      font-weight:700 !important;
    }

    .tb-feature-text p{
      margin:0 0 9px !important;
      font-size:17px !important;
      line-height:1.5 !important;
    }

    .tb-intro-card,
    .tb-specs-card{
      padding:16px 18px !important;
      margin:18px 0 !important;
    }

    .tb-note-buy{
      margin:18px 0 !important;
      padding:14px 18px !important;
    }
  }

  @media (max-width:768px){

    .tb-product-description{
      padding:0 10px !important;
      font-size:16px !important;
      line-height:1.65 !important;
      color:#253238 !important;
      overflow:visible !important;
      padding-bottom:70px !important;
    }

    .tb-product-description h2{
      font-size:23px !important;
      line-height:1.3 !important;
      margin:0 0 18px !important;
      color:#0f4b3f !important;
      font-weight:700 !important;
    }

    .tb-product-description h3{
      font-size:21px !important;
      margin:26px 0 14px !important;
      color:#0f4b3f !important;
      font-weight:700 !important;
    }

    .tb-style-mini .tb-product-image-single img{
      max-width:100% !important;
      border-radius:12px !important;
    }

    .tb-style-mini .tb-product-image-single img:hover{
      transform:none !important;
    }

    .tb-style-mini .tb-advantages-grid{
      grid-template-columns:1fr !important;
    }

    .tb-intro-card{
      border:none !important;
      box-shadow:none !important;
      background:#fff !important;
      padding:0 !important;
      margin:0 0 22px !important;
    }

    .tb-intro-card p{
      font-size:16px !important;
      line-height:1.65 !important;
      margin:0 0 14px !important;
    }

    .tb-feature-card,
    .tb-feature-card.right{
      border:none !important;
      box-shadow:none !important;
      background:#fff !important;
      padding:0 !important;
      margin:28px 0 !important;
      border-radius:0 !important;
      overflow:visible !important;
    }

    .tb-feature-content,
    .tb-feature-card.right .tb-feature-content{
      display:block !important;
    }

    .tb-universal-img{
      display:block !important;
      width:100% !important;
      max-width:100% !important;
      height:auto !important;
      margin:12px 0 18px !important;
      padding:0 !important;
      border:none !important;
      box-shadow:none !important;
      background:none !important;
      border-radius:0 !important;
      object-fit:contain !important;
    }

    .tb-product-description .image-block{
      margin:20px 0 !important;
      border-radius:14px !important;
    }

    .tb-product-description .image-block img{
      border-radius:14px !important;
    }

    .tb-product-description .image-block img:hover{
      transform:none !important;
    }

    .tb-feature-text h3{
      font-size:21px !important;
      line-height:1.35 !important;
      margin:0 0 10px !important;
      color:#0f4b3f !important;
    }

    .tb-feature-text p{
      font-size:16px !important;
      line-height:1.65 !important;
      margin:0 0 12px !important;
    }

    .tb-advantages-grid{
      display:grid !important;
      grid-template-columns:1fr !important;
      gap:10px !important;
      margin:14px 0 24px !important;
    }

    .tb-advantage-card{
      background:#fff !important;
      border:1px solid #e1ebe6 !important;
      border-left:4px solid #FCC305 !important;
      border-radius:12px !important;
      padding:13px 15px !important;
      box-shadow:none !important;
      font-size:16px !important;
      line-height:1.45 !important;
    }

    .tb-specs-card{
      border:none !important;
      box-shadow:none !important;
      background:#fff !important;
      padding:0 !important;
      margin:24px 0 !important;
    }

    .tb-specs-grid{
      display:grid !important;
      grid-template-columns:1fr !important;
      gap:8px !important;
    }

    .tb-spec-row{
      display:flex !important;
      justify-content:space-between !important;
      gap:12px !important;
      background:#f8faf9 !important;
      border:1px solid #e5eee9 !important;
      border-left:4px solid #FCC305 !important;
      border-radius:10px !important;
      padding:11px 13px !important;
      box-shadow:none !important;
    }

    .tb-spec-row span{
      color:#5e6d68 !important;
      font-size:15px !important;
      line-height:1.4 !important;
    }

    .tb-spec-row strong{
      color:#1f2f2b !important;
      font-size:15px !important;
      line-height:1.4 !important;
      text-align:right !important;
    }

    .tb-faq{
      margin-top:24px !important;
      padding-bottom:80px !important;
    }
  }
  `;

  document.head.appendChild(style);
})();

// === script #5 (length=581) ===
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'G-1XQXEY2RRQ', 'auto');
  ga('require', 'ec');
  ga('set', '&cu', GLOBAL.currency.iso);

   // заменяется кодом инициализации события с расположением "Внутри кода инициализации маркетинговой системы"
  
  ga('send', 'pageview');
