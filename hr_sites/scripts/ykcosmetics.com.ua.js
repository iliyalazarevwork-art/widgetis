// source: https://ykcosmetics.com.ua/
// extracted: 2026-05-07T21:23:14.543Z
// scripts: 7

// === script #1 (length=3825) ===
(function () {
  const KEY = 'yk_cart_remind_hide_until';
  const DAYS = 1;
  const ID = 'yk-cart-reminder';

  function isMobile() {
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  function getLang() {
    const htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    const path = (location.pathname || '').toLowerCase();
    if (htmlLang.startsWith('ru') || path.startsWith('/ru')) return 'ru';
    return 'ua';
  }

  function copy(total) {
    if (getLang() === 'ru') {
      return {
        text: `🛒 В корзине есть товары (сумма: ${total} грн). Оформим заказ?`,
        btn: 'Перейти в корзину'
      };
    }
    return {
      text: `🛒 У кошику є товари (сума: ${total} грн). Оформимо замовлення?`,
      btn: 'Перейти в кошик'
    };
  }

  function now() { return Date.now(); }
  function daysMs(d) { return d * 24 * 60 * 60 * 1000; }

  function canShow() {
    const until = parseInt(localStorage.getItem(KEY) || '0', 10);
    return now() > until;
  }

  function hideForDays(d) {
    localStorage.setItem(KEY, String(now() + daysMs(d)));
  }

  function parseUAH(text) {
    const n = (text || '').replace(/[^\d]/g, '');
    return n ? parseInt(n, 10) : 0;
  }

  function getTotal() {
    const el = document.querySelector('.j-total-sum');
    if (!el) return 0;
    return parseUAH(el.textContent);
  }

  function showReminder(total) {
    if (document.getElementById(ID)) return;

    const c = copy(total);

    const box = document.createElement('div');
    box.id = ID;
    box.style.cssText =
      'position:fixed;left:12px;right:12px;bottom:12px;z-index:999999;' +
      'background:rgba(0,0,0,.9);color:#fff;border-radius:12px;' +
      'padding:10px 12px;box-shadow:0 12px 30px rgba(0,0,0,.25);' +
      'font-size:13px;line-height:1.3;display:flex;gap:10px;align-items:center;';

    const txt = document.createElement('div');
    txt.style.cssText = 'flex:1;';
    txt.textContent = c.text;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText =
      'background:#fff;color:#111;border:0;border-radius:10px;' +
      'padding:8px 10px;font-weight:800;font-size:12px;white-space:nowrap;';
    btn.textContent = c.btn;

    const close = document.createElement('button');
    close.type = 'button';
    close.style.cssText =
      'background:transparent;border:0;color:#bbb;font-size:18px;line-height:1;padding:0 4px;';
    close.textContent = '×';

    function destroy() { box.remove(); }

    btn.addEventListener('click', () => {
      hideForDays(DAYS);
      destroy();

      const cartBtn =
        document.querySelector('[href*="/cart"]') ||
        document.querySelector('.j-cart, .header__cart, [data-cart], [class*="cart"] a');

      if (cartBtn && cartBtn.click) cartBtn.click();
      else location.href = '/cart';
    });

    close.addEventListener('click', () => {
      hideForDays(DAYS);
      destroy();
    });

    box.appendChild(txt);
    box.appendChild(btn);
    box.appendChild(close);

    document.body.appendChild(box);

    setTimeout(() => {
      if (document.getElementById(ID)) destroy();
    }, 8000);
  }

  window.addEventListener('load', () => {
    if (!isMobile()) return;
    if (!canShow()) return;

    let idleTimer = null;

    function arm() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        const total = getTotal();
        if (total > 0) showReminder(total);
      }, 25000);
    }

    ['scroll','click','touchstart','keydown'].forEach(evt => {
      document.addEventListener(evt, arm, { passive: true, capture: true });
    });

    arm();
  });
})();

