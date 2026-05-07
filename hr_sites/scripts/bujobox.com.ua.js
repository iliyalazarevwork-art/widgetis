// source: https://bujobox.com.ua/
// extracted: 2026-05-07T21:19:03.534Z
// scripts: 1

// === script #1 (length=754) ===
!function(t, e, c, n) {
    var s = e.createElement(c);
    s.async = 1, 
    s.src = 'https://statics.esputnik.com/scripts/' + n + '.js';
    var r = e.scripts[0];
    r.parentNode.insertBefore(s, r);
    var f = function() {
        f.c(arguments);
    };
    f.q = [];
    f.c = function() {
        f.q.push(arguments);
    };
    t['eS'] = t['eS'] || f;
}(window, document, 'script', '51FA47717942414DAB25C5CD2901708A');

// Ініціалізація
eS('init', {
    TRACKING: false,
    RECOMS: true
});

if (document.querySelectorAll('.banners.banners--block.banners--gaps-none').length > 0) {
    eS('sendEvent', 'MainPage');
}
if (document.querySelectorAll('.error-page-container').length > 0) {
   eS('sendEvent', 'NotFound');
}
