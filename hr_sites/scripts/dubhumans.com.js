// source: https://dubhumans.com/
// extracted: 2026-05-07T21:18:53.900Z
// scripts: 1

// === script #1 (length=15805) ===
(function () {
  if (window.hsUnlockLoaded) return;
  window.hsUnlockLoaded = true;

  var CONFIG = {
    shipping:    3000,
    giftKeyword: 'pixel',
    sockImg: 'https://dubhumans.com/content/images/35/896x1195l80mc0/socks-pixel-white-35-39-22453812886152.webp'
  };

  var green  = '#3d9142'; var greenL = '#edf7ee';
  var border = '#e0e0e0'; var text   = '#1a1a1a'; var muted = '#888';
  var red    = '#c0392b'; var redL   = '#fdf0ee';
  var amber  = '#d4770a'; var amberL = '#fef5e7';
  var O = '\x3C'; var C = '\x3E';

  var isRendering = false; var wasUnlocked = false;
  var lastState = ''; var debounceTimer = null;

  function readTotal() {
    var el = document.querySelector('.j-total-sum');
    if (!el) return 0;
    return parseFloat(el.textContent.replace(/\s+/g,'').replace(',','.').replace(/[^\d.]/g,'')) || 0;
  }

  function fmt(n) {
    return Math.ceil(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  }

  function socksInCart() {
    var items = document.querySelectorAll('.j-cart-product, .cart-item');
    for (var i=0;i<items.length;i++) {
      if (items[i].textContent.toLowerCase().indexOf(CONFIG.giftKeyword)!==-1) return true;
    }
    return false;
  }

  function isCOD() {
    var sel = document.querySelector('.j-payment-type');
    if (!sel) return false;
    var opt = sel.options[sel.selectedIndex];
    return opt ? opt.text.toLowerCase().indexOf('\u043d\u0430\u043a\u043b\u0430\u0434\u0435\u043d\u0438\u0439') !== -1 : false;
  }

  function fixOverflow() {
    var order = document.querySelector('section.order');
    if (order) order.style.overflow = 'visible';
  }

  function div(style, content) {
    return O+'div style="'+style+'"'+C+content+O+'/div'+C;
  }

  function render() {
    if (isRendering) return;
    try {
      var totalEl = document.querySelector('.j-total-sum');
      var anchor  = document.querySelector('.order-details__total') || totalEl;
      if (!anchor || !totalEl) return;

      var total = readTotal();
      if (total <= 0) return;

      fixOverflow();

      var isOpen     = total >= CONFIG.shipping;
      var hasSocks   = socksInCart();
      var codPayment = isCOD();
      var remain     = CONFIG.shipping - total;
      var pct        = Math.min(100, Math.round(total/CONFIG.shipping*100));
      var isComplete = isOpen && hasSocks && !codPayment;
      var isWarning  = !isOpen && hasSocks;

      if (isOpen) wasUnlocked = true;

      var state = isComplete+'|'+isOpen+'|'+isWarning+'|'+pct+'|'+codPayment;
      if (state === lastState && document.getElementById('hs-unlock-block')) return;
      lastState = state;

      var block;

      // ── COD (накладений платіж) ───────────────────────────
if (isOpen && codPayment) {
  block = O+'div id="hs-unlock-block" style="background:'+amberL+';border:1.5px solid '+amber+';border-radius:10px;padding:20px 16px;margin-top:10px;font-family:sans-serif;text-align:center;box-shadow:0 0 0 4px '+amber+'18"'+C

    + div('font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:'+amber+';margin-bottom:8px','\u26A0\uFE0F \u041c\u0430\u0439\u0436\u0435!')
    + div('font-size:20px;font-weight:800;color:'+text+';margin-bottom:6px','\u0411\u043e\u043d\u0443\u0441\u0438 \u0432\u0436\u0435 \u0442\u0432\u043e\u0457 \u2014 \u0430\u043b\u0435...')
    + div('font-size:15px;font-weight:800;color:'+amber+';line-height:1.4;margin-bottom:14px','\u041b\u0438\u0448\u0438\u043b\u043e\u0441\u044c \u043e\u0431\u0440\u0430\u0442\u0438 \u043e\u043d\u043b\u0430\u0439\u043d \u043e\u043f\u043b\u0430\u0442\u0443')

    + O+'div style="display:flex;gap:16px;justify-content:center;margin-bottom:16px"'+C
+ div('font-size:13px;font-weight:600;color:'+amber,'✓ \u0411\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0430 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0430')
+ div('font-size:13px;font-weight:600;color:'+amber,'✓ Limited drop')
+ O+'/div'+C

    + O+'div style="height:1px;background:#fde5c0;margin-bottom:16px"'+C+O+'/div'+C

    + O+'img src="'+CONFIG.sockImg+'" style="width:130px;height:auto;border-radius:8px;margin:0 auto 12px;display:block;opacity:.5" onerror="this.style.display=\'none\'"'+C
    + div('font-size:15px;font-weight:800;color:'+text+';margin-bottom:6px','\u0448\u043a\u0430\u0440\u043f\u0435\u0442\u043a\u0438 Pixel \u0432\u0456\u0434 Dubhumans \u00b7 1 \u043f\u0430\u0440\u0430')
    + div('display:inline-block;padding:3px 12px;background:#fff3e0;border:1px solid '+amber+';border-radius:20px;font-size:11px;color:'+amber+';font-weight:700;margin-bottom:10px','limited \u00b7 \u043d\u0435 \u043f\u0440\u043e\u0434\u0430\u0454\u0442\u044c\u0441\u044f \u043d\u0430 \u0441\u0430\u0439\u0442\u0456')
    + div('font-size:12px;color:'+muted,'\u041c\u0435\u043d\u0435\u0434\u0436\u0435\u0440 \u0437\u0432\u2019\u044f\u0436\u0435\u0442\u044c\u0441\u044f \u0434\u043b\u044f \u0443\u0442\u043e\u0447\u043d\u0435\u043d\u043d\u044f \u0440\u043e\u0437\u043c\u0456\u0440\u0443')

    + O+'/div'+C;

      // ── COMPLETE ──────────────────────────────────────────
      } else if (isComplete) {
        block = O+'div id="hs-unlock-block" style="background:'+greenL+';border:1.5px solid '+green+';border-radius:10px;padding:20px 16px;margin-top:10px;font-family:sans-serif;text-align:center;box-shadow:0 0 0 4px '+green+'18"'+C
          + div('font-size:28px;margin-bottom:6px','\uD83C\uDF89')
          + div('font-size:16px;font-weight:800;color:'+green+';margin-bottom:6px','\u0422\u043e\u0431\u0456 \u0446\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044c!')
          + div('font-size:13px;color:#2d6e32;line-height:1.5;margin-bottom:14px','\u0411\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0430 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0430 \u0430\u043a\u0442\u0438\u0432\u043e\u0432\u0430\u043d\u0430'+O+'br'+C+'\u0456 limited drop \u0432\u0436\u0435 \u0443 \u0442\u0432\u043e\u0454\u043c\u0443 \u043a\u043e\u0448\u0438\u043a\u0443')
          + O+'div style="display:flex;gap:8px;justify-content:center"'+C
          + div('padding:6px 12px;background:#fff;border:1px solid '+green+';border-radius:20px;font-size:11px;font-weight:600;color:'+green,'\uD83D\uDE9A \u0411\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0430 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0430')
          + div('padding:6px 12px;background:#fff;border:1px solid '+green+';border-radius:20px;font-size:11px;font-weight:600;color:'+green,'\uD83E\uDDE6 Limited drop')
          + O+'/div'+C
          + O+'/div'+C;

      // ── UNLOCKED ──────────────────────────────────────────
      } else if (isOpen) {
  block = O+'div id="hs-unlock-block" style="background:#fff;border:1.5px solid '+green+';border-radius:10px;padding:20px 16px;margin-top:10px;font-family:sans-serif;text-align:center;box-shadow:0 0 0 4px '+green+'18"'+C

    + div('font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:'+green+';margin-bottom:8px','\uD83D\uDD13 \u0420\u043e\u0437\u0431\u043b\u043e\u043a\u043e\u0432\u0430\u043d\u043e')
    + div('font-size:20px;font-weight:800;color:'+text+';margin-bottom:4px','\u0411\u043e\u043d\u0443\u0441\u0438 \u0437\u0430\u0441\u0442\u043e\u0441\u043e\u0432\u0430\u043d\u043e!')
    + div('font-size:13px;color:'+muted+';margin-bottom:14px','\u043c\u043e\u0436\u0435\u0448 \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0438\u0442\u0438 \u0434\u043e \u043e\u043f\u043b\u0430\u0442\u0438')

   + O+'div style="display:flex;gap:16px;justify-content:center;margin-bottom:16px"'+C
+ div('font-size:13px;font-weight:600;color:'+green,'✓ \u0411\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0430 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0430')
+ div('font-size:13px;font-weight:600;color:'+green,'✓ Limited drop')
+ O+'/div'+C

    + O+'div style="height:1px;background:#e8f5e9;margin-bottom:16px"'+C+O+'/div'+C

    + O+'img src="'+CONFIG.sockImg+'" style="width:130px;height:auto;border-radius:8px;margin:0 auto 12px;display:block" onerror="this.style.display=\'none\'"'+C
    + div('font-size:15px;font-weight:800;color:'+text+';margin-bottom:6px','\u0448\u043a\u0430\u0440\u043f\u0435\u0442\u043a\u0438 Pixel \u0432\u0456\u0434 Dubhumans \u00b7 1 \u043f\u0430\u0440\u0430')
    + div('display:inline-block;padding:3px 12px;background:'+greenL+';border:1px solid '+green+';border-radius:20px;font-size:11px;color:'+green+';font-weight:700;margin-bottom:10px','limited \u00b7 \u043d\u0435 \u043f\u0440\u043e\u0434\u0430\u0454\u0442\u044c\u0441\u044f \u043d\u0430 \u0441\u0430\u0439\u0442\u0456')
    + div('font-size:12px;color:'+muted,'\u041c\u0435\u043d\u0435\u0434\u0436\u0435\u0440 \u0437\u0432\u2019\u044f\u0436\u0435\u0442\u044c\u0441\u044f \u0434\u043b\u044f \u0443\u0442\u043e\u0447\u043d\u0435\u043d\u043d\u044f \u0440\u043e\u0437\u043c\u0456\u0440\u0443')

    + O+'/div'+C;

    // ── роздільник ──
    + O+'div style="height:1px;background:#e8f5e9;margin-bottom:16px"'+C+O+'/div'+C

    // ── деталі подарунку ──
    + O+'img src="'+CONFIG.sockImg+'" style="width:130px;height:auto;border-radius:8px;margin:0 auto 12px;display:block" onerror="this.style.display=\'none\'"'+C
    + div('font-size:15px;font-weight:800;color:'+text+';margin-bottom:6px','\u0448\u043a\u0430\u0440\u043f\u0435\u0442\u043a\u0438 Pixel \u0432\u0456\u0434 Dubhumans \u00b7 1 \u043f\u0430\u0440\u0430')
    + div('display:inline-block;padding:2px 10px;background:'+greenL+';border:1px solid '+green+';border-radius:20px;font-size:10px;color:'+green+';font-weight:700;margin-bottom:10px','limited \u00b7 \u043d\u0435 \u043f\u0440\u043e\u0434\u0430\u0454\u0442\u044c\u0441\u044f \u043d\u0430 \u0441\u0430\u0439\u0442\u0456')
    + div('font-size:12px;color:'+muted,'\u041c\u0435\u043d\u0435\u0434\u0436\u0435\u0440 \u0437\u0432\u2019\u044f\u0436\u0435\u0442\u044c\u0441\u044f \u0434\u043b\u044f \u0443\u0442\u043e\u0447\u043d\u0435\u043d\u043d\u044f \u0440\u043e\u0437\u043c\u0456\u0440\u0443')

    + O+'/div'+C;

      // ── WARNING ───────────────────────────────────────────
      } else if (isWarning) {
        block = O+'div id="hs-unlock-block" style="background:'+redL+';border:1.5px solid '+red+';border-radius:10px;padding:18px 16px;margin-top:10px;font-family:sans-serif;text-align:center;box-shadow:0 0 0 4px '+red+'18"'+C
          + div('font-size:22px;margin-bottom:8px','\uD83D\uDCAA')
          + div('font-size:14px;font-weight:800;color:'+red+';margin-bottom:6px','\u0422\u0438 \u0449\u0435 \u043c\u043e\u0436\u0435\u0448 \u0446\u0435 \u0437\u0440\u043e\u0431\u0438\u0442\u0438')
          + div('font-size:12px;color:'+red+';line-height:1.5;margin-bottom:14px','\u0420\u043e\u0437\u0431\u043b\u043e\u043a\u0443\u0439 \u0431\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0443 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0443'+O+'br'+C+'\u0456 limited drop')
          + O+'div style="height:4px;background:#f5c6c0;border-radius:2px;overflow:hidden;margin-bottom:6px"'+C
          + O+'div style="height:100%;width:'+pct+'%;background:'+red+';border-radius:2px"'+C+O+'/div'+C
          + O+'/div'+C
          + O+'div style="display:flex;justify-content:space-between;font-size:10px;color:'+red+';opacity:.8;margin-bottom:8px"'+C
          + O+'span'+C+fmt(total)+' \u0433\u0440\u043d'+O+'/span'+C
          + O+'span'+C+'3 000 \u0433\u0440\u043d'+O+'/span'+C
          + O+'/div'+C
          + div('font-size:11px;color:'+red+';opacity:.7','\u0429\u0435 '+O+'strong'+C+fmt(remain)+' \u0433\u0440\u043d'+O+'/strong'+C+' \u0434\u043e \u0440\u043e\u0437\u0431\u043b\u043e\u043a\u0443\u0432\u0430\u043d\u043d\u044f')
          + O+'/div'+C;

      // ── LOCKED ────────────────────────────────────────────
      } else {
        block = O+'div id="hs-unlock-block" style="background:#fff;border:1px solid '+border+';border-radius:10px;padding:18px 16px;margin-top:10px;font-family:sans-serif;text-align:center"'+C
          + (wasUnlocked ? div('font-size:12px;font-weight:600;color:'+muted+';margin-bottom:8px','\uD83D\uDCAA \u0422\u0438 \u0449\u0435 \u043c\u043e\u0436\u0435\u0448 \u0446\u0435 \u0437\u0440\u043e\u0431\u0438\u0442\u0438') : '')
          + div('font-size:17px;font-weight:800;color:'+text+';margin-bottom:6px','\uD83D\uDD12 \u0429\u0435 '+fmt(remain)+' \u0433\u0440\u043d \u0434\u043e \u0431\u043e\u043d\u0443\u0441\u0456\u0432')
          + div('font-size:12px;color:'+muted+';margin-bottom:14px','\u0420\u043e\u0437\u0431\u043b\u043e\u043a\u0443\u0439 \u0431\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0443 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0443'+O+'br'+C+'\u0442\u0430 \u043f\u043e\u0434\u0430\u0440\u0443\u043d\u043e\u043a (limited drop)')
          + O+'div style="height:4px;background:#f0f0f0;border-radius:2px;overflow:hidden;margin-bottom:8px"'+C
          + O+'div style="height:100%;width:'+pct+'%;background:'+green+';border-radius:2px;transition:width .5s ease"'+C+O+'/div'+C
          + O+'/div'+C
          + div('font-size:11px;color:'+muted+';margin-bottom:14px','\u0417\u0430\u043b\u0438\u0448\u0438\u043b\u043e\u0441\u044c: '+O+'strong style="color:'+text+'"'+C+fmt(remain)+' \u0433\u0440\u043d'+O+'/strong'+C)
          + O+'div style="display:flex;gap:8px;justify-content:center"'+C
          + div('padding:6px 12px;background:#f5f5f5;border-radius:20px;font-size:11px;color:'+muted,'\uD83D\uDE9A \u0411\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0430 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0430')
          + div('padding:6px 12px;background:#f5f5f5;border-radius:20px;font-size:11px;color:'+muted,'\uD83E\uDDE6 Limited drop')
          + O+'/div'+C
          + O+'/div'+C;
      }

      isRendering = true;
      var old = document.getElementById('hs-unlock-block');
      if (old) old.parentNode.removeChild(old);
      anchor.insertAdjacentHTML('afterend', block);

    } catch(err) {
      console.warn('[hs-unlock] error:', err);
    } finally {
      isRendering = false;
    }
  }

  function scheduleRender() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(render, 300);
  }

  function startObservers() {
    new MutationObserver(function(mutations) {
      if (isRendering) return;
      for (var i=0;i<mutations.length;i++) {
        var t = mutations[i].target;
        if (t && t.id==='hs-unlock-block') return;
        if (t && t.parentNode && t.parentNode.id==='hs-unlock-block') return;
      }
      scheduleRender();
    }).observe(document.body, { childList:true, subtree:true });

    var te = document.querySelector('.j-total-sum');
    if (te) new MutationObserver(scheduleRender).observe(te, { characterData:true, subtree:true, childList:true });

    // Слухаємо зміну способу оплати
    var payEl = document.querySelector('.j-payment-type');
    if (payEl) payEl.addEventListener('change', scheduleRender);

    setInterval(function() {
      if (!isRendering && !document.getElementById('hs-unlock-block')) render();
    }, 1000);
  }

  function waitForAnchor() {
    var observer = new MutationObserver(function() {
      var totalEl = document.querySelector('.j-total-sum');
      var anchor  = document.querySelector('.order-details__total') || totalEl;
      if (!anchor || !totalEl) return;
      observer.disconnect();
      render();
      startObservers();
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  var totalEl = document.querySelector('.j-total-sum');
  var anchor  = document.querySelector('.order-details__total') || totalEl;

  if (anchor && totalEl) { render(); startObservers(); }
  else { waitForAnchor(); }

})();
