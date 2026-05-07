// source: https://starmax.com.ua/
// extracted: 2026-05-07T21:20:22.904Z
// scripts: 1

// === script #1 (length=11404) ===
(function() {
    'use strict';

    // Конфігурація
    const CONFIG = {
        popupDelay: 3000, // 3 секунд у мілісекундах
        storageKey: 'starmax_lang_popup_shown',
        currentHost: 'https://starmax.com.ua'
    };

    // Перевірка чи поточна сторінка російської версії
    function isRussianVersion() {
        const currentUrl = window.location.href;
        const currentPath = window.location.pathname;
        
        // Перевіряємо що це правильний домен
        if (!currentUrl.includes(CONFIG.currentHost)) {
            return false;
        }
        
        // Перевіряємо що це НЕ українська версія (/ua/)
        if (currentPath.startsWith('/ua/') || currentPath === '/ua') {
            return false;
        }
        
        return true;
    }

    // Перевірка чи попап вже показувався
    function isPopupAlreadyShown() {
        return localStorage.getItem(CONFIG.storageKey) === 'true';
    }

    // Створення CSS стилів
    function createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .lang-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 999999;
                font-family: Arial, sans-serif;
                animation: fadeIn 0.3s ease;
            }
            
            .lang-popup-container {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 400px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                animation: slideUp 0.4s ease;
            }
            
            .lang-popup-header {
                background: #069404;
                color: white;
                padding: 20px;
                text-align: center;
                position: relative;
            }
            
            .lang-popup-title {
                font-size: 22px;
                font-weight: bold;
                margin: 0;
            }
            
            .lang-popup-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            }
            
            .lang-popup-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .lang-popup-content {
                padding: 30px 20px;
                text-align: center;
            }
            
            .lang-popup-text {
                font-size: 16px;
                color: #333;
                margin-bottom: 30px;
                line-height: 1.5;
            }
            
            .lang-buttons-container {
                display: flex;
                gap: 15px;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .lang-button {
                padding: 18px 30px;
                border: none;
                border-radius: 8px;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 150px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .lang-button-ua {
                background: #069404;
                color: white;
                border: 1px solid #069404;
            }
            
            .lang-button-ua:hover {
                background: #069404;
                border-color: #069404;
            }
            
            .lang-button-ru {
                background: white;
                color: black;
                border: 1px solid black;
            }
            
            .lang-button-ru:hover {
                background: #f8f8f8;
                color: black;
                border-color: black;
            }
            
            .lang-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }
            
            .lang-button:active {
                transform: translateY(-1px);
            }
            
            .lang-popup-footer {
                padding: 15px;
                text-align: center;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
                font-size: 14px;
                color: #666;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(30px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @media (max-width: 480px) {
                .lang-popup-container {
                    width: 95%;
                    margin: 10px;
                }
                
                .lang-buttons-container {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .lang-button {
                    width: 100%;
                    padding: 16px 20px;
                    font-size: 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Створення HTML структури попапа
    function createPopupHTML() {
        const overlay = document.createElement('div');
        overlay.className = 'lang-popup-overlay';
        
        overlay.innerHTML = `
            <div class="lang-popup-container">
                <div class="lang-popup-header">
                    <h2 class="lang-popup-title">Вибір мови сайту</h2>
                    <button class="lang-popup-close" aria-label="Закрити">×</button>
                </div>
                
                <div class="lang-popup-content">
                    <p class="lang-popup-text">
                        Якій мові сайту Ви надаєте перевагу?
                    </p>
                    
                    <div class="lang-buttons-container">
                        <button class="lang-button lang-button-ua" data-lang="ua">
                            Українська
                        </button>
                        
                        <button class="lang-button lang-button-ru" data-lang="ru">
                            Російська
                        </button>
                    </div>
                </div>
                
                <div class="lang-popup-footer">
                    Ви завжди можете змінити мову у шапці сайту
                </div>
            </div>
        `;
        
        return overlay;
    }

    // Отримання поточного шляху для редіректу
    function getCurrentPathForRedirect() {
        const path = window.location.pathname;
        const search = window.location.search;
        const hash = window.location.hash;
        
        // Якщо це головна сторінка
        if (path === '/' || path === '') {
            return '/ua/';
        }
        
        // Додаємо /ua/ перед поточним шляхом
        return `/ua${path}${search}${hash}`;
    }

    // Обробник вибору мови
    function handleLanguageSelect(lang) {
        // Запам'ятовуємо що попап вже показувався
        localStorage.setItem(CONFIG.storageKey, 'true');
        
        if (lang === 'ua') {
            // Редірект на українську версію
            const redirectUrl = getCurrentPathForRedirect();
            window.location.href = redirectUrl;
        } else if (lang === 'ru') {
            // Закриваємо попап
            closePopup();
        }
    }

    // Закриття попапа
    function closePopup() {
        const overlay = document.querySelector('.lang-popup-overlay');
        if (overlay) {
            // Анімація закриття
            overlay.style.opacity = '0';
            overlay.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                overlay.remove();
            }, 300);
            
            // Запам'ятовуємо що попап вже показувався
            localStorage.setItem(CONFIG.storageKey, 'true');
        }
    }

    // Показ попапа
    function showPopup() {
        // Створюємо стилі
        createStyles();
        
        // Створюємо попап
        const popup = createPopupHTML();
        document.body.appendChild(popup);
        
        // Додаємо обробники подій
        const closeBtn = popup.querySelector('.lang-popup-close');
        const langButtons = popup.querySelectorAll('.lang-button');
        const overlay = popup;
        
        // Закриття по кнопці
        closeBtn.addEventListener('click', closePopup);
        
        // Закриття по кліку на оверлей
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closePopup();
            }
        });
        
        // Обробка вибору мови
        langButtons.forEach(button => {
            button.addEventListener('click', function() {
                const lang = this.getAttribute('data-lang');
                handleLanguageSelect(lang);
            });
        });
        
        // Запобігаємо прокрутку тіла під попапом
        document.body.style.overflow = 'hidden';
        
        // Відновлюємо прокрутку після закриття
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (!document.querySelector('.lang-popup-overlay')) {
                    document.body.style.overflow = '';
                    observer.disconnect();
                }
            });
        });
        
        observer.observe(document.body, { childList: true });
    }

    // Ініціалізація
    function init() {
        // Перевіряємо умови
        if (!isRussianVersion()) {
            return;
        }
        
        if (isPopupAlreadyShown()) {
            return;
        }
        
        // Чекаємо повного завантаження сторінки
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(showPopup, CONFIG.popupDelay);
            });
        } else {
            setTimeout(showPopup, CONFIG.popupDelay);
        }
    }

    // Запускаємо скрипт
    init();

})();
