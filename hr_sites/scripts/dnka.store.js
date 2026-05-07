// source: https://dnka.store/
// extracted: 2026-05-07T21:20:27.346Z
// scripts: 2

// === script #1 (length=513) ===
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        // Отримуємо всі елементи з класом "recentProducts"
        const recentProducts = document.querySelectorAll('.recentProducts');

        // Ітеруємося по кожному елементу з класом "recentProducts"
        recentProducts.forEach(element => {
            // Додаємо клас "wrapper" до елементу
            element.classList.add('wrapper');
        });
    }, 1000); // Затримка виконання коду на 2 секунди
});

// === script #2 (length=707) ===
const toggles = document.querySelectorAll('.faq-toggle');

toggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
  toggle.parentNode.classList.toggle('active');
  });
});

var details = document.querySelectorAll("details");
for(i=0;i<details.length;i++) {
  details[i].addEventListener("toggle", accordion);
}
function accordion(event) {
  if (!event.target.open) return;
    var details = event.target.parentNode.children;
    for(i=0;i<details.length;i++) {
      if (details[i].tagName != "DETAILS" || 
         !details[i].hasAttribute('open') || 
         event.target == details[i]) {
         continue;
      }
      details[i].removeAttribute("open");
    }
}
