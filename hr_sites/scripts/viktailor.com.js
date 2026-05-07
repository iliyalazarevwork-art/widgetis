// source: https://viktailor.com/
// extracted: 2026-05-07T21:19:08.085Z
// scripts: 3

// === script #1 (length=7331) ===
(function () {
  function addDays(date, days) {
    var d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function formatDateYYYYMMDD(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function getOrderId() {
    try {
      var path = (location.pathname || '').toLowerCase();

      // /checkout/complete/76638/
      var m = path.match(/\/checkout\/complete\/(\d+)/i);
      if (m && m[1]) return m[1];

      var h =
        document.querySelector('.checkout-complete .h2') ||
        document.querySelector('.checkout-complete h1') ||
        document.querySelector('.h2') ||
        document.querySelector('h1');

      if (h) {
        var hm = String(h.textContent || '').match(/(\d{3,})/);
        if (hm && hm[1]) return hm[1];
      }
    } catch (e) {}

    return '';
  }

  function getEmail() {
    try {
      if (window.order && window.order.email) return String(window.order.email).trim();
      if (window.customer && window.customer.email) return String(window.customer.email).trim();
      if (window.checkout && window.checkout.email) return String(window.checkout.email).trim();

      if (Array.isArray(window.dataLayer)) {
        for (var i = window.dataLayer.length - 1; i >= 0; i--) {
          var dl = window.dataLayer[i];
          if (!dl || typeof dl !== 'object') continue;

          if (dl.email) return String(dl.email).trim();
          if (dl.customer_email) return String(dl.customer_email).trim();
          if (dl.user_email) return String(dl.user_email).trim();

          if (dl.ecommerce && dl.ecommerce.email) {
            return String(dl.ecommerce.email).trim();
          }

          if (dl.user_data && dl.user_data.email) {
            return String(dl.user_data.email).trim();
          }
        }
      }

      var emailInput =
        document.querySelector('input[name="email"]') ||
        document.querySelector('input[type="email"]') ||
        document.querySelector('[data-email]');

      if (emailInput) {
        var val = emailInput.value || emailInput.getAttribute('data-email') || '';
        if (String(val).trim()) return String(val).trim();
      }

      var storageKeys = [
        'email',
        'customer_email',
        'checkout_email',
        'order_email',
        'user_email'
      ];

      for (var s = 0; s < 2; s++) {
        var storage = s === 0 ? window.localStorage : window.sessionStorage;
        if (!storage) continue;

        for (var k = 0; k < storageKeys.length; k++) {
          var raw = storage.getItem(storageKeys[k]);
          if (raw && String(raw).trim()) return String(raw).trim();
        }
      }
    } catch (e) {}

    return '';
  }

  function getProducts() {
    var items = [];

    try {
      if (Array.isArray(window.dataLayer)) {
        for (var i = window.dataLayer.length - 1; i >= 0; i--) {
          var dl = window.dataLayer[i];
          if (!dl || typeof dl !== 'object') continue;

          var ecommerce = dl.ecommerce || {};
          var sourceItems = ecommerce.items || dl.items;

          if (Array.isArray(sourceItems) && sourceItems.length) {
            for (var j = 0; j < sourceItems.length; j++) {
              var it = sourceItems[j] || {};
              var gtin = it.gtin || it.item_gtin || it.id_gtin || it.barcode || '';

              if (gtin) {
                items.push({ gtin: String(gtin) });
              }
            }
            break;
          }
        }
      }
    } catch (e) {}

    return items;
  }

  function moveSurveyBadge() {
    try {
      var selectors = [
        'div[role="button"]',
        'button[aria-label*="магаз"]',
        'button[aria-label*="каче"]',
        'button[aria-label*="quality"]',
        '[aria-label*="магаз"]',
        '[aria-label*="каче"]',
        '[aria-label*="quality"]',
        'iframe[title*="survey"]',
        'iframe[title*="google"]'
      ];

      var nodes = document.querySelectorAll(selectors.join(','));

      Array.prototype.forEach.call(nodes, function (el) {
        var label = (
          (el.getAttribute && (
            el.getAttribute('aria-label') ||
            el.getAttribute('title') ||
            el.getAttribute('alt')
          )) || ''
        ).toLowerCase();

        var html = (el.outerHTML || '').toLowerCase();

        if (
          label.indexOf('відкриття спливаючого') !== -1 ||
          label.indexOf('качество магазина') !== -1 ||
          label.indexOf('якість магазину') !== -1 ||
          label.indexOf('quality') !== -1 ||
          html.indexOf('google-symbols') !== -1 ||
          html.indexOf('button-logo') !== -1 ||
          html.indexOf('surveyoptin') !== -1
        ) {
          el.style.setProperty('position', 'fixed', 'important');
          el.style.setProperty('left', '16px', 'important');
          el.style.setProperty('right', 'auto', 'important');
          el.style.setProperty('bottom', '16px', 'important');
          el.style.setProperty('top', 'auto', 'important');
          el.style.setProperty('z-index', '999999', 'important');

          if (el.parentElement) {
            el.parentElement.style.setProperty('position', 'fixed', 'important');
            el.parentElement.style.setProperty('left', '16px', 'important');
            el.parentElement.style.setProperty('right', 'auto', 'important');
            el.parentElement.style.setProperty('bottom', '16px', 'important');
            el.parentElement.style.setProperty('top', 'auto', 'important');
            el.parentElement.style.setProperty('z-index', '999999', 'important');
          }
        }
      });
    } catch (e) {}
  }

  function renderSurvey() {
    try {
      var orderId = getOrderId();
      var email = getEmail();
      var products = getProducts();

      if (!orderId || !email) return;

      var estimatedDeliveryDate = formatDateYYYYMMDD(addDays(new Date(), 3));

      window.gapi.load('surveyoptin', function () {
        var payload = {
          merchant_id: 279120459,
          order_id: orderId,
          email: email,
          delivery_country: 'UA',
          estimated_delivery_date: estimatedDeliveryDate
        };

        if (products.length) {
          payload.products = products;
        }

        window.gapi.surveyoptin.render(payload);

        setTimeout(moveSurveyBadge, 1000);
        setTimeout(moveSurveyBadge, 2500);
        setTimeout(moveSurveyBadge, 5000);
      });
    } catch (e) {}
  }

  window.renderOptIn = function () {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setTimeout(renderSurvey, 500);
      });
    } else {
      setTimeout(renderSurvey, 500);
    }
  };

  var observer = new MutationObserver(function () {
    moveSurveyBadge();
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  setInterval(moveSurveyBadge, 2000);
})();

// === script #2 (length=1112) ===
(function(w,d,t,u){
  var s=d.createElement(t),j=d.getElementsByTagName(t)[0];
  s.src=u; s.async=true; s.defer=true;

  s.onload=function(){
    // Render KeyCRM widget
    if (w.KeyCRM && typeof w.KeyCRM.render === "function") {
      w.KeyCRM.render({ token:"2a6649e3-403e-43ed-af2a-220d7f204d94" });
    }

    // Mark / hide native launcher once it appears
    var tries = 0;
    var timer = setInterval(function(){
      tries++;

      // Native KeyCRM toggle container from your DOM
      var nativeContainer = d.querySelector('.KeyCRM-toggleButtonContainer');
      var nativeButton = d.querySelector('button.KeyCRM-toggleButton');

      if (nativeContainer) nativeContainer.classList.add('vt-keycrm-native');
      if (nativeButton) nativeButton.classList.add('vt-keycrm-native-btn');

      // stop when found at least one
      if (nativeContainer || nativeButton) clearInterval(timer);
      if (tries > 120) clearInterval(timer); // ~30s
    }, 250);
  };

  j.parentNode.insertBefore(s,j);
})(window, document, "script","https://chat.key.live/bundles/widget.min.js");

// === script #3 (length=1003) ===
(function(){
  function openKeycrm(){
    // 1) try direct click on native KeyCRM button (your DOM)
    var btn = document.querySelector('button.KeyCRM-toggleButton');
    if (btn) { btn.click(); return; }

    // 2) try common fallbacks
    var selectors = [
      '.KeyCRM-toggleButtonContainer button',
      '.keycrm__launcher',
      '.keycrm-launcher',
      '.keycrm-widget-button',
      '[class*="keycrm"][class*="launcher"]',
      '[class*="keycrm"][class*="toggle"]',
      '[class*="keycrm"][class*="button"]'
    ];

    for (var i=0;i<selectors.length;i++){
      var el = document.querySelector(selectors[i]);
      if (el) { el.click(); return; }
    }

    // 3) last fallback: scroll to iframe
    var iframe = document.querySelector('iframe[src*="key.live"]');
    if (iframe) iframe.scrollIntoView({block:"end", behavior:"smooth"});
  }

  var myBtn = document.getElementById('vtChatBtn');
  if (myBtn) myBtn.addEventListener('click', openKeycrm);
})();
