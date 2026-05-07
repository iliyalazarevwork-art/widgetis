// source: https://stahlpro.com.ua/
// extracted: 2026-05-07T21:22:47.299Z
// scripts: 2

// === script #1 (length=5598) ===
(function() {
  // STAHLPRO Product Page Enhancer — only run on product pages
  if (!document.querySelector('.product-title')) return;

  // ===== 1. Marketplace Badges — insert after product title =====
  var title = document.querySelector('.product-title');
  if (title && !document.querySelector('.sp-mp-badges')) {
    var badges = document.createElement('div');
    badges.className = 'sp-mp-badges';
    badges.innerHTML = '<a href="https://rozetka.com.ua/seller/stahlpro/" target="_blank" class="sp-mp-chip"><span class="sp-mp-logo" style="background:#00B33C">R</span><span class="sp-mp-text">Rozetka \u2605 4.9</span></a><a href="https://epicentrk.ua/" target="_blank" class="sp-mp-chip"><span class="sp-mp-logo" style="background:#FF6900">E</span><span class="sp-mp-text">\u0415\u043f\u0456\u0446\u0435\u043d\u0442\u0440 \u2605 4.8</span></a><span class="sp-mp-chip sp-mp-chip--reviews"><span class="sp-mp-logo sp-mp-logo--dark">\u2605</span><span class="sp-mp-text">500+ \u0432\u0456\u0434\u0433\u0443\u043a\u0456\u0432</span></span>';
    title.parentNode.insertBefore(badges, title.nextSibling);
  }

  // ===== 2. Find the buy section container =====
  var orderSection = document.querySelector('.product__section--order');
  if (!orderSection) return;

  // ===== 3. Stock indicator — insert after buy button =====
  if (!document.querySelector('.sp-stock')) {
    var stock = document.createElement('div');
    stock.className = 'sp-stock';
    stock.innerHTML = '<span class="sp-stock-dot"></span><span>\u0412 \u043d\u0430\u044f\u0432\u043d\u043e\u0441\u0442\u0456 \u2014 \u0432\u0456\u0434\u043f\u0440\u0430\u0432\u043a\u0430 \u0441\u044c\u043e\u0433\u043e\u0434\u043d\u0456</span>';
    orderSection.appendChild(stock);
  }

  // ===== 4. Key Features =====
  if (!document.querySelector('.sp-features')) {
    var feat = document.createElement('div');
    feat.className = 'sp-features';
    feat.innerHTML = '<div class="sp-features-title">\u041a\u043b\u044e\u0447\u043e\u0432\u0456 \u043f\u0435\u0440\u0435\u0432\u0430\u0433\u0438</div><div class="sp-feat-item"><span class="sp-feat-icon">\u26a1</span><span><strong>\u0411\u0435\u0441\u0442\u0441\u0435\u043b\u0435\u0440</strong> \u2014 \u043d\u0430\u0439\u043f\u043e\u043f\u0443\u043b\u044f\u0440\u043d\u0456\u0448\u0430 \u043c\u043e\u0434\u0435\u043b\u044c StahlPro</span></div><div class="sp-feat-item"><span class="sp-feat-icon">\ud83d\udd29</span><span>\u041f\u0440\u0435\u0441\u043e\u0432\u0435 \u0437\u2019\u0454\u0434\u043d\u0430\u043d\u043d\u044f \u2014 <strong>\u0437\u0431\u0456\u0440\u043a\u0430 \u0431\u0435\u0437 \u0431\u043e\u043b\u0442\u0456\u0432 \u0437\u0430 10 \u0445\u0432\u0438\u043b\u0438\u043d</strong></span></div><div class="sp-feat-item"><span class="sp-feat-icon">\ud83d\udcaa</span><span>\u041f\u043e\u0441\u0438\u043b\u0435\u043d\u0438\u0439 \u043a\u0430\u0440\u043a\u0430\u0441 0.6 \u043c\u043c \u2014 <strong>\u0434\u043e 175 \u043a\u0433 \u043d\u0430 \u043f\u043e\u043b\u0438\u0446\u044e</strong></span></div><div class="sp-feat-item"><span class="sp-feat-icon">\ud83c\udfd7\ufe0f</span><span>\u041f\u043e\u043b\u0438\u0446\u0456 \u0437 HDF \u2014 \u043c\u0456\u0446\u043d\u0456\u0448\u0456 \u0437\u0430 \u0414\u0421\u041f \u0442\u0430 \u041c\u0414\u0424</span></div>';
    orderSection.appendChild(feat);
  }

  // ===== 5. Services Grid =====
  if (!document.querySelector('.sp-services')) {
    var serv = document.createElement('div');
    serv.className = 'sp-services';
    serv.innerHTML = '<div class="sp-service"><span class="sp-service-icon">\ud83d\ude9a</span><span>\u0411\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0430 \u0434\u043e\u0441\u0442\u0430\u0432\u043a\u0430</span></div><div class="sp-service"><span class="sp-service-icon">\ud83d\udd04</span><span>\u041f\u043e\u0432\u0435\u0440\u043d\u0435\u043d\u043d\u044f 14 \u0434\u043d\u0456\u0432</span></div><div class="sp-service"><span class="sp-service-icon">\ud83d\udee1\ufe0f</span><span>\u0413\u0430\u0440\u0430\u043d\u0442\u0456\u044f 2 \u0440\u043e\u043a\u0438</span></div><div class="sp-service"><span class="sp-service-icon">\ud83d\udcb3</span><span>\u041e\u043f\u043b\u0430\u0442\u0430 \u043f\u0440\u0438 \u043e\u0442\u0440\u0438\u043c\u0430\u043d\u043d\u0456</span></div>';
    orderSection.appendChild(serv);
  }

  // ===== 6. Bundle Promo =====
  if (!document.querySelector('.sp-bundle-promo')) {
    var bundle = document.createElement('a');
    bundle.className = 'sp-bundle-promo';
    bundle.href = '/metalevi-stelazhi/';
    bundle.innerHTML = '<span class="sp-bundle-badge">\u0412\u0418\u0413\u041e\u0414\u0410</span><span class="sp-bundle-text">\u041a\u0443\u043f\u0443\u0439\u0442\u0435 2+ \u0441\u0442\u0435\u043b\u0430\u0436\u0456 \u2014 <strong>\u0437\u043d\u0438\u0436\u043a\u0430 \u0434\u043e 15%</strong></span><span class="sp-bundle-arrow">\u2192</span>';
    orderSection.appendChild(bundle);
  }

  // ===== 7. Trust Badges =====
  if (!document.querySelector('.sp-trust')) {
    var trust = document.createElement('div');
    trust.className = 'sp-trust';
    trust.innerHTML = '<div class="sp-trust-item">\u2713 \u041e\u0444\u0456\u0446\u0456\u0439\u043d\u0438\u0439 \u0432\u0438\u0440\u043e\u0431\u043d\u0438\u043a</div><div class="sp-trust-item">\u2713 14 \u0434\u043d\u0456\u0432 \u043d\u0430 \u043f\u043e\u0432\u0435\u0440\u043d\u0435\u043d\u043d\u044f</div><div class="sp-trust-item">\u2713 \u0413\u0430\u0440\u0430\u043d\u0442\u0456\u044f 2 \u0440\u043e\u043a\u0438</div>';
    orderSection.appendChild(trust);
  }
})();

// === script #2 (length=654) ===
var _protocol="https:"==document.location.protocol?"https://":"http://";
    _site_hash_code = "199b05553bc4c4f519b4b05a83fb7b39",_suid=66392, plerdyScript=document.createElement("script");
    plerdyScript.setAttribute("defer",""),plerdyScript.dataset.plerdymainscript="plerdymainscript",
    plerdyScript.src="https://a.plerdy.com/public/js/click/main.js?v="+Math.random();
    var plerdymainscript=document.querySelector("[data-plerdymainscript='plerdymainscript']");
    plerdymainscript&&plerdymainscript.parentNode.removeChild(plerdymainscript);
    try{document.head.appendChild(plerdyScript)}catch(t){console.log(t,"unable add script tag")}
