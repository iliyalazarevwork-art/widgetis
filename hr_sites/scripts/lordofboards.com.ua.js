// source: https://lordofboards.com.ua/
// extracted: 2026-05-07T21:18:52.846Z
// scripts: 2

// === script #1 (length=650) ===
window.fbAsyncInit = function() {
                FB.init({
                    appId            : '',
                    autoLogAppEvents : true,
                    xfbml            : true,
                    version          : 'v2.12'
                });
            };
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

// === script #2 (length=6667) ===
(function() {
    // Порог бесплатной доставки
    var FREE_SHIPPING_THRESHOLD = 2000;

    // Определяем язык (1 – Русская версия, иначе – Украинская)
    var lang = (window.GLOBAL && GLOBAL.SYSTEM_LANGUAGE === 1) ? 'ru' : 'uk';
    var messages = {
        ru: {
            pending: 'До бесплатной доставки осталось: ',
            free: 'У вас бесплатная доставка!'
        },
        uk: {
            pending: 'До безкоштовної доставки залишилося: ',
            free: 'У вас безкоштовна доставка!'
        }
    };

    /**
     * Получаем итоговую сумму корзины из объекта AjaxCart (если доступно),
     * иначе — парсим текст из .j-total-sum (fallback).
     */
    function getCartTotal() {
        var cart = (typeof AjaxCart !== "undefined" && AjaxCart.getInstance) 
            ? AjaxCart.getInstance() 
            : null;

        if (cart && cart.Cart && cart.Cart.total && cart.Cart.total.sum) {
            return parseFloat(cart.Cart.total.sum) || 0;
        }
        var totalEl = document.querySelector(".j-total-sum");
        if (!totalEl) return 0;

        var totalText = totalEl.textContent.trim().replace(/[^\d.]/g, "");
        return parseFloat(totalText) || 0;
    }

    /**
     * Создаёт / обновляет блок с прогресс-баром "до бесплатной доставки".
     */
    function addFreeShippingProgressBar() {
        var totalElement = document.querySelector(".j-total-sum");
        if (!totalElement) {
            // Если ещё нет .j-total-sum, подождём немного
            setTimeout(addFreeShippingProgressBar, 300);
            return;
        }

        // Удаляем старый блок, если он есть
        var old = document.getElementById("free-shipping-progress");
        if (old) old.remove();

        var cartTotal = getCartTotal();
        var remainder = FREE_SHIPPING_THRESHOLD - cartTotal;

        // Контейнер
        var container = document.createElement("div");
        container.id = "free-shipping-progress";
        container.style.marginTop = "15px";
        container.style.padding = "15px";
        container.style.border = "1px solid #ddd";
        container.style.borderRadius = "5px";
        container.style.background = "#f9f9f9";
        container.style.fontFamily = "inherit";

        // Текстовый блок
        var progressText = document.createElement("div");
        progressText.style.marginBottom = "12px";
        progressText.style.fontSize = "16px";
        progressText.style.fontWeight = "normal";

        // Иконка (24x24)
        var icon = document.createElement("img");
        icon.src = "https://digitalsok.agency/Pic/84.png";
        icon.style.verticalAlign = "middle";
        icon.style.marginRight = "8px";
        icon.style.width = "24px";
        icon.style.height = "24px";
        progressText.appendChild(icon);

        // Текст (в зависимости от remainder)
        if (remainder <= 0) {
            progressText.appendChild(document.createTextNode(messages[lang].free));
        } else {
            progressText.appendChild(document.createTextNode(messages[lang].pending));
            var boldSpan = document.createElement("span");
            boldSpan.style.fontWeight = "bold";
            boldSpan.textContent = parseInt(remainder) + " грн";
            progressText.appendChild(boldSpan);
        }
        container.appendChild(progressText);

        // Серый контейнер прогресса
        var barContainer = document.createElement("div");
        barContainer.style.background = "#ccc";
        barContainer.style.height = "15px";
        barContainer.style.borderRadius = "8px";
        barContainer.style.overflow = "hidden";
        container.appendChild(barContainer);

        // Зелёная полоса
        var progressBar = document.createElement("div");
        progressBar.style.background = "#4caf50";
        progressBar.style.height = "15px";
        progressBar.style.borderRadius = "8px";
        progressBar.style.width = "0%";
        barContainer.appendChild(progressBar);

        // Заполняем
        if (remainder <= 0) {
            progressBar.style.width = "100%";
        } else {
            var pct = (cartTotal / FREE_SHIPPING_THRESHOLD) * 100;
            if (pct > 100) pct = 100;
            progressBar.style.width = pct + "%";
        }

        // Вставляем после .j-total-sum
        totalElement.parentNode.insertBefore(container, totalElement.nextSibling);
    }

    // Делаем функцию "дебаунса", чтобы не вызывать addFreeShippingProgressBar на каждый чих
    var debounceTimer = null;
    function debounceAddProgressBar(delay) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(addFreeShippingProgressBar, delay || 500);
    }

    /**
     * Инициализация: 
     *  1) Первый вызов шкалы
     *  2) Подписка на события AjaxCart
     *  3) Глобальный MutationObserver на document.body
     */
    function initFreeShippingBar() {
        // Ставим шкалу при загрузке
        addFreeShippingProgressBar();

        // Подписка на события AjaxCart (если есть)
        if (typeof AjaxCart !== "undefined" && AjaxCart.getInstance) {
            try {
                var cart = AjaxCart.getInstance();
                if (cart && cart.attachEventHandlers) {
                    cart.attachEventHandlers({
                        afterRender: function() {
                            debounceAddProgressBar(500);
                        },
                        cart_product_add: function() {
                            debounceAddProgressBar(500);
                        },
                        cart_product_remove: function() {
                            debounceAddProgressBar(500);
                        },
                        onChange: function() {
                            debounceAddProgressBar(500);
                        }
                    });
                }
            } catch (e) {
                console.error("Ошибка при привязке к AjaxCart:", e);
            }
        }

        // Глобальный MutationObserver на document.body — отлавливаем любые изменения 
        // (например, когда корзина перерисовывается повторно и выкидывает нашу шкалу).
        var observer = new MutationObserver(function() {
            debounceAddProgressBar(500);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Запускаем после готовности DOM
    document.addEventListener("DOMContentLoaded", initFreeShippingBar);
})();
