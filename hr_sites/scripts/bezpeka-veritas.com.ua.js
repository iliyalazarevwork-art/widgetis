// source: https://bezpeka-veritas.com.ua/
// extracted: 2026-05-07T21:19:05.652Z
// scripts: 5

// === script #1 (length=679) ===
window.fbAsyncInit = function() {
                FB.init({
                    appId            : '475858912109849',
                    autoLogAppEvents : true,
                    xfbml            : true,
                    version          : 'v2.12'
                });
            };
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

// === script #2 (length=1927) ===
document.addEventListener("DOMContentLoaded", function () {
  const articlesGroupA = ["BV-001405", "BV-001402", "BV-001402-1", "BV-001402-2", "BV-001402-3", "BV-001406", "BV-001424", "BV-001425", "BV-001426", "BV-001427", "BV-001428", "BV-001401", "BV-001401-1", "BV-001401-2", "BV-001401-3", "BV-001407", "BV-001438", "BV-001439"];
  const articlesGroupB = ["BV-001710", "BV-001712", "BV-001711", "BV-001709", "BV-001708", "BV-001707", "BV-001746", "BV-001745", "BV-001744", "BV-001743", "BV-001742", "BV-001741", "BV-001740"];

  const calculatorUrlA = "https://prozorro.space/";
  const calculatorUrlB = "https://prozorro.space/phantom-reb/phantom.html";

  const articleSelectors = [
    ".product-meta__item",
    ".product-header__code"
  ];

  let matchedGroup = null;

  for (let selector of articleSelectors) {
    const elements = document.querySelectorAll(selector);
    for (let el of elements) {
      const text = el.textContent;

      if (articlesGroupA.some(article => text.includes(article))) {
        matchedGroup = 'A';
        break;
      }
      if (articlesGroupB.some(article => text.includes(article))) {
        matchedGroup = 'B';
        break;
      }
    }
    if (matchedGroup) break;
  }

  if (matchedGroup) {
    const calculatorButton = document.createElement("a");
    calculatorButton.href = matchedGroup === 'A' ? calculatorUrlA : calculatorUrlB;
    calculatorButton.textContent = "Розрахувати в калькуляторі";
    calculatorButton.className = "reb-calc-button";
    calculatorButton.target = "_blank";

    const targetRow = document.querySelectorAll(".product-order__row");
    if (targetRow) {
      targetRow.appendChild(calculatorButton.cloneNode(true));
    }

    const mobileBox = document.querySelector(".product-card__order-box");
    if (mobileBox) {
      mobileBox.appendChild(calculatorButton.cloneNode(true));
    }
  }
});

// === script #3 (length=2595) ===
document.addEventListener("DOMContentLoaded", function () {
  const articlesGroupA = ["HRBV-000893", "HRBV-000907", "HRBV-001239", "BV-000907-1"];

  const articleSelectors = [
    ".product-meta__item",
    ".product-header__code"
  ];

  let matched = false;

  for (let selector of articleSelectors) {
    const elements = document.querySelectorAll(selector);
    for (let el of elements) {
      const text = el.textContent;
      if (articlesGroupA.some(article => text.includes(article))) {
        matched = true;
        break;
      }
    }
    if (matched) break;
  }

  if (matched) {
    // Визначення мови сторінки
    const isRussian = location.pathname.includes('/ru/') || document.documentElement.lang === 'ru';

    const content = isRussian
      ? {
          label: "Спецпредложение",
          title: "Обновлённая версия Avenger Booster",
          price: "63 999 грн",
          note: "Выбирай лучшее",
          button: "Перейти к товару"
        }
      : {
          label: "Cпецпропозиція",
          title: "Оновлена версія Avenger Booster",
          price: "63 999 грн",
          note: "Обирай краще",
          button: "Перейти до товару"
        };

    const giftBlock = document.createElement("div");
    giftBlock.className = "reb-special-offer";

    giftBlock.innerHTML = `
      <div class="reb-special-offer__content">
        <img src="https://bezpeka-veritas.com.ua/content/images/1/1280x1280l80bl20/55646903574906.webp" 
             alt="Подарунок" class="reb-special-offer__image" width="200" height="200">
        <div class="reb-special-offer__text">
          <div class="reb-special-offer__label">${content.label}</div>
          <div class="reb-special-offer__title">${content.title}</div>
          <div class="reb-special-offer__price">${content.price}</div>
          <div class="reb-special-offer__note">${content.note}</div>
          <a href="https://bezpeka-veritas.com.ua/vynosna-antena-pidsyliuvach-syhnalu-dlia-kvadrokopteriv-skyrazor-varta-2.4g-5.2g-5.8g/" 
             class="reb-special-offer__button" target="_blank">
            ${content.button}
          </a>
        </div>
      </div>
    `;

    const desktopBox = document.querySelector(".product__row");
    if (desktopBox && desktopBox.parentNode) {
      desktopBox.insertAdjacentElement("afterend", giftBlock.cloneNode(true));
    }

    const mobileBox = document.querySelector(".product-card__purchase");
    if (mobileBox) {
      mobileBox.appendChild(giftBlock.cloneNode(true));
    }
  }
});

