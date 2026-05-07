// source: https://opt-shkarpetok.com/
// extracted: 2026-05-07T21:19:07.053Z
// scripts: 3

// === script #1 (length=15262) ===
// Налаштування порогу безкоштовної доставки (в грн)
const FREE_DELIVERY_THRESHOLD = 2000;

// Функція для форматування суми
function formatPrice(price) {
  return Math.round(price) + ' грн';
}

// Функція для розрахунку прогресу
function calculateProgress(currentSum) {
  return Math.min((currentSum / FREE_DELIVERY_THRESHOLD) * 100, 100);
}

// HTML прогресбару як рядок таблиці (для Desktop)
function getProgressBarHTML() {
  return `
<tr class="delivery-progress-row">
  <td colspan="4" style="padding:0;border:none">
    <div class="delivery-progress-widget" style="background:#fff;border-radius:8px;padding:20px;margin:15px 0">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13.5-9l1.96 2.5H17V9h2.5zm-1.5 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="#4CAF50"/></svg>
        <h3 style="margin:0;font-size:18px;color:#333;font-weight:600">Безкоштовна доставка від 2 000 грн</h3>
      </div>
      
      <div style="text-align:center;margin-bottom:12px">
        <span class="remaining-text" style="font-size:16px;font-weight:600;color:#FF6B35">Залишилось: 2000 грн</span>
      </div>
      
      <div style="position:relative;height:32px;background:#f0f0f0;border-radius:16px;overflow:hidden">
        <div class="progress-bar" style="height:100%;background:linear-gradient(90deg,#4CAF50 0%,#45a049 100%);border-radius:16px;transition:width 0.4s ease;width:0%;display:flex;align-items:center;justify-content:center">
          <span class="progress-percent" style="color:white;font-size:14px;font-weight:700;display:none">0%</span>
        </div>
      </div>
      
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#999">
        <span>0 грн</span>
        <span>2 000 грн</span>
      </div>
      
      <div style="margin-top:12px;padding:10px;background:#e8f5e9;border-radius:6px;font-size:13px;color:#2e7d32;text-align:center;font-weight:500">
        🚚 Безкоштовна доставка Новою Поштою та Укрпоштою
      </div>
    </div>
  </td>
</tr>`;
}

// Отримання суми кошика
function getCartTotal() {
  try {
    const popup = document.querySelector('.popup_cart, #cart');
    if (popup) {
      const allText = popup.textContent || popup.innerText || '';
      const matches = allText.matchAll(/Всього[\s\n]*(\d+[\s\d]*(?:\.\d+)?)\s*грн/gi);
      const matchArray = Array.from(matches);
      if (matchArray.length > 0) {
        const lastMatch = matchArray[matchArray.length - 1];
        const totalStr = lastMatch[1].replace(/\s/g, '');
        const total = parseFloat(totalStr);
        return total;
      }
    }
    
    const totalElement = document.querySelector('.j-total-sum, .cart-cost');
    if (totalElement) {
      const text = totalElement.textContent || totalElement.innerText || '';
      const cleanText = text.replace(/\s/g, '');
      const match = cleanText.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    
    return 0;
  } catch (e) {
    console.error('❌ Помилка:', e);
    return 0;
  }
}

// Оновлення прогресбару
function updateProgressBar() {
  const widget = document.querySelector('.delivery-progress-widget');
  if (!widget) return;
  
  const total = getCartTotal();
  const progress = calculateProgress(total);
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - total);
  
  const progressBar = widget.querySelector('.progress-bar');
  const remainingText = widget.querySelector('.remaining-text');
  const progressPercent = widget.querySelector('.progress-percent');
  
  if (progressBar) {
    progressBar.style.width = progress + '%';
  }
  
  if (progressPercent) {
    progressPercent.textContent = Math.round(progress) + '%';
    progressPercent.style.display = progress > 20 ? 'block' : 'none';
  }
  
  if (remainingText) {
    if (total >= FREE_DELIVERY_THRESHOLD) {
      remainingText.innerHTML = '<span style="color:#4CAF50;font-size:18px">✓ Безкоштовна доставка!</span>';
    } else {
      remainingText.innerHTML = 'Залишилось: <strong style="color:#FF6B35">' + formatPrice(remaining) + '</strong>';
    }
  }
}

