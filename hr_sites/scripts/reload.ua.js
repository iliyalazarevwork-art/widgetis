// source: https://reload.ua/
// extracted: 2026-05-07T21:19:54.209Z
// scripts: 6

// === script #1 (length=4822) ===
document.addEventListener("DOMContentLoaded", function() {
    const phrases = [
        "Безкоштовна доставка від 4000 грн",
        "Кешбек на кожне замовлення",
        "Виготовлено в Україні"
    ];

    setInterval(function() {
        // =========================================
        // ПЕРЕВІРКА НА ДРОПЕРА
        // =========================================
        let isDropper = false;
        
        const rrpElements = document.querySelectorAll('.product-price__rrp-price, .product-card__rrp-price, [class*="rrp-price"]');
        rrpElements.forEach(function(el) {
            const style = window.getComputedStyle(el);
            if (el.offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden') {
                isDropper = true;
            }
        });

        if (!isDropper) {
            const summaryBlocks = document.querySelectorAll('.cart_box, .cart-summary, .product-price');
            summaryBlocks.forEach(function(block) {
                if (block.textContent.includes('РРЦ:')) {
                    const style = window.getComputedStyle(block);
                    if (block.offsetParent !== null && style.display !== 'none') {
                        isDropper = true;
                    }
                }
            });
        }

        let tickerWrapper = document.querySelector('.reload-ticker-wrapper');

        // =========================================
        // ДИНАМІЧНИЙ ЗСУВ ШАПКИ
        // =========================================
        function adjustHeader() {
            if (tickerWrapper && tickerWrapper.style.display !== 'none') {
                const tickerHeight = tickerWrapper.offsetHeight;
                const isMobile = window.innerWidth <= 768;
                const scrollY = window.scrollY || document.documentElement.scrollTop;
                
                document.body.style.setProperty('padding-top', tickerHeight + 'px', 'important');
                
                const headers = document.querySelectorAll('.layout__header, .header, #header, .layout__top');
                headers.forEach(head => {
                    const pos = window.getComputedStyle(head).position;
                    if (pos === 'fixed' || pos === 'sticky') {
                        if (isMobile) {
                            head.style.setProperty('top', tickerHeight + 'px', 'important');
                        } else {
                            if (scrollY < tickerHeight) {
                                head.style.setProperty('top', (tickerHeight - scrollY) + 'px', 'important');
                            } else {
                                head.style.setProperty('top', '0px', 'important');
                            }
                        }
                    }
                });
            } else {
                document.body.style.removeProperty('padding-top');
                const headers = document.querySelectorAll('.layout__header, .header, #header, .layout__top');
                headers.forEach(head => head.style.removeProperty('top'));
            }
        }

        if (isDropper) {
            if (tickerWrapper && tickerWrapper.style.display !== 'none') {
                tickerWrapper.style.setProperty('display', 'none', 'important');
                adjustHeader();
            }
            return; 
        }

        // =========================================
        // СТВОРЕННЯ АНІМОВАНОЇ ПЛАШКИ
        // =========================================
        if (!tickerWrapper) {
            tickerWrapper = document.createElement('div');
            tickerWrapper.className = 'reload-ticker-wrapper';
            
            const tickerTrack = document.createElement('div');
            tickerTrack.className = 'reload-ticker-track';

            let singleBlockHTML = '';
            phrases.forEach(text => {
                singleBlockHTML += `<div class="reload-ticker-item">${text}</div>`;
            });

            let halfTrackHTML = singleBlockHTML.repeat(4);
            tickerTrack.innerHTML = halfTrackHTML + halfTrackHTML;
            tickerWrapper.appendChild(tickerTrack);
            
            document.body.insertBefore(tickerWrapper, document.body.firstChild);
            
            window.addEventListener('scroll', () => window.requestAnimationFrame(adjustHeader));
            window.addEventListener('resize', () => window.requestAnimationFrame(adjustHeader));
            
        } else {
            if (tickerWrapper.style.display === 'none') {
                tickerWrapper.style.setProperty('display', 'block', 'important');
            }
        }
        
        adjustHeader();
        
    }, 1000); 
});

