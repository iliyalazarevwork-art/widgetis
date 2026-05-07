// source: https://vitberry.com.ua/
// extracted: 2026-05-07T21:19:09.437Z
// scripts: 3

// === script #1 (length=2252) ===
document.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('myModal');
        const modalImage = document.getElementById('modalImage');
        const closeBtn = document.querySelector('.sertificate-close');
        const prevBtn = document.querySelector('.sertificate-prev');
        const nextBtn = document.querySelector('.sertificate-next');
        const galleryImages = document.querySelectorAll('.sertificate-image-wrapper img');
        let currentIndex = 0;

        // Обработчик для открытия модального окна
        galleryImages.forEach((image, index) => {
            image.addEventListener('click', () => {
                currentIndex = index;
                modal.style.display = 'flex';
                modalImage.src = galleryImages[currentIndex].src;
            });
        });

        // Обработчик для закрытия модального окна
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Закрытие модального окна при клике на фон
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Функции для навигации
        const showNext = () => {
            currentIndex = (currentIndex + 1) % galleryImages.length;
            modalImage.src = galleryImages[currentIndex].src;
        };

        const showPrev = () => {
            currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
            modalImage.src = galleryImages[currentIndex].src;
        };

        // Обработчики для кнопок навигации
        nextBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            showNext();
        });

        prevBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            showPrev();
        });

        // Запрет прокрутки основного документа, когда модальное окно открыто
        modal.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
        modal.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    });

// === script #2 (length=602) ===
const questions = document.querySelectorAll('.faq-question');

questions.forEach(q => {
  q.addEventListener('click', () => {
    const isActive = q.classList.contains('active');
    questions.forEach(item => {
      item.classList.remove('active');
      item.nextElementSibling.style.maxHeight = null;
      item.nextElementSibling.style.paddingBottom = "0";
    });

    if (!isActive) {
      q.classList.add('active');
      const answer = q.nextElementSibling;
      answer.style.maxHeight = answer.scrollHeight + "px";
      answer.style.paddingBottom = "15px";
    }
  });
});

// === script #3 (length=4095) ===
//таймкр доставки

(function() {
    var runUniversalTimer = function() {
        if (document.querySelector('.shipping-timer-dobavki')) return;

        // 1. ВИЗНАЧЕННЯ МОВИ
        var path = window.location.pathname;
        var docLang = document.documentElement.lang.toLowerCase();
        
        var isRu = path.includes('/ru/') || path.includes('/rus/') || docLang === 'ru';
        var isEn = path.includes('/en/') || path.includes('/eng/') || docLang === 'en';
        
        var lang = {
            inStock: isEn ? "in stock" : (isRu ? "в наличии" : "в наявності"),
            notInStock: isEn ? "out of stock" : (isRu ? "нет в наличии" : "немає в наявності"),
            orderWithin: isEn ? "Order within" : (isRu ? "Закажите в течение" : "Замовте протягом"),
            andWeShip: isEn ? "and we will ship it" : (isRu ? "и мы отправим заказ" : "і ми відправимо замовлення"),
            today: isEn ? "TODAY!" : (isRu ? "СЕГОДНЯ!" : "СЬОГОДНІ!"),
            h: isEn ? " h " : (isRu ? " ч " : " год "),
            m: isEn ? " min " : (isRu ? " мин " : " хв "),
            s: isEn ? " sec" : (isRu ? " сек" : " сек"),
            buy: isEn ? ["buy", "order"] : (isRu ? ["купить", "заказать"] : ["купити", "замовити"])
        };

        // 2. ПЕРЕВІРКА НАЯВНОСТІ
        var bodyText = document.body.innerText.toLowerCase() || "";
        var isInStock = bodyText.includes(lang.inStock) && !bodyText.includes(lang.notInStock);
        if (!isInStock) return;

        // 3. ПЕРЕВІРКА ЧАСУ (Пн-Пт, 8:00 - 17:00)
        var now = new Date();
        var day = now.getDay(); 
        var hour = now.getHours();
        if (!(day >= 1 && day <= 5 && hour >= 8 && hour < 17)) return;

        // 4. ПОШУК КНОПКИ
        var allButtons = document.querySelectorAll('.product-order__row, .product-card__order--normal');
        var buyBtn = null;

        for (var i = 0; i < allButtons.length; i++) {
            var txt = allButtons[i].innerText.toLowerCase();
            if ((txt.includes(lang.buy[0]) || txt.includes(lang.buy[1])) && allButtons[i].offsetWidth > 0) {
                buyBtn = allButtons[i];
                break;
            }
        }

        if (buyBtn) {
            var timerWrap = document.createElement('div');
            timerWrap.className = 'shipping-timer-dobavki';
            timerWrap.style.cssText = "margin: 15px 0; padding: 12px; border-radius: 10px; background-color: #ffffff; border: 1px solid #16a34a; display: flex; align-items: center; gap: 10px;  box-sizing: border-box; clear: both; width: 100%;";

            var deadline = new Date();
            deadline.setHours(17, 0, 0);
            
            var update = function() {
                var diff = deadline - new Date();
                if (diff <= 0) {
                    timerWrap.style.display = 'none';
                    return;
                }
                var h = Math.floor(diff / 1000 / 60 / 60);
                var m = Math.floor((diff / 1000 / 60) % 60);
                var s = Math.floor((diff / 1000) % 60);
                var timeStr = (h > 0 ? h + lang.h : "") + m + lang.m + s + lang.s;
                
                timerWrap.innerHTML = '<span style="font-size: 22px; flex-shrink: 0;">📦</span>' +
                    '<div style="font-size: 13px; color: #2F2A25; line-height: 1.3;">' +
                    lang.orderWithin + ' <b style="color: #16a34a;">' + timeStr + '</b>,<br>' +
                    lang.andWeShip + ' <b style="text-transform: uppercase;">' + lang.today + '</b>' +
                    '</div>';
            };

            update();
            setInterval(update, 1000);

            var parent = buyBtn.parentElement;
            if (parent.offsetWidth < 150) parent = parent.parentElement;
            parent.insertBefore(timerWrap, parent.firstChild);
        }
    };

    var timerInterval = setInterval(runUniversalTimer, 500);
    setTimeout(function() { clearInterval(timerInterval); }, 15000);
    runUniversalTimer();
})();
