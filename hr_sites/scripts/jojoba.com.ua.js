// source: https://jojoba.com.ua/
// extracted: 2026-05-07T21:19:34.033Z
// scripts: 2

// === script #1 (length=5967) ===
(function(){
  "use strict";
  var FREE_SHIPPING_THRESHOLD = 2600;
  var CURRENCY = "грн";
  var COLORS = { track:"#ececec", fill:"#E78692", text:"#333", card:"#fff" };
  function injectStylesOnce(){
    if (document.getElementById("fs-progress-style")) return;
    var s = document.createElement("style");
    s.id = "fs-progress-style";
    s.textContent =
      ".fs-card{background:"+COLORS.card+";border:1px solid #e6e6e6;border-radius:10px;padding:10px 12px;margin:12px 0}"+
      ".fs-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;color:"+COLORS.text+";font-size:14px;font-weight:600}"+
      ".fs-track{height:12px;background:"+COLORS.track+";border-radius:999px;overflow:hidden}"+
      ".fs-fill{height:100%;width:0;background:"+COLORS.fill+";border-radius:999px;transition:width .3s ease}"+
      ".fs-ok{color:#1a7f37}"+
      "@media(max-width:768px){.fs-track{height:10px}}";
    document.head.appendChild(s);
  }
  function parseNumber(text){
    if(!text) return 0;
    var m = String(text).replace(/\u00A0/g," ").match(/([\d\s]+(?:[.,]\d+)?)/);
    if(!m) return 0;
    return Number(m[1].replace(/\s/g,"").replace(",", ".")) || 0;
  }
  function subtotalFrom(el){
    return parseNumber(el && el.textContent);
  }
  function mkCard(){
    var d = document.createElement("div");
    d.className = "fs-card";
    d.innerHTML =
      '<div class="fs-row"><span class="fs-text"></span></div>'+
      '<div class="fs-track"><div class="fs-fill"></div></div>';
    return d;
  }
  function render(card, subtotal){
    var left = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
    var perc = Math.min(100, Math.round(subtotal / FREE_SHIPPING_THRESHOLD * 100));
    card.querySelector(".fs-fill").style.width = perc + "%";
    var t = card.querySelector(".fs-text");
    if (left > 0){
      t.textContent = "До безкоштовної доставки залишилось: " + left.toFixed(0) + " " + CURRENCY;
      t.classList.remove("fs-ok");
    } else {
      t.textContent = "Безкоштовна доставка активна ✅";
      t.classList.add("fs-ok");
    }
  }
  function findCartContexts(){
    var list = [];
    document.querySelectorAll(".cart").forEach(function(cart){
      var total = cart.querySelector(".j-total-sum");
      var anchor = cart.querySelector(".cart-buttons");
      if (total && anchor){
        list.push({ root: cart, anchorBefore: anchor, totalEl: total, kind: "legacy" });
      }
    });
    document.querySelectorAll("#cart.cart__container, .cart__container").forEach(function(box){
      var root = box.querySelector(".cart__content") || box;
      var total = root.querySelector(".cart__summary .j-total-sum, .cart__total-price.j-total-sum");
      var orderBlock = root.querySelector(".cart__order");
      if (!orderBlock){
        var btn = root.querySelector('[data-checkout-link], a[href="/checkout/"]');
        if (btn) orderBlock = btn.closest(".cart__order") || btn.parentElement;
      }
      if (total && orderBlock){
        list.push({ root: root, anchorBefore: orderBlock, totalEl: total, kind: "mobile" });
      }
    });
    return list;
  }
  var ctxStore = new WeakMap();
  function ensureCard(ctx){
    injectStylesOnce();
    var cards = ctx.root.querySelectorAll(".fs-card");
    for (var i=1;i<cards.length;i++) cards[i].remove();
    var card = cards[0];
    if (!card){
      card = mkCard();
      ctx.anchorBefore.insertAdjacentElement("beforebegin", card);
    }
    render(card, subtotalFrom(ctx.totalEl));
    return card;
  }
  function attach(ctx){
    if (!ctx || !ctx.root) return;
    ensureCard(ctx);
    if (ctxStore.has(ctx.root)) return;
    var state = { ctx: ctx };
    var raf1 = 0;
    state.totalObs = new MutationObserver(function(){
      cancelAnimationFrame(raf1);
      raf1 = requestAnimationFrame(function(){
        var card = ctx.root.querySelector(".fs-card");
        if (card) render(card, subtotalFrom(ctx.totalEl));
      });
    });
    state.totalObs.observe(ctx.totalEl, {childList:true, characterData:true, subtree:true});
    var raf2 = 0;
    state.rootObs = new MutationObserver(function(){
      cancelAnimationFrame(raf2);
      raf2 = requestAnimationFrame(function(){
        var freshList = findCartContexts().filter(function(c){ return c.root === ctx.root; });
        var fresh = freshList[0];
        if (fresh){
          ctx = fresh; state.ctx = fresh;
          ensureCard(fresh);
          if (state.totalObs) state.totalObs.disconnect();
          state.totalObs = new MutationObserver(function(){
            var raf3=0;
            return function(){
              cancelAnimationFrame(raf3);
              raf3 = requestAnimationFrame(function(){
                var card = fresh.root.querySelector(".fs-card");
                if (card) render(card, subtotalFrom(fresh.totalEl));
              });
            };
          }());
          state.totalObs.observe(fresh.totalEl, {childList:true, characterData:true, subtree:true});
        }
      });
    });
    state.rootObs.observe(ctx.root, {childList:true, subtree:true});
    ctxStore.set(ctx.root, state);
  }
  var scanRaf = 0;
  function scan(){
    cancelAnimationFrame(scanRaf);
    scanRaf = requestAnimationFrame(function(){
      findCartContexts().forEach(attach);
    });
  }
  window.addEventListener("load", scan);
  var bodyObs = new MutationObserver(scan);
  bodyObs.observe(document.documentElement, {childList:true, subtree:true});
  document.addEventListener("click", function(e){
    var t = e.target.closest && e.target.closest(".j-increase-p, .j-decrease-p, .j-remove-p, .j-coupon-submit, .j-coupon-add, [data-checkout-link], a[href='/checkout/'], [data-panel], [data-panel-close], .btn");
    if (t) setTimeout(scan, 200);
  });
  var tries=0, tick=setInterval(function(){ tries++; scan(); if (tries>12) clearInterval(tick); }, 400);
})();

// === script #2 (length=902) ===
(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'9f8343743da3bf76',t:'MTc3ODE4ODc3Mg=='};var a=document.createElement('script');a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
