// source: https://hyundai-technics.com/
// extracted: 2026-05-07T21:20:25.236Z
// scripts: 1

// === script #1 (length=534) ===
if (location.pathname.indexOf('/ru') === 0) {
    window.BinotelGetCallSettings = {
        language: 'ru'
    };
} else {
    window.BinotelGetCallSettings = {
        language: 'ua'
    };
}

(function(d, w, s) {
    var widgetHash = 'iwyx4dpkieyhhuvu1sfi', gcw = d.createElement(s); gcw.type = 'text/javascript'; gcw.async = true;
    gcw.src = '//widgets.binotel.com/getcall/widgets/'+ widgetHash +'.js';
    var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(gcw, sn);
})(document, window, 'script');
