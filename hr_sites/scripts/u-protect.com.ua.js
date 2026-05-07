// source: https://u-protect.com.ua/
// extracted: 2026-05-07T21:20:33.764Z
// scripts: 7

// === script #1 (length=5469) ===
(function() {
  var path   = window.location.pathname;
  var isRu   = path.indexOf('/ru') === 0;
  var urlUa  = 'https://u-protect.com.ua/ctechi/filter/parent=1189,1422/';
  var urlRu  = 'https://u-protect.com.ua/ru/ctechi/filter/parent=1189,1422/';
  var banner = document.getElementById('ctechi-banner');
  var ctaD   = document.getElementById('ctechi-cta-d');
  var ctaM   = document.getElementById('ctechi-cta-m');
  var BANNER_H = 37;

  function detectMobileTemplate() {
    var footer = document.querySelector('footer');
    var footerText = footer ? footer.textContent : '';
    return footerText.includes('Повна версія') || footerText.includes('Полная версия');
  }

  function resetBannerStyles() {
    [
      'position',
      'top',
      'left',
      'right',
      'width',
      'min-width',
      'max-width',
      'margin-left',
      'margin-right',
      'z-index',
      'box-shadow',
      'display'
    ].forEach(function(prop) {
      banner.style.removeProperty(prop);
    });

    banner.style.setProperty('box-sizing', 'border-box', 'important');
  }

  function applyBannerStyles() {
    if (!banner) return;

    var main = document.querySelector('main.main');
    var isMobileTemplate = detectMobileTemplate();
    var visibleWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    var cssWidth = document.documentElement.clientWidth;
    var isDesktopOnMobile = visibleWidth > cssWidth + 100;

    resetBannerStyles();

    if (isMobileTemplate && visibleWidth <= 768) {
      // Справжній мобільний шаблон
      banner.style.setProperty('position', 'fixed', 'important');
      banner.style.setProperty('top', '48px', 'important');
      banner.style.setProperty('left', '0', 'important');
      banner.style.setProperty('right', '0', 'important');
      banner.style.setProperty('width', '100%', 'important');
      banner.style.setProperty('max-width', '100%', 'important');
      banner.style.setProperty('margin-left', '0', 'important');
      banner.style.setProperty('margin-right', '0', 'important');
      banner.style.setProperty('z-index', '399', 'important');
      banner.style.setProperty('box-shadow', '0 2px 4px rgba(0,0,0,0.08)', 'important');

      if (main) {
        main.style.setProperty('padding-top', BANNER_H + 'px', 'important');
      }
      return;
    }

    if (main) {
      main.style.setProperty('padding-top', '0px', 'important');
    }

    if (isDesktopOnMobile) {
      // Повна версія сайту на мобільному
      banner.style.setProperty('position', 'static', 'important');
      banner.style.setProperty('width', 'auto', 'important');
      banner.style.setProperty('min-width', '0', 'important');
      banner.style.setProperty('max-width', 'none', 'important');
      banner.style.setProperty('margin-left', '0', 'important');
      banner.style.setProperty('margin-right', '0', 'important');

      // Даємо браузеру порахувати layout у чистому стані
      void banner.offsetHeight;

      var rect = banner.getBoundingClientRect();

      banner.style.setProperty('position', 'relative', 'important');
      banner.style.setProperty('left', (-rect.left) + 'px', 'important');
      banner.style.setProperty('right', 'auto', 'important');
      banner.style.setProperty('width', visibleWidth + 'px', 'important');
      banner.style.setProperty('min-width', visibleWidth + 'px', 'important');
      banner.style.setProperty('max-width', visibleWidth + 'px', 'important');
      banner.style.setProperty('margin-left', '0', 'important');
      banner.style.setProperty('margin-right', '0', 'important');
      banner.style.setProperty('display', 'block', 'important');
      return;
    }

    // Звичайний десктоп / звичайний потік
    banner.style.setProperty('position', 'static', 'important');
    banner.style.setProperty('width', '100%', 'important');
    banner.style.setProperty('min-width', '0', 'important');
    banner.style.setProperty('max-width', 'none', 'important');
    banner.style.setProperty('margin-left', '0', 'important');
    banner.style.setProperty('margin-right', '0', 'important');
  }

  if (sessionStorage.getItem('ctechi_closed')) {
    banner.style.display = 'none';
    return;
  }

  if (isRu) {
    document.getElementById('ctechi-txt-ua').style.display = 'none';
    document.getElementById('ctechi-txt-ru').style.display = 'block';
    ctaD.href = urlRu;
    ctaD.textContent = 'Посмотреть решения →';
    ctaM.href = urlRu;
    ctaM.textContent = 'Подробнее';
  } else {
    ctaD.href = urlUa;
    ctaM.href = urlUa;
  }

  applyBannerStyles();

  var resizeTimer;
  function debouncedApply() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyBannerStyles, 120);
  }

  window.addEventListener('load', applyBannerStyles);
  window.addEventListener('resize', debouncedApply);
  window.addEventListener('orientationchange', debouncedApply);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', debouncedApply);
  }

  document.getElementById('ctechi-close').addEventListener('click', function() {
    sessionStorage.setItem('ctechi_closed', '1');
    banner.style.display = 'none';

    var main = document.querySelector('main.main');
    if (main) {
      main.style.setProperty('padding-top', '0px', 'important');
    }
  });
})();

