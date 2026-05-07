// source: https://profplastic.com.ua/
// extracted: 2026-05-07T21:19:14.076Z
// scripts: 2

// === script #1 (length=988) ===
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Swiper
    const partnersSwiper = new Swiper('.partners-swiper', {
        loop: true,
        centeredSlides: true,
        initialSlide: 1,
        slidesPerView: 1, // По умолчанию 1 для мобилок
        spaceBetween: 20,
        
        // Автопрокрутка
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },

        // Навигация
        navigation: {
            nextEl: '.partners-arrow.next',
            prevEl: '.partners-arrow.prev',
        },

        // Адаптив под разные экраны
        breakpoints: {
            // Планшеты
            640: {
                slidesPerView: 2,
                centeredSlides: false
            },
            // Десктоп
            1025: {
                slidesPerView: 3,
                spaceBetween: 50,
                centeredSlides: true
            }
        }
    });
});

// === script #2 (length=846) ===
(function(d) {
d.querySelectorAll('.j-phone-item').forEach(function (el) {
el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
})
})(document);
(function(d, w, s) {
var widgetHash = 'demnd7c3aqacesauyzbm', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
})(document, window, 'script');
const waitB = setInterval(() => {if (!!window.BinotelCallTracking) {
for (key in window.BinotelCallTracking) {
if(window.BinotelCallTracking[key]['initState']=="success"){
setTimeout(document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/\D/g, ''))),0)
clearInterval(waitB)}}}},1000)