// === script #2 (length=10041) ===
(() => {
  // === ПЕРІОД РОБОТИ: 5 грудня -> 31 січня ===
  const START = { month: 12, day: 5 };
  const END   = { month: 1,  day: 31 };

  // === СНІГ ===
  const FLAKES_DESKTOP = 75;        // сніжинок на ПК
  const FLAKES_MOBILE  = 45;        // сніжинок на мобільних (легше)
  const MOBILE_MAX_W = 768;

  // === СНІГОВИК ===
  const SNOWMAN_DELAY_MS = 2 * 60 * 1000; // показати після 2 хвилин на сайті
  const SNOWMAN_SHOW_MS  = 7000;          // скільки "виглядає" (мс)
  const SNOWMAN_REPEAT_MS = 28000;        // як часто повторювати (мс) після першого показу
  const SNOWMAN_SIDE = 'right';           // 'right' або 'left'

  // Якщо користувач просить зменшити рухи в ОС — не запускаємо анімації
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  function inSeason(d = new Date()) {
    const m = d.getMonth() + 1; // 1..12
    const day = d.getDate();
    if (m === 12) return day >= START.day;
    if (m === 1)  return day <= END.day;
    return false;
  }
  if (!inSeason()) return;

  const isMobile = window.matchMedia && window.matchMedia(`(max-width: ${MOBILE_MAX_W}px)`).matches;
  const flakeCount = isMobile ? FLAKES_MOBILE : FLAKES_DESKTOP;

  // === CSS ===
  const style = document.createElement('style');
  style.textContent = `
    #yk-snow-layer{
      position:fixed; inset:0; pointer-events:none;
      z-index:999900; overflow:hidden;
    }

    .yk-flake{
      position:absolute;
      top:-12vh;
      opacity:var(--o, .9);
      transform: translate3d(var(--x, 0), -12vh, 0) rotate(var(--r, 0deg));
      font-size: var(--s, 14px);
      will-change: transform;
      animation:
        yk-fall var(--d, 12s) linear var(--delay, 0s) infinite,
        yk-drift var(--d2, 4s) ease-in-out var(--delay, 0s) infinite;
      filter: drop-shadow(0 1px 0 rgba(0,0,0,.08));
    }

    @keyframes yk-fall{
      to { transform: translate3d(var(--x, 0), 110vh, 0) rotate(calc(var(--r, 0deg) + 180deg)); }
    }
    @keyframes yk-drift{
      0%,100% { margin-left: 0px; }
      50%     { margin-left: var(--dx, 18px); }
    }

    /* Сніговик: ховається збоку, потім "виглядає" */
    #yk-peek-snowman{
      position: fixed;
      top: 50%;
      transform: translate3d(0, -50%, 0);
      width: 120px;
      height: 160px;
      z-index: 999901;
      pointer-events: none;
      will-change: transform;
      filter: drop-shadow(0 12px 25px rgba(0,0,0,.25));
      opacity: 0;
    }

    /* Початкове положення (захований збоку) */
    #yk-peek-snowman.yk-side-right{
      right: -120px;
    }
    #yk-peek-snowman.yk-side-left{
      left: -120px;
    }

    /* Анімація "виглянув і сховався" */
    #yk-peek-snowman.yk-peek.yk-side-right{
      animation: yk-peek-right 1.1s ease-out forwards;
      opacity: 1;
    }
    #yk-peek-snowman.yk-hide.yk-side-right{
      animation: yk-hide-right 1.0s ease-in forwards;
      opacity: 1;
    }

    #yk-peek-snowman.yk-peek.yk-side-left{
      animation: yk-peek-left 1.1s ease-out forwards;
      opacity: 1;
    }
    #yk-peek-snowman.yk-hide.yk-side-left{
      animation: yk-hide-left 1.0s ease-in forwards;
      opacity: 1;
    }

    @keyframes yk-peek-right{
      from { transform: translate3d(0, -50%, 0); }
      to   { transform: translate3d(-95px, -50%, 0); } /* виїхав у кадр */
    }
    @keyframes yk-hide-right{
      from { transform: translate3d(-95px, -50%, 0); }
      to   { transform: translate3d(0, -50%, 0); }     /* назад */
    }

    @keyframes yk-peek-left{
      from { transform: translate3d(0, -50%, 0); }
      to   { transform: translate3d(95px, -50%, 0); }
    }
    @keyframes yk-hide-left{
      from { transform: translate3d(95px, -50%, 0); }
      to   { transform: translate3d(0, -50%, 0); }
    }

    @media (max-width: 480px){
      #yk-peek-snowman{ width: 95px; height: 130px; }
      #yk-peek-snowman.yk-side-right{ right: -95px; }
      #yk-peek-snowman.yk-side-left{ left: -95px; }
      @keyframes yk-peek-right{ to { transform: translate3d(-75px, -50%, 0); } }
      @keyframes yk-hide-right{ from { transform: translate3d(-75px, -50%, 0); } }
      @keyframes yk-peek-left{ to { transform: translate3d(75px, -50%, 0); } }
      @keyframes yk-hide-left{ from { transform: translate3d(75px, -50%, 0); } }
    }
  `;
  document.head.appendChild(style);

  // === Шар зі снігом ===
  const layer = document.createElement('div');
  layer.id = 'yk-snow-layer';
  document.body.appendChild(layer);

  // === 3 моделі сніжинок (SVG) ===
  const snowSvgs = [
    // Модель 1 (класична + центр)
    `<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true">
      <path fill="white" d="M31 2h2v60h-2z"/><path fill="white" d="M2 31h60v2H2z"/>
      <path fill="white" d="M9.2 10.6l1.4-1.4 43.2 43.2-1.4 1.4z"/>
      <path fill="white" d="M53.4 10.6l1.4 1.4L11.6 55.2l-1.4-1.4z"/>
      <circle cx="32" cy="32" r="3" fill="white"/>
    </svg>`,
    // Модель 2 (тонша, з “гілочками”)
    `<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true">
      <path fill="white" d="M31 2h2v60h-2z"/>
      <path fill="white" d="M12 18l1.4-1.4L32 35.2 50.6 16.6 52 18 33.4 36.6 52 55.2 50.6 56.6 32 38 13.4 56.6 12 55.2 30.6 36.6z"/>
      <path fill="white" d="M2 31h60v2H2z"/>
      <path fill="white" d="M24 10l2 0 6 10 6-10 2 0-7 12 7 12-2 0-6-10-6 10-2 0 7-12z" opacity=".9"/>
    </svg>`,
    // Модель 3 (з маленькими “крапками” по краях)
    `<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true">
      <path fill="white" d="M31 2h2v60h-2z"/><path fill="white" d="M2 31h60v2H2z"/>
      <path fill="white" d="M9.2 10.6l1.4-1.4 43.2 43.2-1.4 1.4z"/>
      <path fill="white" d="M53.4 10.6l1.4 1.4L11.6 55.2l-1.4-1.4z"/>
      <circle cx="32" cy="8" r="2.2" fill="white"/><circle cx="32" cy="56" r="2.2" fill="white"/>
      <circle cx="8" cy="32" r="2.2" fill="white"/><circle cx="56" cy="32" r="2.2" fill="white"/>
      <circle cx="16" cy="16" r="1.8" fill="white"/><circle cx="48" cy="48" r="1.8" fill="white"/>
      <circle cx="48" cy="16" r="1.8" fill="white"/><circle cx="16" cy="48" r="1.8" fill="white"/>
      <circle cx="32" cy="32" r="2.6" fill="white"/>
    </svg>`
  ];

  function rand(min, max){ return Math.random() * (max - min) + min; }
  function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

  // Генерація сніжинок (CSS-анімації, без важких циклів)
  for (let i = 0; i < flakeCount; i++) {
    const f = document.createElement('div');
    f.className = 'yk-flake';
    f.innerHTML = pick(snowSvgs);

    const x = rand(0, 100).toFixed(2) + 'vw';
    const size = rand(10, 22).toFixed(1) + 'px';
    const opacity = rand(0.55, 0.95).toFixed(2);
    const dur = rand(10, 18).toFixed(2) + 's';
    const dur2 = rand(3, 6).toFixed(2) + 's';
    const delay = rand(0, 12).toFixed(2) + 's';
    const rot = rand(-60, 60).toFixed(1) + 'deg';
    const dx = rand(-22, 22).toFixed(1) + 'px';

    f.style.setProperty('--x', x);
    f.style.setProperty('--s', size);
    f.style.setProperty('--o', opacity);
    f.style.setProperty('--d', dur);
    f.style.setProperty('--d2', dur2);
    f.style.setProperty('--delay', delay);
    f.style.setProperty('--r', rot);
    f.style.setProperty('--dx', dx);

    layer.appendChild(f);
  }

  // === Сніговик (нейтральний, без копіювання персонажів) ===
  const snowman = document.createElement('div');
  snowman.id = 'yk-peek-snowman';
  snowman.classList.add(SNOWMAN_SIDE === 'left' ? 'yk-side-left' : 'yk-side-right');
  snowman.innerHTML = `
    <svg viewBox="0 0 120 160" width="100%" height="100%" aria-hidden="true">
      <circle cx="60" cy="118" r="38" fill="#ffffff"/>
      <circle cx="60" cy="70" r="28" fill="#ffffff"/>
      <circle cx="60" cy="32" r="20" fill="#ffffff"/>
      <circle cx="60" cy="118" r="38" fill="none" stroke="rgba(0,0,0,.10)" stroke-width="3"/>
      <circle cx="60" cy="70" r="28" fill="none" stroke="rgba(0,0,0,.10)" stroke-width="3"/>
      <circle cx="60" cy="32" r="20" fill="none" stroke="rgba(0,0,0,.10)" stroke-width="3"/>
      <circle cx="53" cy="28" r="2.8" fill="#111"/>
      <circle cx="67" cy="28" r="2.8" fill="#111"/>
      <path d="M60 33 L88 38 L60 41 Z" fill="#ff8a00" stroke="rgba(0,0,0,.10)" stroke-width="2" />
      <path d="M52 40 C58 46, 62 46, 68 40" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="60" cy="63" r="3" fill="#111"/>
      <circle cx="60" cy="74" r="3" fill="#111"/>
      <circle cx="60" cy="88" r="3" fill="#111"/>
      <path d="M35 55 C45 62, 75 62, 85 55" fill="none" stroke="#e11d48" stroke-width="10" stroke-linecap="round"/>
      <path d="M78 56 C90 70, 92 85, 84 98" fill="none" stroke="#e11d48" stroke-width="10" stroke-linecap="round"/>
    </svg>
  `;
  document.body.appendChild(snowman);

  // === Логіка "після 2 хвилин" і далі періодично ===
  let snowmanTimer = null;

  function peekOnce() {
    // запобігаємо “накладанню” анімацій
    snowman.classList.remove('yk-hide');
    snowman.classList.add('yk-peek');

    setTimeout(() => {
      snowman.classList.remove('yk-peek');
      snowman.classList.add('yk-hide');
      // після ховання прибираємо клас, щоб наступний раз коректно стартувало
      setTimeout(() => snowman.classList.remove('yk-hide'), 1100);
    }, SNOWMAN_SHOW_MS);
  }

  // Перший показ після 2 хвилин реального перебування (не в фоні)
  let visibleSeconds = 0;
  const tick = setInterval(() => {
    if (document.visibilityState === 'visible') visibleSeconds++;
    if (visibleSeconds >= Math.round(SNOWMAN_DELAY_MS / 1000)) {
      clearInterval(tick);

      // Перший раз
      peekOnce();

      // Далі — повторюємо
      snowmanTimer = setInterval(peekOnce, SNOWMAN_REPEAT_MS);
    }
  }, 1000);

})();

