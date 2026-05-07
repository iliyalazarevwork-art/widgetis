// source: https://baseartua.com/
// extracted: 2026-05-07T21:20:54.322Z
// scripts: 3

// === script #1 (length=4343) ===
document.addEventListener("DOMContentLoaded", function() {
    var mapaBtn = document.querySelector('a.footer__link[href="/kontaktna-informatsiya/"]');
    var callBackBtn = document.querySelectorAll('a[data-modal="#call-me"]');
    
    

    if (callBackBtn) {
      callBackBtn.forEach(btn => {
        btn.style.display = 'none';
      })
      // callBackBtn.style.display = 'none';
    }


    if (mapaBtn) {
      mapaBtn.style.display = 'none';

    }
const orderDetails = document.querySelector('.order-details');
if (orderDetails) {
	const detailsDiv = document.createElement('div');
	const detailsText = document.createElement('p');

	detailsDiv.className = "order-details-i";
	detailsText.className = "order-details-text";

 
detailsText.innerHTML = '<div style="line-height: 1.5; margin-top: 20px;">' +
'Термін виготовлення: <b>7–10 календарних днів після оплати.</b> ' +
'Кожну річ друкуємо <b>індивідуально</b> під ваше замовлення.<br>' +
'<b>600+</b> принтів, <b>20 000+</b> комбінацій моделей і розмірів.<br>' +
'<b>Результат вартий очікування.</b><br><br>' +
'Переконайтесь самі - <a href="https://baseartua.com/vidhuky/" target="_blank" style="text-decoration: underline; font-weight: bold; color: inherit;">відгуки з фото наших покупців тут</a>' +
'</div>';

detailsText.style.fontWeight = "normal";


	detailsDiv.append(detailsText);
	orderDetails.append(detailsDiv);
}

const orderCompleteInfo = document.querySelector(".checkout-complete-info");
if (orderCompleteInfo) {
    orderCompleteInfo.innerText="Дякуємо за ваш вибір, нагадуємо, що виготовлення займає 7-10 днів." 
}


    // --- Десктопная версия ---
    var promoSections = document.querySelectorAll('section.promo');
    if (promoSections.length > 0) {
      // Изменяем фон для первой секции
      promoSections[0].style.backgroundColor = '#191818';

      // Изменяем цвет текста для catalogTabs-nav-a
      var catalogTabsLink = promoSections[0].querySelector('.catalogTabs-nav-a');
      if (catalogTabsLink) {
        catalogTabsLink.style.color = '#ECECF6'; // Цвет текста
      }

      // Изменяем цвет текста для catalogCard-title внутри <a>
      var catalogTitleLinks = promoSections[0].querySelectorAll('.catalogCard-title a');
      catalogTitleLinks.forEach(function(catalogTitle) {
        catalogTitle.style.color = '#ECECF6'; // Цвет текста
      });

      // Изменяем цвет для catalogCard-price
      var catalogPriceElements = promoSections[0].querySelectorAll('.catalogCard-price');
      catalogPriceElements.forEach(function(catalogPrice) {
        catalogPrice.style.color = '#ECECF6'; // Цвет текста
      });

      // Изменяем фон для заголовка
      var catalogTabsNav = promoSections[0].querySelector('.catalogTabs-nav');
      if (catalogTabsNav) {
        catalogTabsNav.style.backgroundColor = '#191818'; // Фон заголовка
      }
    }

    // --- Мобильная версия ---
    var storefrontSections = document.querySelectorAll('section.storefront');
    if (storefrontSections.length > 0) {
      // Изменяем фон для первой секции
      storefrontSections[0].style.backgroundColor = '#191818';

      // Изменяем цвет текста для heading.heading--l
      var headingElements = storefrontSections[0].querySelectorAll('.heading.heading--l');
      headingElements.forEach(function(heading) {
        heading.style.color = '#ECECF6'; // Цвет текста
      });

      // Изменяем цвет текста для catalog-card__title внутри <a>
      var catalogTitleLinksMobile = storefrontSections[0].querySelectorAll('.catalog-card__title a');
      catalogTitleLinksMobile.forEach(function(catalogTitle) {
        catalogTitle.style.color = '#ECECF6'; // Цвет текста
      });

      // Изменяем цвет для catalog-card__price
      var catalogPriceElementsMobile = storefrontSections[0].querySelectorAll('.catalog-card__price');
      catalogPriceElementsMobile.forEach(function(catalogPrice) {
        catalogPrice.style.color = '#ECECF6'; // Цвет текста
      });

      // Изменяем фон для заголовка (тот же класс)
      var catalogTabsNavMobile = storefrontSections[0].querySelector('.catalogTabs-nav');
      if (catalogTabsNavMobile) {
        catalogTabsNavMobile.style.backgroundColor = '#191818'; // Фон заголовка
      }
    }
  });

