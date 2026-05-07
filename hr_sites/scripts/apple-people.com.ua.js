// source: https://apple-people.com.ua/
// extracted: 2026-05-07T21:19:27.344Z
// scripts: 2

// === script #1 (length=911) ===
(function() {
  'use strict';
  const WIDGET_URL = 'https://horoshop-bank-widget.chatbullet.com/widget.js';
  if (window.__HOROSHOP_CREDIT_WIDGET_LOADED__) return;
  if (document.querySelector('script[src="' + WIDGET_URL + '"]')) return;
  function loadWidget() {
    var script = document.createElement('script');
    script.src = WIDGET_URL; // без Date.now() — браузер кешує скрипт
    script.async = true;
    script.defer = true;
    script.onload = function() {
      window.__HOROSHOP_CREDIT_WIDGET_LOADED__ = true;
    };
    (document.head || document.documentElement).appendChild(script);
  }
  // Чекаємо поки DOM готовий, без MutationObserver
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWidget, { once: true });
  } else {
    // DOM вже готовий — відкладаємо щоб не блокувати рендер
    setTimeout(loadWidget, 0);
  }
})();

// === script #2 (length=12433) ===
(function() {
  var PAY_API = 'https://pay.apple-people.com.ua/api/pay';

  // === PART 2: /checkout/complete/ — auto-create Mono invoice ===
  if (window.location.pathname.indexOf('/checkout/complete/') > -1) {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('ap_pay_data')); } catch(e) {}
    if (saved && saved.ts && (Date.now() - saved.ts < 120000)) {
      localStorage.removeItem('ap_pay_data');
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.95);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:-apple-system,system-ui,sans-serif';
      ov.innerHTML = '<div style="font-size:18px;font-weight:600;color:#111;margin-bottom:12px">Переходимо до оплати...</div><div style="font-size:14px;color:#666">Зачекайте, створюємо платіж</div>';
      document.body.appendChild(ov);
      fetch(PAY_API, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(saved)})
      .then(function(r){return r.json();})
      .then(function(d){
        if(d.pageUrl){window.location.href=d.pageUrl;}
        else{ov.innerHTML='<div style="font-size:18px;color:#e53e3e">Помилка</div><div style="margin-top:12px"><a href="'+(saved.product_url||'/')+'" style="color:#111">Повернутись</a></div>';}
      }).catch(function(){ov.innerHTML='<div style="font-size:18px;color:#e53e3e">Помилка</div><div style="margin-top:12px"><a href="/" style="color:#111">На головну</a></div>';});
    }
    return;
  }

  // === PART 1: Product page ===
  var buyBtn = document.querySelector('.j-buy-button-add');
  if (!buyBtn) return;
  var qForm = document.querySelector('#quick-container');
  if (!qForm) return;

  var s = document.createElement('style');
  s.textContent =
    '.fpb-w{display:inline-block}' +
    '.fpb{display:inline-flex;align-items:center;justify-content:center;gap:4px;' +
    'background:#000;color:#fff;border:1px solid #000;border-radius:4px;padding:8px 14px;cursor:pointer;' +
    'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;' +
    'text-decoration:none;transition:all .15s;height:36px;box-sizing:border-box;white-space:nowrap;line-height:1}' +
    '.fpb:hover{background:#1a1a1a;color:#fff;text-decoration:none}' +
    '.fpb img{height:22px;width:auto}' +
    '.fpb-div{width:1px;height:18px;background:rgba(255,255,255,.3);margin:0 8px;flex-shrink:0}' +
    '.fpb-ap{display:inline-flex;align-items:center;gap:2px}' +
    '.fpb-ap img{height:20px;width:auto;position:relative;top:-1px}' +
    '.fpb-ap span{font-size:15px;font-weight:400;color:#fff;font-family:-apple-system,system-ui,sans-serif}' +
    '.fpb-w--mobile{display:block;margin-top:8px}' +
    '.fpb-w--mobile .fpb{display:flex;width:100%;justify-content:center;height:44px;border-radius:6px}' +
    '.fpo{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:10000;display:none;align-items:center;justify-content:center}' +
    '.fpo.--show{display:flex}' +
    '.fpm{background:#fff;border-radius:12px;padding:28px 24px;max-width:380px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;position:relative;max-height:90vh;overflow-y:auto}' +
    '.fpm-x{position:absolute;top:12px;right:16px;font-size:22px;cursor:pointer;color:#999;background:none;border:none;line-height:1;padding:4px}.fpm-x:hover{color:#333}' +
    '.fpm-h{font-size:18px;font-weight:700;color:#111;margin:0 0 4px}' +
    '.fpm-s{font-size:13px;color:#666;margin:0 0 20px}' +
    '.fpm-p{display:flex;align-items:center;gap:12px;padding:12px;background:#f8f8f8;border-radius:8px;margin-bottom:20px}' +
    '.fpm-p img{width:50px;height:50px;object-fit:contain;border-radius:4px}' +
    '.fpm-pn{font-size:13px;color:#333;line-height:1.3}' +
    '.fpm-pp{font-size:16px;font-weight:700;color:#111;margin-top:2px}' +
    '.fpm-f{margin-bottom:14px}' +
    '.fpm-f label{display:block;font-size:12px;color:#666;margin-bottom:4px;font-weight:500}' +
    '.fpm-f input{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:16px;box-sizing:border-box;outline:none;transition:border .15s;-webkit-appearance:none}' +
    '.fpm-f input:focus{border-color:#000}.fpm-f input.--e{border-color:#e53e3e}' +
    '.fpm-btn{display:flex;align-items:center;justify-content:center;gap:10px;background:#000;color:#fff;border:none;border-radius:8px;padding:14px;cursor:pointer;font-size:15px;font-weight:600;width:100%;transition:all .15s;-webkit-appearance:none}' +
    '.fpm-btn:hover{background:#222}.fpm-btn:disabled{opacity:.5;cursor:not-allowed}' +
    '.fpm-err{color:#e53e3e;font-size:13px;margin-top:8px;text-align:center}' +
    '.fpm-ft{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:14px;opacity:.5;font-size:11px;color:#999}';
  document.head.appendChild(s);

  var h1 = document.querySelector('h1, .product-header__title');
  var productName = h1 ? h1.textContent.trim() : '';
  var price = 0;
  document.querySelectorAll('.product__section--price, [class*="product-price"], .product-card__price').forEach(function(el) {
    if (!price) { var m = el.textContent.match(/([\d\s]+)\s*грн/); if (m) price = parseFloat(m[1].replace(/\s/g, '')); }
  });
  if (!price) { var pm = document.body.textContent.match(/([\d\s]{3,})\s*грн/); if (pm) price = parseFloat(pm[1].replace(/\s/g, '')); }
  var article = '';
  var am = document.body.textContent.match(/(?:Артикул|Article)[:\s]+(\d+)/i);
  if (am) article = am[1];
  var img = document.querySelector('.product-gallery img, .j-gallery-link img, .product-card__gallery img');
  var imgSrc = img ? img.src : '';
  var productUrl = window.location.href;

  function isQuickOrderBlock(el) {
    var t = el.textContent;
    return t.indexOf('\u043a\u043b\u0456\u043a') > -1 || t.indexOf('\u0411\u044b\u0441\u0442\u0440\u044b\u0439') > -1 || t.indexOf('\u0428\u0432\u0438\u0434\u043a') > -1;
  }

  var btnHTML = '<a class="fpb" id="fpb-o">' +
    '<img src="https://www.gstatic.com/instantbuy/svg/dark_gpay.svg" alt="Google Pay">' +
    '<span class="fpb-div"></span>' +
    '<span class="fpb-ap">' +
      '<img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" style="filter:invert(1)">' +
      '<span>Pay</span></span></a>';

  var inserted = false;
  var desktopBlocks = document.querySelectorAll('.product-order .product-order__block');
  if (desktopBlocks.length > 0) {
    var qb = null;
    desktopBlocks.forEach(function(b) { if (isQuickOrderBlock(b)) qb = b; });
    if (qb) {
      var w = document.createElement('div'); w.className = 'fpb-w product-order__block';
      w.innerHTML = btnHTML;
      qb.parentElement.insertBefore(w, qb.nextElementSibling);
      inserted = true;
    }
  }
  if (!inserted) {
    var mobileQuick = null;
    document.querySelectorAll('.product-card__order, .product-card__purchase > *').forEach(function(el) {
      if (isQuickOrderBlock(el)) mobileQuick = el;
    });
    if (mobileQuick) {
      var w2 = document.createElement('div'); w2.className = 'fpb-w fpb-w--mobile';
      w2.innerHTML = btnHTML;
      mobileQuick.parentElement.insertBefore(w2, mobileQuick.nextElementSibling);
      inserted = true;
    }
  }
  if (!inserted) {
    var buyParent = buyBtn.closest('.product-card__purchase, .product-order, .product__block--orderBox');
    if (buyParent) {
      var w3 = document.createElement('div'); w3.className = 'fpb-w fpb-w--mobile';
      w3.innerHTML = btnHTML;
      buyParent.appendChild(w3);
      inserted = true;
    }
  }
  if (!inserted) return;

  var ov = document.createElement('div'); ov.className = 'fpo';
  ov.innerHTML =
    '<div class="fpm">' +
    '<button class="fpm-x" id="fpm-x">&times;</button>' +
    '<p class="fpm-h">Оплатити онлайн</p>' +
    '<p class="fpm-s">Apple Pay, Google Pay або карткою</p>' +
    (productName && price ? '<div class="fpm-p">' + (imgSrc ? '<img src="' + imgSrc + '" alt="">' : '') +
      '<div><div class="fpm-pn">' + productName.substring(0, 80) + '</div>' +
      '<div class="fpm-pp">' + price.toLocaleString('uk-UA') + ' грн</div></div></div>' : '') +
    '<div class="fpm-f"><label>Ваше ім\'я</label><input type="text" id="fpm-n" placeholder="Ім\'я" autocomplete="name"></div>' +
    '<div class="fpm-f"><label>Телефон</label><input type="tel" id="fpm-p" placeholder="+380" autocomplete="tel"></div>' +
    '<button class="fpm-btn" id="fpm-go"><span>Оформити та оплатити</span></button>' +
    '<div class="fpm-err" id="fpm-e" style="display:none"></div>' +
    '<div class="fpm-ft">Безпечна оплата через plata by mono</div>' +
    '</div>';
  document.body.appendChild(ov);

  document.getElementById('fpb-o').addEventListener('click', function(e) {
    e.preventDefault(); ov.classList.add('--show');
    setTimeout(function() { document.getElementById('fpm-n').focus(); }, 100);
  });
  document.getElementById('fpm-x').addEventListener('click', function() { ov.classList.remove('--show'); });
  ov.addEventListener('click', function(e) { if (e.target === ov) ov.classList.remove('--show'); });

  document.getElementById('fpm-go').addEventListener('click', function() {
    var ne = document.getElementById('fpm-n'), pe = document.getElementById('fpm-p'),
        ee = document.getElementById('fpm-e'), btn = this;
    ne.classList.remove('--e'); pe.classList.remove('--e'); ee.style.display = 'none';
    var n = ne.value.trim(), p = pe.value.trim();
    if (!n || n.length < 2) { ne.classList.add('--e'); ee.textContent = 'Введіть ім\'я'; ee.style.display = 'block'; ne.focus(); return; }
    if (!p || p.replace(/\D/g, '').length < 10) { pe.classList.add('--e'); ee.textContent = 'Введіть телефон'; ee.style.display = 'block'; pe.focus(); return; }
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Оформлюємо замовлення...';
    localStorage.setItem('ap_pay_data', JSON.stringify({
      name: n, phone: p, product_name: productName,
      product_url: productUrl, article: article, price: price, ts: Date.now()
    }));
    // Open quick order modal silently (hidden from user)
    if (typeof Modal !== 'undefined' && Modal.open) {
      Modal.open('#checkout-quick');
      // Hide modal immediately so user doesn't see it
      var modalEl = document.querySelector('#checkout-quick');
      if (modalEl) { var pp = modalEl.closest('.popup, .modal, [class*="popup"]'); if (pp) { pp.style.position='fixed'; pp.style.left='-9999px'; pp.style.top='-9999px'; pp.style.opacity='0'; } }
      var overlay = document.querySelector('.popup-overlay, .modal-overlay, .overlay');
      if (overlay) overlay.style.display = 'none';
    }
    // Wait for modal to init, then fill and submit
    setTimeout(function() {
      var nameField = qForm.querySelector('[name="ProductQuick[delivery_name]"]');
      var phoneField = qForm.querySelector('[name="ProductQuick[delivery_phone]"]');
      var emailField = qForm.querySelector('[name="ProductQuick[delivery_email]"]');
      if (nameField) nameField.value = n;
      // Strip +38 prefix - Horoshop mask adds it automatically
      var cleanPhone = p.replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.startsWith('+38')) cleanPhone = cleanPhone.substring(3);
      else if (cleanPhone.startsWith('38') && cleanPhone.length > 10) cleanPhone = cleanPhone.substring(2);
      if (!cleanPhone.startsWith('0') && cleanPhone.length === 9) cleanPhone = '0' + cleanPhone;
      if (phoneField) phoneField.value = cleanPhone;
      if (emailField) { emailField.value = cleanPhone.replace(/^0/,'') + '@pay.apple-people.com.ua'; }
      [nameField, phoneField, emailField].forEach(function(f) {
        if (f) { f.dispatchEvent(new Event('input',{bubbles:true})); f.dispatchEvent(new Event('change',{bubbles:true})); }
      });
      var submitBtn = qForm.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.click(); else qForm.submit();
    }, 500);
  });

  ['fpm-n', 'fpm-p'].forEach(function(id) {
    document.getElementById(id).addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('fpm-go').click();
    });
  });
})();
