// source: https://tactic4profi.com/
// extracted: 2026-05-07T21:18:54.477Z
// scripts: 1

// === script #1 (length=627) ===
document.getElementById("t4pChatButton").addEventListener("click", function() {
  document.getElementById("t4pChatPopup").classList.toggle("active");
});

// --- Автоматичне визначення мови за URL ---
const url = window.location.href;
const chatTitle = document.getElementById("chatTitle");
const chatText = document.getElementById("chatText");

if (url.includes("/ru/") || url.includes("?lang=ru")) {
  chatTitle.textContent = "Привет 👋";
  chatText.textContent = "Есть вопросы? Мы всегда на связи!";
} else {
  chatTitle.textContent = "Привіт 👋";
  chatText.textContent = "Маєте питання? Ми завжди поруч!";
}
