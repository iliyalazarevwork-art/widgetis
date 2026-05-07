// source: https://aqua-life.ua/
// extracted: 2026-05-07T21:18:50.676Z
// scripts: 1

// === script #1 (length=2634) ===
document.addEventListener("DOMContentLoaded", function() {
    if (!localStorage.getItem('siteLanguageSelected')) {
        // Создаем модальное окно
        var modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '10000';

        // Контейнер для кнопок
        var container = document.createElement('div');
        container.style.background = '#fff';
        container.style.padding = '20px';
        container.style.borderRadius = '10px';
        container.style.textAlign = 'center';

        var title = document.createElement('p');
        title.textContent = 'Будь ласка, оберіть мову сайту:';
        title.style.marginBottom = '20px';
        container.appendChild(title);

        // Кнопка для украинской
        var uaButton = document.createElement('button');
        uaButton.textContent = 'українська';
        uaButton.style.margin = '0 10px';
        uaButton.style.padding = '10px 20px';
        uaButton.style.cursor = 'pointer';
        uaButton.onclick = function() {
            localStorage.setItem('siteLanguageSelected', 'ua');
            // Проверяем наличие /ua в начале пути
            if (!window.location.pathname.startsWith('/ua')) {
                window.location.href = '/ua' + window.location.pathname + window.location.search;
            } else {
                modal.remove();
            }
        };
        container.appendChild(uaButton);

        // Кнопка для русской
        var ruButton = document.createElement('button');
        ruButton.textContent = 'російська';
        ruButton.style.margin = '0 10px';
        ruButton.style.padding = '10px 20px';
        ruButton.style.cursor = 'pointer';
        ruButton.onclick = function() {
            localStorage.setItem('siteLanguageSelected', 'ru');
            // Проверяем, есть ли /ua в пути, убираем его
            if (window.location.pathname.startsWith('/ua/')) {
                window.location.href = window.location.pathname.replace('/ua', '') + window.location.search;
            } else {
                modal.remove();
            }
        };
        container.appendChild(ruButton);

        modal.appendChild(container);
        document.body.appendChild(modal);
    }
});
