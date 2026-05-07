// source: https://postelbelie.com.ua/
// extracted: 2026-05-07T21:22:23.239Z
// scripts: 5

// === script #1 (length=582) ===
(function() {
  function moveMarquee() {
    var marquee = document.getElementById('custom-marquee');
    var header = document.querySelector('header');
    
    if (marquee && header) {
      if (marquee.parentNode) {
        marquee.parentNode.removeChild(marquee);
      }
      header.parentNode.insertBefore(marquee, header.nextSibling);
      marquee.style.marginBottom = '0';
    }
  }
  
  moveMarquee();
  window.addEventListener('load', moveMarquee);
  setTimeout(moveMarquee, 100);
  setTimeout(moveMarquee, 500);
  setTimeout(moveMarquee, 1000);
})();

// === script #2 (length=1189) ===
// Делаем логотип ссылкой на главную страницу
(function() {
  function makeLogoClickable() {
    var logo = document.querySelector('.logo a, .logo img, [class*="logo"] a, [class*="logo"] img, header a[href*="/"], header img');
    
    if (logo) {
      if (logo.tagName === 'IMG') {
        var link = document.createElement('a');
        link.href = '/';
        link.style.display = 'inline-block';
        link.style.textDecoration = 'none';
        link.style.border = 'none';
        
        logo.parentNode.insertBefore(link, logo);
        link.appendChild(logo);
      }
      else if (logo.tagName === 'A') {
        logo.href = '/';
      }
      else if (logo.parentNode && logo.parentNode.tagName !== 'A') {
        var link = document.createElement('a');
        link.href = '/';
        link.style.display = 'inline-block';
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';
        
        logo.parentNode.insertBefore(link, logo);
        link.appendChild(logo);
      }
    }
  }
  
  makeLogoClickable();
  window.addEventListener('load', makeLogoClickable);
  setTimeout(makeLogoClickable, 500);
})();

// === script #3 (length=921) ===
// ТОЧНОЕ ИСПРАВЛЕНИЕ ИКОНКИ ДОМИКА
(function() {
  function fixHomeIcon() {
    // Ищем все элементы use с ссылкой на #icon-homepage
    var uses = document.querySelectorAll('use[xlink\\:href="#icon-homepage"], use[href="#icon-homepage"]');
    
    uses.forEach(function(use) {
      var link = use.closest('a');
      if (link) {
        link.href = '/';
        link.setAttribute('title', 'На головну / На главную');
      }
    });
    
    // Ищем сам SVG с классом icon--homepage
    var homeSvgs = document.querySelectorAll('.icon--homepage');
    homeSvgs.forEach(function(svg) {
      var link = svg.closest('a');
      if (link) {
        link.href = '/';
      }
    });
  }
  
  fixHomeIcon();
  window.addEventListener('load', fixHomeIcon);
  setTimeout(fixHomeIcon, 500);
  setTimeout(fixHomeIcon, 1000);
  setTimeout(fixHomeIcon, 1500);
  setTimeout(fixHomeIcon, 2000);
})();

// === script #4 (length=4888) ===
(function() {
    function isBedLinen() {
        // Проверяем, что это постельный комплект, а не другие категории
        const url = window.location.href || '';
        const title = document.title || '';
        const bodyText = document.body.innerText.substring(0, 2000) || '';
        
        // Ключевые слова, которые есть только в постельных комплектах
        const bedLinenKeywords = [
            'постільна білизна',
            'постельное белье',
            'комплект постільної білизни',
            'комплект постельного белья',
            'простирадло',
            'простыня',
            'наволочка',
            'підковдра',
            'пододеяльник',
            'ранфорс',
            'сатин',
            'бязь',
            'Ранфорс',
            'Сатин',
            'Бязь',
            'Варена бавовна',
            'рюші',
            'рюши'
        ];
        
        // Слова-исключения: товары, где блок НЕ должен показываться
        const excludeKeywords = [
            'покривало',
            'покрывало',
            'скандинавський',
            'скандинавский',
            'велюр',
            'chanel',
            'scandi',
            'подушка',
            'подушку',
            'подушки',
            'подушек',
            'подушок',
            'одеяло',
            'одеяла',
            'наматрасник',
            'наматрасники',
            'pillow',
            'blanket',
            'mattress'
        ];
        
        // Проверяем, есть ли слово-исключение
        for (let word of excludeKeywords) {
            if (url.toLowerCase().includes(word.toLowerCase()) || 
                title.toLowerCase().includes(word.toLowerCase()) || 
                bodyText.toLowerCase().includes(word.toLowerCase())) {
                return false; // Это не постельный комплект — блок не показываем
            }
        }
        
        // Проверяем, есть ли слово-маркер постельного белья
        for (let word of bedLinenKeywords) {
            if (title.toLowerCase().includes(word.toLowerCase()) || 
                bodyText.toLowerCase().includes(word.toLowerCase())) {
                return true; // Это постельный комплект — блок показываем
            }
        }
        
        return false; // По умолчанию не показываем
    }

    function createHint() {
        // Если блок уже есть — не создаём новый
        if (document.querySelector('.mattress-size-hint')) return;

        // Если это не постельный комплект — выходим
        if (!isBedLinen()) return;

        // Находим последнюю группу модификаций
        const modifications = document.querySelectorAll('.modification');
        if (!modifications.length) return;

        const lastModification = modifications[modifications.length - 1];

        // Создаём блок
        const hint = document.createElement('div');
        hint.className = 'mattress-size-hint';
        hint.style.cssText = `
            font-size: 13px;
            color: #333;
            margin: 12px 0 8px 0;
            padding: 8px 12px;
            background: #f8f9fa;
            border-left: 4px solid #f9a03f;
            border-radius: 4px;
            line-height: 1.3;
            font-family: Arial, sans-serif;
        `;
        hint.innerHTML = `
            <div style="margin-bottom:4px;"><strong>Доступні розміри простирадла на резинці за периметром матраца:</strong></div>
            <div style="margin-left:6px; margin-bottom:3px;">
                <div><strong>Для півтораспального:</strong> 90×200, 120×200, 140×200</div>
                <div><strong>Для двоспального, Євро, Сімейного:</strong> 160×200, 180×200</div>
            </div>
            <div style="font-size:12px; color:#666; border-top:1px solid #ddd; padding-top:4px; margin-top:4px;">
                Стандартна висота матраца — 20 см. Простирадло відшивається з висотою 23 см.<br>
                ❗ При виборі опції обов'язково вкажіть у примітці ширину, довжину та висоту матраца.
            </div>
        `;

        // Вставляем после последней группы кнопок
        lastModification.parentNode.insertBefore(hint, lastModification.nextSibling);
    }

    // Создаём при загрузке
    createHint();

    // Наблюдаем за изменениями в блоке модификаций
    const observer = new MutationObserver(function() {
        // Если блок исчез — восстанавливаем, но только для постельных комплектов
        if (!document.querySelector('.mattress-size-hint') && isBedLinen()) {
            createHint();
        }
    });

    // Запускаем наблюдение за всей страницей
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Дополнительная страховка
    setTimeout(createHint, 500);
    setTimeout(createHint, 1000);
})();

