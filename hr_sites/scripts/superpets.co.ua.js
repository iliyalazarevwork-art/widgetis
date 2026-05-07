// source: https://superpets.co.ua/
// extracted: 2026-05-07T21:19:18.425Z
// scripts: 1

// === script #1 (length=7682) ===
(function () {
    const thresholds = { courier: 500, full: 1000 };
    let lastTotal = null;

    const isRu = window.location.pathname.indexOf('/ru/') === 0;
    const lang = {
        title: isRu ? "До бесплатной доставки осталось:" : "До безкоштовної доставки залишилось:",
        activated: isRu ? "Бесплатная доставка активирована!" : "Безкоштовна доставка активована!",
        pickup: isRu ? "Самовывоз" : "Самовивіз",
        pickupNote: isRu ? "* при наличии" : "* при наявності",
        courier: isRu ? "Курьер по Одессе" : "Курʼєр по Одесі",
        post: isRu ? "Отделение/Поштомат/Курьер" : "Відділення/Поштомат/Кур'єр",
        currency: isRu ? "грн" : "грн"
    };

    const styles = `
        #delivery-promo-minicart, #delivery-promo-checkout {
            width: 100%;
            clear: both;
            display: block !important;
            box-sizing: border-box;
        }

        .delivery-widget-container {
            background-color: #f5f5f2; 
            border: 1px solid #dcdcdc; 
            border-radius: 8px;        
            padding: 16px 20px;
            margin: 15px 0;
            font-family: sans-serif, Arial;
            width: 100%;
            box-sizing: border-box;
        }

        .delivery-header { 
            display: flex; 
            align-items: center; 
            margin-bottom: 15px; 
            gap: 10px; 
        }
        .delivery-icon { width: 24px; height: 24px; fill: #444; flex-shrink: 0; }
        .delivery-title { font-weight: 500; font-size: 14px; margin: 0; color: #222; line-height: 1.2; }

        .delivery-progress-bar { 
            position: relative; 
            height: 25px; 
            background: #ffffff; 
            border: 1px solid #ccc; 
            border-radius: 14px; 
            margin-bottom: 12px;
            width: 100%; 
            box-sizing: border-box;
            overflow: hidden; 
        }
        
        .delivery-progress-fill { 
            height: 100%; 
            background: #F5B915; 
            transition: width 0.4s ease-in-out; 
        }

        .delivery-labels { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            margin-top: 8px; 
            font-size: 10px; 
            color: #555; 
            line-height: 1.2; 
            width: 100%;
        }
        
        .delivery-labels b { 
            color: #222; 
            display: block; 
            font-size: 11px; 
            margin-bottom: 2px; 
            font-weight: 700;
        }
        
        .del-label-left { text-align: left; flex: 1; }
        .del-label-center { text-align: center; flex: 1; padding: 0 4px; }
        .del-label-right { text-align: right; flex: 1; }
        
        .del-note { font-size: 8px; color: #888; display: block; margin-top: 2px; }

        .cart-buttons .btn.__special, 
        .cart__order .btn--primary,
        .checkout-footer .btn.__special,
        .form__section .j-submit { 
            background-color: #F5B915 !important; border-color: #F5B915 !important; color: #222 !important; 
        }
        .j-coupon-add .btn__text, .j-coupon-add .link__text { color: #F5B915 !important; }
    `;

    if (!document.getElementById('delivery-styles-final')) {
        const s = document.createElement('style'); 
        s.id = 'delivery-styles-final';
        s.innerText = styles; 
        document.head.appendChild(s);
    }

    const truckIcon = `<svg class="delivery-icon" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`;

    function createWidgetHTML(total) {
        const percent = Math.min((total / thresholds.full) * 100, 100);
        const leftCourier = Math.max(0, thresholds.courier - total).toFixed(0);
        const leftFull = Math.max(0, thresholds.full - total).toFixed(0);
        const statusText = total >= thresholds.full ? lang.activated : lang.title;

        return `
            <div class="delivery-widget-container">
                <div class="delivery-header">${truckIcon}<p class="delivery-title">${statusText}</p></div>
                <div class="delivery-progress-bar">
                    <div class="delivery-progress-fill" style="width: ${percent}%;"></div>
                </div>
                <div class="delivery-labels">
                    <div class="del-label-left"><b>0 ${lang.currency}</b>${lang.pickup}<span class="del-note">${lang.pickupNote}</span></div>
                    <div class="del-label-center"><b>${total >= thresholds.courier ? '0 ' + lang.currency : leftCourier + ' ' + lang.currency}</b>${lang.courier}</div>
                    <div class="del-label-right"><b>${total >= thresholds.full ? '0 ' + lang.currency : leftFull + ' ' + lang.currency}</b>${lang.post}</div>
                </div>
            </div>`;
    }

    function injectWidgets() {
        const totalElem = document.querySelector('.j-total-sum, .cart-total__value, .cart-item__price');
        if (!totalElem) return;

        const currentTotal = parseFloat(totalElem.innerText.replace(/[^\d.]/g, '').replace(',', '.')) || 0;
        if (currentTotal === lastTotal) return;
        lastTotal = currentTotal;

        const widgetHTML = createWidgetHTML(currentTotal);

        const cartTable = document.querySelector('.cart-items'); // ПК
        const mobCartContent = document.querySelector('.cart__content'); // Моб
        
        if (mobCartContent) {
            let widget = document.getElementById('delivery-promo-minicart');
            if (!widget) {
                widget = document.createElement('div');
                widget.id = 'delivery-promo-minicart';
                mobCartContent.after(widget);
            }
            widget.innerHTML = widgetHTML;
        } else if (cartTable) {
            let widget = document.getElementById('delivery-promo-minicart');
            if (!widget) {
                widget = document.createElement('div');
                widget.id = 'delivery-promo-minicart';
                cartTable.after(widget);
            }
            widget.innerHTML = widgetHTML;
        }

        const checkoutAsideOrder = document.querySelector('.checkout-aside section.order'); // ПК
        const mobOrderDetails = document.querySelector('.order-details__body'); // Моб
        
        if (mobOrderDetails) {
            let widget = document.getElementById('delivery-promo-checkout');
            if (!widget) {
                widget = document.createElement('div');
                widget.id = 'delivery-promo-checkout';
                mobOrderDetails.after(widget);
            }
            widget.innerHTML = widgetHTML;
        } else if (checkoutAsideOrder) {
            let widget = document.getElementById('delivery-promo-checkout');
            if (!widget) {
                widget = document.createElement('div');
                widget.id = 'delivery-promo-checkout';
                checkoutAsideOrder.after(widget);
            }
            widget.innerHTML = widgetHTML;
        }
    }

    const observer = new MutationObserver(() => setTimeout(injectWidgets, 100));
    injectWidgets();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
