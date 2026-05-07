// source: https://gzpt.com.ua/
// extracted: 2026-05-07T21:19:02.521Z
// scripts: 1

// === script #1 (length=3928) ===
document.addEventListener('DOMContentLoaded', function () {
    const isRussianPage = window.location.pathname.startsWith('/ru/');
    const browserLang = navigator.language || navigator.userLanguage;
    const isUkrainianLang = browserLang.toLowerCase().startsWith('uk');
    const preference = localStorage.getItem('languagePreference');

    // Автоматичне перенаправлення, якщо вже обрав українську
    if (isRussianPage && preference === 'ua') {
        const newUrl = window.location.href.replace('/ru/', '/');
        window.location.href = newUrl;
        return;
    }

    // Показати попап, якщо ще не показували і мова — українська
    if (isRussianPage && isUkrainianLang && !localStorage.getItem('languagePopupShown')) {
        showLanguagePopup();
        localStorage.setItem('languagePopupShown', 'true');
    }

    function showLanguagePopup() {
        const popup = document.createElement('div');
        popup.id = 'language-popup';
        popup.innerHTML = `
            <div class="language-popup-content">
                <p class="language-popup-text">Бажаєте перейти на українську версію сайту?</p>
                <div class="language-popup-buttons">
                    <button id="switch-to-ua">Перейти на українську</button>
                    <button id="stay-on-ru">Залишитися на російській</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        document.getElementById('switch-to-ua').addEventListener('click', function () {
            localStorage.setItem('languagePreference', 'ua');
            const newUrl = window.location.href.replace('/ru/', '/');
            window.location.href = newUrl;
        });

        document.getElementById('stay-on-ru').addEventListener('click', function () {
            popup.remove();
        });

        applyPopupStyles();
    }

    function applyPopupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #language-popup {
                position: fixed;
                top: 0; left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .language-popup-content {
                background: #ffffff;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                text-align: center;
                max-width: 90%;
                font-family: 'Roboto', sans-serif;
            }

            .language-popup-text {
                font-size: 22px;
                color: #000000;
                margin-bottom: 25px;
            }

            .language-popup-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .language-popup-buttons button {
                padding: 12px 20px;
                font-size: 16px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Roboto', sans-serif;
            }

            #switch-to-ua {
                background-color: #9C1727;
                color: white;
            }

            #switch-to-ua:hover {
                background-color: #7e101f;
            }

            #stay-on-ru {
                background-color: #e0e0e0;
                color: #000;
            }

            #stay-on-ru:hover {
                background-color: #c6c6c6;
            }
        `;
        document.head.appendChild(style);
    }
});
