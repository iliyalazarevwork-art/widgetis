// source: https://malva-dreams.com.ua/
// extracted: 2026-05-07T21:19:40.787Z
// scripts: 2

// === script #1 (length=528) ===
let URLparams = (new URL(document.location)).searchParams,
mobileApp = URLparams.get("mobileApp");
if(mobileApp !== null) {
    $(".social-icons").remove();
    $(".footer").remove();
    $('a[href]').each(function() {
        var href = $(this).attr('href');

        if(href) {

            if(href.indexOf('#') != -1) return true;
            if(href.indexOf('?') != -1) href = href + '&mobileApp=1';
            else href = href + '?mobileApp=1';

            $(this).attr('href', href);
        }
    });
}

// === script #2 (length=583) ===
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-198544733-1', 'auto');
  ga('require', 'ec');
  ga('set', '&cu', GLOBAL.currency.iso);

   // заменяется кодом инициализации события с расположением "Внутри кода инициализации маркетинговой системы"
  
  ga('send', 'pageview');
