// source: https://yuzershop.com/
// extracted: 2026-05-07T21:23:15.964Z
// scripts: 1

// === script #1 (length=3368) ===
document.addEventListener("DOMContentLoaded", function () {

  /* ===== HERO — вставка між банером і хітами ===== */
  const isHome =
    window.location.pathname === "/" ||
    window.location.pathname === "";

  if (isHome && !document.querySelector('.yz-hero')) {
    const hero = document.createElement('div');
    hero.className = 'yz-hero';
    hero.innerHTML = `
      <div class="yz-hero-inner">
        <div class="yz-left">
          <h2>Підбір акумуляторів та інверторів</h2>
          <p>Допоможемо підібрати рішення під вашу задачу швидко і без переплат</p>
          <div class="yz-actions">
            <button class="yz-btn yz-main" id="yzHeroConsult">Консультація</button>
            <a href="/hotovi-akumuliatorni-zbirky/" class="yz-btn yz-light">Каталог</a>
          </div>
        </div>
        <div class="yz-right">
          <div class="yz-box">⚡ Готові рішення</div>
          <div class="yz-box">🔋 Підбір під задачу</div>
          <div class="yz-box">💬 Швидка відповідь</div>
        </div>
      </div>`;

    /* Знаходимо секцію "Хіти продажу" і вставляємо hero ПЕРЕД нею */
    const promo = document.querySelector('section.promo, .promo-container, .catalogTabs');
    const main  = document.querySelector('main');
    if (promo && promo.closest('section')) {
      promo.closest('section').before(hero);
    } else if (main) {
      /* якщо не знайшли — просто prepend */
      main.prepend(hero);
    }
  }

  /* ===== МОДАЛЬНЕ ВІКНО ===== */
  const modal      = document.getElementById('yzModal');
  const modalClose = document.getElementById('yzModalClose');
  const floatBtn   = document.getElementById('yzContactBtn');
  const heroConsult = document.getElementById('yzHeroConsult');

  function openModal()  { modal && modal.classList.add('active'); }
  function closeModal() { modal && modal.classList.remove('active'); }

  if (floatBtn)    floatBtn.addEventListener('click', openModal);
  if (modalClose)  modalClose.addEventListener('click', closeModal);

  /* кнопка "Консультація" в hero — делегуємо, бо hero може ще не існувати */
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'yzHeroConsult') openModal();
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ===== ПІДМЕНЮ — виправлення виходу за правий край ===== */
  function fixSubmenus() {
    document.querySelectorAll('.productsMenu-submenu').forEach(function(sub) {
      const rect = sub.getBoundingClientRect();
      if (rect.right > window.innerWidth - 10) {
        sub.classList.add('yz-flip-left');
      }
    });
  }

  /* Запускаємо при hover на кожен пункт меню */
  document.querySelectorAll('.products-menu__item').forEach(function(item) {
    item.addEventListener('mouseenter', function() {
      setTimeout(fixSubmenus, 50);
    });
  });

  /* ===== ПЛАВНА ПОЯВА ===== */
  const animEls = document.querySelectorAll('section, .yz-hero');
  animEls.forEach(el => el.classList.add('yz-animate'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
  }, { threshold: 0.12 });
  animEls.forEach(el => observer.observe(el));

});
