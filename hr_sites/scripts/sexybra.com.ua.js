// source: https://sexybra.com.ua/
// extracted: 2026-05-07T21:19:00.997Z
// scripts: 3

// === script #1 (length=749) ===
(function() {
    function c(e) {
        var d = RegExp("[?&]" + e + "=([^&]*)").exec(window.location.search);
        return d && decodeURIComponent(d[1].replace(/\+/g, " "))
    }
    function a(f, g) {
        var e = new Date(new Date().getTime() + 1000 * 3600 * 24 * 30);
        var domain = window.location.hostname.replace(/^(www\.)?(.+)$/i, '$2');
        document.cookie = f + "=" + g + "; domain=."+domain+"; path=/; expires=" + e.toUTCString()
    }
    function b() {
        if (window.location.href) {
            var d = c("utm_source");
            var e = c("SAuid");
            if (d != null && d.length) a("utm_source", d);
            if (e != null && e.length) a("SAuid", e);
        }
    }
    b();
})();

// === script #2 (length=1620) ===
document.addEventListener("DOMContentLoaded", function() {
            function getCookie(name) {
                let matches = document.cookie.match(new RegExp(
                    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
                ));
                return matches ? decodeURIComponent(matches[1]) : undefined;
            }

            function extractNumber(str) {
                let numberString = str.replace(/\s/g, ''); 
                let matches = numberString.match(/\d+/);
                return matches ? matches[0] : null;
            }

            if (window.location.href.includes('/checkout/complete/')) {
                const utmSource = getCookie('utm_source');

                if (utmSource === 'sellaction.net') {
                    const sauid = getCookie('SAuid'); 
                    const orderElement = document.querySelector('.checkout-complete .h2');
                    const orderText = orderElement ? orderElement.textContent : '';
                    const orderId = extractNumber(orderText);

                    const sumElement = document.querySelector('.order-summary-b');
                    const sumText = sumElement ? sumElement.textContent : '';
                    const orderSum = extractNumber(sumText);

                    if (sauid && orderId && orderSum) {
                        const pixelUrl = `https://sellaction.net/reg.php?id=${sauid}-4673_${orderSum}&order_id=${orderId}`;
                        fetch(pixelUrl);
                    }
                }
            }
        });

// === script #3 (length=580) ===
(function(w,d){var hS=w.helpcrunchSettings;if(!hS||!hS.organization){return;}var widgetSrc='https://'+hS.organization+'.widget.helpcrunch.com/';w.HelpCrunch=function(){w.HelpCrunch.q.push(arguments)};w.HelpCrunch.q=[];function r(){if (d.querySelector('script[src="' + widgetSrc + '"')) { return; }var s=d.createElement('script');s.async=1;s.type='text/javascript';s.src=widgetSrc;(d.body||d.head).appendChild(s);}if(d.readyState === 'complete'||hS.loadImmediately){r();} else if(w.attachEvent){w.attachEvent('onload',r)}else{w.addEventListener('load',r,false)}})(window, document)
