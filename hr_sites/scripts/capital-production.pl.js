// source: https://capital-production.pl/
// extracted: 2026-05-07T21:19:39.530Z
// scripts: 1

// === script #1 (length=1045) ===
(function () {
  // Если символы уже есть (тема/скрипт их подгрузил) — ничего не делаем
  if (document.getElementById('icon-cart-outline') && document.getElementById('icon-user-outline')) return;

  var sprite =
    '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden">' +

      // Корзина (outline)
      '<symbol id="icon-cart-outline" viewBox="0 0 24 24">' +
        '<path fill="currentColor" d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 5h2l1.6 8.1A3 3 0 0 0 9.5 16H18a3 3 0 0 0 2.9-2.3L22 7H6.3l-.3-2H3V5zm5.5 9a1 1 0 0 1-1-.8L6.9 9H20l-1.1 4.4a1 1 0 0 1-1 .8H8.5z"/>' +
      '</symbol>' +

      // Пользователь (outline), на всякий случай — у вас рядом иконка профиля
      '<symbol id="icon-user-outline" viewBox="0 0 24 24">' +
        '<path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-7 9v-1a7 7 0 0 1 14 0v1H5z"/>' +
      '</symbol>' +

    '</svg>';

  document.body.insertAdjacentHTML('afterbegin', sprite);
})();
