// source: https://luh.com.ua/
// extracted: 2026-05-07T21:20:36.017Z
// scripts: 1

// === script #1 (length=2657) ===
document.addEventListener("DOMContentLoaded", function() {
  const menuSection = document.querySelector("#menu .menu__section.j-catalog-nav");
  if (!menuSection) return;

  // Ховаємо стандартний каталог Horoshop
  const oldCatalog = menuSection.querySelector(".main-nav--catalog");
  if (oldCatalog) oldCatalog.style.display = "none";

  // Створюємо кастомний каталог
  const customCatalog = document.createElement("div");
  customCatalog.className = "custom-catalog";
  customCatalog.innerHTML = `
    <ul class="custom-nav">

      <li><a href="/cholovichi-vyshyvanky/">Чоловічі Вишиванки</a></li>

      <li class="nav-separator"></li>

      <li class="has-sub">
        <div class="item">
          <a href="/zhinkam/" class="parent-link">Жінкам</a>
          <span class="arrow"></span>
        </div>
        <ul class="sub-nav">
          <li><a href="/zhinochi-vyshyvanky/">Жіночі Вишиванки</a></li>
          <li><a href="/sukni-vyshyvanky/">Вишиті Сукні</a></li>
          <li><a href="/zhyletky/">Жилетки</a></li>
        </ul>
      </li>

      <li class="nav-separator"></li>

      <li><a href="/parni-vyshyvanky/">Парні Вишиванки</a></li>

      <li class="nav-separator"></li>

      <li class="has-sub">
        <div class="item">
          <a href="/dytiachi-vyshyvanky/" class="parent-link">Дитячі вишиванки</a>
          <span class="arrow"></span>
        </div>
        <ul class="sub-nav">
          <li><a href="/dlia-khlopchykiv/">Для хлопчиків</a></li>
          <li><a href="/dlia-divchatok/">Для дівчаток</a></li>
          <li><a href="/dytiachi-vyshyti-sukni/">Дитячі вишиті сукні</a></li>
        </ul>
      </li>

      <li class="nav-separator"></li>

      <li><a href="/aksesuary/">Аксесуари</a></li>

      <li class="nav-separator"></li>

      <li><a href="/dim/">Дім</a></li>

      <li class="nav-separator"></li>

      <li><a href="/podarunkovi-sertyfikaty/">Подарункові сертифікати</a></li>

    </ul>
  `;

  menuSection.prepend(customCatalog);

  // Логіка роботи підкатегорій при кліку по тексту і по стрілці
  document.querySelectorAll(".custom-nav .has-sub .item").forEach(item => {
    const parentLi = item.parentElement;
    const parentLink = item.querySelector(".parent-link");
    const arrow = item.querySelector(".arrow");

    // Функція розкриття
    const toggle = (e) => {
      e.preventDefault();
      parentLi.classList.toggle("open");
    };

    // Клік по стрілці
    arrow.addEventListener("click", toggle);

    // Клік по тексту розділу
    parentLink.addEventListener("click", toggle);
  });

});
