// source: https://marbleclo.com.ua/
// extracted: 2026-05-07T21:20:27.093Z
// scripts: 4

// === script #1 (length=605) ===
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

// === script #3 (length=1113) ===
document.addEventListener('DOMContentLoaded', function() {
    // Отримуємо всі елементи з класом "header__layout--bottom"
    var menuTitleLinks = document.querySelectorAll('.header__layout--bottom');
    
    // Отримуємо елемент з класом "shadow_solution__menu"
    var shadowMenu = document.querySelector('.shadow_solution__menu');
    
    // Перевіряємо, чи існує shadowMenu
    if (shadowMenu) {
        // Додаємо події наведення для кожного menuTitleLink
        menuTitleLinks.forEach(function(link) {
            link.addEventListener('mouseenter', function() {
                shadowMenu.setAttribute('active', ''); // Додаємо атрибут 'active'
            });

            link.addEventListener('mouseleave', function() {
                shadowMenu.removeAttribute('active'); // Видаляємо атрибут 'active'
            });
        });
    }
});


/*document.addEventListener('DOMContentLoaded', function() {
    var footerDevelopment = document.querySelector('.footer__development');
    if (footerDevelopment) {
        footerDevelopment.style.display = 'none';
    }
});*/

// === script #4 (length=2808) ===
document.addEventListener('DOMContentLoaded', function() {
    // Знаходимо всі елементи з класами для десктопної версії
    const desktopProductTitles = document.querySelectorAll('.product-title');
    const desktopCatalogCardTitles = document.querySelectorAll('.catalogCard-title');

    // Знаходимо всі елементи з класами для мобільної версії
    const mobileCatalogCardTitles = document.querySelectorAll('.catalog-card__title');
    const mobileProductSections = document.querySelectorAll('.heading--xl');

    // Регулярний вираз для видалення розмірів, включаючи додаткові значення
    const sizesRegex = /\s*,?\s*(XS\/S|S\/M|M\/L|XS|S|M|L|One size|Універсальний)\b/g;

    // Функція для видалення розмірів з тексту
    function removeSizes(text) {
        return text.replace(sizesRegex, "").trim();
    }

    // Обробка елементів для десктопної версії
    desktopProductTitles.forEach(title => {
        // Видаляємо розміри безпосередньо з елемента
        title.textContent = removeSizes(title.textContent);
    });

    desktopCatalogCardTitles.forEach(title => {
        const linkElement = title.querySelector('a');
        if (linkElement) {
            // Видаляємо розміри з тексту всередині тега a
            linkElement.textContent = removeSizes(linkElement.textContent);
        }
    });


    // Обробка елементів для мобільної версії
    mobileCatalogCardTitles.forEach(title => {
        const linkElement = title.querySelector('a');
        if (linkElement) {
            // Видаляємо розміри з тексту всередині тега a
            linkElement.textContent = removeSizes(linkElement.textContent);
        }
    });

    mobileProductSections.forEach(section => {
        // Видаляємо розміри безпосередньо з елемента
        section.textContent = removeSizes(section.textContent);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Знаходимо всі елементи <summary>
    const summaryElements = document.querySelectorAll('summary');

    // Проходимо по кожному елементу <summary>
    summaryElements.forEach(summary => {
        // Отримуємо текст всередині тега <summary>
        const text = summary.textContent.trim();

        // Додаємо відповідний клас залежно від значення тексту
        if (text === 'Склад') {
            summary.classList.add('ico-sol__sklad');
        } else if (text === 'Догляд') {
            summary.classList.add('ico-sol__doglyad');
        } else if (text === 'Доставка та обмін') {
            summary.classList.add('ico-sol__delivery');
        } else if (text === 'Оплата') {
            summary.classList.add('ico-sol__pay');
        } else if (text === 'Розмірна сітка') {
            summary.classList.add('ico-sol__size');
        }
    });
});
