// source: https://kroner-shop.com.ua/
// extracted: 2026-05-07T21:21:47.577Z
// scripts: 1

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
