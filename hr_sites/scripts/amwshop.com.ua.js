// source: https://amwshop.com.ua/
// extracted: 2026-05-07T21:20:44.947Z
// scripts: 1

// === script #1 (length=666) ===
(function(d, w) {
    var scai = function() {
      if (!d.getElementById('scrooge_aic_container')) {
        var sc = document.createElement('script');
        sc.type = 'text/javascript';
        sc.async = true;
        sc.src = "//stat.ai.scroogefrog.com/queue2/c_q2_ai.js?u=" + encodeURIComponent(document.URL) + "&r=" + Math.random();
        sc.id = 'scrooge_aic_container';
        var c = document.getElementById('scrooge_aic');
        c.parentNode.insertBefore(sc, c);
      }
    };
    if (w.opera == "[object Opera]") {
      d.addEventListener("DOMContentLoaded", scai, false);
    } else {
      scai();
    }
  })(document, window);
