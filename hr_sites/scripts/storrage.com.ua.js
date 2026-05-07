// source: https://storrage.com.ua/
// extracted: 2026-05-07T21:22:49.029Z
// scripts: 7

// === script #1 (length=11070) ===
(function(){
  'use strict';

  var animatedStats=new Set();
  function startStat(card){
    if(animatedStats.has(card))return;
    animatedStats.add(card);
    var num=card.querySelector('.sl-stat__num');
    if(!num)return;
    var mode=card.getAttribute('data-mode'),prefix=card.getAttribute('data-prefix')||'',
        suffix=card.getAttribute('data-suffix')||'',to=parseFloat(card.getAttribute('data-to')),
        from=parseFloat(card.getAttribute('data-from')),DUR=1500;
    function easeOut(p){return 1-Math.pow(1-p,3);}
    num.classList.add('popped');
    var st=null;
    if(mode==='int'){(function step(ts){if(!st)st=ts;var p=Math.min((ts-st)/DUR,1);num.textContent=prefix+Math.round(easeOut(p)*to)+suffix;if(p<1)requestAnimationFrame(step);else num.textContent=prefix+to+suffix;})(performance.now());}
    if(mode==='float'){(function step(ts){if(!st)st=ts;var p=Math.min((ts-st)/DUR,1);num.textContent=(easeOut(p)*to).toFixed(1)+suffix;if(p<1)requestAnimationFrame(step);else num.textContent=to.toFixed(1)+suffix;})(performance.now());}
    if(mode==='range'){(function step(ts){if(!st)st=ts;var p=Math.min((ts-st)/DUR,1);var e=easeOut(p);num.textContent=Math.round(e*from)+'-'+Math.round(e*to)+suffix;if(p<1)requestAnimationFrame(step);else num.textContent=from+'-'+to+suffix;})(performance.now());}
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(!e.isIntersecting)return;e.target.classList.add('in');if(e.target.hasAttribute('data-mode'))startStat(e.target);io.unobserve(e.target);});},{threshold:0.08});
    document.querySelectorAll('.sl-rv').forEach(function(el){io.observe(el);});
  } else {
    document.querySelectorAll('.sl-rv').forEach(function(el){el.classList.add('in');if(el.hasAttribute('data-mode'))startStat(el);});
  }

  var ALL=['Apple','Beats','Samsung','Sony','Google Pixel','OnePlus','Nothing','Xiaomi','EcoFlow','Bluetti','Jackery','Anker','DJI','Autel Robotics','ASUS','MSI','Gigabyte','ASRock','Intel','AMD','NVIDIA','Corsair','Kingston','Western Digital','Seagate','Razer','Logitech','SteelSeries','HyperX','Alienware','GoPro','Insta360','Canon','Nikon','Fujifilm','SanDisk','Dyson','Roborock','Google','Ubiquiti','TP-Link'];
  var uniq=ALL.filter(function(v,i,a){return a.indexOf(v)===i;});
  function shuffle(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function buildRow(id,brands){var el=document.getElementById(id);if(!el)return;var h='';[brands,brands].forEach(function(arr){arr.forEach(function(name){h+='<span class="sl-brands__chip"><span class="sl-brands__chip-dot"></span>'+name+'</span>';});});el.innerHTML=h;}
  buildRow('sl-br1',shuffle(uniq));
  buildRow('sl-br2',shuffle(uniq));
  buildRow('sl-br3',shuffle(uniq));

  (function(){
    function isMobile(){return window.innerWidth<=800;}
    function setupMobileTicker(rowEl,speed,reverse){
      if(!rowEl)return;
      rowEl.style.animation='none';rowEl.style.width='auto';
      var fullW=rowEl.scrollWidth/2,pos=reverse?-fullW:0,lastT=null;
      function tick(t){if(lastT===null)lastT=t;var dt=t-lastT;lastT=t;if(reverse){pos+=speed*dt;if(pos>=0)pos=-fullW;}else{pos-=speed*dt;if(pos<=-fullW)pos=0;}rowEl.style.transform='translateX('+pos+'px)';rowEl._raf=requestAnimationFrame(tick);}
      rowEl._raf=requestAnimationFrame(tick);
      rowEl.addEventListener('mouseenter',function(){cancelAnimationFrame(rowEl._raf);});
      rowEl.addEventListener('mouseleave',function(){lastT=null;rowEl._raf=requestAnimationFrame(tick);});
    }
    function initBrands(){
      var r1=document.getElementById('sl-br1'),r2=document.getElementById('sl-br2'),r3=document.getElementById('sl-br3');
      if(isMobile()){setupMobileTicker(r1,0.04,false);setupMobileTicker(r2,0.032,true);setupMobileTicker(r3,0.048,false);}
      else{[r1,r2,r3].forEach(function(el){if(!el)return;if(el._raf)cancelAnimationFrame(el._raf);el.style.transform='';el.style.animation='';el.style.width='';});}
    }
    initBrands();
    var _was=isMobile();
    window.addEventListener('resize',function(){var _is=isMobile();if(_is!==_was){_was=_is;initBrands();}});
  })();

  var FOOTER_ITEMS=[
    {ico:'<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',text:'Оригінальна продукція'},
    {ico:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',text:'Гарантія від магазину — на термін виробника'},
    {ico:'<rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',text:'Поставки від виробника'},
    {ico:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',text:'Тільки новий товар'}
  ];
  var ft=document.getElementById('sl-footer-track');
  if(ft){var fh='';[FOOTER_ITEMS,FOOTER_ITEMS,FOOTER_ITEMS].forEach(function(arr){arr.forEach(function(item){fh+='<span class="sl-brands__footer-item"><svg class="sl-brands__footer-item__ico" viewBox="0 0 24 24">'+item.ico+'</svg>'+item.text+'</span><span class="sl-brands__footer-sep"></span>';});});ft.innerHTML=fh;}

  /* ВИПРАВЛЕНО: статус відкрито/зачинено з зеленою/червоною точкою */
function checkOpen(){
  var now=new Date(), day=now.getDay(), mins=now.getHours()*60+now.getMinutes(),
      isWe=(day===0||day===6), open=isWe?10*60:9*60, close=isWe?19*60:20*60,
      isOpen=(mins>=open&&mins<close);
  var status=document.getElementById('sl-status');
  var dot=document.getElementById('sl-status-dot');
  var text=document.getElementById('sl-status-text');
  if(!status)return;
  if(isOpen){
    status.className='sl-status open';
    if(text) text.textContent='Зараз відкрито';
  } else {
    status.className='sl-status closed';
    if(text) text.textContent='Зараз зачинено';
  }
}
  checkOpen();

  /* Читати далі */
  document.addEventListener('click',function(e){
    var el=e.target;
    while(el&&el!==document.body){
      if(el.classList&&el.classList.contains('sl-review__expand')){
        var wrap=el.parentNode;
        var txt=wrap&&wrap.querySelector('.sl-review__text');
        if(!txt)return;
        var isExp=txt.classList.contains('expanded');
        txt.classList.toggle('expanded',!isExp);
        el.textContent=isExp?'Читати далі ↓':'Згорнути ↑';
        return;
      }
      el=el.parentNode;
    }
  });

  (function(){
    var wraps=document.querySelectorAll('.sl-review__text-wrap');
    wraps.forEach(function(wrap){
      var txt=wrap.querySelector('.sl-review__text');
      var btn=wrap.querySelector('.sl-review__expand');
      if(!txt||!btn)return;
      function check(){
        btn.style.display=(!txt.classList.contains('expanded')&&txt.scrollHeight>txt.clientHeight+2)?'inline-block':(txt.classList.contains('expanded')?'inline-block':'none');
      }
      setTimeout(check,100);
      window.addEventListener('resize',check);
    });
  })();

  /* Слайдер відгуків */
  (function(){
    var WRAP=document.querySelector('.sl-reviews__wrap');
    var TRACK=document.getElementById('sl-reviews-track');
    var DOTS_EL=document.getElementById('sl-rev-dots');
    var BTN_PREV=document.getElementById('sl-rev-prev');
    var BTN_NEXT=document.getElementById('sl-rev-next');
    if(!WRAP||!TRACK||!DOTS_EL||!BTN_PREV||!BTN_NEXT)return;
    var CARDS=Array.prototype.slice.call(TRACK.querySelectorAll('.sl-review-card'));
    var N=CARDS.length,GAP=14,cur=0;
    function pv(){return window.innerWidth<=800?2:3;}
    function maxI(){return Math.max(0,N-pv());}
    function cardW(){var r=CARDS[0]&&CARDS[0].getBoundingClientRect();return(r&&r.width>4)?r.width:(WRAP.offsetWidth/pv()-GAP);}
    function i2px(i){return i*(cardW()+GAP);}
    function readTranslateX(){var s=window.getComputedStyle(TRACK).transform;if(!s||s==='none')return 0;var m=s.match(/matrix\(1,\s*0,\s*0,\s*1,\s*([-\d.e]+)/);return m?-parseFloat(m[1]):0;}
    function applyPos(px,animate){var lo=0,hi=i2px(maxI());px=Math.max(lo,Math.min(hi,px));TRACK.style.transition=animate?'transform .35s cubic-bezier(.4,0,.2,1)':'none';TRACK.style.transform='translateX('+(-px)+'px)';}
    function buildDots(){DOTS_EL.innerHTML='';for(var i=0;i<=maxI();i++){var d=document.createElement('button');d.className='sl-reviews__dot'+(i===cur?' active':'');d.setAttribute('data-i',i);DOTS_EL.appendChild(d);}BTN_PREV.disabled=cur<=0;BTN_NEXT.disabled=cur>=maxI();}
    function snap(i,animate){cur=Math.max(0,Math.min(i,maxI()));applyPos(i2px(cur),animate!==false);buildDots();}
    BTN_PREV.addEventListener('click',function(){snap(cur-1,true);});
    BTN_NEXT.addEventListener('click',function(){snap(cur+1,true);});
    DOTS_EL.addEventListener('click',function(e){var t=e.target;if(t&&t.hasAttribute('data-i'))snap(+t.getAttribute('data-i'),true);});
    var T={active:false,sx:0,sy:0,base:0,cur:0,dir:null};
    function inWrap(touch){var r=WRAP.getBoundingClientRect();return touch.clientX>=r.left&&touch.clientX<=r.right&&touch.clientY>=r.top&&touch.clientY<=r.bottom;}
    window.addEventListener('touchstart',function(e){if(e.touches.length!==1)return;var t=e.touches[0];if(!inWrap(t))return;var target=document.elementFromPoint(t.clientX,t.clientY);while(target&&target!==document.body){var tag=target.tagName&&target.tagName.toLowerCase();if(tag==='button'||tag==='a')return;target=target.parentNode;}var real=readTranslateX();TRACK.style.transition='none';TRACK.style.transform='translateX('+(-real)+'px)';T.active=true;T.sx=t.clientX;T.sy=t.clientY;T.base=real;T.cur=real;T.dir=null;},{passive:true});
    window.addEventListener('touchmove',function(e){if(!T.active)return;var t=e.touches[0],dx=t.clientX-T.sx,dy=t.clientY-T.sy;if(T.dir===null){if(Math.abs(dx)<5&&Math.abs(dy)<5)return;T.dir=Math.abs(dx)>=Math.abs(dy)?'h':'v';}if(T.dir==='v')return;e.preventDefault();var lo=0,hi=i2px(maxI()),pos=T.base-dx;if(pos<lo)pos=lo-Math.pow(lo-pos,0.7);if(pos>hi)pos=hi+Math.pow(pos-hi,0.7);T.cur=pos;TRACK.style.transform='translateX('+(-pos)+'px)';},{passive:false});
    function onTouchEnd(e){if(!T.active)return;T.active=false;if(T.dir!=='h'){snap(cur,true);return;}var endX=e.changedTouches&&e.changedTouches[0]?e.changedTouches[0].clientX:T.sx;var totalDx=T.sx-endX,cw=cardW()+GAP,rawIdx=T.cur/cw,idx;if(totalDx>40)idx=Math.ceil(rawIdx);else if(totalDx<-40)idx=Math.floor(rawIdx);else idx=Math.round(rawIdx);snap(Math.max(0,Math.min(maxI(),idx)),true);}
    window.addEventListener('touchend',onTouchEnd,{passive:true});
    window.addEventListener('touchcancel',onTouchEnd,{passive:true});
    var prevPV=pv();
    window.addEventListener('resize',function(){var npv=pv();if(npv!==prevPV){prevPV=npv;cur=Math.min(cur,maxI());}snap(cur,false);});
    window.addEventListener('load',function(){snap(0,false);});
    setTimeout(function(){snap(0,false);},120);
  })();
})();

// === script #2 (length=3209) ===
(function () {
  function positionSubmenu(item) {
    var submenu = item.querySelector('.productsMenu-submenu');
    if (!submenu) return;
    var menuList = item.closest('.products-menu__list') || item.parentElement;
    if (!menuList) return;
    var menuListRect = menuList.getBoundingClientRect();
    var menuLeft     = menuListRect.left;
    var menuRight    = menuListRect.right;

    submenu.style.removeProperty('left');
    var prevVis  = submenu.style.visibility;
    var prevOp   = submenu.style.opacity;
    var prevDisp = submenu.style.display;
    submenu.style.setProperty('visibility', 'hidden', 'important');
    submenu.style.setProperty('opacity', '0', 'important');
    submenu.style.setProperty('display', 'block', 'important');
    submenu.style.setProperty('left', '0', 'important');

    var submenuWidth = submenu.offsetWidth;

    submenu.style.display    = prevDisp;
    submenu.style.visibility = prevVis;
    submenu.style.opacity    = prevOp;

    var itemRect           = item.getBoundingClientRect();
    var itemCenterViewport = itemRect.left + itemRect.width / 2;
    var idealLeft          = itemCenterViewport - submenuWidth / 2;
    var clamped            = Math.max(menuLeft, Math.min(idealLeft, menuRight - submenuWidth));
    var finalLeft          = Math.round(clamped - menuListRect.left);

    submenu.style.setProperty('left', finalLeft + 'px', 'important');
  }

  function fitCardTexts(submenu) {
    var targets = submenu
      ? submenu.querySelectorAll('.productsMenu-submenu-t')
      : document.querySelectorAll('.productsMenu-submenu-t');

    targets.forEach(function(el) {
      var parent = el.closest('.productsMenu-submenu-a');
      if (!parent) return;
      var maxWidth = parent.offsetWidth - 20;
      if (maxWidth <= 0) return;

      var text = el.textContent.trim();
      var words = text.split(/\s+/);

      if (words.length === 1) {
        // Одно слово — уменьшаем шрифт пока не влезет
        el.style.whiteSpace = 'nowrap';
        el.style.fontSize = '12px';
        var fontSize = 12;
        while (el.scrollWidth > maxWidth && fontSize > 1) {
          fontSize -= 1;
          el.style.fontSize = fontSize + 'px';
        }
      } else {
        // Несколько слов — оставляем перенос, шрифт не трогаем
        el.style.whiteSpace = 'normal';
        el.style.fontSize = '';
      }
    });
  }

  function init() {
    document.querySelectorAll('.products-menu__item').forEach(function (item) {
      var submenu = item.querySelector('.productsMenu-submenu');

      item.addEventListener('mouseenter', function () {
        positionSubmenu(item);
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            if (submenu) fitCardTexts(submenu);
          });
        });
      });

      positionSubmenu(item);
    });

    window.addEventListener('resize', function () {
      document.querySelectorAll('.products-menu__item').forEach(positionSubmenu);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// === script #3 (length=4055) ===
(function () {
  function positionSubmenu(item) {
    var submenu = item.querySelector('.productsMenu-submenu');
    if (!submenu) return;
    var menuList = item.closest('.products-menu__list') || item.parentElement;
    if (!menuList) return;
    var menuListRect = menuList.getBoundingClientRect();
    var menuLeft     = menuListRect.left;
    var menuRight    = menuListRect.right;

    submenu.style.removeProperty('left');
    var prevVis  = submenu.style.visibility;
    var prevOp   = submenu.style.opacity;
    var prevDisp = submenu.style.display;
    submenu.style.setProperty('visibility', 'hidden', 'important');
    submenu.style.setProperty('opacity', '0', 'important');
    submenu.style.setProperty('display', 'block', 'important');
    submenu.style.setProperty('left', '0', 'important');

    var submenuWidth = submenu.offsetWidth;

    submenu.style.display    = prevDisp;
    submenu.style.visibility = prevVis;
    submenu.style.opacity    = prevOp;

    var itemRect           = item.getBoundingClientRect();
    var itemCenterViewport = itemRect.left + itemRect.width / 2;
    var idealLeft          = itemCenterViewport - submenuWidth / 2;
    var clamped            = Math.max(menuLeft, Math.min(idealLeft, menuRight - submenuWidth));
    var finalLeft          = Math.round(clamped - menuListRect.left);

    submenu.style.setProperty('left', finalLeft + 'px', 'important');
  }

  function fitCardTexts(submenu) {
    var targets = submenu
      ? submenu.querySelectorAll('.productsMenu-submenu-t')
      : document.querySelectorAll('.productsMenu-submenu-t');

    targets.forEach(function(el) {
      var parent = el.closest('.productsMenu-submenu-a');
      if (!parent) return;
      var maxWidth = parent.offsetWidth - 20;
      if (maxWidth <= 0) return;

      var text = el.textContent.trim();
      var words = text.split(/\s+/);

      if (words.length === 1) {
        // Одно слово — уменьшаем шрифт пока не влезет
        el.style.whiteSpace = 'nowrap';
        el.style.fontSize = '12px';
        var fontSize = 12;
        while (el.scrollWidth > maxWidth && fontSize > 1) {
          fontSize -= 1;
          el.style.fontSize = fontSize + 'px';
        }
      } else {
        // Несколько слов — оставляем перенос, шрифт не трогаем
        el.style.whiteSpace = 'normal';
        el.style.fontSize = '';
      }
    });
  }

  function init() {
    document.querySelectorAll('.products-menu__item').forEach(function (item) {
      var submenu = item.querySelector('.productsMenu-submenu');

      item.addEventListener('mouseenter', function () {
        positionSubmenu(item);
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            if (submenu) fitCardTexts(submenu);
          });
        });
      });

      positionSubmenu(item);
    });

    window.addEventListener('resize', function () {
      document.querySelectorAll('.products-menu__item').forEach(positionSubmenu);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Placeholder для полей попапа
(function() {
  function setPlaceholders() {
    var nameField = document.querySelector('.popup-block.login input[name="form[title]"]');
    var phoneField = document.querySelector('.popup-block.login input[name="form[phone]"]');
    if (nameField && !nameField.getAttribute('placeholder')) {
      nameField.setAttribute('placeholder', 'Введіть ваше ім\'я');
    }
    if (phoneField && !phoneField.getAttribute('placeholder')) {
      phoneField.setAttribute('placeholder', '+38 (0__) ___-__-__');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setPlaceholders);
  } else {
    setPlaceholders();
  }
  // Также при открытии попапа
  document.addEventListener('click', function() {
    setTimeout(setPlaceholders, 100);
  });
})();

// === script #4 (length=5295) ===
(function () {
  function positionSubmenu(item) {
    var submenu = item.querySelector('.productsMenu-submenu');
    if (!submenu) return;
    var menuList = item.closest('.products-menu__list') || item.parentElement;
    if (!menuList) return;
    var menuListRect = menuList.getBoundingClientRect();
    var menuLeft     = menuListRect.left;
    var menuRight    = menuListRect.right;

    submenu.style.removeProperty('left');
    var prevVis  = submenu.style.visibility;
    var prevOp   = submenu.style.opacity;
    var prevDisp = submenu.style.display;
    submenu.style.setProperty('visibility', 'hidden', 'important');
    submenu.style.setProperty('opacity', '0', 'important');
    submenu.style.setProperty('display', 'block', 'important');
    submenu.style.setProperty('left', '0', 'important');

    var submenuWidth = submenu.offsetWidth;

    submenu.style.display    = prevDisp;
    submenu.style.visibility = prevVis;
    submenu.style.opacity    = prevOp;

    var itemRect           = item.getBoundingClientRect();
    var itemCenterViewport = itemRect.left + itemRect.width / 2;
    var idealLeft          = itemCenterViewport - submenuWidth / 2;
    var clamped            = Math.max(menuLeft, Math.min(idealLeft, menuRight - submenuWidth));
    var finalLeft          = Math.round(clamped - menuListRect.left);

    submenu.style.setProperty('left', finalLeft + 'px', 'important');
  }

  function fitCardTexts(submenu) {
    var targets = submenu
      ? submenu.querySelectorAll('.productsMenu-submenu-t')
      : document.querySelectorAll('.productsMenu-submenu-t');

    targets.forEach(function(el) {
      var parent = el.closest('.productsMenu-submenu-a');
      if (!parent) return;
      var maxWidth = parent.offsetWidth - 20;
      if (maxWidth <= 0) return;

      var text = el.textContent.trim();
      var words = text.split(/\s+/);

      if (words.length === 1) {
        // Одно слово — уменьшаем шрифт пока не влезет
        el.style.whiteSpace = 'nowrap';
        el.style.fontSize = '12px';
        var fontSize = 12;
        while (el.scrollWidth > maxWidth && fontSize > 1) {
          fontSize -= 1;
          el.style.fontSize = fontSize + 'px';
        }
      } else {
        // Несколько слов — оставляем перенос, шрифт не трогаем
        el.style.whiteSpace = 'normal';
        el.style.fontSize = '';
      }
    });
  }

  function init() {
    document.querySelectorAll('.products-menu__item').forEach(function (item) {
      var submenu = item.querySelector('.productsMenu-submenu');

      item.addEventListener('mouseenter', function () {
        positionSubmenu(item);
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            if (submenu) fitCardTexts(submenu);
          });
        });
      });

      positionSubmenu(item);
    });

    window.addEventListener('resize', function () {
      document.querySelectorAll('.products-menu__item').forEach(positionSubmenu);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Placeholder для полей попапа
(function() {
  function setPlaceholders() {
    var nameField = document.querySelector('.popup-block.login input[name="form[title]"]');
    var phoneField = document.querySelector('.popup-block.login input[name="form[phone]"]');
    if (nameField && !nameField.getAttribute('placeholder')) {
      nameField.setAttribute('placeholder', 'Введіть ваше ім\'я');
    }
    if (phoneField && !phoneField.getAttribute('placeholder')) {
      phoneField.setAttribute('placeholder', '+38 (0__) ___-__-__');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setPlaceholders);
  } else {
    setPlaceholders();
  }
  // Также при открытии попапа
  document.addEventListener('click', function() {
    setTimeout(setPlaceholders, 100);
  });
})();

// ── Розділяємо адресу і графік роботи ──
(function splitAddressAndSchedule() {
  var group = document.querySelector('.footer__contacts-group:nth-child(3)');
  if (!group) return;

  var addr = group.querySelector('.footer__address');
  var mapLink = group.querySelector('a.footer__link');
  if (!addr) return;

  var ps = addr.querySelectorAll('p');
  if (!ps.length) return;

  // 1. Адресний блок — іконка зліва, праворуч колонка: адреса + кнопка знизу
  var addrWrap = document.createElement('div');
  addrWrap.className = 'footer__address-wrap';
  var addrContent = document.createElement('div');
  addrContent.className = 'footer__address-wrap-content';
  addrContent.appendChild(addr);
  if (mapLink) addrContent.appendChild(mapLink);
  addrWrap.appendChild(addrContent);
  group.insertBefore(addrWrap, group.firstChild);

  // 2. Блок графіку — окремий після адресного блоку
  var scheduleBlock = document.createElement('div');
  scheduleBlock.className = 'footer__schedule';
  var inner = document.createElement('div');
  inner.className = 'footer__schedule-inner';
  ps.forEach(function(p) { inner.appendChild(p); });
  scheduleBlock.appendChild(inner);
  group.appendChild(scheduleBlock);
})();

// === script #5 (length=6335) ===
(function () {
  function positionSubmenu(item) {
    var submenu = item.querySelector('.productsMenu-submenu');
    if (!submenu) return;
    var menuList = item.closest('.products-menu__list') || item.parentElement;
    if (!menuList) return;
    var menuListRect = menuList.getBoundingClientRect();
    var menuLeft     = menuListRect.left;
    var menuRight    = menuListRect.right;

    submenu.style.removeProperty('left');
    var prevVis  = submenu.style.visibility;
    var prevOp   = submenu.style.opacity;
    var prevDisp = submenu.style.display;
    submenu.style.setProperty('visibility', 'hidden', 'important');
    submenu.style.setProperty('opacity', '0', 'important');
    submenu.style.setProperty('display', 'block', 'important');
    submenu.style.setProperty('left', '0', 'important');

    var submenuWidth = submenu.offsetWidth;

    submenu.style.display    = prevDisp;
    submenu.style.visibility = prevVis;
    submenu.style.opacity    = prevOp;

    var itemRect           = item.getBoundingClientRect();
    var itemCenterViewport = itemRect.left + itemRect.width / 2;
    var idealLeft          = itemCenterViewport - submenuWidth / 2;
    var clamped            = Math.max(menuLeft, Math.min(idealLeft, menuRight - submenuWidth));
    var finalLeft          = Math.round(clamped - menuListRect.left);

    submenu.style.setProperty('left', finalLeft + 'px', 'important');
  }

  function fitCardTexts(submenu) {
    var targets = submenu
      ? submenu.querySelectorAll('.productsMenu-submenu-t')
      : document.querySelectorAll('.productsMenu-submenu-t');

    targets.forEach(function(el) {
      var parent = el.closest('.productsMenu-submenu-a');
      if (!parent) return;
      var maxWidth = parent.offsetWidth - 20;
      if (maxWidth <= 0) return;

      var text = el.textContent.trim();
      var words = text.split(/\s+/);

      if (words.length === 1) {
        // Одно слово — уменьшаем шрифт пока не влезет
        el.style.whiteSpace = 'nowrap';
        el.style.fontSize = '12px';
        var fontSize = 12;
        while (el.scrollWidth > maxWidth && fontSize > 1) {
          fontSize -= 1;
          el.style.fontSize = fontSize + 'px';
        }
      } else {
        // Несколько слов — оставляем перенос, шрифт не трогаем
        el.style.whiteSpace = 'normal';
        el.style.fontSize = '';
      }
    });
  }

  function init() {
    document.querySelectorAll('.products-menu__item').forEach(function (item) {
      var submenu = item.querySelector('.productsMenu-submenu');

      item.addEventListener('mouseenter', function () {
        positionSubmenu(item);
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            if (submenu) fitCardTexts(submenu);
          });
        });
      });

      positionSubmenu(item);
    });

    window.addEventListener('resize', function () {
      document.querySelectorAll('.products-menu__item').forEach(positionSubmenu);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Placeholder для полей попапа
(function() {
  function setPlaceholders() {
    var nameField = document.querySelector('.popup-block.login input[name="form[title]"]');
    var phoneField = document.querySelector('.popup-block.login input[name="form[phone]"]');
    if (nameField && !nameField.getAttribute('placeholder')) {
      nameField.setAttribute('placeholder', 'Введіть ваше ім\'я');
    }
    if (phoneField && !phoneField.getAttribute('placeholder')) {
      phoneField.setAttribute('placeholder', '+38 (0__) ___-__-__');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setPlaceholders);
  } else {
    setPlaceholders();
  }
  // Также при открытии попапа
  document.addEventListener('click', function() {
    setTimeout(setPlaceholders, 100);
  });
})();

// ── Розділяємо адресу і графік роботи ──
(function splitAddressAndSchedule() {
  var group = document.querySelector('.footer__contacts-group:nth-child(3)');
  if (!group) return;

  var addr = group.querySelector('.footer__address');
  var mapLink = group.querySelector('a.footer__link');
  if (!addr) return;

  var ps = addr.querySelectorAll('p');
  if (!ps.length) return;

  // 1. Адресний блок — іконка зліва, праворуч колонка: адреса + кнопка знизу
  var addrWrap = document.createElement('div');
  addrWrap.className = 'footer__address-wrap';
  var addrContent = document.createElement('div');
  addrContent.className = 'footer__address-wrap-content';
  addrContent.appendChild(addr);
  if (mapLink) addrContent.appendChild(mapLink);
  addrWrap.appendChild(addrContent);
  group.insertBefore(addrWrap, group.firstChild);

  // 2. Блок графіку — окремий після адресного блоку
  var scheduleBlock = document.createElement('div');
  scheduleBlock.className = 'footer__schedule';
  var inner = document.createElement('div');
  inner.className = 'footer__schedule-inner';
  ps.forEach(function(p) { inner.appendChild(p); });
  scheduleBlock.appendChild(inner);
  group.appendChild(scheduleBlock);
})();

// ── Підказки для контактів у футері ──
(function addFooterTooltips() {
  var tooltips = [
    { selector: '.footer__contacts-group:nth-child(1) .footer__contacts-item:nth-child(2)', title: 'Vodafone' },
    { selector: '.footer__contacts-group:nth-child(1) .footer__contacts-item:nth-child(3)', title: 'Kyivstar' },
    { selector: '.footer__contacts-group:nth-child(1) .footer__contacts-item:nth-child(4)', title: 'lifecell' },
    { selector: '.footer__contacts-group:nth-child(2) .footer__contacts-item:nth-child(1)', title: 'Viber' },
    { selector: '.footer__contacts-group:nth-child(2) .footer__contacts-item:nth-child(2)', title: 'WhatsApp' },
    { selector: '.footer__contacts-group:nth-child(2) .footer__contacts-item:nth-child(3)', title: 'Telegram' },
    { selector: '.footer__contacts-group:nth-child(2) .footer__contacts-item:nth-child(4)', title: 'Email' }
  ];
  tooltips.forEach(function(t) {
    var el = document.querySelector(t.selector);
    if (el) el.setAttribute('title', t.title);
  });
})();

// === script #6 (length=1157) ===
(function(){
  var inner = document.querySelector('.footer__schedule-inner');
  if (!inner) return;

  // Створюємо блок статусу
  var statusEl = document.createElement('div');
  statusEl.className = 'footer__schedule-status';

  var dot = document.createElement('span');
  dot.className = 'footer__schedule-status__dot';

  var text = document.createElement('span');
  text.className = 'footer__schedule-status__text';

  statusEl.appendChild(dot);
  statusEl.appendChild(text);

  // Вставляємо після розкладом
inner.appendChild(statusEl);


  function checkFooterOpen() {
    var now = new Date(), day = now.getDay(),
        mins = now.getHours() * 60 + now.getMinutes(),
        isWe = (day === 0 || day === 6),
        open = isWe ? 10 * 60 : 9 * 60,
        close = isWe ? 19 * 60 : 20 * 60,
        isOpen = (mins >= open && mins < close);

    if (isOpen) {
      statusEl.className = 'footer__schedule-status';
      text.textContent = 'Зараз відкрито';
    } else {
      statusEl.className = 'footer__schedule-status closed';
      text.textContent = 'Зараз зачинено';
    }
  }

  checkFooterOpen();
})();

// === script #7 (length=5972) ===
/* ══════════════════════════════════════════════════════════════════
   STORRAGE v13 — Фікс стрілок recentProducts
   Замінює ВСІ попередні скрипти стрілок
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Розділювачі ── */
  function div() {
    var d = document.createElement('div');
    d.className = 'stg-div';
    return d;
  }
  function prevIsDivider(el) {
    var p = el.previousElementSibling;
    return p && p.classList.contains('stg-div');
  }
  function nextIsDivider(el) {
    var n = el.nextElementSibling;
    return n && n.classList.contains('stg-div');
  }
  function insertDividers() {
    var A = document.querySelector('.j-product-block:has(.productsSlider)');
    var R = document.querySelector('section.recentProducts');
    if (A && !prevIsDivider(A)) {
      A.parentNode.insertBefore(div(), A);
    }
    if (A && R && !prevIsDivider(R)) {
      R.parentNode.insertBefore(div(), R);
    }
    if (R && !nextIsDivider(R)) {
      var after = div();
      R.nextSibling
        ? R.parentNode.insertBefore(after, R.nextSibling)
        : R.parentNode.appendChild(after);
    }
  }

  /* ── Прибираємо stg-end ── */
  function removeStgEnd() {
    var ends = document.querySelectorAll('.stg-end');
    ends.forEach(function(el) { el.style.display = 'none'; });
  }

  /* ── Нативний скрол + стрілки recentProducts ── */
  function initRecentScroll() {
    var section = document.querySelector('section.recentProducts');
    if (!section) return;

    var wrapper = section.querySelector('.recentProducts-wrapper');
    var body    = section.querySelector('.recentProducts-body');

    if (!wrapper || !body) return;
    if (wrapper.dataset.stgFixed === '13') return;
    wrapper.dataset.stgFixed = '13';

    /* 1. Скасовуємо Swiper transform */
    wrapper.style.setProperty('transform',       'none',    'important');
    wrapper.style.setProperty('transition',      'none',    'important');
    wrapper.style.setProperty('overflow-x',      'auto',    'important');
    wrapper.style.setProperty('overflow-y',      'visible', 'important');
    wrapper.style.setProperty('display',         'flex',    'important');
    wrapper.style.setProperty('flex-wrap',       'nowrap',  'important');
    wrapper.style.setProperty('scroll-behavior', 'smooth',  'important');

    /* 2. Збираємо ВСІ стрілки з будь-якого місця в секції */
    var allBtns = section.querySelectorAll('.slideCarousel-nav-btn');
    var btnL = null;
    var btnR = null;

    allBtns.forEach(function(btn) {
      if (btn.classList.contains('__slideLeft'))  btnL = btn;
      if (btn.classList.contains('__slideRight')) btnR = btn;
    });

    if (!btnL || !btnR) return;

    /* 3. Клонуємо ОБІ кнопки, видаляємо ВСІ оригінали */
    var newBtnL = btnL.cloneNode(true);
    var newBtnR = btnR.cloneNode(true);

    /* Видаляємо ВСІ стрілки (може бути дублікати) */
    allBtns.forEach(function(btn) {
      if (btn.parentNode) btn.parentNode.removeChild(btn);
    });

    /* Прибираємо класи __hidden та __disabled з клонів */
    newBtnL.classList.remove('__hidden');
    newBtnR.classList.remove('__hidden');

    /* Вставляємо в body */
    body.appendChild(newBtnL);
    body.appendChild(newBtnR);

    btnL = newBtnL;
    btnR = newBtnR;

    /* 4. Крок скролу */
    function getStep() {
      var card = wrapper.querySelector('.recentProducts-i');
      return card ? card.offsetWidth + 12 : 192;
    }

    /* 5. Оновлення стану кнопок */
    function updateBtns() {
      var sl        = Math.round(wrapper.scrollLeft);
      var maxScroll = wrapper.scrollWidth - wrapper.clientWidth;

      if (sl <= 2) {
        btnL.classList.add('__disabled');
      } else {
        btnL.classList.remove('__disabled');
      }

      if (maxScroll <= 2 || sl >= maxScroll - 2) {
        btnR.classList.add('__disabled');
      } else {
        btnR.classList.remove('__disabled');
      }
    }

    /* 6. Обробники кліків */
    btnL.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      wrapper.scrollBy({ left: -(getStep() * 3), behavior: 'smooth' });
    });

    btnR.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      wrapper.scrollBy({ left: (getStep() * 3), behavior: 'smooth' });
    });

    /* 7. Слухаємо скрол */
    wrapper.addEventListener('scroll', updateBtns, { passive: true });

    /* 8. MutationObserver — скидаємо transform */
    new MutationObserver(function () {
      var t = wrapper.style.transform;
      if (t && t !== 'none' && t !== '') {
        wrapper.style.setProperty('transform', 'none', 'important');
      }
    }).observe(wrapper, { attributes: true, attributeFilter: ['style'] });

    /* 9. Початковий стан + відкладені перевірки */
    updateBtns();
    setTimeout(updateBtns, 300);
    setTimeout(updateBtns, 800);
    setTimeout(updateBtns, 1500);
  }

  /* ── Запуск ── */
  function init() {
    removeStgEnd();
    insertDividers();
    initRecentScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── MutationObserver для AJAX ── */
  var t;
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        var hasSlider = n.querySelector &&
          n.querySelector('.recentProducts-wrapper, .productsSlider-wrapper');
        var isSection = n.classList && n.classList.contains('recentProducts');
        if (hasSlider || isSection) {
          clearTimeout(t);
          t = setTimeout(init, 300);
        }
      });
    });
  }).observe(document.body, { childList: true, subtree: true });

}());
