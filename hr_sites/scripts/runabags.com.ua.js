// source: https://runabags.com.ua/
// extracted: 2026-05-07T21:22:30.880Z
// scripts: 6

// === script #1 (length=9393) ===
document.addEventListener('DOMContentLoaded', function () {
  (function () {
    const FREE_DELIVERY_THRESHOLD = 5000;
    const TOTAL_SELECTORS = [
      '.cart-footer-b.cart-cost.j-total-sum', // десктоп
      '.cart__total-price.j-total-sum'        // мобільний
    ];

    let lastRenderedTotal = null;
    let updateTimeout = null;

// ✅ Частина 1: прогресбар
    function parsePrice(text) {
      return parseFloat(text.replace(/[^\d]/g, '')) || 0;
    }

    function formatPrice(num) {
      return num.toLocaleString('uk-UA') + ' грн';
    }

    function findTotalElement() {
      for (let selector of TOTAL_SELECTORS) {
        const el = document.querySelector(selector);
        if (el) return el;
      }
      return null;
    }

    function renderProgressBar(total) {
      if (total === lastRenderedTotal) return;
      lastRenderedTotal = total;

      let box = document.querySelector('#free-shipping-box');
      if (!box) {
        box = document.createElement('div');
        box.id = 'free-shipping-box';
        box.style.cssText = `
          border: 1px solid #ccc;
          border-radius: 12px;
          padding: 16px;
          margin-top: 16px;
          background: #fafafa;
          font-family: inherit;
        `;

        const totalEl = findTotalElement();
        if (totalEl && totalEl.parentElement) {
          totalEl.parentElement.appendChild(box);
        } else {
          console.warn('Free shipping box: target not found.');
          return;
        }
      }

      const diff = FREE_DELIVERY_THRESHOLD - total;
      const percent = Math.min(100, Math.round((total / FREE_DELIVERY_THRESHOLD) * 100));
      const isFree = diff <= 0;

      box.innerHTML = `
  <div style="
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  ">
    <span style="font-size: 16px;">🚚</span>
    ${isFree
      ? '<span style="color: #8B1F2F;">🎉 Безкоштовна доставка активована!</span>'
      : `До безкоштовної доставки залишилось: <strong>${formatPrice(diff)}</strong>`}
  </div>
  <div style="
    width: 100%;
    background: #f0f0f0;
    border-radius: 999px;
    height: 8px;
    overflow: hidden;
  ">
    <div style="
      width: ${percent}%;
      background: #8B1F2F;
      height: 100%;
      border-radius: 999px;
      transition: width 0.5s ease;
    "></div>
  </div>
`;

      localStorage.setItem('freeShippingStatus', isFree ? 'yes' : 'no');
    }

    function getCartTotal() {
      const el = findTotalElement();
      return el ? parsePrice(el.textContent.trim()) : 0;
    }

    function throttledRender() {
      if (updateTimeout) return;
      updateTimeout = setTimeout(() => {
        renderProgressBar(getCartTotal());
        updateTimeout = null;
      }, 300);
    }

    function observeCartChanges() {
      const container = document.querySelector('#cart');
      if (!container) return;

      const observer = new MutationObserver(throttledRender);
      observer.observe(container, {
        childList: true,
        subtree: true,
      });
    }

    let attempts = 0;
    const maxAttempts = 20;
    const initInterval = setInterval(() => {
      const el = findTotalElement();
      if (el) {
        clearInterval(initInterval);
        renderProgressBar(getCartTotal());
        observeCartChanges();
      } else if (++attempts >= maxAttempts) {
        clearInterval(initInterval);
        console.warn('Free shipping script: total element not found.');
      }
    }, 500);

// ✅ Частина 2: додавання "ОПЛАТИТИ ДОСТАВКУ" у коментар
    const submitBtn = document.querySelector('.j-submit');
    const commentField = document.querySelector('textarea[name="Recipient[comment]"]');

    if (submitBtn && commentField) {
      submitBtn.addEventListener('click', function () {
        const status = localStorage.getItem('freeShippingStatus') || 'no';

        if (status === 'yes') {
          const prefix = 'ОПЛАТИТИ ДОСТАВКУ';
          if (!commentField.value.includes(prefix)) {
            commentField.value = `${prefix}\n` + commentField.value.trim();
          }
        }
      });
    }

//Код для формування і відображення посилання на передплату моно
// 1. Знайти елемент з текстом про передплату
const targetPaymentInfo=
    document.querySelector('.checkout-success__body') ||  // мобілка
    document.querySelector('.checkout-complete-info');    // десктоп

  const paymentInfoEl =
    document.querySelector('.checkout-success__body p') ||  // мобілка
    document.querySelector('.checkout-complete-info p');    // десктоп

  const isPrepaid = paymentInfoEl?.textContent.includes('передплата 250грн');
  if (!isPrepaid) return;

  // 2. Отримати номер замовлення
  const orderIdEl =
  Array.from(document.querySelectorAll('.invoice__name'))
    .find(el => el.textContent.includes('Замовлення')) || // мобілка
  document.querySelector('.checkout-complete .h2');        // десктоп

  const orderId =
  orderIdEl?.classList.contains('invoice__name')
    ? orderIdEl.nextElementSibling?.textContent?.trim()
    : (orderIdEl?.textContent.match(/\d+/) || [])[0];

  if (!orderId) return;

// 👉 Ховаємо все, поки не згенерується посилання
  targetPaymentInfo.style.display = 'none';

  // 🔄 Додаємо “Завантаження...” замість реквізитів
  const loadingEl = document.createElement('div');
loadingEl.id = 'payment-loader';
loadingEl.style.cssText = `
  background: #ffe5e5;
  color: #8B1F2F;
  padding: 20px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// Створюємо CSS-анімацію для спінера
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
#payment-loader .spinner {
  width: 32px;
  height: 32px;
  border: 4px solid #8B1F2F;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}
`;
document.head.appendChild(style);

// Вставляємо HTML всередину елемента
loadingEl.innerHTML = `
  <div class="spinner"></div>
  <div class="main-status">Генеруємо посилання для оплати...</div>
  <div class="retry-status" style="font-size: 14px; font-weight: normal; margin-top: 8px; color: #666;">
    Будь ласка, зачекайте кілька секунд
  </div>
`;

targetPaymentInfo.parentNode.insertBefore(loadingEl, targetPaymentInfo);

// 👉 2. Функція запиту з підтримкою візуального оновлення
async function fetchWithRetry(url, options = {}, retries = 5, backoff = 1000, onRetry) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Статус ${response.status}`);
    return await response.json();
  } catch (err) {
    if (retries > 0) {
      // Рахуємо номер спроби: якщо всього 5, а залишилось 4 — це була 1-ша спроба
      const currentAttempt = 6 - retries; 
      
      // Оновлюємо текст на екрані через callback
      if (onRetry) onRetry(currentAttempt, backoff);

      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2, onRetry);
    }
    throw err;
  }
}

  // 3. Надіслати запит на Apps Script
  const apiUrl = `https://script.google.com/macros/s/AKfycbyu5OrRlAnNC3OsprijOa7WUT4cR-wOoYdIiqP3kKUv4hrBgl4UdNqfFLAyXZPscaWt/exec?orderId=${orderId}&amount=250`;
  (async () => {
  try {
    const data = await fetchWithRetry(apiUrl, {}, 5, 1000, (attempt, delay) => {
      // Цей код виконується при кожній невдалій спробі
      const statusText = loadingEl.querySelector('.retry-status');
      if (statusText) {
        statusText.innerHTML = `⚠️ Спроба ${attempt} не вдалася. Пробуємо ще раз через ${delay/1000} сек...`;
      }
    });

    if (data?.url) {
      loadingEl.innerHTML = `
        <strong>🔗 Посилання згенеровано!</strong><br>
        <small>Перенаправляємо на оплату...</small>
      `;
      
      targetPaymentInfo.style.display = ''; // показуємо реквізити про всяк випадок

      // Оновлюємо посилання в тексті, якщо воно там є
      const existingLink = Array.from(targetPaymentInfo.querySelectorAll('a'))
        .find(a => a.href.includes('pay.mbnk.biz/'));

      if (existingLink) {
        existingLink.href = data.url;
        if (existingLink.querySelector('span')) existingLink.querySelector('span').textContent = data.url;
      }

      // РЕДІРЕКТ
      window.location.href = data.url;
    }
  } catch (err) {
    // Якщо ПІСЛЯ 5 СПРОБ все одно помилка
    loadingEl.style.background = '#fff3cd';
    loadingEl.innerHTML = `
      <div style="font-size: 20px;">⚠️</div>
      <div>Не вдалося створити швидку оплату.</div>
      <div style="font-size: 14px; font-weight: normal; margin-top: 8px;">
        Будь ласка, скористайтеся реквізитами для оплати вручну нижче.
      </div>
    `;
    targetPaymentInfo.style.display = ''; 
    console.error('Final Error:', err);
  }
})();
    
  })();
});

