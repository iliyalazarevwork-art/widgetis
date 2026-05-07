// source: https://pantoys.com.ua/
// extracted: 2026-05-07T21:22:18.141Z
// scripts: 5

// === script #1 (length=650) ===
window.fbAsyncInit = function() {
                FB.init({
                    appId            : '',
                    autoLogAppEvents : true,
                    xfbml            : true,
                    version          : 'v2.12'
                });
            };
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

// === script #2 (length=1048) ===
function renderAll() {
    // Віджет Customer Reviews (опитування після покупки)
    window.renderOptIn && window.renderOptIn();

    // Віджет рейтингового бейджа
    window.gapi.load('ratingbadge', function() {
      window.gapi.ratingbadge.render(
        document.getElementById("google-rating-badge"),
        { "merchant_id": 5345276030 } // Твій Merchant ID
      );
    });
  }

  // Налаштування для опитування після покупки
  window.renderOptIn = function() {
    window.gapi.load('surveyoptin', function() {
      window.gapi.surveyoptin.render({
        // ОБОВ'ЯЗКОВІ ПОЛЯ
        "merchant_id": 5345276030,
        "order_id": "ORDER_ID",                       // Динамічно підставляється CMS
        "email": "CUSTOMER_EMAIL",                   // Динамічно
        "delivery_country": "UA",                    // Для України
        "estimated_delivery_date": "YYYY-MM-DD",     // Дата доставки

        // НЕОБОВ'ЯЗКОВІ ПОЛЯ
        "products": [{"gtin":"GTIN1"}, {"gtin":"GTIN2"}]
      });
    });
  }

// === script #3 (length=880) ===
document.addEventListener("DOMContentLoaded", function () {
      let userLang = navigator.language || navigator.userLanguage;
      userLang = userLang.substring(0, 2);

      if (!localStorage.getItem("language")) {
          document.getElementById("languageModal").style.display = "flex";
      } else {
          applyLanguage(localStorage.getItem("language"));
      }
  });

  function setLanguage(lang) {
      localStorage.setItem("language", lang);
      applyLanguage(lang);
      document.getElementById("languageModal").style.display = "none";
  }

  function applyLanguage(lang) {
      document.documentElement.lang = lang;
      const title = document.querySelector('h1');
      title.textContent = lang === 'uk' ? 'Дитячі іграшки - купити онлайн' : 'Детские игрушки - купить онлайн';
      console.log(`Мова сайту встановлена: ${lang}`);
  }

// === script #4 (length=569) ===
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', '', 'auto');
  ga('require', 'ec');
  ga('set', '&cu', GLOBAL.currency.iso);

   // заменяется кодом инициализации события с расположением "Внутри кода инициализации маркетинговой системы"
  
  ga('send', 'pageview');

// === script #5 (length=539) ===
(function(d) {
        d.querySelectorAll('.j-phone-item').forEach(function (el) {
            el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
        })
    })(document);
    (function(d, w, s) {
        var widgetHash = '', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
        ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
        var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
      })(document, window, 'script');