// === script #2 (length=18601) ===
document.addEventListener('DOMContentLoaded', function() {
    var path = window.location.pathname;
if (path !== '/' && path !== '/index.html' && path !== '/ru' && path !== '/ru/') {
    return;
}

    const style = document.createElement('style');
    style.textContent = `
        .up-expert-banner {
            margin: 48px auto !important;
            padding: 45px !important;
            width: auto !important;
            box-sizing: border-box !important;
        }
        .up-banner-img-fixed {
            flex: 0 0 40% !important;
            max-width: 485px !important;
            min-width: 240px !important;
            width: 40% !important;
            margin: -45px 0 -45px 0 !important;
            display: flex !important;
            align-self: stretch !important;
        }
        #up-banner-img-container svg,
        #up-banner-img-container img {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
            object-position: center center !important;
            display: block !important;
            border-radius: 0 12px 12px 0 !important;
        }

        /* ПЛАНШЕТ landscape */
@media (min-width: 768px) and (max-width: 1280px) and (orientation: landscape) {
    .up-expert-banner {
        margin: 48px auto !important;
        padding: 32px !important;
        max-width: 1000px !important; 
        gap: 32px !important;
        align-items: stretch !important;
    }
    .up-banner-img-fixed {
        flex: 0 0 44% !important;
        width: 44% !important;
        max-width: 420px !important;
        min-width: 220px !important;
        margin: -32px 0 -32px 0 !important;
        align-self: stretch !important;
    }
}

        /* ПЛАНШЕТ portrait */
@media (min-width: 768px) and (max-width: 1280px) and (orientation: portrait) {
    .up-expert-banner {
        margin: 32px 16px !important;
        padding: 28px !important;
        gap: 24px !important;
        align-items: stretch !important;
    }
    .up-banner-img-fixed {
        flex: 0 0 42% !important;        /* ← було 36%, стало 42% */
        width: 42% !important;            /* ← було 36%, стало 42% */
        max-width: 420px !important;      /* ← було 380px, стало 420px */
        min-width: 180px !important;
        margin: -28px 0 -28px 0 !important;
        align-self: stretch !important;
    }
}
    `;
    document.head.appendChild(style);

    setTimeout(function() {
        var reviewsSection = document.querySelector('.top-reviews, [class*="review"]');

        var bannerHTML = `
            <div class="up-expert-banner" style="background: #EEF1F5; border: none; border-radius: 12px; max-width: 1245px; display: flex; align-items: stretch; justify-content: space-between; gap: 40px; flex-wrap: wrap; box-shadow: none;">
                <div style="flex: 1; min-width: 300px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 10C2 9.09347 2 8.03946 2 6.99988C2 4.23846 4.23858 2 7 2L17 2C19.7614 2 22 4.23858 22 7L22 17C22 19.7614 19.7614 22 17 22L7 22C4.23858 22 2 19.7614 2 17L2 14" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M9.5 11.5L11.5 13.5L15.5 9.5" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span style="color: #6B7280; font-weight: 500; font-size: 13px;" id="up-banner-badge">Експертна консультація</span>
                    </div>
                    <h2 style="font-size: 26px; line-height: 1.3; margin: 0 0 12px 0; color: #1F2937; font-weight: 700;" id="up-banner-heading">Рішення для вашого об'єкта</h2>
                    <p style="color: #1F2937; opacity: 0.8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;" id="up-banner-desc">Опишіть задачу в Telegram або WhatsApp – проаналізуємо вимоги, підберемо<br>конфігурацію системи та перевіримо сумісність обладнання.</p>
                    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <a href="https://t.me/u_protect_bot" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: transparent; border: 1.5px solid #3146C9; color: #3146C9; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none; transition: all 0.2s;">
                            <svg width="20" height="20" viewBox="200 450 600 150" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M226.328 494.722C372.089 431.217 469.285 389.35 517.917 369.122C656.773 311.367 685.625 301.335 704.431 301.004C708.568 300.931 717.816 301.956 723.806 306.817C728.865 310.921 730.257 316.466 730.923 320.357C731.589 324.249 732.418 333.114 731.759 340.041C724.234 419.102 691.675 610.965 675.111 699.515C668.102 736.984 654.301 749.548 640.941 750.777C611.905 753.449 589.856 731.588 561.733 713.153C517.727 684.306 492.866 666.349 450.15 638.2C400.784 605.669 432.786 587.789 460.919 558.569C468.282 550.921 596.215 434.556 598.691 424C599.001 422.68 599.288 417.759 596.365 415.16C593.441 412.562 589.126 413.45 586.012 414.157C581.599 415.159 511.298 461.625 375.11 553.556C355.155 567.259 337.081 573.935 320.887 573.585C303.034 573.199 268.693 563.491 243.164 555.192C211.851 545.014 186.964 539.632 189.132 522.346C190.26 513.343 202.659 504.135 226.328 494.722Z" fill="currentColor"/>
                            </svg>
                            <span class="btn-full-text" id="up-btn-tg-full">Написати в Telegram</span>
                            <span class="btn-short-text" id="up-btn-tg-short" style="display: none;">Telegram</span>
                        </a>
                        <a href="https://wa.me/380632214646" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: transparent; border: 1.5px solid #3146C9; color: #3146C9; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none; transition: all 0.2s;">
                            <svg width="20" height="20" viewBox="0 0 360 362" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M307.546 52.5655C273.709 18.685 228.706 0.0171895 180.756 0C81.951 0 1.53846 80.404 1.50408 179.235C1.48689 210.829 9.74646 241.667 25.4319 268.844L0 361.736L95.0236 336.811C121.203 351.096 150.683 358.616 180.679 358.625H180.756C279.544 358.625 359.966 278.212 360 179.381C360.017 131.483 341.392 86.4547 307.546 52.5741V52.5655ZM180.756 328.354H180.696C153.966 328.346 127.744 321.16 104.865 307.589L99.4242 304.358L43.034 319.149L58.0834 264.168L54.5423 258.53C39.6304 234.809 31.749 207.391 31.7662 179.244C31.8006 97.1036 98.6334 30.2707 180.817 30.2707C220.61 30.2879 258.015 45.8015 286.145 73.9665C314.276 102.123 329.755 139.562 329.738 179.364C329.703 261.513 262.871 328.346 180.756 328.346V328.354ZM262.475 216.777C257.997 214.534 235.978 203.704 231.869 202.209C227.761 200.713 224.779 199.966 221.796 204.452C218.814 208.939 210.228 219.029 207.615 222.011C205.002 225.002 202.389 225.372 197.911 223.128C193.434 220.885 179.003 216.158 161.891 200.902C148.578 189.024 139.587 174.362 136.975 169.875C134.362 165.389 136.7 162.965 138.934 160.739C140.945 158.728 143.412 155.505 145.655 152.892C147.899 150.279 148.638 148.406 150.133 145.423C151.629 142.432 150.881 139.82 149.764 137.576C148.646 135.333 139.691 113.287 135.952 104.323C132.316 95.5909 128.621 96.777 125.879 96.6309C123.266 96.5019 120.284 96.4762 117.293 96.4762C114.302 96.4762 109.454 97.5935 105.346 102.08C101.238 106.566 89.6691 117.404 89.6691 139.441C89.6691 161.478 105.716 182.785 107.959 185.776C110.202 188.767 139.544 234.001 184.469 253.408C195.153 258.023 203.498 260.782 210.004 262.845C220.731 266.257 230.494 265.776 238.212 264.624C246.816 263.335 264.71 253.786 268.44 243.326C272.17 232.866 272.17 223.893 271.053 222.028C269.936 220.163 266.945 219.037 262.467 216.794L262.475 216.777Z" fill="currentColor"/>
                            </svg>
                            <span class="btn-full-text" id="up-btn-wa-full">Написати в WhatsApp</span>
                            <span class="btn-short-text" id="up-btn-wa-short" style="display: none;">WhatsApp</span>
                        </a>
                    </div>
                    <p style="color: #1F2937; opacity: 0.7; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;" id="up-banner-note">Враховуємо особливості об'єкта, бюджет і умови експлуатації</p>
                    <div style="padding-top: 20px; border-top: 1px solid #E5E7EB;">
                        <p style="color: #6B7280; font-size: 14px; margin: 0;" id="up-banner-email">Або напишіть на email: <a href="mailto:sales@u-protect.com.ua" style="color: #3146C9; text-decoration: none;">sales@u-protect.com.ua</a></p>
                    </div>
                </div>
                <div class="up-banner-img-fixed" id="up-banner-img-container" style="align-self: stretch;"></div>
            </div>
            <style>
            .up-expert-banner a[href*="t.me"]:hover,
            .up-expert-banner a[href*="wa.me"]:hover {
                background: #3146C9 !important; color: white !important;
                transform: translateY(-1px); box-shadow: 0 4px 12px rgba(49,70,201,0.2);
            }
            .up-expert-banner a[href*="t.me"]:hover svg,
            .up-expert-banner a[href*="wa.me"]:hover svg { color: white !important; }
            .up-expert-banner a[href^="mailto"]:hover { color: #2537A6 !important; }
            </style>
        `;

        if (reviewsSection) {
            reviewsSection.insertAdjacentHTML('afterend', bannerHTML);
        } else {
            var footer = document.querySelector('footer');
            if (footer) footer.insertAdjacentHTML('beforebegin', bannerHTML);
        }

        var SVG_URL = 'https://u-protect.com.ua/content/uploads/images/site/consultation-banner/2image_chat.svg';
        var PNG_URL = 'https://u-protect.com.ua/content/uploads/images/site/consultation-banner/2image_chat-2.png';
        var container = document.getElementById('up-banner-img-container');
        var isWebKit = /WebKit/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);

        if (isWebKit) {
            container.innerHTML = '<img src="' + PNG_URL + '" alt="Технічний спеціаліст U-PROTECT" style="width:100%;height:100%;object-fit:contain;object-position:center center;display:block;border-radius:0 12px 12px 0;">';
        } else {
            fetch(SVG_URL)
                .then(function(r) { if (!r.ok) throw new Error('failed'); return r.text(); })
                .then(function(svgText) {
                    if (!container) return;
                    container.innerHTML = svgText;
                    var svg = container.querySelector('svg');
                    if (svg) {
                        svg.removeAttribute('width');
                        svg.removeAttribute('height');
                        svg.style.cssText = 'width:100%;height:100%;display:block;border-radius:0 12px 12px 0;';
                    }
                })
                .catch(function() {
                    if (container) container.innerHTML = '<img src="' + PNG_URL + '" alt="Технічний спеціаліст U-PROTECT" style="width:100%;height:100%;object-fit:contain;object-position:center center;display:block;border-radius:0 12px 12px 0;">';
                });
        }

        var isRu = window.location.pathname.indexOf('/ru') === 0;
        if (isRu) {
            document.getElementById('up-banner-badge').textContent = 'Экспертная консультация';
            document.getElementById('up-banner-heading').textContent = 'Решение для вашего объекта';
            document.getElementById('up-banner-desc').innerHTML = 'Опишите задачу в Telegram или WhatsApp – проанализируем требования, подберем<br>конфигурацию системы и проверим совместимость оборудования.';
            document.getElementById('up-btn-tg-full').textContent = 'Написать в Telegram';
            document.getElementById('up-btn-tg-short').textContent = 'Telegram';
            document.getElementById('up-btn-wa-full').textContent = 'Написать в WhatsApp';
            document.getElementById('up-btn-wa-short').textContent = 'WhatsApp';
            document.getElementById('up-banner-note').textContent = 'Учитываем особенности объекта, бюджет и условия эксплуатации';
            document.getElementById('up-banner-email').innerHTML = 'Или напишите на email: <a href="mailto:sales@u-protect.com.ua" style="color: #3146C9; text-decoration: none;">sales@u-protect.com.ua</a>';
        }

        function detectMobileTemplate() {
            var footer = document.querySelector('footer');
            var footerText = footer ? footer.textContent : '';
            return footerText.includes('Повна версія') || footerText.includes('Полная версия');
        }

        function applyMobileBannerStyles() {
            var banner = document.querySelector('.up-expert-banner');
            if (!banner) return;
            var isMobileTemplate = detectMobileTemplate();
            var visibleWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
            var cssWidth = document.documentElement.clientWidth;
            var isDesktopOnMobile = visibleWidth > cssWidth + 100;

            if (!isMobileTemplate && isDesktopOnMobile) {
                banner.style.setProperty('margin', '48px 16px', 'important');
                return;
            }

            if (isMobileTemplate) {
                banner.style.setProperty('margin', '24px 16px', 'important');
                banner.style.setProperty('flex-direction', 'column', 'important');
                banner.style.setProperty('padding', '28px 20px 0 20px', 'important');
                banner.style.setProperty('gap', '0', 'important');
                banner.style.setProperty('align-items', 'stretch', 'important');
                banner.style.setProperty('overflow', 'visible', 'important');

                var heading = banner.querySelector('h2');
                if (heading) heading.style.setProperty('font-size', '22px', 'important');

                var breaks = banner.querySelectorAll('p br');
                breaks.forEach(function(br) { br.style.display = 'none'; });

                var textCol = banner.querySelector('div[style*="flex: 1"]');
                if (textCol) {
                    textCol.style.setProperty('order', '1', 'important');
                    textCol.style.setProperty('min-width', '0', 'important');
                }

                var emailBlock = banner.querySelector('#up-banner-email')?.parentElement;
                if (emailBlock) {
                    emailBlock.style.setProperty('padding-top', '12px', 'important');
                    emailBlock.style.setProperty('margin-bottom', '0', 'important');
                }

                var note = banner.querySelector('#up-banner-note');
                if (note) note.style.setProperty('margin-bottom', '10px', 'important');

                var imgFixed = banner.querySelector('.up-banner-img-fixed');
                if (imgFixed) {
                    imgFixed.style.setProperty('order', '2', 'important');
                    imgFixed.style.setProperty('flex', '0 0 auto', 'important');
                    imgFixed.style.setProperty('width', 'calc(100% + 40px)', 'important');
                    imgFixed.style.setProperty('margin-left', '-20px', 'important');
                    imgFixed.style.setProperty('margin-right', '-20px', 'important');
                    imgFixed.style.setProperty('margin-top', '0', 'important');
                    imgFixed.style.setProperty('margin-bottom', '0', 'important');
                    imgFixed.style.setProperty('max-width', 'none', 'important');
                    imgFixed.style.setProperty('min-width', '0', 'important');
                    imgFixed.style.setProperty('height', 'auto', 'important');
                    imgFixed.style.setProperty('overflow', 'hidden', 'important');
                    imgFixed.style.setProperty('border-radius', '0 0 11px 11px', 'important');

                    var inlineSvg = imgFixed.querySelector('svg');
                    if (inlineSvg) {
                        inlineSvg.style.setProperty('width', '100%', 'important');
                        inlineSvg.style.setProperty('height', 'auto', 'important');
                        inlineSvg.style.setProperty('border-radius', '0', 'important');
                    }
                    var img = imgFixed.querySelector('img');
                    if (img) {
                        img.style.setProperty('width', '100%', 'important');
                        img.style.setProperty('height', 'auto', 'important');
                        img.style.setProperty('object-fit', 'fill', 'important');
                        img.style.setProperty('border-radius', '0', 'important');
                    }
                }

                var buttons = banner.querySelectorAll('a[href*="t.me"], a[href*="wa.me"]');
                buttons.forEach(function(btn) {
                    btn.style.setProperty('flex', '1', 'important');
                    btn.style.setProperty('display', 'inline-flex', 'important');
                    btn.style.setProperty('justify-content', 'center', 'important');
                });

                var fullTexts = banner.querySelectorAll('.btn-full-text');
                fullTexts.forEach(function(el) { el.style.display = 'none'; });

                var shortTexts = banner.querySelectorAll('.btn-short-text');
                shortTexts.forEach(function(el) { el.style.display = 'inline'; });
            }
        }

        applyMobileBannerStyles();
        window.addEventListener('load', applyMobileBannerStyles);
        window.addEventListener('resize', applyMobileBannerStyles);

    }, 500);
});

