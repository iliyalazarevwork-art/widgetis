// source: https://eternite.com.ua/
// extracted: 2026-05-07T21:21:19.092Z
// scripts: 1

// === script #1 (length=802) ===
// Автоматична зміна тексту кнопки залежно від мови сайту
document.addEventListener('DOMContentLoaded', function() {
    const btnText = document.getElementById('btn-text');
    
    // Перевіряємо поточну мову (Хорошоп зазвичай додає class або data-атрибут, або змінює URL)
    const currentLang = document.documentElement.lang || 
                       (document.querySelector('html') ? document.querySelector('html').getAttribute('lang') : '') ||
                       window.location.pathname;

    if (currentLang.includes('ru') || currentLang === 'ru' || document.body.classList.contains('lang-ru')) {
        btnText.innerHTML = '🛠 Индивидуальный заказ';
    } else {
        // За замовчуванням — українська
        btnText.innerHTML = '🛠 Індивідуальне замовлення';
    }
});
