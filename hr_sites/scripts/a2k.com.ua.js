// source: https://a2k.com.ua/
// extracted: 2026-05-07T21:20:39.716Z
// scripts: 5

// === script #1 (length=2242) ===
(function() {
        let path = window.location.pathname;
        
        // Проверяем, находимся ли мы на странице успешного заказа
        if (path.indexOf('/checkout/complete/') !== -1) {
            
            // Определяем язык по наличию /ru/ в URL
            let lang = path.indexOf('/ru/') === 0 ? 'ru' : 'uk';
            
            // Словари с переводами
            let texts = {
                'uk': {
                    title: 'Відстежуйте замовлення!',
                    desc: 'Хочете отримувати автоматичні сповіщення про статус посилки та ТТН у Telegram?',
                    btn: '🚀 Отримувати статуси',
                    orderPref: 'Ваш номер замовлення № '
                },
                'ru': {
                    title: 'Отслеживайте заказ!',
                    desc: 'Хотите получать автоматические уведомления о статусе посылки и ТТН в Telegram?',
                    btn: '🚀 Получать статусы',
                    orderPref: 'Ваш номер заказа № '
                }
            };

            // Подставляем тексты нужного языка в окно
            document.getElementById('a2k-modal-title').innerText = texts[lang].title;
            document.getElementById('a2k-modal-desc').innerText = texts[lang].desc;
            document.getElementById('a2k-modal-btn').innerText = texts[lang].btn;

            setTimeout(function() {
                let pageText = document.body.innerText || document.body.textContent;
                let orderNumber = "";
                
                // Ищем "Замовлення" ИЛИ "Заказ", затем цифры
                let match = pageText.match(/(Замовлення|Заказ)[\s\u00A0№:]*(\d{4,8})/i);
                
                if (match && match[2]) {
                    orderNumber = match[2]; 
                }

                if (orderNumber) {
                    let orderElement = document.getElementById('a2k-dynamic-order');
                    orderElement.innerText = texts[lang].orderPref + orderNumber;
                    orderElement.style.display = "block"; 
                }

                document.getElementById('a2k-modal-overlay').style.display = 'flex';
            }, 2000); 
        }
    })();

