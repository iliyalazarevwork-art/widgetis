// source: https://marstek-ukraine.com.ua/
// extracted: 2026-05-07T21:21:59.353Z
// scripts: 1

// === script #1 (length=8789) ===
(function () {
  if (window.__uaMultiChatLoaded) return;
  window.__uaMultiChatLoaded = true;

  const config = {
    bottom: 37,
    side: 62,
    chats: [
      {
        name: "Telegram",
        url: "https://t.me/+380675815555",
        color: "#27A7E7",
        icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.5 4.5L18.4 19l-4.5-3.3-2.2 2.1.3-4.6 8.5-7.7L7 13.1l-4.3-1.4L20 3.8z"/></svg>`
      },
      {
        name: "WhatsApp",
        url: "https://wa.me/380675815555",
        color: "#25D366",
        icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2z"/></svg>`
      },
      {
        name: "Viber",
        url: "viber://chat?number=%2B380675815555",
        color: "#7360F2",
        icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C7 2 3 6 3 10c0 2.3 1.1 4.3 2.8 5.8L5 22l5-1.6c.6.1 1.2.2 2 .2 5 0 9-4 9-8s-4-8-9-8z"/></svg>`
      },
      {
        name: "Instagram",
        url: "https://ig.me/m/marstek_ukraine",
        color: "#E4405F",
        icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2A3 3 0 0 0 4 7v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm10.5 1.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>`
      },
      {
        name: "Facebook",
        url: "https://m.me/929128093626306",
        color: "#1877F2",
        icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13 22v-8h3l1-4h-4V8c0-1 0-2 2-2h2V2h-3c-4 0-5 2-5 5v3H6v4h3v8h4Z"/></svg>`,
        size: 26
      },
      {
        name: "Пошта",
        url: "mailto:info@marstek-ukraine.com.ua",
        color: "#e97900",
        icon: `<svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M4.75 5h14.5A1.75 1.75 0 0 1 21 6.75v10.5A1.75 1.75 0 0 1 19.25 19H4.75A1.75 1.75 0 0 1 3 17.25V6.75A1.75 1.75 0 0 1 4.75 5Zm0 1.5a.25.25 0 0 0-.25.25v.19l7.5 4.91 7.5-4.91v-.19a.25.25 0 0 0-.25-.25H4.75Zm14.75 2.23-6.68 4.37a1.5 1.5 0 0 1-1.64 0L4.5 8.73v8.52c0 .14.11.25.25.25h14.5c.14 0 .25-.11.25-.25V8.73Z"/>
  </svg>`,
        size: 26
      },
      {
        name: "Дзвінок",
        url: "tel:+380675815555",
        color: "#0EA5E9",
        icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8c1.6 3.1 3.5 5 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.3 1 .3 2 .4 3.1.4.7 0 1.3.6 1.3 1.3V20c0 .7-.6 1.3-1.3 1.3C10.4 21.3 2.7 13.6 2.7 4.3 2.7 3.6 3.3 3 4 3h3.4c.7 0 1.3.6 1.3 1.3 0 1.1.1 2.1.4 3.1.1.4 0 .8-.3 1.2l-2.2 2.2z"/></svg>`
      }
    ]
  };

  const style = document.createElement("style");
  style.textContent = `
    .ua-chat {
      position: fixed;
      right: ${config.side}px;
      bottom: ${config.bottom}px;
      z-index: 120;
      width: max-content;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-family: Arial, sans-serif;
      pointer-events: none;
    }

    .ua-list {
      position: absolute;
      right: 0;
      bottom: 62px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(8px);
      transition: opacity .2s ease, transform .2s ease, visibility .2s ease;
      align-items: flex-end;
      pointer-events: none;
    }

    .ua-chat.open .ua-list {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      pointer-events: auto;
    }

    .ua-item {
      width: 240px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      text-decoration: none;
      pointer-events: auto;
    }

    .ua-text {
      flex: 1;
      background: linear-gradient(90deg, #007AEA, #00F3E1);
      color: #fff;
      padding: 12px 16px;
      border-radius: 999px;
      font-size: 14px;
      line-height: 1.2;
      transition: all .25s ease;
      box-shadow: 0 8px 22px rgba(0, 0, 0, .16);
      text-align: left;
    }

    .ua-item:hover .ua-text {
      filter: brightness(1.1);
      transform: translateX(-2px);
    }

    .ua-bubble {
      width: 50px;
      height: 50px;
      min-width: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 0 8px 20px rgba(0, 0, 0, .16);
    }

    .ua-bubble svg {
      width: 24px;
      height: 24px;
      display: block;
    }

    .ua-toggle-wrap {
      position: relative;
      width: 50px;
      height: 50px;
      pointer-events: auto;
      flex: 0 0 auto;
    }

    .ua-toggle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #008fe8;
      border: 0;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      z-index: 2;
      box-shadow: 0 8px 20px rgba(0, 0, 0, .18);
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }

    .ua-toggle svg {
      width: 24px;
      height: 24px;
      display: block;
    }

    .ua-pulse {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      pointer-events: none;
    }

    .ua-pulse::before,
    .ua-pulse::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(0, 143, 232, .30);
      animation: pulse 2s infinite;
      pointer-events: none;
    }

    .ua-pulse::after {
      animation-delay: 1s;
    }

    @keyframes pulse {
      0% { transform: scale(1); opacity: .6; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    @media (max-width: 640px) {
      .ua-chat {
        right: 20px;
        bottom: 24px;
      }

      .ua-list {
        bottom: 58px;
      }

      .ua-item {
        width: 220px;
        gap: 14px;
      }

      .ua-text {
        padding: 10px 14px;
        font-size: 13px;
      }

      .ua-bubble,
      .ua-toggle-wrap,
      .ua-toggle {
        width: 46px;
        height: 46px;
      }

      .ua-bubble {
        min-width: 46px;
      }

      .ua-bubble svg,
      .ua-toggle svg {
        width: 22px;
        height: 22px;
      }
    }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.className = "ua-chat";

  const list = document.createElement("div");
  list.className = "ua-list";

  config.chats.forEach(chat => {
    const a = document.createElement("a");
    a.className = "ua-item";
    a.href = chat.url;
    a.target = chat.url.startsWith("tel:") ? "_self" : "_blank";
    a.rel = "noopener noreferrer";

    const text = document.createElement("span");
    text.className = "ua-text";
    text.textContent = chat.name;

    const bubble = document.createElement("span");
    bubble.className = "ua-bubble";
    bubble.style.background = chat.color;
    bubble.innerHTML = chat.icon;

    const svg = bubble.querySelector("svg");
    if (chat.size && svg) {
      svg.style.width = chat.size + "px";
      svg.style.height = chat.size + "px";
    }

    a.appendChild(text);
    a.appendChild(bubble);
    list.appendChild(a);
  });

  const toggleWrap = document.createElement("div");
  toggleWrap.className = "ua-toggle-wrap";

  const pulse = document.createElement("div");
  pulse.className = "ua-pulse";

  const toggle = document.createElement("button");
  toggle.className = "ua-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Відкрити повідомлення");
  toggle.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H9l-5 4v-4Z"/></svg>`;

  toggle.addEventListener("click", function (e) {
    e.stopPropagation();
    wrap.classList.toggle("open");
  });

  document.addEventListener("click", function (e) {
    if (!wrap.contains(e.target)) {
      wrap.classList.remove("open");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      wrap.classList.remove("open");
    }
  });

  toggleWrap.appendChild(pulse);
  toggleWrap.appendChild(toggle);

  wrap.appendChild(list);
  wrap.appendChild(toggleWrap);

  document.body.appendChild(wrap);
})();
