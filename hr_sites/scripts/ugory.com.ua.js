// source: https://ugory.com.ua/
// extracted: 2026-05-07T21:23:03.630Z
// scripts: 2

// === script #1 (length=2005) ===
(function () {
  function applySizeChartLabels() {
    var titles = document.querySelectorAll('.modification__title, .modification_title');
    if (!titles.length) return;

    var isMobile = window.innerWidth < 768;

    titles.forEach(function (title) {
      var text = (title.textContent || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      if (text.indexOf('розмір') === -1 && text.indexOf('размер') === -1) return;
      if (title.querySelector('.js-size-chart-label')) return;

      var rawTrigger = title.querySelector(
        '.hint--icon, .hint, .widget-hint-mobile-icon-4-1, .widget-hint-mobile-icon, [class*="widget-hint-mobile-icon"], .link__icon.link__icon--right, [data-modal]'
      );
      if (!rawTrigger) return;

      var trigger = rawTrigger.closest('[data-panel]') || rawTrigger;
      var triggerEl = trigger;

      var label = document.createElement('span');
      label.className = 'js-size-chart-label';
      label.textContent = 'Таблиця розмірів';

      var desktopStyles = {
        marginLeft: '6px',
        color: '#ea2b06',
        fontSize: '14px',
        textDecoration: 'underline',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      };

      var mobileStyles = {
        marginLeft: '21px',
        color: 'rgb(234, 43, 6)',
        fontSize: '14px',
        textDecoration: 'underline',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        position: 'relative',
        top: '1px'
      };

      var styles = isMobile ? mobileStyles : desktopStyles;
      Object.keys(styles).forEach(function (k) {
        label.style[k] = styles[k];
      });

      triggerEl.insertAdjacentElement('afterend', label);

      label.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        triggerEl.click();
      });
    });
  }

  applySizeChartLabels();
  setInterval(applySizeChartLabels, 1000);
})();

// === script #2 (length=1476) ===
(function () {
  var LOGO_BASE = 'https://raw.githubusercontent.com/datatrans/payment-logos/master/';
  var isMobile = window.innerWidth < 768;
  var logos = [
    { src: LOGO_BASE + 'assets/cards/visa.svg', alt: 'Visa' },
    { src: LOGO_BASE + 'assets/cards/mastercard.svg', alt: 'Mastercard' },
    { src: LOGO_BASE + 'assets/wallets/google-pay.svg', alt: 'Google Pay' },
    { src: LOGO_BASE + 'assets/wallets/apple-pay.svg', alt: 'Apple Pay' }
  ];

  function inject(container) {
    if (!container) return;

    // очищення
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '18px';
    container.style.padding = isMobile ?  '10px 12px' : '10px 0';

    logos.forEach(function (l) {
      var img = document.createElement('img');
      img.src = l.src;
      img.alt = l.alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.style.height = '38px';
      img.style.width = 'auto';
      container.appendChild(img);
    });
  }

  // Десктоп футер
  inject(document.querySelector('.footer__development'));

  // Мобільний футер
  inject(document.querySelector('.footer__bottom'));

  // На всяк випадок – прибрати всі тексти “Хорошоп”
  document.querySelectorAll('a, div, span').forEach(function(el){
    if (el.textContent && el.textContent.trim().toLowerCase().includes('хорошоп')) {
      el.remove();
    }
  });
})();
