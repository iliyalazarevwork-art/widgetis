// source: https://es-ukraine-shop.com.ua/
// extracted: 2026-05-07T21:21:17.524Z
// scripts: 4

// === script #1 (length=650) ===
window.fbAsyncInit = function() {
                FB.init({
                    appId            : '',
                    autoLogAppEvents : true,
                    xfbml            : true,
                    version          : 'v2.12'
                });
            };
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

// === script #2 (length=9206) ===
document.addEventListener("DOMContentLoaded", function() {
window.addEventListener("resize", function () {

   var header = document.querySelector(".header");
    var contact = document.getElementsByClassName("contact-header");
    
    if (window.innerWidth > 768) {
        if (contact.length === 0) {
            var phoneContact = `
            <div>
                <div class="contact-header">
                    <a class="header_tel" data-index="1" href="tel:%28044%29379-24-25">
                        <svg class="icon icon--phone">
                            <use xlink:href="#icon-phone"></use>
                        </svg>
                        044 379 24 25
                    </a>
                    <a class="header_mail" href="mailto:info%40es-ukraine.com">
                        <svg class="icon icon--email">
                            <use xlink:href="#icon-email"></use>
                        </svg>
                        info@es-ukraine.com
                    </a>
                    <a class="header_call_me" href="#" data-modal="#call-me">Передзвонити вам?</a>
                    <a href="/pro-nas/" class="header_about">Про нас</a>
                    <a href="/oplata-i-dostavka/" class="header_pay_delivery">Оплата і доставка</a>
                </div>
            </div>
            `;
            if (header) {
                header.insertAdjacentHTML('afterbegin', phoneContact);
            } else {
                console.log("Елемент з класом .header не знайдено.");
            }
        }
    } else {
        if (contact.length > 0) {
            contact[0].parentNode.removeChild(contact[0]);
        }
    }
});
(function() {
    var event = new Event('resize');
    window.dispatchEvent(event);
})();
});

        const style = document.createElement('style');
            style.innerHTML = `
.hidden {
    display: none;
}
.categories-grid{
display: flex;
}
.__normalGrid{}
  .contact-header{
   margin: 0;
    padding: 0;
    width: 100%;
    height: 50px;;
    display: flex;
    gap:40px;
    flex-direction: row;
    align-items: center;
    justify-content:flex-end;
    background-color: #222d4a;
 }
.icon:hover{
transform: scale(1.1);
}
.icon--phone{
  display: inline-block;
  font-size: 20px;
  width: 1em;
  height: 1em;
  vertical-align: middle;
  fill: #fff;
  opacity: .6;
}
.icon--phone:hover{
transform: scale(1.1);
fill:#38CDF4;
}
.icon--email:hover{
transform: scale(1.1);
fill:#38CDF4;
}
.icon--email{
  display: inline-block;
  font-size: 20px;
  width: 1em;
  height: 1em;
  vertical-align: middle;
  fill: #fff;
  opacity: .6;
}
.header_tel{
  color: #fff;
  text-decoration: none;
  font-weight: bold;
}
.header_tel:hover{
transform: scale(1.1);
color:#38CDF4;
}
.header_mail{
  color: #fff;
  text-decoration: none;
  font-weight: bold;
}
.header_mail:hover{
transform: scale(1.1);
color:#38CDF4;
}
.header_call_me{
  color: #fff;
  text-decoration: none;
font-weight: bold;
}
.header_call_me:hover{
transform: scale(1.1);
color:#38CDF4;
}
.header_about{
  color: #fff;
  text-decoration: none;
 font-weight: bold;
}
.header_about:hover{
transform: scale(1.1);
color:#38CDF4;
}
.header_pay_delivery{
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  padding-right: 40px;
}
.header_pay_delivery:hover{
transform: scale(1.1);
color:#38CDF4;
}


         .sticky {
                    margin:0;
                    position: fixed;
                    top: 0;
                    width: 100%;
                    z-index: 1000;
                }
                {/* .header__layout {
                    position: relative;
                    display: flex;
                    justify-content: flex-start;
                    align-content: flex-start;
                    align-items: center;
                    flex-wrap: wrap;
                    flex-direction: column;
                }
                .header__layout > :last-child{
                    margin-left: auto;
                } */}
                .search__input{
                  height: 40px;
                  color: black;
                  width: 100%;
                  max-width: 600px;
                }
                .search j-search{
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .header__layout--middle {
                    height: 70px;
                }
                .svg_search{
                    cursor: pointer;
                }
                .header__section{
                    cursor: pointer;
                }
                .footer__col{
                    flex: none;
                }
                .footer__col--double{
                    flex: none;
                }
                .footer__columns{
                    justify-content: space-between;
                }
                .catalog-card-specs__value{
                    color:  #17369E;
                    font-size: 14px;
                }
                .products-menu__button{
                    padding: 0;
                }
            `;
        document.head.appendChild(style);
        const svgIconMenu = `
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="40" height="40" viewBox="0 0 48 48">
              <linearGradient id="9iHXMuvV7brSX7hFt~tsna_Rdp3AydLFY2A_gr1" x1="12.066" x2="34.891" y1=".066" y2="22.891" gradientUnits="userSpaceOnUse"><stop offset=".237" stop-color="#3bc9f3"></stop><stop offset=".85" stop-color="#1591d8"></stop></linearGradient><path fill="url(#9iHXMuvV7brSX7hFt~tsna_Rdp3AydLFY2A_gr1)" d="M43,15H5c-1.1,0-2-0.9-2-2v-2c0-1.1,0.9-2,2-2h38c1.1,0,2,0.9,2,2v2C45,14.1,44.1,15,43,15z"></path><linearGradient id="9iHXMuvV7brSX7hFt~tsnb_Rdp3AydLFY2A_gr2" x1="12.066" x2="34.891" y1="12.066" y2="34.891" gradientUnits="userSpaceOnUse"><stop offset=".237" stop-color="#3bc9f3"></stop><stop offset=".85" stop-color="#1591d8"></stop></linearGradient><path fill="url(#9iHXMuvV7brSX7hFt~tsnb_Rdp3AydLFY2A_gr2)" d="M43,27H5c-1.1,0-2-0.9-2-2v-2c0-1.1,0.9-2,2-2h38c1.1,0,2,0.9,2,2v2C45,26.1,44.1,27,43,27z"></path><linearGradient id="9iHXMuvV7brSX7hFt~tsnc_Rdp3AydLFY2A_gr3" x1="12.066" x2="34.891" y1="24.066" y2="46.891" gradientUnits="userSpaceOnUse"><stop offset=".237" stop-color="#3bc9f3"></stop><stop offset=".85" stop-color="#1591d8"></stop></linearGradient><path fill="url(#9iHXMuvV7brSX7hFt~tsnc_Rdp3AydLFY2A_gr3)" d="M43,39H5c-1.1,0-2-0.9-2-2v-2c0-1.1,0.9-2,2-2h38c1.1,0,2,0.9,2,2v2C45,38.1,44.1,39,43,39z"></path>
            </svg>
        `;
        const svgIconSearch = ` 
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="25" height="25" viewBox="0 0 48 48" class='svg_search'>
                <path fill="#616161" d="M34.6 28.1H38.6V45.1H34.6z" transform="rotate(-45.001 36.586 36.587)"></path><path fill="#616161" d="M20 4A16 16 0 1 0 20 36A16 16 0 1 0 20 4Z"></path><path fill="#37474F" d="M36.2 32.1H40.2V44.400000000000006H36.2z" transform="rotate(-45.001 38.24 38.24)"></path><path fill="#64B5F6" d="M20 7A13 13 0 1 0 20 33A13 13 0 1 0 20 7Z"></path><path fill="#BBDEFB" d="M26.9,14.2c-1.7-2-4.2-3.2-6.9-3.2s-5.2,1.2-6.9,3.2c-0.4,0.4-0.3,1.1,0.1,1.4c0.4,0.4,1.1,0.3,1.4-0.1C16,13.9,17.9,13,20,13s4,0.9,5.4,2.5c0.2,0.2,0.5,0.4,0.8,0.4c0.2,0,0.5-0.1,0.6-0.2C27.2,15.3,27.2,14.6,26.9,14.2z"></path>
            </svg>
        `;
        document.addEventListener('DOMContentLoaded', function() {
const header_currency = document.querySelector('.header__column--side');  
  if (header_currency) {
    const div = document.createElement('div');
    div.className = 'currency_wrap'; // додаємо клас div
    const p = document.createElement('p');
    p.textContent = '1 USD = 44.00 грн'; // текст у p
    div.appendChild(p); // вставляємо p у div
    header_currency.appendChild(div); // вставляємо div в знайдений елемент
  } else {
    console.log("Елемент з класом .header__layout--middle не знайдено.");
  }
            const button = document.querySelector('.products-menu__button.j-productsMenu-toggleButton');
            const search_btn = document.querySelector('.search__button');
            const header = document.querySelector('.header__container');
            button.innerHTML = '';
            button.innerHTML = svgIconMenu + button.innerHTML;
            const iconSearch = search_btn.querySelector('svg');
            if (iconSearch) {
                iconSearch.remove();
                search_btn.innerHTML = svgIconSearch;
            }
            function makeHeaderSticky() {
                const sticky = header.offsetTop;
                    if (window.pageYOffset > sticky) {
                        header.classList.add('sticky');
                    } else {
                        header.classList.remove('sticky');
                    }
            };
            window.onscroll = function() {
                makeHeaderSticky();
            };
        });

