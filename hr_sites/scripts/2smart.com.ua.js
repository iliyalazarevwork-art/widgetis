// source: https://2smart.com.ua/
// extracted: 2026-05-07T21:20:33.723Z
// scripts: 3

// === script #1 (length=1624) ===
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
  const insertAfterSelector = $('.product-order').length ? '.product-order__block--buy' :
                             $('.product-card__purchase').length ? '.product-card__buy-button' : null;


  if (insertAfterSelector && !$('#credit-paylater').length) {
    $(insertAfterSelector).after('<div class="btn __special" id="credit-paylater"><span class="btn-content">ПлатиПізніше<span/></div>');
  }


  $(document).on("click", "#credit-paylater", function () {
    let article = $('meta[itemprop="sku"]').attr('content').trim() || '';    
    let name = $('h1[itemprop="name"]').text().trim() || 'Без назви';
    let price = parseFloat(($('meta[itemprop="price"]').attr('content') || '0').replace(',', '.')).toFixed(2);
    let credit_data = {
      id: article,
      name: name,
      price: price
    };
    console.log('Дані для buyInCredit:', credit_data);
    if (typeof buyInCredit === 'function') {
          let customerEmail = 'manager2smart@gmail.com'; // TODO: замінити на реальний email
          buyInCredit(price, article, name, customerEmail);
    } else {
      console.warn("Функція buyInCredit не знайдена. Перевірте, чи підключено start.js");
    }
  });
});

// === script #2 (length=1773) ===
document.addEventListener('DOMContentLoaded', function () {
  function initQuickCheckoutWebhook() {
    const form = document.querySelector('#checkout-quick form');
    if (!form || form.dataset.webhookAttached === 'true') return;

    form.dataset.webhookAttached = 'true';

    form.addEventListener('submit', function () {
      setTimeout(() => {
        const formData = new FormData(form);
        const name = formData.get('name') || 'Без імені';

        // 🧼 Очистка номера телефону
        const rawPhone = formData.get('phone') || '';
        const phone = rawPhone.replace(/[^\d+]/g, ''); // лишає тільки цифри і +

        const productTitle = document.querySelector('.product-title')?.innerText || 'Невідомий товар';
        const pageUrl = window.location.href;

        const payload = {
          name: name,
          phone: phone,
          comment: `Швидке замовлення з сайту\nТовар: ${productTitle}\nСторінка: ${pageUrl}`
        };

        fetch('https://api.keepincrm.com/callbacks/webhook/hHwkRrbcJrOa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
        .then(res => res.text())
        .then(response => {
          console.log('✅ Відповідь від KeepinCRM:', response);
        })
        .catch(err => {
          console.error('❌ Webhook помилка:', err);
        });
      }, 300);
    });
  }

  const observer = new MutationObserver(() => {
    const modal = document.querySelector('#checkout-quick');
    if (modal && modal.style.display !== 'none') {
      initQuickCheckoutWebhook();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
});

// === script #3 (length=1432) ===
document.addEventListener('DOMContentLoaded', function () {
  function attachCallbackFormHandler(form) {
    if (!form || form.dataset.webhookAttached === 'true') return;
    form.dataset.webhookAttached = 'true';

    form.addEventListener('submit', function () {
      setTimeout(() => {
        const formData = new FormData(form);
        const name = formData.get('form[title]') || formData.get('name') || 'Без імені';
        const rawPhone = formData.get('form[phone]') || formData.get('phone') || '';
        const phone = rawPhone.replace(/[^\d+]/g, '');
        const pageUrl = formData.get('form[url]') || window.location.href;

        const payload = {
          call_title: name,
          call_phone: phone,
          comment: `Зворотній дзвінок з сайту\nСторінка: ${pageUrl}`
        };

        fetch('https://raspy-leaf-3f46.tomiukfreelancer.workers.dev/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }, 300);
    });
  }

  function scanAndAttach() {
    ['#call-me form', '#callback-form form'].forEach(selector => {
      const form = document.querySelector(selector);
      attachCallbackFormHandler(form);
    });
  }

  scanAndAttach();

  const observer = new MutationObserver(scanAndAttach);
  observer.observe(document.body, { childList: true, subtree: true });
});
