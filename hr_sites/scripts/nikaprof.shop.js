// source: https://nikaprof.shop/
// extracted: 2026-05-07T21:19:10.964Z
// scripts: 2

// === script #1 (length=736) ===
if (window.location.pathname.indexOf('/ru') == 0) 
    {
(function(d, w, s) {
    var widgetHash = 'Mwyhbzpi3dET7HcywkJI', bch = d.createElement(s); bch.type = 'text/javascript'; bch.async = true;
    bch.src = '//widgets.binotel.com/chat/widgets/' + widgetHash + '.js';
    var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(bch, sn);
})(document, window, 'script');
}
	else
 {
(function(d, w, s) {
    var widgetHash = 'ASJVZlUGusGzgCrDrBjg', bch = d.createElement(s); bch.type = 'text/javascript'; bch.async = true;
    bch.src = '//widgets.binotel.com/chat/widgets/' + widgetHash + '.js';
    var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(bch, sn);
})(document, window, 'script');
}

// === script #2 (length=846) ===
(function(d) {
d.querySelectorAll('.j-phone-item').forEach(function (el) {
el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
})
})(document);
(function(d, w, s) {
var widgetHash = '1qglk7nyrdat6kq0u86h', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
})(document, window, 'script');
const waitB = setInterval(() => {if (!!window.BinotelCallTracking) {
for (key in window.BinotelCallTracking) {
if(window.BinotelCallTracking[key]['initState']=="success"){
setTimeout(document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/\D/g, ''))),0)
clearInterval(waitB)}}}},1000)