// === script #2 (length=1815) ===
(function () {
  function enrichUrl(originalHref) {
    const url = new URL(originalHref, location.origin);
    const sessionParams = new URLSearchParams(location.search);

    sessionParams.forEach((v, k) => {
      if (k.toLowerCase().startsWith('utm_') && !url.searchParams.has(k)) {
        url.searchParams.set(k, v);
      }
    });

    return url;
  }

  function applyUtmContent(url) {
    if (url.searchParams.has('banner_key')) {
      const val = url.searchParams.get('banner_key');
      url.searchParams.delete('banner_key');
      url.searchParams.set('utm_content', val);
    }
    return url;
  }

  function shouldSkip(a) {
    const href = a.getAttribute('href') || '';
    // Пропускаємо якірні та пусті лінки
    return href.startsWith('#') || href.trim() === '' || href === '#!';
  }

  document.addEventListener('pointerdown', function (e) {
    const a = e.target.closest('a[href]');
    if (!a || shouldSkip(a)) return;

    const dest = new URL(a.getAttribute('href'), location.origin);
    if (dest.hostname !== location.hostname) return;

    let url = enrichUrl(dest.href);
    url = applyUtmContent(url);

    a.setAttribute('href', url.toString());
  }, true);

  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href]');
    if (!a || shouldSkip(a)) return;

    const dest = new URL(a.getAttribute('href'), location.origin);
    if (dest.hostname !== location.hostname) return;

    if (dest.searchParams.get('utm_content')) return;

    e.preventDefault();
    let url = enrichUrl(dest.href);
    url = applyUtmContent(url);

    if (a.target === '_blank') {
      window.open(url.toString(), '_blank');
    } else {
      window.location.href = url.toString();
    }
  }, true);
})();

