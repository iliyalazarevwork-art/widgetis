// source: https://krokwood.com/
// extracted: 2026-05-07T21:19:38.214Z
// scripts: 1

// === script #1 (length=751) ===
(()=>{const h=e=>e&&e.style.setProperty("display","none","important"),r=()=>{document.querySelectorAll(".footer__development,.footer__development-container,.footer__development-link,.footer__development-logo").forEach(e=>{h(e);e.style.setProperty("visibility","hidden","important");e.style.setProperty("height","0","important");e.style.setProperty("overflow","hidden","important")});document.querySelectorAll('a.footer__development-link').forEach(a=>{if(a.textContent.includes("Працює на платформі Хорошоп")){let e=a.closest(".footer__development")||a;h(e);e.remove?.()}})};addEventListener("DOMContentLoaded",r);addEventListener("load",r);new MutationObserver(r).observe(document.documentElement,{childList:true,subtree:true});setInterval(r,700)})();
