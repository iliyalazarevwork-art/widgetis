// source: https://usaautoparts.com.ua/
// extracted: 2026-05-07T21:23:04.243Z
// scripts: 3

// === script #1 (length=3371) ===
// Конвертер меню HoroShop: з табів у простий грід
(function() {
    'use strict';
    
    function convertMenu() {
        // Знаходимо меню з табами
        const tabbedMenu = document.querySelector('.productsMenu-submenu.__hasTabs');
        if (!tabbedMenu) return;
        
        // Отримуємо всі таби
        const tabs = tabbedMenu.querySelectorAll('.productsMenu-tabs-list__tab');
        if (!tabs.length) return;
        
        // Збираємо дані з табів
        const items = [];
        tabs.forEach(tab => {
            const link = tab.querySelector('.productsMenu-tabs-list__link');
            if (!link) return;
            
            const text = link.textContent.trim();
            // Пропускаємо "Б/У Оригінал"
            if (text === 'Б/У Оригінал') return;
            
            const img = link.querySelector('img');
            if (!img) return;
            
            items.push({
                href: link.getAttribute('href'),
                text: text,
                alt: img.getAttribute('alt'),
                title: img.getAttribute('title') || '',
                width: img.getAttribute('width'),
                height: img.getAttribute('height'),
                src: img.getAttribute('src'),
                srcset: img.getAttribute('srcset')
            });
        });
        
        if (!items.length) return;
        
        // Створюємо новий грід
        const newMenu = document.createElement('div');
        newMenu.className = 'productsMenu-submenu __fluidGrid __smallIcons';
        newMenu.style.cssText = 'width: 1416px; top: 40px; left: 0px;';
        
        const ul = document.createElement('ul');
        ul.className = 'productsMenu-submenu-w';
        ul.style.width = 'auto';
        ul.id = 'menu-tab-converted';
        
        // Генеруємо елементи
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'productsMenu-submenu-i';
            
            const a = document.createElement('a');
            a.className = 'productsMenu-submenu-a';
            a.href = item.href;
            
            const imgDiv = document.createElement('div');
            imgDiv.className = 'productsMenu-submenu-image';
            
            const img = document.createElement('img');
            img.alt = item.alt;
            img.title = item.title;
            img.width = item.width;
            img.height = item.height;
            img.src = item.src;
            img.srcset = item.srcset;
            
            imgDiv.appendChild(img);
            
            const span = document.createElement('span');
            span.className = 'productsMenu-submenu-t';
            span.textContent = item.text;
            
            a.appendChild(imgDiv);
            a.appendChild(span);
            li.appendChild(a);
            ul.appendChild(li);
        });
        
        newMenu.appendChild(ul);
        
        // Замінюємо старе меню
        tabbedMenu.parentNode.replaceChild(newMenu, tabbedMenu);
        
    
    }
    
    // Запускаємо після завантаження DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', convertMenu);
    } else {
        convertMenu();
    }
})();

// === script #2 (length=1215) ===
(function () {
  'use strict';

  const TARGET_HREFS = ['/bu-oryhinal/', '/ru/bu-oryhinal/'];
  const isRu = location.pathname.startsWith('/ru/');
  const newText = isRu ? 'Б/У Оригинал' : 'Б/У Оригінал';

  function replaceOnce() {
    // Підміняємо в хедері, футері та десь у контенті, якщо повторюється
    const links = document.querySelectorAll('a[href]');
    let changed = false;

    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      if (TARGET_HREFS.includes(href)) {
        if (a.textContent.trim() !== newText) {
          a.textContent = newText;
          changed = true;
        }
      }
    });
    return changed;
  }

  // 1) Спробувати одразу
  replaceOnce();

  // 2) Дочекатися повного завантаження (на випадок пізньої ініціалізації меню)
  window.addEventListener('load', replaceOnce);

  // 3) Підхопити динамічні зміни (Horoshop може перебудовувати меню після DOMContentLoaded)
  const obs = new MutationObserver(() => replaceOnce());
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // 4) Щоб не тримати Observer вічно – відключимо через 8 секунд
  setTimeout(() => obs.disconnect(), 8000);
})();

