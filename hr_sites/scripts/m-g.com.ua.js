// source: https://m-g.com.ua/
// extracted: 2026-05-07T21:19:32.304Z
// scripts: 2

// === script #1 (length=4637) ===
document.addEventListener('DOMContentLoaded', function () {
    // Визначаємо мову сайту з атрибута lang
    const htmlLang = (document.documentElement.getAttribute('lang') || '').trim().toLowerCase();

    // Тексти для різних мов
    const texts = {
        uk: {
            priceOnRequest: 'Ціну уточнюйте',
            quickOrder: 'замовити швидко'
        },
        ru: {
            priceOnRequest: 'Цену уточняйте',
            quickOrder: 'заказать быстро'
        }
    };

    // Якщо мова ru — беремо російські тексти, інакше українські
    const currentText = htmlLang === 'ru' ? texts.ru : texts.uk;

    // Статуси, при яких потрібно змінювати ціну та блокувати кнопки
    const orderStatuses = ['під замовлення', 'под заказ'];

    // Функція перевірки статусу
    function isPreorderStatus(text) {
        if (!text) return false;

        const normalizedText = text.trim().toLowerCase();

        return orderStatuses.some(function (status) {
            return normalizedText.includes(status);
        });
    }

    // Функція для "заморожування" кнопок
    function disableElement(el) {
        if (!el) return;

        // Забороняємо натискання
        el.style.pointerEvents = 'none';

        // Ставимо курсор "заборонено"
        el.style.cursor = 'not-allowed';

        // Робимо кнопку тьмянішою
        el.style.opacity = '0.5';

        // Додаємо легкий приглушений ефект
        el.style.filter = 'grayscale(30%)';

        // Для доступності
        el.setAttribute('aria-disabled', 'true');
    }

    // =========================================================
    // 1. СТОРІНКА ТОВАРУ
    // =========================================================
    const productAvailabilityEl = document.querySelector('.product-header__availability');

    if (productAvailabilityEl && isPreorderStatus(productAvailabilityEl.textContent)) {
        // Замінюємо ціну на "Ціну уточнюйте" / "Цену уточняйте"
        const productPriceEl = document.querySelector('.product-price__item');
        if (productPriceEl) {
            productPriceEl.textContent = currentText.priceOnRequest;
        }

        // Блокуємо кнопку "Купити"
        const buyBtn = document.querySelector('.j-buy-button-add');
        disableElement(buyBtn);

        // Блокуємо кнопку "Замовити швидко" / "Заказать быстро"
        document.querySelectorAll('.btn').forEach(function (btn) {
            const textEl = btn.querySelector('.btn-content');
            if (!textEl) return;

            const btnText = textEl.textContent.trim().toLowerCase();

            if (
                btnText === 'замовити швидко' ||
                btnText === 'заказать быстро'
            ) {
                disableElement(btn);
            }
        });
    }

    // =========================================================
    // 2. КАРТКИ ТОВАРІВ У КАТАЛОЗІ
    // =========================================================
    document.querySelectorAll('.catalogCard-info').forEach(function (cardInfo) {
        // Знаходимо статус у картці
        const availabilityEl = cardInfo.querySelector('.catalogCard-availability');

        // Якщо статусу немає або він не "Під замовлення" / "Под заказ" — пропускаємо
        if (!availabilityEl || !isPreorderStatus(availabilityEl.textContent)) return;

        // Замінюємо ціну в картці
        const priceEl = cardInfo.querySelector('.catalogCard-price');
        if (priceEl) {
            priceEl.textContent = currentText.priceOnRequest;
        }

        // Шукаємо кнопку "Купити" у межах картки
        // Спочатку пробуємо знайти найближчий кореневий елемент картки
        const cardRoot =
            cardInfo.closest('.catalogCard') ||
            cardInfo.closest('.catalog-card') ||
            cardInfo.parentElement;

        if (!cardRoot) return;

        // Шукаємо кнопку купівлі всередині картки
        const catalogBuyBtn =
            cardRoot.querySelector('.j-buy-button-add') ||
            cardRoot.querySelector('.catalogCard-buy .btn') ||
            cardRoot.querySelector('.catalogCard-buttons .btn') ||
            Array.from(cardRoot.querySelectorAll('.btn')).find(function (btn) {
                const textEl = btn.querySelector('.btn-content');
                if (!textEl) return false;

                const btnText = textEl.textContent.trim().toLowerCase();
                return btnText === 'купити' || btnText === 'купить';
            });

        // Блокуємо кнопку
        disableElement(catalogBuyBtn);
    });
});

// === script #2 (length=580) ===
(function(w,d){var hS=w.helpcrunchSettings;if(!hS||!hS.organization){return;}var widgetSrc='https://'+hS.organization+'.widget.helpcrunch.com/';w.HelpCrunch=function(){w.HelpCrunch.q.push(arguments)};w.HelpCrunch.q=[];function r(){if (d.querySelector('script[src="' + widgetSrc + '"')) { return; }var s=d.createElement('script');s.async=1;s.type='text/javascript';s.src=widgetSrc;(d.body||d.head).appendChild(s);}if(d.readyState === 'complete'||hS.loadImmediately){r();} else if(w.attachEvent){w.attachEvent('onload',r)}else{w.addEventListener('load',r,false)}})(window, document)