// === script #2 (length=605) ===
// Отримуємо всі елементи з класом "products-menu__item"
var menuItems = document.querySelectorAll('.products-menu__item');

// Проходимося по кожному елементу меню
menuItems.forEach(function(menuItem) {
    // Знаходимо елемент з класом "productsMenu-submenu" в середині поточного елементу меню
    var submenu = menuItem.querySelector('.productsMenu-submenu');
    // Якщо елемент знайдено, додаємо клас "arrow" до елементу з класом "products-menu__title"
    if (submenu) {
        var title = menuItem.querySelector('.products-menu__title');
        title.classList.add('arrow');
    }
});

// === script #3 (length=2024) ===
const toggles = document.querySelectorAll('.faq-toggle');

toggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
  toggle.parentNode.classList.toggle('active');
  });
});

var details = document.querySelectorAll("details");
for(i=0;i<details.length;i++) {
  details[i].addEventListener("toggle", accordion);
}
function accordion(event) {
  if (!event.target.open) return;
    var details = event.target.parentNode.children;
    for(i=0;i<details.length;i++) {
      if (details[i].tagName != "DETAILS" || 
         !details[i].hasAttribute('open') || 
         event.target == details[i]) {
         continue;
      }
      details[i].removeAttribute("open");
    }
}




document.addEventListener('DOMContentLoaded', function() {
    // Знайти всі елементи з класом productsMenu-list-i
    var elements = document.querySelectorAll('.productsMenu-list-i');

    elements.forEach(function(element) {
        // Знайти всередині кожного елемента тег <a>
        var anchor = element.querySelector('a');

        // Перевірити, чи є текст "Переглянути все" всередині <a>
        if (anchor && anchor.textContent.trim() === 'Переглянути все') {
            // Додати до <a> стиль display: none
            anchor.style.display = 'none';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Знайти всі елементи з класом productsMenu-submenu-t
    var elements = document.querySelectorAll('.productsMenu-submenu-t');

    elements.forEach(function(element) {
        // Перевірити, чи є текст "Переглянути все" всередині елемента
        if (element.textContent.trim() === 'Переглянути все') {
            // Знайти батьківський елемент з класом productsMenu-submenu-i
            var parent = element.closest('.productsMenu-submenu-i');
            if (parent) {
                // Додати до батьківського елемента стиль display: none
                parent.style.display = 'none';
            }
        }
    });
});

// === script #4 (length=883) ===
document.addEventListener('DOMContentLoaded', function() {
    // Знаходимо всі елементи з класом catalogCard-title
    const catalogCardTitles = document.querySelectorAll('.catalogCard-title');

    // Регулярний вираз для видалення розмірів
    const sizesRegex = /\s*,\s*(S\/M|M\/XL|S|M|L|XL)\b/g;

    // Проходимо по кожному елементу
    catalogCardTitles.forEach(title => {
        // Знаходимо тег a всередині елемента з класом catalogCard-title
        const linkElement = title.querySelector('a');

        if (linkElement) {
            // Отримуємо текст всередині тега a
            let linkText = linkElement.textContent;

            // Видаляємо розміри з тексту
            linkText = linkText.replace(sizesRegex, "");

            // Оновлюємо текст всередині тега a
            linkElement.textContent = linkText.trim();
        }
    });
});

// === script #5 (length=2471) ===
(function() {
    function injectReloadCashback() {
        // Усі потрібні класи, включно з мобільним
        const selectors = '.product-price, .product-header__price, .product-item__price, .product-price__item_current, .product-card__price';
        
        const priceElements = document.querySelectorAll(selectors);
        
        priceElements.forEach(function(priceElement) {
            if (priceElement.getAttribute('data-cashback-added')) return;
            
            // Розділяємо ціни, щоб не було 290+690
            let rawText = priceElement.innerText;
            let currentPriceText = rawText.split(/грн|₴/i)[0]; 
            
            let priceValue = parseInt(currentPriceText.replace(/[^\d]/g, ''));

            if (priceValue > 0) {
                const cashback = Math.floor(priceValue * 0.05);

                const cashbackDiv = document.createElement('div');
                cashbackDiv.className = 'reload-cashback-final';
                
                // Додано width: 100% і flex-basis: 100% для гарантованого переносу на новий рядок
                cashbackDiv.style.cssText = `
                    display: block !important;
                    clear: both !important;
                    width: 100% !important;
                    flex-basis: 100% !important; 
                    margin: 15px 0 !important;
                    padding: 12px !important;
                    background: #f7f5f5 !important;
                    border: 2px solid #050505 !important;
                    border-radius: 8px !important;
                    color: #050505 !important;
                    font-size: 15px !important;
                    font-weight: 800 !important;
                    text-align: center !important;
                    box-sizing: border-box !important;
                `;

                cashbackDiv.innerHTML = `💰 КЕШБЕК: +${cashback} грн на цей товар`;

                priceElement.setAttribute('data-cashback-added', 'true');
                
                // Якщо батьківський контейнер використовує flexbox зі згортанням, 
                // це гарантовано змусить плашку стрибнути вниз.
                priceElement.parentNode.style.flexWrap = 'wrap'; 
                
                priceElement.parentNode.insertBefore(cashbackDiv, priceElement.nextSibling);
            }
        });
    }

    setInterval(injectReloadCashback, 500);
})();

// === script #6 (length=2781) ===
document.addEventListener("DOMContentLoaded", function() {
    // 1. Запускаємо скрипт тільки для мобільних екранів
    if (window.innerWidth > 767) return;

    // 2. Шукаємо оригінальну кнопку "Купити"
    let originalBtn = document.querySelector('.j-buy-btn, .btn--buy, .product-action__buy-btn, form[action*="cart"] button');
    
    // Якщо не знайшли за класом, шукаємо просто за текстом
    if (!originalBtn) {
        const elements = document.querySelectorAll('a, button');
        for (let el of elements) {
            if (el.textContent.trim().toLowerCase() === 'купити') {
                originalBtn = el;
                break;
            }
        }
    }

    if (!originalBtn) return; // Якщо кнопки взагалі немає (наприклад, немає в наявності), нічого не робимо

    // 3. Створюємо липку панель для низу екрана
    const stickyBar = document.createElement('div');
    stickyBar.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background: #ffffff;
        padding: 12px 15px 25px 15px; /* Запас знизу для панелі iPhone */
        box-shadow: 0 -4px 15px rgba(0,0,0,0.08);
        z-index: 9999;
        display: none;
        transform: translateY(100%);
        transition: transform 0.3s ease-out;
        box-sizing: border-box;
    `;

    // 4. Створюємо саму кнопку-дублікат
    const clonedBtn = document.createElement('a');
    clonedBtn.textContent = 'У КОШИК';
    clonedBtn.style.cssText = `
        display: flex;
        width: 100%;
        justify-content: center;
        align-items: center;
        height: 50px;
        background: #000000; /* Можеш змінити на інший колір вашого бренду */
        color: #ffffff;
        font-weight: 600;
        font-size: 16px;
        text-transform: uppercase;
        border-radius: 4px;
        text-decoration: none;
        cursor: pointer;
    `;

    // 5. Пов'язуємо клік з оригінальною кнопкою
    clonedBtn.addEventListener('click', function(e) {
        e.preventDefault();
        originalBtn.click();
    });

    stickyBar.appendChild(clonedBtn);
    document.body.appendChild(stickyBar);

    // 6. Логіка появи/зникнення при скролі
    window.addEventListener('scroll', function() {
        const btnRect = originalBtn.getBoundingClientRect();
        
        // Якщо оригінальна кнопка проскролена вище екрана
        if (btnRect.bottom < 0) {
            stickyBar.style.display = 'block';
            setTimeout(() => { stickyBar.style.transform = 'translateY(0)'; }, 10);
        } else {
            stickyBar.style.transform = 'translateY(100%)';
            setTimeout(() => { stickyBar.style.display = 'none'; }, 300);
        }
    });
});
