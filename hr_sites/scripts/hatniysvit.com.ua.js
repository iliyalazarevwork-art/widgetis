// source: https://hatniysvit.com.ua/
// extracted: 2026-05-07T21:21:33.381Z
// scripts: 2

// === script #1 (length=2358) ===
(function() {
  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, value, days, domain) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; domain=${domain}; expires=${expires}`;
  }

  function deleteCookie(name, domain) {
    document.cookie = `${name}=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const clickId = urlParams.get('utm_content');
  const utmSource = urlParams.get('utm_source');

  const hostParts = window.location.hostname.split('.');
  const rootDomain = '.hatniysvit.com.ua';

  setTimeout(function () {
    if (utmSource === 'google' || utmSource === 'fb') {
      ['sbjs_current', 'sbjs_first'].forEach((cookieName) => {
        let val = getCookie(cookieName);
        if (!val) return;

        const updated = val.replace(/(\|{2,3})?cnt=[^|]+/g, '');
        setCookie(cookieName, updated, 30, rootDomain);
      });

      deleteCookie('sd_click_id', rootDomain);
      return;
    }

    if (clickId && utmSource == 'salesdoubler') {
      ['sbjs_current', 'sbjs_first'].forEach((cookieName) => {
        let val = getCookie(cookieName);
        if (!val) return;

        const updated = val.match(/cnt=([^|]+)/)
          ? val.replace(/cnt=([^|]+)/, `cnt=sd_click_id|${clickId}`)
          : val + `|||cnt=sd_click_id|${clickId}`;

        setCookie(cookieName, updated, 30, rootDomain);
      });

      setCookie('sd_click_id', clickId, 30, rootDomain);
    }

    //
    const sdClickId = getCookie('sd_click_id');
    const sbjsVal = getCookie('sbjs_current');

    if (sbjsVal && sbjsVal.includes('mdm=organic') && sdClickId) {
      ['sbjs_current', 'sbjs_first'].forEach((cookieName) => {
        let val = getCookie(cookieName);
        if (!val) return;

        const updated = val.match(/cnt=([^|]+)/)
          ? val.replace(/cnt=([^|]+)/, `cnt=sd_click_id|${sdClickId}`)
          : val + `|||cnt=sd_click_id|${sdClickId}`;

        setCookie(cookieName, updated, 30, rootDomain);
      });
    }

  }, 2000);
})();

// === script #2 (length=650) ===
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
