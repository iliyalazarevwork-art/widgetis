// source: https://reclaire-cosmetica.com/
// extracted: 2026-05-07T21:20:26.514Z
// scripts: 1

// === script #1 (length=607) ===
(function () {
  var p = new URLSearchParams(window.location.search);
  var fbclid = p.get('fbclid');
  if (!fbclid) return;

  // Не створюй кукі повторно, якщо вже є
  if (document.cookie.indexOf('_fbc=') !== -1) return;

  // Формат кукі _fbc: fb.1.<timestamp>.<fbclid>
  var fbcValue = 'fb.1.' + Date.now() + '.' + fbclid;

  // Кукі на 2 роки, на весь домен
  var domain = location.hostname.replace(/^www\./, '');
  document.cookie = '_fbc=' + fbcValue +
    '; path=/' +
    '; domain=' + domain +
    '; max-age=' + (60*60*24*730).toString() + // ~2 роки
    '; SameSite=Lax';
})();
