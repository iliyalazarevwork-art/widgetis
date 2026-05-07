// source: https://vikno.shop/
// extracted: 2026-05-07T21:19:08.539Z
// scripts: 4

// === script #1 (length=2630) ===
setInterval(openChatPopup, 100000);

    document.getElementById('chatsChatButton').addEventListener('click', function () {
      openChatPopup();
    });

    document.getElementById('overlay').addEventListener('click', function () {
      closeChatsPopup();
    });

    var messengerButtons = document.querySelectorAll('.chats-messenger-chats');
    messengerButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var messenger = this.getAttribute('data-messenger');
        openMessenger(messenger);
      });
    });

    setInterval(changeChatIcon, 7000);

    function changeChatIcon() {
      var chatIcon = document.querySelector('.chat-icon');
      var chatIcon2 = document.querySelector('.chat-icon-2');

      if (chatIcon.style.display === 'none') {
        chatIcon.style.display = 'block';
        chatIcon2.style.display = 'none';
      } else {
        chatIcon.style.display = 'none';
        chatIcon2.style.display = 'block';
      }

      chatIcon2.classList.toggle('animate__animated');
      chatIcon2.classList.toggle('animate__bounce');
      chatIcon.classList.remove('animate__animated');
    }

    function openChatPopup() {
      var popup = document.getElementById('chatsChatPopup');
      var overlay = document.getElementById('overlay');
      popup.style.display = 'block';
      overlay.style.display = 'block';
      positionPopup();
      updateTime();
    }

    function positionPopup() {
      var popup = document.getElementById('chatsChatPopup');
      var button = document.getElementById('chatsChatButton');
      var buttonRect = button.getBoundingClientRect();

      popup.style.bottom = window.innerHeight - buttonRect.top + 15 + 'px';
      popup.style.left = buttonRect.left + 3 + 'px';
    }

    function updateTime() {
      var timeElement = document.getElementById('chatsChatTime');
      var userTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false });
      timeElement.textContent = userTime;
      setTimeout(updateTime, 1000);
    }

    function closeChatsPopup() {
      var popup = document.getElementById('chatsChatPopup');
      var overlay = document.getElementById('overlay');
      popup.style.display = 'none';
      overlay.style.display = 'none';
    }

    function openMessenger(messenger) {
      if (messenger === 'viber') {
        window.open('viber://chat?number=%2B380678388420');
      } else if (messenger === 'telegram') {
        window.open('https://t.me/vikno_shop');
      }
    }

