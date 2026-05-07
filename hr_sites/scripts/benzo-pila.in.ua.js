// source: https://benzo-pila.in.ua/
// extracted: 2026-05-07T21:19:08.446Z
// scripts: 2

// === script #1 (length=5515) ===
(function(){
  var BASE='https://obp.pp.ua/search-v2/search.html';
  // Селектори тригерів Хорошоп
  var TOGGLE='a[data-button-action="search-toggle"],a[href="#search-results"],.search__toggle';
  var INPUT='.search.j-search input.search__input[name="q"],input.search__input[name="q"]';

  var bound=new WeakSet(),overlay,frame,ready=false;

  // ── DOM ──
  function init(){
    if(document.getElementById('ms-overlay'))return;
    var d=document.createElement('div');
    d.innerHTML=
      '<div id="ms-overlay" aria-hidden="true">'+
        '<div id="ms-modal" role="dialog" aria-modal="true">'+
          '<div id="ms-head">'+
            '<div id="ms-title">Пошук</div>'+
            '<button id="ms-close" type="button">✕ Закрити</button>'+
          '</div>'+
          '<div id="ms-frame-slot"></div>'+
        '</div>'+
      '</div>';
    document.body.appendChild(d.firstChild);
    overlay=document.getElementById('ms-overlay');

    // Зупиняємо кліки всередині модалки
    var modal=document.getElementById('ms-modal');
    ['click','pointerdown'].forEach(function(ev){
      modal.addEventListener(ev,function(e){e.stopPropagation()},true);
    });
    modal.addEventListener('touchstart',function(e){e.stopPropagation()},{capture:true,passive:true});
  }

  // iframe створюємо ТІЛЬКИ при першому відкритті (lazy)
  function ensureFrame(){
    if(frame)return frame;
    var slot=document.getElementById('ms-frame-slot');
    if(!slot)return null;
    var f=document.createElement('iframe');
    f.id='ms-frame';
    f.setAttribute('loading','lazy');
    f.setAttribute('referrerpolicy','no-referrer');
    slot.replaceWith(f);
    frame=f;
    return f;
  }

  function isOpen(){return overlay&&overlay.classList.contains('open')}

  function getQ(){
    var el=document.querySelector(INPUT)||document.querySelector('input[name="q"]')||document.querySelector('input[type="search"]');
    return(el&&el.value)?el.value.trim():'';
  }

  function open(q){
    init();
    var f=ensureFrame();
    if(!f)return;

    // Формуємо URL
    var url=BASE;
    if(q)url+='&q='+encodeURIComponent(q);
    // Не перезавантажуємо iframe якщо URL той самий
    if(f.src!==url&&f.contentWindow){
      // Якщо iframe вже завантажений — передаємо через postMessage (швидше)
      if(ready&&f.contentWindow){
        try{f.contentWindow.postMessage({type:'ms-search',q:q||''},'*');} catch(_){f.src=url;}
      }else{
        f.src=url;
      }
    }else if(!f.src||f.src==='about:blank'){
      f.src=url;
    }

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('ms-lock');
    document.body.classList.add('ms-lock');
    // Анімація (наступний кадр)
    requestAnimationFrame(function(){overlay.classList.add('visible')});
  }

  function close(){
    if(!overlay)return;
    overlay.classList.remove('visible');
    // Чекаємо кінець анімації
    setTimeout(function(){
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden','true');
      document.documentElement.classList.remove('ms-lock');
      document.body.classList.remove('ms-lock');
    },220);
  }

  function stop(e){
    if(!e)return;
    if(e.cancelable)e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();
  }

  function inOverlay(e){
    if(!e||!e.target)return false;
    var t=e.target;
    if(!(t instanceof HTMLElement))return false;
    return!!(t.closest&&t.closest('#ms-overlay'));
  }

  // ── Binding ──
  function bindNode(el){
    if(!el||bound.has(el))return;
    bound.add(el);
    var h=function(e){
      if(inOverlay(e)||isOpen())return;
      stop(e);
      try{el.blur()}catch(_){}
      open(getQ());
    };
    el.addEventListener('pointerdown',h,true);
    el.addEventListener('click',h,true);
    el.addEventListener('touchstart',h,{capture:true,passive:false});
  }

  function bindInput(inp){
    if(!inp||bound.has(inp))return;
    bound.add(inp);
    var h=function(e){
      if(inOverlay(e)||isOpen())return;
      stop(e);
      open(inp.value||'');
      try{inp.blur()}catch(_){}
    };
    ['focusin','click','pointerdown'].forEach(function(ev){inp.addEventListener(ev,h,true)});
    inp.addEventListener('touchstart',h,{capture:true,passive:false});
  }

  function bindAll(){
    document.querySelectorAll(TOGGLE).forEach(bindNode);
    document.querySelectorAll(INPUT).forEach(bindInput);
  }

  // ── Init ──
  function onReady(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()}

  onReady(function(){
    init();
    bindAll();

    // Закриття
    document.addEventListener('click',function(e){
      var t=e.target;
      if(t instanceof HTMLElement&&(t.id==='ms-overlay'||t.id==='ms-close'))close();
    },true);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});

    // Перевʼязуємо при змінах DOM (Horoshop SPA)
    var root=document.getElementById('header')||document.querySelector('header.header')||document.documentElement;
    new MutationObserver(bindAll).observe(root,{subtree:true,childList:true,attributes:true});

    // Слухаємо postMessage від iframe (для ready-статусу)
    window.addEventListener('message',function(e){
      if(e.data&&e.data.type==='ms-ready')ready=true;
    });
  });
})();