// === script #3 (length=6293) ===
(function(){
  if (window.U_PROTECT_DELIVERY_INFO_V4) return;
  window.U_PROTECT_DELIVERY_INFO_V4 = true;

  // — CSS grid інжектується зі скрипту щоб завжди бути актуальним —
  const css = `
    .up-delivery-widget .delivery-item {
      display: grid !important;
      grid-template-columns: 24px 1fr !important;
      grid-template-areas: "icon text" ". cost" !important;
      gap: 2px 10px !important;
      align-items: start !important;
      margin-bottom: 16px !important;
    }
    .up-delivery-widget .delivery-cost {
      grid-area: cost !important;
      font-size: 14px;
      line-height: 1.2;
      color: #1F2937;
    }
    @media (min-width: 420px) {
      .up-delivery-widget .delivery-item {
        grid-template-columns: 24px 1fr auto !important;
        grid-template-areas: "icon text cost" !important;
        gap: 0 10px !important;
      }
      .up-delivery-widget .delivery-cost {
        align-self: start !important;
        justify-self: end !important;
        text-align: right !important;
        max-width: 140px !important;
      }
    }
  `;
  const style = document.createElement('style');
  style.id = 'u-protect-delivery-css';
  style.textContent = css;
  document.head.appendChild(style);

  function getLang(){
    const u = location.href.toLowerCase();
    return (u.includes('/ru/') || u.endsWith('/ru') || document.documentElement.lang === 'ru') ? 'ru' : 'uk';
  }

  const T = {
    uk: {
      ship:         { today:'Відправимо сьогодні', tomorrow:'Відправимо завтра', monday:'Відправимо в понеділок' },
      out_of_stock: 'Тимчасово недоступно',
      incoming:     'Можна оформити попереднє замовлення',
      preorder:     'Відправимо після надходження',
      free:         'Безкоштовно*',
      paid:         'За тарифами перевізника',
      footnote:     '* Безкоштовна доставка діє з урахуванням умов для конкретного товару. Остаточну вартість доставки підтверджує менеджер.',
      more:         'Докладніше про доставку',
      deliveryUrl:  'https://u-protect.com.ua/oplata-i-dostavka/'
    },
    ru: {
      ship:         { today:'Отправим сегодня', tomorrow:'Отправим завтра', monday:'Отправим в понедельник' },
      out_of_stock: 'Временно недоступно',
      incoming:     'Можно оформить предзаказ',
      preorder:     'Отправим после поступления',
      free:         'Бесплатно*',
      paid:         'По тарифам перевозчика',
      footnote:     '* Бесплатная доставка действует с учётом условий для конкретного товара. Окончательную стоимость доставки подтверждает менеджер.',
      more:         'Подробнее о доставке',
      deliveryUrl:  'https://u-protect.com.ua/ru/oplata-i-dostavka/'
    }
  };

  function getPrice(){
    const meta = document.querySelector('meta[itemprop="price"]');
    if (meta){ const v = parseFloat(meta.getAttribute('content')); if (!isNaN(v)) return v; }
    const el = document.querySelector('.product-price__item, .product-price__price, .product-price');
    if (el){ const v = parseFloat((el.textContent || '').replace(/[^\d.]/g, '')); if (!isNaN(v)) return v; }
    return null;
  }

  function shippingKey(){
    const n = new Date(), d = n.getDay(), h = n.getHours();
    const w = d === 0 ? false : (d === 6 ? h < 13 : h < 16);
    if (d === 0) return 'monday';
    if (d === 5 && !w) return 'monday';
    if (d === 6) return w ? 'today' : 'monday';
    return w ? 'today' : 'tomorrow';
  }

  function detectStatus(){
    const el = document.querySelector(
      '.product-price__availability, .presence-status, [class*="presence-status"]'
    );
    const raw = (el?.textContent || '').trim().toLowerCase();
    if (/передзамовлення|предзаказ|під замовлення|под заказ|preorder/.test(raw))      return 'preorder';
    if (/очікується надходження|ожидается поступление|очікується|ожидается/.test(raw)) return 'incoming';
    if (/немає в наявності|нет в наличии/.test(raw))                                   return 'out_of_stock';
    return 'in_stock';
  }

  function apply(){
    const list = document.querySelector('.product__section .delivery-list, .delivery-list');
    if (!list) return;

    const t      = T[getLang()];
    const price  = getPrice();
    const isFree = price !== null && price >= 5000;
    const st     = detectStatus();
    const rePickup = /самовивіз|самовывоз/i;

    let descMsg;
    if (st === 'in_stock')          descMsg = t.ship[shippingKey()];
    else if (st === 'out_of_stock') descMsg = t.out_of_stock;
    else if (st === 'incoming')     descMsg = t.incoming;
    else                            descMsg = t.preorder;

    list.querySelectorAll('.delivery-item').forEach(item => {
      const info = item.querySelector('.delivery-info');
      const cost = item.querySelector('.delivery-cost');
      if (!info || !cost) return;

      const title    = (info.querySelector('.delivery-title')?.textContent || '').trim();
      const isPickup = rePickup.test(title);

      // Самовивіз не чіпаємо — його cost статичний в HTML
      if (isPickup) return;

      // НП-рядки: ціна + час відправки (час тільки для товарів в наявності)
      if (price !== null) {
        const priceStr = isFree
          ? '<strong>' + t.free + '</strong>'
          : '<strong>' + t.paid + '</strong>';
        const timeStr = st === 'in_stock'
          ? '<span class="delivery-time">' + descMsg + '</span>'
          : '';
        cost.innerHTML = priceStr + timeStr;
      }
    });

    // Виноска — показуємо тільки при безкоштовній доставці
    const fn = list.querySelector('.delivery-footnote');
    if (fn) fn.style.display = isFree ? 'block' : 'none';

    // Посилання — оновлюємо href з якорем якщо безкоштовна
    const lnk = list.querySelector('.more-info-link a');
    if (lnk) lnk.href = t.deliveryUrl + (isFree ? '#free-delivery-terms' : '');
  }

  function boot(){
    apply();
    setTimeout(apply, 300);
    setTimeout(apply, 800);
    setTimeout(apply, 1500);
    setTimeout(apply, 3000);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(boot, 40);
  else document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 40));
})();

