// source: https://skinovate.com.ua/
// extracted: 2026-05-07T21:22:39.009Z
// scripts: 1

// === script #1 (length=3544) ===
document.addEventListener("DOMContentLoaded", function () {

    const FREE_SHIPPING = 3000;
    let lastTotal = 0;

    function getCartTotal() {
        let el = document.querySelector('.cart__order')?.previousElementSibling;
        if (!el) return 0;

        let num = parseInt(el.innerText.replace(/\s/g, '').replace(/[^\d]/g, ''));
        return num || 0;
    }

    function renderProgress(total) {

        let diff = FREE_SHIPPING - total;
        if (diff < 0) diff = 0;

        let percent = Math.min((total / FREE_SHIPPING) * 100, 100);

        let items = document.querySelectorAll('.cart__item');
        if (!items.length) return;

        let lastItem = items[items.length - 1];

        let existing = document.querySelector('#free-shipping-box');

        // 🔥 ТЕКСТИ
        let mainText = total < FREE_SHIPPING
            ? `Не втрачайте безкоштовну доставку ! 📦`
            : `Вітаємо ! Доставка безкоштовна ✔️`;

        let subText = total < FREE_SHIPPING
            ? `Залишилось : <strong style="color:#1f3d3a;">${diff} грн</strong>`
            : `Скоріш оформлюйте своє замовлення`;

        let buttonHTML = total < FREE_SHIPPING ? `
            <a href="/" style="
                display:inline-block;
                margin-top:10px;
                padding:8px 12px;
                background:#1f3d3a;
                color:#fff;
                font-size:12px;
                border-radius:8px;
                text-decoration:none;
            ">
                Повернутись до товарів
            </a>
        ` : '';

        if (existing) {
            existing.querySelector('.bar-fill').style.width = percent + '%';
            existing.querySelector('.text-main').innerText = mainText;
            existing.querySelector('.text-sub').innerHTML = subText;
            existing.querySelector('.text-amount').innerText =
                `${total} / ${FREE_SHIPPING} грн`;

            let btnContainer = existing.querySelector('.btn-container');
            if (btnContainer) {
                btnContainer.innerHTML = buttonHTML;
            }

            return;
        }

        let html = `
        <div id="free-shipping-box" style="
            margin:16px;
            padding:14px;
            background:#f8f7f5;
            border-radius:14px;
        ">
            <div class="text-main" style="font-size:13px; margin-bottom:6px;">
                ${mainText}
            </div>

            <div class="text-sub" style="font-size:12px; color:#666; margin-bottom:8px;">
                ${subText}
            </div>

            <div style="height:6px; background:#e5e5e5; border-radius:10px;">
                <div class="bar-fill" style="
                    height:100%;
                    width:${percent}%;
                    background:#1f3d3a;
                    transition:0.2s;
                "></div>
            </div>

            <div class="text-amount" style="margin-top:6px; font-size:11px; color:#888;">
                ${total} / ${FREE_SHIPPING} грн
            </div>

            <div class="btn-container">
                ${buttonHTML}
            </div>
        </div>
        `;

        lastItem.insertAdjacentHTML('afterend', html);
    }

    setInterval(() => {
        let total = getCartTotal();

        if (total && total !== lastTotal) {
            lastTotal = total;
            renderProgress(total);
        }
    }, 500);

});