// Вставка прогресбару
function insertProgressBar() {
  const existingWidget = document.querySelector('.delivery-progress-widget');
  if (existingWidget) {
    console.log('ℹ️ Прогресбар вже є');
    updateProgressBar();
    return;
  }
  
  console.log('🔍 Шукаємо місце для вставки...');
  
  // Desktop - popup з таблицею
  const cartFooter = document.querySelector('td.cart-footer');
  if (cartFooter) {
    console.log('✅ Desktop: Футер знайдено');
    const footerRow = cartFooter.closest('tr');
    if (footerRow) {
      const existingRow = document.querySelector('.delivery-progress-row');
      if (!existingRow) {
        footerRow.insertAdjacentHTML('beforebegin', getProgressBarHTML());
        console.log('✅ Прогресбар вставлено (Desktop)');
        setTimeout(updateProgressBar, 200);
        startUpdateInterval();
      }
      return;
    }
  }
  
  // Mobile - пошук різними способами
  console.log('🔍 Mobile: Шукаємо кнопку оформлення...');
  
  // Спосіб 1: Пошук кнопки оформлення
  let orderButton = document.querySelector('a[href="/checkout/"]');
  
  if (!orderButton) {
    // Спосіб 2: Пошук за текстом
    orderButton = Array.from(document.querySelectorAll('a, button')).find(el => 
      el.textContent.includes('Оформити замовлення')
    );
  }
  
  if (!orderButton) {
    // Спосіб 3: Пошук за класом
    orderButton = document.querySelector('.cart-btnOrder a, .btn.__special');
  }
  
  if (orderButton) {
    console.log('✅ Mobile: Кнопка знайдена, вставляємо прогресбар');
    const mobileHTML = `
      <div class="delivery-progress-widget" style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:20px;margin:15px 0;box-shadow:0 2px 4px rgba(0,0,0,0.05)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13.5-9l1.96 2.5H17V9h2.5zm-1.5 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="#4CAF50"/></svg>
          <h3 style="margin:0;font-size:18px;color:#333;font-weight:600">Безкоштовна доставка від 2 000 грн</h3>
        </div>
        
        <div style="text-align:center;margin-bottom:12px">
          <span class="remaining-text" style="font-size:16px;font-weight:600;color:#FF6B35">Залишилось: 2000 грн</span>
        </div>
        
        <div style="position:relative;height:32px;background:#f0f0f0;border-radius:16px;overflow:hidden">
          <div class="progress-bar" style="height:100%;background:linear-gradient(90deg,#4CAF50 0%,#45a049 100%);border-radius:16px;transition:width 0.4s ease;width:0%;display:flex;align-items:center;justify-content:center">
            <span class="progress-percent" style="color:white;font-size:14px;font-weight:700;display:none">0%</span>
          </div>
        </div>
        
        <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#999">
          <span>0 грн</span>
          <span>2 000 грн</span>
        </div>
        
        <div style="margin-top:12px;padding:10px;background:#e8f5e9;border-radius:6px;font-size:13px;color:#2e7d32;text-align:center;font-weight:500">
          🚚 Безкоштовна доставка Новою Поштою та Укрпоштою
        </div>
      </div>
    `;
    orderButton.insertAdjacentHTML('beforebegin', mobileHTML);
    console.log('✅ Прогресбар вставлено (Mobile)');
    setTimeout(updateProgressBar, 200);
    startUpdateInterval();
    return;
  }
  
  // Спосіб 4: Якщо є suma "Всього" - значить ми в кошику
  const totalText = document.body.textContent;
  if (totalText.includes('Всього') && totalText.includes('грн')) {
    console.log('✅ Mobile: Виявлено текст "Всього", шукаємо альтернативне місце');
    
    // Шукаємо елемент з сумою
    const allDivs = document.querySelectorAll('div');
    for (let div of allDivs) {
      const text = div.textContent || '';
      if (text.includes('Всього') && text.includes('грн') && div.children.length > 0) {
        console.log('✅ Знайдено контейнер з сумою, вставляємо після нього');
        div.insertAdjacentHTML('afterend', `
          <div class="delivery-progress-widget" style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:20px;margin:15px;box-shadow:0 2px 4px rgba(0,0,0,0.05)">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13.5-9l1.96 2.5H17V9h2.5zm-1.5 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="#4CAF50"/></svg>
              <h3 style="margin:0;font-size:18px;color:#333;font-weight:600">Безкоштовна доставка від 2 000 грн</h3>
            </div>
            <div style="text-align:center;margin-bottom:12px">
              <span class="remaining-text" style="font-size:16px;font-weight:600;color:#FF6B35">Залишилось: 2000 грн</span>
            </div>
            <div style="position:relative;height:32px;background:#f0f0f0;border-radius:16px;overflow:hidden">
              <div class="progress-bar" style="height:100%;background:linear-gradient(90deg,#4CAF50 0%,#45a049 100%);border-radius:16px;transition:width 0.4s ease;width:0%;display:flex;align-items:center;justify-content:center">
                <span class="progress-percent" style="color:white;font-size:14px;font-weight:700;display:none">0%</span>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#999">
              <span>0 грн</span><span>2 000 грн</span>
            </div>
            <div style="margin-top:12px;padding:10px;background:#e8f5e9;border-radius:6px;font-size:13px;color:#2e7d32;text-align:center;font-weight:500">
              🚚 Безкоштовна доставка Новою Поштою та Укрпоштою
            </div>
          </div>
        `);
        setTimeout(updateProgressBar, 200);
        startUpdateInterval();
        return;
      }
    }
  }
  
  console.log('❌ Не знайдено підходящого місця для вставки');
}

