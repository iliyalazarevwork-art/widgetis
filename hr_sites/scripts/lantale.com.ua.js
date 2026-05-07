// source: https://lantale.com.ua/
// extracted: 2026-05-07T21:18:51.513Z
// scripts: 2

// === script #1 (length=5838) ===
function writeCookie(name, val) {
    document.cookie = name + "=" + val + "; path=/";
  }
  function readCookie(name) {
    var matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }
  function validateEmail(email) {
    var re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return re.test(String(email).toLowerCase());
  }
  var sha256 = function sha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    };
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length'
    var i, j; // Used as a counter across the whole file
    var result = ''
    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;
    var hash = sha256.h = sha256.h || [];
    var k = sha256.k = sha256.k || [];
    var primeCounter = k[lengthProperty];
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80' // Append Ƈ' bit (plus zero padding)
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00' // More zero padding
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return; // ASCII check: only accept characters in range 0-255
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength)
    for (j = 0; j < words[lengthProperty];) {
      var w = words.slice(j, j += 16);
      var oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var i2 = i + j;
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
          + ((e & hash[5]) ^ ((~e) & hash[6])) // ch
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) // s0
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
          ) | 0
          );
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  };
  if (window.location.href.indexOf("checkout") > -1) {
    window.onload = function () {
      const form = document.getElementById("checkout-container");
      form.addEventListener("submit", function () {
        var global_sha256_email_address = '';
        var global_sha256_phone_number = '';

        var cookie_email = readCookie('global_sha256_email_address');
        if (cookie_email != 'undefined' && cookie_email != '')
          global_sha256_email_address = cookie_email;

        var cookie_phone_number = readCookie('global_sha256_phone_number');
        if (cookie_phone_number != 'undefined' && cookie_phone_number != '')
          global_sha256_phone_number = cookie_phone_number;

        var email_input = document.getElementsByName('Recipient[delivery_email]');
        if (email_input.length > 0) {
          var email_address = email_input[0].value;
          if (email_address != '' && validateEmail(email_address)) {
            var sha256_email_address = sha256(email_address);
            global_sha256_email_address = sha256_email_address; // запис у глобальну змінну
            writeCookie('global_sha256_email_address', sha256_email_address, 2); // запис у кукі
          } else {
            global_sha256_email_address = ''; // запису у глобальну змінну
            writeCookie('global_sha256_email_address', '', 2); // запис у кукі
          }
        }

        var phone_input = document.getElementsByName('Recipient[delivery_phone]');
        if (phone_input.length > 0) {
          var phone_number = phone_input[0].value;
          if (phone_number != '') {
            phone_number = phone_number.replace(/[\ \-\)\(\+]/g, '').trim();
            if (phone_number.match(/^\d+$/) && phone_number.length >= 12 && phone_number.length <= 14) {
              phone_number = '+' + phone_number;
              var sha256_phone_number = sha256(phone_number);
              global_sha256_phone_number = sha256_phone_number; // запис у глобальну змінну
              writeCookie('global_sha256_phone_number', sha256_phone_number, 2); // запис у кукі
            } else {
              global_sha256_phone_number = ''; // запис у глобальну змінну
              writeCookie('global_sha256_phone_number', '', 2); // запис у кукі
            }
          }
        }
        gtag('set', 'user_data', {
            "sha256_email_address": global_sha256_email_address,
            "sha256_phone_number": global_sha256_phone_number
        });
      });
    };
  }

