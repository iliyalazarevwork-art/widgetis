// source: https://vr-store.com.ua/
// extracted: 2026-05-07T21:19:24.657Z
// scripts: 1

// === script #1 (length=783) ===
(function(d) {
        d.querySelectorAll('.j-phone-item').forEach(function (el) {
            el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
        })
    })(document);
    (function(d, w, s) {
        var widgetHash = 'k6hp9z4b8qvettcl5r77', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
        ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
        var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
      })(document, window, 'script');

setTimeout(() => {
    if (!!window.BinotelCallTracking) {
          document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/\D/g, '')));
    }
}, 1000);
