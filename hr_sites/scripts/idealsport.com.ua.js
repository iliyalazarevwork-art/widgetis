// source: https://idealsport.com.ua/
// extracted: 2026-05-07T21:19:03.093Z
// scripts: 2

// === script #1 (length=886) ===
(function(){

var catalogMenu = $('.header__bottom')[0];
var catalogMenuSourceTop = catalogMenu.getBoundingClientRect().top + window.pageYOffset;

window.onscroll = function() {

    if (catalogMenu.classList.contains('fixed') && window.pageYOffset < catalogMenuSourceTop) {
        catalogMenu.classList.remove('fixed');
    } else if (window.pageYOffset > catalogMenuSourceTop) {
        catalogMenu.classList.add('fixed');
    }
};

var catalogMenu = $('.header__bottom')[0];
var catalogMenuSourceTop = catalogMenu.getBoundingClientRect().top + window.pageYOffset;

window.onscroll = function() {

    if (catalogMenu.classList.contains('fixed') && window.pageYOffset < catalogMenuSourceTop) {
        catalogMenu.classList.remove('fixed');
    } else if (window.pageYOffset > catalogMenuSourceTop) {
        catalogMenu.classList.add('fixed');
    }
};
})()

// === script #2 (length=559) ===
(function(d) {
        d.querySelectorAll('.j-phone-item').forEach(function (el) {
            el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
        })
    })(document);
    (function(d, w, s) {
        var widgetHash = 're064gu05fo099da0s1o', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
        ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
        var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
      })(document, window, 'script');