// === script #4 (length=524) ===
function removeBr() {
  const heading = document.querySelector('.recentProducts-head .h2');
  if (heading && heading.innerHTML.includes('<br')) {
    heading.innerHTML = heading.innerHTML.replace(/<br\s*\/?>/gi, ' ');
    console.log('Removed <br>');
  }
}
document.addEventListener('DOMContentLoaded', function() {
  removeBr(); // Перша спроба одразу
  // Спостерігаємо за змінами DOM
  const observer = new MutationObserver(removeBr);
  observer.observe(document.body, { childList: true, subtree: true });
});

// === script #5 (length=1349) ===
(function(){
  var root = document.getElementById('hs-xray-guide');
  if(!root) return;

  // Плавні якорі (в межах блоку)
  root.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="#"]');
    if(!a) return;
    var id = a.getAttribute('href');
    if(!id || id.length < 2) return;
    var target = root.querySelector(id);
    if(!target) return;
    e.preventDefault();
    try{ target.scrollIntoView({behavior:'smooth', block:'start'}); }catch(_){ location.hash = id; }
    if(history && history.replaceState){ history.replaceState(null,'',id); }
  });

  // Прогрес читання
  var bar = root.querySelector('.hsx-progress');
  if(!bar) return;
  function clamp(v,min,max){ return v<min?min:(v>max?max:v); }
  function update(){
    var articleTop  = root.getBoundingClientRect().top + (window.pageYOffset||document.documentElement.scrollTop);
    var scrollY     = window.pageYOffset || document.documentElement.scrollTop;
    var start       = articleTop;
    var end         = start + root.offsetHeight - window.innerHeight;
    var ratio       = clamp((scrollY - start) / Math.max(1, end - start), 0, 1);
    bar.style.backgroundSize = (ratio*100) + '% 100%';
  }
  update();
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
})();

