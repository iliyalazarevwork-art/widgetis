// source: https://voltech.in.ua/
// extracted: 2026-05-07T21:23:09.649Z
// scripts: 1

// === script #1 (length=805) ===
(function(d, w, s) {
	var widgetHash = 'ure587ida85hmlo82wtz', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
	ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
	var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
  })(document, window, 'script');

document.addEventListener('DOMContentLoaded', () => {
  const selectors = ['.product-price__item', '.product-card__price'];
  const interval = setInterval(() => {
    selectors.forEach(sel => {
      const div = document.querySelector(sel);
      if (div && div.textContent.trim().includes('Ціну уточнюйте')) {
        div.classList.add('noprice');
      }
    });
  }, 300);

  const timeout = setTimeout(() => {
    clearInterval(interval);
  }, 10000);
});
