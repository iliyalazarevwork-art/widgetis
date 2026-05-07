// source: https://total-energo.com.ua/
// extracted: 2026-05-07T21:19:52.145Z
// scripts: 1

// === script #1 (length=885) ===
(function() {
    function fixPhoneLinks() {
        // 1. Десктоп та мобільні телефони (href)
        document.querySelectorAll('.phones__item-link').forEach(a => {
            if (a.href.includes('%2B')) {
                a.href = a.href.replace('%2B', '+');
            }
        });

        // 2. Контакти на сторінці контактів (data-fake-href)
        document.querySelectorAll('.contacts-info__item-link').forEach(a => {
            if (a.dataset.fakeHref && a.dataset.fakeHref.includes('%2B')) {
                a.dataset.fakeHref = a.dataset.fakeHref.replace('%2B', '+');
            }
        });
    }

    // Виконати одразу після завантаження сторінки
    document.addEventListener("DOMContentLoaded", fixPhoneLinks);

    // Періодична перевірка на випадок динамічного підвантаження (Ringostat, JS Хорошоп)
    setInterval(fixPhoneLinks, 500);
})();
