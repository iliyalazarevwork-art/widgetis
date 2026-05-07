// source: https://shurymury.ua/
// extracted: 2026-05-07T21:19:33.273Z
// scripts: 2

// === script #1 (length=581) ===
document.oncopyXXXXXXXXXXX = function () { var bodyElement = document.body; var selection = getSelection(); var href = document.location.href; var copyright = "<br><br>Источник: <a href='"+ href +"'>" + href + "</a><br>© Секс-шоп"; var text = selection + copyright; var divElement = document.createElement('div'); divElement.style.position = 'absolute'; divElement.style.left = '-99999px'; divElement.innerHTML = text; body00000000000000Element.appendChild(divElement); selection.selectAllChildren(divElement); setTimeout(function() { bodyElement.removeChild(divElement); }, 0); };

// === script #2 (length=666) ===
if (document.querySelector('.p-rating')) {
if (location.pathname.indexOf('/ru/') === 0){
document.querySelector('.p-rating').insertAdjacentHTML('afterend', '<div class="comment_confirmation"><br/> Оставляйте комментарии под учётной записью, которую использовали для оформления заказа. Отзывы, которые нам не удастся идентифицировать, могут быть не опубликованными.</div>');} else { document.querySelector('.p-rating').insertAdjacentHTML('afterend', '<div class="comment_confirmation"><br/>  Залишайте коментарі під обліковим записом, який використовували для оформлення замовлення. Відгуки, які нам не вийде ідентифікувати, можуть бути не опубліковані.</div>'); }}
