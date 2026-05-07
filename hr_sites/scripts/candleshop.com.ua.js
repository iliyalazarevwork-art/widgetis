// source: https://candleshop.com.ua/
// extracted: 2026-05-07T21:20:29.058Z
// scripts: 2

// === script #1 (length=6933) ===
document.addEventListener('DOMContentLoaded', function () {
    let previousContent = {};
    let observers = [];

    function getLanguage() {
        const localeMeta = document.querySelector('meta[property="og:locale"]');
        if (localeMeta) {
            const locale = localeMeta.getAttribute('content') || 'ua_UA';
            return locale.split('_')[0];
        }
        return 'ua';
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

    // ═══════════════════════════════════════════
    //  ПОРОГИ ДОСТАВКИ
    // ═══════════════════════════════════════════
    const DELIVERY_THRESHOLDS = [
        { label: 'Rozetka Delivery', amount: 1000 },
        { label: 'Нова Пошта',       amount: 2500 }
    ];
    const MAX_THRESHOLD = DELIVERY_THRESHOLDS[DELIVERY_THRESHOLDS.length - 1].amount;

    function createBlockStrip(priceCurrent, container) {
        let existing = container.querySelector('.blockStrip');
        if (existing) existing.remove();

        const lang = getLanguage();

        const nextThreshold = DELIVERY_THRESHOLDS.find(t => priceCurrent < t.amount);
        const allReached = !nextThreshold;

        const headerText = allReached
            ? (lang === 'ru' ? 'Бесплатная доставка' : 'Безкоштовна доставка')
            : (lang === 'ru'
                ? 'До бесплатной доставки осталось:'
                : 'До безкоштовної доставки залишилось:');

        const blockStrip = document.createElement('div');
        blockStrip.className = 'blockStrip';

        // Заголовок
        const top = document.createElement('div');
        top.className = 'blockStripTop';

        const topLeft = document.createElement('div');
        topLeft.className = 'blockStripTopLeft';

        const logo = document.createElement('img');
        logo.src = '/content/uploads/images/shop1.png';
        logo.className = 'lockStripTopLeftLogo';
        topLeft.appendChild(logo);

        const text = document.createElement('p');
        text.className = 'blockStripTopLeftText';
        text.textContent = headerText;
        topLeft.appendChild(text);

        top.appendChild(topLeft);
        blockStrip.appendChild(top);

        // Прогрес-бар
        const barWrap = document.createElement('div');
        barWrap.className = 'blockStripBottomStrip';
        barWrap.style.cssText = 'position:relative; background:#e0e0e0; border-radius:4px; height:8px; margin:8px 0 4px;';

        const barFill = document.createElement('span');
        barFill.className = 'blockStripBottomStripSpan';
        const pct = Math.min((priceCurrent / MAX_THRESHOLD) * 100, 100);
        barFill.style.cssText = 'display:block; height:100%; border-radius:4px; background:#7bc67e; width:' + pct + '%; transition:width 0.4s;';
        barWrap.appendChild(barFill);

        // Маркеры
        DELIVERY_THRESHOLDS.forEach(function (t) {
            const marker = document.createElement('span');
            const markerPct = (t.amount / MAX_THRESHOLD) * 100;
            marker.style.cssText = 'position:absolute; top:-3px; width:2px; height:14px; background:#bbb; left:' + markerPct + '%;';
            barWrap.appendChild(marker);
        });

        blockStrip.appendChild(barWrap);

        // Подписи
        const labels = document.createElement('div');
        labels.style.cssText = 'display:flex; justify-content:space-around; font-size:12px; color:#666; margin-top:4px;';

        DELIVERY_THRESHOLDS.forEach(function (t) {
            const lbl = document.createElement('div');
            lbl.style.cssText = 'text-align:center;';
            const reached = priceCurrent >= t.amount;
            lbl.innerHTML = '<b style="color:' + (reached ? '#4caf50' : '#333') + '">' + t.amount + ' грн</b><br>' + t.label;
            labels.appendChild(lbl);
        });

        blockStrip.appendChild(labels);

        // Сообщение
        if (!allReached && nextThreshold) {
            const remaining = nextThreshold.amount - priceCurrent;
            const msg = document.createElement('p');
            msg.style.cssText = 'font-size:13px; color:#555; margin-top:6px;';
            msg.textContent = lang === 'ru'
                ? 'Добавьте ещё ' + remaining.toFixed(2) + ' грн для бесплатной доставки ' + nextThreshold.label
                : 'Додайте ще ' + remaining.toFixed(2) + ' грн для безкоштовної доставки ' + nextThreshold.label;
            blockStrip.appendChild(msg);
        }

        container.appendChild(blockStrip);
    }

    function logContent(targetElement, selector) {
        if (targetElement) {
            const currentContent = targetElement.textContent.trim();
            if (currentContent !== previousContent[selector]) {
                previousContent[selector] = currentContent;
                let priceCurrent = parseNumber(currentContent);

                let blockBascket;
                if (selector === '.cart-footer-b') {
                    const cartBlockPc = targetElement.closest('#cart');
                    if (cartBlockPc) blockBascket = cartBlockPc.querySelector('.cart-content');
                }

                let blockBascketMob;
                if (selector === '.cart__total-price') {
                    const cartBlock = targetElement.closest('.cart__container');
                    if (cartBlock) blockBascketMob = cartBlock.querySelector('.cart__order');
                }

                if (blockBascket && priceCurrent >= 0) createBlockStrip(priceCurrent, blockBascket);
                if (blockBascketMob && priceCurrent >= 0) createBlockStrip(priceCurrent, blockBascketMob);
            }
        }
    }

    const debouncedLogContent = debounce(function (targetElement, selector) {
        logContent(targetElement, selector);
    }, 1000);

    function observeChanges() {
        observers.forEach(function (o) { o.disconnect(); });
        observers = [];

        ['.cart-footer-b', '.cart__total-price'].forEach(function (selector) {
            const el = document.querySelector(selector);
            if (el) {
                const obs = new MutationObserver(function () { debouncedLogContent(el, selector); });
                observers.push(obs);
                obs.observe(el, { characterData: true, subtree: true, childList: true });
                debouncedLogContent(el, selector);
            }
        });
    }

    observeChanges();

    new MutationObserver(function () { observeChanges(); })
        .observe(document.body, { childList: true, subtree: true });
});

// === script #2 (length=13661) ===
document.addEventListener('DOMContentLoaded', function () {
    if (!window.location.pathname.includes('/checkout')) return;

    // Визначаємо мову один раз
    var isRu = window.location.pathname.startsWith('/ru');

    // ═══════════════════════════════════════════
    //  СВОРАЧИВАНИЕ ПОЛЯ КОММЕНТАРИЯ
    // ═══════════════════════════════════════════
    function initCollapseComment() {
        const commentField = document.querySelector('textarea[name="Recipient[comment]"]');
        if (!commentField || document.getElementById('comment-toggle-link')) return;

        const wrapper = commentField.closest('dd') || commentField.closest('li') || commentField.parentElement;
        if (!wrapper) return;

        // Ховаємо нативний лейбл "Коментар"
        var nativeDt = wrapper.previousElementSibling;
        if (nativeDt && (nativeDt.tagName === 'DT' || nativeDt.tagName === 'LABEL')) {
            nativeDt.style.display = 'none';
        }
        var prev = wrapper.previousElementSibling;
        if (prev && /коментар|комментар/i.test(prev.textContent.trim())) {
            prev.style.display = 'none';
        }
        var innerLabel = wrapper.querySelector('label');
        if (innerLabel && /коментар|комментар/i.test(innerLabel.textContent.trim())) {
            innerLabel.style.display = 'none';
        }

        // Ховаємо нативне посилання Хорошопа "Додати коментар до замовлення"
        document.querySelectorAll('a, span, div').forEach(function (el) {
            if (/додати коментар|добавить комментарий/i.test(el.textContent.trim())) {
                el.style.display = 'none';
            }
        });

        commentField.style.display = 'none';

        // Знімаємо ранній CSS — тепер JS керує видимістю
        var early = document.getElementById('comment-early-hide');
        if (early) early.remove();

        const link = document.createElement('a');
        link.id = 'comment-toggle-link';
        link.href = '#';
        link.textContent = isRu ? 'Оставить комментарий' : 'Залишити коментар';
        link.style.cssText = 'font-size:14px; color:#7E7062; cursor:pointer; text-decoration:underline; display:inline-block;';

        link.addEventListener('click', function (e) {
            e.preventDefault();
            var isHidden = commentField.style.display === 'none';
            commentField.style.display = isHidden ? 'block' : 'none';
            link.textContent = isHidden
                ? (isRu ? 'Скрыть комментарий' : 'Приховати коментар')
                : (isRu ? 'Оставить комментарий' : 'Залишити коментар');
        });

        wrapper.insertBefore(link, commentField);
    }

    // ═══════════════════════════════════════════
    //  ЛОГІКА ІНШОГО ОТРИМУВАЧА
    // ═══════════════════════════════════════════
    function setupRecipientLogic(checkbox, block, nameInput, phoneInput, commentField) {
        var timer = null;

        function updateComment() {
            if (!commentField) return;
            var base = commentField.value.split('--- Інший отримувач ---')[0].trim();
            if (checkbox.checked && (nameInput.value || phoneInput.value)) {
                commentField.value = base + '\n\n--- Інший отримувач ---\nПІБ: ' + nameInput.value + '\nТелефон: ' + phoneInput.value;
            } else {
                commentField.value = base;
            }
        }

        function updateCommentDebounced() {
            clearTimeout(timer);
            timer = setTimeout(updateComment, 300);
        }

        // Маска + оновлення коментаря — один blur
        phoneInput.addEventListener('blur', function () {
            var x = phoneInput.value.replace(/\D/g, '');
            if (x.indexOf('38') !== 0) x = '38' + x;
            x = x.substring(0, 12);
            var formatted = '+38';
            if (x.length > 2)  formatted += ' (' + x.substring(2, 5);
            if (x.length >= 5) formatted += ') ' + x.substring(5, 8);
            if (x.length >= 8) formatted += '-' + x.substring(8, 10);
            if (x.length >= 10) formatted += '-' + x.substring(10, 12);
            phoneInput.value = formatted;
            updateCommentDebounced();
        });

        checkbox.addEventListener('change', function () {
            block.style.display = checkbox.checked ? 'block' : 'none';
            updateCommentDebounced();
        });

        nameInput.addEventListener('input', updateCommentDebounced);
        phoneInput.addEventListener('input', updateCommentDebounced);
    }

    // ═══════════════════════════════════════════
    //  ІНШИЙ ОТРИМУВАЧ
    // ═══════════════════════════════════════════
    function initOtherRecipient() {
        const phoneField = document.querySelector('input[name="Recipient[delivery_phone]"]');
        if (!phoneField || document.getElementById('otherRecipientToggle')) return;

        const dd = phoneField.closest('dd');
        const dl = dd ? dd.closest('dl') : null;
        const isMobile = !dd || !dl;
        const commentField = document.querySelector('textarea[name="Recipient[comment]"]');

        if (isMobile) {
            // Вставляємо після "Не телефонувати" — щоб порядок був як на десктопі
            var doNotCallLabel = Array.from(document.querySelectorAll('label')).find(function (l) {
                return l.textContent.indexOf('Не телефонувати для підтвердження') !== -1 ||
                       l.textContent.indexOf('Не звонить для подтверждения') !== -1;
            });
            var anchor = doNotCallLabel ? doNotCallLabel.parentElement : document.querySelector('.viber-telegram-hint');
            if (!anchor) {
                setTimeout(function () {
                    if (!document.getElementById('otherRecipientToggle')) initOtherRecipient();
                }, 200);
                return;
            }

            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'margin:10px 0 4px;';

            const labelRow = document.createElement('label');
            labelRow.style.cssText = 'display:flex; align-items:center; gap:10px; cursor:pointer; user-select:none;';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = 'otherRecipientToggle';
            cb.style.cssText = 'position:absolute; opacity:0; width:0; height:0; pointer-events:none;';

            const fakeBox = document.createElement('span');
            fakeBox.style.cssText = 'display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; min-width:24px; border:1px solid #ccc; border-radius:6px; background:#fff; box-sizing:border-box; transition: border-color 0.2s, background 0.2s;';

            const checkIcon = document.createElement('span');
            checkIcon.style.cssText = 'display:none; width:5px; height:10px; border:2px solid #fff; border-top:none; border-left:none; transform:rotate(45deg) translate(-1px,-1px);';
            fakeBox.appendChild(checkIcon);

            cb.addEventListener('change', function () {
                fakeBox.style.background   = cb.checked ? '#7E7062' : '#fff';
                fakeBox.style.borderColor  = cb.checked ? '#7E7062' : '#ccc';
                checkIcon.style.display    = cb.checked ? 'block'   : 'none';
            });

            const cbLabel = document.createElement('span');
            cbLabel.textContent = isRu ? 'Указать другого получателя' : 'Вказати іншого отримувача';
            cbLabel.style.cssText = 'font-size:14px; color:#333;';

            labelRow.appendChild(cb);
            labelRow.appendChild(fakeBox);
            labelRow.appendChild(cbLabel);

            const block = document.createElement('div');
            block.id = 'otherRecipientBlock';
            block.style.cssText = 'display:none; margin-top:12px;';

            const nameLabel = document.createElement('div');
            nameLabel.textContent = isRu ? 'ФИО получателя' : 'ПІБ отримувача';
            nameLabel.style.cssText = 'font-size:14px; color:#888; margin-bottom:6px;';
            const nameInp = document.createElement('input');
            nameInp.type = 'text'; nameInp.name = 'other_name';
            nameInp.placeholder = isRu ? 'ФИО получателя' : 'ПІБ отримувача';
            nameInp.style.cssText = 'width:100%; padding:12px 14px; border:1px solid #ddd; border-radius:8px; font-size:15px; box-sizing:border-box; background:#fff; margin-bottom:12px;';
            const phoneLabel = document.createElement('div');
            phoneLabel.textContent = isRu ? 'Телефон получателя' : 'Телефон отримувача';
            phoneLabel.style.cssText = 'font-size:14px; color:#888; margin-bottom:6px;';
            const phoneInp = document.createElement('input');
            phoneInp.type = 'tel'; phoneInp.name = 'other_phone';
            phoneInp.placeholder = '+38 (___) ___-__-__';
            phoneInp.value = '+38';
            phoneInp.style.cssText = 'width:100%; padding:12px 14px; border:1px solid #ddd; border-radius:8px; font-size:15px; box-sizing:border-box; background:#fff;';

            block.appendChild(nameLabel); block.appendChild(nameInp);
            block.appendChild(phoneLabel); block.appendChild(phoneInp);
            wrapper.appendChild(labelRow); wrapper.appendChild(block);
            anchor.insertAdjacentElement('afterend', wrapper);

            setupRecipientLogic(cb, block, nameInp, phoneInp, commentField);
            return;
        }

        // ── Десктоп (dl/dd) ──
        const dt = document.createElement('dt');
        dt.className = 'form-head';
        dt.textContent = 'Інший отримувач';
        dt.style.cssText = 'display:flex; align-items:center;';

        const newDd = document.createElement('dd');
        newDd.className = 'form-item';

        const label = document.createElement('label');
        label.style.cssText = 'display:flex; align-items:center; gap:8px; cursor:pointer; user-select:none;';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'otherRecipientToggle';
        checkbox.style.cssText = 'width:16px; height:16px; cursor:pointer; flex-shrink:0; accent-color:#7E7062;';

        const labelText = document.createElement('span');
        labelText.textContent = isRu ? 'Указать другого получателя' : 'Вказати іншого отримувача';
        labelText.style.cssText = 'font-size:14px;';

        // Десктопний dt
        dt.textContent = isRu ? 'Другой получатель' : 'Інший отримувач';

        label.appendChild(checkbox); label.appendChild(labelText);

        const block = document.createElement('div');
        block.id = 'otherRecipientBlock';
        block.style.cssText = 'display:none; margin-top:10px;';

        const nameInput = document.createElement('input');
        nameInput.type = 'text'; nameInput.name = 'other_name'; nameInput.className = 'field';
        nameInput.placeholder = isRu ? 'ФИО получателя' : 'ПІБ отримувача';
        nameInput.style.cssText = 'margin-bottom:8px; width:100%; box-sizing:border-box;';

        const phoneInput = document.createElement('input');
        phoneInput.type = 'text'; phoneInput.name = 'other_phone'; phoneInput.className = 'field';
        phoneInput.placeholder = '+38 (___) ___-__-__';
        phoneInput.value = '+38';
        phoneInput.style.cssText = 'width:100%; box-sizing:border-box;';

        block.appendChild(nameInput); block.appendChild(phoneInput);
        newDd.appendChild(label); newDd.appendChild(block);
        dd.parentNode.insertBefore(dt, dd.nextSibling);
        dt.after(newDd);

        setupRecipientLogic(checkbox, block, nameInput, phoneInput, commentField);
    }

    // ═══════════════════════════════════════════
    //  ПІДКАЗКА "VIBER / TELEGRAM"
    // ═══════════════════════════════════════════
    function addPhoneHint() {
        if (document.querySelector('.viber-telegram-hint')) return;
        const checkboxLabel = Array.from(document.querySelectorAll('label')).find(function (l) {
            return l.textContent.indexOf('Не телефонувати для підтвердження') !== -1 ||
                   l.textContent.indexOf('Не звонить для подтверждения') !== -1;
        });
        if (!checkboxLabel) return;
        const hint = document.createElement('div');
        hint.className = 'viber-telegram-hint';
        hint.style.cssText = 'color:#666; font-size:14px; margin:10px 0; display:block; width:100%; clear:both; line-height:1.4;';
        hint.textContent = isRu ? 'Ваш номер для связи в Viber / Telegram' : 'Ваш номер для зв\'язку у Viber / Telegram';
        var container = checkboxLabel.parentElement;
        container.parentElement.insertBefore(hint, container);
    }

    // ═══════════════════════════════════════════
    //  ЗАПУСК
    // ═══════════════════════════════════════════
    var isInitialized = false;

    function runAll() {
        if (isInitialized) return;
        isInitialized = true;
        addPhoneHint();
        initOtherRecipient();
    }

    var observer = new MutationObserver(function () {
        if (document.querySelector('input[name="Recipient[delivery_phone]"]')) {
            runAll();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    if (document.querySelector('input[name="Recipient[delivery_phone]"]')) {
        runAll();
    }

    setTimeout(runAll, 1500);
});
