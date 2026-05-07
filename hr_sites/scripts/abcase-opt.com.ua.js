// source: https://abcase-opt.com.ua/
// extracted: 2026-05-07T21:20:40.631Z
// scripts: 4

// === script #1 (length=580) ===
(function(w,d){var hS=w.helpcrunchSettings;if(!hS||!hS.organization){return;}var widgetSrc='https://'+hS.organization+'.widget.helpcrunch.com/';w.HelpCrunch=function(){w.HelpCrunch.q.push(arguments)};w.HelpCrunch.q=[];function r(){if (d.querySelector('script[src="' + widgetSrc + '"')) { return; }var s=d.createElement('script');s.async=1;s.type='text/javascript';s.src=widgetSrc;(d.body||d.head).appendChild(s);}if(d.readyState === 'complete'||hS.loadImmediately){r();} else if(w.attachEvent){w.attachEvent('onload',r)}else{w.addEventListener('load',r,false)}})(window, document)

// === script #2 (length=3304) ===
document.addEventListener("DOMContentLoaded", function() {
      
      // 1. НАДІЙНА ПЕРЕВІРКА НА АВТОРИЗАЦІЮ
      // Шукаємо стандартні кнопки входу Хорошопу (десктопну або мобільну)
      var desktopLoginExists = document.querySelector('.userbar__button[data-modal="#sign-in"]') !== null;
      var mobileLoginExists = document.querySelector('a[data-panel][data-menu="auth"]') !== null;

      // Якщо жодної кнопки "Вхід" на сторінці немає — клієнт вже авторизований!
      if (!desktopLoginExists && !mobileLoginExists) {
          return; // Просто зупиняємо скрипт, кнопки не малюємо
      }

      // Знаходимо блок навігації мобільного меню
      var navWrapper = document.querySelector('.catalog-navigation.wrapper');
      if (!navWrapper) return;

      // Створюємо загальний контейнер
      var buttonsContainer = document.createElement('div');
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.gap = '5px'; 
      buttonsContainer.style.flex = '1';  

      // Створюємо кнопку "УВІЙТИ"
      var loginBtn = document.createElement('button');
      loginBtn.className = 'btn btn--auth custom-login-btn'; 
      loginBtn.style.flex = '1';
      loginBtn.style.padding = '0';
      loginBtn.style.fontSize = '13px';
      loginBtn.textContent = 'Увійти';

      // Створюємо кнопку "РЕЄСТРАЦІЯ"
      var regBtn = document.createElement('button');
      regBtn.className = 'btn btn--auth custom-reg-btn'; 
      regBtn.style.flex = '1';
      regBtn.style.padding = '0';
      regBtn.style.fontSize = '13px';
      regBtn.textContent = 'Реєстрація';

      // Додаємо кнопки на екран
      buttonsContainer.appendChild(loginBtn);
      buttonsContainer.appendChild(regBtn);
      navWrapper.appendChild(buttonsContainer);

      // --- ЛОГІКА ДЛЯ КНОПОК ---
      loginBtn.addEventListener('click', function(e) {
          e.preventDefault();
          var authLink = document.querySelector('a[data-panel][data-menu="auth"]');
          if (authLink) {
              authLink.click();
              var attempts = 0;
              var checkTabInterval = setInterval(function() {
                  attempts++;
                  var mobileLoginTab = document.querySelector('.mm-panel.is-active a[href="#sign-in"]') || document.querySelector('a[href="#sign-in"]');
                  if (mobileLoginTab) { mobileLoginTab.click(); clearInterval(checkTabInterval); }
                  if (attempts > 20) clearInterval(checkTabInterval);
              }, 100);
          }
      });

      regBtn.addEventListener('click', function(e) {
          e.preventDefault();
          var authLink = document.querySelector('a[data-panel][data-menu="auth"]');
          if (authLink) {
              authLink.click();
              var attempts = 0;
              var checkTabInterval = setInterval(function() {
                  attempts++;
                  var mobileRegTab = document.querySelector('.mm-panel.is-active a[href="#sign-up"]') || document.querySelector('a[href="#sign-up"]');
                  if (mobileRegTab) { mobileRegTab.click(); clearInterval(checkTabInterval); }
                  if (attempts > 20) clearInterval(checkTabInterval);
              }, 100);
          }
      });
  });

