// source: https://blackout-shop.com.ua/
// extracted: 2026-05-07T21:19:31.767Z
// scripts: 2

// === script #1 (length=654) ===
var _protocol="https:"==document.location.protocol?"https://":"http://";
    _site_hash_code = "261f310adb69d52e23179ef0cffda812",_suid=64200, plerdyScript=document.createElement("script");
    plerdyScript.setAttribute("defer",""),plerdyScript.dataset.plerdymainscript="plerdymainscript",
    plerdyScript.src="https://a.plerdy.com/public/js/click/main.js?v="+Math.random();
    var plerdymainscript=document.querySelector("[data-plerdymainscript='plerdymainscript']");
    plerdymainscript&&plerdymainscript.parentNode.removeChild(plerdymainscript);
    try{document.head.appendChild(plerdyScript)}catch(t){console.log(t,"unable add script tag")}

// === script #2 (length=2089) ===
document.addEventListener("DOMContentLoaded", function () {
  if (!window.location.pathname.includes("/checkout/complete")) return;

  // визначення мови
  let lang = (document.documentElement.lang || "").toLowerCase();
  if (!lang) {
    lang = window.location.pathname.startsWith("/ru") ? "ru" : "uk";
  }

  const textValue = lang.startsWith("ru")
    ? "Для быстрого подтверждения напишите менеджеру:"
    : "Для швидкого підтвердження напишіть менеджеру:";

  const wrapper = document.createElement("div");
  wrapper.style.marginTop = "16px";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.flexWrap = "wrap";
  wrapper.style.gap = "10px";

  // стиль плашки
  wrapper.style.background = "#F4F8FB";
  wrapper.style.border = "1px solid #DCE7F3";
  wrapper.style.borderLeft = "4px solid #2AABEE";
  wrapper.style.padding = "14px 16px";
  wrapper.style.borderRadius = "8px";
  wrapper.style.fontSize = "15px";

  const text = document.createElement("span");
  text.textContent = textValue;
  text.style.fontWeight = "700"; // жирний текст

  const tg = document.createElement("a");
  tg.href = "https://t.me/BlackOut_shop";
  tg.target = "_blank";
  tg.rel = "noopener";
  tg.textContent = "Telegram";
  tg.style.background = "#2AABEE";
  tg.style.color = "#fff";
  tg.style.padding = "6px 12px";
  tg.style.borderRadius = "6px";
  tg.style.textDecoration = "none";
  tg.style.fontWeight = "600";

  const wa = document.createElement("a");
  wa.href = "https://wa.me/380681191819";
  wa.target = "_blank";
  wa.rel = "noopener";
  wa.textContent = "WhatsApp";
  wa.style.background = "#25D366";
  wa.style.color = "#fff";
  wa.style.padding = "6px 12px";
  wa.style.borderRadius = "6px";
  wa.style.textDecoration = "none";
  wa.style.fontWeight = "600";

  wrapper.appendChild(text);
  wrapper.appendChild(tg);
  wrapper.appendChild(wa);

  const target = document.querySelector(".checkout-success, .order-success, .cart-success") || document.body;
  target.appendChild(wrapper);
});
