// source: https://kiddiua.com.ua/
// extracted: 2026-05-07T21:18:55.723Z
// scripts: 3

// === script #1 (length=680) ===
window.fbAsyncInit = function() {
                FB.init({
                    appId            : '2397750557150754',
                    autoLogAppEvents : true,
                    xfbml            : true,
                    version          : 'v2.12'
                });
            };
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

// === script #2 (length=2116) ===
(function() {
  function sortModificationsInContainer(container) {
    if (!container) return;
    const items = Array.from(container.querySelectorAll(".modification__item"));
    if (!items.length) return;

    const available = [];
    const unavailable = [];

    items.forEach(item => {
      if (item.classList.contains("modification__item--stockout")) {
        unavailable.push(item);
      } else {
        available.push(item);
      }
    });

    // Перевіряємо, чи порядок вже правильний
    if (items.indexOf(available[0]) === 0) return;

    available.forEach(item => container.appendChild(item));
    unavailable.forEach(item => container.appendChild(item));

    console.log("✅ Модифікації пересортовано:", {
      вНаявності: available.length,
      немаєВНаявності: unavailable.length
    });
  }

  function observeModifications(rootNode) {
    if (!rootNode) return;

    const processedContainers = new WeakSet();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;

          const containers = node.matches("[class*='modificationlist']") ? [node] : node.querySelectorAll("[class*='modificationlist']");
          containers.forEach(container => {
            if (!processedContainers.has(container)) {
              sortModificationsInContainer(container);
              processedContainers.add(container); // контейнер більше не буде логувати повторно
            }
          });
        });
      });
    });

    observer.observe(rootNode, { childList: true, subtree: true });

    // Однократна перевірка при завантаженні
    rootNode.querySelectorAll("[class*='modification__list']").forEach(container => {
      if (!processedContainers.has(container)) {
        sortModificationsInContainer(container);
        processedContainers.add(container);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    observeModifications(document.body);
  });
})();

// === script #3 (length=871) ===
(function() {
  // Зберігати вже оброблені картинки
  const processedImages = new WeakSet();

  function fixHoroshopImages() {
    document.querySelectorAll("img").forEach(img => {
      if (img.src.startsWith("http://shop7818.horoshop.ua") && !processedImages.has(img)) {
        img.src = img.src.replace("http://shop7818.horoshop.ua", "https://shop7818.horoshop.ua");
        console.log("🔧 Підмінено HTTP на HTTPS для картинки:", img.src);
        processedImages.add(img);
      }
    });
  }

  // Виконуємо після завантаження DOM
  document.addEventListener("DOMContentLoaded", fixHoroshopImages);

  // Додатково спостерігаємо за динамічними змінами, якщо картинки додаються пізніше
  const observer = new MutationObserver(() => {
    fixHoroshopImages();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
