// source: https://trevi.ua/
// extracted: 2026-05-07T21:23:01.511Z
// scripts: 3

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

// === script #2 (length=569) ===
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', '', 'auto');
  ga('require', 'ec');
  ga('set', '&cu', GLOBAL.currency.iso);

   // заменяется кодом инициализации события с расположением "Внутри кода инициализации маркетинговой системы"
  
  ga('send', 'pageview');

// === script #3 (length=1223) ===
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.href.indexOf('checkout/complete') !== -1) {
        var utmSource = getCookie('utm_source');
        var sauid = getCookie('SAuid');
        if (utmSource === 'sellaction.net' && sauid) {
            var cartTotal = '';
            var orderId = '';
            var tariffid = '4795';
            sendConversionPixel(sauid, tariffid, cartTotal, orderId);
        }
    }
});

function sendConversionPixel(sauid, tariffid, cartTotal, orderId) {
    var image = new Image();
    image.onload = function() {};
    image.onerror = function() {};
    image.src = 'https://sellaction.net/reg.php?id=' + 
                encodeURIComponent(sauid) + '-' + 
                encodeURIComponent(tariffid) + '_' + 
                encodeURIComponent(cartTotal) + '&order_id=' + encodeURIComponent(orderId);
    image.style.display = 'none';
    document.body.appendChild(image);
}

function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}
