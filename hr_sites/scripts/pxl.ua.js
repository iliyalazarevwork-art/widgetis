// source: https://pxl.ua/
// extracted: 2026-05-07T21:19:02.133Z
// scripts: 3

// === script #1 (length=1565) ===
// === Налаштування параметрів розстрочки ===
var pl_options = {
  pl_type: 2,                     // Тип розстрочки
  pl_n1: "Три платежі",           // Варіант 1
  pl_n2: "Шість платежів",        // Варіант 2
  pl_n3: "Десять платежів",       // Варіант 3
  pl_bc: "#44009a",               // Колір основного оформлення (фіолетовий)
  lang: "ukr"                     // Мова: ukr або ru
};


$(function () {
  const insertAfterSelector = $('.product-order').length ? '.product-order__block--buy' :
                             $('.product-card__purchase').length ? '.product-card__buy-button' : null;


  if (insertAfterSelector && !$('#credit-paylater').length) {
    $(insertAfterSelector).after('<div id="credit-paylater">Розстрочка</div>');
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
          let customerEmail = 'shop.pix3l@gmail.com'; // TODO: замінити на реальний email
          buyInCredit(price, article, name, customerEmail);
    } else {
      console.warn("Функція buyInCredit не знайдена. Перевірте, чи підключено start.js");
    }
  });
});

// === script #2 (length=1336) ===
const buttons = document.querySelectorAll('.grade-btn');
    const infoText = document.getElementById('grade-status-info');

    const statusTexts = {
      "A+": "Клас A+: ідеальний стан, як новий. Комплектується оригінальною або фірмовою коробкою нашої розробки. Повністю протестований, всі функції справні.",
      "A": "Клас A: відмінний стан. Можуть бути незначні сліди користування. Комплектується фірмовою коробкою нашої розробки. Повністю протестований, всі функції справні.",
      "A-": "Клас A-: хороший стан. Можуть бути присутні потертості та не глибокі подряпини на корпусі/екрані, можливі незначні точкові засвіти екрану.  Комплектується фірмовою коробкою нашої розробки. Повністю протестований, всі функції справні.",
      "B": "Клас B: задовільний стан. Можуть бути присутні глибокими потертості/подряпини на корпусі/екрані, можливі суттєві засвіти екрану. Комплектується фірмовою коробкою нашої розробки. Повністю протестований."
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const status = btn.dataset.status;
        infoText.textContent = statusTexts[status];
      });
    });

    // По замовчуванню активуємо A+
    buttons[0].classList.add('active');

// === script #3 (length=1007) ===
document.addEventListener('DOMContentLoaded', () => {
            const galleryItems = document.querySelectorAll('.pixel-card');
            const modal = document.getElementById('image-modal');
            const modalImage = document.getElementById('modal-image');

            // Функція для перевірки ширини екрана
            function isMobile() {
                return window.innerWidth < 768;
            }

            galleryItems.forEach(item => {
                item.addEventListener('click', () => {
                    // Перевіряємо, чи це не мобільний пристрій
                    if (!isMobile()) {
                        const imageUrl = item.getAttribute('data-image-url');
                        modalImage.src = imageUrl;
                        modal.style.display = 'flex';
                    }
                });
            });

            modal.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });
