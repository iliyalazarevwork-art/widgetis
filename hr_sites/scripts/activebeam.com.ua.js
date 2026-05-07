// source: https://activebeam.com.ua/
// extracted: 2026-05-07T21:20:39.842Z
// scripts: 1

// === script #1 (length=4216) ===
(function() {
    var LICENSE_DOMAIN = 'activebeam.com.ua'; 

    var _APP_DATA = {
        assets: {
            np: 'https://tealeaf.com.ua/content/uploads/images/np.png',
            ukr: 'https://tealeaf.com.ua/content/uploads/images/ukr.png',
            main: 'https://tealeaf.com.ua/content/uploads/images/del.png'
        },
        tiers: [
            { title: 'Відділення<br>Укрпошти', price: 1999, type: 'ukr' },
            { title: 'Відділення/поштомат<br>Нової пошти', price: 3999, type: 'np' },
            { title: 'Кур\'єром<br>Нової пошти', price: 6999, type: 'np' }
        ]
    };

    var CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    var _mem = -1;
    var _0xSecret = "YWN0aXZlYmVhbS5jb20udWE=";

    function _p(s) {
        if (!s) return 0;
        return parseFloat(s.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    }

    function _core() {
        try {
            if (window.location.hostname.indexOf(atob(_0xSecret)) === -1) return;
        } catch(e) { return; }

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
            var stateClass = done ? 'ok' : '';
            var ico = _APP_DATA.assets[t.type];
            
            var lbl = done 
                ? '<span style="font-weight:600; color:#9ca3af;">' + l + ' грн</span>'
                : sum + ' грн / ' + l + ' грн';

            html += 
                '<div class="fs-col ' + stateClass + '">' +
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
