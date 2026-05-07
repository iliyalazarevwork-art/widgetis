// source: https://milkyvape.shop/
// extracted: 2026-05-07T21:18:50.355Z
// scripts: 2

// === script #1 (length=2543) ===
if (!window.faqIsAddedToGoogle) {
  window.faqIsAddedToGoogle = true;
  var ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Що таке подік і як його вибрати?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Подік — це побутова назва pod системи, компактного пристрою для вейпінгу. При виборі важливі автономність акумулятора, тип картриджа, опір і сумісність з рідиною. Під більшість pod систем підходять сольові рідини з міцністю 25–50 мг. Переглянути доступні моделі можна в розділі pod систем на milkyvape.shop."
        }
      },
      {
        "@type": "Question",
        "name": "Що можна купити в Milky Vape?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "У каталозі є pod системи, електронні сигарети, рідини для вейпа, картриджі, самозаміс, комплектуючі та товари популярних брендів."
        }
      },
      {
        "@type": "Question",
        "name": "З чого почати вибір?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Якщо потрібен новий пристрій, починайте з формату, автономності та типу картриджа. Якщо пристрій уже є, спочатку перевірте сумісні розхідники, а потім підбирайте рідину."
        }
      },
      {
        "@type": "Question",
        "name": "Як не помилитися з картриджем?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Потрібно звірити точну модель пристрою, серію картриджа, опір і заявлену сумісність. Якщо назви схожі, але не однакові, краще уточнити перед покупкою."
        }
      },
      {
        "@type": "Question",
        "name": "Чи є доставка по Україні?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Так, замовлення можна оформити з доставкою по Україні. Умови оплати, відправки та отримання варто перевірити перед оформленням покупки."
        }
      },
      {
        "@type": "Question",
        "name": "Чим самозаміс відрізняється від готової рідини?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Готова рідина вже підготовлена до використання, а самозаміс — це набір компонентів для приготування за заданою рецептурою. Його частіше обирають, коли потрібен більший запас."
        }
      }
    ]
  });
  document.head.appendChild(ld);
}

// === script #2 (length=4091) ===
(function(){
  "use strict";

  var MVFA = (function(){
    var TIMER_KEY  = 'mvfa_timer_iso';
    var SUCCESS_MS = 60 * 1000;

    function pad(n){ return (n<10?'0':'')+n; }

    function getDurationMs(){
      var el = document.querySelector('[data-mvbanner] [data-mv-slot="fomo"] [data-mv-timer][data-mv-mins]');
      var mins = el ? parseInt(el.getAttribute('data-mv-mins'),10) : 18;
      if(!mins || mins < 1 || !isFinite(mins)) mins = 18;
      return mins * 60 * 1000;
    }
    var DURATION = getDurationMs();

    function ensureEnds(){
      var iso = null;
      try{ iso = localStorage.getItem(TIMER_KEY); }catch(e){}
      var d = iso ? new Date(iso) : null;
      if(!d || isNaN(d.getTime()) || d < new Date()){
        d = new Date(Date.now() + DURATION);
        try{ localStorage.setItem(TIMER_KEY, d.toISOString()); }catch(e){}
      }
      return d;
    }
    var ends = ensureEnds();

    function fmt(diff){
      var h=Math.floor(diff/36e5), m=Math.floor((diff%36e5)/6e4), s=Math.floor((diff%6e4)/1e3);
      return h>0 ? (h+':'+pad(m)+':'+pad(s)) : (pad(m)+':'+pad(s));
    }

    function showSlot(root, name){
      if(!root) return;
      var f = root.querySelector('[data-mv-slot="fomo"]');
      var s = root.querySelector('[data-mv-slot="success"]');
      if(f) f.hidden = (name!=='fomo');
      if(s) s.hidden = (name!=='success');
    }

    function initOnLoad(){
      document.querySelectorAll('[data-mvbanner]').forEach(function(b){
        showSlot(b,'fomo');
      });
    }

    function tick(){
      try{
        var diff = ends - Date.now();
        if(diff <= 0){ ends = ensureEnds(); diff = ends - Date.now(); }
        var txt = fmt(diff);
        document.querySelectorAll('[data-mvbanner] [data-mv-slot="fomo"] [data-mv-timer]')
          .forEach(function(n){ n.textContent = txt; });
      }catch(e){}
    }

    function onCopy(e){
      var btn = e.target.closest('[data-mv-copy]');
      if(!btn) return;
      var root = btn.closest('[data-mvbanner]');
      if(!root) return;

      var code = btn.getAttribute('data-code') || (btn.textContent||'').trim();

      function renderSuccess(){
        var s = root.querySelector('[data-mv-slot="success"]');
        if(!s) return;
        var copiedTxt = root.getAttribute('data-success-copied') || '✓ Промокод скопійовано';
        var ctaTxt    = root.getAttribute('data-success-cta')    || 'Перейти до покупки →';
        var cta = root.querySelector('[data-fomo-cta]');
        var href = cta ? cta.getAttribute('href') : '#';
        s.innerHTML =
          '<span style="background:#22C55E;color:#0B1B12;padding:6px 12px;border-radius:999px;font-weight:800;">'+copiedTxt+'</span>' +
          '<a href="'+href.replace(/"/g,'&quot;')+'" style="color:#22C55E;text-decoration:underline;font-weight:800;margin-left:12px;">'+ctaTxt+'</a>';
      }

      function afterCopy(){
        showSlot(root,'success');
        renderSuccess();
        setTimeout(function(){
          showSlot(root,'fomo');
        }, SUCCESS_MS);
      }

      function fallbackCopy(){
        var ta = document.createElement('textarea');
        ta.value = code;
        ta.setAttribute('readonly','');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch(err){}
        document.body.removeChild(ta);
        afterCopy();
      }

      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(code).then(afterCopy).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    }

    function init(){
      initOnLoad();
      tick();
      setInterval(tick,1000);
      document.addEventListener('click', onCopy, false);
    }

    return { init:init };
  })();

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', MVFA.init);
  } else {
    MVFA.init();
  }
})();
