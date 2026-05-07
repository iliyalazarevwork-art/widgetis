// source: https://fit-win.com.ua/
// extracted: 2026-05-07T21:19:56.923Z
// scripts: 1

// === script #1 (length=1217) ===
// --- Функція для роботи з кукі ---
  function setCookie(name, value, hours) {
    const d = new Date();
    d.setTime(d.getTime() + (hours * 60 * 60 * 1000));
    document.cookie = name + "=" + value + ";expires=" + d.toUTCString() + ";path=/";
  }

  function getCookie(name) {
    const cname = name + "=";
    const decoded = decodeURIComponent(document.cookie);
    const ca = decoded.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(cname) == 0) {
        return c.substring(cname.length, c.length);
      }
    }
    return "";
  }

  // --- Головна логіка ---
  window.addEventListener('load', function() {
    // Перевіряємо, чи є кукі "popupSeen"
    if (!getCookie("popupSeen")) {
      setTimeout(function() {
        document.getElementById('popupOverlay').style.display = 'block';
      }, 1500); // показ через 1.5 сек
    }

    // Кнопка "Ознайомлений" — закриває вікно і ставить кукі на 24 год
    document.getElementById('confirmBtn').addEventListener('click', function() {
      document.getElementById('popupOverlay').style.display = 'none';
      setCookie("popupSeen", "yes", 24); // 24 години
    });
  });
