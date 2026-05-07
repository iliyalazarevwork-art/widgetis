// source: https://tviymacbook.com/
// extracted: 2026-05-07T21:20:19.328Z
// scripts: 1

// === script #1 (length=991) ===
function toggleLinks() {
            const links = document.querySelector('.social-links');
            const btn = document.getElementById('mainBtn');
            const path = document.getElementById('svgPath');
            
            links.classList.toggle('show');
            
            if (links.classList.contains('show')) {
                // Змінюємо на ХРЕСТИК
                path.setAttribute('d', 'M18 6L6 18M6 6l12 12');
                btn.classList.remove('pulse');
                btn.style.transform = 'scale(0.9) rotate(90deg)';
            } else {
                // Повертаємо ПОВІДОМЛЕННЯ
                path.setAttribute('d', 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z');
                btn.classList.add('pulse');
                btn.style.transform = 'scale(1) rotate(0deg)';
            }
        }
