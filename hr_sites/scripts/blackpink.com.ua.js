// source: https://blackpink.com.ua/
// extracted: 2026-05-07T21:18:56.493Z
// scripts: 1

// === script #1 (length=765) ===
let viberTimer;

function toggleViberOptions() {
  const options = document.getElementById('viber-options');

  if (options.style.display === 'flex') {
    options.style.display = 'none';
    clearTimeout(viberTimer);
  } else {
    options.style.display = 'flex';

    // Автоматическое скрытие через 15 секунд
    clearTimeout(viberTimer);
    viberTimer = setTimeout(() => {
      options.style.display = 'none';
    }, 15000);
  }
}

// Скрыть кнопку на странице checkout
document.addEventListener("DOMContentLoaded", function() {
  const path = window.location.pathname.toLowerCase();

  if (path.includes("checkout")) {
    const viber = document.getElementById("viber-wrapper");
    if (viber) viber.style.display = "none";
  }
});
