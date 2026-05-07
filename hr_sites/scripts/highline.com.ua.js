// source: https://highline.com.ua/
// extracted: 2026-05-07T21:20:33.031Z
// scripts: 2

// === script #1 (length=2337) ===
function updateDeliveryDate() {
    const outOfStockElement = document.querySelector('.product-header__availability--out-of-stock');
    const unavailableStatusElement = document.querySelector('.presence-status--unavailable');
    const deliveryNP1 = document.getElementById("delivery-novaposhta-1");
    const deliveryNP2 = document.getElementById("delivery-novaposhta-2");
    const deliveryUP = document.getElementById("delivery-ukrposhta");

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    const currentDate = now.getDate();
    const currentMonth = now.getMonth() + 1;

    let deliveryDate;
    let deliveryText;

    if (currentDay >= 1 && currentDay <= 5) {
        if (currentHour < 15) {
            deliveryDate = `сьогодні`;
        } else {
            deliveryDate = `завтра`;
        }
        deliveryText = `Відправимо ${deliveryDate}`;
    } else if (currentDay === 6) {
        if (currentHour < 12) {
            deliveryDate = `сьогодні`;
        } else {
            const monday = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
            deliveryDate = `${monday.getDate().toString().padStart(2, '0')}.${(monday.getMonth() + 1).toString().padStart(2, '0')}`;
        }
        deliveryText = `Відправимо ${deliveryDate}`;
    } else {
        const monday = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        deliveryDate = `${monday.getDate().toString().padStart(2, '0')}.${(monday.getMonth() + 1).toString().padStart(2, '0')}`;
        deliveryText = `Відправимо ${deliveryDate}`;
    }

    if (!outOfStockElement && !unavailableStatusElement) {
        if (deliveryNP1) deliveryNP1.textContent = deliveryText;
        if (deliveryNP2) deliveryNP2.textContent = deliveryText;
        if (deliveryUP) deliveryUP.textContent = deliveryText;
    }

    if (outOfStockElement) {
        const group3Element = document.querySelector('div[data-view-block="group_3"]');
        if (group3Element) group3Element.style.display = 'none';
    }

    if (unavailableStatusElement) {
        const tabsElement = document.querySelector('.product__group--tabs');
        if (tabsElement) tabsElement.style.display = 'none';
    }
}

document.addEventListener("DOMContentLoaded", updateDeliveryDate);

// === script #2 (length=527) ===
var ZCallbackWidgetLinkId  = 'fcf12aae39d3fbcdd3ac71bb9b383f80';
var ZCallbackWidgetDomain  = 'my.zadarma.com';
(function(){
    var lt = document.createElement('script');
    lt.type ='text/javascript';
    lt.charset = 'utf-8';
    lt.async = true;
    lt.src = 'https://' + ZCallbackWidgetDomain + '/callbackWidget/js/main.min.js?v=1.15.4';
    var sc = document.getElementsByTagName('script')[0];
    if (sc) sc.parentNode.insertBefore(lt, sc);
    else document.documentElement.firstChild.appendChild(lt);
})();
