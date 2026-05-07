// source: https://maverick.ua/
// extracted: 2026-05-07T21:18:59.479Z
// scripts: 2

// === script #1 (length=1766) ===
import com.facebook.ads.sdk.APIContext;
import com.facebook.ads.sdk.APIException;
import com.facebook.ads.sdk.serverside.Content;
import com.facebook.ads.sdk.serverside.CustomData;
import com.facebook.ads.sdk.serverside.DeliveryCategory;
import com.facebook.ads.sdk.serverside.Event;
import com.facebook.ads.sdk.serverside.EventRequest;
import com.facebook.ads.sdk.serverside.EventResponse;
import com.facebook.ads.sdk.serverside.GenderEnum;
import com.facebook.ads.sdk.serverside.UserData;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

public class ConversionsApiExample {

  public static final String ACCESS_TOKEN = "<ACCESS_TOKEN>";
  public static final String PIXEL_ID = "<ADS_PIXEL_ID>";

  public static void main(String[] args) {
    APIContext context = new APIContext(ACCESS_TOKEN).enableDebug(true);
    context.setLogger(System.out);
    List<Event> events = new ArrayList<>();

    UserData userData_0 = new UserData()
      .emails(Arrays.asList("7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068"))
      .phones(Arrays.asList());

    CustomData customData_0 = new CustomData()
      .value(142.52f)
      .currency("USD");

    Event event_0 = new Event()
      .eventName("Purchase")
      .eventTime(1636802444L)
      .userData(userData_0)
      .customData(customData_0)
      .actionSource("website");
    events.add(event_0);

    EventRequest eventRequest = new EventRequest(PIXEL_ID, context)
      .data(events);

    try {
      EventResponse response = eventRequest.execute();
      System.out.printf("Standard API response : %s ", response);
    } catch (APIException e) {
      e.printStackTrace();
    }
  }
}

// === script #2 (length=15390) ===
(function() {
  'use strict';

  var CONFIG = {
    N8N_WEBHOOK_URL: 'https://maverick.ugc-up.com/webhook/abandoned-cart',
    DEBOUNCE_MS: 3000,
    DEBUG: false
  };

  // Селектори полів — спільні для десктоп і мобайл
  var FIELD_MAP = [
    { key: 'name',    selectors: ['input[name="Recipient[delivery_name]"]', 'input[name*="name"]'] },
    { key: 'phone',   selectors: ['input[name="Recipient[delivery_phone]"]', 'input[name*="phone"]'] },
    { key: 'city',    selectors: ['input[name="Recipient[delivery_city]"]', 'input[name*="city"]'] },
    { key: 'email',   selectors: ['input[name="Recipient[delivery_email]"]', 'input[name*="email"]'] },
    { key: 'comment', selectors: ['textarea[name="Recipient[comment]"]'] }
  ];

  function log() {
    if (CONFIG.DEBUG) console.log.apply(console, ['[ACT]'].concat(Array.prototype.slice.call(arguments)));
  }

  function getVisitorId() {
    var key = '_act_vid', id = null;
    try { id = localStorage.getItem(key); } catch(e) {}
    if (!id) { id = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); try { localStorage.setItem(key, id); } catch(e) {} }
    return id;
  }

  function getSessionId() {
    var key = '_act_sid', id = null;
    try { id = sessionStorage.getItem(key); } catch(e) {}
    if (!id) { id = 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6); try { sessionStorage.setItem(key, id); } catch(e) {} }
    return id;
  }

  function isCheckoutPage() {
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf('/checkout/complete/') !== -1) return false;
    if (path.indexOf('/profile/') !== -1) return false;
    return path.indexOf('/checkout') !== -1;
  }

  function isThankYouPage() {
    return window.location.pathname.toLowerCase().indexOf('/checkout/complete/') !== -1;
  }

  // Знайти перший елемент по масиву селекторів
  function qsFirst(selectors, parent) {
    parent = parent || document;
    for (var i = 0; i < selectors.length; i++) {
      try { var el = parent.querySelector(selectors[i]); if (el) return el; } catch(e) {}
    }
    return null;
  }

