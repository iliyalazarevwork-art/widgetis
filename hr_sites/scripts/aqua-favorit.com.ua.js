// source: https://aqua-favorit.com.ua/
// extracted: 2026-05-07T21:18:57.658Z
// scripts: 2

// === script #1 (length=679) ===
window.fbAsyncInit = function() {
                FB.init({
                    appId            : '476683296008387',
                    autoLogAppEvents : true,
                    xfbml            : true,
                    version          : 'v2.12'
                });
            };
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

// === script #2 (length=2021) ===
// === Налаштування параметрів розстрочки ===
var pl_options = {
  pl_type: 2,                     // Тип розстрочки
  pl_n1: "Три платежі",           // Варіант 1
  pl_n2: "Шість платежів",        // Варіант 2
  pl_n3: "Десять платежів",       // Варіант 3
  pl_bc: "#4e6bb2",               // Колір основного оформлення (блакитний)
  lang: "ukr"                     // Мова: ukr або ru
};

$(function () {
  // === Перевіряємо, що це сторінка товару ===
  if ($('.product-order').length > 0 && !$('#credit-paylater').length) {
    // Вставляємо кнопку "Кредит Online" після блоку "Купити"
    $('.product-order__block--buy').after(
      '<div id="credit-paylater">Кредит Online</div>'
    );
  }

  // === Обробка кліку по кнопці ===
  $(document).on("click", "#credit-paylater", function () {
    // --- Отримуємо артикул товару з DOM ---
    let rawText = $('.product-header__code').text() || '';
    let article = rawText
      .replace(/Артикул/g, '')     // Прибираємо слово "Артикул"
      .replace(/["\s]/g, '')       // Прибираємо лапки та пробіли
      .trim();                     // Прибираємо зайві пробіли

    // --- Отримуємо назву товару ---
    let name = $('.product-title').text().trim() || 'Без назви';

    // --- Отримуємо ціну з мета-тега schema.org ---
    let price = parseFloat(($('meta[itemprop="price"]').attr('content') || '0').replace(',', '.')).toFixed(2);

    // --- Формуємо дані для PayLate ---
    let credit_data = {
      id: article,
      name: name,
      price: price
    };

    // Виводимо дані в консоль для перевірки
    console.log('Дані для buyInCredit:', credit_data);

    // --- Викликаємо функцію PayLate ---
    if (typeof buyInCredit === 'function') {
	  let customerEmail = 'info.aquafavorit@gmail.com'; // TODO: замінити на реальний email
	  buyInCredit(price, article, name, customerEmail);
    } else {
      console.warn("Функція buyInCredit не знайдена. Перевірте, чи підключено start.js");
    }
  });
});