// === script #5 (length=3293) ===
(function() {
    function addSocialButtonsToCart() {
        // Шукаємо кнопку оформлення замовлення
        const orderButton = document.querySelector('.order__total .btn--primary, button[type="submit"].btn--primary, a[data-checkout-link]');
        
        if (!orderButton) return;

        // Перевіряємо, чи вже є наш блок
        if (document.querySelector('.cart-social-hint')) return;

        // Створюємо блок
        const hint = document.createElement('div');
        hint.className = 'cart-social-hint';
        hint.style.cssText = `
            margin: 20px 0 15px 0;
            padding: 16px;
            background: #f8f9fa;
            border-left: 4px solid #f9a03f;
            border-radius: 4px;
            font-family: Arial, sans-serif;
            text-align: center;
        `;

        hint.innerHTML = `
            <div style="margin-bottom:12px; font-size:15px; font-weight:600; color:#2c3e50; letter-spacing:0.3px;">
                ⚡ Швидко завершити замовлення
            </div>
            <div style="margin-bottom:8px; font-size:13px; color:#555; line-height:1.5;">
                Напишіть у зручний месенджер — менеджер допоможе обрати, підкаже розміри та оформить замовлення
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-top:12px;">
                <a href="https://t.me/ManagershopUA" target="_blank" style="display:inline-flex; align-items:center; justify-content:center; background:#27A7E7; color:white; padding:10px 24px; border-radius:50px; text-decoration:none; font-weight:600; font-size:14px; min-width:160px; border:none; box-shadow:0 2px 8px rgba(0,0,0,0.1); transition:all 0.2s;">
                    Telegram-менеджер
                </a>
                <a href="https://ig.me/m/postelbelie_ukraina" target="_blank" style="display:inline-flex; align-items:center; justify-content:center; background:linear-gradient(45deg, #f09433, #d62976, #962fbf); color:white; padding:10px 24px; border-radius:50px; text-decoration:none; font-weight:600; font-size:14px; min-width:160px; border:none; box-shadow:0 2px 8px rgba(0,0,0,0.1); transition:all 0.2s;">
                    Instagram Direct
                </a>
                <a href="viber://chat?number=%2B380960373473" target="_blank" style="display:inline-flex; align-items:center; justify-content:center; background:#7360F2; color:white; padding:10px 24px; border-radius:50px; text-decoration:none; font-weight:600; font-size:14px; min-width:160px; border:none; box-shadow:0 2px 8px rgba(0,0,0,0.1); transition:all 0.2s;">
                    Viber
                </a>
            </div>
            <div style="margin-top:10px; font-size:12px; color:#777;">
                Відповімо за 5–15 хвилин
            </div>
        `;

        // Вставляємо перед кнопкою оформлення
        orderButton.parentNode.insertBefore(hint, orderButton);
    }

    // Запускаємо після завантаження сторінки
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addSocialButtonsToCart);
    } else {
        addSocialButtonsToCart();
    }

    // Додатково через 1 секунду
    setTimeout(addSocialButtonsToCart, 1000);
})();
