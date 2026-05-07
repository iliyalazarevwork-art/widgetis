// source: https://sontex.com.ua/
// extracted: 2026-05-07T21:19:37.281Z
// scripts: 3

// === script #1 (length=4359) ===
document.addEventListener('DOMContentLoaded',function(){
var path=window.location.pathname.replace(/\/+$/,'/')||'/';

var CONFIG={
'/':{getTarget:function(){var b=document.querySelectorAll('section.banners.banners--3x');return b.length?b[b.length-1]:null;},place:'afterend',buttons:[{title:'Отримати консультацію'}]},
'/wholesale/':{getTarget:function(){var b=document.querySelectorAll('section.banners.banners--3x');return b.length?b[b.length-1]:null;},place:'afterend',buttons:[{title:'Отримати оптовий прайс'}]},

'/quilting/':{getTarget:function(){
return document.querySelector('.page .banners'); // ✅ ВОТ ЭТО ГЛАВНОЕ ИСПРАВЛЕНИЕ
},place:'afterend',buttons:[{title:'Отримати оптовий прайс'}]},

'/pillows-wholesale/':{getTarget:function(){
return document.querySelector('.page-content .article-text._fullWidth.text') 
|| document.querySelector('.page-content .article-text') 
|| document.querySelector('.page-content');
},place:'append',buttons:[{title:'Отримати оптовий прайс'}]},
'/blankets-wholesale/':{getTarget:function(){
return document.querySelector('.page-content .article-text._fullWidth.text') 
|| document.querySelector('.page-content .article-text') 
|| document.querySelector('.page-content');
},place:'append',buttons:[{title:'Отримати оптовий прайс'}]},
'/plaids-wholesale/':{getTarget:function(){
return document.querySelector('.page-content .article-text._fullWidth.text') 
|| document.querySelector('.page-content .article-text') 
|| document.querySelector('.page-content');
},place:'append',buttons:[{title:'Отримати оптовий прайс'}]},
'/linens-wholesale/':{getTarget:function(){
return document.querySelector('.page-content .article-text._fullWidth.text') 
|| document.querySelector('.page-content .article-text') 
|| document.querySelector('.page-content');
},place:'append',buttons:[{title:'Отримати оптовий прайс'}]},
'/mattress-covers-wholesale/':{getTarget:function(){
return document.querySelector('.page-content .article-text._fullWidth.text') 
|| document.querySelector('.page-content .article-text') 
|| document.querySelector('.page-content');
},place:'append',buttons:[{title:'Отримати оптовий прайс'}]},
'/filler/':{getTarget:function(){
return document.querySelector('.banners__wrapper') 
|| document.querySelector('.banners') 
|| document.querySelector('.catalog_content');
},place:'afterend',buttons:[{title:'Отримати прайс'}]},
'/swan-down/':{getTarget:function(){
return document.querySelector('.banners__wrapper') 
|| document.querySelector('.banners') 
|| document.querySelector('.catalog_content');
},place:'afterend',buttons:[{title:'Отримати прайс'}]},
'/holofiber/':{getTarget:function(){
return document.querySelector('.banners__wrapper') 
|| document.querySelector('.banners') 
|| document.querySelector('.catalog_content');
},place:'afterend',buttons:[{title:'Отримати прайс'}]},
'/silicon/':{getTarget:function(){
return document.querySelector('.banners__wrapper') 
|| document.querySelector('.banners') 
|| document.querySelector('.catalog_content');
},place:'afterend',buttons:[{title:'Отримати прайс'}]},
'/filler-wholesale/':{getTarget:function(){
return document.querySelector('.page-content .article-text._fullWidth.text') 
|| document.querySelector('.page-content .article-text') 
|| document.querySelector('.page-content');
},place:'append',buttons:[{title:'Отримати оптовий прайс'}]}
};

if(!CONFIG[path])return;
if(document.querySelector('.sq-lead-actions[data-page="'+path+'"]'))return;

var s=document.createElement('style');
s.innerHTML=".sq-lead-actions{display:flex;gap:10px;justify-content:center;margin:18px 0 30px;font-family:Inter,sans-serif}.sq-lead-btn{min-width:210px;height:44px;padding:0 20px;border:1px solid #511865;border-radius:6px;background:#511865;color:#E9DFE7;font-size:14px;cursor:pointer}";
document.head.appendChild(s);

function build(btns){return btns.map(function(b){return '<button class="sq-lead-btn">'+b.title+'</button>'}).join('');}

var target=CONFIG[path].getTarget();
if(!target)return;

var actions=document.createElement('div');
actions.className='sq-lead-actions';
actions.setAttribute('data-page',path);
actions.innerHTML=build(CONFIG[path].buttons);

if(CONFIG[path].place==='append'){target.appendChild(actions);}else{target.insertAdjacentElement('afterend',actions);}
});