// === script #3 (length=7186) ===
(function () {
  function detectLang() {
    const htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase().trim();
    const path = (location.pathname || '').toLowerCase();

    if (htmlLang.startsWith('uk') || htmlLang.startsWith('ua')) return 'ua';
    if (htmlLang.startsWith('ru')) return 'ru';

    if (path === '/ru' || path.startsWith('/ru/')) return 'ru';
    if (path === '/ua' || path.startsWith('/ua/') || path === '/uk' || path.startsWith('/uk/')) return 'ua';

    return 'ua';
  }

  const lang = detectLang();

  const TEXTS = {
    ua: {
      delivery: "🚚 Безкоштовна доставка від 1900 грн по Україні — замовляйте вигідно!",
      shipping: "📦 Відправка Ваших замовлень: Нова Пошта — кожного дня; Укрпошта — 1–2 робочих дні."
    },
    ru: {
      delivery: "🚚 Бесплатная доставка от 1900 грн по Украине — заказывайте выгодно!",
      shipping: "📦 Отправка заказов: Новая Почта — ежедневно; Укрпочта — 1–2 рабочих дня."
    }
  };

  const BAR_ID = "ykTopBarV5";
  const SPACER_ID = "ykTopBarSpacerV5";
  let bar = document.getElementById(BAR_ID);
  if (bar) return;

  function isMobileNow() {
    return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  }

  function getHeaderEl() {
    return document.querySelector("header") || document.querySelector("#header") || document.querySelector(".header") || null;
  }

  function isMenuOpenHeuristic() {
    const b = document.body;
    const h = document.documentElement;

    const cls = (b.className || "") + " " + (h.className || "");
    const re = /(menu|nav|drawer|offcanvas|mm|burger).*(open|active)|\b(open|active).*(menu|nav|drawer|offcanvas|mm|burger)\b/i;
    if (re.test(cls)) return true;

    const bo = (b.style.overflow || "").toLowerCase();
    const ho = (h.style.overflow || "").toLowerCase();
    if (bo === "hidden" || ho === "hidden") return true;

    return false;
  }

  function ensureSpacer() {
    let sp = document.getElementById(SPACER_ID);
    if (sp) return sp;

    sp = document.createElement("div");
    sp.id = SPACER_ID;
    sp.style.width = "100%";
    sp.style.height = "0px";
    sp.style.display = "block";

    const header = getHeaderEl();
    if (header && header.parentNode) {
      if (header.nextSibling) header.parentNode.insertBefore(sp, header.nextSibling);
      else header.parentNode.appendChild(sp);
    } else {
      document.body.prepend(sp);
    }
    return sp;
  }

  function setSpacerHeight(px) {
    const sp = ensureSpacer();
    sp.style.height = Math.max(0, px) + "px";
  }

  const style = document.createElement("style");
  style.textContent = `
    #${BAR_ID}{
      width:100%;
      background:#d989a3;
      color:#fff;
      box-sizing:border-box;
      overflow:hidden;
      font-family:Arial, sans-serif;
      font-weight:600;
      z-index:50;
    }
    #${BAR_ID} .yk-wrap{
      display:flex;
      align-items:center;
      gap:12px;
      padding:6px 12px;
      box-sizing:border-box;
    }
    #${BAR_ID} .yk-marquee{
      position:relative;
      flex:1 1 auto;
      min-width:0;
      overflow:hidden;
      white-space:nowrap;
      font-size:14px;
    }
    #${BAR_ID} .yk-runner{
      display:inline-block;
      white-space:nowrap;
      will-change:transform;
    }
    @media (max-width:768px){
      #${BAR_ID} .yk-wrap{ padding:6px 10px; gap:10px; }
      #${BAR_ID} .yk-marquee{ font-size:13px; }
    }
  `;
  document.head.appendChild(style);

  bar = document.createElement("div");
  bar.id = BAR_ID;

  const wrap = document.createElement("div");
  wrap.className = "yk-wrap";

  const marquee = document.createElement("div");
  marquee.className = "yk-marquee";

  const runner = document.createElement("div");
  runner.className = "yk-runner";

  const GAP = " \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 ";

  const one =
    TEXTS[lang].delivery + GAP +
    TEXTS[lang].shipping + GAP;

  runner.textContent = one + one;

  marquee.appendChild(runner);
  wrap.appendChild(marquee);
  bar.appendChild(wrap);

  let layoutMode = null;
  function applyLayout() {
    const mobile = isMobileNow();
    const header = getHeaderEl();

    const newMode = mobile ? "mobile" : "desktop";
    if (layoutMode !== newMode) {
      layoutMode = newMode;
      bar.style.position = "";
      bar.style.top = "";
      bar.style.left = "";
    }

    if (!mobile) {
      setSpacerHeight(0);

      bar.style.display = "";
      bar.style.position = "sticky";
      bar.style.top = "0";

      if (!bar.parentNode || (header && bar.nextSibling !== header)) {
        if (header && header.parentNode) header.parentNode.insertBefore(bar, header);
        else document.body.prepend(bar);
      }
    } else {
      const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 56;

      bar.style.position = "fixed";
      bar.style.left = "0";
      bar.style.top = headerH + "px";
      if (!bar.parentNode) document.body.appendChild(bar);

      const barH = Math.ceil(bar.getBoundingClientRect().height) || 40;
      setSpacerHeight(barH);
    }
  }

  function syncMenuState() {
    if (!isMobileNow()) {
      bar.style.display = "";
      setSpacerHeight(0);
      return;
    }
    const opened = isMenuOpenHeuristic();
    bar.style.display = opened ? "none" : "";
    setSpacerHeight(opened ? 0 : (Math.ceil(bar.getBoundingClientRect().height) || 40));
  }

  document.body.prepend(bar);
  ensureSpacer();
  applyLayout();
  syncMenuState();

  const speedPxPerSecDesktop = 40;
  const speedPxPerSecMobile = 30;

  let rafId = null;
  let startTs = null;

  function tick(ts) {
    if (!startTs) startTs = ts;
    const dt = (ts - startTs) / 1000;
    const half = Math.floor(runner.scrollWidth / 2);
    const speed = isMobileNow() ? speedPxPerSecMobile : speedPxPerSecDesktop;

    let x = -(dt * speed);
    if (half > 0) x = x % half;

    runner.style.transform = "translateX(" + x + "px)";
    rafId = requestAnimationFrame(tick);
  }

  function restartAnim() {
    if (rafId) cancelAnimationFrame(rafId);
    startTs = null;
    runner.style.transform = "translateX(0px)";
    rafId = requestAnimationFrame(tick);
  }

  setTimeout(restartAnim, 50);

  let rt = null;
  window.addEventListener("resize", function () {
    if (rt) clearTimeout(rt);
    rt = setTimeout(function () {
      applyLayout();
      syncMenuState();
      restartAnim();
    }, 120);
  });

  const mo = new MutationObserver(function () {
    applyLayout();
    syncMenuState();
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
  mo.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });

  document.addEventListener("click", function () {
    setTimeout(syncMenuState, 30);
  }, true);

})();

