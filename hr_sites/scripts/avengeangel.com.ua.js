// source: https://avengeangel.com.ua/
// extracted: 2026-05-07T21:20:51.932Z
// scripts: 1

// === script #1 (length=2591) ===
document.addEventListener("DOMContentLoaded", function () {
  const articlesGroupA = ["HRBV-000893", "HRBV-000907", "HRBV-001239", "BV-000907-1"];

  const articleSelectors = [
    ".product-meta__item",
    ".product-header__code"
  ];

  let matched = false;

  for (let selector of articleSelectors) {
    const elements = document.querySelectorAll(selector);
    for (let el of elements) {
      const text = el.textContent;
      if (articlesGroupA.some(article => text.includes(article))) {
        matched = true;
        break;
      }
    }
    if (matched) break;
  }

  if (matched) {
    // Визначення мови сторінки
    const isRussian = location.pathname.includes('/ru/') || document.documentElement.lang === 'ru';

    const content = isRussian
      ? {
          label: "Спецпредложение",
          title: "Обновлённая версия Avenger Booster",
          price: "63 999 грн",
          note: "Выбирай лучшее",
          button: "Перейти к товару"
        }
      : {
          label: "Cпецпропозиція",
          title: "Оновлена версія Avenger Booster",
          price: "63 999 грн",
          note: "Обирай краще",
          button: "Перейти до товару"
        };

    const giftBlock = document.createElement("div");
    giftBlock.className = "reb-special-offer";

    giftBlock.innerHTML = `
      <div class="reb-special-offer__content">
        <img src="https://bezpeka-veritas.com.ua/content/images/1/1280x1280l80bl20/44193021599377.webp" 
             alt="Подарунок" class="reb-special-offer__image" width="200" height="200">
        <div class="reb-special-offer__text">
          <div class="reb-special-offer__label">${content.label}</div>
          <div class="reb-special-offer__title">${content.title}</div>
          <div class="reb-special-offer__price">${content.price}</div>
          <div class="reb-special-offer__note">${content.note}</div>
          <a href="https://avengeangel.com.ua/vynosna-antena-pidsyliuvach-syhnalu-dlia-kvadrokopteriv-skyrazor-varta-2.4g-5.2g-5.8g/" 
             class="reb-special-offer__button" target="_blank">
            ${content.button}
          </a>
        </div>
      </div>
    `;

    const desktopBox = document.querySelector(".product__row");
    if (desktopBox && desktopBox.parentNode) {
      desktopBox.insertAdjacentElement("afterend", giftBlock.cloneNode(true));
    }

    const mobileBox = document.querySelector(".product-card__purchase");
    if (mobileBox) {
      mobileBox.appendChild(giftBlock.cloneNode(true));
    }
  }
});
