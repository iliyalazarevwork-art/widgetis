// source: https://spacefood.com.ua/
// extracted: 2026-05-07T21:19:42.257Z
// scripts: 7

// === script #1 (length=1585) ===
window.onload = function () {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Перевіряємо, чи є в URL слово "brendy"
    if (window.location.href.includes('brendy')) {
        // Отримуємо всі елементи з атрибутом data-view-block
        const elements = document.querySelectorAll('[data-view-block]');

        if (isMobileDevice) {
const orderBoxes = document.querySelectorAll('.product__block--orderBox');

        // Перебираємо всі знайдені елементи і ховаємо їх
        orderBoxes.forEach(function (box) {
            box.style.display = 'none';
        });
        } else {
        elements.forEach(function (element) {
            // Перевіряємо значення атрибута data-view-block
            const dataValue = element.getAttribute('data-view-block');
            
            // Якщо значення дорівнює 'price' або 'order', ховаємо елемент
            if (dataValue === 'price' || dataValue === 'order') {
                element.style.display = 'none';
            }
        });
      }
// Отримуємо всі елементи з класом product__group-item
        const groupItems = document.querySelectorAll('.product__group-item');

        groupItems.forEach(function (groupItem) {
            // Перевіряємо, чи є всередині елемент з класом ico-sol__delivery
            if (groupItem.querySelector('.ico-sol__delivery')) {
                // Якщо знайдено, ховаємо батьківський елемент
                groupItem.style.display = 'none';
            }
        });
    }
};

// === script #2 (length=2142) ===
// Замінюємо елемент з класом icon--user
    replaceSvgWithImg('icon--user', '/content/uploads/images/4092564-about-mobile-ui-profile-ui-user-website_114033.svg');


function replaceSvgWithImg(className, imgSrc) {
    // Отримуємо всі елементи з заданим класом
    const elements = document.querySelectorAll('.' + className);
    
    elements.forEach(function(svgElement) {
        // Створюємо новий елемент img
        const imgElement = document.createElement('img');
        imgElement.src = imgSrc;
        imgElement.alt = className; // Можна додати alt текст
        
        // Замінюємо svg на img
        svgElement.replaceWith(imgElement);
    });
}


document.addEventListener("DOMContentLoaded", function() {
    // Отримуємо елемент з класом search__input
    const searchInputElement = document.querySelector('.search__input');
    const overlayBackgroundElement = document.querySelector('.sol-overlay__background_search');

    if (searchInputElement && overlayBackgroundElement) {
        // Функція для перевірки наявності класу is-focused
        function checkFocus() {
            if (searchInputElement.classList.contains('is-focused')) {
                overlayBackgroundElement.style.display = 'block';
            } else {
                overlayBackgroundElement.style.display = 'none';
            }
        }

        // Виконуємо перевірку при завантаженні сторінки
        checkFocus();

        // Створюємо спостерігача за змінами класу
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    checkFocus();
                }
            });
        });

        // Налаштовуємо спостерігача на спостереження за змінами класу
        observer.observe(searchInputElement, { attributes: true });

        // Також додаємо відслідковування фокусу і втрати фокусу для надійності
        searchInputElement.addEventListener('focus', checkFocus);
        searchInputElement.addEventListener('blur', checkFocus);
    }
});

// === script #3 (length=2881) ===
document.addEventListener('DOMContentLoaded', function () {
    // Перевіряємо, чи це мобільний пристрій
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Функція для обробки елементів
    function handleProductItems(selector) {
        const productItems = document.querySelectorAll(selector);

        productItems.forEach(item => {
            const detailsElement = document.createElement('details');

            item.classList.forEach(className => {
                detailsElement.classList.add(className);
            });

            let headingElement = item.querySelector('.product-heading__title') || item.querySelector('.heading');

            // Якщо немає заголовка, створюємо його і додаємо перед product-short-description
            if (!headingElement) {
                const shortDescriptionElement = item.querySelector('.product-short-description');
                if (shortDescriptionElement) {
                    headingElement = document.createElement('div');
                    headingElement.classList.add('product-heading__title');
                    headingElement.textContent = 'Склад та поживна цінність';
                    
                    // Вставляємо заголовок перед product-short-description
                    shortDescriptionElement.parentNode.insertBefore(headingElement, shortDescriptionElement);
                }
            }

            if (headingElement) {
                const summaryElement = document.createElement('summary');

                while (headingElement.firstChild) {
                    summaryElement.appendChild(headingElement.firstChild);
                }

                detailsElement.appendChild(summaryElement);
            }

            while (item.firstChild) {
                detailsElement.appendChild(item.firstChild);
            }

            item.parentNode.replaceChild(detailsElement, item);
        });
    }

    if (isMobileDevice) {
        handleProductItems('.product__group-item');
    } else {
        handleProductItems('.product__column-item .product__group-item');
    }

    var details = document.querySelectorAll("details");
    if (details.length > 0) {
        for (var i = 0; i < details.length; i++) {
            details[i].addEventListener("toggle", accordion);
        }
    }

    function accordion(event) {
        if (!event.target.open) return;
        var details = event.target.parentNode.children;
        for (var i = 0; i < details.length; i++) {
            if (details[i].tagName != "DETAILS" ||
                !details[i].hasAttribute('open') ||
                event.target == details[i]) {
                continue;
            }
            details[i].removeAttribute("open");
        }
    }
});

// === script #4 (length=708) ===
document.addEventListener("DOMContentLoaded", function() {
    // Знайдемо зображення з класом header-logo-img, що міститься всередині будь-якого елементу
    var logoImage = document.querySelector('.header-logo-img');

    if (logoImage) {
        console.log('Знайдено зображення, змінюємо src і srcset.');
        // Встановлюємо новий URL для src
        logoImage.src = '/content/uploads/images/logo_space_food-1.svg';

        // Встановлюємо новий URL для srcset
        logoImage.srcset = '/content/uploads/images/logo_space_food-1.svg 1x, /content/uploads/images/logo_space_food-1.svg 2x';
    } else {
        console.log('Зображення з класом header-logo-img не знайдено.');
    }
});

// === script #5 (length=1054) ===
document.addEventListener('DOMContentLoaded', function() {
    // Знаходимо всі елементи <summary>
    const summaryElements = document.querySelectorAll('summary');

    // Проходимо по кожному елементу <summary>
    summaryElements.forEach(summary => {
        // Отримуємо текст всередині тега <summary>
        const text = summary.textContent.trim();

        // Додаємо відповідний клас залежно від значення тексту
        if (text === 'Опис') {
            summary.classList.add('ico-sol__descr');
        } else if (text === 'Склад та поживна цінність') {
            summary.classList.add('ico-sol__sklad');
        } else if (text === 'Догляд') {
            summary.classList.add('ico-sol__doglyad');
        } else if (text === 'Доставка і оплата') {
            summary.classList.add('ico-sol__delivery');
        } else if (text === 'Оплата') {
            summary.classList.add('ico-sol__pay');
        } else if (text === 'Умови зберігання') {
            summary.classList.add('ico-sol__db');
        }
    });
});

