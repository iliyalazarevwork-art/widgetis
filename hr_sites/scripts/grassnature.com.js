// source: https://grassnature.com/
// extracted: 2026-05-07T21:19:21.517Z
// scripts: 2

// === script #1 (length=3627) ===
(function() {
    // Додали lastSavings для захисту від блимання
    var mem = { w: null, p: null, lastSavings: -1 };

    function cleanPrice(txt) {
        if (!txt) return null;
        return parseFloat(txt.replace(/[^0-9.,]/g, '').replace(',', '.')) || null;
    }

    function getPrice() {
        var el = document.querySelector('.product-price__item') || document.querySelector('.product-card__price');
        if (!el) return null;
        
        var meta = el.querySelector('meta[itemprop="price"]');
        if (meta && meta.content) return parseFloat(meta.content);
        
        return cleanPrice(el.innerText);
    }

    function getWeight() {
        // Шукаємо кнопку фасування (ПК і Моб)
        var btn = document.querySelector('.modification__button--active');
        var txt = "";
        
        if (btn) {
            txt = btn.innerText || btn.textContent;
        } else {
            // Резерв для мобільних версій Хорошопу, якщо фасування згорнуто в список
            var select = document.querySelector('select[name^="param"]');
            if (select && select.selectedIndex >= 0) {
                txt = select.options[select.selectedIndex].text;
            }
        }
        
        var match = txt.match(/(\d+(?:[.,]\d+)?)\s*(кг|kg)/i);
        return match ? parseFloat(match[1].replace(',', '.')) : null;
    }

    function renderWidget() {
        var currentW = getWeight();
        var currentP = getPrice();

        if (!currentW || !currentP) return;

        // Фіксуємо базову вартість
        if (mem.w === null || currentW < mem.w) {
            mem.w = currentW;
            mem.p = currentP;
        }

        var expectedPrice = (mem.p / mem.w) * currentW;
        var savings = expectedPrice - currentP;
        var roundedSavings = Math.round(savings);

        var existing = document.getElementById('fs-savings-badge');

        if (savings > 1 && currentW > mem.w) {
            // SMART DIFFING: Якщо сума та сама і блок уже є — зупиняємось (немає блимання!)
            if (existing && mem.lastSavings === roundedSavings) return;
            mem.lastSavings = roundedSavings;

            var html = 
                '<div id="fs-savings-badge">' +
                    '<div class="fs-sav-icon">🎁</div>' +
                    '<div class="fs-sav-text">Ви економите <span class="fs-sav-val">' + roundedSavings + '</span> грн!</div>' +
                '</div>';

            if (existing) {
                existing.outerHTML = html;
            } else {
                // Надійні якорі для вставки
                var target = document.querySelector('.product-price__box') || 
                             document.querySelector('.product-card__price-box') || 
                             document.querySelector('.product-card__price');
                if (target) {
                    target.insertAdjacentHTML('afterend', html);
                }
            }
        } else {
            if (existing) existing.remove();
            mem.lastSavings = -1; // Скидаємо пам'ять
        }
    }

    var timeoutId;
    var observer = new MutationObserver(function(mutations) {
        clearTimeout(timeoutId);
        // Зменшив затримку для швидкості відгуку
        timeoutId = setTimeout(renderWidget, 150); 
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    
    // Подвійний старт для надійності при повільному інтернеті
    setTimeout(renderWidget, 500);
    setTimeout(renderWidget, 1500);
})();

// === script #2 (length=4154) ===
(function() {
    var LICENSE_DOMAIN = 'grassnature.com'; 

    var _0xSecret = "Z3Jhc3NuYXR1cmUuY29t";

    try {
        if (window.location.hostname.indexOf(atob(_0xSecret)) === -1) return;
    } catch(e) { return; }

    var _APP_DATA = {
        assets: {
            np: 'https://grassnature.com/content/uploads/images/np.png',
            ukr: 'https://grassnature.com/content/uploads/images/ukr.png',
            main: 'https://grassnature.com/content/uploads/images/delv.png'
        },
        tiers: [
            { title: 'Відділення<br>Укрпошти', price: 2999, type: 'ukr' },
            { title: 'Відділення/поштомат<br>Нової пошти', price: 4999, type: 'np' },
            { title: 'Кур\'єром<br>Нової пошти', price: 7000, type: 'np' }
        ]
    };

    var CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    var _mem = -1;

    function _p(s) {
        if (!s) return 0;
        return parseFloat(s.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    }

    function _core() {
        var el = document.querySelector('.cart-summary') || 
                 document.querySelector('.cart__summary') || 
                 document.querySelector('.cart-total-price');
        
        if (!el) return;
        var txt = el.innerText || "";
        if (!/[0-9]/.test(txt)) return;

        var sum = _p(txt);

        if (sum === _mem && document.getElementById('fs-widget-root')) return; 
        _mem = sum;

        var _tiers = (window.location.hostname.indexOf(atob(_0xSecret)) > -1) ? _APP_DATA.tiers : [];
        var html = '';
        var nxt = null;

        for (var i = 0; i < _tiers.length; i++) {
            var t = _tiers[i];
            var l = t.price;
            var pct = (sum / l) * 100;
            if (pct > 100) pct = 100;

            if (sum < l && !nxt) nxt = t;

            var done = pct >= 100;
            var ico = _APP_DATA.assets[t.type];
            
            var lbl = done 
                ? '<span style="font-weight:600; color:#9ca3af;">' + l + ' грн</span>'
                : sum + ' грн / ' + l + ' грн';

            html += 
                '<div class="fs-col ' + (done ? 'ok' : '') + '">' +
                    '<div class="fs-top">' +
                        '<div class="fs-ico"><img src="' + ico + '"></div>' +
                        '<div class="fs-tit">' + t.title + '</div>' +
                        '<div class="fs-chk">' + CHECK_SVG + '</div>' +
                    '</div>' +
                    '<div class="fs-inf">' + lbl + '</div>' +
                    '<div class="fs-bg"><div class="fs-fill" style="width:' + pct + '%;"></div></div>' +
                '</div>';
        }

        if (!html) return;

        var head = nxt 
            ? 'До безкоштовної доставки <b>на ' + nxt.title.replace('<br>', ' ') + '</b> залишилось <span class="fs-hl">' + (nxt.price - sum) + ' грн</span>'
            : '🎉 Доставка будь-яким способом <span class="fs-hl">безкоштовна!</span>';

        var widget = 
            '<div id="fs-widget-root">' +
                '<div class="fs-head"><div class="fs-icon-main"><img src="' + _APP_DATA.assets.main + '"></div><div>' + head + '</div></div>' +
                '<div class="fs-grid">' + html + '</div>' +
            '</div>';

        var box = document.getElementById('fs-widget-root');
        if (box) {
            box.innerHTML = widget;
        } else {
            var dest = document.querySelector('.cart-buttons'); 
            if (!dest || !dest.offsetParent) dest = document.querySelector('.cart__order'); 
            if (!dest) dest = el; 

            if (dest) dest.insertAdjacentHTML('afterend', widget);
        }
    }

    var _raf;
    var _obs = new MutationObserver(function() {
        if (_raf) cancelAnimationFrame(_raf);
        _raf = requestAnimationFrame(_core);
    });

    _obs.observe(document.body, {
        childList: true, 
        subtree: true, 
        characterData: true 
    });

    requestAnimationFrame(_core);

})();
