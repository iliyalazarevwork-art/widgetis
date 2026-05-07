// source: https://dimdverey.in.ua/
// extracted: 2026-05-07T21:21:10.067Z
// scripts: 1

// === script #1 (length=590) ===
document.addEventListener('DOMContentLoaded', function() {
    // Знаходимо всі кнопки в меню, де написано "Заміри"
    var zapusi = document.querySelectorAll('a[href*="/zamiry/"], a[href*="/zamiri/"]');
    
    zapusi.forEach(function(knopka) {
        // Додаємо ваш спеціальний клас-ключ до кнопки
        knopka.classList.add('sp_popup_aabc3b76-2c8f-4e3d-8dbf-b3535a7cc5c0');
        
        // Кажемо сайту не відкривати нову сторінку, а просто показати вікно
        knopka.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });
});
