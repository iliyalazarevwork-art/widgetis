// source: https://wellamart.ua/
// extracted: 2026-05-07T21:18:59.047Z
// scripts: 3

// === script #1 (length=1243) ===
var cookie_name = 'deduplication_cookie';
var days_to_store = 90;
var deduplication_cookie_value = 'admitad';
var channel_name = 'target';
getSourceParamFromUri = function () {
	var pattern = channel_name + '=([^&]+)';
	var re = new RegExp(pattern);
	return (re.exec(document.location.search) || [])[1] || '';
};
getSourceCookie = function () {
	var matches = document.cookie.match(new RegExp(
		'(?:^|; )' + cookie_name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
};
setSourceCookie = function () {
	var param = getSourceParamFromUri();
	if (!param) { return; }
	var period = days_to_store * 60 * 60 * 24 * 1000;	
	var expiresDate = new Date((period) + +new Date);
	var cookieString = cookie_name + '=' + param + '; path=/; expires=' + expiresDate.toGMTString();
	document.cookie = cookieString;
	document.cookie = cookieString + '; domain=.' + location.host;
};

setSourceCookie();

if (!getSourceCookie(cookie_name)) {
	ADMITAD.Invoice.broker = 'na';
} else if (getSourceCookie(cookie_name) != deduplication_cookie_value) {
	ADMITAD.Invoice.broker = getSourceCookie(cookie_name);
} else {
	ADMITAD.Invoice.broker = 'adm';
}

// === script #2 (length=545) ===
window.fbAsyncInit = function() {
    FB.init({
      appId      : '477867143643609',
      cookie     : true,
      xfbml      : true,
      version    : 'v11.0'
    });
      
    FB.AppEvents.logPageView();   
      
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

// === script #3 (length=563) ===
window._retag = window._retag || [];
    window._retag.push({code: "9ce8884fe0", level: 0});
    (function () {
        var id = "admitad-retag";
        if (document.getElementById(id)) {return;}
        var s = document.createElement("script");
        s.async = true; s.id = id;
        var r = (new Date).getDate();
        s.src = (document.location.protocol == "https:" ? "https:" : "http:") + "//cdn.lenmit.com/static/js/retag.js?r="+r;
        var a = document.getElementsByTagName("script")[0]
        a.parentNode.insertBefore(s, a);
    })()
