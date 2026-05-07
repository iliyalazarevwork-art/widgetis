// source: https://loveyself.com.ua/
// extracted: 2026-05-07T21:19:02.272Z
// scripts: 2

// === script #1 (length=647) ===
document.getElementById("lsChatButton").addEventListener("click", function() {
  document.getElementById("lsChatPopup").classList.toggle("active");
});

// --- Автоматичне визначення мови за URL ---
const url = window.location.href;
const chatTitle = document.getElementById("chatTitle");
const chatText = document.getElementById("chatText");

if (url.includes("/ru/") || url.includes("?lang=ru")) {
  chatTitle.textContent = "Привет 👋";
  chatText.textContent = "Есть вопросы? Наша команда готова помочь!";
} else {
  chatTitle.textContent = "Привіт 👋";
  chatText.textContent = "Маєте питання? Наша команда готова допомогти!";
}

// === script #2 (length=1472) ===
function ready(e){"loading"!=document.readyState?e():document.addEventListener("DOMContentLoaded",e)}ready(()=>{const e=e=>{event.preventDefault(),document.querySelectorAll(".losb-menu-element").forEach(e=>{e.classList.remove("active")}),e.currentTarget.classList.add("active");let t=e.currentTarget.dataset.id;t&&c(t)},t=e=>{e.preventDefault(),document.querySelectorAll(".losb-menu-element-sub").forEach(e=>{e.classList.remove("active")}),e.currentTarget.classList.add("active");let t=e.currentTarget.dataset.id;t&&o(t)},c=e=>{document.querySelectorAll(".losb-content").forEach(e=>e.classList.remove("active")),document.querySelector(`.losb-content[data-id="losb-content-${e}"]`).classList.add("active")},o=e=>{document.querySelectorAll(".losb-content-sub").forEach(e=>e.classList.remove("active")),document.querySelector(`.losb-content-sub[data-id="losb-content-sub-${e}"]`).classList.add("active")};document.querySelectorAll(".losb-menu-element").forEach(t=>{t.addEventListener("click",e)}),document.querySelectorAll(".losb-menu-element-sub").forEach(e=>{e.addEventListener("click",t)})});document.addEventListener("DOMContentLoaded",function(){var e=[];if(e.push(document.querySelectorAll(".losb-content-sub")),e.push(document.querySelectorAll(".losb-content-level-left")),e.push(document.querySelectorAll(".losb-content-level-basic")),e)for(var t=0;t<e.length;t++)for(var o=0;o<e[t].length;o++)e[t][o].addEventListener("touchmove",function(e){e.stopPropagation()})});
