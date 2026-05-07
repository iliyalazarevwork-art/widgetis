// source: https://zrx-shop.com.ua/
// extracted: 2026-05-07T21:23:16.762Z
// scripts: 3

// === script #1 (length=529) ===
document.addEventListener('DOMContentLoaded', function() {
            const mainWidget = document.getElementById('main-widget');
            const actionButtons = document.getElementById('action-buttons');

            mainWidget.addEventListener('click', function() {
                if (actionButtons.style.display === 'none') {
                    actionButtons.style.display = 'flex';
                } else {
                    actionButtons.style.display = 'none';
                }
            });
        });

// === script #2 (length=1482) ===
document.addEventListener('DOMContentLoaded', function () {
        const popup = document.getElementById('popup');
        const overlay = document.getElementById('popup-overlay');
        const closeButton = document.getElementById('close-popup');

        function setCookie(name, value, days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
        }

        function getCookie(name) {
            const cookies = document.cookie.split(';').map(c => c.trim());
            for (let c of cookies) {
                if (c.startsWith(name + "=")) return c.split("=")[1];
            }
            return null;
        }

        function showPopup() {
            popup.classList.add('show');
            overlay.classList.add('show');
        }

        function closePopup() {
            popup.classList.remove('show');
            overlay.classList.remove('show');
            setTimeout(() => {
                popup.style.display = 'none';
                overlay.style.display = 'none';
            }, 300);
            setCookie('popupShown', 'true', 1);
        }

        if (!getCookie('popupShown')) {
            setTimeout(showPopup, 5000);
        }

        closeButton.addEventListener('click', closePopup);
        overlay.addEventListener('click', closePopup);
    });

// === script #3 (length=2072) ===
function copyPromoCode() {
            const codeToCopy = "SALE10";
            const btn = document.getElementById('copy-button');
            
            // Метод копирования
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(codeToCopy).then(showSuccess);
            } else {
                // Резервный метод для старых браузеров
                const textArea = document.createElement("textarea");
                textArea.value = codeToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    showSuccess();
                } catch (err) {
                    console.error('Помилка копіювання', err);
                }
                document.body.removeChild(textArea);
            }

            function showSuccess() {
                const originalText = btn.innerText;
                btn.innerText = "Скопійовано!";
                btn.style.backgroundColor = "#28a745";
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = "#007bff";
                }, 2000);
            }
        }

        function hidePromoBanner() {
            document.getElementById('promo-banner').style.display = 'none';
            // Запоминаем, что пользователь закрыл баннер (на 24 часа)
            const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
            localStorage.setItem('promo_closed_expiry', expiry);
        }

        // Проверка при загрузке: показывать ли баннер
        document.addEventListener("DOMContentLoaded", function() {
            const expiry = localStorage.getItem('promo_closed_expiry');
            const now = new Date().getTime();
            
            if (expiry && now < expiry) {
                document.getElementById('promo-banner').style.display = 'none';
            }
        });