// === script #6 (length=3935) ===
(function () {
    function isRuPage() {
        return window.location.pathname.indexOf('/ru/') === 0;
    }
    function normalizeText(str) {
        return (str || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    }
    function formatNum(num, unit) {
        return num.replace(',', '.') + '\u00a0' + unit;
    }
    function findWarrantyValue() {
        var isRu = isRuPage();
        var months = isRu ? 'мес.' : 'міс.';
        var years  = isRu ? 'г.'   : 'р.';
        var labelPatterns = isRu
            ? ['гарантийный срок', 'гарантия']
            : ['гарантійний термін', 'гарантія'];

        // Стратегія 1: таблиця характеристик — th і td окремо
        var rows = document.querySelectorAll('tr');
        for (var i = 0; i < rows.length; i++) {
            var cells = Array.from(rows[i].querySelectorAll('th, td'));
            if (cells.length < 2) continue;
            var labelText = normalizeText(cells[0].textContent);
            var valueText = (cells[1].textContent || '')
                .replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
            var isMatch = labelPatterns.some(function (p) {
                return labelText.indexOf(p) !== -1;
            });
            if (!isMatch) continue;
            var unitInLabel = /міс|мес/i.test(labelText) ? months
                            : /рік|год\b|лет\b/i.test(labelText) ? years
                            : '';
            var numMatch = valueText.match(/(\d+(?:[.,]\d+)?)/);
            if (numMatch) {
                var num = numMatch[1];
                var unit = unitInLabel
                    || (/міс|мес/i.test(valueText) ? months
                        : /рік|год|р\./i.test(valueText) ? years
                        : parseInt(num, 10) > 2 ? months : years);
                return formatNum(num, unit);
            }
            if (valueText && valueText.length < 40) return valueText;
        }

        // Стратегія 2: inline текст
        var nodes = document.querySelectorAll('li, p, span, div');
        for (var j = 0; j < nodes.length; j++) {
            var raw = nodes[j].innerText || nodes[j].textContent || '';
            if (!raw || raw.length > 300) continue;
            var norm = normalizeText(raw);
            var found = labelPatterns.some(function (p) {
                return norm.indexOf(p) !== -1;
            });
            if (!found) continue;
            var mm = raw.match(/(\d+(?:[.,]\d+)?)\s*(міс\.?|мес\.?|місяц|месяц)/i);
            if (mm) return formatNum(mm[1], months);
            var yy = raw.match(/(\d+(?:[.,]\d+)?)\s*(р\.?|рок|г\.?|год|лет)/i);
            if (yy) return formatNum(yy[1], years);
        }
        return '';
    }

    function applyWarranty() {
        var root = document.getElementById('upWarrantyBlock');
        if (!root) return false;
        var valueEl = root.querySelector('.up-warranty-value');
        if (!valueEl) {
            var mainDiv = root.querySelector('.up-warranty-main');
            if (!mainDiv) return false;
            valueEl = document.createElement('span');
            valueEl.className = 'up-warranty-value';
            mainDiv.appendChild(valueEl);
        }
        var found = findWarrantyValue();
        if (found) {
            valueEl.textContent = ' \u00B7\u00A0' + found;
            root.classList.add('has-value');
            return true;
        }
        return false;
    }

    function runWithRetry() {
        var attempts = 0;
        function tryApply() {
            attempts++;
            if (applyWarranty()) return;
            if (attempts < 12) setTimeout(tryApply, 500);
        }
        tryApply();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runWithRetry);
    } else {
        runWithRetry();
    }
})();

