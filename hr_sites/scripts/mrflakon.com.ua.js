// source: https://mrflakon.com.ua/
// extracted: 2026-05-07T21:22:07.252Z
// scripts: 2

// === script #1 (length=1674) ===
/* иконки: пульс/показ тултипа/скрытие при overflow:hidden */
    const telegramIconLink=document.querySelector('.telegram-icon-link');
    const viberIconLink=document.querySelector('.viber-icon-link');
    function applyPulse(){
      telegramIconLink?.classList.add('pulse-animation');
      viberIconLink?.classList.add('pulse-animation');
      setTimeout(()=>{
        telegramIconLink?.classList.remove('pulse-animation');
        viberIconLink?.classList.remove('pulse-animation')
      },1000)
    }
    function runDoublePulse(){applyPulse();setTimeout(applyPulse,2000)}
    setTimeout(runDoublePulse,5000);setInterval(runDoublePulse,20000);

    function showTooltip(){
      const t=document.getElementById('floating-tooltip');
      if(!t)return;
      t.classList.add('show');
      setTimeout(()=>t.classList.remove('show'),10000)
    }
    setTimeout(()=>{
      showTooltip();
      setInterval(showTooltip,600000)
    },30000);
    document.getElementById('tooltip-close')?.addEventListener('click',()=>{
      document.getElementById('floating-tooltip')?.classList.remove('show')
    });

    function checkBodyOverflow(){
      const overflow=getComputedStyle(document.body).overflow;
      if(overflow==='hidden') document.body.classList.add('hide-chat-icons');
      else document.body.classList.remove('hide-chat-icons')
    }
    setInterval(checkBodyOverflow,200);

    /* Помечаем страницу checkout, чтобы спрятать гирлянду полностью */
    (function(){
      if (location.pathname.toLowerCase().indexOf('checkout') !== -1) {
        document.body.classList.add('hide-garland-on-checkout');
      }
    })();

