// source: https://3dprofi.com.ua/
// extracted: 2026-05-07T21:20:38.839Z
// scripts: 2

// === script #1 (length=812) ===
function enhanceCallbackAnchors(root = document){
    root.querySelectorAll('a.banner-a[href*="#callback-form"]').forEach(a => {
      a.setAttribute('data-panel', '');
      a.setAttribute('data-menu', 'callback');
    });
    root.querySelectorAll('a[href="#callback-form"]:not([data-menu])').forEach(a => {
      a.setAttribute('data-panel', '');
      a.setAttribute('data-menu', 'callback');
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
    enhanceCallbackAnchors();
  });
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        enhanceCallbackAnchors(node);
      });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

// === script #2 (length=539) ===
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
