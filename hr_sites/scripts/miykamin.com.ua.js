// source: https://miykamin.com.ua/
// extracted: 2026-05-07T21:22:04.088Z
// scripts: 1

// === script #1 (length=1628) ===
document.addEventListener('DOMContentLoaded', function () {
        // Контейнер для ПК версії
        const pcContainer = document.querySelector('.product-order__row');
        // Контейнер для мобільної версії
        const mobileContainer = document.querySelector('.product-card__purchase');

        // Додаємо кнопку для ПК версії
        if (pcContainer) {
            const pcButton = document.createElement('a');
            pcButton.textContent = 'ЗАМОВИТИ КОНСУЛЬТАЦІЮ';
            pcButton.className = 'btn btn--block btn--secondary';
            pcButton.href = '#'; // Для коректного виклику форми
            pcButton.setAttribute('data-modal', '#call-me'); // Виклик ПК-форми
            pcContainer.appendChild(pcButton);
            console.log('Кнопка успішно додана до ПК версії!');
        } else {
            console.error('Контейнер для ПК не знайдено!');
        }

        // Додаємо кнопку для мобільної версії
        if (mobileContainer) {
            const mobileButton = document.createElement('a');
            mobileButton.textContent = 'ЗАМОВИТИ КОНСУЛЬТАЦІЮ';
            mobileButton.className = 'btn btn--block btn--secondary';
            mobileButton.href = '#callback-form'; // Виклик мобільної форми
            mobileButton.setAttribute('data-panel', '');
            mobileButton.setAttribute('data-menu', 'callback');
            mobileContainer.appendChild(mobileButton);
            console.log('Кнопка успішно додана до мобільної версії!');
        } else {
            console.error('Контейнер для мобільної версії не знайдено!');
        }
    });