// === script #2 (length=990) ===
document.addEventListener('DOMContentLoaded',function(){
  if(window.location.pathname !== '/') return;

  var topBanner=document.querySelector('section.banners.banners--2x');
  var banners=document.querySelectorAll('section.banners.banners--3x');
  if(!topBanner && !banners.length) return;

  if(banners.length && !document.querySelector('.sq-lead-title')){
    var bottomTitle=document.createElement('div');
    bottomTitle.className='sq-lead-title';
    bottomTitle.textContent='Пропозиції для бізнесу';
    var lastBanner=banners[banners.length-1];
    lastBanner.parentNode.insertBefore(bottomTitle,lastBanner);
  }

  if(!document.getElementById('sq-home-titles-style')){
    var style=document.createElement('style');
    style.id='sq-home-titles-style';
    style.innerHTML='.sq-top-title,.sq-lead-title{font-family:Inter,sans-serif;font-size:24px;font-weight:700;color:#111;text-align:center;margin:30px 0 14px}';
    document.head.appendChild(style);
  }
});

// === script #3 (length=5246) ===
(function(){
var path=(window.location.pathname||'/').replace(/\/+$/,'/')||'/';
if(path!=='/') return;
    if(window.sqFirstBlockFinalHover) return;
    window.sqFirstBlockFinalHover = true;

    if(window.innerWidth <= 767) return;

    var s = document.createElement('style');
    s.innerHTML = `
        section[data-sq-main-slider="true"] { 
            position: relative; 
            margin-top: 80px !important; 
            z-index: 10;
        }
        section[data-sq-main-slider="true"] .banners__container { 
            position: relative; 
            padding: 0 36px !important; 
        }
        section[data-sq-main-slider="true"] .banners__grid { 
            display: flex !important; 
            flex-wrap: nowrap !important; 
            overflow-x: hidden !important; 
            scroll-behavior: smooth !important; 
            gap: 15px !important; 
            padding: 20px 0 !important;
            margin: -20px 0 !important;
        }
        section[data-sq-main-slider="true"] .banners__col { 
            flex: 0 0 calc((100% - 75px)/6) !important; 
            max-width: none !important; 
            min-width: 0 !important;
            transition: transform 0.3s ease, z-index 0.3s ease !important;
        }
        section[data-sq-main-slider="true"] .banners__col:hover {
            transform: scale(1.05) !important;
            z-index: 100 !important;
            position: relative;
        }
        section[data-sq-main-slider="true"] .sq-slider-arrow { 
            position: absolute; 
            top: 50%; 
            transform: translateY(-50%); 
            z-index: 110; 
            width: 18px; 
            height: 46px; 
            border: none; 
            background: transparent; 
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            outline: none;
        }
        section[data-sq-main-slider="true"] .sq-slider-prev { left: 10px; }
        section[data-sq-main-slider="true"] .sq-slider-next { right: 10px; }
        
        section[data-sq-main-slider="true"] .sq-slider-arrow:before { 
            content: ""; 
            display: block; 
            border-style: solid; 
            transition: border-color 0.2s ease; /* Плавный переход цвета */
        }
        
        /* Дефолтный цвет стрелок (серый) */
        section[data-sq-main-slider="true"] .sq-slider-prev:before { 
            border-width: 8px 10px 8px 0; 
            border-color: transparent #cfcfcf transparent transparent; 
        }
        section[data-sq-main-slider="true"] .sq-slider-next:before { 
            border-width: 8px 0 8px 10px; 
            border-color: transparent transparent transparent #cfcfcf; 
        }

        /* Эффект при наведении (черный) */
        section[data-sq-main-slider="true"] .sq-slider-prev:hover:before { 
            border-color: transparent #000 transparent transparent !important; 
        }
        section[data-sq-main-slider="true"] .sq-slider-next:hover:before { 
            border-color: transparent transparent transparent #000 !important; 
        }
    `;
    document.head.appendChild(s);

    function initSlider() {
        if (window.innerWidth <= 767) return;

        var allBanners = document.querySelectorAll('section.banners.banners--3x');
        var targetSection = allBanners[0]; 
        
        if(!targetSection || targetSection.dataset.sqDone) return;
        
        targetSection.setAttribute('data-sq-main-slider', 'true');
        
        var container = targetSection.querySelector('.banners__container');
        var grid = targetSection.querySelector('.banners__grid');
        if(!container || !grid) return;

        targetSection.dataset.sqDone = '1';

        var prev = document.createElement('button');
        prev.className = 'sq-slider-arrow sq-slider-prev';
        var next = document.createElement('button');
        next.className = 'sq-slider-arrow sq-slider-next';
        container.appendChild(prev);
        container.appendChild(next);

        var scroll = function(dir) {
            var col = grid.querySelector('.banners__col');
            var step = col ? col.getBoundingClientRect().width + 15 : 300;
            var currentScroll = grid.scrollLeft;
            var maxScroll = grid.scrollWidth - grid.clientWidth;

            if(dir === 1 && currentScroll >= maxScroll - 5) {
                grid.scrollTo({ left: 0, behavior: 'smooth' });
            } else if(dir === -1 && currentScroll <= 5) {
                grid.scrollTo({ left: maxScroll, behavior: 'smooth' });
            } else {
                grid.scrollBy({ left: dir * step, behavior: 'smooth' });
            }
        };

        prev.addEventListener('click', function(e) { e.preventDefault(); scroll(-1); });
        next.addEventListener('click', function(e) { e.preventDefault(); scroll(1); });
    }

    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSlider);
    } else {
        initSlider();
    }
    setTimeout(initSlider, 1000);
})();