// === script #2 (length=2116) ===
(function(){ document.jivositeloaded=0;var widget_id = 'd08H6wOHTk';var d=document;var w=window;function l(){var s = d.createElement('script'); s.type = 'text/javascript'; s.async = true; s.src = '//code.jivosite.com/script/widget/'+widget_id; var ss = document.getElementsByTagName('script')[0]; ss.parentNode.insertBefore(s, ss);}//эта строка обычная для кода JivoSite
function zy(){
    //удаляем EventListeners
    if(w.detachEvent){//поддержка IE8
        w.detachEvent('onscroll',zy);
        w.detachEvent('onmousemove',zy);
        w.detachEvent('ontouchmove',zy);
        w.detachEvent('onresize',zy);
    }else {
        w.removeEventListener("scroll", zy, false);
        w.removeEventListener("mousemove", zy, false);
        w.removeEventListener("touchmove", zy, false);
        w.removeEventListener("resize", zy, false);
    }
    //запускаем функцию загрузки JivoSite
    if(d.readyState=='complete'){l();}else{if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}
    //Устанавливаем куку по которой отличаем первый и второй хит
    var cookie_date = new Date ( );
    cookie_date.setTime ( cookie_date.getTime()+60*60*28*1000); //24 часа для Москвы
    d.cookie = "JivoSiteLoaded=1;path=/;expires=" + cookie_date.toGMTString();
}
if (d.cookie.search ( 'JivoSiteLoaded' )<0){//проверяем, первый ли это визит на наш сайт, если да, то назначаем EventListeners на события прокрутки, изменения размера окна браузера и скроллинга на ПК и мобильных устройствах, для отложенной загрузке JivoSite.
    if(w.attachEvent){// поддержка IE8
        w.attachEvent('onscroll',zy);
        w.attachEvent('onmousemove',zy);
        w.attachEvent('ontouchmove',zy);
        w.attachEvent('onresize',zy);
    }else {
        w.addEventListener("scroll", zy, {capture: false, passive: true});
        w.addEventListener("mousemove", zy, {capture: false, passive: true});
        w.addEventListener("touchmove", zy, {capture: false, passive: true});
        w.addEventListener("resize", zy, {capture: false, passive: true});
    }
}else {zy();}
})();
