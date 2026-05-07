// source: https://med.lviv.ua/
// extracted: 2026-05-07T21:20:02.544Z
// scripts: 3

// === script #1 (length=3404) ===
(function() {
  // Функція для створення попапу
  function createPopup() {
    const popup = document.createElement("div");
    popup.id = "popup";
    popup.innerHTML = `
      <div class="popup-content">
        <div class="image-wrapper">
          <img src="/content/uploads/images/6993514.jpg" alt="Українська мова">
        </div>
        <div class="popup-text-wrapper">
          <h2>Мова має значення!</h2>
          <p>Схоже Ви потрапили на російську версію сайту — перемкнемося на рідну? 💛</p>
          <button id="ukrainian-button">Українською</button>
          <button id="stay-button">Залишитись</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    // Закрити попап при натисканні "Залишитись" — повністю видаляємо з DOM
    document.getElementById("stay-button").addEventListener("click", function() {
      const popup = document.getElementById("popup");
      if (popup) popup.remove();
    });

    // Заміна URL при натисканні "Українською"
    document.getElementById("ukrainian-button").addEventListener("click", function() {
      const popup = document.getElementById("popup");
      if (popup) popup.remove();
      let currentUrl = window.location.href;
      let newUrl = currentUrl.replace("/ru/", "/");
      window.location.href = newUrl;
    });

    // Показати попап, якщо URL містить /ru/
    const currentUrl = window.location.href;
    if (currentUrl.includes("/ru/") && !sessionStorage.getItem('popupShown')) {
      document.getElementById("popup").style.display = "flex";
      sessionStorage.setItem('popupShown', 'true');
    }
  }

  // Додаємо CSS до сторінки
  const style = document.createElement("style");
  style.innerHTML = `
    #popup {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .popup-content {
      background: white;
      padding: 0;
      border-radius: 8px;
      text-align: center;
      width: 320px;
      box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    }
    .popup-content .image-wrapper {
      width: 100%;
      height: auto;
      padding: 0;
    }
    .popup-content .image-wrapper img {
      width: 100%;
      height: auto;
      border-radius: 8px 8px 0 0;
    }
    .popup-text-wrapper {
      padding: 26px;
    }
    .popup-text-wrapper h2{
      margin: 0;
      padding-bottom: 8px;
    }
    .popup-text-wrapper p {
      margin: 0;
      padding-bottom: 20px;
      font-size: 16px;
    }
    .popup-text-wrapper button {
      padding: 10px 0;
      width: 100%;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 16px;
    }
    #stay-button {
      background-color: #e5e5e5;
      color: black;
    }
    #stay-button:hover {
      background-color: #d4d4d4;
    }
    #ukrainian-button {
      background-color: #eb971b;
      color: white;
      font-weight: 600;
    }
    #ukrainian-button:hover {
      background-color: #d5831a;
    }
    .popup-text-wrapper button:not(:last-child) {
      margin-bottom: 12px;
    }
  `;
  document.head.appendChild(style);

  // Викликаємо функцію для створення попапу
  createPopup();
})();

// === script #2 (length=503) ===
document.addEventListener("DOMContentLoaded", function () {
    const bannerImgs = document.querySelectorAll('.banners__item .banner-image img');
    bannerImgs.forEach(function (img) {
      const screenWidth = window.innerWidth;
      if (screenWidth > 1024 && img.src.includes('/960x432')) {
        const highResSrc = img.src.replace('/960x432', '/1920x864');
        img.src = highResSrc;
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
      }
    });
  });

// === script #3 (length=2153) ===
document.addEventListener('DOMContentLoaded', function() {
    const iconGp = document.getElementById('icon-gp');
    if (iconGp) {
        iconGp.innerHTML = `
            <g clip-path="url(#clip0_106_2)">
                <path d="M492.668 211.489L283.828 211.479C274.606 211.479 267.131 218.953 267.131 228.175V294.89C267.131 304.11 274.606 311.586 283.827 311.586H401.433C388.555 345.007 364.519 372.996 333.853 390.78L384 477.589C464.442 431.066 512 349.437 512 258.059C512 245.048 511.041 235.747 509.123 225.274C507.665 217.317 500.757 211.489 492.668 211.489Z" fill="#167EE6"/>
                <path d="M256 411.827C198.446 411.827 148.202 380.381 121.217 333.848L34.411 383.882C78.586 460.444 161.34 512.001 256 512.001C302.437 512.001 346.254 499.498 384 477.709V477.59L333.853 390.78C310.915 404.084 284.371 411.827 256 411.827Z" fill="#12B347"/>
                <path d="M384 477.708V477.589L333.853 390.779C310.915 404.082 284.373 411.826 256 411.826V512C302.437 512 346.256 499.497 384 477.708Z" fill="#0F993E"/>
                <path d="M100.174 256C100.174 227.631 107.916 201.09 121.217 178.153L34.411 128.119C12.502 165.746 0 209.444 0 256C0 302.556 12.502 346.254 34.411 383.881L121.217 333.847C107.916 310.91 100.174 284.369 100.174 256Z" fill="#FFD500"/>
                <path d="M256 100.174C293.531 100.174 328.005 113.51 354.932 135.693C361.575 141.165 371.23 140.77 377.315 134.685L424.585 87.415C431.489 80.511 430.997 69.21 423.622 62.812C378.507 23.673 319.807 0 256 0C161.34 0 78.586 51.557 34.411 128.119L121.217 178.153C148.202 131.62 198.446 100.174 256 100.174Z" fill="#FF4B26"/>
                <path d="M354.932 135.693C361.575 141.165 371.231 140.77 377.315 134.685L424.585 87.415C431.488 80.511 430.996 69.21 423.622 62.812C378.507 23.672 319.807 0 256 0V100.174C293.53 100.174 328.005 113.51 354.932 135.693Z" fill="#D93F21"/>
            </g>
            <defs>
                <clipPath id="clip0_106_2">
                    <rect width="512" height="512" fill="white"/>
                </clipPath>
            </defs>
        `;
        iconGp.setAttribute('viewBox', '0 0 512 512');
    }
});