// === script #4 (length=4260) ===
(function () {

  // ====== ДАТА ПОКАЗУ (ЩОРІЧНО) ======
  const today = new Date();
  const year = today.getFullYear();

  const start = new Date(year, 1, 22); // 22 лютого (місяці з 0)
  const end   = new Date(year, 2, 8, 23, 59, 59); // 8 березня включно

  if (today < start || today > end) {
    return; // поза періодом — нічого не показуємо
  }

  // ====== LANG DETECT ======
  function detectLang() {
    const htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase().trim();
    const path = (location.pathname || "").toLowerCase();
    if (htmlLang.startsWith("ru") || path === "/ru" || path.startsWith("/ru/")) return "ru";
    return "ua";
  }

  const lang = detectLang();

  const TEXT = {
    ua: "🎁 Подарунки на 8 березня до кожного замовлення",
    ru: "🎁 Подарки к 8 марта к каждому заказу"
  }[lang];

  const STORAGE_KEY = "yk_tulip_8march_hide_until";
  const HIDE_DAYS = 7;
  const SHOW_AFTER_MS = 4000;
  const AUTO_HIDE_MS = 12000;
  const REPEAT_EVERY_MS = 60000;

  function now() { return Date.now(); }
  function daysMs(d) { return d * 24 * 60 * 60 * 1000; }
  function canShow() {
    const until = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    return now() > until;
  }
  function hideForDays(d) {
    localStorage.setItem(STORAGE_KEY, String(now() + daysMs(d)));
  }

  if (!canShow()) return;

  const ID = "ykTulip8March";
  if (document.getElementById(ID)) return;

  const style = document.createElement("style");
  style.textContent = `
    #${ID}{
      position: fixed;
      left: 0;
      top: 50%;
      transform: translate(-110%, -50%);
      z-index: 9990;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: transform 450ms cubic-bezier(.2,.9,.2,1);
    }
    #${ID}.show{
      transform: translate(10px, -50%);
    }
    #${ID} .yk-tulip{
      width:64px;height:64px;
      display:flex;align-items:center;justify-content:center;
      background:rgba(255,255,255,.18);
      border-radius:18px;
      backdrop-filter: blur(6px);
      box-shadow:0 10px 24px rgba(0,0,0,.18);
      cursor:pointer;
    }
    #${ID} .yk-bubble{
      position:relative;
      max-width:260px;
      background:#fff;
      color:#1a1a1a;
      border-radius:16px;
      padding:10px 12px;
      box-shadow:0 10px 24px rgba(0,0,0,.18);
      font-family:Arial,sans-serif;
      font-weight:700;
      font-size:13px;
      line-height:1.2;
    }
    #${ID} .yk-bubble:before{
      content:"";
      position:absolute;
      left:-8px;
      top:18px;
      border-top:8px solid transparent;
      border-bottom:8px solid transparent;
      border-right:8px solid #fff;
    }
    #${ID} .yk-close{
      position:absolute;
      top:-8px;
      right:-8px;
      width:22px;height:22px;
      border-radius:50%;
      background:#2b2b2b;
      color:#fff;
      border:none;
      cursor:pointer;
      font-size:14px;
    }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.id = ID;

  const tulip = document.createElement("div");
  tulip.className = "yk-tulip";
  tulip.innerHTML = "🌷";

  const bubble = document.createElement("div");
  bubble.className = "yk-bubble";
  bubble.innerHTML = `
    <button class="yk-close">×</button>
    <div>${TEXT}</div>
  `;

  wrap.appendChild(tulip);
  wrap.appendChild(bubble);
  document.body.appendChild(wrap);

  let autoTimer = null;
  let repeatTimer = null;

  function show() {
    wrap.classList.add("show");
    if (AUTO_HIDE_MS > 0) {
      clearTimeout(autoTimer);
      autoTimer = setTimeout(hide, AUTO_HIDE_MS);
    }
  }

  function hide() {
    wrap.classList.remove("show");
    if (REPEAT_EVERY_MS > 0 && AUTO_HIDE_MS > 0) {
      clearTimeout(repeatTimer);
      repeatTimer = setTimeout(show, REPEAT_EVERY_MS);
    }
  }

  bubble.querySelector(".yk-close").addEventListener("click", function () {
    hideForDays(HIDE_DAYS);
    wrap.remove();
  });

  tulip.addEventListener("click", function () {
    hideForDays(HIDE_DAYS);
    wrap.remove();
  });

  setTimeout(show, SHOW_AFTER_MS);

})();

// === script #5 (length=10775) ===
(function () {
  const FREE_FROM = 1900;

  const SUMMARY_SELECTORS = ['.cart-summary', '.cart__summary'];
  const TOTAL_SEL = '.j-total-sum';

  const CLOSE_THRESHOLD = 300;
  const HOT_THRESHOLD = 150;

  function injectStyles() {
    if (document.getElementById('yk-free-ship-styles')) return;

    const style = document.createElement('style');
    style.id = 'yk-free-ship-styles';
    style.textContent = `
      .yk-free-ship{
        margin-top:14px;
        padding:16px;
        border:1px solid #ead7df;
        border-radius:18px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,248,251,0.96) 100%);
        box-shadow:
          0 10px 30px rgba(33, 17, 24, 0.06),
          inset 0 1px 0 rgba(255,255,255,0.7);
        backdrop-filter: blur(4px);
        transition:
          border-color .25s ease,
          box-shadow .25s ease,
          background .25s ease,
          transform .25s ease;
      }

      .yk-free-ship__top{
        display:flex;
        align-items:flex-start;
        gap:12px;
        margin-bottom:12px;
      }

      .yk-free-ship__icon{
        width:38px;
        height:38px;
        min-width:38px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:12px;
        background:linear-gradient(180deg,#ffffff 0%, #fdf7fa 100%);
        border:1px solid rgba(222, 196, 206, 0.75);
        box-shadow:0 4px 14px rgba(33,17,24,.06);
        font-size:18px;
      }

      .yk-free-ship__content{
        flex:1 1 auto;
        min-width:0;
      }

      .yk-free-ship__title{
        font-size:13px;
        line-height:1.2;
        font-weight:800;
        letter-spacing:.04em;
        text-transform:uppercase;
        color:#8e5f73;
        margin-bottom:5px;
      }

      .yk-free-ship__text{
        font-size:14px;
        line-height:1.45;
        font-weight:600;
        color:#2f2328;
      }

      .yk-free-ship__badge{
        flex:0 0 auto;
        padding:7px 11px;
        border-radius:999px;
        font-size:10px;
        font-weight:800;
        letter-spacing:.08em;
        text-transform:uppercase;
        background:linear-gradient(180deg,#f8eef2 0%, #f3e3ea 100%);
        color:#9a5f76;
        border:1px solid rgba(222, 196, 206, 0.85);
        white-space:nowrap;
      }

      .yk-free-ship__bar{
        position:relative;
        width:100%;
        height:8px;
        border-radius:999px;
        background:linear-gradient(180deg,#f4e9ee 0%, #efe1e7 100%);
        overflow:hidden;
        box-shadow: inset 0 1px 2px rgba(78, 34, 52, 0.06);
      }

      .yk-free-ship__fill{
        height:100%;
        width:0;
        border-radius:999px;
        background:linear-gradient(90deg,#cc8fa6 0%, #e2adc0 100%);
        box-shadow:0 0 10px rgba(204,143,166,.20);
        transition:width .4s ease, background .25s ease, box-shadow .25s ease;
      }

      .yk-free-ship.is-close{
        border-color:#e3cfad;
        background:
          linear-gradient(180deg, rgba(255,253,247,0.98) 0%, rgba(255,249,236,0.96) 100%);
        box-shadow:
          0 10px 30px rgba(120, 88, 28, 0.07),
          inset 0 1px 0 rgba(255,255,255,0.75);
      }

      .yk-free-ship.is-close .yk-free-ship__icon{
        border-color:rgba(226, 204, 154, 0.95);
        background:linear-gradient(180deg,#fffdfa 0%, #fff7e8 100%);
      }

      .yk-free-ship.is-close .yk-free-ship__title{
        color:#9a7a3f;
      }

      .yk-free-ship.is-close .yk-free-ship__badge{
        background:linear-gradient(180deg,#fbf3df 0%, #f5e8c6 100%);
        color:#94703a;
        border-color:rgba(226, 204, 154, 0.95);
      }

      .yk-free-ship.is-close .yk-free-ship__bar{
        background:linear-gradient(180deg,#f5ecda 0%, #efe2c8 100%);
      }

      .yk-free-ship.is-close .yk-free-ship__fill{
        background:linear-gradient(90deg,#d6ab62 0%, #efd089 100%);
        box-shadow:0 0 12px rgba(214,171,98,.20);
      }

      .yk-free-ship.is-hot{
        border-color:#d9b16c;
        background:
          linear-gradient(180deg, rgba(255,251,243,0.98) 0%, rgba(255,245,226,0.97) 100%);
        box-shadow:
          0 0 0 1px rgba(217,177,108,.10),
          0 14px 34px rgba(163, 114, 25, 0.12),
          inset 0 1px 0 rgba(255,255,255,.78);
      }

      .yk-free-ship.is-hot .yk-free-ship__icon{
        border-color:rgba(217,177,108,.75);
        background:linear-gradient(180deg,#fffdfa 0%, #fff5e3 100%);
      }

      .yk-free-ship.is-hot .yk-free-ship__title{
        color:#8f6530;
      }

      .yk-free-ship.is-hot .yk-free-ship__badge{
        background:linear-gradient(180deg,#f8e6be 0%, #f3d79c 100%);
        color:#7b5318;
        border-color:rgba(217,177,108,.85);
      }

      .yk-free-ship.is-hot .yk-free-ship__bar{
        background:linear-gradient(180deg,#f3e5c8 0%, #ecd9b3 100%);
      }

      .yk-free-ship.is-hot .yk-free-ship__fill{
        background:linear-gradient(90deg,#d59a37 0%, #edc16a 100%);
        box-shadow:0 0 14px rgba(213,154,55,.22);
      }

      .yk-free-ship.is-free{
        border-color:#bfdcc8;
        background:
          linear-gradient(180deg, rgba(248,255,250,0.98) 0%, rgba(239,250,243,0.97) 100%);
        box-shadow:
          0 0 0 1px rgba(120, 179, 142, 0.10),
          0 14px 34px rgba(59, 122, 79, 0.10),
          inset 0 1px 0 rgba(255,255,255,.78);
      }

      .yk-free-ship.is-free .yk-free-ship__icon{
        border-color:rgba(175, 214, 188, 0.95);
        background:linear-gradient(180deg,#ffffff 0%, #f2fbf5 100%);
      }

      .yk-free-ship.is-free .yk-free-ship__title{
        color:#4f8761;
      }

      .yk-free-ship.is-free .yk-free-ship__badge{
        background:linear-gradient(180deg,#e8f7ed 0%, #dcefe3 100%);
        color:#3f7b53;
        border-color:rgba(175, 214, 188, 0.95);
      }

      .yk-free-ship.is-free .yk-free-ship__bar{
        background:linear-gradient(180deg,#e1f1e6 0%, #d7eadf 100%);
      }

      .yk-free-ship.is-free .yk-free-ship__fill{
        background:linear-gradient(90deg,#67a97b 0%, #98d1a8 100%);
        box-shadow:0 0 16px rgba(103,169,123,.18);
      }

      @media (max-width: 768px){
        .yk-free-ship{
          margin-top:12px;
          padding:14px;
          border-radius:16px;
        }
        .yk-free-ship__top{
          gap:10px;
          margin-bottom:10px;
        }
        .yk-free-ship__icon{
          width:34px;
          height:34px;
          min-width:34px;
          border-radius:11px;
          font-size:17px;
        }
        .yk-free-ship__title{
          font-size:12px;
        }
        .yk-free-ship__text{
          font-size:13px;
          line-height:1.4;
        }
        .yk-free-ship__badge{
          font-size:9px;
          padding:6px 9px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function parseMoney(text) {
    if (!text) return 0;
    const cleaned = text
      .replace(/\s|\u00A0/g, '')
      .replace(/грн|uah|₴/gi, '')
      .replace(',', '.')
      .replace(/[^0-9.]/g, '');
    const v = parseFloat(cleaned);
    return isNaN(v) ? 0 : v;
  }

  function findSummaryEl() {
    for (const sel of SUMMARY_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function ensureWidget(summaryEl) {
    let el = summaryEl.querySelector('#yk-free-ship-in-cart');
    if (!el) {
      el = document.createElement('div');
      el.id = 'yk-free-ship-in-cart';
      el.className = 'yk-free-ship';
      el.innerHTML = `
        <div class="yk-free-ship__top">
          <div class="yk-free-ship__icon" aria-hidden="true">🚚</div>
          <div class="yk-free-ship__content">
            <div class="yk-free-ship__title">Доставка</div>
            <div class="yk-free-ship__text"></div>
          </div>
          <div class="yk-free-ship__badge" aria-hidden="true"></div>
        </div>
        <div class="yk-free-ship__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="yk-free-ship__fill"></div>
        </div>
      `;
      summaryEl.appendChild(el);
    }
    return el;
  }

  function render() {
    const totalEl = document.querySelector(TOTAL_SEL);
    const summaryEl = findSummaryEl();
    if (!totalEl || !summaryEl) return;

    const total = parseMoney(totalEl.textContent);
    const left = Math.max(0, FREE_FROM - total);
    const pct = Math.max(0, Math.min(100, (total / FREE_FROM) * 100));

    const widget = ensureWidget(summaryEl);
    const textEl = widget.querySelector('.yk-free-ship__text');
    const fillEl = widget.querySelector('.yk-free-ship__fill');
    const badgeEl = widget.querySelector('.yk-free-ship__badge');
    const iconEl = widget.querySelector('.yk-free-ship__icon');
    const barEl = widget.querySelector('.yk-free-ship__bar');
    const titleEl = widget.querySelector('.yk-free-ship__title');

    fillEl.style.width = pct + '%';
    barEl.setAttribute('aria-valuenow', String(Math.round(pct)));

    widget.classList.remove('is-free', 'is-close', 'is-hot');
    badgeEl.textContent = '';

    if (left <= 0) {
      widget.classList.add('is-free');
      iconEl.textContent = '🎁';
      titleEl.textContent = 'Безкоштовна доставка';
      badgeEl.textContent = 'Активна';
      textEl.textContent = 'Ви вже отримали безкоштовну доставку до цього замовлення';
      fillEl.style.width = '100%';
    } else {
      iconEl.textContent = '🚚';
      titleEl.textContent = 'Доставка';

      if (left <= CLOSE_THRESHOLD) {
        widget.classList.add('is-close');
        badgeEl.textContent = 'Майже';
        textEl.textContent = `Додайте товарів ще на ${Math.ceil(left)} грн — і доставка буде безкоштовною`;
      } else {
        badgeEl.textContent = 'До free';
        textEl.textContent = `До безкоштовної доставки залишилось ${Math.ceil(left)} грн`;
      }

      if (left <= HOT_THRESHOLD) {
        widget.classList.add('is-hot');
        badgeEl.textContent = 'Зараз';
      }
    }
  }

  injectStyles();
  render();

  let t;
  const debounced = () => {
    clearTimeout(t);
    t = setTimeout(render, 80);
  };

  const obs = new MutationObserver(debounced);
  obs.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('click', (e) => {
    if (e.target && e.target.closest('.cart')) debounced();
  });
})();

// === script #6 (length=10102) ===
(function () {
  var started = false;

  function norm(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  function isBrandsPage() {
    var path = location.pathname.replace(/\/+$/, '');
    return path === '/brands' || path === '/ru/brands';
  }

  function getLabels() {
    var path = location.pathname.replace(/\/+$/, '');
    return path === '/ru/brands'
      ? {
          all: 'Все',
          search: 'Поиск бренда...',
          noResults: 'Бренды не найдены',
          loading: 'Завантажуємо всі бренди...'
        }
      : {
          all: 'Усі',
          search: 'Пошук бренду...',
          noResults: 'Брендів не знайдено',
          loading: 'Завантажуємо всі бренди...'
        };
  }

  function getHeader() {
    return (
      document.querySelector('#j-catalog-header') ||
      document.querySelector('h1.heading.heading--xl[data-catalog-view-block="heading"]') ||
      document.querySelector('h1.main-h[data-catalog-view-block="heading"]') ||
      document.querySelector('h1[data-catalog-view-block="heading"]')
    );
  }

  function getGridContainer() {
    var firstItem = document.querySelector('li.catalog-grid__item, li.goods__item');
    return firstItem ? firstItem.parentElement : null;
  }

  function getItemsFromDoc(doc) {
    var items = Array.from(doc.querySelectorAll('li.catalog-grid__item'));
    if (!items.length) items = Array.from(doc.querySelectorAll('li.goods__item'));
    return items;
  }

  function getLinksFromDoc(doc) {
    var links = Array.from(doc.querySelectorAll('a.catalogCard-a'));
    if (!links.length) links = Array.from(doc.querySelectorAll('a.catalog-card__link'));
    return links;
  }

  function getBrandName(link) {
    var title =
      link.querySelector('.catalogCard-title') ||
      link.querySelector('.catalog-card__title');

    if (title) return norm(title.textContent);

    var t = link.getAttribute('title');
    if (t) return norm(t);

    return norm(link.textContent);
  }

  function getBaseBrandsUrl() {
    var path = location.pathname.replace(/\/+$/, '');
    return path.indexOf('/ru/brands') === 0 ? '/ru/brands/' : '/brands/';
  }

  function hidePagers() {
    document.querySelectorAll('.pager__container, .pager__wrap').forEach(function(el) {
      el.classList.add('yk-brand-pager-hidden');
    });
  }

  function showPagers() {
    document.querySelectorAll('.pager__container, .pager__wrap').forEach(function(el) {
      el.classList.remove('yk-brand-pager-hidden');
    });
  }

  async function fetchPageDoc(url) {
    var res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);

    var html = await res.text();
    return new DOMParser().parseFromString(html, 'text/html');
  }

  async function collectAllBrandItems() {
    var base = getBaseBrandsUrl();
    var seen = new Set();
    var collected = [];

    function addFromDoc(doc) {
      var items = getItemsFromDoc(doc);

      items.forEach(function(item) {
        var link = item.querySelector('a.catalogCard-a, a.catalog-card__link');
        if (!link) return;

        var href = link.getAttribute('href') || '';
        if (!href) return;

        var abs = new URL(href, location.origin).href;
        if (seen.has(abs)) return;

        seen.add(abs);
        collected.push({
          href: abs,
          html: item.outerHTML
        });
      });

      return items.length;
    }

    addFromDoc(document);

    for (var page = 2; page <= 50; page++) {
      var url = base + 'filter/page=' + page + '/';

      try {
        var doc = await fetchPageDoc(url);
        var count = addFromDoc(doc);

        if (!count) break;
      } catch (e) {
        break;
      }
    }

    return collected;
  }

  function replaceGridWithAllItems(items) {
    var container = getGridContainer();
    if (!container) return false;

    container.innerHTML = items.map(function(item) {
      return item.html;
    }).join('');

    return true;
  }

  function initFilter() {
    var header = getHeader();
    var links = getLinksFromDoc(document);

    if (!header || !links.length) return;

    document.querySelectorAll('.yk-brand-tools').forEach(function(el) {
      el.remove();
    });

    document.querySelectorAll('.yk-brand-hidden').forEach(function(el) {
      el.classList.remove('yk-brand-hidden');
    });

    var labels = getLabels();

    var letters = [
      labels.all, '0-9',
      'A','B','C','D','E','F','G','H','I','J','K','L','M',
      'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'
    ];

    var brandData = links.map(function(link) {
      var item =
        link.closest('li.catalog-grid__item') ||
        link.closest('li.goods__item') ||
        link;

      var name = getBrandName(link);

      return {
        link: link,
        item: item,
        name: name,
        upper: name.toUpperCase()
      };
    });

    var tools = document.createElement('div');
    tools.className = 'yk-brand-tools';

    var searchWrap = document.createElement('div');
    searchWrap.className = 'yk-brand-search-wrap';

    var searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'yk-brand-search';
    searchInput.placeholder = labels.search;
    searchWrap.appendChild(searchInput);

    var filter = document.createElement('div');
    filter.className = 'yk-brand-filter';

    var noResults = document.createElement('div');
    noResults.className = 'yk-brand-no-results';
    noResults.textContent = labels.noResults;

    tools.appendChild(searchWrap);
    tools.appendChild(filter);
    tools.appendChild(noResults);

    var currentLetter = labels.all;

    function matchesLetter(name, letter) {
      var first = name.charAt(0).toUpperCase();

      if (letter === labels.all) return true;
      if (letter === '0-9') return /^\d/.test(name);

      return first === letter;
    }

    function updateDisabledLetters(searchValue) {
      var upperSearch = norm(searchValue).toUpperCase();

      filter.querySelectorAll('button').forEach(function(btn) {
        var letter = btn.getAttribute('data-letter');

        var hasMatch = brandData.some(function(item) {
          var okSearch = !upperSearch || item.upper.indexOf(upperSearch) !== -1;
          var okLetter = matchesLetter(item.name, letter);
          return okSearch && okLetter;
        });

        btn.disabled = !hasMatch;
        btn.classList.toggle('is-disabled', !hasMatch);
      });
    }

    function applyFilters(scrollToTop) {
      var searchValue = norm(searchInput.value);
      var upperSearch = searchValue.toUpperCase();
      var visibleCount = 0;

      brandData.forEach(function(item) {
        var okLetter = matchesLetter(item.name, currentLetter);
        var okSearch = !upperSearch || item.upper.indexOf(upperSearch) !== -1;
        var show = okLetter && okSearch;

        item.item.classList.toggle('yk-brand-hidden', !show);

        if (show) visibleCount++;
      });

      noResults.classList.toggle('show', visibleCount === 0);
      updateDisabledLetters(searchValue);

      if (scrollToTop) {
        var topTarget = tools.getBoundingClientRect().top + window.pageYOffset - 12;
        window.scrollTo({
          top: topTarget,
          behavior: 'smooth'
        });
      }
    }

    letters.forEach(function(letter, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = letter;
      btn.setAttribute('data-letter', letter);

      if (i === 0) btn.classList.add('active');

      btn.addEventListener('click', function() {
        if (btn.disabled) return;

        currentLetter = letter;

        filter.querySelectorAll('button').forEach(function(b) {
          b.classList.remove('active');
        });

        btn.classList.add('active');
        applyFilters(true);

        if (window.innerWidth <= 767) {
          btn.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest'
          });
        }
      });

      filter.appendChild(btn);
    });

    searchInput.addEventListener('input', function() {
      applyFilters(false);
    });

    header.insertAdjacentElement('afterend', tools);

    updateDisabledLetters('');
    applyFilters(false);
  }

  async function run() {
    if (started) return;
    started = true;

    if (!isBrandsPage()) return;

    var header = getHeader();
    if (!header) {
      started = false;
      return;
    }

    document.querySelectorAll('.yk-brand-tools').forEach(function(el) {
      el.remove();
    });

    var labels = getLabels();

    var loading = document.createElement('div');
    loading.className = 'yk-brand-loading';
    loading.textContent = labels.loading;
    header.insertAdjacentElement('afterend', loading);

    try {
      var allItems = await collectAllBrandItems();

      if (allItems && allItems.length > getItemsFromDoc(document).length) {
        replaceGridWithAllItems(allItems);
        hidePagers();
      } else {
        showPagers();
      }

      initFilter();
    } catch (e) {
      console.error('YK Brands filter error:', e);
      showPagers();
      initFilter();
    } finally {
      loading.classList.add('is-hidden');
    }
  }

  function boot() {
    if (!isBrandsPage()) return;

    var tries = 0;
    var timer = setInterval(function() {
      tries++;

      var header = getHeader();
      var links = getLinksFromDoc(document);

      if (header && links.length) {
        clearInterval(timer);
        run();
      }

      if (tries > 40) {
        clearInterval(timer);
      }
    }, 200);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();

// === script #7 (length=15791) ===
(function () {
  const COD_METHOD_TEXTS = [
    'Післяплата (100 грн передплата)',
    'Оплата при получении (100 грн аванс)'
  ];

  const SUBMIT_TEXTS = [
    'Оформити замовлення',
    'Оформить заказ'
  ];

  const LIQPAY_DATA = 'eyJ2ZXJzaW9uIjozLCJhY3Rpb24iOiJwYXkiLCJhbW91bnQiOiIxMDAiLCJjdXJyZW5jeSI6IlVBSCIsImRlc2NyaXB0aW9uIjoi0J7Qv9C70LDRgtCwINC30LAg0YLQvtCy0LDRgCIsInB1YmxpY19rZXkiOiJpOTI4ODQ1MjM4NzUiLCJsYW5ndWFnZSI6InVrIn0=';
  const LIQPAY_SIGNATURE = 'CdBZLEZyGSpAfIk8Bjrqyu9TSeA=';

  const PASS_KEY = 'yk_prepaid100_pass_once_v20';
  const MODAL_LOCK_KEY = 'yk_prepaid100_modal_lock_v20';
  const MODAL_LOCK_MS = 3000;

  console.log('✅ YK prepay popup LOADED (v20 auto close on success)');

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function normalize(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

  function setLock() {
    sessionStorage.setItem(MODAL_LOCK_KEY, String(Date.now() + MODAL_LOCK_MS));
  }

  function isLocked() {
    const until = parseInt(sessionStorage.getItem(MODAL_LOCK_KEY) || '0', 10);
    return Date.now() < until;
  }

  function isPaymentField(el) {
    const s = ((el && (
      (el.getAttribute && (el.getAttribute('name') || el.getAttribute('id') || el.getAttribute('class') || '')) ||
      (el.name || el.id || el.className || '')
    )) + '').toLowerCase();

    return /pay|payment|oplata|оплата|oplati|оплат/.test(s);
  }

  function getLabelTextForRadio(r) {
    const id = r.getAttribute('id');
    if (id) {
      const lbl = qs(`label[for="${CSS.escape(id)}"]`);
      if (lbl) return normalize(lbl.innerText || lbl.textContent);
    }

    const parent = r.closest('label, .radio, .option, .payment, .checkout__payment, li, div');
    if (parent) return normalize(parent.innerText || parent.textContent);

    return '';
  }

  function getSelectedPaymentText() {
    const radios = qsa('input[type="radio"]');
    const payRadios = radios.filter(isPaymentField);
    const checkedPay = payRadios.filter(r => r.checked);

    if (checkedPay.length) {
      const t = getLabelTextForRadio(checkedPay[0]);
      if (t) return t;
    }

    const selects = qsa('select');
    const paySelects = selects.filter(isPaymentField);

    for (const s of paySelects) {
      const opt = s.options[s.selectedIndex];
      const txt = normalize(opt && (opt.textContent || opt.innerText));
      if (txt) return txt;
    }

    const checkedAll = radios.filter(r => r.checked);
    for (const r of checkedAll) {
      const txt = getLabelTextForRadio(r);
      if (!txt) continue;

      const low = txt.toLowerCase();
      if (/(доставка|delivery|самовивіз|самовывоз|нова пошта|укрпошта|кур'єр|курьер)/.test(low)) continue;

      return txt;
    }

    return '';
  }

  function matchesPrepay(text) {
    return COD_METHOD_TEXTS.some(t => text.includes(t));
  }

  function getCommentTextarea() {
    return (
      qs('textarea[name*="comment" i]') ||
      qs('textarea[name*="note" i]') ||
      qs('textarea[placeholder*="коментар" i]') ||
      qs('textarea[placeholder*="комментар" i]') ||
      qs('textarea')
    );
  }

  function setPaymentCommentSimple(status, paymentId) {
    const textarea = getCommentTextarea();
    if (!textarea) return;

    let text = 'Клієнт обрав: внести передплату 100 грн';

    if (status === 'success' && paymentId) {
      text += '\nLiqPay статус: success';
      text += '\nLiqPay payment_id: ' + paymentId;
    } else {
      text += '\nLiqPay статус: nonsuccess';
    }

    textarea.value = text;

    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function clearCommentIfNeeded() {
    const textarea = getCommentTextarea();
    if (!textarea) return;

    const current = textarea.value || '';
    const lines = current.split('\n').filter(line => {
      const t = line.trim();
      if (t === 'Клієнт обрав: внести передплату 100 грн') return false;
      if (t.startsWith('LiqPay статус:')) return false;
      if (t.startsWith('LiqPay payment_id:')) return false;
      return true;
    });

    textarea.value = lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function isSubmitButton(el) {
    if (!el) return false;

    if (el.matches && (el.matches('button[type="submit"]') || el.matches('input[type="submit"]'))) {
      return true;
    }

    const text = normalize(el.innerText || el.textContent || '');
    return SUBMIT_TEXTS.some(t => text.includes(t));
  }

  function findSubmitButtonFromTarget(target) {
    const cand = target && target.closest ? target.closest('button, input[type="submit"], a') : null;
    if (isSubmitButton(cand)) return cand;

    const up = target && target.closest ? target.closest('button, a') : null;
    if (isSubmitButton(up)) return up;

    return null;
  }

  function clickSubmitProgrammatically(btn) {
    if (!btn) return;
    sessionStorage.setItem(PASS_KEY, '1');
    btn.click();
    setTimeout(() => sessionStorage.removeItem(PASS_KEY), 500);
  }

  function loadLiqPayScript() {
    return new Promise(function(resolve, reject) {
      if (window.LiqPayCheckout) {
        resolve();
        return;
      }

      const existing = document.querySelector('script[data-yk-liqpay-lib="1"]');
      if (existing) {
        let tries = 0;
        const timer = setInterval(function() {
          tries++;
          if (window.LiqPayCheckout) {
            clearInterval(timer);
            resolve();
          } else if (tries > 100) {
            clearInterval(timer);
            reject(new Error('LiqPay script load timeout'));
          }
        }, 100);
        return;
      }

      const s = document.createElement('script');
      s.src = 'https://static.liqpay.ua/libjs/checkout.js';
      s.async = true;
      s.setAttribute('data-yk-liqpay-lib', '1');

      s.onload = function() {
        let tries = 0;
        const timer = setInterval(function() {
          tries++;
          if (window.LiqPayCheckout) {
            clearInterval(timer);
            resolve();
          } else if (tries > 100) {
            clearInterval(timer);
            reject(new Error('LiqPay object not found after load'));
          }
        }, 100);
      };

      s.onerror = function() {
        reject(new Error('Failed to load LiqPay script'));
      };

      document.head.appendChild(s);
    });
  }

  function openLiqPayWidget(submitBtn) {
    qsa('[data-yk-liqpay-overlay="1"]').forEach(x => x.remove());

    const overlay = document.createElement('div');
    overlay.setAttribute('data-yk-liqpay-overlay', '1');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.6);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      width: min(520px, 100%);
      min-height: 300px;
      max-height: 92vh;
      background: #fff;
      border-radius: 14px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 10px 40px rgba(0,0,0,.25);
      display: flex;
      flex-direction: column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      border-bottom: 1px solid #eee;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #111;
      background: #fff;
      flex: 0 0 48px;
    `;
    header.innerHTML = '<span>Оплата через LiqPay</span>';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      border: 0;
      background: transparent;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      color: #111;
      padding: 4px 6px;
    `;

    const body = document.createElement('div');
    body.style.cssText = `
      position: relative;
      width: 100%;
      min-height: 260px;
      background: #fff;
      flex: 1 1 auto;
      overflow: auto;
    `;

    const loader = document.createElement('div');
    loader.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      font-size: 14px;
      color: #555;
      background: #fff;
      z-index: 1;
      text-align: center;
      padding: 20px;
    `;
    loader.textContent = 'Завантажуємо віджет оплати...';

    const checkoutWrap = document.createElement('div');
    checkoutWrap.id = 'yk_liqpay_checkout_embed';
    checkoutWrap.style.cssText = `
      width: 100%;
      min-height: 260px;
      background: #fff;
    `;

    let orderSubmitted = false;
    let widgetClosed = false;
    let lastLiqPayData = null;

    function submitOrderOnce() {
      if (orderSubmitted) return;
      orderSubmitted = true;
      clickSubmitProgrammatically(submitBtn);
    }

    function closeAndSubmit() {
      if (widgetClosed) return;
      widgetClosed = true;
      overlay.remove();
      submitOrderOnce();
    }

    function applyFinalComment(finalData) {
      if (finalData && finalData.status === 'success' && finalData.payment_id) {
        setPaymentCommentSimple('success', finalData.payment_id);
      } else {
        setPaymentCommentSimple('nonsuccess');
      }
    }

    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      applyFinalComment(lastLiqPayData);
      closeAndSubmit();
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        applyFinalComment(lastLiqPayData);
        closeAndSubmit();
      }
    });

    box.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    header.appendChild(closeBtn);
    body.appendChild(loader);
    body.appendChild(checkoutWrap);
    box.appendChild(header);
    box.appendChild(body);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    loadLiqPayScript()
      .then(function() {
        loader.textContent = 'Ініціалізуємо оплату...';

        const instance = window.LiqPayCheckout.init({
          data: LIQPAY_DATA,
          signature: LIQPAY_SIGNATURE,
          embedTo: '#yk_liqpay_checkout_embed',
          mode: 'embed'
        });

        instance
          .on('liqpay.ready', function(data) {
            if (loader.parentNode) loader.remove();
            console.log('LiqPay ready', data);
          })
          .on('liqpay.callback', function(data) {
            console.log('LiqPay callback:', data);
            lastLiqPayData = data || null;

            if (data && data.status === 'success' && data.payment_id) {
              setPaymentCommentSimple('success', data.payment_id);
              closeAndSubmit();
              return;
            }

            setPaymentCommentSimple('nonsuccess');
          })
          .on('liqpay.close', function(data) {
            console.log('LiqPay close:', data);

            const finalData = data || lastLiqPayData || null;
            applyFinalComment(finalData);
            closeAndSubmit();
          });
      })
      .catch(function(err) {
        console.error(err);
        loader.innerHTML = 'Не вдалося завантажити LiqPay.<br>Спробуйте ще раз.';
      });
  }

  function showModal(selectedText, submitBtn) {
    qsa('[data-yk-prepay-overlay="1"]').forEach(x => x.remove());

    const isRU = selectedText.includes('Оплата при получении');
    const title = isRU ? 'Аванс 100 грн' : 'Передплата 100 грн';
    const body = isRU
      ? `Вы выбрали <b>${COD_METHOD_TEXTS[1]}</b>.<br>Оплатить аванс <b>100 грн</b> сейчас или подождать менеджера?`
      : `Ви обрали <b>${COD_METHOD_TEXTS[0]}</b>.<br>Оплатити передплату <b>100 грн</b> зараз чи почекати менеджера?`;

    const btnPay = isRU ? 'Оплатить 100 грн сейчас' : 'Оплатити 100 грн зараз';
    const btnWait = isRU ? 'Подожду менеджера' : 'Почекаю менеджера';

    const overlay = document.createElement('div');
    overlay.setAttribute('data-yk-prepay-overlay', '1');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      padding: 16px;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      width: min(520px, 100%);
      background: #fff;
      border-radius: 14px;
      padding: 18px 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,.25);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      color: #111;
    `;

    box.innerHTML = `
      <div style="font-size:18px; font-weight:700; margin-bottom:8px;">${title}</div>
      <div style="font-size:14px; line-height:1.45; margin-bottom:12px;">${body}</div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button type="button" id="yk_pay_now" style="
          flex:1; min-width: 180px;
          padding:12px 14px; border:0; border-radius:10px;
          background:#111; color:#fff; font-weight:700; cursor:pointer;">
          ${btnPay}
        </button>
        <button type="button" id="yk_wait_mgr" style="
          flex:1; min-width: 180px;
          padding:12px 14px; border:1px solid #ccc; border-radius:10px;
          background:#fff; color:#111; font-weight:700; cursor:pointer;">
          ${btnWait}
        </button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function close() { overlay.remove(); }

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });

    box.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    qs('#yk_wait_mgr', box).addEventListener('click', function() {
      clearCommentIfNeeded();
      close();
      clickSubmitProgrammatically(submitBtn);
    });

    qs('#yk_pay_now', box).addEventListener('click', function() {
      setPaymentCommentSimple('nonsuccess');
      close();
      setTimeout(function() {
        openLiqPayWidget(submitBtn);
      }, 150);
    });
  }

  document.addEventListener('click', function(e) {
    if (sessionStorage.getItem(PASS_KEY) === '1') return;

    const submitBtn = findSubmitButtonFromTarget(e.target);
    if (!submitBtn) return;
    if (!isSubmitButton(submitBtn)) return;

    const selectedText = getSelectedPaymentText();
    console.log('submit click, payment detected:', selectedText);

    if (!matchesPrepay(selectedText)) return;

    if (isLocked()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    setLock();
    e.preventDefault();
    e.stopPropagation();

    showModal(selectedText, submitBtn);
  }, true);

})();
