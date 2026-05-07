// source: https://liquidacrylic.com.ua/
// extracted: 2026-05-07T21:19:18.677Z
// scripts: 1

// === script #1 (length=2854) ===
document.addEventListener("DOMContentLoaded", function () {
  const excludedPaths = [
    "/checkout/",
    "/cart/",
    "/blog/",
    "/privacy-policy/",
    "/thank-you/",
"/kontaktna-informatsiya/",
    "/success/"
  ];

  const currentPath = window.location.pathname.toLowerCase();
  if (excludedPaths.some(path => currentPath.startsWith(path))) return;

  fetch("/content/uploads/files/popular-queries.json")
    .then(response => response.json())
    .then(data => {
      if (!data || data.length === 0) return;

      const shuffled = data.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 30);

      const container = document.createElement("div");
      container.style = "padding:30px 15px;background:#f9f9f9;border-top:1px solid #ddd;margin-top:40px;font-family:sans-serif;";
      container.innerHTML = `
        <div style="max-width:1200px;margin:0 auto;">
          <h3 style="font-size:22px;margin-bottom:20px;">Популярні запити</h3>
          <ul style="list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:10px;" id="popular-queries-list"></ul>
        </div>
      `;

      const list = container.querySelector("#popular-queries-list");
      const ldJsonItems = [];

      selected.forEach((item, index) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = item.url;
        a.textContent = item.query;
        a.style = `
          display:inline-block;
          padding:8px 14px;
          background:#e1e1e1;
          border-radius:20px;
          text-decoration:none;
          color:#333;
          font-size:14px;
          transition:0.2s;
        `;
        a.onmouseover = () => a.style.background = "#d0d0d0";
        a.onmouseout = () => a.style.background = "#e1e1e1";
        li.appendChild(a);
        list.appendChild(li);

        // Формуємо JSON-LD об'єкт
        ldJsonItems.push({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.query,
          "url": item.url
        });
      });

      // Вставляємо блок перед футером
      const footer = document.querySelector("footer.footer");
      if (footer) {
        footer.parentNode.insertBefore(container, footer);
      } else {
        document.body.appendChild(container);
      }

      // Додаємо JSON-LD у <head>
      const ldScript = document.createElement("script");
      ldScript.type = "application/ld+json";
      ldScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": ldJsonItems
      });
      document.head.appendChild(ldScript);
    })
    .catch(err => {
      console.error("Помилка завантаження popular-queries.json:", err);
    });
});