function collectFormData() {
    var data = {};
    FIELD_MAP.forEach(function(f) {
      for (var i = 0; i < f.selectors.length; i++) {
        try {
          var el = document.querySelector(f.selectors[i]);
          if (el && el.value && el.value.trim()) { data[f.key] = el.value.trim(); break; }
        } catch(e) {}
      }
    });
    
    // Мобільне місто: беремо data-value з активного елемента dropdown
    if (!data.city || /^\d+$/.test(data.city)) {
      try {
        var activeCity = document.querySelector('.j-option-item.is-active[data-value]');
        if (activeCity) {
          var cityName = activeCity.getAttribute('data-value');
          if (cityName && cityName.trim()) data.city = cityName.trim();
        }
      } catch(e) {}
    }
    
    // Також перевіряємо десктопний варіант — текст в полі може бути "м. Київ"
    if (data.city && /^\d+$/.test(data.city)) {
      try {
        var cityInput = document.querySelector('input[name*="city"]');
        if (cityInput) {
          var parent = cityInput.closest('.select-field, .field, .form-group');
          if (parent) {
            var selected = parent.querySelector('.selected-text, .select-value, [class*="selected"]');
            if (selected && selected.textContent.trim()) data.city = selected.textContent.trim();
          }
        }
      } catch(e) {}
    }
    
    return data;
  }

  /**
   * Збір товарів — універсальний: десктоп + мобайл Horoshop
   */
  function collectCartData() {
    var cartData = { items: [], total: '', count: 0 };
    try {
      // Універсальний селектор: j-cart-product є і на десктопі і на мобайлі
      var items = document.querySelectorAll('.j-cart-product');
      
      if (items.length === 0) {
        // Фолбеки
        items = document.querySelectorAll('li.order-i, .order-details__block, .cart-item');
      }

      items.forEach(function(item) {
        // Назва — пробуємо мобільний і десктопний
        var nameEl = qsFirst([
          '.cart-item__title',         // мобайл
          '.order-i-title a',          // десктоп
          '.order-i-title'             // десктоп фолбек
        ], item);
        var name = nameEl ? nameEl.textContent.trim().substring(0, 120) : '';

        // Ціна
        var priceEl = qsFirst([
          '.cart-item__price',         // мобайл
          '.j-cart-product-price',     // universal
          '.order-i-cost',             // десктоп
          '.cart-item__cost'           // мобайл альт
        ], item);
        var price = priceEl ? priceEl.textContent.trim() : '';

        // Кількість
        var qtyEl = qsFirst([
          '.j-quantity-p',             // universal
          '.counter-field',            // десктоп
          'input[type="number"]'       // фолбек
        ], item);
        var quantity = qtyEl ? (qtyEl.value || '1') : '1';

        // Зображення
        var imgEl = qsFirst([
          '.cart-item__image img',     // мобайл
          '.cart-item-image img',      // мобайл альт
          '.order-i-image img',        // десктоп
          'img'                        // фолбек
        ], item);
        var image = '';
        if (imgEl) {
          image = imgEl.src || imgEl.getAttribute('data-src') || '';
          // Більше зображення
          if (image.indexOf('78x78') !== -1) image = image.replace('78x78', '300x300');
        }

        // URL товару
        var linkEl = item.querySelector('a[href]');
        var url = linkEl ? linkEl.href : '';

        if (name) {
          cartData.items.push({ name: name, price: price, quantity: quantity, url: url, image: image });
        }
      });

      // Загальна сума
      var totalEl = qsFirst([
        '.j-total-sum',               // universal
        '.order-summary-b',           // десктоп
        '.cart-total__sum',            // мобайл
        '.checkout-total-sum'          // фолбек
      ]);
      if (totalEl) cartData.total = totalEl.textContent.trim();

      cartData.count = cartData.items.length;
    } catch(e) { log('Cart collect error:', e); }
    return cartData;
  }

  /**
   * Збір даних зі сторінки "Дякуємо"
   */
  function collectOrderData() {
    var data = { form_data: {}, cart: { items: [], total: '', count: 0 }, order_number: '' };
    try {
      // Номер замовлення
      var headers = document.querySelectorAll('h1, h2, .h2, .checkout-complete__title');
      for (var h = 0; h < headers.length; h++) {
        var m = headers[h].textContent.match(/№\s*(\d+)/);
        if (m) { data.order_number = m[1]; break; }
      }

      // Дані замовника
      var dts = document.querySelectorAll('dt.check-h, .order-info dt, .checkout-complete dt');
      var dds = document.querySelectorAll('dd.check-b, .order-info dd, .checkout-complete dd');
      for (var i = 0; i < dts.length && i < dds.length; i++) {
        var label = dts[i].textContent.trim().toLowerCase();
        var value = dds[i] ? dds[i].textContent.trim() : '';
        if (label.indexOf('прізвище') !== -1 || label.indexOf("ім'я") !== -1 || label.indexOf('имя') !== -1) data.form_data.name = value;
        else if (label.indexOf('телефон') !== -1) data.form_data.phone = value;
        else if (label.indexOf('місто') !== -1 || label.indexOf('город') !== -1) data.form_data.city = value;
        else if (label.indexOf('email') !== -1 || label.indexOf('пошта') !== -1) data.form_data.email = value;
      }

      // Товари — з тими самими універсальними селекторами
      var items = document.querySelectorAll('.j-cart-product, li.order-i, .order-details__block');
      items.forEach(function(item) {
        var nameEl = qsFirst(['.cart-item__title', '.order-i-title a', '.order-i-title'], item);
        var name = nameEl ? nameEl.textContent.trim().substring(0, 120) : '';
        var priceEl = qsFirst(['.cart-item__price', '.j-cart-product-price', '.order-i-cost'], item);
        var price = priceEl ? priceEl.textContent.trim() : '';
        var imgEl = qsFirst(['.cart-item__image img', '.order-i-image img', 'img'], item);
        var image = imgEl ? (imgEl.src || '') : '';
        if (image.indexOf('78x78') !== -1) image = image.replace('78x78', '300x300');
        var quantity = '1';
        var qtyEl = qsFirst(['.j-quantity-p', '.counter-field', 'input[type="number"]'], item);
        if (qtyEl) quantity = qtyEl.value || '1';
        var linkEl = item.querySelector('a[href]');
        var url = linkEl ? linkEl.href : '';
        if (name) {
          data.cart.items.push({ name: name, price: price, quantity: quantity, url: url, image: image });
        }
      });

      var totalEl = qsFirst(['.j-total-sum', '.order-summary-b', '.cart-total__sum']);
      if (totalEl) data.cart.total = totalEl.textContent.trim();
      data.cart.count = data.cart.items.length;
    } catch(e) { log('Order parse error:', e); }
    return data;
  }

  var sendTimer = null;
  var lastSentHash = '';
  var lastCartJson = '';

  function sendToN8N(eventType) {
    var payload;

    if (eventType === 'order_completed') {
      var orderData = collectOrderData();
      payload = {
        event: 'order_completed',
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        order_number: orderData.order_number,
        form_data: orderData.form_data,
        cart: orderData.cart
      };
    } else {
      var formData = collectFormData();
      var cartData = collectCartData();

      // Зберігаємо кошик якщо він не пустий
      if (cartData.items.length > 0) {
        lastCartJson = JSON.stringify(cartData);
      }
      // Якщо кошик пустий — пробуємо збережений
      if (cartData.items.length === 0 && lastCartJson) {
        try { cartData = JSON.parse(lastCartJson); } catch(e) {}
      }

      var hash = JSON.stringify(formData) + '|' + cartData.count;
      if (hash === lastSentHash && eventType === 'field_input') return;
      lastSentHash = hash;

      payload = {
        event: eventType || 'field_input',
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        referrer: document.referrer || '',
        form_data: formData,
        cart: cartData
      };
    }

    log('SEND:', eventType, payload);

    var json = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(CONFIG.N8N_WEBHOOK_URL, new Blob([json], { type: 'application/json' }));
        return;
      }
    } catch(e) {}
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', CONFIG.N8N_WEBHOOK_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(json);
    } catch(e) {}
  }

  function debouncedSend(eventType) {
    if (sendTimer) clearTimeout(sendTimer);
    sendTimer = setTimeout(function() { sendToN8N(eventType); }, CONFIG.DEBOUNCE_MS);
  }

  function findField(fieldDef) {
    for (var i = 0; i < fieldDef.selectors.length; i++) {
      try { var el = document.querySelector(fieldDef.selectors[i]); if (el) return el; } catch(e) {}
    }
    return null;
  }

  function attachFieldListeners() {
    FIELD_MAP.forEach(function(f) {
      var el = findField(f);
      if (el && !el._actTracked) {
        el._actTracked = true;
        el.addEventListener('input', function() { debouncedSend('field_input'); });
        el.addEventListener('change', function() { sendToN8N('field_change'); });
        el.addEventListener('blur', function() { if (el.value && el.value.trim()) debouncedSend('field_blur'); });
      }
    });

    // Поллінг міста (автокомпліт — часто через кастомний dropdown)
    FIELD_MAP.forEach(function(f) {
      if (f.key !== 'city') return;
      var el = findField(f);
      if (el && !el._actCityPoll) {
        el._actCityPoll = true;
        var lastVal = '';
        setInterval(function() {
          var v = el.value;
          if (v !== lastVal && v.trim()) { lastVal = v; debouncedSend('field_change'); }
        }, 1500);
      }
    });

    // Кнопки кількості — universal
    try {
      document.querySelectorAll('.j-increase-p, .j-decrease-p, .counter-plus, .counter-minus').forEach(function(btn) {
        if (!btn._actTracked) { btn._actTracked = true; btn.addEventListener('click', function() { setTimeout(function() { sendToN8N('cart_qty_change'); }, 500); }); }
      });
      document.querySelectorAll('.j-remove-p, .cart-item__remove').forEach(function(btn) {
        if (!btn._actTracked) { btn._actTracked = true; btn.addEventListener('click', function() { setTimeout(function() { sendToN8N('cart_item_removed'); }, 500); }); }
      });
    } catch(e) {}
  }

  function observeDOM() {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function(mutations) {
      var hasNew = mutations.some(function(m) { return m.addedNodes.length > 0; });
      if (hasNew) {
        attachFieldListeners();
        var cart = collectCartData();
        if (cart.items.length > 0) {
          lastCartJson = JSON.stringify(cart);
          log('Cart updated via DOM:', cart.items.length, 'items');
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function trackPageLeave() {
    window.addEventListener('beforeunload', function() { sendToN8N('page_leave'); });
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') sendToN8N('tab_hidden');
    });
  }

  function waitForCart(callback, attempts) {
    attempts = attempts || 0;
    var cart = collectCartData();
    if (cart.items.length > 0) {
      lastCartJson = JSON.stringify(cart);
      callback();
    } else if (attempts < 15) {
      // Чекаємо до 15 секунд (15 * 1000мс)
      setTimeout(function() { waitForCart(callback, attempts + 1); }, 1000);
    } else {
      callback();
    }
  }

  function init() {
    log('Init, path:', window.location.pathname);

    if (isThankYouPage()) {
      log('Order completed');
      setTimeout(function() { sendToN8N('order_completed'); }, 2000);
      try { sessionStorage.removeItem('_act_sid'); } catch(e) {}
      return;
    }

    if (isCheckoutPage()) {
      log('Checkout — tracking ON');
      attachFieldListeners();
      observeDOM();
      trackPageLeave();

      // Поллінг для пізно завантажених полів
      var pollCount = 0;
      var poller = setInterval(function() {
        attachFieldListeners();
        pollCount++;
        if (pollCount > 30) clearInterval(poller);
      }, 2000);

      // Чекаємо кошик і відправляємо checkout_started
      waitForCart(function() {
        sendToN8N('checkout_started');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
