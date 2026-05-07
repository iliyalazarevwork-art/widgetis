// source: https://vertogarment.com/
// extracted: 2026-05-07T21:23:07.962Z
// scripts: 2

// === script #1 (length=840) ===
document.addEventListener('DOMContentLoaded', function () {
    const faqItems = document.querySelectorAll('.sol-faq-item');

    faqItems.forEach(item => {
        const questionButton = item.querySelector('.sol-faq-question');
        const answerDiv = item.querySelector('.sol-faq-answer');

        questionButton.addEventListener('click', () => {
            const isExpanded = questionButton.getAttribute('aria-expanded') === 'true';

            questionButton.setAttribute('aria-expanded', !isExpanded);
            
            if (!isExpanded) {
                // Відкриваємо відповідь
                answerDiv.style.maxHeight = answerDiv.scrollHeight + 'px';
            } else {
                // Закриваємо відповідь
                answerDiv.style.maxHeight = '0';
            }
        });
    });
});

// === script #2 (length=4915) ===
(function () {
    const CUSTOM_TEXT = "Під замовлення 2-3 дні";
    const SOLD_OUT_TEXT = "Немає в наявності";
    // Замість фіксованого тексту використовуємо регулярний вираз
    const TARGET_STICKER_PATTERN = /^\d+-\d+\s+дн[іi][в]?$/;

    function debounce(fn, delay) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // Повертає всі стікер-блоки (десктоп + моб)
    function getStickerBlocks(scope = document) {
        return scope.querySelectorAll(".productSticker, .product-sticker");
    }

    // Перевіряє, чи є в блоці стікер з потрібним текстом (використовує регулярний вираз)
    function hasTargetSticker(stickerBlock) {
        const contents = stickerBlock.querySelectorAll(".productSticker-content, .product-sticker__content");
        return Array.from(contents).some(
            (el) => {
                const text = (el.textContent || "").trim();
                console.log(`Перевіряємо текст стікера: "${text}"`);
                const matches = TARGET_STICKER_PATTERN.test(text);
                console.log(`Чи відповідає паттерну: ${matches}`);
                return matches;
            }
        );
    }

    // Функція для генерації кастомного тексту на основі знайденого стікера
    function generateCustomText(stickerBlock) {
        const contents = stickerBlock.querySelectorAll(".productSticker-content, .product-sticker__content");
        
        for (const el of contents) {
            const text = (el.textContent || "").trim();
            console.log(`Генеруємо текст для: "${text}"`);
            if (TARGET_STICKER_PATTERN.test(text)) {
                const customText = `Під замовлення ${text}`;
                console.log(`Згенерований текст: "${customText}"`);
                return customText;
            }
        }
        
        console.log(`Використовуємо fallback: "${CUSTOM_TEXT}"`);
        return CUSTOM_TEXT; // Fallback до дефолтного значення
    }

    // Знаходимо релевантні елементи доступності відносно блоку товару
    function findAvailabilityEls(scope) {
        const productScope = scope.closest?.(".product") || document;
        return productScope.querySelectorAll(".product-header__availability, .presence-status");
    }

    // Головна функція оновлення
    function updateAvailability() {
        const stickerBlocks = getStickerBlocks();
        if (!stickerBlocks.length) return;

        stickerBlocks.forEach((stickerBlock) => {
            const hasTarget = hasTargetSticker(stickerBlock);
            const availabilityEls = findAvailabilityEls(stickerBlock);

            availabilityEls.forEach((el) => {
                const current = (el.textContent || "").trim();

                // Якщо зараз “Немає в наявності” — нічого не змінюємо
                if (current === SOLD_OUT_TEXT) return;

                // Запам'ятаємо оригінал один раз
                if (!el.dataset.originalAvailabilitySaved) {
                    el.dataset.originalAvailability = current;
                    el.dataset.originalAvailabilitySaved = "1";
                }

                if (hasTarget) {
                    const customText = generateCustomText(stickerBlock);
                    if (el.textContent !== customText) el.textContent = customText;
                } else {
                    // Повертаємо оригінал
                    const original = el.dataset.originalAvailability || "";
                    if (el.textContent !== original) el.textContent = original;
                }
            });
        });
    }

    const updateAvailabilityDebounced = debounce(updateAvailability, 80);

    document.addEventListener("DOMContentLoaded", updateAvailability);

    const OBSERVE_WITHIN = [
        ".product__modifications",
        ".product__block--modifications", // моб
        ".productSticker",
        ".product-sticker",
        ".product-header__availability",
        ".presence-status"
    ].join(", ");

    const bodyObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            const target = m.target.nodeType === 1 ? m.target : m.target.parentElement;
            if (!target) continue;

            if (target.closest && target.closest(OBSERVE_WITHIN)) {
                updateAvailabilityDebounced();
                break;
            }
        }
    });

    function startObserver() {
        bodyObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
    }

    if (document.body) {
        startObserver();
    } else {
        document.addEventListener("DOMContentLoaded", startObserver);
    }
})();
