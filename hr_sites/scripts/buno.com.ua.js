// source: https://buno.com.ua/
// extracted: 2026-05-07T21:19:37.375Z
// scripts: 1

// === script #1 (length=557) ===
document.addEventListener("DOMContentLoaded", () => {
  const filters = Array.from(document.querySelectorAll(".filter-value"))
    .map(el => {
      el.textContent = el.textContent.trim().replace(/\s+$/, ""); // прибираємо пробіли в кінці
      return el;
    })
    .filter(el => el.textContent.length > 0); // залишаємо тільки непорожні

  filters.forEach((el, i) => {
    // якщо не останній непорожній елемент — додаємо кому
    if (i < filters.length - 1) {
      el.textContent = el.textContent.replace(/,+$/, "") + ".";
    }
  });
});
