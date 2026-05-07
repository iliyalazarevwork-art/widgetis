// source: https://get-app.com.ua/
// extracted: 2026-05-07T21:19:40.554Z
// scripts: 1

// === script #1 (length=560) ===
// Функция для показа/скрытия текста
        function toggleContent() {
            const content = document.querySelector('.hidden-content');
            const button = document.querySelector('.show-button');
            
            if (content.style.display === "none" || content.style.display === "") {
                content.style.display = "block";
                button.textContent = "Згорнути";
            } else {
                content.style.display = "none";
                button.textContent = "Розгорнути";
            }
        }
