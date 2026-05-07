// source: https://lumpurini.com.ua/
// extracted: 2026-05-07T21:19:52.421Z
// scripts: 5

// === script #1 (length=1343) ===
document.addEventListener('DOMContentLoaded', () => {
    const list = document.querySelector('.values-list');
    const dotsContainer = document.querySelector('.values-pagination');
    if (!list || !dotsContainer) return;

    const items = Array.from(list.children);
    let activeIndex = 0;

    items.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.classList.add('values-pagination-dot');
      if (idx === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        list.scrollTo({
          left: items[idx].offsetLeft,
          behavior: 'smooth'
        });
      });
      dotsContainer.appendChild(dot);
    });

    list.addEventListener('scroll', () => {
      let scrollLeft = list.scrollLeft;
      let closestIndex = 0;
      let closestDistance = Infinity;
      items.forEach((item, idx) => {
        const distance = Math.abs(item.offsetLeft - scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = idx;
        }
      });
      if (closestIndex !== activeIndex) {
        dotsContainer.children[activeIndex].classList.remove('active');
        dotsContainer.children[closestIndex].classList.add('active');
        activeIndex = closestIndex;
      }
    });
  });

// === script #2 (length=1416) ===
document.addEventListener('DOMContentLoaded', function () {
    const orderText = document.getElementById('orderText');
    const steps = orderText.querySelectorAll('.step');
    const dotsContainer = document.getElementById('dotsContainer');

    orderText.scrollLeft = 0;

    dotsContainer.innerHTML = '';
    steps.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      if (i === 0) dot.classList.add('active');
      dot.dataset.index = i;
      dotsContainer.appendChild(dot);

      dot.addEventListener('click', () => {
        orderText.scrollTo({
          left: steps[i].offsetLeft,
          behavior: 'smooth',
        });
      });
    });

    function updateActiveDot() {
      const scrollLeft = orderText.scrollLeft;
      let activeIndex = 0;
      steps.forEach((step, i) => {
        if (scrollLeft >= step.offsetLeft - step.clientWidth / 2) {
          activeIndex = i;
        }
      });
      dotsContainer.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === activeIndex);
      });
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        orderText.scrollTo({
          left: steps[0].offsetLeft,
          behavior: 'auto',
        });
      }, 200);
    });

    orderText.addEventListener('scroll', updateActiveDot);
  });

// === script #3 (length=1797) ===
document.addEventListener('DOMContentLoaded', function () {
    const track = document.querySelector('.review-carousel-track');
    const btnLeft = document.querySelector('.carousel-button.left');
    const btnRight = document.querySelector('.carousel-button.right');
    const dotsContainer = document.querySelector('.carousel-dots');
    const scrollAmount = 400; // количество пикселей прокрутки при клике кнопок

    const cards = track.querySelectorAll('.review-card');
    const cardsCount = cards.length;

    // Создаем точки навигации
    for (let i = 0; i < cardsCount; i++) {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', 'Перейти к отзыву ' + (i + 1));
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => {
        track.scrollTo({ left: i * (cards[0].offsetWidth + 25), behavior: 'smooth' });
        updateActiveDot(i);
      });
      dotsContainer.appendChild(dot);
    }

    function updateActiveDot(activeIndex) {
      const dots = dotsContainer.querySelectorAll('button');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeIndex);
      });
    }

    // Обновляем активную точку при прокрутке карусели
    track.addEventListener('scroll', () => {
      const scrollLeft = track.scrollLeft;
      const cardWidth = cards[0].offsetWidth + 25;
      const index = Math.round(scrollLeft / cardWidth);
      updateActiveDot(index);
    });

    // Кнопки листания
    btnLeft.addEventListener('click', () => {
      track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    btnRight.addEventListener('click', () => {
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  });

// === script #4 (length=2780) ===
document.addEventListener("DOMContentLoaded", function () {
    const blogCol = document.querySelector('.frontInfo-col.__1of3');
    if (blogCol && blogCol.querySelector('.newsList')) {
        blogCol.remove(); // Полностью удаляем колонку с блогом
    }

    // Перераспределим ширину оставшихся колонок
    document.querySelectorAll('.frontInfo-col').forEach(function(col) {
        col.style.width = "100%";
        col.style.flex = "1 1 100%";
        col.style.maxWidth = "100%";
    }); 

let row = null;
    if (window.innerWidth > 768) {
      row = document.querySelector('.product-order .product-order__row');
    } else {
      row = document.querySelector('.product-card__price-box');
    }

    if (!row) return;  if (!row) return;
  if (row.querySelector('.rewish-logo')) return;

  const titleEl = document.querySelector('.product-title');
  const titleMobEl = document.querySelector('.heading--xl');
  const descEl = document.querySelector('.product-description');
  const firstImgLi = document.querySelector('.gallery__photos-list .gallery__item');
const firstImgMobLi = document.querySelector('.gallery__wrapper .gallery__item');
  let image = '';

  if (firstImgLi) {
    const href = firstImgLi.querySelector('.gallery__link')?.getAttribute('data-href') || '';
    if (href.startsWith('http')) {
      image = href;
    } else {
      image = location.origin + href;
    }
  } else {
const href = firstImgMobLi.querySelector('.gallery__link')?.getAttribute('data-href') || '';
    if (href.startsWith('http')) {
      image = href;
    } else {
      image = location.origin + href;
    }
}
  const priceEl = document.querySelector('.product-price');
  const priceMobEl = document.querySelector('.product-card__price');
  const title = titleEl ? titleEl.innerText.trim() : titleMobEl ? titleMobEl.innerText.trim() : '';  
  const description = descEl ? descEl.innerText.trim() : '';
  const price = priceEl ? priceEl.innerText.replace(/[^\d.,]/g, '') : priceMobEl ? priceMobEl.innerText.replace(/[^\d.,]/g, '') : '';  
  const link = location.href;

  const div = document.createElement('div');
  div.className = 'rewish-logo';
  div.dataset.rewishTitle = title;
  div.dataset.rewishDescription = description;
  div.dataset.rewishPicture = image;
  div.dataset.rewishPrice = price;
  div.dataset.rewishLink = link;
  div.dataset.rewishCurrency = 1;
  div.innerHTML = `
    <div class="rewish-logo-icon"></div>
    <span class="rewish-logo-tooltip">
      <img class="rewish-logo-tooltip-img" width="16" height="16"
           src="https://subscriptions.rewish.io/assets/icons/information-circle.svg" />
      Додати товар у вішліст в Rewish
    </span>
  `;

  row.appendChild(div);
 
});

// === script #5 (length=851) ===
(function(d) {
d.querySelectorAll('.j-phone-item').forEach(function (el) {
el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
})
})(document);
(function(d, w, s) {
var widgetHash = 'zcy27ml4zn9j7c0fog9h', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
})(document, window, 'script');
const waitB = setInterval(() => {if (!!window.BinotelCallTracking) {
for (let key in window.BinotelCallTracking) {
if(window.BinotelCallTracking[key]['initState']==="success"){
setTimeout(document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/\D/g, ''))),0)
clearInterval(waitB)}}}},1000)
