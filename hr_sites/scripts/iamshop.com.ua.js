// source: https://iamshop.com.ua/
// extracted: 2026-05-07T21:21:36.952Z
// scripts: 1

// === script #1 (length=7382) ===
(function() {
      // 1. Вставка стилей
      const style = document.createElement('style');
      style.textContent = `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }
        .modal-content {
          background-color: #fff;
          border-radius: 12px; /* Уменьшенный радиус скругления */
          width: 80%; /* Уменьшенная ширина */
          max-width: 400px; /* Дополнительное уменьшение максимальной ширины */
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); /* Умеренные тени */
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .modal-content.show {
          transform: translateY(0);
          opacity: 1;
        }
        .modal-content.hide {
          transform: translateY(-50px);
          opacity: 0;
        }
        .modal-close {
          position: absolute;
          top: 10px;
          right: 15px;
          font-size: 24px; /* Умеренный размер крестика */
          font-weight: bold;
          cursor: pointer;
          color: #333;
          transition: color 0.3s;
        }
        .modal-close:hover {
          color: #000;
        }
        .modal-image {
          width: 100%;
          height: auto;
          max-height: 30vh; /* Уменьшенная максимальная высота изображения */
          object-fit: cover; /* Сохраняет пропорции и заполняет контейнер */
        }
        .modal-body {
          padding: 10px 15px; /* Уменьшен padding */
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start; /* Изменено для уменьшения пустого пространства */
        }
        .modal-body p {
          margin: 5px 0; /* Уменьшен верхний и нижний отступ */
          font-size: 14px; /* Уменьшен размер шрифта */
          color: #333;
        }
        .subscribe-button {
          display: inline-flex;
          align-items: center;
          gap: 6px; /* Уменьшен отступ между иконкой и текстом */
          padding: 8px 16px; /* Уменьшен padding */
          margin-top: 10px; /* Уменьшен отступ сверху */
          background-color: #37AEE2; /* Голубой цвет */
          color: #fff;
          font-weight: bold;
          font-size: 13px; /* Уменьшен размер шрифта */
          border: none;
          border-radius: 20px; /* Уменьшен радиус скругления */
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 3px 8px rgba(41,169,224,0.3); /* Умеренные тени */
          transition: background-color 0.3s, transform 0.3s;
        }
        .subscribe-button:hover {
          background-color: #1B91CA;
          transform: translateY(-2px);
        }
        .subscribe-button svg {
          width: 16px; /* Уменьшен размер иконки */
          height: 16px;
          fill: #fff;
        }
        /* Медиазапросы для адаптивности */
        @media (max-width: 768px) {
          .modal-content {
            width: 85%;
            max-width: 380px; /* Дополнительное уменьшение на планшетах */
          }
          .modal-body p {
            font-size: 13px;
          }
          .subscribe-button {
            padding: 7px 14px;
            font-size: 12px;
          }
          .modal-close {
            font-size: 20px;
            right: 10px;
            top: 8px;
          }
        }
        @media (max-width: 480px) {
          .modal-content {
            width: 90%;
            height: auto;
            border-radius: 10px; /* Немного уменьшенный радиус скругления */
            max-width: 100%;
            max-height: 85vh;
          }
          .modal-image {
            max-height: 25vh; /* Дополнительное уменьшение высоты изображения на мобильных */
          }
          .modal-body {
            padding: 8px 12px; /* Дополнительное уменьшение padding */
          }
          .modal-body p {
            font-size: 12px;
          }
          .subscribe-button {
            width: 100%;
            justify-content: center;
            padding: 8px 0; /* Уменьшен padding */
            font-size: 13px;
            margin-top: 8px; /* Уменьшен отступ */
          }
          .modal-close {
            font-size: 22px;
            right: 10px;
            top: 10px;
          }
        }
      `;
      document.head.appendChild(style);

      // 2. Вставка модального окна
      const modalHTML = `
        <div class="modal-overlay" id="myModal">
          <div class="modal-content">
            <span class="modal-close">&times;</span>
            <img src="https://i.postimg.cc/wMh7v5FD/250doll.jpg" alt="Новогоднее поздравление" class="modal-image" />
            <div class="modal-body">
              <p>
                Бажаєте більше відеооглядів? Або є додаткові запитання? Ми на звʼязку 24/7🤍
              </p>
              <p>
                В телеграм каналі більше спекотних новинок і розпродажу🔥👇
              </p>
              <a href="https://t.me/iamshopcomua" class="subscribe-button" target="_blank" rel="noopener noreferrer">
                <!-- SVG Телеграм -->
                <svg xmlns="http://www.w3.org/2000/svg"
                  aria-label="Telegram" role="img"
                  viewBox="0 0 512 512">
                  <rect
                    width="512" height="512"
                    rx="15%"
                    fill="#37aee2"/>
                  <path fill="#c8daea" d="M199 404c-11 0-10-4-13-14l-32-105 245-144"/>
                  <path fill="#a9c9dd" d="M199 404c7 0 11-4 16-8l45-43-56-34"/>
                  <path fill="#f6fbfe" d="M204 319l135 99c14 9 26 4 30-14l55-258c5-22-9-32-24-25L79 245c-21 8-21 21-4 26l83 26 190-121c9-5 17-3 11 4"/>
                </svg>
                Подписаться на телеграм
              </a>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      // 3. Функциональность модального окна
      window.addEventListener('load', function() {
        const modal = document.getElementById('myModal');
        const closeBtn = modal.querySelector('.modal-close');

        // Показать модальное окно
        modal.style.display = 'flex';

        // Закрыть модальное окно при клике на крестик
        closeBtn.addEventListener('click', function() {
          modal.style.display = 'none';
        });

        // Закрыть модальное окно при клике вне его содержимого
        modal.addEventListener('click', function(event) {
          if (event.target === modal) {
            modal.style.display = 'none';
          }
        });

        // Закрыть модальное окно при нажатии клавиши Esc
        document.addEventListener('keydown', function(event) {
          if (event.key === 'Escape') {
            modal.style.display = 'none';
          }
        });
      });
    })();