// === script #7 (length=6639) ===
(function () {
    'use strict';

    var scrollY = 0;

    function getModal() {
        return document.querySelector('[data-up-consult-modal]');
    }

    function getForm() {
        return document.querySelector('[data-up-consult-form]');
    }

    function getPhoneInput() {
        return document.getElementById('phone');
    }

    function moveModalToBody() {
        var modal = getModal();
        if (modal && !modal.dataset.movedToBody) {
            document.body.appendChild(modal);
            modal.dataset.movedToBody = 'true';
        }
    }

    function lockScroll() {
        scrollY = window.scrollY || window.pageYOffset || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = '-' + scrollY + 'px';
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
    }

    function openModal() {
        moveModalToBody();
        var modal = getModal();
        if (!modal) return;
        modal.classList.add('is-open');
        lockScroll();
    }

    function closeModal() {
        var modal = getModal();
        if (!modal) return;
        modal.classList.remove('is-open');
        unlockScroll();
    }

    function initPhoneMask() {
        var phoneInput = getPhoneInput();
        if (!phoneInput || phoneInput.dataset.maskReady) return;

        phoneInput.dataset.maskReady = 'true';

        phoneInput.addEventListener('focus', function () {
            if (this.value === '') this.value = '+380';
        });

        phoneInput.addEventListener('input', function () {
            var value = this.value;
            if (!value.startsWith('+380')) {
                this.value = '+380';
                return;
            }

            var numbers = value.slice(4).replace(/\D/g, '');
            if (numbers.length > 9) numbers = numbers.slice(0, 9);

            var formatted = '+380';
            if (numbers.length > 0) formatted += ' ' + numbers.substring(0, 2);
            if (numbers.length > 2) formatted += ' ' + numbers.substring(2, 5);
            if (numbers.length > 5) formatted += ' ' + numbers.substring(5, 7);
            if (numbers.length > 7) formatted += ' ' + numbers.substring(7, 9);

            this.value = formatted;
        });

        phoneInput.addEventListener('keydown', function (e) {
            if ((e.key === 'Backspace' || e.key === 'Delete') && this.value === '+380') {
                e.preventDefault();
            }
        });
    }

    function initFormSubmit() {
        var form = getForm();
        if (!form || form.dataset.submitReady) return;

        form.dataset.submitReady = 'true';

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var submitBtn = form.querySelector('.up-consult-submit-btn');
            var originalText = submitBtn ? submitBtn.textContent : '';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = submitBtn.dataset.sending || 'Відправка...';
            }

            try {
                var response = await fetch('https://keycrm-proxy.u-protect.workers.dev/create-lead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        full_name: (document.getElementById('name') || {}).value ? document.getElementById('name').value.trim() : '',
                        email: (document.getElementById('email') || {}).value ? document.getElementById('email').value.trim() : '',
                        phone: (document.getElementById('phone') || {}).value ? document.getElementById('phone').value.trim() : '',
                        topic: (document.getElementById('topic') || {}).value || '',
                        message: (document.getElementById('message') || {}).value ? document.getElementById('message').value.trim() : '',
                        page_url: window.location.href
                    })
                });

                if (response.ok) {
                    var successMsg = submitBtn.dataset.success || "Дякуємо! Ваша заявка успішно надіслана. Ми зв'яжемося з вами найближчим часом.";
                    alert(successMsg);
                    form.reset();
                    var phoneInput = getPhoneInput();
                    if (phoneInput) phoneInput.value = '+380';
                    closeModal();
                } else {
                    var errorMsg = submitBtn.dataset.error || 'На жаль, виникла помилка. Спробуйте ще раз або зателефонуйте нам.';
                    alert(errorMsg);
                }
            } catch (error) {
                var connectionMsg = submitBtn.dataset.connection || "Помилка з'єднання. Перевірте інтернет-з'єднання.";
                alert(connectionMsg);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }

    document.addEventListener('click', function (e) {
        var openBtn = e.target.closest('[data-up-consult-open]');
        if (openBtn) {
            e.preventDefault();
            openModal();
            initPhoneMask();
            initFormSubmit();
            return;
        }

        var closeBtn = e.target.closest('.up-consult-close-btn');
        if (closeBtn) {
            e.preventDefault();
            closeModal();
            return;
        }

        var modal = getModal();
        if (modal && e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    function init() {
        moveModalToBody();
        initPhoneMask();
        initFormSubmit();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
