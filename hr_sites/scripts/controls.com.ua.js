// source: https://controls.com.ua/
// extracted: 2026-05-07T21:21:03.931Z
// scripts: 1

// === script #1 (length=1583) ===
(function (e, t) {
    const timestamp = new Date().getTime();

    // Створення черги для JediDesk
    e.JediDesk = function () {
      (e.JediDesk.q = e.JediDesk.q || []).push(arguments);
    };

    // Підключення стилів виджета
    const styleLink = document.createElement("link");
    styleLink.href = "https://widget.jedidesk.com/static/css/index_bundle.css?v=" + timestamp;
    styleLink.rel = "stylesheet";
    document.head.appendChild(styleLink);

    // Скидання розмиття стилями через кастомне правило
    const fixStyle = document.createElement("style");
    fixStyle.innerHTML = `
      #jedidesk, .jedidesk-container, .jedidesk-widget {
        backdrop-filter: none !important;
        filter: none !important;
        background: transparent !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(fixStyle);

    // Слухач для подій з виджета
    window.addEventListener("message", function (e) {
      if (!e?.data) return;
      const { options, data } = e.data;
      const event = new CustomEvent(options, { detail: data });
      window.dispatchEvent(event);
    });

    // Контейнер виджета
    const widgetContainer = document.createElement("div");
    widgetContainer.id = "jedidesk";
    document.body.appendChild(widgetContainer);

    // Підключення основного скрипта виджета
    const scriptEl = document.createElement("script");
    scriptEl.src = "https://widget.jedidesk.com/static/js/main.js?v=" + timestamp;
    document.body.appendChild(scriptEl);
  })(window, document);
