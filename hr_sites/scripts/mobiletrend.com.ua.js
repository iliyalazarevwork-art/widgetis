// source: https://mobiletrend.com.ua/
// extracted: 2026-05-07T21:18:52.974Z
// scripts: 1

// === script #1 (length=2281) ===
(function() {
    function injectNewYearBanner() {
        // 1. Перевірка: скрипт працює ТІЛЬКИ на сторінці розпродажу
        if (!window.location.href.includes('znyzhky-vid-trendi/')) return;

        // 2. Знаходимо всі товари на сторінці
        var items = document.querySelectorAll('.catalog-grid__item');

        // Перевіряємо, чи є хоча б 3 товари, та чи банер ще не додано
        if (items.length >= 3 && !document.getElementById('custom-glass-banner')) {
            
            var targetItem = items[2]; 
            
            var bannerLi = document.createElement('li');
            bannerLi.className = 'catalog-grid__item';
            bannerLi.id = 'custom-glass-banner';
            
            // Додаємо інструкції для пошукових роботів:
            // googleoff/googleon — ігнорування контенту роботом Google
            // data-nosnippet — заборона використання блоку для сніпетів та картинок у видачі
            bannerLi.innerHTML = `
                <div class="catalogCard comfy-style" data-nosnippet>
                    <a href="https://mobiletrend.com.ua/zakhyst-na-ekran/" class="banner-link">
                        <div class="banner-image-container">
                            <img src="https://mt.in.ua/img/2026-01-12_111058.png" alt="Захисне скло">
                        </div>
                        <div class="banner-content">
                            <p class="banner-text">Не знайшов скло на свій смартфон? <br><strong>А тут є</strong></p>
                            <div class="btn __special banner-btn">
                                <span class="btn-content">Перейти</span>
                            </div>
                        </div>
                    </a>
                </div>
                `;

            // 3. Вставляємо банер ПІСЛЯ 3-го товару
            if (targetItem.nextSibling) {
                targetItem.parentNode.insertBefore(bannerLi, targetItem.nextSibling);
            } else {
                targetItem.parentNode.appendChild(bannerLi);
            }
        }
    }

    injectNewYearBanner();
    // Повторні запуски для динамічного контенту
    setTimeout(injectNewYearBanner, 1000);
    setTimeout(injectNewYearBanner, 2500);
})();
