// source: https://vivabag.pro/
// extracted: 2026-05-07T21:23:08.832Z
// scripts: 1

// === script #1 (length=895) ===
(function () {
  // Виконується тільки на сторінці успішного оформлення
  if (!/checkout\/success|order\/success|success/.test(window.location.href)) return;
  if (typeof ttq === 'undefined') return;

  // Шукаємо суму біля тексту "Всього" або "Разом"
  var total = null;
  document.querySelectorAll('body *').forEach(function (el) {
    var text = (el.textContent || '').toLowerCase();
    if ((text.includes('всього') || text.includes('разом')) && /\d+/.test(text)) {
      var match = text.match(/[\d\s.,]+/);
      if (match) {
        total = parseFloat(match[0].replace(/\s/g, '').replace(',', '.'));
      }
    }
  });

  if (total) {
    ttq.track('Purchase', {
      value: total,
      currency: 'UAH'
    });
    console.log('[TikTok] Purchase event sent:', total, 'UAH');
  } else {
    console.warn('[TikTok] Не вдалося знайти суму замовлення');
  }
})();
