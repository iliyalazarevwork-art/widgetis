// source: https://unisfera-shop.com.ua/
// extracted: 2026-05-07T21:23:03.789Z
// scripts: 1

// === script #1 (length=847) ===
// показуємо лише новим користувачам
if (!localStorage.getItem('telegram_popup_shown')) {
    setTimeout(function() {
        document.getElementById("telegramPopup").style.display = "block";
        document.getElementById("popupOverlay").style.display = "block";
    }, 2000);
}

// закриття по хрестику
document.getElementById("telegramPopupClose").onclick = function() {
    document.getElementById("telegramPopup").style.display = "none";
    document.getElementById("popupOverlay").style.display = "none";
    localStorage.setItem('telegram_popup_shown', 'true');
};

// закриття по кліку на фон
document.getElementById("popupOverlay").onclick = function() {
    document.getElementById("telegramPopup").style.display = "none";
    this.style.display = "none";
    localStorage.setItem('telegram_popup_shown', 'true');
};
