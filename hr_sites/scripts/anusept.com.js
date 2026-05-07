// source: https://anusept.com/
// extracted: 2026-05-07T21:20:45.242Z
// scripts: 1

// === script #1 (length=3608) ===
(function(){
  /** Класи Хорошопа/каруселі, які будемо вирівнювати */
  var PRODUCT_ROOT_SELECTORS = [
    /* списки/контейнери каруселі */
    '.catalog-carousel', '.catalog-cards', '.catalogCards', '.catalogProducts',
    /* елементи-айтеми */
    'li.catalog-carousel__item',
    /* картки */
    '.catalogCard', '.j-catalog-card', '.catalogCard-box'
  ];

  /** 1) Знаходимо "контентну" ліву межу статті (з урахуванням її padding-left) */
  function getArticleContentLeft(){
    var a = document.querySelector('article.anusept-main');
    if(!a) return null;
    var cs = getComputedStyle(a);
    var padLeft = parseFloat(cs.paddingLeft) || 0;
    var rect = a.getBoundingClientRect();
    return rect.left + padLeft + window.pageXOffset;
  }

  /** 2) Обчислюємо поточний лівий край елемента (в документі) */
  function getDocLeft(el){
    var r = el.getBoundingClientRect();
    return r.left + window.pageXOffset;
  }

  /** 3) Даємо елементу margin-left так, щоб його лівий край збігся з targetLeft */
  function alignElement(el, targetLeft){
    if(!el) return;
    var elLeft = getDocLeft(el);
    var currentML = parseFloat(getComputedStyle(el).marginLeft) || 0;
    var delta = Math.round((targetLeft - elLeft) + currentML);
    el.style.marginLeft = delta + 'px';
    el.classList.add('anusept-align-inline');
  }

  /** 4) Шукаємо найкращий контейнер для зсуву:
   *    - спершу намагаємось зсунути УВЕСЬ список/карусель (батьківський UL/контейнер),
   *    - якщо не знайшли — зсуваємо кожен айтем по черзі (як fallback).
   */
  function findCarouselContainer(){
    // спробуємо піднятися від будь-якої картки до батьківського контейнера
    var sample = document.querySelector('.catalogCard, li.catalog-carousel__item, .catalogCard-box');
    if (!sample) return null;

    // підіймаємося вгору, шукаючи типовий контейнер каруселі/списку
    var node = sample;
    while (node && node !== document.body){
      if (node.matches && node.matches('.catalog-carousel, .catalog-cards, .catalogCards, .catalogProducts, .swiper-wrapper, .swiper, ul, ol')){
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  /** 5) Основне вирівнювання */
  function alignAll(){
    // мобілка — без вирівнювання
    if (window.innerWidth <= 900){
      document.querySelectorAll('.anusept-align-inline').forEach(function(el){
        el.style.marginLeft = '';
      });
      return;
    }

    var targetLeft = getArticleContentLeft();
    if (targetLeft == null) return;

    // пріоритет — зсунути увесь контейнер каруселі/списку (найчистіше рішення)
    var container = findCarouselContainer();
    if (container){
      alignElement(container, targetLeft);
      return;
    }

    // fallback — зсуваємо всі відомі елементи (може бути важче вміститись із стрілками/пагінацією)
    PRODUCT_ROOT_SELECTORS.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(el){
        alignElement(el, targetLeft);
      });
    });
  }

  /** 6) Запуск і «розумні» оновлення */
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', alignAll);
  } else {
    alignAll();
  }

  var rt;
  window.addEventListener('resize', function(){
    clearTimeout(rt);
    rt = setTimeout(alignAll, 160);
  });

  // Якщо Хорошоп/карусель змінює DOM (перемикаються слайди, підвантажуються блоки)
  var mo = new MutationObserver(function(){
    alignAll();
  });
  mo.observe(document.body, {childList:true, subtree:true});
})();
