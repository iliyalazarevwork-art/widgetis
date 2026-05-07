// source: https://kutochok.com.ua/
// extracted: 2026-05-07T21:21:48.540Z
// scripts: 2

// === script #1 (length=664) ===
window.fbAsyncInit = function() {
                FB.init({
                    appId            : '',
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

// === script #2 (length=3870) ===
function isMobileCheck() {
    const isMobile = {
      Android: function () {
        return navigator.userAgent.match(/Android/i);
      },
      BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
      },
      iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
      },
      Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
      },
      Windows: function () {
        return navigator.userAgent.match(/IEMobile/i);
      },
      any: function () {
        return (
          isMobile.Android() ||
          isMobile.BlackBerry() ||
          isMobile.iOS() ||
          isMobile.Opera() ||
          isMobile.Windows()
        );
      },
    };
    return isMobile.any();
  }

  function isProductPage() {
    const pathname = window.location.pathname;
    const isCorrectPath = !!(
      !pathname.includes("/cart/") && !pathname.includes("/checkout/")
    );

    const hasProductElements = !!(
      document.querySelector(".product") ||
      document.querySelector(".j-buy-button-add")
    );

    return isCorrectPath && hasProductElements;
  }

  function insertButtons() {
    const buyBtn = document.querySelector(".j-buy-button-add");
    if (!buyBtn) {
      console.warn("Кнопка покупки не знайдена!");
      return;
    }

    const sections = [
      document.querySelector(".product-description"),
      // document.querySelector(".product__block--characteristics"),
      document.querySelector(".product__block--raw_1"),
      document.querySelector(".product__group--tabs"),
    ];

    const lang = document.documentElement.getAttribute("lang");
    const buttonText = lang === "uk" ? "Оформити замовлення" : "Оформить заказ";
    const buttonText2 = lang === "uk" ? "🛒 Замовити швидко" : "🛒 Заказать в один клик";

    sections.forEach((section) => {
      if (section) {
        const newElement = document.createElement("div");
        newElement.classList.add("product-card__buy-button");
        newElement.innerHTML = `<button data-skin="mobile" class="customBuyBtn" style="margin-top: 15px !important;">${buttonText}</button>`;
        section.appendChild(newElement);

				const newElement2 = document.createElement("div");
        newElement2.classList.add(".product-card__order");
        newElement2.classList.add(".product-card__order--quick");
        newElement2.innerHTML = `<button data-skin="mobile" class="customBuyQuickBtn" style="margin-top: 15px !important;">${buttonText2}</button>`;
        section.appendChild(newElement2);
      }
    });

    document.querySelectorAll(".customBuyBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const realBuyBtn = document.querySelector(".j-buy-button-add");

        if (realBuyBtn) {
          realBuyBtn.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
        } else {
          console.error("Оригінальна кнопка не знайдена при натисканні!");
        }
      });
    });
		document.querySelectorAll(".customBuyQuickBtn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
				const realBuyQuick = document.querySelector('.product-card__order--quick a');

        if (realBuyQuick) {
          realBuyQuick.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
        } else {
          console.error("Оригінальна кнопка не знайдена при натисканні!");
        }
      });
    });

    console.log("Додано кастомні кнопки покупки");
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (isMobileCheck() && isProductPage()) {
      insertButtons();
    }
  });