// === script #2 (length=3627) ===
(function () {
  if (window.__filterDedupInstalledV3) return;
  window.__filterDedupInstalledV3 = true;

  // Поддерживаемые раскладки фильтра (desktop + mobile)
  var LAYOUTS = [
    { item: 'li.filter__item',  link: 'a.filter__link',      title: '.checkbox-text',      qty: '.filter__units' },
    { item: 'div.filter-item',  link: 'a.filter-item__link', title: '.filter-item__title', qty: '.filter-item__quantity' }
  ];
  var PROCESSED_ATTR = 'data-dedup-processed';
  var runningInternally = false;

  function dedupInRoot(root) {
    var merged = 0;
    LAYOUTS.forEach(function (L) {
      var items = root.querySelectorAll(L.item);
      var groups = new Map();
      items.forEach(function (it) {
        if (it.getAttribute(PROCESSED_ATTR)) return;
        var link    = it.querySelector(L.link);
        var titleEl = it.querySelector(L.title);
        var qtyEl   = it.querySelector(L.qty);
        if (!link || !titleEl) return;
        var href = link.getAttribute('href');
        if (!href) return; // href подгружается после раскрытия dropdown
        var container = it.closest('ul.filter__list, .filter__param, .filter-block, .j-filter-block') || it.parentElement;
        if (!groups.has(container)) groups.set(container, new Map());
        var byKey = groups.get(container);
        var key = titleEl.textContent.trim();
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key).push({ it: it, link: link, titleEl: titleEl, qtyEl: qtyEl, href: href });
      });
      groups.forEach(function (byKey) {
        byKey.forEach(function (arr) {
          if (arr.length < 2) return;
          var ids = [];
          var total = 0;
          var paramName = null;
          arr.forEach(function (o) {
            var m = o.href.match(/\/filter\/([a-zA-Z_]+)=([^/]+)/);
            if (m) {
              paramName = paramName || m[1];
              m[2].split(';').forEach(function (v) { if (v && ids.indexOf(v) === -1) ids.push(v); });
            }
            if (o.qtyEl) total += parseInt(o.qtyEl.textContent.trim(), 10) || 0;
          });
          if (!paramName) return;
          var first = arr[0];
          var newHref = first.href.replace(new RegExp(paramName + '=[^/]+'), paramName + '=' + ids.join(';'));
          runningInternally = true;
          first.link.setAttribute('href', newHref);
          if (first.qtyEl) first.qtyEl.textContent = String(total);
          first.it.setAttribute(PROCESSED_ATTR, '1');
          for (var i = 1; i < arr.length; i++) {
            arr[i].it.style.display = 'none';
            arr[i].it.setAttribute(PROCESSED_ATTR, '1');
          }
          runningInternally = false;
          merged++;
        });
      });
    });
    return merged;
  }

  function processAll() { return dedupInRoot(document); }

  // 1) Сразу
  processAll();

  // 2) После клика по триггеру/раскрытию фильтра — повторно (href'ы появляются после раскрытия)
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.j-filter-dropdown-trigger, .filter__name, .j-filter-trigger, [data-toggle]')) return;
    setTimeout(processAll, 50);
    setTimeout(processAll, 250);
    setTimeout(processAll, 600);
  }, true);

  // 3) Любые ajax-перерисовки фильтра / открытие мобильного sidebar
  var debounceTimer = null;
  var obs = new MutationObserver(function () {
    if (runningInternally) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processAll, 150);
  });
  obs.observe(document.body, { childList: true, subtree: true });
})();

