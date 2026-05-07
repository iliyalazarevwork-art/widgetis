// source: https://mhw3bomber.com.ua/
// extracted: 2026-05-07T21:19:21.138Z
// scripts: 1

// === script #1 (length=12408) ===
(function () {
  // ===== НАЛАШТУВАННЯ =====
  var COUPON_CODE   = 'NEW10MHW';
  var BTN_COLOR     = '#B21820';
  var DISMISS_KEY   = 'fk_coupon_dismissed_i18n_v1';
  var SUBMIT_WEBHOOK_URL = '';
  var WEBHOOK_SECRET     = '';

  var WIDGET_VERSION = '2025-10-22-reset1';
  var MIGRATION_KEY  = 'fk_coupon_migrated_' + WIDGET_VERSION;

  // ===== анти-бот =====
  function isBot(){
    var ua = (navigator.userAgent || '').toLowerCase();
    return /googlebot|bingbot|yandexbot|adsbot|duckduckbot|baiduspider|crawler|spider|bot/i.test(ua);
  }

  function ready(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  ready(function init(){
    // якщо бот — просто виходимо, не малюємо віджет
    if (isBot()) return;

    function setFlag(){ try{ localStorage.setItem(DISMISS_KEY,'1'); }catch(e){ document.cookie=DISMISS_KEY+'=1; path=/; max-age=31536000'; } }
    function hasFlag(){ try{ if(localStorage.getItem(DISMISS_KEY)==='1') return true; }catch(e){} return document.cookie.indexOf(DISMISS_KEY+'=1')!==-1; }

    function migrated(){
      try{ if(localStorage.getItem(MIGRATION_KEY)==='1') return true; }catch(e){}
      return document.cookie.indexOf(MIGRATION_KEY+'=1')!==-1;
    }
    function setMigrated(){
      try{ localStorage.setItem(MIGRATION_KEY,'1'); }catch(e){ document.cookie=MIGRATION_KEY+'=1; path=/; max-age=31536000'; }
    }

    // одноразовий глобальний ресет
    if (!migrated()){
      try{
        localStorage.removeItem(DISMISS_KEY);
        document.cookie = DISMISS_KEY + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      }catch(e){}
      setMigrated();
    }

    if (hasFlag()) return;
    if (!document.body){ return ready(init); }

    function detectLang(){
      var hl = (document.documentElement.getAttribute('lang')||'').toLowerCase();
      if (hl.startsWith('ru')) return 'ru';
      if (hl.startsWith('uk') || hl.startsWith('ua')) return 'uk';
      if (/^\/(ru|rus|ru-RU)\b/i.test(location.pathname)) return 'ru';
      return 'uk';
    }
    var LANG = detectLang();

    var I18N = {
      uk: {
        badge:'−10% купон',
        title:'ОТРИМАЙТЕ −10% НА ПЕРШЕ ЗАМОВЛЕННЯ',
        sub:'Залиште e-mail і ми одразу покажемо Ваш промокод.',
        label:'E-mail',
        submit:'Отримати знижку',
        copy:'Скопіювати',
        copied:'Скопійовано',
        nope:'Ні, дякую',
        hide:'Сховати назавжди',
        note:'Застосуйте код у кошику під час оформлення. Діє тільки на перше замовлення.',
        err:'Введіть коректний e-mail латиницею, наприклад name@gmail.com',
        kbwarn:'Введення кирилицею недоступне. Перемкніть розкладку на англійську (латиниця).'
      },
      ru: {
        badge:'−10% купон',
        title:'ПОЛУЧИТЕ −10% НА ПЕРВЫЙ ЗАКАЗ',
        sub:'Оставьте e-mail, и мы сразу покажем Ваш промокод.',
        label:'E-mail',
        submit:'Получить скидку',
        copy:'Скопировать',
        copied:'Скопировано',
        nope:'Нет, спасибо',
        hide:'Скрыть навсегда',
        note:'Примените код в корзине при оформлении. Действует только на первый заказ.',
        err:'Введите корректный e-mail латиницей, например name@gmail.com',
        kbwarn:'Ввод кириллицей недоступен. Переключите раскладку на английскую (латиница).'
      }
    };
    var T = I18N[LANG] || I18N.uk;

    var css = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap');
    #fkOverlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:2147483000;display:none}
    #fkModal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
             width:min(500px,96vw);background:#fff;border-radius:16px;
             box-shadow:0 18px 60px rgba(0,0,0,.28);font-family:'Montserrat',sans-serif}
    #fkClose{position:absolute;top:12px;right:12px;width:36px;height:36px;border:0;background:transparent;cursor:pointer;font-size:20px}
    #fkScroll{padding:36px 28px 28px;display:flex;flex-direction:column;align-items:center;text-align:center}
    .fk-ttl{margin:0 0 12px;font:900 26px/1.2 'Montserrat',sans-serif;color:#000}
    .fk-sub{margin:0 0 20px;color:#555;font:400 15px/1.4 'Montserrat',sans-serif}
    .fk-label{display:block;margin:0 6px 8px 6px;font:600 14px 'Montserrat',sans-serif;color:#111;text-align:left;width:100%;max-width:400px}
    .fk-input{width:100%;max-width:400px;padding:14px 16px;border:1px solid #d3d3d3;border-radius:10px;font:400 15px 'Montserrat',sans-serif}
    .fk-input:focus{border-color:#111;outline:none;box-shadow:0 0 0 3px rgba(0,0,0,.06)}
    .fk-err,.fk-warn{margin:8px 6px 0;color:#B21820;font:600 13px 'Montserrat',sans-serif;text-align:left;width:100%;max-width:400px;background:none;border:none;padding:0;}
    .fk-hidden{display:none!important;}
    .fk-btn{width:100%;max-width:400px;margin-top:16px;appearance:none;border:0;border-radius:12px;padding:14px 18px;background:${BTN_COLOR};color:#fff;font:700 16px 'Montserrat',sans-serif;cursor:pointer;transition:transform .2s,box-shadow .2s;}
    .fk-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.1);}
    .fk-btn:disabled{opacity:.6;cursor:not-allowed}
    .fk-msg{margin-top:16px;padding:14px 16px;border-radius:10px;border:1px dashed #c9e6d0;background:#f1fbf4;width:100%;max-width:400px;text-align:center}
    .fk-code-line{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
    .fk-code{background:#111;color:#fff;padding:6px 10px;border-radius:8px;font:700 16px 'Montserrat',sans-serif}
    .fk-copy{border:1px solid #111;background:#fff;color:#111;border-radius:8px;padding:6px 10px;cursor:pointer;transition:all .25s}
    .fk-copy.copied{background:#111;color:#fff;border-color:#111;}
    .fk-actions{display:flex;flex-direction:column;gap:8px;margin-top:20px;align-items:center}
    .fk-link-btn{background:none;border:none;color:#666;font:600 14px 'Montserrat',sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#999;transition:color .2s, text-decoration-color .2s;}
    .fk-link-btn:hover{color:#000;text-decoration-color:#000;}
    #fkBadge{position:fixed;right:24px;bottom:130px;z-index:2147483000}
    #fkBadgeBtn{appearance:none;border:0;border-radius:999px;background:${BTN_COLOR};color:#fff;padding:12px 18px;font:700 14px 'Montserrat',sans-serif;cursor:pointer}
    `;

    var html = `
    <div id="fkOverlay" aria-label="${T.title}" role="presentation">
      <div id="fkModal" role="dialog" aria-modal="true" aria-labelledby="fkTitle">
        <button id="fkClose" aria-label="Закрити/Close">✕</button>
        <div id="fkScroll">
          <h2 id="fkTitle" class="fk-ttl">${T.title}</h2>
          <p class="fk-sub">${T.sub}</p>
          <form id="fkForm" novalidate>
            <label class="fk-label" for="fkEmail">${T.label}</label>
            <input class="fk-input" type="email" id="fkEmail" placeholder="you@example.com" autocomplete="email" required>
            <div id="fkErr" class="fk-err fk-hidden">${T.err}</div>
            <div id="fkKbWarn" class="fk-warn fk-hidden">${T.kbwarn}</div>
            <button type="submit" class="fk-btn" id="fkSubmit">${T.submit}</button>
            <div class="fk-msg fk-hidden" id="fkOk">
              <div class="fk-code-line">
                ${LANG==='ru' ? 'Ваш купон:' : 'Ваш купон:'}
                <code class="fk-code" id="fkCode">${COUPON_CODE}</code>
                <button type="button" class="fk-copy" id="fkCopy">${T.copy}</button>
              </div>
              <div class="fk-note" style="margin-top:10px;font:400 12px 'Montserrat',sans-serif;color:#666">${T.note}</div>
            </div>
            <div class="fk-actions">
              <button type="button" class="fk-link-btn" id="fkNope">${T.nope}</button>
              <button type="button" class="fk-link-btn" id="fkHide">${T.hide}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div id="fkBadge"><button id="fkBadgeBtn">${T.badge}</button></div>`;

    var style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
    var wrap=document.createElement('div');wrap.innerHTML=html;document.body.appendChild(wrap);

    var overlay=document.getElementById('fkOverlay');
    var badge=document.getElementById('fkBadge');
    var badgeBtn=document.getElementById('fkBadgeBtn');
    var close=document.getElementById('fkClose');
    var form=document.getElementById('fkForm');
    var email=document.getElementById('fkEmail');
    var err=document.getElementById('fkErr');
    var kbwarn=document.getElementById('fkKbWarn');
    var ok=document.getElementById('fkOk');
    var codeEl=document.getElementById('fkCode');
    var copyBtn=document.getElementById('fkCopy');
    var nope=document.getElementById('fkNope');
    var hideBtn=document.getElementById('fkHide');
    var submit=document.getElementById('fkSubmit');

    var prevOverflow = '';

    function openModal(){
      prevOverflow = document.body.style.overflow || (window.getComputedStyle ? getComputedStyle(document.body).overflow : '') || '';
      overlay.style.display='block';
      document.body.style.overflow='hidden';
    }
    function closeModal(){
      overlay.style.display='none';
      document.body.style.overflow = prevOverflow;
    }
    function hideForever(){
      document.body.style.overflow = prevOverflow;
      setFlag();
      try{ overlay.remove(); }catch(e){}
      try{ badge.remove(); }catch(e){}
    }

    badgeBtn.addEventListener('click',openModal);
    close.addEventListener('click',closeModal);
    overlay.addEventListener('click',function(e){if(e.target===overlay)closeModal();});
    nope.addEventListener('click',closeModal);
    hideBtn.addEventListener('click',hideForever);

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){ closeModal(); }
    });

    email.addEventListener('input', function(){
      var raw = email.value;
      var hasNonASCII = /[^\x00-\x7F]/.test(raw);
      if (hasNonASCII) {
        kbwarn.classList.remove('fk-hidden');
        err.classList.add('fk-hidden');
      } else {
        kbwarn.classList.add('fk-hidden');
      }
      var v = raw.replace(/[^\x00-\x7F]/g,'').replace(/\s+/g,'');
      if (email.value !== v) email.value = v;
    });

    function isValidEmail(v){
      var asciiOnly = /^[\x00-\x7F]+$/.test(v);
      var formatOk  = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v);
      return asciiOnly && formatOk;
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      err.classList.add('fk-hidden');
      kbwarn.classList.add('fk-hidden');

      if(!isValidEmail(email.value)){
        err.classList.remove('fk-hidden');
        email.focus();
        return;
      }

      submit.disabled = true;
      ok.classList.remove('fk-hidden');
      submit.disabled = false;

      if(SUBMIT_WEBHOOK_URL){
        fetch(SUBMIT_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type':'application/json',
            ...(WEBHOOK_SECRET ? {'X-Webhook-Secret': WEBHOOK_SECRET} : {})
          },
          body: JSON.stringify({ email: email.value, source: 'coupon_widget', lang: LANG, ts: Date.now() })
        }).catch(function(){});
      }
    });

    copyBtn.addEventListener('click', function(){
      var txt = codeEl.textContent.trim();
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).catch(function(){});
      copyBtn.textContent = T.copied;
      copyBtn.classList.add('copied');
      hideForever();
      setTimeout(function(){
        try{
          copyBtn.textContent = T.copy;
          copyBtn.classList.remove('copied');
        }catch(e){}
      }, 2000);
    });

    document.addEventListener('copy', function(){
      try{
        var sel = (window.getSelection && window.getSelection().toString()) || '';
        if (sel && sel.trim().replace(/\s+/g,'') === codeEl.textContent.trim()){
          hideForever();
        }
      }catch(e){}
    });
  });
})();