// === script #4 (length=13056) ===
// ============================================
        // НАСТРОЙКИ TELEGRAM (замени на свои данные)
        // ============================================
        const TELEGRAM_CONFIG = {
            botToken: '8451443392:AAEfIIQFL4avdi-nM_UzCRkPjBnRQkQfeoE',  // Токен бота от @BotFather
            chatId: ['622303631', '1710386486', '6223484401', '998521979']       // ID чата/канала куда слать сообщения
        };

        // ============================================
        // СТИЛИ
        // ============================================
        const styles = document.createElement('style');
        styles.textContent = `
            
        * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
        .main-btn {
margin-top: 10px;
width: 100%;
                padding: 0 16px;
                font-size: 18px;
                font-weight: 600;
                color: black;
                border: 2px solid #487e4a;
                border-radius: 8px;
height: 38px;
                cursor: pointer;
                transition: all 0.2s ease;
                background-color: white;
            }

            .main-btn:hover {
                transform: translateY(-2px);
            }

            .main-btn:active {
                transform: translateY(0);
            }

            .modalKP-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .modalKP-overlay.active {
                display: flex;
                opacity: 1;
            }

            .modalKP {
                background: #fff;
                border-radius: 20px;
                padding: 40px;
                width: 90%;
                max-width: 450px;
                transform: scale(0.8);
                transition: transform 0.3s ease;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
            }

            .modalKP-overlay.active .modalKP {
                transform: scale(1);
            }

            .modalKP h2 {
                text-align: center;
                margin-bottom: 30px;
                color: #1a1a2e;
                font-size: 24px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: #333;
                font-weight: 500;
            }

            .form-group input {
                width: 100%;
                padding: 14px 18px;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                font-size: 16px;
                transition: border-color 0.3s ease, box-shadow 0.3s ease;
            }

            .form-group input:focus {
                outline: none;
                border-color: #41521e;
                box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
            }

            .submit-btn {
                width: 100%;
                padding: 16px;
                font-size: 17px;
                font-weight: 600;
                color: #fff;
                background: linear-gradient(135deg, #41521e 0%, #41521e 100%);
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 10px;
            }

            .submit-btn:hover {
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            }

            .submit-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }

            .close-btn {
                position: absolute;
                top: 15px;
                right: 20px;
                font-size: 28px;
                color: #999;
                cursor: pointer;
                transition: color 0.3s ease;
                background: none;
                border: none;
            }

            .close-btn:hover {
                color: #333;
            }

            .modalKP-content {
                position: relative;
            }

            .success-modalKP .modalKP{
                text-align: center;
                padding: 50px 40px;
            }

            .success-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0 auto 25px;
            }

            .success-icon svg {
                width: 40px;
                height: 40px;
                fill: #fff;
            }

            .success-modalKP p {
                color: #555;
                font-size: 17px;
                line-height: 1.6;
            }

            .ok-btn {
                margin-top: 30px;
                padding: 14px 50px;
                font-size: 16px;
                font-weight: 600;
                color: #fff;
                background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .ok-btn:hover {
                box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4);
            }
        `;
        document.head.appendChild(styles);

        // ============================================
        // HTML РАЗМЕТКА
        // ============================================

        const productOrder = document.querySelector(".product-order, .product-card__order--quick");

        if (productOrder) {
            productOrder.insertAdjacentHTML('afterend', `
            <!-- Главная кнопка -->
            <button class="main-btn" id="openModalBtn">Отримати КП</button>

            <!-- Модальное окно с формой -->
            <div class="modalKP-overlay" id="formModal">
                <div class="modalKP">
                    <div class="modalKP-content">
                        <button class="close-btn" id="closeFormModal">&times;</button>
                        <h2>Отримати комерційну пропозицію</h2>
                        <form id="contactForm">
                            <div class="form-group">
                                <label for="fullName">ПІБ</label>
                                <input type="text" id="fullName" name="fullName" placeholder="Іванов Іван Іванович" required>
                            </div>
                            <div class="form-group">
                                <label for="phone">Телефон</label>
                                <input type="tel" id="phone" name="phone" placeholder="+380 XX XXX XX XX" required>
                            </div>
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input type="email" id="email" name="email" placeholder="example@mail.com" required>
                            </div>
                            <button type="submit" class="submit-btn" id="submitBtn">Отримати</button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Модальное окно успеха -->
            <div class="modalKP-overlay success-modalKP" id="successModal">
                <div class="modalKP">
                    <div class="modalKP-content">
                        <div class="success-icon">
                            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                        </div>
                        <h2>Дякую!</h2>
                        <p>Ваш запит скоро оброблять і вам перетелефонують</p>
                        <button class="ok-btn" id="closeSuccessModal">Добре</button>
                    </div>
                </div>
            </div>
        `)
        }

        // ============================================
        // ФУНКЦИЯ ОТПРАВКИ В TELEGRAM
        // ============================================
        async function sendToTelegram(message, chatId) {
            const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            if (!response.ok) {
                throw new Error('Ошибка отправки в Telegram');
            }

            return response.json();
        }

        // ============================================
        // ЛОГИКА
        // ============================================
        const openModalBtn = document.getElementById('openModalBtn');
        const formModal = document.getElementById('formModal');
        const successModal = document.getElementById('successModal');
        const closeFormModal = document.getElementById('closeFormModal');
        const closeSuccessModal = document.getElementById('closeSuccessModal');
        const contactForm = document.getElementById('contactForm');
        const submitBtn = document.getElementById('submitBtn');

        // Открыть модальное окно с формой
        openModalBtn.addEventListener('click', () => {
            formModal.classList.add('active');
        });

        // Закрыть модальное окно с формой
        closeFormModal.addEventListener('click', () => {
            formModal.classList.remove('active');
        });

        // Закрыть модальное окно успеха
        closeSuccessModal.addEventListener('click', () => {
            successModal.classList.remove('active');
        });

        // Закрытие по клику на overlay
        formModal.addEventListener('click', (e) => {
            if (e.target === formModal) {
                formModal.classList.remove('active');
            }
        });

        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.classList.remove('active');
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                formModal.classList.remove('active');
                successModal.classList.remove('active');
            }
        });

        // Отправка формы
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const email = document.getElementById('email').value.trim();
            const currentPage = window.location.href;
            const currentTime = new Date().toLocaleString('ru-RU');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';

            // Формируем сообщение для Telegram
            const message = `
📬 <b>Нова заявка на отримання КП з сайту!</b>

👤 <b>ПІБ:</b> ${fullName}
📱 <b>Телефон:</b> ${phone}
📧 <b>Email:</b> ${email}

🌐 <b>Сторінка:</b> ${currentPage}
🕐 <b>Час:</b> ${currentTime}
            `.trim();

            try {
                for(let i = 0; i < TELEGRAM_CONFIG.chatId.length; i++) {
                    await sendToTelegram(message, TELEGRAM_CONFIG.chatId[i]);
                }

                // Закрываем форму и показываем успех
                formModal.classList.remove('active');
                contactForm.reset();
                
                setTimeout(() => {
                    successModal.classList.add('active');
                }, 300);

            } catch (error) {
                console.error('Ошибка отправки:', error);
                alert('Произошла ошибка при отправке. Попробуйте позже.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Отправить';
            }
        });

// === script #5 (length=539) ===
(function(d) {
        d.querySelectorAll('.j-phone-item').forEach(function (el) {
            el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
        })
    })(document);
    (function(d, w, s) {
        var widgetHash = '', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
        ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
        var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
      })(document, window, 'script');