// === script #3 (length=48127) ===
(function () {

        // ==========================================
        // 1. КОНФІГ
        // ==========================================
        const CONFIG = {
            couponRules: {
                "5555": 3,
                "7777": 5,
                "1010": 7
            },

            customIcons: {
                "Обери принт": "/content/uploads/images/print.png",
                "Футболки": "/content/uploads/images/ffutbolka.png",
                "Худі": "/content/uploads/images/xud.png",
                "Відгуки з фото": "/content/uploads/images/vdguki.png",
                "Промокоди": "/content/uploads/images/kupon.png"
            },

            phone: {
                allowedPrefixes: [
                    '050', '063', '066', '067', '068', '073',
                    '091', '092', '093', '094', '095', '096', '097', '098', '099'
                ],
                errorText: 'Цей номер не схожий на українського оператора. Перевірте, будь ласка — інакше не зможемо оформити відправлення через Нову пошту.'
            },


            observer: { debounce: 280 },

            popupText: `
            <p>При покупці:</p>
            <ul style="padding-left:18px;margin:8px 0;">
                <li>від 3 речей — знижка <b>5%</b> (промокод: <b>5555</b>)</li>
                <li>від 5 речей — знижка <b>7%</b> (промокод: <b>7777</b>)</li>
                <li>від 7 речей — знижка <b>10%</b> (промокод: <b>1010</b>)</li>
            </ul>
        `
        };

        // ==========================================
        // 2. РОУТИНГ
        // ==========================================
        const path = window.location.pathname;
        const isHomePage = path === '/' || path === '/index.html';
        const isCheckout = path.includes('/checkout') || path.includes('/order');
        const isProduct = !isHomePage && !isCheckout;

        let couponRemovedByUser = false;
        let programmaticCouponRemoval = false;
        let lastAutoAppliedCode = null;

        // ==========================================
        // 3. КЕШ СТАБІЛЬНИХ DOM-ЕЛЕМЕНТІВ
        // Шукаємо один раз, далі беремо з кешу.
        // invalidate() скидає кеш якщо Horoshop
        // перемонтував шапку або кошик.
        // ==========================================
        const DOMCache = (function () {
            const cache = {};

            const selectors = {
                cartSummaryDesktop: ".cart-summary",
                cartSummaryMobile: ".cart__summary",
                orderSummary: ".order-summary, .order-details__total",
                cartFootDesktop: "tfoot.cart-foot",
                couponInput: ".j-coupon-input",
                couponSubmit: ".j-coupon-submit",
                couponRemove: ".j-coupon-remove",
                menuConditions: 'a.products-menu__title-link[href="/korysno/"]',
                productModBlock: ".product__modifications",
                categoriesGrid: ".categories-grid.__normalGrid"
            };

            return {
                get(key) {
                    if (cache[key] && document.contains(cache[key])) return cache[key];
                    cache[key] = document.querySelector(selectors[key]);
                    return cache[key];
                },
                invalidate(...keys) {
                    keys.forEach(k => delete cache[k]);
                },
                invalidateAll() {
                    Object.keys(cache).forEach(k => delete cache[k]);
                }
            };
        })();

        // ==========================================
        // 5. УТИЛІТИ
        // ==========================================
        function isCouponApplied() {
            // Не кешуємо — стан змінюється динамічно
            return !!document.querySelector(".j-coupon-remove");
        }

        let totalItemsCache = null;

        function getTotalItems() {
            if (totalItemsCache !== null) return totalItemsCache;
            totalItemsCache = [...document.querySelectorAll(".j-quantity-p")]
                .reduce((sum, inp) => {
                    const item = inp.closest('.j-cart-product');
                    if (item && item.querySelector('a[href*="lystivka"]')) return sum;
                    return sum + (parseInt(inp.value) || 0);
                }, 0);
            return totalItemsCache;
        }

        function invalidateTotalItems() {
            totalItemsCache = null;
        }

        function getNextLevel(total) {
            const rules = Object.entries(CONFIG.couponRules).sort((a, b) => a[1] - b[1]);
            for (const [code, req] of rules) {
                if (total < req) return { code, req, need: req - total };
            }
            return null;
        }

        function getBestCouponForQuantity(total) {
            let bestCode = null;
            let bestThreshold = 0;
            for (const [code, req] of Object.entries(CONFIG.couponRules)) {
                if (total >= req && req > bestThreshold) {
                    bestThreshold = req;
                    bestCode = code;
                }
            }
            return bestCode;
        }

        function getMessageContainer(target) {
            let container = document.querySelector(".custom-messages-container");
            if (!container) {
                container = document.createElement("div");
                container.className = "custom-messages-container";
                container.style.display = "block";
                target.parentElement.insertBefore(container, target);
            }
            return container;
        }

        // ==========================================
        // 6. АНАЛІЗАТОР МУТАЦІЙ
        // Замість "запустити все" — визначає що саме
        // змінилось і повертає набір прапорів.
        // ==========================================
        function analyzeMutations(mutations) {
            const flags = {
                hasNewPrintCards: false,
                hasCartChanges: false,
                hasProductPage: false,
                hasHomeIcons: false,
                hasHeader: false
            };

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.classList.contains('heart')) continue;

                    const cls = node.classList;

                    if (cls.contains('catalogCard-info') || cls.contains('catalog-card__content') ||
                        node.querySelector?.('.catalogCard-info, .catalog-card__content')) {
                        flags.hasNewPrintCards = true;
                    }

                    if (cls.contains('cart-summary') || cls.contains('cart__summary') ||
                        cls.contains('order-summary') || cls.contains('cart-foot') ||
                        node.querySelector?.('.j-coupon-input, .j-quantity-p, .j-coupon-remove')) {
                        flags.hasCartChanges = true;
                        DOMCache.invalidate('cartSummaryDesktop', 'cartSummaryMobile', 'couponInput', 'couponSubmit', 'couponRemove', 'cartFootDesktop');
                    }

                    if (cls.contains('product__modifications') || cls.contains('product-price__item') ||
                        node.querySelector?.('.product__modifications')) {
                        flags.hasProductPage = true;
                        DOMCache.invalidate('productModBlock');
                    }

                    if (cls.contains('categories-unit') || cls.contains('carousel__item') ||
                        cls.contains('categories-grid')) {
                        flags.hasHomeIcons = true;
                        DOMCache.invalidate('categoriesGrid');
                    }

                    if ((cls.contains('products-menu__item') && !cls.contains('j-popup-trigger-added')) || cls.contains('header')) {
                        flags.hasHeader = true;
                        DOMCache.invalidate('menuConditions');
                    }
                }
            }

            return flags;
        }

        // ==========================================
        // 7. ІНЖЕКЦІЯ CSS
        // ==========================================
        function injectGlobalStyles() {
            if (document.getElementById('baseart-custom-styles')) return;
            const style = document.createElement('style');
            style.id = 'baseart-custom-styles';
            style.textContent = `
            .catalogCard-purchase--specify-price,
            .catalog-card__prices:has(.catalog-card__price),
            .catalog-card__presence--unavailable { opacity: 0; transition: opacity 0.1s; }

            .js-not-print .catalogCard-purchase--specify-price,
            .js-not-print .catalog-card__prices,
            .js-not-print .catalog-card__presence--unavailable { opacity: 1; }

            .js-print-card .catalogCard-purchase--specify-price,
            .js-print-card .catalog-card__prices,
            .js-print-card .catalog-card__presence--unavailable { display: none !important; }

            .custom-promo-hint { background:#fff9e6; border:1px solid #f2d98f; padding:18px 20px; margin:18px 0; border-radius:10px; color:#333; font-size:14px; line-height:1.55; }
            .mob-coupon-hint-box { padding:10px; margin:10px 0; border-radius:4px; font-size:13px; }
            .global-block-msg { background:#fff3cd; border:1px solid #ffc107; color:#856404; padding:10px; margin:10px 0; border-radius:4px; font-size:13px; }
            .cart-coupon-reminder { background:#d1ecf1; border:1px solid #0c5460; color:#0c5460; padding:10px; margin:10px 0; border-radius:4px; font-size:13px; line-height:1.4; }
            .checkout-promo-hint { background:#fff9e6; border:1px solid #f2d98f; border-radius:8px; padding:12px 14px; margin:10px 0; font-size:13px; line-height:1.6; color:#333; }
            .checkout-promo-hint__code { background:#ffe8a0; border-radius:4px; padding:1px 6px; font-family:monospace; font-size:14px; font-weight:700; }
            .checkout-promo-hint__all { color:#c0392b; text-decoration:underline; white-space:nowrap; }
            
            /* ЗМЕНШЕНО GAP ДЛЯ BENEFITS LIST */
            .benefits__list { gap: 10px !important; }

/* COUNTDOWN STYLES */
[data-view-block="countdown"] {
    font: 87.5%/1.428571429 "Raleway", sans-serif !important;
    --vsc-domain: "baseartua.com";
    color: #000 !important;
    -webkit-tap-highlight-color: rgba(68,68,68,.1);
    -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: none;
    text-rendering: optimizeLegibility;
    box-sizing: border-box;
    margin: 15px 0 !important;
    text-align: center !important;
    position: relative !important;
    background: linear-gradient(182deg, #ffffffc4 70%, #ffcb8d 306%) !important;
    border: none !important;
    border-top: 5px solid #bd1200 !important;
    border-radius: 28px !important;
    box-shadow: 1px 6px 11px rgb(43 59 49 / 6%) !important;
    padding: 20px 15px !important;
}
[data-view-block="countdown"] .countdown {
    all: unset !important;
    display: block !important;
}
[data-view-block="countdown"] .countdown__container {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
}
[data-view-block="countdown"] .countdown__description {
    font-size: 22px !important;
    font-weight: 700 !important;
    color: #8b4513 !important;
    margin: 0 !important;
    width: 100% !important;
    line-height: 1.2 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
}
[data-view-block="countdown"] .countdown__title {
    font-size: 15px !important;
    color: #a0522d !important;
    margin: 0 !important;
    width: 100% !important;
    opacity: 1 !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    margin-top: -5px !important;
}
[data-view-block="countdown"] .countdown__timer {
    display: flex !important;
    gap: 10px !important;
    justify-content: center !important;
    align-items: center !important;
    width: 100% !important;
    flex-wrap: wrap !important;
    margin-top: 5px !important;
}
[data-view-block="countdown"] .countdown__timer-column {
    background: #fff !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 15px 12px !important;
    min-width: 70px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    position: relative !important;
    box-shadow: 0 4px 12px rgba(139, 69, 19, 0.1) !important;
    border-bottom: 3px solid #cd853f !important;
}
[data-view-block="countdown"] .countdown__value {
    font-family: "Playfair Display", Georgia, serif !important;
    font-size: 32px !important;
    font-weight: 700 !important;
    color: #8b4513 !important;
    line-height: 1 !important;
    display: block !important;
}
[data-view-block="countdown"] .countdown__label {
    font-size: 11px !important;
    color: #a0522d !important;
    margin-top: 4px !important;
    text-transform: uppercase !important;
    display: block !important;
    font-weight: 600 !important;
    letter-spacing: 0.5px !important;
}
[data-view-block="countdown"] .countdown__timer-column:not(:last-child)::after {
    content: ":" !important;
    position: absolute !important;
    right: -10px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    font-size: 24px !important;
    color: #8b4513 !important;
    font-weight: 700 !important;
    z-index: 1 !important;
}
@media (max-width: 480px) {
    [data-view-block="countdown"] {
        padding: 16px 10px !important;
        border-radius: 24px !important;
    }
    [data-view-block="countdown"] .countdown__description {
        font-size: 17px !important;
        line-height: 1.25 !important;
    }
    [data-view-block="countdown"] .countdown__title {
        font-size: 13px !important;
        margin-top: -3px !important;
    }
    [data-view-block="countdown"] .countdown__container {
        gap: 10px !important;
    }
    [data-view-block="countdown"] .countdown__timer {
        gap: 6px !important;
        margin-top: 3px !important;
    }
    [data-view-block="countdown"] .countdown__timer-column {
        min-width: 60px !important;
        padding: 12px 8px !important;
    }
    [data-view-block="countdown"] .countdown__value {
        font-size: 26px !important;
    }
    [data-view-block="countdown"] .countdown__label {
        font-size: 10px !important;
        margin-top: 3px !important;
    }
    [data-view-block="countdown"] .countdown__timer-column:not(:last-child)::after {
        right: -8px !important;
        font-size: 18px !important;
    }
}

            /* ДОДАНО: Адаптація сітки під 3 колонки на мобільних пристроях */
            @media (max-width: 767px) {
                .categories-grid {
                    display: grid !important;
                    grid-template-columns: repeat(3, 1fr) !important;
                    gap: 8px !important;
                }
                .categories-unit-img {
                    height: 85px !important;
                    width: 100% !important;
                    object-fit: contain !important;
                }
                .categories-unit-h {
                    font-size: 12px !important;
                    padding: 8px 4px !important;
                    text-align: center !important;
                    line-height: 1.2 !important;
                    min-height: 38px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
            }
        `;
            document.head.appendChild(style);
        }

        // ==========================================
        // 8. ВАЛІДАЦІЯ ТЕЛЕФОНУ (тільки checkout)
        // ==========================================
        function initPhoneValidation() {
            const phoneInput = document.querySelector('input.j-phone');
            if (!phoneInput) return;

            const formItem = phoneInput.closest('.form-item');
            if (!formItem) return;

            const errorEl = document.createElement('div');
            errorEl.style.cssText = 'color:#c0392b;font-size:12px;margin-top:6px;line-height:1.4;display:none;';
            errorEl.textContent = CONFIG.phone.errorText;

            const anchor = formItem.querySelector('.order-without-callback');
            anchor ? formItem.insertBefore(errorEl, anchor) : formItem.appendChild(errorEl);

            function validatePhone(value) {
                let digits = value.replace(/\D/g, '');
                if (digits.length === 12 && digits.slice(0, 2) === '38') digits = '0' + digits.slice(3);
                if (digits.length === 11 && digits[0] === '8') digits = '0' + digits.slice(1);
                if (digits.length !== 10) return false;
                return CONFIG.phone.allowedPrefixes.includes(digits.slice(0, 3));
            }

            function showError(show) {
                errorEl.style.display = show ? 'block' : 'none';
                phoneInput.style.borderColor = show ? '#c0392b' : '';
                phoneInput.style.boxShadow = show ? '0 0 0 1px #c0392b' : '';
            }

            ['input', 'keyup', 'change'].forEach(evt =>
                phoneInput.addEventListener(evt, () => {
                    if (phoneInput.inputmask && !phoneInput.inputmask.isComplete()) { showError(false); return; }
                    showError(!validatePhone(phoneInput.value));
                })
            );
            phoneInput.addEventListener('focus', () => showError(false));
        }

        // ==========================================
        // 9. МЕНЮ + ПОПАП
        // ==========================================
        function initMenuAndPopup() {
            if (!document.querySelector("#promo-popup")) {
                const popup = document.createElement("div");
                popup.id = "promo-popup";
                popup.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);display:none;justify-content:center;align-items:center;z-index:999999;padding:16px;";
                popup.innerHTML = `
                <div style="background:white;padding:24px 26px;max-width:480px;width:100%;border-radius:12px;font-size:15px;line-height:1.55;position:relative;color:#333;max-height:90vh;overflow-y:auto;">
                    <button id="popup-close" style="position:absolute;top:8px;right:10px;background:none;border:none;font-size:22px;cursor:pointer;">×</button>
                    <div class="bundle-discount-text">${CONFIG.popupText}</div>
                </div>`;
                document.body.appendChild(popup);
                popup.addEventListener("click", e => { if (e.target === popup) popup.style.display = "none"; });
                popup.querySelector("#popup-close").onclick = () => popup.style.display = "none";
            }
        }

        function initCheckoutUpsellPopup() {
            if (!isCheckout || document.querySelector('#checkout-upsell-popup')) return;
            const popup = document.createElement('div');
            popup.id = 'checkout-upsell-popup';
            popup.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:none;justify-content:center;align-items:center;z-index:999999;padding:16px;';
            popup.innerHTML = `
                <div style="background:white;padding:28px 26px;max-width:380px;width:100%;border-radius:12px;position:relative;color:#333;text-align:center;">
                    <button id="checkout-upsell-close" style="position:absolute;top:8px;right:10px;background:none;border:none;font-size:22px;cursor:pointer;">×</button>
                    <div id="checkout-upsell-content"></div>
                </div>`;
            document.body.appendChild(popup);
            popup.addEventListener('click', e => { if (e.target === popup) popup.style.display = 'none'; });
            popup.querySelector('#checkout-upsell-close').onclick = () => popup.style.display = 'none';
        }

        function showCheckoutUpsellPopup() {
            const total = getTotalItems();
            const next = getNextLevel(total);
            if (!next || next.need !== 1) return false;

            const popup = document.querySelector('#checkout-upsell-popup');
            if (!popup) return false;

            const discount = getDiscount(next.code);
            popup.querySelector('#checkout-upsell-content').innerHTML = `
                <p style="font-size:22px;margin:0 0 10px;">🎁</p>
                <p style="font-size:17px;font-weight:700;margin:0 0 12px;">Майже там!</p>
                <p style="margin:0 0 16px;">Додайте ще <b>1 товар</b> до замовлення і отримайте знижку <b>${discount}%</b>!</p>
                <p style="font-size:15px;margin:0;">Промокод: <span style="background:#ffe8a0;border-radius:4px;padding:2px 10px;font-family:monospace;font-size:18px;font-weight:700;">${next.code}</span></p>`;
            popup.style.display = 'flex';
            return true;
        }

        function ensureMenuBonus() {
            if (document.querySelector(".j-popup-trigger-added")) return;
            const conditionsItem = DOMCache.get('menuConditions');
            if (!conditionsItem) return;
            const li = document.createElement("li");
            li.className = "products-menu__item j-popup-trigger-added";
            li.innerHTML = `<div class="products-menu__title"><a class="products-menu__title-link" href="#" style="color:#fff;">Бонуси</a></div>`;
            conditionsItem.closest("li").before(li);
            li.addEventListener("click", e => { e.preventDefault(); document.querySelector("#promo-popup").style.display = "flex"; });
        }

        // ==========================================
        // 10. EVENT DELEGATION ДЛЯ КОШИКА
        // ==========================================
        function initCartDelegation() {
            document.addEventListener("click", function (e) {
                const btn = e.target.closest(".j-decrease-p, .j-increase-p, .j-remove-p");
                if (btn) {
                    const isIncrease = !!btn.closest('.j-increase-p');
                    if (isCheckout && isCouponApplied() && !isIncrease) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        showCartBlockMsg();
                    } else {
                        setTimeout(() => {
                            invalidateTotalItems();
                            handleCartDynamicLogic();
                            if (isCheckout) {
                                recalculateCoupon();
                                ensureCheckoutPromoHint();
                            }
                        }, 300);
                    }
                    return;
                }
                if (e.target.closest(".j-coupon-remove")) {
                    if (programmaticCouponRemoval) {
                        programmaticCouponRemoval = false;
                    } else {
                        couponRemovedByUser = true;
                    }
                }
                if (e.target.closest(".j-coupon-submit")) validateCouponSubmit(e);
            }, true);

            document.addEventListener("keydown", function (e) {
                if (e.target.classList.contains("j-coupon-input") && (e.key === "Enter" || e.keyCode === 13)) {
                    validateCouponSubmit(e);
                }
            }, true);
        }

        // ==========================================
        // 11. ЛОГІКА КУПОНУ
        // ==========================================
        function validateCouponSubmit(e) {
            const input = DOMCache.get('couponInput');
            if (!input) return;
            const req = CONFIG.couponRules[input.value.trim()];
            if (!req) return;
            if (getTotalItems() < req) {
                e.preventDefault();
                e.stopImmediatePropagation();
                handleCartDynamicLogic();
            }
        }

        function autoApplyCoupon() {
            if (isCouponApplied()) return;
            if (couponRemovedByUser) return;

            const total = getTotalItems();
            const code = getBestCouponForQuantity(total);
            if (!code) return;

            const input = DOMCache.get('couponInput');
            const submit = DOMCache.get('couponSubmit');
            if (!input || !submit) return;

            const form = document.querySelector('.j-coupon-add-form');
            if (form) form.style.display = 'block';

            input.value = code;
            if (!submit.disabled) {
                submit.click();
                lastAutoAppliedCode = code;
            }
        }

        function recalculateCoupon() {
            if (couponRemovedByUser) return;

            const total = getTotalItems();
            const bestCode = getBestCouponForQuantity(total);

            if (isCouponApplied()) {
                if (!bestCode) {
                    // Товарів більше не вистачає — знімаємо купон
                    const removeBtn = document.querySelector('.j-coupon-remove');
                    if (removeBtn) {
                        programmaticCouponRemoval = true;
                        removeBtn.click();
                    }
                } else if (bestCode !== lastAutoAppliedCode) {
                    // Є кращий код — знімаємо старий і застосовуємо новий
                    const removeBtn = document.querySelector('.j-coupon-remove');
                    if (removeBtn) {
                        programmaticCouponRemoval = true;
                        removeBtn.click();
                        setTimeout(() => autoApplyCoupon(), 400);
                    }
                }
            } else {
                autoApplyCoupon();
            }
        }