// === script #3 (length=7137) ===
(function () {
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[char];
    });
  }

  function getStockLabel() {
    var path = window.location.pathname || '';
    if (path.indexOf('/ru/') === 0 || path.indexOf('/ru') === 0) {
      return 'На складе:';
    }
    return 'На складі:';
  }

  function getStockRowMatcher() {
    var path = window.location.pathname || '';
    if (path.indexOf('/ru/') === 0 || path.indexOf('/ru') === 0) {
      return ['в наличии на складе', 'наличие на складе', 'в наявності на складі'];
    }
    return ['в наявності на складі', 'наявність на складі'];
  }

  function findStockRow() {
    var featureRows = document.querySelectorAll('.product-features__row, .product-characteristics__row, tr');
    var matchers = getStockRowMatcher();
    return Array.from(featureRows).find(function (row) {
      var labelCell = row.querySelector('th, td:first-child, .product-features__cell:first-child');
      if (!labelCell) return false;
      var labelText = labelCell.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
      return matchers.some(function (m) {
        return labelText.indexOf(m) !== -1;
      });
    });
  }

  function buildStockBlock(locations) {
    var stockBlock = document.createElement('div');
    stockBlock.className = 'bss-stock-locations';
    stockBlock.innerHTML =
      '<span class="bss-stock-locations__label">' + getStockLabel() + '</span>' +
      '<span class="bss-stock-locations__items">' +
        locations.map(function (location) {
          return '<span class="bss-stock-locations__item">' +
                   '<span class="bss-stock-locations__dot"></span>' +
                   escapeHtml(location) +
                 '</span>';
        }).join('') +
      '</span>';
    return stockBlock;
  }

  function getLocations() {
    var stockRow = findStockRow();
    if (!stockRow) return null;
    var valueCell = stockRow.querySelector('td:last-child, .product-features__cell:nth-child(2), .product-features__cell:last-child');
    if (!valueCell) return null;
    var stockText = valueCell.textContent.replace(/\s+/g, ' ').trim();
    if (!stockText) return null;
    var locations = stockText.split(',').map(function (item) {
      return item.trim();
    }).filter(Boolean);
    return { row: stockRow, locations: locations };
  }

  function addStockLocations() {
    if (document.querySelector('.bss-stock-locations')) return;

    var data = getLocations();
    if (!data || !data.locations.length) return;

    var desktopAvailability = document.querySelector('.product-header__availability');
    var mobilePresence = document.querySelector('.product-card__presence .presence-status, .product-card__presence');

    var target = desktopAvailability || mobilePresence;
    if (!target) return;

    var availability = target;
    if (target.classList && target.classList.contains('product-card__presence')) {
      var inner = target.querySelector('.presence-status');
      if (inner) availability = inner;
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'bss-stock-wrapper';
    availability.parentNode.insertBefore(wrapper, availability);
    wrapper.appendChild(availability);

    var stockBlock = buildStockBlock(data.locations);
    wrapper.appendChild(stockBlock);

    data.row.style.display = 'none';
  }

  function addStyles() {
    if (document.querySelector('#bss-stock-locations-style')) return;
    var style = document.createElement('style');
    style.id = 'bss-stock-locations-style';
    style.innerHTML =
      '.bss-stock-wrapper {' +
        'display: flex;' +
        'flex-direction: column;' +
        'align-items: flex-start;' +
        'gap: 10px;' +
        'margin: 6px 18px 6px 0;' +
      '}' +
      '.bss-stock-wrapper .product-header__availability,' +
      '.bss-stock-wrapper .presence-status {' +
        'margin-right: 0 !important;' +
      '}' +

      /* Десктопні стилі */
      '.bss-stock-locations {' +
        'display: flex;' +
        'align-items: center;' +
        'flex-wrap: wrap;' +
        'gap: 8px 10px;' +
        'font-size: 15px;' +
        'line-height: 1.3;' +
        'color: #2c3e50;' +
      '}' +
      '.bss-stock-locations__label {' +
        'color: #8a8a8a;' +
        'font-weight: 500;' +
        'letter-spacing: 0.2px;' +
      '}' +
      '.bss-stock-locations__items {' +
        'display: flex;' +
        'align-items: center;' +
        'flex-wrap: wrap;' +
        'gap: 6px 8px;' +
      '}' +
      '.bss-stock-locations__item {' +
        'display: inline-flex;' +
        'align-items: center;' +
        'gap: 6px;' +
        'padding: 5px 12px 5px 10px;' +
        'border-radius: 999px;' +
        'background: linear-gradient(180deg, #f3faea 0%, #e8f5d6 100%);' +
        'border: 1px solid rgba(105, 184, 21, 0.35);' +
        'color: #3f8f00;' +
        'font-weight: 600;' +
        'font-size: 14px;' +
        'white-space: nowrap;' +
        'box-shadow: 0 1px 2px rgba(63, 143, 0, 0.06);' +
        'transition: transform 0.15s ease, box-shadow 0.15s ease;' +
      '}' +
      '.bss-stock-locations__item:hover {' +
        'transform: translateY(-1px);' +
        'box-shadow: 0 3px 8px rgba(63, 143, 0, 0.12);' +
      '}' +
      '.bss-stock-locations__dot {' +
        'width: 7px;' +
        'height: 7px;' +
        'border-radius: 50%;' +
        'background: #69b815;' +
        'box-shadow: 0 0 0 3px rgba(105, 184, 21, 0.18);' +
        'flex-shrink: 0;' +
      '}' +

      /* Мобільні стилі */
      '@media (max-width: 768px) {' +
        '.bss-stock-wrapper {' +
          'width: 100%;' +
          'margin: 8px 0;' +
          'gap: 8px;' +
        '}' +
        '.bss-stock-locations {' +
          'font-size: 16px;' +
          'gap: 8px;' +
          'width: 100%;' +
        '}' +
        '.bss-stock-locations__label {' +
          'font-size: 16px;' +
        '}' +
        '.bss-stock-locations__item {' +
          'padding: 6px 12px 6px 10px;' +
          'font-size: 15px;' +
        '}' +
        '.bss-stock-locations__dot {' +
          'width: 8px;' +
          'height: 8px;' +
        '}' +
      '}';
    document.head.appendChild(style);
  }

  function init() {
    addStyles();
    addStockLocations();
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('load', init);
  setTimeout(init, 500);
  setTimeout(init, 1500);
  setTimeout(init, 3000);

  if (window.MutationObserver) {
    var mo = new MutationObserver(function () {
      if (!document.querySelector('.bss-stock-locations')) {
        addStockLocations();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { mo.disconnect(); }, 15000);
  }
})();