// === script #6 (length=1233) ===
document.addEventListener('DOMContentLoaded', function () {
    // Функція перевірки мобільної версії
    const isMobile = () => window.innerWidth <= 768; // Ширина для мобільної версії (за потреби змініть значення)

    // Знайти мета-тег із property="og:description"
    const metaTag = document.querySelector('meta[property="og:description"]');

    if (metaTag) {
        // Отримати значення атрибута content
        const contentValue = metaTag.getAttribute('content');

        if (contentValue) {
            // Визначити, який блок оновлювати
            const targetClass = isMobile() ? '.blog__cover-img' : '.article__cover-img';

            // Знайти відповідний елемент
            const targetImg = document.querySelector(targetClass);

            if (targetImg) {
                // Замінити значення src
                targetImg.setAttribute('src', contentValue);
            } else {
                console.warn(`Елемент ${targetClass} не знайдено.`);
            }
        } else {
            console.warn('У мета-тега property="og:description" відсутній атрибут content.');
        }
    } else {
        console.warn('Мета-тег property="og:description" не знайдено.');
    }
});

// === script #7 (length=58629) ===
document.addEventListener('DOMContentLoaded', function () {
    if (!window.location.pathname.includes('/checkout')) {
        return;
    }

    const debugMode = false;

    // Константи для методів доставки
    const DELIVERY_KYIV_COURIER = "11"; // Кур'єром по Києву
    const DELIVERY_NP_POST_OFFICE = "3"; // Нова Пошта (відділення)
    const DELIVERY_NP_POSTOMAT = "17"; // Нова Пошта (поштомат)
    const DELIVERY_NP_COURIER = "16"; // Нова Пошта (кур'єр)
    const DELIVERY_NP_THERMOBOX = "31"; // Нова Пошта (відділення + термобокс)
    const DELIVERY_NP_INTERNATIONAL = "32"; // Міжнародна доставка Нова Пошта
    
    // Константи для методів оплати
    const PAYMENT_RESTRICTED_ID = "18"; // ID обмеженого методу оплати
        
    const RESTRICTED_CATEGORIES = ["1091"]; // Категорія ягід
    const RESTRICTED_PAYMENT_METHODS = [PAYMENT_RESTRICTED_ID];
    const RESTRICTED_DELIVERY_METHODS = [DELIVERY_KYIV_COURIER]; // Метод "Кур'єром по Києву" обмежений для ягід
    const DELIVERY_THRESHOLD = 1400; // Мінімальна сума замовлення для доставки (в грн)
    const DELIVERY_MESSAGE_CLASS = "delivery-message"; // Клас для повідомлень
    const COUNTRY_MESSAGE_CLASS = "country-restriction-message"; // Клас для повідомлень про обмеження країни
    const KYIV_CITY_IDS = ["1", "kyiv", "київ", "м. Київ", "35610"]; // ID міста Київ
    const DEFAULT_COUNTRY = "Україна"; // Країна за замовчуванням
    const COUNTRIES_LIST = [
        { name: "Україна", functionCall: "CheckoutModule.getInstance().getComponentByName('Recipient').setCountry(null, 'Україна')" },
        { name: "Польща", functionCall: "CheckoutModule.getInstance().getComponentByName('Recipient').setCountry(null, 'Польща')" },
        { name: "Литва", functionCall: "CheckoutModule.getInstance().getComponentByName('Recipient').setCountry(null, 'Литва')" },
        { name: "Латвія", functionCall: "CheckoutModule.getInstance().getComponentByName('Recipient').setCountry(null, 'Латвія')" },
        { name: "Естонія", functionCall: "CheckoutModule.getInstance().getComponentByName('Recipient').setCountry(null, 'Естонія')" },
        { name: "Румунія", functionCall: "CheckoutModule.getInstance().getComponentByName('Recipient').setCountry(null, 'Румунія')" },
        { name: "Велика Британія", functionCall: "CheckoutModule.getInstance().getComponentByName('Recipient').setCountry(null, 'Велика Британія')" }
    ];

    function log(...args) {
        if (debugMode) console.log(...args);
    }

    function parsePrice(text) {
        const cleanedText = text.replace(/[^\d.]/g, '');
        const validNumber = cleanedText.match(/\d*\.?\d+/);
        return validNumber ? parseFloat(validNumber[0]) : 0;
    }

    function findProductByHash(cartProductsData, hash) {
        return cartProductsData.find(product => product.hash === hash) || null;
    }

    function calculateRestrictedCategoryTotal() {
        const cartProductsData = window.cartProductsData || [];
        let restrictedCategoryTotal = 0;
        const productItems = document.querySelectorAll('.order-list .order-i, .order-details__list .j-cart-product');
        log('Знайдено товарів у DOM для розрахунку суми:', productItems.length);

        productItems.forEach((item, index) => {
            const costElement = item.querySelector('.j-cart-product-cost');
            const productHash = item.id.replace('product_', '');

            if (costElement && productHash) {
                const rawCostText = costElement.textContent.trim();
                const totalCost = parsePrice(rawCostText);
                const productData = findProductByHash(cartProductsData, productHash);

                if (productData && RESTRICTED_CATEGORIES.includes(productData.parent)) {
                    restrictedCategoryTotal += totalCost;
                    log('Товар', index, ': hash=', productHash, ', rawCost="', rawCostText, '", totalCost=', totalCost, ', parent=', productData.parent);
                }
            }
        });

        log('Розраховано загальну суму товарів з обмежених категорій:', restrictedCategoryTotal, 'грн');
        return restrictedCategoryTotal;
    }

    function hasRestrictedProducts() {
        const cartProductsData = window.cartProductsData || [];
        const productItems = document.querySelectorAll('.order-list .order-i, .order-details__list .j-cart-product');
        return Array.from(productItems).some(item => {
            const productHash = item.id.replace('product_', '');
            if (productHash) {
                const productData = findProductByHash(cartProductsData, productHash);
                return productData && RESTRICTED_CATEGORIES.includes(productData.parent);
            }
            return false;
        });
    }

    function isKyiv(cityName, cityId) {
        const normalizedCityName = (cityName || '').toLowerCase().trim();
        const normalizedCityId = (cityId || '').toLowerCase().trim();

        return KYIV_CITY_IDS.some(id => 
            id.toLowerCase().trim() === normalizedCityName || // Перевірка назви міста
            id.toLowerCase().trim() === normalizedCityId      // Перевірка ID, якщо є
        );
    }
    
    // Функція для пошуку елементів країни
    function findCountryElements() {
        const isMobileTheme = window.GLOBAL && window.GLOBAL.theme === 'horoshop_mobile';
        log('Пошук елементів країни для', isMobileTheme ? 'мобільної' : 'десктопної', 'версії');
        
        let countryFormItem, formItemContainer;
        
        if (isMobileTheme) {
            // Для мобільної версії
            countryFormItem = document.querySelector('select[name="Recipient[delivery_country]"]');
            formItemContainer = countryFormItem ? countryFormItem.closest('.form-item') : null;
        } else {
            // Для десктопної версії
            countryFormItem = document.querySelector('input[name="Recipient[delivery_country]"]');
            formItemContainer = countryFormItem ? countryFormItem.closest('.form-item') : null;
        }
        
        log('Знайдено елементи країни:', !!countryFormItem, !!formItemContainer);
        return { countryFormItem, formItemContainer };
    }

    function updateSelectOptions(select, selectBox, allowedValues, forceValue = null, preserveCurrent = false) {
        if (!select || !selectBox) {
            log('Елементи селекту або selectbox не знайдені');
            return;
        }

        const updateOptions = (items, condition, action) =>
            items.forEach(item => action(item, condition(item)));

        updateOptions(select.querySelectorAll('option'),
            option => allowedValues && !allowedValues.includes(option.value),
            (option, disable) => option.disabled = disable
        );

        const currentValue = select.value;
        let newValue = currentValue;

        if (forceValue) {
            newValue = forceValue;
        } else if (allowedValues) {
            if (!allowedValues.includes(currentValue)) {
                newValue = Array.from(select.options).find(opt => allowedValues.includes(opt.value))?.value || select.options[0]?.value;
            }
        } else {
            if (!preserveCurrent) {
                const currentOptionExists = Array.from(select.options).some(opt => opt.value === currentValue);
                if (!currentOptionExists) {
                    newValue = select.options[0]?.value;
                }
            }
        }

        if (newValue && select.value !== newValue) {
            select.value = newValue;
            const event = new Event("change", { bubbles: true });
            select.dispatchEvent(event);
            log('Оновлено значення селекту до:', newValue);
        }

        updateOptions(selectBox.querySelectorAll('.selectboxit-options li, .options-list li'),
            item => {
                const itemValue = item.getAttribute('data-val') || item.getAttribute('data-value');
                return allowedValues && !allowedValues.includes(itemValue);
            },
            (item, hide) => item.style.display = hide ? 'none' : ''
        );

        const selectedText = select.querySelector(`option[value="$"]`)?.textContent;
        const selectboxText = selectBox.querySelector('.selectboxit-text');
        if (selectboxText && selectedText) {
            selectboxText.textContent = selectedText;
            selectboxText.setAttribute('data-val', newValue);
        }
    }

    function checkElements(elements, errorMessage) {
        const allExist = elements.every(el => el !== null);
        if (!allExist) {
            log(errorMessage);
        }
        return allExist;
    }

    function updateSubmitButtonState(hideOptionsFlag) {
        const desktopButton = document.querySelector('.btn.j-submit.__special');
        const mobileButton = document.querySelector('.btn.btn--block.btn--primary.j-submit');

        const shouldHide = hideOptionsFlag;

        if (desktopButton) {
            const desktopParent = desktopButton.closest('.checkout-footer');
            if (desktopParent) {
                desktopParent.classList.toggle('submit-hidden', shouldHide);
                log('Десктопна кнопка:', shouldHide ? 'прихована' : 'видима');
            }
        }

        if (mobileButton) {
            const mobileParent = mobileButton.closest('.form-item.form-item--offset');
            if (mobileParent) {
                mobileParent.classList.toggle('submit-hidden', shouldHide);
                log('Мобільна кнопка:', shouldHide ? 'прихована' : 'видима');
            }
        }
    }

    // Функція для визначення, чи потрібно приховати кнопку оформлення замовлення
    function shouldHideSubmitButton() {
        const hasRestricted = hasRestrictedProducts();
        const restrictedCategoryTotal = calculateRestrictedCategoryTotal();
        
        // Перевіряємо місто (для України)
        let cityElement = document.querySelector('select[name="Recipient[delivery_city]"]') || document.querySelector('input[name="Recipient[delivery_city]"]');
        const currentCity = (cityElement?.tagName === 'SELECT' ? cityElement.value : cityElement?.value) || '';
        const isKyivCity = isKyiv(currentCity, '');
        
        // Перевіряємо країну
        const currentCountry = getCurrentCountry();
        const isUkraine = currentCountry === DEFAULT_COUNTRY || currentCountry === '';
        
        // Приховуємо кнопку в двох випадках:
        // 1. Якщо є товари з обмеженої категорії, їхня сума менше порогу і місто не Київ
        // 2. Якщо є товари з обмеженої категорії і обрана не Україна
        return (hasRestricted && restrictedCategoryTotal < DELIVERY_THRESHOLD && !isKyivCity) || 
               (hasRestricted && !isUkraine);
    }

    let lastRestrictedCategoryCount = null;
    let lastCity = null;
    let isInitialLoad = true;

    function updateCheckoutOptions() {
        log('updateCheckoutOptions викликано');

        const $deliverySelect = document.querySelector('select[name="Delivery[delivery_type]"]');
        const $deliverySelectBox = document.querySelector('.selectboxit-container.j-delivery-type, .j-delivery-select');
        const $paymentSelect = document.querySelector('.j-payment-type');
        const $paymentSelectBox = document.querySelector('.selectboxit-container.j-payment-type, .j-payment-select');
        const $deliveryMethodSection = document.querySelector('.j-delivery-method');

        const restrictedCategoryTotal = calculateRestrictedCategoryTotal();
        const hasRestricted = hasRestrictedProducts();
        
        // Після оновлення опцій чекауту також оновлюємо перевірку обмежень країни
        setTimeout(() => {
            checkCountryRestrictions();
            setupCountriesExample();
        }, 500);

        let cityElement = document.querySelector('select[name="Recipient[delivery_city]"]') || document.querySelector('input[name="Recipient[delivery_city]"]');
        const currentCity = (cityElement?.tagName === 'SELECT' ? cityElement.value : cityElement?.value) || '';
        const isKyivCity = isKyiv(currentCity, '');

        log('Актуальне місто:', currentCity, ', Київ:', isKyivCity);

        if (checkElements([$paymentSelect, $paymentSelectBox], 'Елементи оплати ще не завантажені')) {
            if (hasRestricted) {
                updateSelectOptions($paymentSelect, $paymentSelectBox, RESTRICTED_PAYMENT_METHODS, RESTRICTED_PAYMENT_METHODS[0], false);
                log('Товари з обмежених категорій є в кошику, доступні тільки обмежені методи оплати:', RESTRICTED_PAYMENT_METHODS);
            } else {
                updateSelectOptions($paymentSelect, $paymentSelectBox, null, null, true);
                log('Товарів з обмежених категорій немає, всі методи оплати доступні');
            }
        }

        if (checkElements([$deliverySelect, $deliverySelectBox], 'Елементи доставки ще не завантажені')) {
            const deliveryParent = $deliverySelectBox.parentElement;
            if (deliveryParent) {
                const existingMessages = deliveryParent.querySelectorAll('.' + DELIVERY_MESSAGE_CLASS);
                existingMessages.forEach(msg => msg.remove());
                if (existingMessages.length > 0) log(`Видалено $ існуючих повідомлень.`);
            } else {
                log('Не вдалося знайти батьківський елемент для видалення повідомлень.');
            }

            let allowedDeliveryMethods = Array.from($deliverySelect.options).map(option => option.value);
            let hideDeliveryOptions = false;
            let forceDeliveryMethod = null;

            if (hasRestricted) {
                log('Товари з категорії 1091 Є в кошику.');
                const methodsToHide = [DELIVERY_NP_POSTOMAT, DELIVERY_NP_COURIER, DELIVERY_NP_POST_OFFICE];
                allowedDeliveryMethods = allowedDeliveryMethods.filter(value => !methodsToHide.includes(value));
                log('Приховані методи (завжди при restricted):', methodsToHide.join(', '));

                if (restrictedCategoryTotal < DELIVERY_THRESHOLD) {
                    log('Сума товарів <', DELIVERY_THRESHOLD, 'грн');
                    if (isKyivCity) {
                        log('Місто Київ');
                        const kyivAllowed = [DELIVERY_KYIV_COURIER];
                        allowedDeliveryMethods = allowedDeliveryMethods.filter(value => kyivAllowed.includes(value));
                        forceDeliveryMethod = DELIVERY_KYIV_COURIER;
                        log('Обмежено до:', allowedDeliveryMethods.join(', '));

                        const message = document.createElement('div');
                        message.className = DELIVERY_MESSAGE_CLASS;
                        const part2 = document.createElement('p');
                        part2.className = 'delivery-message-part2';
                        part2.textContent = 'Доставка Новою поштою замороженої продукції здійснюється при замовленні від 1400 грн. Щоб обрати доставку Новою поштою, додайте ще товари з розділу «Морозиво та ягоди SPACE ICE».';
                        message.appendChild(part2);
                        const nextSibling = $deliverySelectBox.nextElementSibling;
                        if (!nextSibling || !nextSibling.classList.contains(DELIVERY_MESSAGE_CLASS)) {
                            if ($deliverySelectBox.parentNode) {
                                $deliverySelectBox.parentNode.insertBefore(message, $deliverySelectBox.nextSibling);
                                log('Додано повідомлення (Київ, < порогу)');
                            }
                        }
                    } else {
                        log('Не Київ');
                        hideDeliveryOptions = true;
                        log('Ховаємо вибір доставки та відділення');

                        const message = document.createElement('div');
                        message.className = DELIVERY_MESSAGE_CLASS;
                        const part1 = document.createElement('p');
                        part1.className = 'delivery-message-part1';
                        part1.textContent = 'Доставка Новою поштою замороженої продукції здійснюється при замовленні від 1400 грн. Щоб обрати доставку Новою поштою, додайте ще товари з розділу «Морозиво та ягоди SPACE ICE».';
                        message.appendChild(part1);
                        const nextSibling = $deliverySelectBox.nextElementSibling;
                        if (!nextSibling || !nextSibling.classList.contains(DELIVERY_MESSAGE_CLASS)) {
                            if ($deliverySelectBox.parentNode) {
                                $deliverySelectBox.parentNode.insertBefore(message, $deliverySelectBox.nextSibling);
                                log('Додано повідомлення (Не Київ, < порогу)');
                            }
                        }
                    }
                } else {
                    log('Кількість товарів >=', DELIVERY_THRESHOLD);
                    log('Доступні методи:', allowedDeliveryMethods.join(', '));
                }
            } else {
                log('Товарів з категорії 1091 НЕМАЄ в кошику.');
                const methodsToHide = ["31"];
                allowedDeliveryMethods = allowedDeliveryMethods.filter(value => !methodsToHide.includes(value));
                log('Прихований метод:', methodsToHide.join(', '));
                log('Доступні методи:', allowedDeliveryMethods.join(', '));
            }

            if (hideDeliveryOptions) {
                $deliverySelectBox.style.display = 'none';
                if ($deliveryMethodSection) $deliveryMethodSection.style.display = 'none';
                log('Вибір доставки та відділення приховані');
            } else {
                $deliverySelectBox.style.display = '';
                if ($deliveryMethodSection) $deliveryMethodSection.style.display = '';
                log('Вибір доставки та відділення показані');
                updateSelectOptions($deliverySelect, $deliverySelectBox, allowedDeliveryMethods, forceDeliveryMethod);
                log('Оновлено опції селекту доставки.');
            }

            updateSubmitButtonState(shouldHideSubmitButton());
        } else {
            updateSubmitButtonState(shouldHideSubmitButton());
        }

        isInitialLoad = false;
    }

    function trackCityChanges() {
        let cityElement = document.querySelector('select[name="Recipient[delivery_city]"]') || document.querySelector('input[name="Recipient[delivery_city]"]');
        
        // Шукаємо текстовий елемент саме для міста, а не будь-який .select__text
        const cityContainer = cityElement ? cityElement.closest('.j-delivery-city-select') : null;
        const cityText = cityContainer ? cityContainer.querySelector('.select__text') : null;

        // Якщо не знайдено, спробуємо знайти через контейнер
        if (!cityElement) {
            const cityContainer = document.querySelector('.j-delivery-city-select');
            if (cityContainer) {
                cityElement = cityContainer.querySelector('select') || cityContainer.querySelector('input');
            }
            log('Спроба знайти елемент міста через контейнер:', !!cityElement);
        }

        const currentCity = (cityElement?.tagName === 'SELECT' ? cityElement.value : cityElement?.value) || '';
        const currentCityId = ''; // Якщо ID потрібен, додай логіку для його пошуку
        
        // Перевіряємо наявність вибору країни
        const { countryFormItem } = findCountryElements();
        const hasCountrySelection = !!countryFormItem;
        
        // Перевіряємо, чи обрана країна
        const currentCountry = getCurrentCountry();
        const isCountrySelected = currentCountry && currentCountry !== 'Oберіть країну';

        log('Поточне місто:', currentCity, ', Текст на екрані:', cityText?.textContent.trim() || 'немає', ', Країна обрана:', isCountrySelected, ', Наявність вибору країни:', hasCountrySelection);

        // Якщо немає вибору країн, не впливаємо на вибір міст
        if (!hasCountrySelection) {
            log('Немає вибору країн, не впливаємо на вибір міст');
            debouncedUpdateCheckoutOptions();
            return;
        }
        
        // Якщо країна не обрана, не змінюємо текст міста
        if (!isCountrySelected) {
            // Перевіряємо, чи текст міста не відповідає стандартному "Спочатку оберіть країну"
            if (cityText && cityText.textContent.trim() !== 'Спочатку оберіть країну') {
                cityText.textContent = 'Спочатку оберіть країну';
                log('Відновлено стандартний текст для міста: "Спочатку оберіть країну"');
            }
            
            // Перевіряємо, чи елемент міста не заблокований
            const cityFormItem = cityContainer?.closest('.form-item');
            if (cityFormItem && !cityFormItem.classList.contains('is-disabled')) {
                cityFormItem.classList.add('is-disabled');
                log('Заблоковано елемент міста, оскільки країна не обрана');
            }
            
            debouncedUpdateCheckoutOptions();
            return;
        }

        // Якщо країна обрана, але місто порожнє
        if (!currentCity || currentCity === 'Виберіть місто') {
            // Розблоковуємо елемент міста, якщо він заблокований
            const cityFormItem = cityContainer?.closest('.form-item');
            if (cityFormItem && cityFormItem.classList.contains('is-disabled')) {
                cityFormItem.classList.remove('is-disabled');
                log('Розблоковано елемент міста, оскільки країна обрана');
            }
            
            // Встановлюємо текст "Виберіть місто"
            if (cityText && cityText.textContent.trim() !== 'Виберіть місто') {
                cityText.textContent = 'Виберіть місто';
                log('Встановлено текст міста: "Виберіть місто"');
            }
            
            log('Значення міста порожнє, але країна обрана');
            debouncedUpdateCheckoutOptions();
        } else {
            // Якщо і країна, і місто обрані
            if (cityText && cityText.textContent.trim() !== currentCity) {
                cityText.textContent = currentCity;
                log('Оновлено текст міста на екрані:', currentCity);
            }
            debouncedUpdateCheckoutOptions();
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function isDeliveryMessageChange(mutations) {
        return mutations.every(mutation => {
            const addedNodes = Array.from(mutation.addedNodes);
            const removedNodes = Array.from(mutation.removedNodes);
            return (
                (addedNodes.length === 1 && addedNodes[0].className === DELIVERY_MESSAGE_CLASS) ||
                (removedNodes.length === 1 && removedNodes[0].className === DELIVERY_MESSAGE_CLASS) ||
                (addedNodes.length === 0 && removedNodes.length === 0)
            );
        });
    }

    const debouncedUpdateCheckoutOptions = debounce(updateCheckoutOptions, 300);
    const debouncedTrackCityChanges = debounce(trackCityChanges, 300);

    const orderListObserver = new MutationObserver((mutations) => {
        if (isDeliveryMessageChange(mutations) || isCountryMessageChange(mutations)) {
            log('Зміни викликані', DELIVERY_MESSAGE_CLASS, 'або', COUNTRY_MESSAGE_CLASS, ', ігноруємо');
            return;
        }

        log('Зміни в списку товарів виявлено');
        debouncedUpdateCheckoutOptions();
        
        // Після зміни товарів у кошику оновлюємо перевірку обмежень країни
        setTimeout(() => {
            checkCountryRestrictions();
            setupCountriesExample();
        }, 500);
    });

    function setupOrderListObserver() {
        const orderList = document.querySelector('.order-list, .order-details__list');
        if (orderList) {
            orderListObserver.disconnect();
            orderListObserver.observe(orderList, { childList: true, subtree: true, characterData: true });
            debouncedUpdateCheckoutOptions();
        }
    }

    const cityObserver = new MutationObserver((mutations) => {
        log('Виявлено зміни в DOM для поля міста. Мутації:', mutations.length);
        mutations.forEach(mutation => {
            log('Тип мутації:', mutation.type, 'Ціль:', mutation.target.name, 'Значення:', mutation.target.value);
        });
        debouncedTrackCityChanges();
    });

    function setupCityObserver() {
        let cityElement = document.querySelector('select[name="Recipient[delivery_city]"]') || document.querySelector('input[name="Recipient[delivery_city]"]');

        if (cityElement) {
            cityObserver.disconnect();
            
            // Спостерігаємо за всім контейнером міста, а не тільки за полем
            const cityContainer = cityElement.closest('.j-delivery-city-select');
            if (cityContainer) {
                cityObserver.observe(cityContainer, { attributes: true, characterData: true, subtree: true, childList: true });
                log('Спостерігаємо за контейнером міста');
            } else {
                cityObserver.observe(cityElement, { attributes: true, characterData: true, subtree: true, childList: true });
                log('Спостерігаємо за елементом міста');
            }
            if (cityElement.tagName === 'SELECT') {
                cityElement.addEventListener('change', debouncedTrackCityChanges);
            } else {
                cityElement.addEventListener('input', debouncedTrackCityChanges);
                cityElement.addEventListener('change', debouncedTrackCityChanges);
            }
            log('Спостерігач за елементом міста налаштовано (тип:', cityElement.tagName, ')');
            debouncedTrackCityChanges();
        } else {
            log('Не вдалося знайти елемент міста (select або input) для спостереження');
        }
    }

    // Функція для перевірки, чи є зміни пов'язані з повідомленням про обмеження країни
    function isCountryMessageChange(mutations) {
        return mutations.every(mutation => {
            const addedNodes = Array.from(mutation.addedNodes);
            const removedNodes = Array.from(mutation.removedNodes);
            return (
                (addedNodes.length === 1 && addedNodes[0].className === COUNTRY_MESSAGE_CLASS) ||
                (removedNodes.length === 1 && removedNodes[0].className === COUNTRY_MESSAGE_CLASS) ||
                (addedNodes.length === 0 && removedNodes.length === 0)
            );
        });
    }
    
    // Функція для додавання списку країн (працює для обох версій)
    function setupCountriesExample() {
        log('Налаштування прикладів країн');

        const isMobileTheme = window.GLOBAL && window.GLOBAL.theme === 'horoshop_mobile';
        log('Тема:', isMobileTheme ? 'Мобільна' : 'Десктоп');

        // Знаходимо базовий контейнер для поля країни
        let countryContainer;
        if (isMobileTheme) {
            // У мобільній версії шукаємо select
            const selectElement = document.querySelector('select[name="Recipient[delivery_country]"]');
            countryContainer = selectElement ? selectElement.closest('.form-item') : null;
        } else {
            // У десктопній версії шукаємо input
            const inputElement = document.querySelector('input[name="Recipient[delivery_country]"]');
            countryContainer = inputElement ? inputElement.closest('.form-item') : null;
        }

        if (!countryContainer) {
            log('Не вдалося знайти контейнер поля країни (.form-item)');
            return;
        }
        
        // Перевіряємо, чи наш контейнер зі списком вже існує
        const existingContainer = countryContainer.querySelector('.country-quick-select-container');
        if (existingContainer) {
            log('Контейнер зі списком країн вже існує.');
            return; // Виходимо, якщо контейнер вже додано
        }

        log('Створюємо новий контейнер для списку країн');
        // Створюємо головний контейнер для заголовка та списку
        const availableCountriesContainer = document.createElement('div');
        // Додаємо унікальний клас для легкого пошуку та стилізації
        availableCountriesContainer.className = 'country-quick-select-container'; 

        // Додаємо заголовок
        const titleSpan = document.createElement('div');
        titleSpan.textContent = 'Доступні країни:';
        titleSpan.className = 'country-quick-select-title'; // Використовуємо клас для стилізації
        availableCountriesContainer.appendChild(titleSpan);

        // Додаємо самі країни
        COUNTRIES_LIST.forEach((country) => { 
             const countryElement = document.createElement('span');
             countryElement.className = 'a-pseudo country-link'; // Додаємо клас для можливості стилізації
             countryElement.textContent = country.name;

             countryElement.onclick = () => {
                 try {
                     // Використовуємо eval для виклику функції, як у v4
                     eval(country.functionCall);
                     log('Виконано eval для країни:', country.name, '(Mobile:', isMobileTheme, ')');

                     // Якщо це мобільна версія, додатково оновлюємо видимий текст
                     if (isMobileTheme) {
                         const countrySelectContainer = document.querySelector('select[name="Recipient[delivery_country]"]')?.closest('.form-item');
                         if (countrySelectContainer) {
                             const selectText = countrySelectContainer.querySelector('.select__text');
                             if (selectText) {
                                 selectText.textContent = country.name;
                                 log('Оновлено select__text для мобільної версії:', country.name);
                             }
                         } else {
                             log('Не вдалося знайти контейнер .form-item для оновлення select__text');
                         }
                         // Викликаємо оновлення опцій після невеликої затримки, як у v4
                         setTimeout(() => {
                             debouncedUpdateCheckoutOptions();
                         }, 100);
                     }

                     // Код прямої маніпуляції <select> залишається закоментованим
                     /* ... */
                 } catch (e) {
                     log('Помилка при виконанні eval для встановлення країни:', e);
                 }
             };

             availableCountriesContainer.appendChild(countryElement);

             // Додаємо кому, якщо це не остання країна
             if (COUNTRIES_LIST.indexOf(country) < COUNTRIES_LIST.length - 1) {
                 const comma = document.createTextNode(', ');
                 availableCountriesContainer.appendChild(comma);
             }
         });

         // Додаємо контейнер зі списком на сторінку
         if (isMobileTheme) {
             // В мобільній версії додаємо після form-item__content, якщо він є, або просто в кінець контейнера
             const contentElement = countryContainer.querySelector('.form-item__content');
             if(contentElement){
                 contentElement.appendChild(availableCountriesContainer);
             } else {
                 countryContainer.appendChild(availableCountriesContainer);
             }
         } else {
             // В десктоп версії додаємо після поля вводу
             const inputField = countryContainer.querySelector('input[name="Recipient[delivery_country]"]');
             if (inputField) {
                  // Вставляємо після поля, але перед .form-item-txt (якщо він є)
                 const exampleText = countryContainer.querySelector('.form-item-txt');
                  if (exampleText) {
                     countryContainer.insertBefore(availableCountriesContainer, exampleText);
                 } else {
                     // Якщо немає .form-item-txt, додаємо в кінець контейнера
                     countryContainer.appendChild(availableCountriesContainer);
                 }
             } else {
                 // Якщо немає поля вводу, додаємо в кінець контейнера
                 countryContainer.appendChild(availableCountriesContainer);
             }
         }
         log('Контейнер зі списком країн додано.');

         // --- Приховування стандартного тексту для десктопної версії --- 
         const standardTextContainer = countryContainer.querySelector('.form-item-txt');
         if (standardTextContainer) {
             log('Стандартний текстовий блок країн (.form-item-txt) буде приховано через CSS');
         } else {
             log('Стандартний текстовий блок країн (.form-item-txt) не знайдено для приховування (десктоп)');
         }
         // --------------------------------------------------------------
     }
    
    // Функція для отримання поточної країни
    function getCurrentCountry() {
        const isMobileTheme = window.GLOBAL && window.GLOBAL.theme === 'horoshop_mobile';
        let countryValue = '';
        const countrySelectElement = document.querySelector('select[name="Recipient[delivery_country]"]');
        const countryInputElement = document.querySelector('input[name="Recipient[delivery_country]"]');

        if (isMobileTheme) {
            // Пріоритет 1: Спробувати отримати з текстового елемента, який ми оновлюємо
            const selectTextElement = countrySelectElement?.closest('.form-item')?.querySelector('.select__text');
            if (selectTextElement) {
                countryValue = selectTextElement.textContent.trim();
                // Перевірка, чи це не текст-плейсхолдер
                if (countryValue.toLowerCase().includes('виберіть') || 
                    countryValue.toLowerCase().includes('select') || 
                    countryValue === 'Oберіть країну') {
                    countryValue = ''; // Ігноруємо плейсхолдер
                }
            }

            // Пріоритет 2: Якщо текстовий елемент порожній або плейсхолдер, спробувати з select
            if (!countryValue && countrySelectElement) {
                countryValue = countrySelectElement.options[countrySelectElement.selectedIndex]?.text || countrySelectElement.value;
                // Ще раз перевірка на плейсхолдер
                if (countryValue.toLowerCase().includes('виберіть') || 
                    countryValue.toLowerCase().includes('select') || 
                    countryValue === 'Oберіть країну' || 
                    countryValue === '') {
                    countryValue = ''; 
                }
            }
        } else {
            // Для десктопної версії беремо значення з input
            if (countryInputElement) {
                countryValue = countryInputElement.value;
            }
        }
        
        // Перевірка на плейсхолдер
        if (countryValue === 'Oберіть країну') {
            countryValue = '';
        }
        
        log('Поточна країна:', countryValue || '(не вибрана)');
        return countryValue ? countryValue.trim() : '';
    }

    // Функція для перевірки, чи є ягоди в кошику
    function hasRestrictedProducts() {
        const cartProductsData = window.cartProductsData || [];
        const productItems = document.querySelectorAll('.order-list .order-i, .order-details__list .j-cart-product');
        return Array.from(productItems).some(item => {
            const productHash = item.id.replace('product_', '');
            if (productHash) {
                const productData = findProductByHash(cartProductsData, productHash);
                return productData && RESTRICTED_CATEGORIES.includes(productData.parent);
            }
            return false;
        });
    }

    function isKyiv(cityName, cityId) {
        const normalizedCityName = (cityName || '').toLowerCase().trim();
        const normalizedCityId = (cityId || '').toLowerCase().trim();

        return KYIV_CITY_IDS.some(id => 
            id.toLowerCase().trim() === normalizedCityName || // Перевірка назви міста
            id.toLowerCase().trim() === normalizedCityId      // Перевірка ID, якщо є
        );
    }
    
    // Функція для встановлення України за замовчуванням
    function setDefaultCountry() {
        log('Встановлення країни за замовчуванням');
        
        // Визначаємо, яка тема використовується
        const isMobileTheme = window.GLOBAL && window.GLOBAL.theme === 'horoshop_mobile';
        
        // Отримуємо поточну країну
        const currentCountry = getCurrentCountry();
        
        // Якщо країна вже вибрана і це не 'Oберіть країну', нічого не робимо
        if (currentCountry && currentCountry !== 'Oберіть країну') {
            log('Країна вже вибрана:', currentCountry);
            return;
        }
        
        log('Потрібно встановити країну за замовчуванням');
        
        // Спроба встановити країну через CheckoutModule (працює для обох версій)
        try {
            if (typeof CheckoutModule !== 'undefined' && CheckoutModule.getInstance) {
                const recipient = CheckoutModule.getInstance().getComponentByName('Recipient');
                if (recipient && typeof recipient.setCountry === 'function') {
                    // Викликаємо нативний метод сайту для встановлення країни
                    recipient.setCountry(null, DEFAULT_COUNTRY);
                    log('Встановлено країну за замовчуванням через CheckoutModule:', DEFAULT_COUNTRY);
                    
                    // Додатково перевіряємо, чи оновився селект
                    setTimeout(() => {
                        const countrySelect = document.querySelector('.j-delivery-country-select');
                        const selectText = countrySelect?.querySelector('.select__text');
                        if (selectText && selectText.textContent !== DEFAULT_COUNTRY) {
                            selectText.textContent = DEFAULT_COUNTRY;
                            log('Оновлено текст селекта країни');
                        }
                    }, 300);
                    
                    return;
                }
            }
        } catch (e) {
            log('Помилка при використанні CheckoutModule:', e);
        }
        
        // Запасний варіант для мобільної версії - використовуємо DrawerSelect, якщо він доступний
        if (isMobileTheme) {
            try {
                const countrySelect = document.querySelector('.j-delivery-country-select');
                if (countrySelect) {
                    // Перевіряємо, чи є опція 'Україна' в селекті
                    const selectElement = countrySelect.querySelector('select');
                    if (selectElement) {
                        // Додаємо опцію України, якщо її немає
                        let ukraineOption = Array.from(selectElement.options).find(opt => opt.value === DEFAULT_COUNTRY);
                        if (!ukraineOption) {
                            ukraineOption = document.createElement('option');
                            ukraineOption.value = DEFAULT_COUNTRY;
                            ukraineOption.textContent = DEFAULT_COUNTRY;
                            selectElement.appendChild(ukraineOption);
                            log('Додано опцію України до селекта');
                        }
                        
                        // Встановлюємо значення селекта
                        selectElement.value = DEFAULT_COUNTRY;
                        
                        // Оновлюємо текст в селекті
                        const selectText = countrySelect.querySelector('.select__text');
                        if (selectText) {
                            selectText.textContent = DEFAULT_COUNTRY;
                        }
                        
                        // Встановлюємо значення прихованого поля country_id
                        const countryIdField = document.querySelector('input[name="Recipient[delivery_country_id]"]');
                        if (countryIdField) {
                            countryIdField.value = '182'; // ID України
                        }
                        
                        // Створюємо подію change для селекта
                        const event = new Event('change', { bubbles: true });
                        selectElement.dispatchEvent(event);
                        
                        log('Встановлено країну за замовчуванням (мобільна версія, запасний варіант):', DEFAULT_COUNTRY);
                    }
                }
            } catch (e) {
                log('Помилка при встановленні країни для мобільної версії:', e);
            }
        } else {
            // Для десктоп версії використовуємо функцію сайту
            try {
                CheckoutModule.getInstance().getComponentByName('Recipient').setCountry(null, DEFAULT_COUNTRY);
                log('Встановлено країну за замовчуванням (десктоп версія):', DEFAULT_COUNTRY);
            } catch (e) {
                log('Помилка при встановленні країни для десктоп версії:', e);
            }
        }
    }
    
    // Функція для перевірки країни та товарів з обмеженої категорії
    function checkCountryRestrictions() {
        log('Перевірка обмежень країни');
        
        // Визначаємо, яка тема використовується
        const isMobileTheme = window.GLOBAL && window.GLOBAL.theme === 'horoshop_mobile';
        
        // Знаходимо елемент країни
        let countryElement;
        if (isMobileTheme) {
            countryElement = document.querySelector('select[name="Recipient[delivery_country]"]');
        } else {
            countryElement = document.querySelector('input[name="Recipient[delivery_country]"]');
        }
        
        if (!countryElement) {
            log('Елемент країни не знайдено');
            return;
        }
        
        // Отримуємо поточне значення країни
        const currentCountry = getCurrentCountry();
        log('Поточна країна:', currentCountry);
        
        // Перевіряємо, чи є товари з обмеженої категорії
        const hasRestricted = hasRestrictedProducts();
        log('Є товари з обмеженої категорії:', hasRestricted);
        
        // Знаходимо контейнер для повідомлення
        let countryContainer;
        if (isMobileTheme) {
            countryContainer = countryElement.closest('.form-item');
        } else {
            countryContainer = countryElement.closest('.form-item');
        }
        
        if (!countryContainer) {
            log('Контейнер країни не знайдено');
            return;
        }
        
        // Видаляємо існуючі повідомлення
        const existingMessages = countryContainer.querySelectorAll('.' + COUNTRY_MESSAGE_CLASS);
        existingMessages.forEach(msg => msg.remove());
        
        // Перевіряємо обмеження
        const showWarning = hasRestricted && currentCountry && currentCountry !== DEFAULT_COUNTRY;
        
        if (showWarning) {
            // Створюємо повідомлення
            const message = document.createElement('div');
            message.className = COUNTRY_MESSAGE_CLASS;
            message.textContent = 'На жаль, доставка товарів з категорії "Ягоди" за кордон неможлива.';
            
            if (isMobileTheme) {
                // У мобільній версії шукаємо наш контейнер списку країн
                const quickSelectContainer = countryContainer.querySelector('.country-quick-select-container');
                if (quickSelectContainer) {
                    // Вставляємо повідомлення ПІСЛЯ списку країн
                    quickSelectContainer.insertAdjacentElement('afterend', message);
                    log('Додано повідомлення про обмеження ПІСЛЯ списку країн (мобільна версія)');
                } else {
                    // Якщо список країн не знайдено (запасний варіант), додаємо в кінець контейнера
                    countryContainer.appendChild(message);
                    log('Додано повідомлення про обмеження в кінець контейнера (мобільна версія - список не знайдено)');
                }
            } else {
                // У десктопній версії додаємо в кінець контейнера поля
                countryContainer.appendChild(message);
                log('Додано повідомлення про обмеження (десктопна версія)');
            }
        }
        
        // Оновлюємо стан кнопки оформлення замовлення
        updateSubmitButtonState(shouldHideSubmitButton());
    }
    
    // Функція для додавання тексту про відділення Нової Пошти для міжнародної доставки
    function addInternationalDeliveryText() {
        log('Додавання тексту для міжнародної доставки');
        
        // Визначаємо, яка тема використовується
        const isMobileTheme = window.GLOBAL && window.GLOBAL.theme === 'horoshop_mobile';
        
        // Знаходимо елемент методу доставки
        const deliveryTypeElement = document.querySelector('select[name="Delivery[delivery_type]"]');
        if (!deliveryTypeElement) {
            log('Елемент методу доставки не знайдено');
            return;
        }
        
        // Перевіряємо, чи вибрана міжнародна доставка
        const isInternational = deliveryTypeElement.value === DELIVERY_NP_INTERNATIONAL;
        log('Міжнародна доставка:', isInternational);
        
        if (!isInternational) {
            return;
        }
        
        // Знаходимо поле для адреси
        let addressField;
        if (isMobileTheme) {
            addressField = document.querySelector('input[name="Delivery[delivery_method][delivery_address]"]');
        } else {
            addressField = document.querySelector('input[name="Delivery[delivery_method][delivery_address]"]');
        }
        
        if (!addressField) {
            log('Поле адреси не знайдено');
            return;
        }
        
        // Знаходимо контейнер для поля адреси
        const addressContainer = addressField.closest('.form-item');
        if (!addressContainer) {
            log('Контейнер поля адреси не знайдено');
            return;
        }
        
        // Перевіряємо, чи вже додано текст
        if (addressContainer.querySelector('.international-delivery-text')) {
            log('Текст для міжнародної доставки вже додано');
            return;
        }
        
        // Створюємо елемент з текстом
        const textElement = document.createElement('div');
        textElement.className = 'international-delivery-text';
        textElement.textContent = 'Вкажіть відділення Нової Пошти';
        
        // Додаємо текст після поля адреси
        if (isMobileTheme) {
            // У мобільній версії шукаємо саме поле вводу адреси
            const addressInputElement = addressContainer.querySelector('textarea[name="Delivery[delivery_method][delivery_address]"]') || addressContainer.querySelector('input[name="Delivery[delivery_method][delivery_address]"]');
            if (addressInputElement) {
                // Вставляємо повідомлення ПІСЛЯ поля вводу
                addressInputElement.insertAdjacentElement('afterend', textElement);
                log('Додано текст для міжнародної доставки ПІСЛЯ поля вводу (мобільна версія)');
            } else {
                // Якщо поле вводу не знайдено (запасний варіант), додаємо в кінець контейнера
                addressContainer.appendChild(textElement);
                log('Додано текст для міжнародної доставки В КІНЕЦЬ контейнера (мобільна версія - поле вводу не знайдено)');
            }
        } else {
            // У десктопній версії додаємо в кінець контейнера поля, як і раніше
            addressContainer.appendChild(textElement);
            log('Додано текст для міжнародної доставки (десктопна версія)');
        }
    }
    
    // Спостерігач за змінами в полі країни
    const countryObserver = new MutationObserver((mutations) => {
        log('Виявлено зміни в DOM для поля країни. Мутації:', mutations.length);
        
        if (isCountryMessageChange(mutations)) {
            log('Зміни викликані', COUNTRY_MESSAGE_CLASS, ', ігноруємо');
            return;
        }
        
        // Перевіряємо обмеження країни
        setTimeout(() => {
            checkCountryRestrictions();
        }, 500);
    });
    
    // Функція для налаштування спостерігача за полем країни
    function setupCountryObserver() {
        log('Налаштування спостерігача за полем країни');
        
        // Визначаємо, яка тема використовується
        const isMobileTheme = window.GLOBAL && window.GLOBAL.theme === 'horoshop_mobile';
        
        // Знаходимо елемент країни
        let countryElement;
        if (isMobileTheme) {
            countryElement = document.querySelector('select[name="Recipient[delivery_country]"]');
        } else {
            countryElement = document.querySelector('input[name="Recipient[delivery_country]"]');
        }
        
        if (!countryElement) {
            log('Елемент країни не знайдено');
            return;
        }
        
        // Відключаємо спостерігач перед повторним налаштуванням
        countryObserver.disconnect();
        
        // Налаштовуємо спостерігач
        const countryContainer = countryElement.closest('.form-item');
        if (countryContainer) {
            countryObserver.observe(countryContainer, { attributes: true, characterData: true, subtree: true, childList: true });
            log('Спостерігач за контейнером країни налаштовано');
        } else {
            countryObserver.observe(countryElement, { attributes: true, characterData: true, subtree: true, childList: true });
            log('Спостерігач за елементом країни налаштовано');
        }
        
        // Додаємо обробники подій
        if (isMobileTheme) {
            countryElement.addEventListener('change', checkCountryRestrictions);
        } else {
            countryElement.addEventListener('input', checkCountryRestrictions);
            countryElement.addEventListener('change', checkCountryRestrictions);
        }
        
        // Перевіряємо обмеження країни
        checkCountryRestrictions();
    }
    // Спостерігач за змінами в методі доставки
    const deliveryTypeObserver = new MutationObserver((mutations) => {
        log('Виявлено зміни в DOM для методу доставки. Мутації:', mutations.length);
        
        if (isDeliveryMessageChange(mutations)) {
            log('Зміни викликані', DELIVERY_MESSAGE_CLASS, ', ігноруємо');
            return;
        }
        
        addInternationalDeliveryText();
    });

    // Спостерігач за змінами в контейнері доставки
    const deliveryContainerObserver = new MutationObserver((mutations) => {
        log('Виявлено зміни в контейнері доставки. Мутації:', mutations.length);
        setTimeout(() => {
            addInternationalDeliveryText();
        }, 300); // Невелика затримка для впевненості, що DOM повністю оновлений
    });

    // Функція для налаштування спостерігача за методом доставки
    function setupDeliveryTypeObserver() {
        log('Налаштування спостерігача за методом доставки');
        
        // Знаходимо елемент методу доставки
        const deliveryTypeElement = document.querySelector('select[name="Delivery[delivery_type]"]');
        if (!deliveryTypeElement) {
            log('Елемент методу доставки не знайдено');
            return;
        }
        
        // Відключаємо спостерігач перед повторним налаштуванням
        deliveryTypeObserver.disconnect();
        
        // Знаходимо контейнер для методу доставки
        const deliveryTypeContainer = deliveryTypeElement.closest('.select');
        if (!deliveryTypeContainer) {
            log('Контейнер методу доставки не знайдено');
            return;
        }
        
        // Налаштовуємо спостерігач
        deliveryTypeObserver.observe(deliveryTypeContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
        
        log('Спостерігач за методом доставки налаштовано');
        
        // Додаємо текст для міжнародної доставки
        addInternationalDeliveryText();
    }
    
    // Функція для налаштування спостерігача за контейнером доставки
    function setupDeliveryContainerObserver() {
        log('Налаштування спостерігача за контейнером доставки');
        
        // Знаходимо контейнер доставки
        const deliveryContainer = document.querySelector('.form__section.j-component[data-component="Delivery"]');
        if (!deliveryContainer) {
            log('Контейнер доставки не знайдено');
            return;
        }
        
        // Відключаємо спостерігач перед повторним налаштуванням
        deliveryContainerObserver.disconnect();
        
        // Налаштовуємо спостерігач
        deliveryContainerObserver.observe(deliveryContainer, {
            childList: true,
            subtree: true,
            attributes: false
        });
        
        log('Спостерігач за контейнером доставки налаштовано');
    }
    
    const bodyObserver = new MutationObserver((mutations) => {
        if (isDeliveryMessageChange(mutations) || isCountryMessageChange(mutations)) {
            log('Зміни викликані', DELIVERY_MESSAGE_CLASS, 'або', COUNTRY_MESSAGE_CLASS, ', ігноруємо');
            return;
        }

        const orderList = document.querySelector('.order-list, .order-details__list');
        const citySelectContainer = document.querySelector('.select--block.j-delivery-city-select');

        if (orderList && mutations.some(mutation => 
            mutation.target.closest('.order-list, .order-details__list') || 
            Array.from(mutation.addedNodes).length > 0
        )) {
            setupOrderListObserver();
        }

        if (citySelectContainer && mutations.some(mutation => 
            mutation.target === citySelectContainer || 
            Array.from(mutation.addedNodes).includes(citySelectContainer)
        )) {
            setupCityObserver();
        }
        
        // Перевіряємо наявність контейнера країни
        const countryContainer = document.querySelector('.form-item input[name="Recipient[delivery_country]"]')?.closest('.form-item') ||
                               document.querySelector('.form-item select[name="Recipient[delivery_country]"]')?.closest('.form-item');
        
        if (countryContainer && mutations.some(mutation => 
            mutation.target === countryContainer || 
            Array.from(mutation.addedNodes).includes(countryContainer)
        )) {
            setupCountriesExample();
            setupCountryObserver();
            setDefaultCountry();
        }
        
        // Перевіряємо наявність контейнера методу доставки
        const deliveryContainer = document.querySelector('.j-delivery-main-container');
        
        if (deliveryContainer && mutations.some(mutation => 
            mutation.target === deliveryContainer || 
            Array.from(mutation.addedNodes).includes(deliveryContainer)
        )) {
            setupDeliveryTypeObserver();
        }
        
        // Перевіряємо наявність контейнера доставки
        const deliverySectionContainer = document.querySelector('.form__section.j-component[data-component="Delivery"]');
        
        if (deliverySectionContainer && mutations.some(mutation => 
            mutation.target === deliverySectionContainer || 
            Array.from(mutation.addedNodes).includes(deliverySectionContainer)
        )) {
            setupDeliveryContainerObserver();
        }

        setupCityObserver();
    });

    setupOrderListObserver();
    setupCityObserver();
    setupCountriesExample();
    setupCountryObserver();
    setDefaultCountry();
    setupDeliveryTypeObserver();
    setupDeliveryContainerObserver();
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    debouncedUpdateCheckoutOptions();
    checkCountryRestrictions();
    addInternationalDeliveryText();
});

// Функція для визначення типу теми (мобільна чи десктоп)
function isMobileTheme() {
    // Перевіряємо наявність елементів, специфічних для мобільної теми Horoshop
    const mobileSpecificElement = document.querySelector('.header-m') 
                                || document.querySelector('.header-mobile')
                                || document.body.classList.contains('is-mobile')
                                || window.innerWidth < 992; // Як запасний варіант, перевіряємо ширину вікна
                                
    // Перевіряємо наявність змінної теми Horoshop
    const theme = window.theme || {};
    const isMobileClass = document.body.classList.contains('template-mobile');
    const isMobileVar = theme.isMobile === true || (typeof theme.isMobile === 'string' && theme.isMobile.toLowerCase() === 'true');

    const result = !!mobileSpecificElement || isMobileClass || isMobileVar;
    log('Перевірка мобільної теми:', result, 
        '(mobileSpecificElement:', !!mobileSpecificElement, 
        'isMobileClass:', isMobileClass, 
        'isMobileVar:', isMobileVar, 
        'innerWidth:', window.innerWidth, ')');
    return result;
}
