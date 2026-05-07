// source: https://vashevolossya.com.ua/
// extracted: 2026-05-07T21:23:06.841Z
// scripts: 1

// === script #1 (length=1963) ===
document.addEventListener("DOMContentLoaded", function () {

  // ❗ ПРАЦЮЄ ТІЛЬКИ В КОШИКУ / ОФОРМЛЕННІ
  if (!window.location.href.includes("/checkout")) return;

  const FREE_SHIPPING_FROM = 1500;

  function findTotalElement() {
    let selectors = [
      ".checkout__total-price",
      ".order-total",
      ".total",
      ".sum",
      ".cart-total",
      ".checkout-total",
      "[class*='total']"
    ];

    for (let sel of selectors) {
      let el = document.querySelector(sel);
      if (el && el.innerText.includes("грн")) {
        return el;
      }
    }

    let all = document.querySelectorAll("div, span");
    for (let el of all) {
      if (el.innerText.includes("грн") && el.innerText.match(/\d+/)) {
        if (el.innerText.toLowerCase().includes("всього")) {
          return el;
        }
      }
    }

    return null;
  }

  function updateMessage() {
    let totalElement = findTotalElement();
    if (!totalElement) return;

    let total = parseFloat(totalElement.innerText.replace(/[^\d]/g, ""));
    if (isNaN(total)) return;

    let messageBlock = document.querySelector("#free-shipping-message");

    if (!messageBlock) {
      messageBlock = document.createElement("div");
      messageBlock.id = "free-shipping-message";
      messageBlock.style.marginTop = "10px";
      messageBlock.style.fontSize = "14px";
      messageBlock.style.color = "#2e7d32";
      totalElement.parentNode.appendChild(messageBlock);
    }

    if (total >= FREE_SHIPPING_FROM) {
      messageBlock.innerHTML = "🎁 У вас вже безкоштовна доставка 🚚";
    } else {
      let left = FREE_SHIPPING_FROM - total;
      messageBlock.innerHTML = '<a href="https://vashevolossya.com.ua/" style="color:#2e7d32; text-decoration:none;">🛒 Додайте ще товарів на <b>' + left + ' грн</b> до безкоштовної доставки 🚀</a>';
    }
  }

  updateMessage();
  setInterval(updateMessage, 800);
});
