// source: https://activeman.com.ua/
// extracted: 2026-05-07T21:20:40.037Z
// scripts: 1

// === script #1 (length=3388) ===
// Функція для створення поп-ап вікна
    function showPopup() {
        // Перевіряємо, чи вже показували поп-ап
        if (localStorage.getItem('popupShown') !== 'true') {

            // Отримуємо поточний URL
            var currentURL = window.location.href;

            // Текст повідомлення в залежності від URL
            var messageText = '';
            if (currentURL.includes('/ru/')) {
                // Для російської версії сайту
                messageText = 'Внимание: Минимальная сумма заказа — 500 грн.';
            } else {
                // Для української версії сайту (або за замовчуванням)
                messageText = 'Увага: Мінімальна сума замовлення — 500 грн.';
            }

            // Створюємо елементи для поп-ап
            var popupOverlay = document.createElement('div');
            popupOverlay.className = 'popup-overlay';

            var popupContent = document.createElement('div');
            popupContent.className = 'popup-content';

            var popupMessage = document.createElement('p');
            popupMessage.textContent = messageText;

            var popupButton = document.createElement('button');
            popupButton.textContent = 'OK';

            // Додаємо елементи до поп-ап вікна
            popupContent.appendChild(popupMessage);
            popupContent.appendChild(popupButton);
            popupOverlay.appendChild(popupContent);

            // Додаємо поп-ап до тіла сторінки
            document.body.appendChild(popupOverlay);

            // Закриття поп-ап вікна після натискання кнопки
            popupButton.addEventListener('click', function() {
                document.body.removeChild(popupOverlay);
                // Зберігаємо в localStorage, що поп-ап було показано
                localStorage.setItem('popupShown', 'true');
            });
        }
    }

    // Додаємо стилі для поп-ап через JavaScript
    var style = document.createElement('style');
    style.innerHTML = `
        .popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .popup-content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
            border: 2px solid #d7a04a;
            color: black;
        }

        .popup-content p {
            margin-bottom: 20px;
            font-size: 16px;
            line-height: 1.5;
        }

        .popup-content button {
            padding: 10px 20px;
            background-color: #d7a04a;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }

        .popup-content button:hover {
            background-color: #c08f40;
        }
    `;
    document.head.appendChild(style);

    // Викликаємо функцію після завантаження сторінки
    window.onload = function() {
        showPopup();
    };