// === script #2 (length=4780) ===
document.addEventListener("DOMContentLoaded", function() {
    // Очищаем старые интервалы, чтобы исключить наложение времени
    if (window.myPromoTimerInterval) clearInterval(window.myPromoTimerInterval);

    function initPromoTimer() {
        // Умный поиск: ищем сразу и десктопный ряд, и мобильный блок.
        // Берем только уникальные классы, чтобы не задеть "Купить в 1 клик"
        let targetElements = document.querySelectorAll('.product-order__row, .product-card__order--normal');

        if (targetElements.length === 0) return false;

        const lang = document.documentElement.lang || 'uk';
        const isRussian = lang === 'ru' || window.location.pathname.indexOf('/ru/') !== -1;
        const textPrefix = isRussian ? 'До конца акции осталось' : 'До кінця акції залишилось';

        targetElements.forEach(function(targetElement) {
            // Проверяем, нет ли уже таймера ВНУТРИ этого блока (защита от дублей)
            if (targetElement.querySelector('.custom-promo-timer')) return;

            const timerContainer = document.createElement('div');
            timerContainer.className = 'custom-promo-timer'; 
            
            // Настройки стилей: 
            // flex-basis: 100% и order: -10 заставляют таймер занять всю ширину 
            // и встать в самом начале контейнера (над счетчиком и кнопкой)
            timerContainer.style.cssText = 'width: 100%; flex-basis: 100%; order: -10; margin-bottom: 15px; display: block; clear: both;';
            
            // Вставляем ВНУТРЬ найденного блока в самое начало
            targetElement.prepend(timerContainer);
            
            // Если родительский блок это Flexbox, разрешаем ему переносить таймер на отдельную строку
            if (window.getComputedStyle(targetElement).display === 'flex') {
                targetElement.style.flexWrap = 'wrap';
            }
        });

        function updateTime() {
            const timers = document.querySelectorAll('.custom-promo-timer');
            if (timers.length === 0) return;

            const now = new Date();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            let diff = endOfDay - now;
            
            if (diff < 0) diff = 0;

            const textH = isRussian ? "ч." : "год.";
            const textM = isRussian ? "мин." : "хв.";

            // Вычисляем часы, минуты и секунды
            let h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
            let m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
            let s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');

            const digitStyle = "background: linear-gradient(to bottom, #3b3b3b 50%, #222222 50%); color: #ffffff; padding: 6px 10px; border-radius: 6px; font-family: monospace; font-size: 30px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3); line-height: 1.1; display: inline-block;";
            const labelStyle = "font-size: 14px; font-weight: 600; color: #666;";
            
            // HTML-структура таймера (секунды добавлены, текст "сек" убран)
            let htmlContent = `
                <div style="font-size: 13px; margin-bottom: 8px; color: #d32f2f; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${textPrefix}
                </div>
                <div style="display: flex; gap: 15px; align-items: baseline;">
                    <div style="display: flex; align-items: baseline; gap: 6px;">
                        <span style="${digitStyle}">${h}</span>
                        <span style="${labelStyle}">${textH}</span>
                    </div>
                    <div style="display: flex; align-items: baseline; gap: 6px;">
                        <span style="${digitStyle}">${m}</span>
                        <span style="${labelStyle}">${textM}</span>
                    </div>
                    <div style="display: flex; align-items: baseline; gap: 6px;">
                        <span style="${digitStyle}">${s}</span>
                    </div>
                </div>
            `;

            timers.forEach(function(timer) {
                timer.innerHTML = htmlContent;
            });
        }

        updateTime(); 
        window.myPromoTimerInterval = setInterval(updateTime, 1000); 
        
        return true; 
    }

    // Проверяем наличие нужного блока при загрузке
    let attempts = 0;
    const checkInterval = setInterval(function() {
        if (initPromoTimer() || attempts >= 10) {
            clearInterval(checkInterval); 
        }
        attempts++;
    }, 500);
});

