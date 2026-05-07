// source: https://matrasroll.com.ua/
// extracted: 2026-05-07T21:18:55.459Z
// scripts: 2

// === script #1 (length=1476) ===
document.addEventListener('DOMContentLoaded', function() {
        function addStylesToElement(selector, styles) {
            const element = document.querySelector(selector);
            if (element) {
                Object.assign(element.style, styles);
            }
        }
let afterStyles;
if( window.innerWidth < 420) {
        afterStyles = {
            'background-image': 'url(https://matrasroll.com.ua/content/images/16/50x48l80nn0/89924771712434.webp)',
            'background-repeat': 'no-repeat',
            'background-position-x': '100%',
            'padding': '15px 0',
            'width': 'fit-content'
        };
} else {
        afterStyles = {
            'background-image': 'url(https://matrasroll.com.ua/content/images/16/50x48l80nn0/89924771712434.webp)',
            'background-repeat': 'no-repeat',
            'background-position-x': '100%',
            'padding': '15px 55px 15px 0',
            'width': 'fit-content'
        };
}

        const secondElement1 = document.querySelectorAll('#special_offers_40cd750bba9870f18aada2478b24840a .catalogTabs-nav-i')[0];
        if (secondElement1) {
            Object.assign(secondElement1.style, afterStyles);
        }

        const headingElement = document.querySelectorAll('#special_offers_40cd750bba9870f18aada2478b24840a .heading--l')[1];
        if (headingElement) {
            Object.assign(headingElement.style, afterStyles);
        }
    });

// === script #2 (length=846) ===
(function(d) {
d.querySelectorAll('.j-phone-item').forEach(function (el) {
el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
})
})(document);
(function(d, w, s) {
var widgetHash = 'ylf7y5yftopzeepnpghg', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
})(document, window, 'script');
const waitB = setInterval(() => {if (!!window.BinotelCallTracking) {
for (key in window.BinotelCallTracking) {
if(window.BinotelCallTracking[key]['initState']=="success"){
setTimeout(document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/\D/g, ''))),0)
clearInterval(waitB)}}}},1000)
