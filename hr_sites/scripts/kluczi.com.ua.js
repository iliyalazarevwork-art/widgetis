// source: https://kluczi.com.ua/
// extracted: 2026-05-07T21:19:35.515Z
// scripts: 1

// === script #1 (length=1895) ===
document.addEventListener("DOMContentLoaded", function() {

  const widget = document.createElement("div");
  widget.id = "fire-widget";
  widget.innerHTML = `
    <div class="fw-content">
      <div class="fw-text">
        🔥 Моментальна доставка на email
      </div>
      <div class="fw-close">✖</div>
    </div>
  `;

  const style = document.createElement("style");
  style.innerHTML = `
    #fire-widget {
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 99999;
    }

    .fw-content {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      color: #000;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 14px;
      font-weight: 700;
      font-family: Inter, system-ui;
      border: 2px solid #ff6600;
      box-shadow: 0 0 10px rgba(255, 120, 40, 0.3);
      animation: fireBorder 1.1s infinite alternate ease-in-out;
    }

    .fw-text {
      white-space: nowrap;
    }

    .fw-close {
      cursor: pointer;
      font-size: 14px;
      opacity: 0.6;
      transition: 0.3s;
    }
    .fw-close:hover {
      opacity: 1;
    }

    @keyframes fireBorder {
      0% {
        border-color: #ff3100;
        box-shadow: 0 0 4px rgba(255, 80, 0, 0.3),
                    0 0 8px rgba(255, 120, 0, 0.25);
      }
      50% {
        border-color: #ff8b00;
        box-shadow: 0 0 8px rgba(255, 140, 0, 0.5),
                    0 0 14px rgba(255, 60, 0, 0.4);
      }
      100% {
        border-color: #ff5500;
        box-shadow: 0 0 6px rgba(255, 100, 0, 0.35),
                    0 0 16px rgba(255, 40, 0, 0.55);
      }
    }
  `;

  document.body.appendChild(style);
  document.body.appendChild(widget);

  widget.querySelector(".fw-close").addEventListener("click", () => {
    widget.remove();
  });

});
