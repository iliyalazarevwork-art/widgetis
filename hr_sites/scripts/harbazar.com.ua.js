// source: https://harbazar.com.ua/
// extracted: 2026-05-07T21:21:32.069Z
// scripts: 1

// === script #1 (length=6226) ===
function writeCookie(name, val, days) {
    const isHttps = location.protocol === 'https:';
    let expires = "";
    if (typeof days === "number") {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + d.toUTCString();
    }
    document.cookie =
      name + "=" + encodeURIComponent(val) +
      expires +
      "; path=/; SameSite=Lax" +
      (isHttps ? "; Secure" : "");
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
    function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j;
    var result = '';
    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;
    var hash = sha256.h = sha256.h || [];
    var k = sha256.k = sha256.k || [];
    var primeCounter = k[lengthProperty];
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return;
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength);
    for (j = 0; j < words[lengthProperty];) {
      var w = words.slice(j, j += 16);
      var oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
          + ((e & hash[5]) ^ ((~e) & hash[6]))
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0);
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
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
    window.addEventListener("load", function () {
      var tries = 0;
      var MAX_TRIES = 20; // ~10 сек

      function bind() {
        tries++;
        var form = document.getElementById("checkout-container");
        if (!form) {
          if (tries < MAX_TRIES) return setTimeout(bind, 500);
          return;
        }

        form.addEventListener("submit", function () {
          var global_sha256_email_address = '';
          var global_sha256_phone_number = '';

          // email
          var email_input = document.getElementsByName('Recipient[delivery_email]');
          if (email_input.length > 0) {
            var email_address = (email_input[0].value || '').trim().toLowerCase();
            if (email_address !== '' && validateEmail(email_address)) {
              global_sha256_email_address = sha256(email_address);
              writeCookie('global_sha256_email_address', global_sha256_email_address, 2);
            } else {
              writeCookie('global_sha256_email_address', '', 2);
            }
          }

          // phone (под твою маску: +38 (0__) ___-__-__)
          var phone_input = document.getElementsByName('Recipient[delivery_phone]');
          if (phone_input.length > 0) {
            var phone_raw = (phone_input[0].value || '').trim();
            if (phone_raw !== '') {
              var digits = phone_raw.replace(/\D/g, ''); // только цифры

              // Варианты, которые встречаются чаще всего:
              // 380XXXXXXXXX (12 цифр) - идеально
              // 0XXXXXXXXX (10 цифр)   - добавим 38
              if (digits.length === 10 && digits[0] === '0') {
                digits = '38' + digits; // 380XXXXXXXXX
              }

              // Строгая проверка UA: 380 + 9 цифр
              if (/^380\d{9}$/.test(digits)) {
                var phone_e164 = '+' + digits;
                global_sha256_phone_number = sha256(phone_e164);
                writeCookie('global_sha256_phone_number', global_sha256_phone_number, 2);
              } else {
                writeCookie('global_sha256_phone_number', '', 2);
              }
            }
          }

          // синхронизируем глобальные переменные
          window.global_sha256_email_address = global_sha256_email_address || '';
          window.global_sha256_phone_number = global_sha256_phone_number || '';

          // отправляем в gtag, если он есть
          if (typeof window.gtag === "function") {
            window.gtag('set', 'user_data', {
              sha256_email_address: window.global_sha256_email_address,
              sha256_phone_number: window.global_sha256_phone_number
            });
          }
        });
      }

      bind();
    });
  }
