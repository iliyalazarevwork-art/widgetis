// source: https://we-mart.com/
// extracted: 2026-05-07T21:19:12.131Z
// scripts: 2

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

// === script #2 (length=658) ===
(function() {
  //var mainPageCheck = document.body == "/" ? true : false;
      var mainPageCheck = document.body.classList.contains('homepage');
  if (mainPageCheck) {
    $(document).ready(function() {
      $("div.productsMenu-tabs-content").addClass("hide");
      $("div.productsMenu-submenu.__fluidGrid.__hasTabs.__pos_left").addClass(
        "openCustomMenu"
      );
    });
    $("div.productsMenu-tabs").mouseleave(function() {
      $("div.productsMenu-tabs-content").addClass("hide");
    });
    $("div.productsMenu-tabs").mouseenter(function() {
      $("div.productsMenu-tabs-content").removeClass("hide");
    });
  }
})();
