// source: https://flames.com.ua/
// extracted: 2026-05-07T21:20:26.185Z
// scripts: 3

// === script #1 (length=664) ===
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

// === script #2 (length=740) ===
document.addEventListener('DOMContentLoaded', () => {
    // Знайти всі блоки з класом checkout-step
    const checkoutSteps = document.querySelectorAll('.checkout-step');

    // Перевірити, чи є такі блоки
    if (checkoutSteps.length === 0) {
        // Якщо немає жодного блоку, припиняємо виконання
        return;
    }

    checkoutSteps.forEach(step => {
        // Знайти textarea з name="Recipient[comment]"
        const textarea = step.querySelector('textarea[name="Recipient[comment]"]');

        // Якщо textarea знайдена, додати placeholder
        if (textarea) {
            textarea.setAttribute('placeholder', 'Якщо вам потрібно змолоти каву, вкажіть в коментарі до замовлення');
        }
    });
});

// === script #3 (length=569) ===
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', '', 'auto');
  ga('require', 'ec');
  ga('set', '&cu', GLOBAL.currency.iso);

   // заменяется кодом инициализации события с расположением "Внутри кода инициализации маркетинговой системы"
  
  ga('send', 'pageview');
