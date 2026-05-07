// source: https://adara.parts/
// extracted: 2026-05-07T21:19:10.743Z
// scripts: 2

// === script #1 (length=1452) ===
document.addEventListener("DOMContentLoaded", function() {
    // Знайдемо зображення з класом header-logo-img, що міститься всередині будь-якого елементу
    var logoImage = document.querySelector('.header-logo-img');
    var logoImage_mob = document.querySelector('.header__logo-img');

    if (logoImage) {
        // Встановлюємо новий URL для src
        logoImage.src = '/content/uploads/images/main_logo_white.svg';

        // Встановлюємо новий URL для srcset
        logoImage.srcset = '/content/uploads/images/main_logo_white.svg 1x, /content/uploads/images/main_logo_white.svg 2x';
    } else {
        // Встановлюємо новий URL для src
        logoImage_mob.src = '/content/uploads/images/main_logo_white_mob.svg';

        // Встановлюємо новий URL для srcset
        logoImage_mob.srcset = '/content/uploads/images/main_logo_white_mob.svg 1x, /content/uploads/images/main_logo_white_mob.svg 2x';
    }

    // Знайдемо зображення з класом footer__logo-img, що міститься всередині будь-якого елементу
    var logoImage_footer = document.querySelector('.footer__logo-img');

    if (logoImage_footer) {
        // Встановлюємо новий URL для src
        logoImage_footer.src = '/content/uploads/images/main_logo_white.svg';

        // Встановлюємо новий URL для srcset
        logoImage_footer.srcset = '/content/uploads/images/main_logo_white.svg 1x, /content/uploads/images/main_logo_white.svg 2x';
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