// ==========================================
        // 12. ДИНАМІКА КОШИКА
        // ==========================================
        const promoHTML = `
        <div class="custom-promo-hint">
            <b style="font-size:15px;">Знижка для улюблених клієнтів ❤️</b><br>
            Чим більше — тим вигідніше!<br><br>
            • Від 3 речей — промокод <b>5555</b> — 5%<br>
            • Від 5 речей — промокод <b>7777</b> — 7%<br>
            • Від 7 речей — промокод <b>1010</b> — 10%<br><br>
            <b>Знижка застосовується на єтапі оформлення замовлення!</b>
        </div>`;

        function handleCartDynamicLogic() {

            // Банери знижки — завжди видимі
            const desktopFoot = DOMCache.get('cartFootDesktop');
            const mobileSummary = DOMCache.get('cartSummaryMobile');

            if (desktopFoot && !document.querySelector(".custom-promo-desktop")) {
                const tr = document.createElement("tr");
                tr.className = "custom-promo-desktop";
                tr.innerHTML = `<td colspan="4">${promoHTML}</td>`;
                desktopFoot.before(tr);
            }
            if (mobileSummary && !document.querySelector(".custom-promo-mobile")) {
                const div = document.createElement("div");
                div.className = "custom-promo-mobile";
                div.innerHTML = promoHTML;
                mobileSummary.before(div);
            }

            // Підказка під інпутом промокоду
            const input = DOMCache.get('couponInput');
            const submit = DOMCache.get('couponSubmit');
            document.querySelector(".mob-coupon-hint-box")?.remove();

            if (input && submit) {
                const req = CONFIG.couponRules[input.value.trim()];
                if (req) {
                    const total = getTotalItems();
                    const valid = total >= req;
                    const missing = req - total;
                    const box = document.createElement("div");
                    box.className = "mob-coupon-hint-box";
                    box.style.cssText = valid
                        ? "background:#d4edda;border:1px solid #28a745;color:#155724;"
                        : "background:#f8d7da;border:1px solid #dc3545;color:#721c24;";
                    box.innerHTML = valid
                        ? "✅ Промокод можна застосувати"
                        : `❌ Цей промокод діє від ${req} одиниць.<br>Додайте ще ${missing}.`;
                    input.after(box);
                    submit.disabled = !valid;
                    submit.style.opacity = valid ? "1" : "0.5";
                } else {
                    submit.disabled = false;
                    submit.style.opacity = "1";
                }
            }

        }

        function ensureOrderDetailsText() {
            const orderDetails = document.querySelector('.order-details');
            if (!orderDetails || orderDetails.querySelector('.order-details-text')) return;
            const div = document.createElement('div');
            div.className = 'order-details-i';
            const p = document.createElement('p');
            p.className = 'order-details-text';
            p.style.fontWeight = 'normal';
            p.innerHTML = '<div style="line-height:1.5;margin-top:20px;">' +
                'Термін виготовлення: <b>7–10 календарних днів після оплати.</b> ' +
                'Кожну річ друкуємо <b>індивідуально</b> під ваше замовлення.<br>' +
                '<b>600+</b> принтів, <b>20 000+</b> комбінацій моделей і розмірів.<br>' +
                '<b>Результат вартий очікування.</b><br><br>' +
                'Переконайтесь самі — <a href="https://baseartua.com/vidhuky/" target="_blank" style="text-decoration:underline;font-weight:bold;color:inherit;">відгуки з фото наших покупців тут</a>' +
                '</div>';
            div.append(p);
            orderDetails.append(div);
        }

        function ensureCheckoutPromoHint() {
            if (!isCheckout) return;
            const container = document.querySelector('.j-coupon-add-container');
            if (!container) return;

            const total = getTotalItems();
            const bestCode = getBestCouponForQuantity(total);

            let hint = document.querySelector('.checkout-promo-hint');
            if (!bestCode) {
                hint?.remove();
                return;
            }

            if (!hint) {
                hint = document.createElement('div');
                hint.className = 'checkout-promo-hint';
                container.parentElement.insertBefore(hint, container);
            }

            const discount = getDiscount(bestCode);
            hint.innerHTML = `Ви можете застосувати промокод: <span class="checkout-promo-hint__code">${bestCode}</span> для знижки в ${discount}%. <a href="#" class="checkout-promo-hint__all">Дивитись всі промокоди</a>`;

            hint.querySelector('.checkout-promo-hint__all').onclick = e => {
                e.preventDefault();
                if (!showCheckoutUpsellPopup()) {
                    const popup = document.querySelector('#promo-popup');
                    if (popup) popup.style.display = 'flex';
                }
            };
        }

        function getDiscount(code) {
            const map = { "5555": 5, "7777": 7, "1010": 10 };
            return map[code] || '';
        }

        function showCartBlockMsg() {
            const target = document.querySelector(".order-summary, .order-details__total, .cart-summary, .cart__summary");
            if (!target) return;
            document.querySelector(".global-block-msg")?.remove();
            const msg = document.createElement("div");
            msg.className = "global-block-msg";
            msg.textContent = "⚠️ Спочатку видаліть промокод, щоб змінити кількість товарів.";
            target.parentElement.insertBefore(msg, target);
            setTimeout(() => msg.remove(), 5000);
        }

        // ==========================================
        // 13. ТОВАРИ-ПРИНТИ
        // ==========================================
        const processedPrintCards = new WeakSet();

        function handlePrintProducts() {
            const h1 = document.querySelector("h1.product-title") || document.querySelector("h1.heading.heading--xl");
            if (h1 && h1.textContent.trim().startsWith("Принт")) {
                document.querySelectorAll(
                    '.product-header__availability--out-of-stock, .presence-status--unavailable, .product-order__row, .product-card__notify, .product-separator'
                ).forEach(el => el.style.display = 'none');

                document.querySelectorAll('.product-price__item, .product-card__price').forEach(price => {
                    if (price.textContent.includes('Ціну уточнюйте')) {
                        const metas = [...price.querySelectorAll('meta')];
                        price.textContent = 'Обери свою річ з цим принтом';
                        metas.forEach(m => price.appendChild(m));
                    }
                });

                document.querySelectorAll('.j-product-block-title').forEach(b => {
                    if (b.textContent.includes('Цей принт на інших')) b.textContent = 'Цей принт на футболках і худі:';
                });
            }

            // Картки каталогу — тільки нові
            document.querySelectorAll('.catalogCard-info, .catalog-card__content').forEach(card => {
                if (processedPrintCards.has(card)) return;
                processedPrintCards.add(card);
                const titleLink = card.querySelector('.catalogCard-title a, .catalog-card__title a');
                if (titleLink) {
                    card.classList.add(titleLink.innerHTML.trim().startsWith('Принт') ? 'js-print-card' : 'js-not-print');
                }
            });
        }



        // ==========================================
        // 14. СЕРЦЯ — ПАДАЮЧІ АНІМАЦІЇ
        // ==========================================
        function initHearts() {
            let heartsInterval = null;
            function startHearts() {
                const isMobile = window.innerWidth < 768;
                if (heartsInterval) return;
                if (!document.getElementById('heart-styles')) {
                    const style = document.createElement('style');
                    style.id = 'heart-styles';
                    style.innerHTML = `
                        .heart { position: fixed; top: -20px; z-index: 9999; user-select: none; pointer-events: none; }
                        .heart svg { display: block; }
                        @keyframes fall-clockwise { to { transform: translateY(110vh) rotate(360deg); } }
                        @keyframes fall-counterclockwise { to { transform: translateY(110vh) rotate(-360deg); } }
                    `;
                    document.head.appendChild(style);
                }
                function createHeart() {
                    const heart = document.createElement('div');
                    heart.className = 'heart';
                    const size = isMobile ? (Math.random() * 8 + 10) : (Math.random() * 10.5 + 7);
                    heart.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
                    const colors = isMobile 
                        ? ['#ff1493', '#ff4081', '#e91e63', '#f06292', '#ff69b4', '#dc143c']
                        : ['#ff0000', '#dc143c', '#ff1493', '#ff69b4', '#ff85c1', '#ffc0cb', '#e91e63', '#c2185b', '#f06292', '#ff4081'];
                    heart.style.color = colors[Math.floor(Math.random() * colors.length)];
                    const direction = Math.random() > 0.5 ? 'fall-clockwise' : 'fall-counterclockwise';
                    heart.style.animation = `${direction} linear infinite`;
                    heart.style.animationDuration = isMobile ? (Math.random() * 4 + 11) + 's' : (Math.random() * 4 + 9) + 's';
                    heart.style.left = Math.random() * 100 + 'vw';
                    heart.style.opacity = Math.random() * 0.15 + 0.1;
                    document.body.appendChild(heart);
                    setTimeout(() => { heart.remove(); }, isMobile ? 16000 : 14000);
                }
                const interval = isMobile ? 800 : 400;
                clearInterval(heartsInterval);
                heartsInterval = setInterval(createHeart, interval);
            }
            startHearts();
            const observer = new MutationObserver(function () {
                startHearts();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }


        // ==========================================
        // 15. ІКОНКИ ТА БЛОКИ ГОЛОВНОЇ СТОРІНКИ (фікс для телефону v2)
        // ==========================================

        function updateHomeIcons() {

            // 1. Заміна іконок (працює і без benefits)
            document.querySelectorAll('.carousel__item, .categories-unit, .benefits__item').forEach(item => {
                const img = item.querySelector('img');
                const titleEl = item.querySelector('.catalog-card__title span, .a-link, .categories-unit-h span, .benefits__item-title');
                if (!img || !titleEl) return;

                const titleText = titleEl.innerText.trim();
                const src = CONFIG.customIcons[titleText];

                if (src && !img.src.includes(src)) {
                    img.src = src;
                    ['srcset', 'data-srcset', 'data-src'].forEach(a => img.removeAttribute(a));
                    img.style.imageRendering = "auto";
                    img.style.objectFit = "contain";
                }

                // ДОДАНО: Робимо карточку "Промокоди" клікабельною для попапу
                if (titleText === "Промокоди" && !item.classList.contains('js-popup-binded')) {
                    item.classList.add('js-popup-binded');
                    item.style.cursor = 'pointer';

                    const openPopup = () => {
                        const popup = document.querySelector("#promo-popup");
                        if (popup) {
                            popup.style.display = "flex";
                            if (window.innerWidth <= 768) {
                                popup.style.paddingTop = "15%";
                                popup.style.alignItems = "flex-start";
                            }
                        }
                    };

                    item.addEventListener('click', e => {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        openPopup();
                    }, true);

                    item.addEventListener('touchend', e => {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        openPopup();
                    }, { passive: false });
                }
            });

            // === НАЙНАДІЙНІШИЙ СПОСІБ ДЛЯ ТЕЛЕФОНА ===
            ensurePromoUnitsOnMobile();
        }

        // Окрема функція, яку можна викликати повторно
        function ensurePromoUnitsOnMobile() {
            // Шукаємо грид кількома способами (на випадок різних шаблонів телефону)
            let grid = DOMCache.get('categoriesGrid')
                || document.getElementById('categoriesGrid')
                || document.querySelector('.categories-grid, .catalog-grid, .categories__grid');

            if (!grid) {
                console.log('%c[updateHomeIcons] categoriesGrid ще не з’явився — чекаємо 400мс', 'color:#ff9800');
                setTimeout(ensurePromoUnitsOnMobile, 400);
                return;
            }

            // Захист від дублювання
            if (document.querySelector('.promo-unit-added') || grid.querySelector('[data-promo-unit="true"]')) {
                console.log('%c[updateHomeIcons] промо-юніти вже додані', 'color:#4caf50');
                return;
            }

            const createUnit = (title, link, icon, extraClass = '') => {
                const div = document.createElement('div');
                div.className = 'categories-unit' + (extraClass ? ' ' + extraClass : '');
                div.setAttribute('data-promo-unit', 'true');
                div.innerHTML = `
            <div class="categories-unit-w">
                <a href="${link}">
                    <div class="categories-unit-image">
                        <img class="categories-unit-img" width="120" height="120" src="${icon}" style="image-rendering:auto;object-fit:contain;">
                    </div>
                    <div class="categories-unit-h"><span class="a-link">${title}</span></div>
                </a>
            </div>`;
                return div;
            };

            // 1. ЗМІНЕНО: Відгуки з фото — додаємо в кінець (щоб вони були у другому ряду після категорій)
            grid.appendChild(
                createUnit("Відгуки з фото", "/vidhuky/", CONFIG.customIcons["Відгуки з фото"])
            );

            // 2. Промокоди — в кінець (будуть поруч з відгуками)
            const promoUnit = createUnit("Промокоди", "#", CONFIG.customIcons["Промокоди"], "promo-unit-added");
            grid.appendChild(promoUnit);

            // === ПРЯМІ ЕВЕНТИ ДЛЯ ТЕЛЕФОНА (найнадійніше) ===
            promoUnit.style.cursor = 'pointer';

            const openPopup = () => {
                const popup = document.querySelector("#promo-popup");
                if (popup) {
                    popup.style.display = "flex";
                    if (window.innerWidth <= 768) {
                        popup.style.paddingTop = "15%";
                        popup.style.alignItems = "flex-start";
                    }
                }
            };

            promoUnit.addEventListener('click', e => {
                e.preventDefault();
                e.stopImmediatePropagation();
                openPopup();
            }, true);

            promoUnit.addEventListener('touchend', e => {
                e.preventDefault();
                e.stopImmediatePropagation();
                openPopup();
            }, { passive: false });

            promoUnit.addEventListener('touchstart', e => {
                e.stopImmediatePropagation();
            }, { passive: false });

        }
        // ==========================================
        // 16. ПЕРШИЙ ЗАПУСК (без обсервера)
        // ==========================================
        function runAll() {
            if (isHomePage) updateHomeIcons();
            if (!isCheckout) handlePrintProducts();

            const hasCart = !!(DOMCache.get('cartSummaryDesktop') || DOMCache.get('cartSummaryMobile') || DOMCache.get('orderSummary'));
            if (hasCart) {
                handleCartDynamicLogic();
                if (isCheckout) {
                    if (isCouponApplied()) {
                        // Купон вже є — синхронізуємо і не чіпаємо
                        lastAutoAppliedCode = getBestCouponForQuantity(getTotalItems());
                    } else {
                        recalculateCoupon();
                    }
                    ensureOrderDetailsText();
                    ensureCheckoutPromoHint();
                }
            }
        }

        // ==========================================
        // 17. ОБСЕРВЕР З АНАЛІЗОМ МУТАЦІЙ
        // ==========================================
        function initObserver() {
            let debounceTimer;
            let cartTimer;
            let pendingFlags = {};

            const observer = new MutationObserver(mutations => {
                const flags = analyzeMutations(mutations);

                // Акумулюємо прапори між спрацьовуваннями debounce
                Object.keys(flags).forEach(k => { if (flags[k]) pendingFlags[k] = true; });

                // Кошик — окремий швидкий таймер (50ms), щоб банер
                // повертався майже одразу після re-render Horoshop
                if (flags.hasCartChanges) {
                    clearTimeout(cartTimer);
                    cartTimer = setTimeout(() => {
                        invalidateTotalItems();
                        handleCartDynamicLogic();
                        if (isCheckout) {
                            recalculateCoupon();
                            ensureOrderDetailsText();
                            ensureCheckoutPromoHint();
                        }
                        pendingFlags.hasCartChanges = false;
                    }, 50);
                }

                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const f = pendingFlags;
                    pendingFlags = {};

                    // Меню — тільки якщо реально змінилась навігація
                    if (f.hasHeader) ensureMenuBonus();

                    // Запускаємо тільки те що реально змінилось
                    if (isHomePage && (f.hasHomeIcons)) updateHomeIcons();
                    if (!isCheckout && f.hasNewPrintCards) handlePrintProducts();

                    if (f.hasCartChanges) {
                        handleCartDynamicLogic();
                        if (isCheckout) {
                            recalculateCoupon();
                            ensureOrderDetailsText();
                            ensureCheckoutPromoHint();
                        }
                    }
                }, CONFIG.observer.debounce);
            });

            observer.observe(document.body, { childList: true, subtree: true });
        }

        // ==========================================
        // 18. СТАРТ
        // ==========================================
        // Меню "Бонуси" — тільки після window.load щоб не впливати на Speed Index.
        // Lighthouse не вимірює SI після load — користувач побачить пункт одразу,
        // але метрики не постраждають.
        window.addEventListener("load", function () {
            setTimeout(ensureMenuBonus, 100);
            setTimeout(ensureMenuBonus, 800); // страховка якщо Horoshop перемонтував шапку
        });

        document.addEventListener("DOMContentLoaded", function () {
            injectGlobalStyles();
            initMenuAndPopup();
            initCartDelegation();
            if (isCheckout) initPhoneValidation();
            if (isCheckout) initCheckoutUpsellPopup();
            initObserver();
            initHearts();

            setTimeout(runAll, 200);
        });

    })();
