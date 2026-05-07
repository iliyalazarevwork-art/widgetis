// source: https://artellshoes.com/
// extracted: 2026-05-07T21:19:23.596Z
// scripts: 1

// === script #1 (length=809) ===
(function() {
    function checkProductAvailability() {
        // Знаходимо всі елементи зі статусом на сторінці
        const statusBadges = document.querySelectorAll('.product-header__availability');
        statusBadges.forEach(function(badge) {
            const text = badge.textContent.toLowerCase();
            // Якщо текст містить "немає" або "відсутній"
            if (text.indexOf('немає') !== -1 || text.indexOf('відсутній') !== -1) {
                badge.classList.add('is-out-of-stock');
            } else {
                badge.classList.remove('is-out-of-stock');
            }
        });
    }
    // Запускаємо при завантаженні сторінки
    document.addEventListener("DOMContentLoaded", checkProductAvailability);
    setTimeout(checkProductAvailability, 1000);
})();