// Функція для запуску інтервалу оновлення
function startUpdateInterval() {
  const interval = setInterval(() => {
    const hasWidget = document.querySelector('.delivery-progress-widget');
    if (!hasWidget) {
      clearInterval(interval);
      return;
    }
    updateProgressBar();
  }, 300);
}

// Спостерігач за DOM
let observer = null;
let reinsertTimeout = null;

function startObserver() {
  if (observer) return;
  
  observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      for (let node of mutation.removedNodes) {
        if (node.nodeType === 1 && (
          node.classList?.contains('delivery-progress-widget') ||
          node.classList?.contains('delivery-progress-row') ||
          node.querySelector?.('.delivery-progress-widget')
        )) {
          if (reinsertTimeout) clearTimeout(reinsertTimeout);
          reinsertTimeout = setTimeout(() => {
            insertProgressBar();
          }, 500);
          return;
        }
      }
      
      for (let node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          if (node.classList && (node.classList.contains('popup_cart') || node.id === 'cart')) {
            setTimeout(insertProgressBar, 300);
          }
          const cartTable = node.querySelector ? node.querySelector('.cart-items, td.cart-footer') : null;
          if (cartTable) {
            setTimeout(insertProgressBar, 300);
          }
        }
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Відстеження кліків
document.addEventListener('click', function(e) {
  setTimeout(() => {
    const popup = document.querySelector('.popup_cart, #cart');
    if (popup && popup.style.display !== 'none') {
      insertProgressBar();
      return;
    }
    
    const isCartPage = Array.from(document.querySelectorAll('a, button')).some(el => 
      el.textContent.includes('Оформити замовлення')
    );
    
    if (isCartPage) {
      insertProgressBar();
    }
  }, 400);
}, true);

// Додатково перевіряємо при зміні URL (для SPA/AJAX навігації)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(() => {
      const isCartPage = Array.from(document.querySelectorAll('a, button')).some(el => 
        el.textContent.includes('Оформити замовлення')
      );
      if (isCartPage) {
        insertProgressBar();
      }
    }, 500);
  }
}).observe(document, {subtree: true, childList: true});

// Перевіряємо кожні 2 секунди якщо є кнопка оформлення, але немає прогресбару
setInterval(() => {
  const hasButton = Array.from(document.querySelectorAll('a, button')).some(el => 
    el.textContent.includes('Оформити замовлення')
  );
  const hasWidget = document.querySelector('.delivery-progress-widget');
  
  if (hasButton && !hasWidget) {
    console.log('🔄 Mobile: Виявлено кошик без прогресбару, вставляємо');
    insertProgressBar();
  }
}, 2000);

