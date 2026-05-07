// source: https://gstore.ua/
// extracted: 2026-05-07T21:19:37.046Z
// scripts: 3

// === script #1 (length=602) ===
(()=>{
var langText = (() => {
        let lang = document.documentElement.lang;
            switch (lang) {
                case 'ru' : return 'Бесплатно по Украине';
                case 'uk' : return 'Безкоштовно по Україні';
                default : return 'Free in Ukraine';
            }
    })();

console

var timetable = document.querySelector('.header__middle').querySelector('.timetable__text').cloneNode(true);

document.querySelector('.header__middle').querySelector('.phones__dropdown').append(timetable);
document.querySelector('#freeCall').innerText = langText ;

})()

// === script #2 (length=654) ===
var _protocol="https:"==document.location.protocol?"https://":"http://";
    _site_hash_code = "81698ed359853bc06d5efc47a25ba9c2",_suid=57793, plerdyScript=document.createElement("script");
    plerdyScript.setAttribute("defer",""),plerdyScript.dataset.plerdymainscript="plerdymainscript",
    plerdyScript.src="https://a.plerdy.com/public/js/click/main.js?v="+Math.random();
    var plerdymainscript=document.querySelector("[data-plerdymainscript='plerdymainscript']");
    plerdymainscript&&plerdymainscript.parentNode.removeChild(plerdymainscript);
    try{document.head.appendChild(plerdyScript)}catch(t){console.log(t,"unable add script tag")}

// === script #3 (length=559) ===
(function(d) {
        d.querySelectorAll('.j-phone-item').forEach(function (el) {
            el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
        })
    })(document);
    (function(d, w, s) {
        var widgetHash = 'pdddupuvo68f0kijahwr', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
        ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
        var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
      })(document, window, 'script');
