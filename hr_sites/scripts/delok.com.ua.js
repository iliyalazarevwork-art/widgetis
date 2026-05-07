// source: https://delok.com.ua/
// extracted: 2026-05-07T21:19:52.735Z
// scripts: 1

// === script #1 (length=850) ===
(function(d) {
d.querySelectorAll('.j-phone-item').forEach(function (el) {
el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
})
})(document);
(function(d, w, s) {
var widgetHash = 'lnj6q6vcqw3hd1m8ni9z', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
})(document, window, 'script');
const waitB = setInterval(() => {if (!!window.BinotelCallTracking) {
for (let key in window.BinotelCallTracking) {
if(window.BinotelCallTracking[key]['initState']==="success"){
setTimeout(document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/D/g, ''))),0)
clearInterval(waitB)}}}},1000)