// === script #2 (length=6350) ===
(function(){
    const THRESH = 10;
    const COOLDOWN_MS = 30_000;
    const AUTOHIDE_MS = 3000;

    const PLUS_SELECTORS=[
      '.j-product-increase','.counter-btn_plus','button.counter-btn.__plus',
      '.counter_btn-plus','.counter_btn.btn-plus','.btn-plus',
      '.qty__plus','.quantity__plus','.quantity-plus','.js-qty-plus',
      '.btn_inc','.inc','.plus',
      '[data-action="plus"]','[data-qty="plus"]','[data-quantity="plus"]',
      '[aria-label*="увелич"]','[aria-label*="збільш"]','[aria-label*="increase"]',
      'svg.icon--plus','svg.icon.icon--plus','use[href*="icon-plus"]','use[xlink\\:href*="icon-plus"]'
    ].join(',');

    let clicksSinceLastHint = 0;
    let lastShownAt = 0;
    let hintEl=null, btnRef=null, anchorEl=null, hideTimer=null;

    function isPlusButton(target){
      let n=target.closest(PLUS_SELECTORS);
      if(n){
        const b=n.closest('button, .button, .btn, .counter_btn, .quantity__btn, .qty__btn')||n;
        return b;
      }
      const b=target.closest('button, .button, .btn, .counter_btn, .quantity__btn, .qty__btn');
      if(!b) return null;
      const cls=(b.className||'').toLowerCase();
      if(/(plus|inc(rease)?|\b__plus\b|\bcounter_btn-plus\b)/.test(cls)) return b;
      const al=(b.getAttribute('aria-label')||'').toLowerCase();
      if(/(увелич|збільш|increase|plus|\+)/.test(al)) return b;
      const title=(b.getAttribute('title')||'').toLowerCase();
      if(/(увелич|збільш|increase|plus|\+)/.test(title)) return b;
      const da=(b.dataset.action||b.dataset.qty||b.dataset.quantity||'').toLowerCase();
      if(/(plus|inc)/.test(da)) return b;
      if(b.textContent && b.textContent.trim()==='+') return b;
      return null;
    }

    function getDefaultAnchor(btn){
      return btn.closest('.mm-drawer,.mm-offcanvas,.mm-panel,.mm-viewport,.j-cart-body,.cart_drawer,.cart__drawer,.cart,[data-cart],.checkout,.order,.order-summary,.product,.product-card,.product-page,.popup,.modal,.mfp-content,.fancybox-content,.cart-item,.cart-container')
        || btn.offsetParent || btn.parentElement || document.body;
    }

    function shouldUseBody(anchor){
      const cs=getComputedStyle(anchor);
      return ['hidden','auto','clip','scroll'].includes(cs.overflow)
          || ['hidden','auto','clip','scroll'].includes(cs.overflowY)
          || ['hidden','auto','clip','scroll'].includes(cs.overflowX);
    }

    function removeHint(){
      if(!hintEl) return;
      hintEl.style.animation='qtyOut .2s ease forwards';
      const el=hintEl; hintEl=null; btnRef=null; anchorEl=null;
      clearTimeout(hideTimer); hideTimer=null;
      setTimeout(()=>el && el.remove(),180);
      window.removeEventListener('scroll',positionHint,true);
      window.removeEventListener('resize',positionHint,true);
      window.removeEventListener('orientationchange',positionHint,true);
    }

    function positionHint(){
      if(!hintEl || !btnRef) return removeHint();
      if(!document.body.contains(btnRef) || btnRef.offsetParent===null){ return removeHint(); }

      const isFixed=hintEl.classList.contains('qty-fixed');
      const btnRect=btnRef.getBoundingClientRect();
      const baseRect=isFixed?{top:0,left:0,width:window.innerWidth}:anchorEl.getBoundingClientRect();
      const elRect=hintEl.getBoundingClientRect();

      let top=(btnRect.top-baseRect.top)-elRect.height-10;
      let left=(btnRect.left-baseRect.left);

      const maxLeft=(isFixed?window.innerWidth:baseRect.width)-elRect.width-6;
      if(left<6) left=6;
      if(left>maxLeft) left=Math.max(6,maxLeft);

      const needBelow=(btnRect.top-elRect.height-10)<((isFixed?0:baseRect.top)+40);
      if(needBelow){ top=(btnRect.bottom-baseRect.top)+10; hintEl.classList.add('below'); }
      else { hintEl.classList.remove('below'); }

      hintEl.style.top=top+'px';
      hintEl.style.left=left+'px';
    }

    function showHint(btn,text){
      removeHint();
      btnRef=btn;
      anchorEl=getDefaultAnchor(btn);

      const useBody=shouldUseBody(anchorEl);
      const host=useBody?document.body:anchorEl;

      hintEl=document.createElement('div');
      hintEl.className='qty-hint'+(useBody?' qty-fixed':'' );
      hintEl.innerHTML = `
        <span class="qty-hint__text">${text}</span>
        <button class="qty-hint__close" aria-label="Закрити">✕</button>
      `;
      hintEl.querySelector('.qty-hint__close').addEventListener('click',removeHint);
      host.appendChild(hintEl);

      if(!useBody && getComputedStyle(anchorEl).position==='static'){
        anchorEl.style.position='relative';
      }

      positionHint();
      window.addEventListener('scroll',positionHint,true);
      window.addEventListener('resize',positionHint,true);
      window.addEventListener('orientationchange',positionHint,true);

      hideTimer=setTimeout(removeHint,AUTOHIDE_MS);

      document.addEventListener('touchstart',(e)=>{
        if(!hintEl) return;
        if(hintEl.contains(e.target)) return;
        const targetPlus = isPlusButton(e.target);
        if(btnRef && targetPlus === btnRef) return;
        removeHint();
      },{passive:true,capture:true});

      const mo=new MutationObserver(()=>{
        if(!hintEl) return;
        if(!document.body.contains(btnRef)) removeHint(); else positionHint();
      });
      mo.observe(document.body,{childList:true,subtree:true});

      requestAnimationFrame(positionHint);
      setTimeout(positionHint,100);
    }

    function handle(target){
      const plusBtn=isPlusButton(target);
      if(!plusBtn) return;

      if(hintEl && hideTimer){
        clearTimeout(hideTimer);
        hideTimer=setTimeout(removeHint,AUTOHIDE_MS);
      }

      const now = Date.now();
      if (now - lastShownAt < COOLDOWN_MS) return;

      clicksSinceLastHint += 1;

      if (clicksSinceLastHint >= THRESH){
        showHint(plusBtn,'Ви можете вписати кількість товару самостійно');
        lastShownAt = now;
        clicksSinceLastHint = 0;
      }
    }

    document.addEventListener('pointerup',(e)=>handle(e.target),true);
    document.addEventListener('touchend',(e)=>handle(e.target),true);
    document.addEventListener('click',(e)=>handle(e.target),true);
  })();
