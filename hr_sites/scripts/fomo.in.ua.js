// source: https://fomo.in.ua/
// extracted: 2026-05-07T21:21:24.435Z
// scripts: 4

// === script #1 (length=1156) ===
document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("messenger-button");
    const icon = document.getElementById("messenger-icon");
    const expandedButtons = document.getElementById("expanded-buttons");
    const closeButton = document.getElementById("close-button");

    const icons = [
      "https://cdn-icons-png.flaticon.com/128/2111/2111646.png", // Telegram
      "https://cdn-icons-png.flaticon.com/128/3670/3670059.png"  // Viber
    ];
    let currentIcon = 0;
    let iconInterval;

    function startIconAnimation() {
      iconInterval = setInterval(() => {
        currentIcon = (currentIcon + 1) % icons.length;
        icon.src = icons[currentIcon];
      }, 2000);
    }

    startIconAnimation();

    button.addEventListener("click", () => {
      expandedButtons.classList.add("show");
      button.classList.add("hidden");
      clearInterval(iconInterval);
    });

    closeButton.addEventListener("click", () => {
      expandedButtons.classList.remove("show");
      button.classList.remove("hidden");
      startIconAnimation();
    });
  });

// === script #2 (length=605) ===
// Отримуємо всі елементи з класом "products-menu__item"
var menuItems = document.querySelectorAll('.products-menu__item');

// Проходимося по кожному елементу меню
menuItems.forEach(function(menuItem) {
    // Знаходимо елемент з класом "productsMenu-submenu" в середині поточного елементу меню
    var submenu = menuItem.querySelector('.productsMenu-submenu');
    // Якщо елемент знайдено, додаємо клас "arrow" до елементу з класом "products-menu__title"
    if (submenu) {
        var title = menuItem.querySelector('.products-menu__title');
        title.classList.add('arrow');
    }
});

// === script #3 (length=2024) ===
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




document.addEventListener('DOMContentLoaded', function() {
    // Знайти всі елементи з класом productsMenu-list-i
    var elements = document.querySelectorAll('.productsMenu-list-i');

    elements.forEach(function(element) {
        // Знайти всередині кожного елемента тег <a>
        var anchor = element.querySelector('a');

        // Перевірити, чи є текст "Переглянути все" всередині <a>
        if (anchor && anchor.textContent.trim() === 'Переглянути все') {
            // Додати до <a> стиль display: none
            anchor.style.display = 'none';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Знайти всі елементи з класом productsMenu-submenu-t
    var elements = document.querySelectorAll('.productsMenu-submenu-t');

    elements.forEach(function(element) {
        // Перевірити, чи є текст "Переглянути все" всередині елемента
        if (element.textContent.trim() === 'Переглянути все') {
            // Знайти батьківський елемент з класом productsMenu-submenu-i
            var parent = element.closest('.productsMenu-submenu-i');
            if (parent) {
                // Додати до батьківського елемента стиль display: none
                parent.style.display = 'none';
            }
        }
    });
});

// === script #4 (length=883) ===
document.addEventListener('DOMContentLoaded', function() {
    // Знаходимо всі елементи з класом catalogCard-title
    const catalogCardTitles = document.querySelectorAll('.catalogCard-title');

    // Регулярний вираз для видалення розмірів
    const sizesRegex = /\s*,\s*(S\/M|M\/XL|S|M|L|XL)\b/g;

    // Проходимо по кожному елементу
    catalogCardTitles.forEach(title => {
        // Знаходимо тег a всередині елемента з класом catalogCard-title
        const linkElement = title.querySelector('a');

        if (linkElement) {
            // Отримуємо текст всередині тега a
            let linkText = linkElement.textContent;

            // Видаляємо розміри з тексту
            linkText = linkText.replace(sizesRegex, "");

            // Оновлюємо текст всередині тега a
            linkElement.textContent = linkText.trim();
        }
    });
});
