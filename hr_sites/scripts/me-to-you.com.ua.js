// source: https://me-to-you.com.ua/
// extracted: 2026-05-07T21:22:00.460Z
// scripts: 2

// === script #1 (length=3135) ===
(function () {
  function isMobile() {
    return window.innerWidth <= 768;
  }

  function isHomePage() {
    var path = location.pathname.toLowerCase();
    return path === '/' || path === '/ua/' || path === '/ru/';
  }

  function getButtonText() {
    var path = location.pathname.toLowerCase();
    return path.indexOf('/ru/') === 0 ? 'Купить' : 'Купити';
  }

  function findBuyButton() {
    var elements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];

      if (el.closest('#hs-mobile-buy-fixed')) continue;
      if (el.offsetParent === null) continue;
      if (el.disabled) continue;

      var text = (el.innerText || el.value || el.textContent || '').trim().toLowerCase();

      if (
        text === 'купить' ||
        text === 'купити' ||
        text === 'в корзину' ||
        text === 'в кошик' ||
        text === 'до кошика'
      ) {
        return el;
      }
    }

    return null;
  }

  function isSearchActive() {
    var active = document.activeElement;
    if (!active) return false;

    var tag = active.tagName ? active.tagName.toLowerCase() : '';
    var type = active.type ? active.type.toLowerCase() : '';

    return (
      tag === 'input' ||
      tag === 'textarea' ||
      type === 'search' ||
      active.closest('.search') ||
      active.closest('.header-search') ||
      active.closest('.j-search')
    );
  }

  function createFixedButton(realBtn) {
    if (document.getElementById('hs-mobile-buy-fixed')) return;

    var panel = document.createElement('div');
    panel.id = 'hs-mobile-buy-fixed';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.innerText = getButtonText();

    btn.onclick = function () {
      var freshBtn = findBuyButton();
      if (freshBtn) freshBtn.click();
    };

    panel.appendChild(btn);
    document.body.appendChild(panel);

    function toggle() {
      var rect = realBtn.getBoundingClientRect();

      if (rect.bottom < 0 && !isSearchActive()) {
        panel.classList.add('show');
      } else {
        panel.classList.remove('show');
      }
    }

    window.addEventListener('scroll', toggle, { passive: true });
    window.addEventListener('resize', toggle);
    document.addEventListener('focusin', toggle);
    document.addEventListener('focusout', function () {
      setTimeout(toggle, 200);
    });

    setTimeout(toggle, 500);
  }

  function init() {
    if (!isMobile()) return;
    if (isHomePage()) return;

    var tries = 0;

    var timer = setInterval(function () {
      var realBtn = findBuyButton();

      if (realBtn) {
        createFixedButton(realBtn);
        clearInterval(timer);
      }

      tries++;
      if (tries > 80) clearInterval(timer);
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', init);
})();

// === script #2 (length=8178) ===
(function () {
  "use strict";

  const LIMIT = 10000;
  const MESSAGE = "Для заказа свыше 10 000 грн свяжитесь с менеджером";

  const BTN_PHRASES = [
    "оформити замовлення",
    "оформить заказ",
    "оформление заказа",
    "checkout"
  ];

  const TOTAL_KEYWORDS = ["всього", "итого", "разом", "до сплати", "до оплати", "total"];

  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function parseMoney(text) {
    if (!text) return 0;
    let s = String(text).replace(/\u00A0/g, " ").trim();
    s = s.replace(/[^\d.,\s]/g, "");
    s = s.replace(/\s+/g, "");
    if (!s) return 0;

    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else {
      const parts = s.split(".");
      if (parts.length > 2) s = parts.slice(0, -1).join("") + "." + parts[parts.length - 1];
    }
    const v = parseFloat(s);
    return Number.isFinite(v) ? v : 0;
  }

  function ensureBoxTop(id) {
    let box = document.getElementById(id);
    if (!box) {
      box = document.createElement("div");
      box.id = id;
      box.style.cssText =
        "position:sticky;top:0;z-index:99999;margin:0;padding:12px 14px;" +
        "background:#fff7f7;border-bottom:2px solid #ff4d4d;font-size:14px;line-height:1.35;";
      document.body.prepend(box);
    }
    box.textContent = MESSAGE;
    return box;
  }

  function ensureBoxNear(btn) {
    if (!btn || !btn.parentElement) return;
    let box = document.getElementById("limit-10k-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "limit-10k-box";
      box.style.cssText =
        "margin:10px 0;padding:10px 12px;border:2px solid #ff4d4d;" +
        "border-radius:10px;background:#fff7f7;font-size:14px;line-height:1.35;";
    }
    box.textContent = MESSAGE;
    if (!box.isConnected) btn.parentElement.insertBefore(box, btn);
  }

  function removeBox(id) {
    const box = document.getElementById(id);
    if (box) box.remove();
  }

  function setDisabled(el, disabled) {
    if (!el) return;

    el.dataset.limit10k = "1";

    if (el.tagName === "BUTTON" || (el.tagName === "INPUT" && (el.type === "submit" || el.type === "button"))) {
      el.disabled = !!disabled;
    } else if (el.tagName === "A") {
      if (disabled) {
        if (!el.dataset.oldHref) el.dataset.oldHref = el.getAttribute("href") || "";
        el.setAttribute("href", "javascript:void(0)");
        el.setAttribute("aria-disabled", "true");
        el.style.pointerEvents = "none";
      } else {
        if (el.dataset.oldHref) el.setAttribute("href", el.dataset.oldHref);
        el.removeAttribute("aria-disabled");
        el.style.pointerEvents = "";
      }
    }

    el.style.opacity = disabled ? "0.55" : "";
    el.style.cursor = disabled ? "not-allowed" : "";
  }

  // -------- Общие функции поиска суммы/кнопки --------
  function findCheckoutButtonIn(root) {
    if (!root) return null;
    const nodes = Array.from(root.querySelectorAll("button,a,input[type='submit'],input[type='button']")).filter(isVisible);
    for (const el of nodes) {
      const txt = ((el.innerText || el.textContent || el.value || "") + "").trim().toLowerCase();
      if (!txt) continue;
      if (BTN_PHRASES.some(p => txt.includes(p))) return el;
    }
    return null;
  }

  function getTotalFrom(root) {
    if (!root) root = document.body;

    const leafs = Array.from(root.querySelectorAll("*"))
      .filter(el => el.children.length === 0 && isVisible(el));

    let best = 0;

    for (const el of leafs) {
      const txt = (el.textContent || "").trim();
      if (!txt || txt.length > 160) continue;
      const low = txt.toLowerCase();

      if (TOTAL_KEYWORDS.some(k => low.includes(k)) && /\d/.test(low)) {
        const v = parseMoney(txt);
        if (v > best) best = v;
      }
      if ((low.includes("грн") || low.includes("₴")) && /\d/.test(low)) {
        const v = parseMoney(txt);
        if (v > best) best = v;
      }
    }

    if (best === 0) {
      for (const el of leafs) {
        const low = (el.textContent || "").toLowerCase();
        if (!TOTAL_KEYWORDS.some(k => low.includes(k))) continue;
        const p = el.parentElement;
        if (!p) continue;

        const inside = Array.from(p.querySelectorAll("*"))
          .filter(x => x.children.length === 0 && isVisible(x));

        for (const x of inside) {
          const v = parseMoney(x.textContent || "");
          if (v > best) best = v;
        }
      }
    }

    return best;
  }

  // -------- 1) Корзина (ПК+моб): блокируем только кнопку оформления --------
  function findCartContainerFromButton(btn) {
    if (!btn) return null;
    let el = btn;
    for (let i = 0; i < 8; i++) {
      if (!el || !el.parentElement) break;
      el = el.parentElement;
      const t = (el.textContent || "").toLowerCase();
      if (t.includes("кошик") || t.includes("корзин")) return el;
      if ((t.includes("всього") || t.includes("итого") || t.includes("разом")) && t.length > 50) return el;
    }
    return document.body;
  }

  function applyCartLimit() {
    const btn = findCheckoutButtonIn(document.body);
    if (!btn) { removeBox("limit-10k-box"); return; }

    const container = findCartContainerFromButton(btn);
    const total = getTotalFrom(container);
    const over = total > LIMIT;

    setDisabled(btn, over);
    if (over) ensureBoxNear(btn);
    else removeBox("limit-10k-box");
  }

  function interceptCart(e) {
    const b = e.target && e.target.closest ? e.target.closest("[data-limit10k='1']") : null;
    if (!b) return;

    const container = findCartContainerFromButton(b);
    const total = getTotalFrom(container);
    if (total > LIMIT) {
      e.preventDefault();
      e.stopPropagation();
      ensureBoxNear(b);
      return false;
    }
  }

  document.addEventListener("click", interceptCart, true);
  document.addEventListener("touchstart", interceptCart, true);

  // -------- 2) Страница оформления (checkout): защита, даже если попали напрямую --------
  function isCheckoutPage() {
    const p = (location.pathname || "").toLowerCase();
    const q = (location.search || "").toLowerCase();
    return p.includes("checkout") || p.includes("order") || q.includes("checkout") || q.includes("order");
  }

  function findCheckoutSubmitButton() {
    // На оформлении обычно есть submit или кнопка подтверждения
    const candidates = Array.from(document.querySelectorAll("button,input[type='submit'],a"))
      .filter(isVisible);

    // сначала — по тексту
    for (const el of candidates) {
      const t = ((el.innerText || el.textContent || el.value || "") + "").trim().toLowerCase();
      if (!t) continue;
      if (BTN_PHRASES.some(p => t.includes(p)) || t.includes("підтверд") || t.includes("подтверд") || t.includes("оплат") || t.includes("сплат")) {
        return el;
      }
    }
    // если не нашли — берём первый submit
    const submit = document.querySelector("button[type='submit'],input[type='submit']");
    return submit && isVisible(submit) ? submit : null;
  }

  function applyCheckoutGuard() {
    if (!isCheckoutPage()) { removeBox("limit-10k-checkout"); return; }

    const total = getTotalFrom(document.body);
    const over = total > LIMIT;

    const btn = findCheckoutSubmitButton();
    if (btn) setDisabled(btn, over);

    if (over) ensureBoxTop("limit-10k-checkout");
    else removeBox("limit-10k-checkout");
  }

  document.addEventListener("submit", function (e) {
    if (!isCheckoutPage()) return;
    const total = getTotalFrom(document.body);
    if (total > LIMIT) {
      e.preventDefault();
      e.stopPropagation();
      applyCheckoutGuard();
      return false;
    }
  }, true);

  // -------- Запуск --------
  applyCartLimit();
  applyCheckoutGuard();
  setInterval(function () {
    applyCartLimit();
    applyCheckoutGuard();
  }, 800);

})();