// === script #3 (length=18691) ===
(function initESPicker(){
  if (window.__esPickerLoaded) return; window.__esPickerLoaded = true;

  function run(){
    /* ---------- CSS ---------- */
    const css = `
    .esc-root{--bg:#0b1a20;--fg:#e7fbff;--mut:#8aa5ad;--acc1:#20b7a9;--acc2:#1e7fb8}
    .esc-toggle{
      position:fixed; right:20px; bottom:20px; z-index:999998;
      display:flex; align-items:center; justify-content:center; gap:5px;
      background:#0a1b22; color:var(--fg);
      border:1px solid rgba(255,255,255,.12); border-radius:5px;
      padding:2px 8px; cursor:pointer; font-size:14px; line-height:1;
      box-shadow:0 12px 20px rgba(0,0,0,.38);
      font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",Arial
    }
    .cursor-icon{width:40px;height:40px;object-fit:contain;display:block;border-radius:4px;box-shadow:0 0 0 1px rgba(255,255,255,.08)}
    .esc-toggle-text{display:block}
    .esc-panel{position:fixed;right:16px;bottom:60px;z-index:999999;width:300px;
      font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",Arial;color:var(--fg);
      background:linear-gradient(180deg,#0f2430,#0b1a20);border:1px solid rgba(255,255,255,.10);
      border-radius:14px;box-shadow:0 12px 32px rgba(0,0,0,.45);padding:12px;opacity:0;visibility:hidden;
      transform:translateY(8px) scale(.98);transition:.22s ease}
    .esc-panel.open{opacity:1;visibility:visible;transform:translateY(0) scale(1)}
    .esc-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
    .esc-head b{font-size:14px;letter-spacing:.2px}
    .esc-row{margin:10px 0 8px}
    .esc-label{font-size:12px;color:var(--mut);margin-bottom:6px}
    .esc-chips{display:flex;flex-wrap:wrap;gap:6px}
    .esc-chip{padding:8px 12px;border-radius:999px;font-size:13px;cursor:pointer;user-select:none;
      background:#0e2230;border:1px solid rgba(255,255,255,.12);color:var(--fg);transition:filter .15s,transform .06s}
    .esc-chip:hover{filter:brightness(1.06)}
    .esc-chip.active{background:linear-gradient(135deg,var(--acc1),var(--acc2));color:#06231d;border:none;font-weight:800}
    .esc-select{width:100%;padding:10px 12px;border-radius:10px;background:#0b2029;color:var(--fg);
      border:1px solid rgba(255,255,255,.12);outline:none;font-size:14px}
    .esc-foot{display:flex;gap:8px;margin-top:10px}
    .esc-btn{flex:1;padding:10px 12px;border-radius:10px;border:none;cursor:pointer;font-weight:800;
      background:linear-gradient(135deg,var(--acc1),var(--acc2));color:#06231d;box-shadow:0 8px 18px rgba(30,127,184,.22)}
    .esc-btn.secondary{background:#102532;color:var(--fg);box-shadow:none;border:1px solid rgba(255,255,255,.12)}
    .esc-note{margin-top:6px;font-size:11px;color:var(--mut)}

    /* --- Мобільна адаптація: лише логотип на кнопці --- */
    @media (max-width:767px){
      .esc-panel{right:10px;bottom:70px;width:94vw;padding:12px}
      .esc-toggle{
        right:10px;bottom:10px;
        padding:4px;            /* компактніше під іконку */
        gap:0;                  /* без відступу між іконкою та (прихованим) текстом */
        border-radius:8px;
      }
      .esc-toggle-text{display:none}   /* ховаємо текст на мобілці */
      .cursor-icon{width:44px;height:44px} /* трохи більша іконка для тапу */
      .esc-chip{padding:10px 14px;font-size:14px}
      .esc-select{padding:12px 14px;font-size:15px}
      .esc-btn{padding:12px 14px;font-size:15px}
    }`;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

    /* ---------- HTML ---------- */
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <button id="escToggle" class="esc-toggle esc-root" aria-label="Швидкий підбір ES">
        <img id="cursor-leader" class="cursor-icon" src="https://es-ukraine-shop.com.ua/content/images/2/85x88l90nn0/24258890286762.webp" alt="ES Ukraine">
        <div class="esc-toggle-text"><span>Швидкий підбір</span></div>
      </button>
      <div id="escPanel" class="esc-panel esc-root" aria-label="ES підбір">
        <div class="esc-head">
          <div><b>Підбір вимикача</b></div>
          <button id="escClose" class="esc-btn secondary" style="flex:0 0 auto;padding:6px 10px">✕</button>
        </div>
        <div class="esc-row">
          <div class="esc-label">Тип</div>
          <div class="esc-chips" id="chipsType">
            <span class="esc-chip active" data-val="MCB">Модульні</span>
            <span class="esc-chip" data-val="MCCB">У литому корпусі</span>
            <span class="esc-chip" data-val="DC">Постійного струму (DC)</span>
            <span class="esc-chip" data-val="RCBO">Диф-автомат</span>
            <span class="esc-chip" data-val="RCD">ПЗВ</span>
            <span class="esc-chip" data-val="LOAD">Перемикач І-0-ІІ</span>
          </div>
        </div>
        <div class="esc-row" id="rowMccbKind" style="display:none">
          <div class="esc-label">Тип MCCB</div>
          <div class="esc-chips" id="chipsMccbKind">
            <span class="esc-chip active" data-val="ELECTRONIC">Електронний</span>
            <span class="esc-chip" data-val="TMF">Тепло-ел.магнітний</span>
            <span class="esc-chip" data-val="Ti">Ti(Im=3-5In)</span>
          </div>
        </div>
        <div class="esc-row" id="rowDcKind" style="display:none">
          <div class="esc-label">DC серія</div>
          <div class="esc-chips" id="chipsDcKind">
            <span class="esc-chip active" data-val="63">63</span>
            <span class="esc-chip" data-val="63M">63M</span>
          </div>
        </div>
        <div class="esc-row" id="rowPoles">
          <div class="esc-label">Полюси</div>
          <div class="esc-chips" id="chipsPoles"></div>
        </div>
        <div class="esc-row" id="rowIcu">
          <div class="esc-label">Відключаюча здатність</div>
          <div class="esc-chips" id="chipsIcu"></div>
        </div>
        <div class="esc-row" id="rowIn">
          <div class="esc-label">Номінальний струм, In</div>
          <select id="escIn" class="esc-select"></select>
        </div>
        <div class="esc-foot">
          <button id="escOpen" class="esc-btn">Переглянути</button>
          <button id="escReset" class="esc-btn secondary">Скинути</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    /* ---------- Дані та логіка (без змін від вашої останньої версії) ---------- */
    const POLES = { MCB:["1P","2P","3P"], MCCB:["3P"], DC:["2P"], RCBO:["2P","4P"], RCD:["2P","4P"], LOAD:["2P","4P"] };
    const ICU = { MCB:["4.5кА","6кА","10кА"], DC:["6кА"] };
    const ICU_MCCB = { ELECTRONIC:["35кА","50кА","85кА"], TMF:["25кА","50кА","85кА"], Ti:["22кА","35кА","50кА"] };

    const _base = [1,2,3,4,6,10,16,20,25,32,40,50,63];
    const _base3P6k = [1,2,3,4,6,8,10,13,16,20,25,32,40,50,63];
    const MCB_IN_RULES = {
      "4.5кА": { "1P": _base, "2P": _base, "3P": _base },
      "6кА":   { "1P": _base, "2P": _base, "3P": _base3P6k },
      "10кА":  { "1P": _base, "2P": _base, "3P": _base.concat([80,100,125]) }
    };

    const MCCB_IN_RULES_RAW = {
      ELECTRONIC:{ "35кА":[[20,250]], "50кА":[[320,1250]], "85кА":[[1600,2000]] },
      TMF:{ "25кА":[[16,250]], "50кА":[[315,1250]], "85кА":[[1600,2000]] },
      Ti:{ "22кА":[[20,250]], "35кА":[[300,630]], "50кА":[[800,1000]] }
    };

    const RCBO_IN = { "2P":[10,16,20,25,32,40], "4P":[16,20,25,32,40] };
    const RCD_IN  = { "2P":[25,40,63], "4P":[25,40,63] };
    const LOAD_IN = { "2P":[40,63], "4P":[40,63] };

    const DC63_IN = [3,4,6,10,16];
    const DC63_URL = (In)=> `https://es-ukraine-shop.com.ua/va-es-63-2p-${In}a-c-6-ka/`;

    const DC63M_IN = [2,3,4,6,10,16,20,25,32,40,50,63];
    const DC63M_URL = {
      2:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/",
      3:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/2389/",
      4:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/2390/",
      6:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/2391/",
      10:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/2392/",
      16:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/2393/",
      20:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/",
      25:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/2394/",
      32:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/2395/",
      40:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/2396/",
      50:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/2397/",
      63:"https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/2398/"
    };

    const LOAD_URL = {
      "2P-40":"https://es-ukraine-shop.com.ua/modulnyi-peremykach-navantazhennia-i-0-ii-serii-pn-es40a-63a/",
      "2P-63":"https://es-ukraine-shop.com.ua/modulnyi-peremykach-navantazhennia-i-0-ii-serii-pn-es40a-63a/2385/",
      "4P-40":"https://es-ukraine-shop.com.ua/modulnyi-peremykach-navantazhennia-i-0-ii-serii-pn-es40a-63a/2386/",
      "4P-63":"https://es-ukraine-shop.com.ua/modulnyi-peremykach-navantazhennia-i-0-ii-serii-pn-es40a-63a/2387/"
    };

    const uniq = a => [...new Set(a)].sort((x,y)=>x-y);
    const inByRanges = (vals,r)=>uniq(vals.filter(v=>r?.some(([lo,hi])=>v>=lo&&v<=hi)));
    const icuNum = (icu)=>icu.replace("кА","").replace(",",".");

    function buildMccbIN(kind, icu){
      const ranges = (MCCB_IN_RULES_RAW[kind]||{})[icu] || [];
      const all = [16,20,25,32,40,50,63,80,100,125,160,200,250,300,315,320,350,400,500,630,800,1000,1250,1600,2000];
      let list = inByRanges(all, ranges);
      if (kind==="ELECTRONIC"){ list = list.filter(x=>x!==350 && x!==500); }
      if (kind==="TMF"){ list = list.filter(x=>x!==320 && x!==350 && x!==500); }
      if (kind==="Ti"){ list = list.filter(x=>x!==320 && x!==350); }
      return list;
    }
    function buildMcbIN(icu, poles){ return (MCB_IN_RULES[icu]||{})[poles] || []; }

    function urlByState(st){
      const {type, mccbKind, dcKind, poles, icu, In} = st;
      if (type==="MCCB" && poles==="3P"){
        const icuSlug = icuNum(icu).toLowerCase()+"ka";
        if (mccbKind==="ELECTRONIC") return `https://es-ukraine-shop.com.ua/avtomatychnyi-vymykach-va-es-e-${In}a-3p-${icuSlug}/`;
        if (mccbKind==="Ti")         return `https://es-ukraine-shop.com.ua/avtomatychnyi-vymykach-va-es-ti-${In}a-3p-${icuSlug}/`;
        if (mccbKind==="TMF")        return `https://es-ukraine-shop.com.ua/avtomatychnyi-vymykach-va-es-t-${In}a-3p-${icuSlug}/`;
      }
      if (type==="MCB"){
        const p = (poles||'').toLowerCase();
        const icuSlug = icuNum(icu);
        if (p==="3p" && icu==="10кА" && [80,100,125].includes(In)){
          if (In===80)  return "https://es-ukraine-shop.com.ua/va-es-125m-3p-80a-c-10-ka/";
          if (In===100) return "https://es-ukraine-shop.com.ua/va-es-125m-3p-100a-d-10-ka/";
          if (In===125) return "https://es-ukraine-shop.com.ua/va-es-125m-3p-125a-c-10-ka/";
        }
        return `https://es-ukraine-shop.com.ua/va-es-63m-${p}-${In}a-${icuSlug}-ka/`;
      }
      if (type==="RCBO"){
        const p = (poles||'').toLowerCase();
        if (p!=="2p" && p!=="4p") return "";
        return `https://es-ukraine-shop.com.ua/ad-es-63-${p}-${In}a-c-30ma/`;
      }
      if (type==="RCD"){
        const p = (poles||'').toLowerCase();
        if (p!=="2p" && p!=="4p") return "";
        return `https://es-ukraine-shop.com.ua/vd-es-63m-${p}-${In}a-30ma/`;
      }
      if (type==="DC" && poles==="2P"){
        if (dcKind==="63"){
          if (!DC63_IN.includes(In)) return "";
          return DC63_URL(In);
        } else if (dcKind==="63M"){
          if (!DC63M_IN.includes(In)) return "";
          return DC63M_URL[In] || "https://es-ukraine-shop.com.ua/modulni-avtomatychni-vymykachi-postiinoi-napruhy-dc-serii-ba-ec-63m1a-63a/";
        }
      }
      if (type==="LOAD"){
        const key = `${poles}-${In}`;
        return LOAD_URL[key] || "";
      }
      return "";
    }

    let state = { type:"MCB", mccbKind:"ELECTRONIC", dcKind:"63", poles:"1P", icu:"6кА", In:16 };

    const panelEl = document.querySelector("#escPanel"),
          toggleEl = document.querySelector("#escToggle"),
          closeEl  = document.querySelector("#escClose"),
          rowKind  = document.querySelector("#rowMccbKind"),
          rowDcKind= document.querySelector("#rowDcKind"),
          chipsType = document.querySelector("#chipsType"),
          chipsKind = document.querySelector("#chipsMccbKind"),
          chipsDcKind = document.querySelector("#chipsDcKind"),
          chipsPoles = document.querySelector("#chipsPoles"),
          chipsIcu = document.querySelector("#chipsIcu"),
          escIn = document.querySelector("#escIn");

    toggleEl.addEventListener("click", ()=> panelEl.classList.toggle("open"));
    closeEl.addEventListener("click", ()=> panelEl.classList.remove("open"));

    function renderChips(box, list, current){
      box.innerHTML = (list||[]).map(v=>`<span class="esc-chip ${v===current?'active':''}" data-val="${v}">${v}</span>`).join("");
    }
    function renderIN(list, current){
      escIn.innerHTML = (list||[]).map(v=>`<option ${v===current?'selected':''} value="${v}">${v}A</option>`).join("");
    }

    function applyType(){
      const t = state.type;

      rowKind.style.display   = (t==="MCCB") ? "" : "none";
      rowDcKind.style.display = (t==="DC")   ? "" : "none";

      const polesList = POLES[t] || [];
      if (!polesList.includes(state.poles)) state.poles = polesList[0] || "";
      renderChips(chipsPoles, polesList, state.poles);

      let showIcu=false, icuList=[];
      if (t==="MCCB"){
        showIcu = true;
        icuList = ICU_MCCB[state.mccbKind] || ICU_MCCB.ELECTRONIC;
        if (!icuList.includes(state.icu)) state.icu = icuList[0];
      } else if (ICU[t]){
        showIcu = true;
        icuList = ICU[t];
        if (!icuList.includes(state.icu)) state.icu = icuList[0];
      } else { state.icu = ""; }
      document.querySelector("#rowIcu").style.display = showIcu ? "" : "none";
      if (showIcu) renderChips(chipsIcu, icuList, state.icu); else chipsIcu.innerHTML = "";

      let inList = [];
      if (t==="MCCB"){ inList = buildMccbIN(state.mccbKind, state.icu); }
      else if (t==="MCB"){ inList = buildMcbIN(state.icu, state.poles); }
      else if (t==="RCBO"){ inList = RCBO_IN[state.poles] || []; }
      else if (t==="RCD"){  inList = RCD_IN[state.poles]  || []; }
      else if (t==="LOAD"){ inList = LOAD_IN[state.poles] || []; }
      else if (t==="DC"){   inList = (state.dcKind==="63") ? DC63_IN : DC63M_IN; }

      if (!inList.includes(state.In)) state.In = inList[0] || "";
      renderIN(inList, state.In);

      chipsPoles.onclick = e=>{
        const c=e.target.closest(".esc-chip"); if(!c) return;
        state.poles=c.dataset.val;
        [...chipsPoles.children].forEach(x=>x.classList.remove("active")); c.classList.add("active");
        applyType();
      };
      chipsIcu.onclick = e=>{
        const c=e.target.closest(".esc-chip"); if(!c) return;
        state.icu=c.dataset.val;
        [...chipsIcu.children].forEach(x=>x.classList.remove("active")); c.classList.add("active");
        applyType();
      };
      chipsKind.onclick = e=>{
        const c=e.target.closest(".esc-chip"); if(!c) return;
        [...chipsKind.children].forEach(x=>x.classList.remove("active")); c.classList.add("active");
        state.mccbKind=c.dataset.val;
        state.icu = (ICU_MCCB[state.mccbKind]||[])[0];
        applyType();
      };
      chipsDcKind.onclick = e=>{
        const c=e.target.closest(".esc-chip"); if(!c) return;
        [...chipsDcKind.children].forEach(x=>x.classList.remove("active")); c.classList.add("active");
        state.dcKind = c.dataset.val;
        applyType();
      };
    }

    chipsType.addEventListener("click", e=>{
      const c = e.target.closest(".esc-chip"); if(!c) return;
      [...chipsType.children].forEach(x=>x.classList.remove("active")); c.classList.add("active");
      state.type = c.dataset.val;

      if (state.type==="MCCB"){ state.poles="3P"; state.mccbKind="ELECTRONIC"; state.icu="35кА"; }
      if (state.type==="DC"){   state.poles="2P"; state.dcKind="63"; state.icu="6кА"; }
      if (state.type==="RCBO"){ state.poles="2P"; state.icu=""; }
      if (state.type==="RCD"){  state.poles="2P"; state.icu=""; }
      if (state.type==="LOAD"){ state.poles="2P"; state.icu=""; }
      if (state.type==="MCB"){  state.poles="1P"; state.icu="6кА"; }

      applyType();
    });

    document.querySelector("#escIn").addEventListener("change", e=>{ state.In = parseInt(e.target.value,10); });

    const openUrl = (u)=>{ if (!u){ alert("Такої комбінації немає в каталозі"); return; } window.open(u,"_blank"); };
    document.getElementById("escOpen").addEventListener("click", ()=> openUrl(urlByState(state)) );

    document.getElementById("escReset").addEventListener("click", ()=>{
      state = { type:"MCB", mccbKind:"ELECTRONIC", dcKind:"63", poles:"1P", icu:"6кА", In:16 };
      const typeKids = [...document.querySelectorAll('#chipsType .esc-chip')];
      typeKids.forEach(x=>x.classList.remove('active')); typeKids[0].classList.add('active');
      const kindKids = [...document.querySelectorAll('#chipsMccbKind .esc-chip')];
      kindKids.forEach(x=>x.classList.remove('active')); kindKids[0].classList.add('active');
      const dcKids = [...document.querySelectorAll('#chipsDcKind .esc-chip')];
      dcKids.forEach(x=>x.classList.remove('active')); dcKids[0].classList.add('active');
      applyType();
    });

    applyType();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

// === script #4 (length=539) ===
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
