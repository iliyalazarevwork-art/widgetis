// source: https://korobky.com.ua/
// extracted: 2026-05-07T21:19:51.850Z
// scripts: 2

// === script #1 (length=1145) ===
(function() {
  function init() {
    var oldBar = document.querySelector('.custom-promo-bar');
    if (oldBar) oldBar.remove();

    var siteMenu = document.querySelector('.header__layout--top .site-menu.j-site-menu');
    if (siteMenu && !siteMenu.querySelector('.custom-info-item')) {
      var cityItem = document.createElement('span');
      cityItem.className = 'site-menu__item custom-info-item custom-info-item--city';
      cityItem.innerHTML = '<span class="site-menu__link">📍 Київ</span>';

      var timeItem = document.createElement('span');
      timeItem.className = 'site-menu__item custom-info-item custom-info-item--time';
      timeItem.innerHTML = '<span class="site-menu__link">⏰ Сьогодні до 18:00</span>';

      siteMenu.insertBefore(timeItem, siteMenu.firstChild);
      siteMenu.insertBefore(cityItem, siteMenu.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var mo = new MutationObserver(function () { init(); });
  mo.observe(document.body, { childList: true, subtree: true });
})();

// === script #2 (length=4247) ===
(function() {
  'use strict';

  function log(msg, data) {
    try { console.log('[KSB]', msg, data || ''); } catch(e) {}
  }

  function triggerNativeSearch(query) {
    log('Trying native search with query:', query);

    var input =
      document.querySelector('input[name="search"]') ||
      document.querySelector('input[name="q"]') ||
      document.querySelector('input.j-search-input') ||
      document.querySelector('input[placeholder*="ошук"]') ||
      document.querySelector('input[type="search"]');

    if (!input) {
      log('Native search input not found');
      return false;
    }

    log('Found search input', input);

    var nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeSetter.call(input, query);

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.focus();

    setTimeout(function() {
      var form = input.closest('form');
      if (form) {
        log('Submitting form');
        try {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        } catch(e) {
          form.submit();
        }
      } else {
        log('No form, dispatching Enter key');
        var enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(enterEvent);
      }
    }, 100);

    return true;
  }

  function doSearch() {
    var L = parseInt(document.getElementById('ksb-length').value) || 0;
    var W = parseInt(document.getElementById('ksb-width').value) || 0;
    var H = parseInt(document.getElementById('ksb-height').value) || 0;

    log('Values', {L: L, W: W, H: H});

    if (!L && !W && !H) {
      alert('Введіть хоча б один розмір');
      return;
    }

    var sep = '\u00D7';
    var query;
    if (L && W && H) {
      query = L + sep + W + sep + H;
    } else if (L && W) {
      query = L + sep + W;
    } else if (L && H) {
      query = L + sep + H;
    } else if (W && H) {
      query = W + sep + H;
    } else {
      query = String(L || W || H);
    }

    if (L && W && H) {
      var directUrl = '/kartonna-korobka-' + L + 'x' + W + 'x' + H + '/';
      log('Trying direct URL', directUrl);

      fetch(directUrl, { method: 'HEAD' })
        .then(function(response) {
          if (response.ok) {
            log('Direct URL exists, redirecting');
            window.location.href = directUrl;
          } else {
            log('Direct URL 404, falling back to native search');
            if (!triggerNativeSearch(query)) {
              fallbackSearch(query);
            }
          }
        })
        .catch(function(err) {
          log('Fetch error, falling back', err);
          if (!triggerNativeSearch(query)) {
            fallbackSearch(query);
          }
        });
      return;
    }

    if (!triggerNativeSearch(query)) {
      fallbackSearch(query);
    }
  }

  function fallbackSearch(query) {
    log('Final fallback: redirecting via URL');
    window.location.href = '/search/?q=' + encodeURIComponent(query);
  }

  function bind() {
    var btn = document.getElementById('ksbSearchBtn');
    if (!btn || btn.dataset.ksbBound === '1') return;

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      doSearch();
    });

    ['ksb-length', 'ksb-width', 'ksb-height'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            doSearch();
          }
        });
      }
    });

    btn.dataset.ksbBound = '1';
    log('Handler bound');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
  setTimeout(bind, 500);
  setTimeout(bind, 1500);
})();
