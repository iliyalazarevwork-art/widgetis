// source: https://xn--h1adheeb.com.ua/
// extracted: 2026-05-07T21:23:13.501Z
// scripts: 5

// === script #1 (length=546) ===
document.addEventListener("DOMContentLoaded", function() {
      // Відображення поп-апу з акціями
      if (!localStorage.getItem("promoPopupShown")) {
        setTimeout(() => {
          localStorage.setItem("promoPopupShown", true);
        }, 3000);
      }

      // Відстеження кліків на кнопки
      document.querySelectorAll(".buy-button").forEach(button => {
        button.addEventListener("click", function() {
          console.log("Користувач натиснув 'Купити':", this.dataset.productId);
        });
      });
    });

// === script #2 (length=650) ===
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

// === script #3 (length=1162) ===
// Функція для перевірки, чи знаходиться користувач на сторінці підтвердження замовлення
  function isOrderConfirmationPage() {
    // Стандартні варіанти URL сторінки успішного замовлення
    return window.location.href.includes('/success') ||
           window.location.href.includes('/thank') ||
           window.location.href.includes('/order') ||
           window.location.href.includes('/checkout/success');
  }

  if (isOrderConfirmationPage()) {
    window.renderOptIn = function () {
      window.gapi.load('surveyoptin', function () {
        window.gapi.surveyoptin.render({
          "merchant_id": "311434166",        
          "order_id": "{{ order.id }}",         
          "email": "{{ CUSTOMER_EMAIL }}",          
          "delivery_country": "UA",              
          "estimated_delivery_date": getDeliveryDate()
        });
      });
    };
  }

  // Функція для розрахунку орієнтовної дати доставки (поточна дата + 5 днів)
  function getDeliveryDate() {
    var date = new Date();
    date.setDate(date.getDate() + 5); // змініть кількість днів за потреби
    return date.toISOString().split('T')[0];
  }

// === script #4 (length=597) ===
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'https://xn--h1adheeb.com.ua/', 'auto');
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
