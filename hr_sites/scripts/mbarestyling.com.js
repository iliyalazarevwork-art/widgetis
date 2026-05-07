// source: https://mbarestyling.com/
// extracted: 2026-05-07T21:22:00.495Z
// scripts: 2

// === script #1 (length=4240) ===
(function () {
  var API_URL = 'https://script.google.com/macros/s/AKfycbyiJS1vTX5BOLNQecLhoZnHV4_WJZY1P54e78kMAEWelmHwpE8C2D-JO5EFcPa7TuXcIQ/exec';
  var CALCULATOR_URL = '/ru/kalkuliator/';
  var BUTTON_TEXT = 'Рассчитать установку и покраску';

  if (document.getElementById('mba-auto-calc-link')) return;

  function normalizePath(url) {
    try {
      var path = new URL(url, window.location.origin).pathname;

      return path
        .toLowerCase()
        .replace(/^\/(ru|uk|ua|en)\//, '/')
        .replace(/\/+$/, '');
    } catch (error) {
      return '';
    }
  }

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9а-яёіїєґ]+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function pageText() {
    var h1 = document.querySelector('h1');
    var title = document.title || '';

    return normalizeText((h1 ? h1.textContent : '') + ' ' + title);
  }

  function kitHasApprovedPrices(kit, payload) {
    var workIds = payload.kitWorks && payload.kitWorks[kit.kit_id] ? payload.kitWorks[kit.kit_id] : [];
    var prices = payload.prices || {};

    if (!workIds.length) return false;

    return Object.keys(prices).some(function (stoId) {
      var stoPrices = prices[stoId] || {};

      return workIds.some(function (workId) {
        return Boolean(stoPrices[workId]);
      });
    });
  }

  function findKit(payload) {
    var currentPath = normalizePath(window.location.href);
    var text = pageText();
    var kits = payload.kits || [];
    var urlMatch = null;
    var textMatches = [];

    kits.forEach(function (kit) {
      var kitPath = normalizePath(kit.url);
      var kitName = normalizeText(kit.name);
      var brandName = normalizeText((kit.brand ? kit.brand + ' ' : '') + kit.name);

      if (kitPath && kitPath === currentPath) {
        urlMatch = kit;
        return;
      }

      if (kitName && text.indexOf(kitName) !== -1) {
        textMatches.push(kit);
        return;
      }

      if (brandName && text.indexOf(brandName) !== -1) {
        textMatches.push(kit);
      }
    });

    return urlMatch || (textMatches.length === 1 ? textMatches[0] : null);
  }

  function findInsertTarget() {
    var selectors = [
      '.product__buy',
      '.product__buttons',
      '.product-info__buttons',
      '.product-card__buy',
      '.product-order',
      '.j-product-order',
      '.j-buy-button',
      '[data-product-id]',
      'form[action*="cart"]',
      '.product-price',
      '.product__price',
      'h1'
    ];

    for (var i = 0; i < selectors.length; i++) {
      var node = document.querySelector(selectors[i]);
      if (node) return node;
    }

    return null;
  }

  function addButton(kit) {
    var target = findInsertTarget();
    var button = document.createElement('a');

    if (!target || document.getElementById('mba-auto-calc-link')) return;

    button.id = 'mba-auto-calc-link';
    button.className = 'mba-auto-calc-link';
    button.href = CALCULATOR_URL + '?kit=' + encodeURIComponent(kit.kit_id);
    button.textContent = BUTTON_TEXT;
    button.addEventListener('click', function () {
      try {
        window.sessionStorage.setItem('mba_sto_selected_kit', kit.kit_id);
      } catch (error) {}
    });

    target.insertAdjacentElement('afterend', button);
  }

  function loadData() {
    var callbackName = 'mbaAutoCalcButton_' + Date.now();
    var script = document.createElement('script');

    window[callbackName] = function (payload) {
      var kit;

      delete window[callbackName];

      if (!payload || !payload.ok) return;

      kit = findKit(payload);
      if (!kit || !kitHasApprovedPrices(kit, payload)) return;

      addButton(kit);
    };

    script.src = API_URL + '?action=calculator_data&callback=' + encodeURIComponent(callbackName);
    script.onerror = function () {
      delete window[callbackName];
    };

    document.body.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadData);
  } else {
    loadData();
  }
})();

// === script #2 (length=851) ===
(function(d) {
d.querySelectorAll('.j-phone-item').forEach(function (el) {
el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
})
})(document);
(function(d, w, s) {
var widgetHash = 'lifav8gtcs83nyg7gw3g', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
})(document, window, 'script');
const waitB = setInterval(() => {if (!!window.BinotelCallTracking) {
for (let key in window.BinotelCallTracking) {
if(window.BinotelCallTracking[key]['initState']==="success"){
setTimeout(document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/\D/g, ''))),0)
clearInterval(waitB)}}}},1000)