// === script #2 (length=5046) ===
document.addEventListener('DOMContentLoaded', () => {
        // Ініціалізація EmailJS з вашим публічним ключем
        emailjs.init('cL1Uztg1nngymuEUZ');

        const btn = document.getElementById('callbackBtn');
        const form = document.getElementById('callbackForm');
        const overlay = document.getElementById('overlay');
        const overlayThankYou = document.getElementById('overlay-thankyou');
        const input = document.getElementById('phoneInput');
        const thankYou = document.getElementById('thankYouMessage');
        const timerText = document.getElementById('timer-text');
        
        const dateInput = document.getElementById('callback-date');
        const timeInput = document.getElementById('callback-time');

        // Функція для відкриття форми
        const openForm = () => {
            form.style.display = 'block';
            overlay.style.display = 'block';
            thankYou.style.display = 'none';
        };

        // --- ВИПРАВЛЕНО ТА СПРОЩЕНО ---

        const popupTimestampKey = 'popupTimestamp';
        const popupShownKey = 'popupShown';
        const triggerTimeMs = 90000; // 1.5 хвилини = 90000 мс

        // Перевірка, чи вже був показаний попап в рамках сесії
        const popupShown = localStorage.getItem(popupShownKey) === 'true';

        // Якщо попап ще не показувався
        if (!popupShown) {
            let initialTimestamp = localStorage.getItem(popupTimestampKey);

            // Якщо немає мітки часу, зберігаємо поточну
            if (!initialTimestamp) {
                localStorage.setItem(popupTimestampKey, Date.now());
                initialTimestamp = Date.now();
            }

            // Розрахунок часу, що залишився
            const timeRemaining = triggerTimeMs - (Date.now() - initialTimestamp);

            // Якщо час вже минув, відкриваємо форму негайно
            if (timeRemaining <= 0) {
                openForm();
                localStorage.setItem(popupShownKey, 'true');
            } else {
                // Якщо час ще не минув, запускаємо таймер
                setTimeout(() => {
                    openForm();
                    localStorage.setItem(popupShownKey, 'true');
                }, timeRemaining);
            }
        }
        
        // --- КІНЕЦЬ ВИПРАВЛЕНЬ ---

        // Відкриття форми по кліку
        btn.addEventListener('click', openForm);
        
        overlay.addEventListener('click', () => {
            form.style.display = 'none';
            overlay.style.display = 'none';
        });
        
        overlayThankYou.addEventListener('click', () => {
            thankYou.style.display = 'none';
            overlayThankYou.style.display = 'none';
        });

        const phoneMask = IMask(input, {
            mask: '+{38}(000)000-00-00',
            definitions: {
                '#': /[0-9]/
            }
        });

        form.addEventListener('submit', function(event) {
            event.preventDefault(); 

            if (!phoneMask.masked.isComplete) {
                alert('Будь ласка, введіть повний номер телефону.');
                return;
            }

            const callbackDate = dateInput.value;
            const callbackTime = timeInput.value;
            let timerMessage = '';

            if (callbackDate && callbackTime) {
                timerMessage = `Заявку прийнято. Ми зателефонуємо ${callbackDate} о ${callbackTime}.`;
            } else {
                timerMessage = `Залишилося 30 секунд`;
            }

            emailjs.send('service_727u0l1', 'template_3w24xhc', {
                phone_number: phoneMask.unmaskedValue,
                callback_date: callbackDate,
                callback_time: callbackTime
            })
            .then(() => {
                form.style.display = 'none';
                overlay.style.display = 'none';
                thankYou.style.display = 'block';
                overlayThankYou.style.display = 'block'; 
                input.value = '';
                dateInput.value = ''; 
                timeInput.value = '';

                timerText.textContent = timerMessage;

                if (!callbackDate && !callbackTime) {
                    let timeLeft = 30;
                    const timerInterval = setInterval(() => {
                        timeLeft--;
                        if (timeLeft > 0) {
                            timerText.textContent = `Залишилося ${timeLeft} секунд`;
                        } else {
                            timerText.textContent = `Ми зателефонуємо вам найближчим часом.`;
                            clearInterval(timerInterval);
                        }
                    }, 1000);
                }
            }, (error) => {
                alert('Не вдалося відправити заявку. Спробуйте пізніше.');
                console.log('Помилка:', error);
            });
        });
    });