// Запуск при завантаженні
function init() {
  startObserver();
  
  // Перша перевірка через 500мс
  setTimeout(() => {
    const popup = document.querySelector('.popup_cart, #cart');
    if (popup && popup.style.display !== 'none') {
      insertProgressBar();
      return;
    }
    
    const isCartPage = Array.from(document.querySelectorAll('a, button')).some(el => 
      el.textContent.includes('Оформити замовлення')
    );
    
    if (isCartPage) {
      console.log('📱 Виявлено сторінку кошика при завантаженні');
      insertProgressBar();
    }
  }, 500);
  
  // Повторна перевірка через 1.5 секунди (на випадок повільного завантаження)
  setTimeout(() => {
    const hasWidget = document.querySelector('.delivery-progress-widget');
    if (!hasWidget) {
      const isCartPage = Array.from(document.querySelectorAll('a, button')).some(el => 
        el.textContent.includes('Оформити замовлення')
      );
      
      if (isCartPage) {
        console.log('📱 Повторна спроба вставки прогресбару');
        insertProgressBar();
      }
    }
  }, 1500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// === script #2 (length=2696) ===
(function() {
    'use strict';
    
    // Функція блокування для Horoshop
    function blockHoroshopQuantity() {
        // Horoshop використовує специфічні селектори
        const selectors = [
            '.counter-field.j-quantity-p',
            'input.j-quantity-p',
            '.product-quantity input',
            '.cart-quantity input',
            'input[data-step]'
        ];
        
        selectors.forEach(function(selector) {
            const inputs = document.querySelectorAll(selector);
            
            inputs.forEach(function(input) {
                if (input.dataset.horoshopBlocked) return;
                input.dataset.horoshopBlocked = 'true';
                
                // Критичні атрибути для мобільного
                input.setAttribute('readonly', 'readonly');
                input.setAttribute('inputmode', 'none'); // Блокує Android клавіатуру
                input.readOnly = true;
                
                // Ховаємо каретку
                input.style.caretColor = 'transparent';
                
                // Блокуємо focus
                input.addEventListener('focus', function(e) {
                    e.preventDefault();
                    this.blur();
                }, true);
                
                // Блокуємо touchstart (критично для мобільних!)
                input.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    this.blur();
                    return false;
                }, { passive: false, capture: true });
                
                // Блокуємо всі інші події
                ['click', 'mousedown', 'touchend', 'pointerdown'].forEach(function(evt) {
                    input.addEventListener(evt, function(e) {
                        e.preventDefault();
                        this.blur();
                        return false;
                    }, { passive: false, capture: true });
                });
            });
        });
    }
    
    // Запуск після завантаження
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', blockHoroshopQuantity);
    } else {
        blockHoroshopQuantity();
    }
    
    // Перевірка кожні 500мс (Horoshop може динамічно оновлювати кошик)
    setInterval(blockHoroshopQuantity, 500);
    
    // MutationObserver для відстеження змін
    const observer = new MutationObserver(blockHoroshopQuantity);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
})();

// === script #3 (length=1684) ===
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname !== '/checkout/') return;

  var MIN = 325;
  var lastTotal = -1;

  function getOrderTotal() {
    var el = document.querySelector('.j-total-sum');
    if (!el) return 0;
    var text = el.textContent.replace(/[^\d.,]/g, '').replace(',', '.');
    return parseFloat(text) || 0;
  }

  function updateNotice() {
    var total = getOrderTotal();
    if (total === lastTotal) return;
    lastTotal = total;

    var diff = MIN - total;
    var existing = document.getElementById('min-order-notice');

    if (diff <= 0) {
      if (existing) existing.remove();
      return;
    }

    if (!existing) {
      var target =
        document.querySelector('[data-component="Quick"] .checkout-step-h') ||
        document.querySelector('.checkout-step-h') ||
        document.querySelector('[data-component="Quick"]');
      if (!target) return;
      existing = document.createElement('div');
      existing.id = 'min-order-notice';
      existing.style.cssText = 'background:linear-gradient(135deg,#ff4444,#ff6b35);color:#fff;font-weight:700;text-align:center;padding:14px 20px;margin:12px 0 16px;border-radius:8px;box-shadow:0 4px 15px rgba(255,68,68,0.4);border-left:5px solid #ffcc00;';
      target.after(existing);
    }

    existing.innerHTML = '<span style="font-size:clamp(12px,3.5vw,18px);white-space:nowrap;">🥹 Ще трохи.. Мінімальне замовлення <span style="color:#ffcc00;">325 грн</span></span>';
  }

  setInterval(updateNotice, 1000);
  setTimeout(updateNotice, 500);
  setTimeout(updateNotice, 2000);
  setTimeout(updateNotice, 4000);
});
