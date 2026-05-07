// source: https://growtek.com.ua/
// extracted: 2026-05-07T21:19:13.621Z
// scripts: 2

// === script #1 (length=1111) ===
window.renderOptIn = function() {
  // Проверяем, что мы на странице оформления заказа
  if (!/\/checkout\/complete/i.test(location.pathname)) return;

  // 1. Номер заказа из заголовка "Замовлення №97"
  var orderIdMatch = document.body.innerText.match(/Замовлення\s*№\s*(\d+)/i);
  var orderId = orderIdMatch ? orderIdMatch[1] : "";

  // 2. Email из блока "Е-пошта"
  var emailMatch = document.body.innerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  var email = emailMatch ? emailMatch[0] : "";

  // 3. Страна — фиксированно UA
  var country = "UA";

  // 4. Дата доставки (сегодня +3 дня)
  var eta = new Date();
  eta.setDate(eta.getDate() + 3);
  var etaStr = eta.toISOString().slice(0,10);

  // Если нет данных — не запускаем
  if (!orderId || !email) return;

  // 5. Отправка в Google Customer Reviews
  window.gapi.load('surveyoptin', function() {
    window.gapi.surveyoptin.render({
      merchant_id: 5630843549,
      order_id: orderId,
      email: email,
      delivery_country: country,
      estimated_delivery_date: etaStr
    });
  });
};

// === script #2 (length=1111) ===
window.renderOptIn = function() {
  // Проверяем, что мы на странице оформления заказа
  if (!/\/checkout\/complete/i.test(location.pathname)) return;

  // 1. Номер заказа из заголовка "Замовлення №97"
  var orderIdMatch = document.body.innerText.match(/Замовлення\s*№\s*(\d+)/i);
  var orderId = orderIdMatch ? orderIdMatch[1] : "";

  // 2. Email из блока "Е-пошта"
  var emailMatch = document.body.innerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  var email = emailMatch ? emailMatch[0] : "";

  // 3. Страна — фиксированно UA
  var country = "UA";

  // 4. Дата доставки (сегодня +3 дня)
  var eta = new Date();
  eta.setDate(eta.getDate() + 3);
  var etaStr = eta.toISOString().slice(0,10);

  // Если нет данных — не запускаем
  if (!orderId || !email) return;

  // 5. Отправка в Google Customer Reviews
  window.gapi.load('surveyoptin', function() {
    window.gapi.surveyoptin.render({
      merchant_id: 5630843549,
      order_id: orderId,
      email: email,
      delivery_country: country,
      estimated_delivery_date: etaStr
    });
  });
};
