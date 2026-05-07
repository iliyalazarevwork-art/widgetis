// source: https://zaya.ua/
// extracted: 2026-05-07T21:19:02.956Z
// scripts: 1

// === script #1 (length=11171) ===
document.addEventListener('DOMContentLoaded', function () {
    let previousContent = {};
    let observers = [];
    let previousCountry = "";

    // Функція для отримання мови з <meta property="og:locale">
    function getLanguage() {
        const localeMeta = document.querySelector('meta[property="og:locale"]');
        if (localeMeta) {
            const locale = localeMeta.getAttribute('content') || 'ua_UA';
            return locale.split('_')[0];
        }
        return 'ua';
    }

    // Функція для отримання валюти на основі тексту ціни
    function getCurrency(priceText) {
        if (priceText.includes('₴') || priceText.toLowerCase().includes('грн')) {
            return 'UAH';
        } else if (priceText.includes('$')) {
            return 'USD';
        }
        return 'UAH'; // За замовчуванням гривня
    }

    // Функція для перевірки, чи ми на сторінці чекауту
    function isCheckoutPage() {
        return document.querySelector('.checkout-aside') !== null || 
               document.querySelector('.order-details__body') !== null ||
               document.querySelector('input[name="Recipient[delivery_country]"]') !== null ||
               document.querySelector('select[name="Recipient[delivery_country]"]') !== null;
    }

    // Функція для отримання обраної країни
    function getSelectedCountry() {
        let input = document.querySelector('input[name="Recipient[delivery_country]"]');
        let select = document.querySelector('select[name="Recipient[delivery_country]"]');
        
        if (input && input.value) {
            return input.value.trim();
        } else if (select && select.value) {
            return select.value.trim();
        } else {
        //    console.log("Не вдалося знайти елемент з країною");
            return 'Україна'; // За замовчуванням Україна
        }
    }

    // Функція для перевірки, чи обрана Україна
    function isUkraineSelected() {
        const country = getSelectedCountry();
        return country === 'Україна' || country === 'Украина';
    }

    // Функція для отримання порогу безкоштовної доставки
    function getFreeShippingThreshold(currency) {
        switch (currency) {
            case 'UAH':
                return 500;
            case 'USD':
                return 99;
            default:
                return 1500;
        }
    }

    // Функція для отримання перекладу тексту
    function getTranslation(language, remaining, currency) {
        const translations = {
            ua: {
                freeShipping: `До безкоштовної доставки по Україні залишилось: ${remaining.toFixed(2)} грн`,
                freeShippingAchieved: 'Безкоштовна доставка'
            },
            en: {
                freeShipping: `Amount left for free shipping: ${remaining.toFixed(2)} $`,
                freeShippingAchieved: 'Free shipping'
            },
            ru: {
                freeShipping: `До бесплатной доставки по Украине осталось: ${remaining.toFixed(2)} грн`,
                freeShippingAchieved: 'Бесплатная доставка'
            }
        };
        return translations[language] || translations.ua;
    }

    function parseNumber(text) {
        return parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function createBlockStrip(priceCurrent, container, priceText) {
        let existingBlockStrip = container.querySelector('.blockStrip');
        if (existingBlockStrip) {
            existingBlockStrip.remove();
        }

        // Перевіряємо, чи обрана країна і чи це Україна, тільки на сторінці оформлення замовлення
        if (isCheckoutPage()) {
            if (!isUkraineSelected()) {
         //       console.log('Сторінка оформлення замовлення: країна не обрана або не Україна. Прогрес-бар не відображається.');
                return;
            }
        }

        const language = getLanguage();
        const currency = getCurrency(priceText);
        const freeShippingThreshold = getFreeShippingThreshold(currency);
        const remaining = freeShippingThreshold - priceCurrent;
        const translation = getTranslation(language, remaining, currency);

    //    console.log(`Загальна сума: $, Поріг безкоштовної доставки: $`);

        const blockStrip = document.createElement('div');
        blockStrip.classList.add('blockStrip');

        const blockStripTop = document.createElement('div');
        blockStripTop.classList.add('blockStripTop');
        blockStrip.appendChild(blockStripTop);

        const blockStripTopLeft = document.createElement('div');
        blockStripTopLeft.classList.add('blockStripTopLeft');
        const blockStripTopLeftLogo = document.createElement('img');
        blockStripTopLeftLogo.src = '/content/uploads/images/dostavka.svg';
        blockStripTopLeftLogo.classList.add('lockStripTopLeftLogo');
        blockStripTopLeft.appendChild(blockStripTopLeftLogo);
        const blockStripTopLeftText = document.createElement('p');
        blockStripTopLeftText.classList.add('blockStripTopLeftText');
        if (remaining > 0) {
            blockStripTopLeftText.textContent = translation.freeShipping;
        } else {
            blockStripTopLeftText.textContent = translation.freeShippingAchieved;
        }
        blockStripTopLeft.appendChild(blockStripTopLeftText);
        blockStripTop.appendChild(blockStripTopLeft);

        const blockStripBottom = document.createElement('div');
        blockStrip.appendChild(blockStripBottom);
        const blockStripBottomStrip = document.createElement('div');
        blockStripBottomStrip.classList.add('blockStripBottomStrip');
        blockStripBottom.appendChild(blockStripBottomStrip);
        const blockStripBottomStripSpan = document.createElement('span');
        blockStripBottomStripSpan.classList.add('blockStripBottomStripSpan');
        let percentage = Math.min((priceCurrent / freeShippingThreshold) * 100, 100);
        blockStripBottomStripSpan.style.width = percentage + "%";
        blockStripBottomStrip.appendChild(blockStripBottomStripSpan);

        container.appendChild(blockStrip);
    }

    function logContent(targetElement, selector) {
        if (targetElement) {
            const currentContent = targetElement.textContent.trim();
            if (currentContent !== previousContent[selector] || getSelectedCountry() !== previousCountry) {
                previousContent[selector] = currentContent;
                previousCountry = getSelectedCountry();
                let priceCurrent = parseNumber(currentContent);
        //        console.log(`Selector: $, Price: $, Country: $`);

                let container = null;
                
                if (selector === '.cart-footer-b' && document.querySelector('.cart-footer-b')) {
                    const cartBlockPc = targetElement.closest('#cart');
                    if (cartBlockPc) container = cartBlockPc.querySelector('.cart-content');
                } else if (selector === '.cart__total-price' && document.querySelector('.cart__total-price')) {
                    const cartBlock = targetElement.closest('.cart__container');
                    if (cartBlock) container = cartBlock.querySelector('.cart__order');
                } else if (selector === '.order-summary-b' && document.querySelector('.order-summary-b')) {
                    container = document.querySelector('.checkout-aside');
                } else if (selector.includes('order-details__total') && document.querySelector(selector)) {
                    container = document.querySelector('.order-details__body');
                }

                if (container && priceCurrent >= 0) {
                    createBlockStrip(priceCurrent, container, currentContent);
                }
            }
        } else {
        //    console.log(`Element not found: $`);
        }
    }

    const debouncedLogContent = debounce((targetElement, selector) => {
        logContent(targetElement, selector);
    }, 1000);

    function observeChanges() {
        observers.forEach(observer => observer.disconnect());
        observers = [];

        const elements = [
            { selector: '.cart-footer-b' },
            { selector: '.cart__total-price' },
            { selector: '.order-summary-b' },
            { selector: '.order-details__total' }
        ];

        elements.forEach(({ selector }) => {
            const targetElement = document.querySelector(selector);
            if (targetElement) {
                const observer = new MutationObserver(() => debouncedLogContent(targetElement, selector));
                observers.push(observer);
                observer.observe(targetElement, { characterData: true, subtree: true, childList: true });
                debouncedLogContent(targetElement, selector);
            } else {
            //    console.log(`Element not found on initial load: $`);
            }
        });
    }

    function observeCountryChange() {
        const countryInput = document.querySelector('input[name="Recipient[delivery_country]"]');
        const countrySelect = document.querySelector('select[name="Recipient[delivery_country]"]');
        
        if (countryInput) {
            const observer = new MutationObserver(() => updateAllPriceElements());
            observer.observe(countryInput, { attributes: true, attributeFilter: ['value'] });
            ['input', 'change'].forEach(event => countryInput.addEventListener(event, updateAllPriceElements));
        }
        
        if (countrySelect) {
            const observer = new MutationObserver(() => updateAllPriceElements());
            observer.observe(countrySelect, { attributes: true, attributeFilter: ['value'] });
            ['change'].forEach(event => countrySelect.addEventListener(event, updateAllPriceElements));
        }
    }

    function updateAllPriceElements() {
        const elements = ['.cart-footer-b', '.cart__total-price', '.order-summary-b', '.order-details__total'];
        elements.forEach(selector => {
            const targetElement = document.querySelector(selector);
            if (targetElement) {
                previousCountry = ""; // Примусове оновлення
                debouncedLogContent(targetElement, selector);
            }
        });
    }

    function observeDOMChanges() {
        const bodyObserver = new MutationObserver(() => {
            observeCountryChange();
            observeChanges();
        });
        bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

    observeChanges();
    observeCountryChange();
    observeDOMChanges();

    setTimeout(() => {
        observeCountryChange();
        updateAllPriceElements();
    }, 1000);
});
