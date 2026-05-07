// source: https://nexon.ua/
// extracted: 2026-05-07T21:19:01.513Z
// scripts: 1

// === script #1 (length=2480) ===
// Замена картинки подарка
const img=document.querySelector('img.product-present__img'); if(img) img.src='https://feed.nexon.ua/img/6plus6-160.jpg';

// Ограничение количества товаров в заказе
$(document).ready(function () {

// 1. Настраиваем карту замен: 'старое' : 'новое'
    var replacements = {
        '110x110': '220x220',
        '110x99':  '220x198',
        '160x122': '320x244'
    };

    // 2. Запускаем замену
    $('img').attr('src', function(index, currentSrc) {
        // Проверяем, содержит ли текущий src какой-то из ключей нашего массива
        for (var search in replacements) {
            if (currentSrc.indexOf(search) !== -1) {
                // Если нашли совпадение — меняем и возвращаем новый src
                return currentSrc.replace(search, replacements[search]);
            }
        }
        // Если ничего не нашли — возвращаем как было
        return currentSrc;
    });


    function enforceMaxValue($field, maxValue = 10) {
        const currentValue = parseInt($field.val(), 10) || 0;
        if (currentValue > maxValue) {
            $field.val(maxValue);
         if ($('.max-message').length === 0) {
           $('.order-details').prepend('<div class="max-message" style="color: red;">Для придбання більшої кількості зверніться у розділ "Співпраця"</div>');
         }
        } else {
            /*$field.next('.error-message').remove();*/
        }
    }

    $('.counter-field').each(function () {
        enforceMaxValue($(this));
    });

    $(document).on('input', '.counter-field', function () {
        enforceMaxValue($(this));
    });

    $(document).on('change', '.counter-field', function () {
        enforceMaxValue($(this));
    });

    const observer = new MutationObserver(() => {
        $('.counter-field').each(function () {
            enforceMaxValue($(this));
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

document.querySelectorAll('.catalog-grid__item').forEach(item => {
  // Проверяем, не находится ли элемент внутри promo-section
  if (item.closest('.promo-section')) return;

  const codeDiv = item.querySelector('.catalogCard-code');
  if (codeDiv) {
    const text = codeDiv.textContent.trim();
    // Проверяем, есть ли "Артикул:" и оканчивается ли на "-12"
    if (text.includes('Артикул:') && /-12\s*$/.test(text)) {
      item.style.display = 'none';
    }
  }
});