// === script #3 (length=2352) ===
function viknoSlideIn() {
      var container = document.getElementById('vikno-popup-container');
      container.style.left = '5px';
      var callBtnContainer = document.getElementById('callBtnContainer');
      callBtnContainer.style.left = '5px';
      var closeVikno = document.getElementById('closeVikno');
      closeVikno.style.left = '355px';

      // Зберегти інформацію у локальне сховище про те, що поп-ап був вже відображений
      localStorage.setItem('popupDisplayed', 'true');

      // Відобразити затемнений фон
      var overlay = document.getElementById('overlay');
      overlay.style.display = 'block';
    }

    function closePopup() {
      var container = document.getElementById('vikno-popup-container');
      container.style.left = '-2000px';
      var callBtnContainer = document.getElementById('callBtnContainer');
      callBtnContainer.style.left = '-2000px';
      closeVikno.style.left = '-2000px';

      // Приховати затемнений фон
      var overlay = document.getElementById('overlay');
      overlay.style.display = 'none';
    }

    document.addEventListener('DOMContentLoaded', function () {
      // Перевірити, чи поп-ап вже був відображений під час поточного сеансу
      var popupDisplayed = localStorage.getItem('popupDisplayed');

      // Якщо поп-ап ще не відображався, відобразити його після таймауту
      if (!popupDisplayed) {
        setTimeout(viknoSlideIn, 10000);
      }
    });

    var closeVikno = document.getElementById('closeVikno');
    var vkladka = document.getElementById('vkladka');

    // Додати обробник подій для вкладки
    vkladka.addEventListener('click', function () {
      // Відобразити поп-ап миттєво
      var container = document.getElementById('vikno-popup-container');
      container.style.left = '5px';
      var callBtnContainer = document.getElementById('callBtnContainer');
      callBtnContainer.style.left = '5px';
      closeVikno.style.left = '355px';

      // Відобразити затемнений фон
      var overlay = document.getElementById('overlay');
      overlay.style.display = 'block';
    });

    // Додати обробник подій для закриття поп-апу при кліку на фон або "X"
    document.getElementById('overlay').addEventListener('click', closePopup);
    closeVikno.addEventListener('click', closePopup);

// === script #4 (length=3259) ===
const popup = document.getElementById('popup-form');
        const closeBtn = document.getElementById('close-popup');
        const form = document.getElementById('cashback-form');
        const submitBtn = document.getElementById('submit-btn');

        // Функція для плавного показу попапу
        function showPopup() {
            popup.style.display = 'flex';
            setTimeout(() => {
                popup.style.opacity = '1';
            }, 10);
        }

        // Функція для плавного приховування попапу
        function hidePopup() {
            popup.style.opacity = '0';
            setTimeout(() => {
                popup.style.display = 'none';
            }, 300); // Час збігається з transition в CSS
        }

        // Автоматичне відкриття строго через 5 секунд після завантаження (з перевіркою URL)
        window.addEventListener('load', () => {
            // Список URL-адрес, на яких попап показувати НЕ потрібно
            const excludedPaths = [
                '/kalkuliator-metaloplastykovykh-vikon/',
                '/zamir/',
                '/store-reviews/',
                '/rehuliuvannia-plastykovykh-vikon/',
                '/balkony-pid-kliuch/',
                '/frantsuzkyi-balkon/',
                '/balkon003/',
                '/balkon001/',
                '/balkon002/',
                '/balkon004/',
                '/balkon005/',
                '/balkon006/',
                '/balkon007/',
                '/balkon008/',
                '/balkon009/',
                '/prybudova-balkonu.-prybudova-do-budynku/',
                '/balkon-pid-kliuch-kyiv/'
            ];

            const currentPath = window.location.pathname;

            // Перевіряємо, чи містить поточна адреса хоча б один шлях зі списку
            const isExcluded = excludedPaths.some(path => currentPath.includes(path));

            // Якщо сторінка не входить до списку виключень, запускаємо таймер
            if (!isExcluded) {
                setTimeout(showPopup, 5000); 
            }
        });

        // Закриття по хрестику
        closeBtn.addEventListener('click', hidePopup);

        // Закриття по кліку на темний фон поза попапом
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                hidePopup();
            }
        });

        // Відправка форми
        form.addEventListener('submit', function(event) {
            event.preventDefault(); 
            submitBtn.style.cursor = 'wait';

            const serviceID = 'service_727u0l1';
            const templateID = 'template_u32vxho';

            emailjs.sendForm(serviceID, templateID, this)
                .then(() => {
                    alert('Дякуємо! Ваша заявка на кешбек успішно відправлена.');
                    form.reset(); 
                    hidePopup();
                }, (err) => {
                    alert('Сталася помилка при відправці. Перевірте з\'єднання та спробуйте ще раз.');
                    console.error('EmailJS Error:', err);
                })
                .finally(() => {
                    submitBtn.style.cursor = 'pointer';
                });
        });