// === script #3 (length=1340) ===
function getTitleText() {
  const desktopTitle = document.querySelector(".product-title");
  const mobileTitle = document.querySelector(".heading.heading--xl");
  return (desktopTitle?.innerText || mobileTitle?.innerText || "").trim();
}

function updateAvailability() {
  const title = getTitleText();
  const availabilityDesktop = document.querySelector(".product-header__availability");
  const availabilityMobile = document.querySelector(".presence-status");

  function setStatus(el) {
    if (!el) return;

    if (el.textContent.includes("Немає в наявності")) return;

    if (title.includes("Передзамовлення")) {
      el.textContent = "Передзамовлення";
    } else {
      el.textContent = "В наявності";
    }
  }

  setStatus(availabilityDesktop);
  setStatus(availabilityMobile);

  // 🔥 ВАЖЛИВО: перевідновлюємо стилі
  applyDiscountLink();
}

document.addEventListener("DOMContentLoaded", function () {
  updateAvailability();

  let lastTitle = getTitleText();

  document.body.addEventListener("click", function () {
    const checkInterval = setInterval(() => {
      const currentTitle = getTitleText();
      if (currentTitle !== lastTitle) {
        lastTitle = currentTitle;
        updateAvailability();
        clearInterval(checkInterval);
      }
    }, 100);
  });
});

// === script #4 (length=518) ===
function applyDiscountLink() {
  document.querySelectorAll('.user-discount__text').forEach(el => {

    // якщо лінк вже є — нічого не робимо
    if (el.querySelector('.discount-link')) return;

    if (el.textContent.includes('накопичувальної знижки')) {
      el.innerHTML = el.textContent.replace(
        'накопичувальної знижки',
        '<a class="discount-link" href="https://runabags.com.ua/nakopychuvalna-systema-znyzhok-runa/" target="_blank">накопичувальної знижки ↗</a>'
      );
    }
  });
}

// === script #5 (length=1247) ===
(function () {
  const banner = document.querySelector('.ribbon-banner');
  const track = document.getElementById('ribbonTrack');
  const originalSet = document.getElementById('ribbonSet');

  if (!banner || !track || !originalSet) return;

  function buildRibbon() {
    track.innerHTML = '';
    const baseSet = originalSet.cloneNode(true);
    baseSet.removeAttribute('id');
    track.appendChild(baseSet);

    const setWidth = baseSet.offsetWidth;
    const bannerWidth = banner.offsetWidth;

    if (!setWidth || !bannerWidth) return;

    const neededCopies = Math.ceil((bannerWidth * 2) / setWidth) + 1;

    for (let i = 0; i < neededCopies; i++) {
      const clone = baseSet.cloneNode(true);
      track.appendChild(clone);
    }

    track.style.setProperty('--loop-width', setWidth + 'px');

    const pxPerSecond = 120; 
    const duration = setWidth / pxPerSecond;
    track.style.setProperty('--ribbon-speed', duration + 's');
  }

  let resizeTimer;
  function rebuildOnResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildRibbon, 150);
  }

  window.addEventListener('load', buildRibbon);
  window.addEventListener('resize', rebuildOnResize);
  buildRibbon();
})();

// === script #6 (length=762) ===
(function () {

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

document.addEventListener("DOMContentLoaded", function () {

  const discountBlock = document.querySelector(".user-discount");
  if (!discountBlock) return;

  const viewers = random(3, 18);

  const block = document.createElement("div");
  block.id = "social-proof-block";

  block.style.display = "flex";
  block.style.alignItems = "center";
  block.style.gap = "8px";
  block.style.marginBottom = "8px";
  block.style.fontSize = "15px";

  block.innerHTML = `
    <span style="font-size:22px;">👀</span>
    <span>Зараз цей товар переглядають <b>${viewers}</b> осіб</span>
  `;

  discountBlock.before(block);

});

})();
