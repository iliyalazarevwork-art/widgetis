// source: https://balabin.com.ua/
// extracted: 2026-05-07T21:20:52.684Z
// scripts: 3

// === script #1 (length=945) ===
document.addEventListener("DOMContentLoaded", function () {
  // Визначення мови за URL
  const path = window.location.pathname;
  let lang = "ua";
  if (path.startsWith("/ru/")) lang = "ru";
  else if (path.startsWith("/en/")) lang = "en";

  // Тексти для різних мов
  const texts = {
    ua: ["Увійти через Facebook", "Увійти через Google"],
    ru: ["Войти через Facebook", "Войти через Google"],
    en: ["Login with Facebook", "Login with Google"]
  };

  // Обробка кожного .socLogin-b
  const loginBlocks = document.querySelectorAll(".socLogin-b");
  loginBlocks.forEach(block => {
    const icons = block.querySelectorAll(".socialIcon");
    icons.forEach((icon, index) => {
      const svg = icon.querySelector("svg");
      if (svg) {
        const p = document.createElement("p");
        p.textContent = texts[lang][index] || "";
        svg.insertAdjacentElement("afterend", p);
      }
    });
  });
});

// === script #2 (length=2134) ===
document.addEventListener('DOMContentLoaded', function () {
    // Перевіряємо, чи це мобільний пристрій
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Функція для обробки елементів
    function handleProductItems(selector) {
        const productItems = document.querySelectorAll(selector);

        productItems.forEach(item => {
            const detailsElement = document.createElement('details');

            item.classList.forEach(className => {
                detailsElement.classList.add(className);
            });

            const headingElement = item.querySelector('.product-heading__title') || item.querySelector('.heading');

            if (headingElement) {
                const summaryElement = document.createElement('summary');

                while (headingElement.firstChild) {
                    summaryElement.appendChild(headingElement.firstChild);
                }

                detailsElement.appendChild(summaryElement);
            }

            while (item.firstChild) {
                detailsElement.appendChild(item.firstChild);
            }

            item.parentNode.replaceChild(detailsElement, item);
        });
    }

    if (isMobileDevice) {
        handleProductItems('.product__group-item');
    } else {
        handleProductItems('.product__column-item .product__group-item');
    }

    var details = document.querySelectorAll("details");
    if (details.length > 0) {
        for (var i = 0; i < details.length; i++) {
            details[i].addEventListener("toggle", accordion);
        }
    }

    function accordion(event) {
        if (!event.target.open) return;
        var details = event.target.parentNode.children;
        for (var i = 0; i < details.length; i++) {
            if (details[i].tagName != "DETAILS" ||
                !details[i].hasAttribute('open') ||
                event.target == details[i]) {
                continue;
            }
            details[i].removeAttribute("open");
        }
    }
});

// === script #3 (length=800) ===
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll(".product-rating__comments-link").forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();

            const comments = document.querySelector("#comments");
            if (comments) {
                // Знаходимо найближчий <details>
                const details = comments.closest("details");
                if (details && !details.open) {
                    details.open = true; // відкриваємо details
                }

                // Скролимо до коментарів
                comments.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });
});
