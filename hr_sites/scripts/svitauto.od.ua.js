// source: https://svitauto.od.ua/
// extracted: 2026-05-07T21:19:33.013Z
// scripts: 1

// === script #1 (length=595) ===
document.addEventListener("DOMContentLoaded", function () {
        let widgetIframe = document.createElement("iframe");
        widgetIframe.src = "https://svitauto.od.ua/widget.html";
        widgetIframe.style.position = "fixed";
        widgetIframe.style.right = "10px";
        widgetIframe.style.bottom = "10px";
        widgetIframe.style.width = "90px"; // Підлаштуй під розмір віджета
        widgetIframe.style.height = "300px";
        widgetIframe.style.border = "none";
        widgetIframe.style.zIndex = "9999";
        document.body.appendChild(widgetIframe);
    });