// === script #2 (length=5010) ===
/* Lantale Activity Badge — мультимовний */
(function(){
  "use strict";

  const CFG = {
    gallerySelectors: [
      '.product__gallery', '.b-product__gallery', '.product-gallery',
      '.product__media', '.product-media', '[data-product-gallery]', '[data-gallery]'
    ],
    fallbackSelectors: [
      '.product__info', '.product-main', '[itemtype*="Product"]', '[data-product-id]'
    ],
    colors: {
      accent: '#00A81D',
      text: '#2a2a2a',
      bg: '#ecfdef',
      border: 'rgba(0,0,0,0.05)'
    },
    languages: {
      uk: {
        low: 'Набирає популярність',
        mid: 'Популярно зараз',
        high: 'Гарячий попит',
        singular: 'переглядає цей товар',
        plural: 'переглядають цей товар'
      },
      ru: {
        low: 'Набирает популярность',
        mid: 'Популярно сейчас',
        high: 'Горячий спрос',
        singular: 'смотрит этот товар',
        plural: 'смотрят этот товар'
      },
      en: {
        low: 'Gaining popularity',
        mid: 'Popular now',
        high: 'Hot demand',
        singular: 'is viewing this product',
        plural: 'are viewing this product'
      },
      pl: {
        low: 'Zyskuje popularność',
        mid: 'Popularne teraz',
        high: 'Duże zainteresowanie',
        singular: 'ogląda ten produkt',
        plural: 'oglądają ten produkt'
      }
    }
  };

  function getLang(){
    const htmlLang = document.documentElement.lang?.toLowerCase() || 'uk';
    return CFG.languages[htmlLang] ? htmlLang : 'uk';
  }

  function injectStyles(){
    if (document.getElementById('lantale-activity-style')) return;
    const css = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap');
#lantale-activity-wrap{display:flex;justify-content:flex-start;margin:12px 0;padding-left:8px;}
#lantale-activity-widget{
  display:inline-flex;align-items:center;gap:.5rem;
  padding:.5rem .9rem;border:1px solid ${CFG.colors.border};
  border-radius:999px;background:${CFG.colors.bg};
  box-shadow:0 1px 6px rgba(0,0,0,.05);
  font:500 14px/1.2 'Montserrat',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
  color:${CFG.colors.text};
  user-select:none;white-space:nowrap;
  transform: translateY(0);
  transition: transform 0.3s ease-in-out;
}
#lantale-activity-widget:hover{
  transform: translateY(-2px);
}
#lantale-activity-widget .icon{
  width:16px;height:16px;border-radius:6px;background:${CFG.colors.accent};
  box-shadow:inset 0 0 0 2px #fff,0 2px 6px rgba(0,168,29,.4);
  animation: pulse 2s infinite ease-in-out;
}
@keyframes pulse{
  0%{box-shadow:0 0 0 0 rgba(0,168,29,.4);}
  50%{box-shadow:0 0 0 8px rgba(0,168,29,0);}
  100%{box-shadow:0 0 0 0 rgba(0,168,29,0);}
}
#lantale-activity-widget .num{font-weight:700;color:${CFG.colors.accent};}
#lantale-activity-widget .sep{width:1px;height:14px;background:linear-gradient(#0000,#0002,#0000);}
#lantale-activity-widget .hint{font-size:12px;opacity:.7;}
`;
    const s=document.createElement('style');
    s.id='lantale-activity-style';
    s.textContent=css;
    document.head.appendChild(s);
  }

  function createWidget(lang){
    const wrap=document.createElement('div'); wrap.id='lantale-activity-wrap';
    const el=document.createElement('div'); el.id='lantale-activity-widget';
    const m = CFG.languages[lang];
    el.innerHTML=`
      <span class="icon"></span>
      <span class="count"><span class="num">—</span> <span class="txt">зараз</span></span>
      <span class="sep"></span>
      <span class="hint">${m.mid}</span>
    `;
    wrap.appendChild(el);
    return wrap;
  }

  function insertWidget(lang){
    for (const sel of CFG.gallerySelectors){
      const gal=document.querySelector(sel);
      if(gal){ gal.insertAdjacentElement('afterend',createWidget(lang)); return true; }
    }
    for (const sel of CFG.fallbackSelectors){
      const host=document.querySelector(sel);
      if(host){ host.insertBefore(createWidget(lang),host.firstChild); return true; }
    }
    return false;
  }

  function startCounter(lang){
    const w=document.getElementById('lantale-activity-widget');
    if(!w) return;
    const n=w.querySelector('.num'), t=w.querySelector('.txt'), h=w.querySelector('.hint');
    const m = CFG.languages[lang];
    let count=Math.floor(5+Math.random()*30);
    setInterval(()=>{
      const d=Math.random()<0.5?-1:1;
      count=Math.max(3,Math.min(60,count+d*(Math.random()<0.7?1:2)));
      n.textContent=count;
      t.textContent=(count===1)?m.singular:m.plural;
      const low=10,high=45;
      h.textContent=(count<=low)?m.low:(count>=high?m.high:m.mid);
    },2200+Math.random()*1500);
  }

  function init(){
    const lang = getLang();
    injectStyles();
    if(insertWidget(lang)) startCounter(lang);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
