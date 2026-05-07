// source: https://outdoorsy.com.ua/
// extracted: 2026-05-07T21:22:19.313Z
// scripts: 6

// === script #1 (length=641) ===
function parentElementHide() {
    const hiddenEls = document.querySelectorAll('.hidden-el');

    hiddenEls.forEach(function (hiddenEl) {
        const parentElement = hiddenEl.closest('.filter__name.j-filter-dropdown-trigger');
        if (parentElement) {
            parentElement.style.display = 'none';
        }
    });
}

function hideFilterGroup() {
    const filterGroup = document.querySelector('[data-filter-id="4510"]');
    if (filterGroup) {
        filterGroup.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    parentElementHide();
    hideFilterGroup();
});

// === script #2 (length=1487) ===
document.addEventListener('DOMContentLoaded', () => {
    const getLocaleFromURL = () => {
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const languageSegment = pathSegments[0];

        switch (languageSegment) {
            case 'ru': return 'ru'; // Російська мова
            case 'ro': return 'ro'; // Румунська мова
            case 'en': return 'en'; // Англійська мова
            default: return 'uk';    // Мова за замовчуванням - українська
        }
    };

    const sortMenuItems = (menuContainer, itemSelector, textSelector, locale) => {
        const items = Array.from(menuContainer.querySelectorAll(itemSelector));

        items.sort((a, b) => {
            const aText = a.querySelector(textSelector).textContent.trim();
            const bText = b.querySelector(textSelector).textContent.trim();

            return aText.localeCompare(bText, locale);
        });

        items.forEach(item => menuContainer.appendChild(item));
    };

    const locale = getLocaleFromURL();
    const desktopMenu = document.querySelector('.children-pages-menu__content');
    const mobileMenu = document.querySelector('.catalog-menu__content');

    if (desktopMenu) {
        sortMenuItems(desktopMenu, '.children-pages-menu__item', '.children-pages-menu__text', locale);
    }

    if (mobileMenu) {
        sortMenuItems(mobileMenu, '.catalog-menu__item', '.catalog-menu__text', locale);
    }
});

// === script #3 (length=1053) ===
document.addEventListener("DOMContentLoaded", function() {
  const targetHrefs = ['/en/products/', '/en/brands/', '/ua/products/', '/ua/brands/'];
  
  const hideItemsByHref = (selector) => {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      const href = element.getAttribute('href');
      const dataHref = element.dataset.href;

      if (targetHrefs.includes(href) || targetHrefs.includes(dataHref)) {
        if (element.classList.contains('mm-next-text')) {
          element.closest('li').style.display = 'none';
        } else {
          element.parentNode.style.display = 'none';
        }
      }
    });
  };

  hideItemsByHref('.products-menu__item a.products-menu__title-link');
  hideItemsByHref('.menu__section .main-nav__item a.main-nav__link');
  hideItemsByHref('.menu__section .main-nav__item a.mm-next-text');
  hideItemsByHref('.menu__section .main-nav__item div.mm-next-text');
  hideItemsByHref('.menu__section .main-nav__item div.main-nav__link');
});

// === script #4 (length=851) ===
document.addEventListener("DOMContentLoaded", function () {
    let filterCompacts = document.querySelectorAll(".filter-compact");
    let stickyPosition = 0; // Change this value if you want the sticky element to stick at a different position

    window.addEventListener("scroll", function () {
        filterCompacts.forEach(function (filterCompact) {
            let elementTop = filterCompact.getBoundingClientRect().top;

            if (elementTop === stickyPosition) {
                filterCompact.style.backgroundColor = "#f4f2ec";
                filterCompact.classList.add("box-shadow"); // Add box-shadow class
            } else {
                filterCompact.style.backgroundColor = "#fff";
                filterCompact.classList.remove("box-shadow"); // Remove box-shadow class
            }
        });
    });
});

// === script #5 (length=2495) ===
const catalogItems = [
    {
        title: "Сумки Дорожні",
        imgSrc: "/content/uploads/images/main-page/shop-top-categories/travel-bags.jpg",
        altText: "Travel Bags Image",
        url: "/products/bags/travel-bags/",
    },
    {
        title: "Сумки Дорожні",
        imgSrc: "/content/uploads/images/main-page/shop-top-categories/travel-bags.jpg",
        altText: "Travel Bags Image",
        url: "/products/bags/travel-bags/",
    },
    {
        title: "Сумки Дорожні",
        imgSrc: "/content/uploads/images/main-page/shop-top-categories/travel-bags.jpg",
        altText: "Travel Bags Image",
        url: "/products/bags/travel-bags/",
    },
    {
        title: "Сумки Дорожні",
        imgSrc: "/content/uploads/images/main-page/shop-top-categories/travel-bags.jpg",
        altText: "Travel Bags Image",
        url: "/products/bags/travel-bags/",
    },
   {
        title: "Сумки Дорожні",
        imgSrc: "/content/uploads/images/main-page/shop-top-categories/travel-bags.jpg",
        altText: "Travel Bags Image",
        url: "/products/bags/travel-bags/",
    },
    {
        title: "Сумки Дорожні",
        imgSrc: "/content/uploads/images/main-page/shop-top-categories/travel-bags.jpg",
        altText: "Travel Bags Image",
        url: "/products/bags/travel-bags/",
    },
    {
        title: "Сумки Дорожні",
        imgSrc: "/content/uploads/images/main-page/shop-top-categories/travel-bags.jpg",
        altText: "Travel Bags Image",
        url: "/products/bags/travel-bags/",
    },
    {
        title: "Сумки Дорожні",
        imgSrc: "/content/uploads/images/main-page/shop-top-categories/travel-bags.jpg",
        altText: "Travel Bags Image",
        url: "/products/bags/travel-bags/",
    },
    // Add more items here
];

const catalogGrid = document.querySelector(".catalog-grid");

catalogItems.forEach((item) => {
    const catalogItem = document.createElement("li");
    catalogItem.classList.add("catalog-item");

    const link = document.createElement("a");
    link.href = item.url;
    link.classList.add("catalog-item-link");

    const img = document.createElement("img");
    img.src = item.imgSrc;
    img.alt = item.altText;

    const title = document.createElement("h3");
    title.textContent = item.title;

    link.appendChild(img);
    link.appendChild(title);

    catalogItem.appendChild(link);
    catalogGrid.appendChild(catalogItem);
});

// === script #6 (length=583) ===
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-238874482-1', 'auto');
  ga('require', 'ec');
  ga('set', '&cu', GLOBAL.currency.iso);

   // заменяется кодом инициализации события с расположением "Внутри кода инициализации маркетинговой системы"
  
  ga('send', 'pageview');
