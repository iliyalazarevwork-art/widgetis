// source: https://polyabluka.ua/
// extracted: 2026-05-07T21:20:10.300Z
// scripts: 1

// === script #1 (length=1259) ===
document.addEventListener("DOMContentLoaded", function () {
    window.showTradeInForm = function () {
      if (document.getElementById("popup-tradein")) return;

      const popup = document.createElement("div");
      popup.id = "popup-tradein";
      popup.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;">
          <div style="position:relative;background:#fff;padding:20px;border-radius:10px;max-width:700px;width:95%;box-shadow:0 0 30px rgba(0,0,0,0.2);">
            <button onclick="document.body.removeChild(document.getElementById('popup-tradein'))"
                    style="position:absolute;top:10px;right:14px;font-size:24px;background:none;border:none;cursor:pointer;color:#aaa;">&times;</button>
            <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSfLP6dn5kvzfodQyZ0wLND1WGh4UvN3RKKgc8g9B8lTwzUoig/viewform?embedded=true"
                    width="100%" height="600" frameborder="0" marginheight="0" marginwidth="0"
                    style="border:none;">Завантаження…</iframe>
          </div>
        </div>
      `;
      document.body.appendChild(popup);
    };
  });
