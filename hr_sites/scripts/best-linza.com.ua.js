// source: https://best-linza.com.ua/
// extracted: 2026-05-07T21:20:55.403Z
// scripts: 1

// === script #1 (length=552) ===
var chatbox = document.getElementById('fb-customer-chat');
chatbox.setAttribute("page_id", "125658688834834");
chatbox.setAttribute("attribution", "biz_inbox");

window.fbAsyncInit = function() {
FB.init({
xfbml : true,
version : 'v12.0'
});
};

(function(d, s, id) {
var js, fjs = d.getElementsByTagName(s)[0];
if (d.getElementById(id)) return;
js = d.createElement(s); js.id = id;
js.src = 'https://connect.facebook.net/ru_RU/sdk/xfbml.customerchat.js';
fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
