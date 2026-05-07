// source: https://np1.com.ua/
// extracted: 2026-05-07T21:19:52.872Z
// scripts: 1

// === script #1 (length=5893) ===
(function () {
        // Создаём контейнер для виджета
        const chatContainer = document.createElement('div');
        chatContainer.style.position = 'fixed'; // Закрепляем виджет на экране
        chatContainer.style.bottom = '100px'; // Располагаем выше на экране (подняли вверх)
        chatContainer.style.right = '20px'; // Расстояние от правого края
        chatContainer.style.width = '60px'; // Размер кнопки
        chatContainer.style.height = '60px';
        chatContainer.style.borderRadius = '50%'; // Округляем кнопку
        chatContainer.style.backgroundColor = '#FFA500'; // Задаём оранжевый цвет (#FFA500)
        chatContainer.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)'; // Тень
        chatContainer.style.cursor = 'pointer'; // Указатель меняется на руку при наведении
        chatContainer.style.zIndex = '10000'; // Виджет поверх других элементов
        chatContainer.style.display = 'flex'; // Используем flex для выравнивания
        chatContainer.style.alignItems = 'center'; // Выравнивание по вертикали
        chatContainer.style.justifyContent = 'center'; // Выравнивание по горизонтали
        chatContainer.style.transition = '0.3s'; // Анимация при изменениях

        // Создаём текстовый элемент, появляющийся при наведении
        const chatTooltip = document.createElement('span');
        chatTooltip.textContent = 'Чат с Менеджером'; // Текст при наведении
        chatTooltip.style.position = 'absolute'; // Абсолютное позиционирование
        chatTooltip.style.bottom = '70px'; // Расположение текста над кнопкой
        chatTooltip.style.right = '0';
        chatTooltip.style.backgroundColor = '#FFA500'; // Фон подсказки (оранжевый цвет)
        chatTooltip.style.color = '#ffffff'; // Цвет текста подсказки (белый)
        chatTooltip.style.padding = '5px 10px'; // Отступы внутри подсказки
        chatTooltip.style.borderRadius = '5px'; // Округление углов подсказки
        chatTooltip.style.fontSize = '15px'; // Размер шрифта
        chatTooltip.style.whiteSpace = 'nowrap'; // Запрещаем перенос текста
        chatTooltip.style.visibility = 'hidden'; // Скрываем подсказку изначально
        chatTooltip.style.opacity = '0'; // Невидимость (для плавности)
        chatTooltip.style.transition = 'opacity 0.3s'; // Анимация появления
        chatContainer.appendChild(chatTooltip); // Добавляем подсказку в виджет

        // Добавляем SVG иконку в кнопку
        const chatIcon = document.createElement('div');
        chatIcon.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 10.5H16" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M8 14H13.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M17 3.33782C15.5291 2.48697 13.8214 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22C17.5228 22 22 17.5228 22 12C22 10.1786 21.513 8.47087 20.6622 7" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        `;
        chatIcon.style.width = '35px'; // Размер иконки
        chatIcon.style.height = '35px';
        chatIcon.style.display = 'flex'; // Выравнивание иконки
        chatIcon.style.alignItems = 'center';
        chatIcon.style.justifyContent = 'center';
        chatContainer.appendChild(chatIcon); // Добавляем иконку в контейнер

        // Добавляем подсказку при наведении
        chatContainer.addEventListener('mouseenter', () => {
            chatTooltip.style.visibility = 'visible'; // Делаем подсказку видимой
            chatTooltip.style.opacity = '1'; // Плавное появление
        });

        // Скрываем подсказку, когда курсор покидает область кнопки
        chatContainer.addEventListener('mouseleave', () => {
            chatTooltip.style.visibility = 'hidden'; // Скрываем подсказку
            chatTooltip.style.opacity = '0'; // Плавное исчезновение
        });

        document.body.appendChild(chatContainer); // Добавляем кнопку в документ

        // Переменные для чата
        let chatIframeCreated = false; // Проверяем, создан ли iframe
        let chatIframe; // Переменная для iframe

        // Обработка клика по кнопке
        chatContainer.addEventListener('click', () => {
            if (!chatIframeCreated) {
                // Создаём iframe для чата
                chatIframe = document.createElement('iframe');
                chatIframe.src = 'https://selarti.com/frame?channel=1732603656932x383344135484473340';
                chatIframe.style.position = 'fixed';
                chatIframe.style.bottom = '170px'; // Открываем окно выше виджета
                chatIframe.style.right = '20px';
                chatIframe.style.width = '350px';
                chatIframe.style.height = '440px';
                chatIframe.style.border = 'none';
                chatIframe.style.borderRadius = '10px';
                chatIframe.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.2)';
                chatIframe.style.zIndex = '9999';
                chatIframe.style.backgroundColor = '#ffffff'; // Непрозрачный фон
                chatIframe.style.opacity = '1'; // Убираем прозрачность
                document.body.appendChild(chatIframe);
                chatIframeCreated = true; // Отмечаем, что iframe создан
            } else {
                // Убираем iframe при повторном клике
                chatIframe.style.display =
                    chatIframe.style.display === 'none' ? 'block' : 'none';
            }
        });
    })();