// === script #3 (length=1925) ===
document.addEventListener("DOMContentLoaded", function() {
    const bannersGroup = document.querySelector(".banners-group");
    if (!bannersGroup) return;

    const buttonWrapper = document.createElement("div");
    buttonWrapper.className = "custom-auth-btn-wrapper";

    // Змінено текст кнопки на "Реєстрація на сайті"
    buttonWrapper.innerHTML = `
      <button class="custom-auth-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" fill="currentColor"/>
          <path d="M12 14C7.58172 14 4 16.6863 4 20V21H20V20C20 16.6863 16.4183 14 12 14Z" fill="currentColor"/>
        </svg>
        <span>Реєстрація на сайті</span>
      </button>
      <div class="custom-auth-label">Доступ лише для зареєстрованих користувачів</div>
    `;

    const authBtn = buttonWrapper.querySelector(".custom-auth-btn");
    authBtn.addEventListener("click", function() {
      // Знаходимо стандартну кнопку відкриття попапу
      const defaultAuthButton = document.querySelector(".userbar__button[data-modal='#sign-in']");
      
      if (defaultAuthButton) {
        // 1. Відкриваємо загальне вікно
        defaultAuthButton.click();
        
        // 2. Даємо вікну 100 мілісекунд на появу і клікаємо на вкладку "Реєстрація"
        setTimeout(function() {
            const regTab = document.querySelector('a[href="#j-popup-tab-signup"]');
            if (regTab) {
                regTab.click();
            } else {
                console.warn("Вкладку реєстрації не знайдено у вікні.");
            }
        }, 100);
      } else {
        console.error("Стандартна кнопка входу не знайдена.");
      }
    });

    bannersGroup.insertAdjacentElement("afterend", buttonWrapper);
  });

// === script #4 (length=4437) ===
document.addEventListener("DOMContentLoaded", function() {
    // Перевіряємо, чи клієнт вже авторизований
    const isUserLoggedIn = document.querySelector('a[href*="/security/logout/"]') !== null || 
                           document.querySelector('.userbar__button[data-modal="#sign-in"]') === null;
                           
    // ЗМІНА ТУТ: Використовуємо localStorage, щоб запам'ятати клієнта назавжди
    const hasSeenModal = localStorage.getItem('authModalSeen');

    // Показуємо вікно ТІЛЬКИ якщо клієнт НЕ залогінений і НІКОЛИ раніше не бачив цього вікна
    if (!isUserLoggedIn && !hasSeenModal) {
        const modal = document.getElementById('customAuthModal');
        const closeBtn = document.getElementById('closeAuthModal');
        const loginBtn = document.getElementById('triggerHoroshopLogin');
        const regBtn = document.getElementById('triggerHoroshopRegister');
        
        // Показуємо вікно із затримкою 25 секунд
        setTimeout(function() {
            if (modal) {
                modal.style.display = 'flex'; // Робимо вікно видимим
                modal.style.setProperty('display', 'flex', 'important'); // Перебиваємо стилі Хорошопу
            }
        }, 25000);

        function closeModal() {
            modal.style.display = 'none';
            modal.style.setProperty('display', 'none', 'important');
            
            // ЗМІНА ТУТ: Записуємо в довгострокову пам'ять, що вікно вже було показане
            localStorage.setItem('authModalSeen', 'true');
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) closeModal();
            });
        }

        // --- ЛОГІКА ДЛЯ КНОПКИ "УВІЙТИ" ---
        if (loginBtn) {
            loginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const desktopLogin = document.querySelector('.userbar__button[data-modal="#sign-in"]');
                const mobileLogin = document.querySelector('a[data-panel][data-menu="auth"]');
                
                if (desktopLogin) {
                    desktopLogin.click();
                } else if (mobileLogin) {
                    mobileLogin.click();
                    setTimeout(function() {
                        const mobileLoginTab = document.querySelector('.mm-panel.is-active a[href="#sign-in"]') || document.querySelector('a[href="#sign-in"]');
                        if(mobileLoginTab) mobileLoginTab.click();
                    }, 100);
                }
                closeModal(); // Закриваємо вікно і запам'ятовуємо це
            });
        }

        // --- ЛОГІКА ДЛЯ КНОПКИ "РЕЄСТРАЦІЯ" ---
        if (regBtn) {
            regBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const desktopLogin = document.querySelector('.userbar__button[data-modal="#sign-in"]');
                const mobileLogin = document.querySelector('a[data-panel][data-menu="auth"]');
                
                if (desktopLogin) {
                    desktopLogin.click();
                    let attempts = 0;
                    let checkTabInterval = setInterval(function() {
                        attempts++;
                        const regTab = document.querySelector('.popup__tabs-nav a[href="#j-popup-tab-signup"]');
                        if (regTab) { regTab.click(); clearInterval(checkTabInterval); }
                        if (attempts > 20) clearInterval(checkTabInterval);
                    }, 100);
                } else if (mobileLogin) {
                    mobileLogin.click();
                    let attempts = 0;
                    let checkTabInterval = setInterval(function() {
                        attempts++;
                        const mobileRegTab = document.querySelector('.mm-panel.is-active a[href="#sign-up"]') || document.querySelector('a[href="#sign-up"]');
                        if (mobileRegTab) { mobileRegTab.click(); clearInterval(checkTabInterval); }
                        if (attempts > 20) clearInterval(checkTabInterval);
                    }, 100);
                }
                closeModal(); // Закриваємо вікно і запам'ятовуємо це
            });
        }
    }
});
