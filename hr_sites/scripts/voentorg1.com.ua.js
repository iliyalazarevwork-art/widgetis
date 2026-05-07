// source: https://voentorg1.com.ua/
// extracted: 2026-05-07T21:23:10.038Z
// scripts: 1

// === script #1 (length=721) ===
function recolorAvailability() {
    const targets = document.querySelectorAll("*");
    targets.forEach(el => {
      const text = el.textContent.trim();
      if (text === "Немає в наявності") {
        el.style.color = "red";
        el.style.fontWeight = "bold";
      } else if (text === "В наявності") {
        el.style.color = "green";
        el.style.fontWeight = "bold";
      }
    });
  }

  // Запуск при завантаженні
  document.addEventListener("DOMContentLoaded", recolorAvailability);

  // Слухаємо всі зміни DOM
  const observer = new MutationObserver(recolorAvailability);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