// === script #3 (length=4781) ===
document.addEventListener("DOMContentLoaded", function() {
    function initSocialProof() {
        let targetElements = [];
        
        // 1. Ищем цены на мобилке
        const mobilePrices = document.querySelectorAll('.product-card__price');
        mobilePrices.forEach(function(el) {
            // Чтобы выйти ИЗ белого блока, берем "родителя родителя"
            let mainContainer = el.closest('.product-card__info, .product-card__box, .product-card__main');
            
            // Если по классу не нашло, жестко поднимаемся на 2 уровня вверх
            if (!mainContainer && el.parentNode && el.parentNode.parentNode) {
                mainContainer = el.parentNode.parentNode; 
            }
            
            if (mainContainer && !targetElements.some(t => t.el === mainContainer)) {
                targetElements.push({ el: mainContainer, isMobile: true });
            }
        });

        // 2. Ищем контейнеры цен на десктопе (оставляем как было, там всё работало отлично)
        const desktopPrices = document.querySelectorAll('.product-prices, .product-price, .price-wrapper');
        desktopPrices.forEach(function(el) {
            // Проверяем, чтобы не добавить один и тот же блок дважды
            if (!targetElements.some(t => t.el === el || t.el.contains(el))) {
                targetElements.push({ el: el, isMobile: false });
            }
        });

        if (targetElements.length === 0) return false;

        const productId = window.location.pathname; 
        const storageKey = 'socialProof_' + productId;
        let stats = JSON.parse(localStorage.getItem(storageKey));

        if (!stats) {
            stats = {
                views: Math.floor(Math.random() * 34) + 2, 
                buys: Math.floor(Math.random() * 34) + 2   
            };
            localStorage.setItem(storageKey, JSON.stringify(stats));
        }

        const lang = document.documentElement.lang || 'uk';
        const isRussian = lang === 'ru' || window.location.pathname.indexOf('/ru/') !== -1;

        function declension(num, words) {
            const cases = [2, 0, 1, 1, 1, 2];
            return words[(num % 100 > 4 && num % 100 < 20) ? 2 : cases[(num % 10 < 5) ? Math.abs(num % 10) : 5]];
        }

        const viewsWord = isRussian 
            ? declension(stats.views, ['человек', 'человека', 'человек']) 
            : declension(stats.views, ['людина', 'людини', 'людей']);
            
        const buysWord = isRussian 
            ? declension(stats.buys, ['раз', 'раза', 'раз']) 
            : declension(stats.buys, ['раз', 'рази', 'разів']);

        const viewsStr = isRussian 
            ? `Этот товар сейчас смотрят <b>${stats.views} ${viewsWord}</b>` 
            : `Цей товар зараз дивляться <b>${stats.views} ${viewsWord}</b>`;
            
        const buysStr = isRussian 
            ? `Купили <b>${stats.buys} ${buysWord}</b> за эту неделю` 
            : `Купили <b>${stats.buys} ${buysWord}</b> за цей тиждень`;

        targetElements.forEach(function(target) {
            const targetElement = target.el;
            if (targetElement.parentNode.querySelector('.custom-social-proof')) return;

            const widget = document.createElement('div');
            widget.className = 'custom-social-proof';
            
            // Если мобилка — 100% ширина, если десктоп — по размеру текста
            const widgetWidth = target.isMobile ? '100%' : 'fit-content';
            
            widget.style.cssText = `background: #fdfdfd; border: 1px solid #eaeaea; border-radius: 8px; padding: 12px 25px 12px 14px; margin-bottom: 12px; font-size: 13px; color: #444; line-height: 1.45; display: block; width: ${widgetWidth}; box-sizing: border-box; clear: both; box-shadow: 0 1px 2px rgba(0,0,0,0.02);`;

            widget.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 16px; margin-right: 8px;">🔥</span>
                    <span>${viewsStr}</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 16px; margin-right: 8px;">🛒</span>
                    <span>${buysStr}</span>
                </div>
            `;

            // Вставляем НАД всем найденным белым блоком
            targetElement.parentNode.insertBefore(widget, targetElement);
        });

        return true;
    }

    let attempts = 0;
    const checkInterval = setInterval(function() {
        if (initSocialProof() || attempts >= 10) {
            clearInterval(checkInterval); 
        }
        attempts++;
    }, 500);
});

// === script #4 (length=4084) ===
document.addEventListener("DOMContentLoaded", function() {
    if (window.trustBadgesInterval) clearInterval(window.trustBadgesInterval);

    function initTrustBadges() {
        let targetElements = document.querySelectorAll('.product-order__row, .product-card__order--normal');

        if (targetElements.length === 0) return false;

        const lang = document.documentElement.lang || 'uk';
        const isRussian = lang === 'ru' || window.location.pathname.indexOf('/ru/') !== -1;

        const guaranteeText = isRussian ? 'Гарантия 14 дней' : 'Гарантія 14 днів';
        const paymentText = isRussian ? 'Безопасная оплата' : 'Безпечна оплата';

        targetElements.forEach(function(targetElement) {
            if (targetElement.parentNode.querySelector('.custom-trust-badges')) return;

            const badgeContainer = document.createElement('div');
            badgeContainer.className = 'custom-trust-badges';
            
            badgeContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eaeaea; font-size: 13px; color: #666; width: 100%; clear: both;';

            badgeContainer.innerHTML = `
                <div class="trust-badge-delivery" style="display: flex; align-items: center; line-height: 1.4;">
                    <span style="font-size: 16px; margin-right: 8px; flex-shrink: 0;">🚚</span>
                    <span class="delivery-text">Загрузка...</span>
                </div>
                <div style="display: flex; align-items: center; line-height: 1.4;">
                    <span style="font-size: 16px; margin-right: 8px; flex-shrink: 0;">🛡️</span>
                    <span>${guaranteeText}</span>
                </div>
                <div style="display: flex; align-items: center; line-height: 1.4;">
                    <span style="font-size: 16px; margin-right: 8px; flex-shrink: 0;">💳</span>
                    <span>${paymentText}</span>
                </div>
            `;

            targetElement.parentNode.insertBefore(badgeContainer, targetElement.nextSibling);
        });

        function updateDeliveryTime() {
            const deliveryTexts = document.querySelectorAll('.custom-trust-badges .delivery-text');
            if (deliveryTexts.length === 0) return;

            const now = new Date();
            const dayOfWeek = now.getDay(); // 0 - Вс, 1 - Пн, ..., 6 - Сб
            const currentHour = now.getHours();

            let deliveryMessage = "";

            // Если воскресенье ИЛИ время 13:00 и позже (в любой другой день)
            if (dayOfWeek === 0 || currentHour >= 13) {
                deliveryMessage = isRussian ? '<b>Быстрая отправка</b>' : '<b>Швидка відправка</b>';
            } else {
                // Пн-Сб ДО 13:00 - Показываем мотивирующий таймер
                const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0);
                const diff = targetTime - now;

                let h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                let m = Math.floor((diff / 1000 / 60) % 60);

                const textH = isRussian ? "ч." : "год.";
                const textM = isRussian ? "мин." : "хв.";

                if (isRussian) {
                    deliveryMessage = `Отправим сегодня! Оформите в течение <b>${h} ${textH} ${m} ${textM}</b>`;
                } else {
                    deliveryMessage = `Відправимо сьогодні! Оформіть протягом <b>${h} ${textH} ${m} ${textM}</b>`;
                }
            }

            deliveryTexts.forEach(el => el.innerHTML = deliveryMessage);
        }

        updateDeliveryTime();
        window.trustBadgesInterval = setInterval(updateDeliveryTime, 60000);

        return true;
    }

    let attempts = 0;
    const checkInterval = setInterval(function() {
        if (initTrustBadges() || attempts >= 10) {
            clearInterval(checkInterval); 
        }
        attempts++;
    }, 500);
});

// === script #5 (length=1947) ===
document.addEventListener("DOMContentLoaded", function() {
    // Защита от дублирования стилей
    if (document.getElementById('custom-button-shine')) return;

    // Создаем блок стилей напрямую через скрипт
    const style = document.createElement('style');
    style.id = 'custom-button-shine';
    
    // Пишем железобетонный CSS
    style.innerHTML = `
        /* Захватываем все кнопки купить (и моб, и ПК) */
        .j-buy-button-add {
            position: relative !important;
            overflow: hidden !important;
            /* На всякий случай форсируем трансформацию для аппаратного ускорения */
            transform: translateZ(0) !important; 
        }

        /* Создаем блик, который летит поверх всего */
        .j-buy-button-add::after {
            content: "" !important;
            position: absolute !important;
            top: 0 !important;
            left: -150% !important; /* Начинаем далеко слева */
            width: 100% !important; /* Делаем луч широким */
            height: 100% !important;
            /* Градиент: прозрачный -> яркий белый -> прозрачный */
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%) !important;
            transform: skewX(-25deg) !important; /* Наклон */
            animation: super-shine 4s infinite !important; /* 4 секунды на весь цикл */
            z-index: 999 !important; /* Выше текста и фона */
            pointer-events: none !important; /* "Призрачность" - пропускает клики сквозь себя */
        }

        /* Сама анимация */
        @keyframes super-shine {
            0% { left: -150%; }
            20% { left: 150%; } /* За 20% времени (0.8 сек) пролетает кнопку */
            100% { left: 150%; } /* Остальное время ждет */
        }
    `;
    
    // Внедряем стиль прямо в "голову" сайта
    document.head.appendChild(style);
});
