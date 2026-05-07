// source: https://ballistic.com.ua/
// extracted: 2026-05-07T21:19:02.879Z
// scripts: 1

// === script #1 (length=1037) ===
document.addEventListener('DOMContentLoaded', function() {
if (window.location.href.indexOf('checkout/complete') !== -1) {
var utmSource = getCookie('utm_source');
var sauid = getCookie('SAuid');
if (utmSource === 'sellaction.net' && sauid) {
var cartTotal = '';
var orderId = '';
var tariffid = '4857';
sendConversionPixel(sauid, tariffid, cartTotal, orderId);
}
}
});
function sendConversionPixel(sauid, tariffid, cartTotal, orderId) {
var image = new Image();
image.onload = function() {};
image.onerror = function() {};
image.src = 'https://sellaction.net/reg.php?id=' +
encodeURIComponent(sauid) + '-' +
encodeURIComponent(tariffid) + '_' +
encodeURIComponent(cartTotal) +
'&order_id=' + encodeURIComponent(orderId);
image.style.display = 'none';
document.body.appendChild(image);
}
function getCookie(name) {
var matches = document.cookie.match(new RegExp(
"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
));
return matches ? decodeURIComponent(matches[1]) : undefined;
}
