// source: https://dfadekor.store/
// extracted: 2026-05-07T21:21:10.099Z
// scripts: 1

// === script #1 (length=6112) ===
(function () {
  const FREE_FROM = 2500;
  const BANNER_ID = 'hs-free-delivery-banner';

  const lang = (location.pathname || '').toLowerCase().includes('/ru/') ? 'ru' : 'uk';

  const I18N = {
    uk: {
      title: (sum) => `Безкоштовна доставка від ${sum} грн`,
      calculating: 'Розраховуємо суму замовлення…',
      activated: '✅ Безкоштовну доставку активовано!',
      addMore: (diff) => `➕ Додайте ще на ${diff} грн і отримайте безкоштовну доставку! 🔥`,
      caption: (total, target) => `${total} / ${target} грн`
    },
    ru: {
      title: (sum) => `Бесплатная доставка от ${sum} грн`,
      calculating: 'Считаем сумму заказа…',
      activated: '✅ Бесплатная доставка активирована!',
      addMore: (diff) => `➕ Добавьте ещё на ${diff} грн и получите бесплатную доставку! 🔥`,
      caption: (total, target) => `${total} / ${target} грн`
    }
  };

  const T = I18N[lang] || I18N.uk;

  const COLOR_PENDING = '#f5c400';
  const COLOR_DONE = '#2eae60';

  function parseUAH(text) {
    if (!text) return null;
    const n = text
      .replace(/\u00A0/g, ' ')
      .replace(/[^\d\s]/g, '')
      .replace(/\s+/g, '')
      .trim();
    if (!n) return null;
    const val = Number(n);
    return Number.isFinite(val) ? val : null;
  }

  function formatUAH(n) {
    try {
      return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'uk-UA').format(n);
    } catch (e) {
      return String(n);
    }
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function findTotal() {
    const selectors = [
      '.order-summary-b.j-total-sum',
      '.cart-footer-b.cart-cost.j-total-sum',
      '.cart-cost.j-total-sum',
      '.j-total-sum'
    ];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        if (el.closest('.cart-item') || el.closest('.j-cart-product') || el.closest('.order-i')) continue;
        const v = parseUAH(el.textContent);
        if (v !== null) return v;
      }
    }
    return null;
  }

  function findPlacement() {
    const orderSummary = document.querySelector('.order-summary');
    if (orderSummary) return { type: 'before', el: orderSummary };

    const cartSummary = document.querySelector('.cart-summary');
    if (cartSummary) return { type: 'after', el: cartSummary };

    return null;
  }

  function ensureBanner(placement) {
    if (!placement || !placement.el) return null;

    let banner = document.getElementById(BANNER_ID);
    if (banner && !document.body.contains(banner)) banner = null;

    if (!banner) {
      banner = document.createElement('div');
      banner.id = BANNER_ID;
      banner.style.cssText =
        'margin:10px 0;padding:10px 12px;border-radius:0;' +
        'border:1px solid rgba(0,0,0,.08);background:rgba(0,0,0,.03);' +
        'font-size:14px;line-height:1.35';

      banner.innerHTML =
        '<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;">' +
          '<div class="hs-free-delivery-title" style="font-weight:700;"></div>' +
          '<div class="hs-free-delivery-percent" style="font-weight:700;white-space:nowrap;">0%</div>' +
        '</div>' +
        '<div class="hs-free-delivery-text" style="margin-top:4px;"></div>' +
        '<div style="margin-top:8px;">' +
          '<div style="height:8px;border:1px solid rgba(0,0,0,.10);background:rgba(0,0,0,.02);border-radius:4px;overflow:hidden;">' +
            '<div class="hs-free-delivery-progress" style="height:100%;width:0%;background:' + COLOR_PENDING + ';transition:width .2s ease,background .2s ease;border-radius:4px;"></div>' +
          '</div>' +
          '<div class="hs-free-delivery-caption" style="margin-top:6px;font-size:12px;opacity:.85;"></div>' +
        '</div>';

      if (placement.type === 'before') {
        placement.el.parentElement.insertBefore(banner, placement.el);
      } else if (placement.type === 'after') {
        placement.el.parentElement.insertBefore(banner, placement.el.nextSibling);
      }
    }

    return banner;
  }

  function render() {
    const placement = findPlacement();
    if (!placement) return;

    const banner = ensureBanner(placement);
    if (!banner) return;

    const titleEl   = banner.querySelector('.hs-free-delivery-title');
    const textEl    = banner.querySelector('.hs-free-delivery-text');
    const percentEl = banner.querySelector('.hs-free-delivery-percent');
    const barEl     = banner.querySelector('.hs-free-delivery-progress');
    const capEl     = banner.querySelector('.hs-free-delivery-caption');

    titleEl.textContent = T.title(formatUAH(FREE_FROM));

    const total = findTotal();

    if (total === null) {
      textEl.textContent = T.calculating;
      percentEl.textContent = '…';
      barEl.style.width = '0%';
      barEl.style.background = COLOR_PENDING;
      capEl.style.display = '';
      capEl.textContent = T.caption('…', formatUAH(FREE_FROM));
      return;
    }

    const pct = clamp(Math.round((total / FREE_FROM) * 100), 0, 100);
    percentEl.textContent = pct + '%';
    barEl.style.width = pct + '%';
    barEl.style.background = (total >= FREE_FROM) ? COLOR_DONE : COLOR_PENDING;

    if (total >= FREE_FROM) {
      textEl.textContent = T.activated;
      capEl.style.display = 'none';
      capEl.textContent = '';
    } else {
      const diff = FREE_FROM - total;
      textEl.textContent = T.addMore(formatUAH(diff));
      capEl.style.display = '';
      capEl.textContent = T.caption(formatUAH(total), formatUAH(FREE_FROM));
    }
  }

  let scheduled = false;
  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () { scheduled = false; render(); }, 150);
  }

  new MutationObserver(scheduleRender).observe(document.documentElement, {
    subtree: true, childList: true, characterData: true
  });

  document.addEventListener('click', scheduleRender, true);

  render();
})();
