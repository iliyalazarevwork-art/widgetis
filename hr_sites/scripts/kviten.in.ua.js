// source: https://kviten.in.ua/
// extracted: 2026-05-07T21:19:11.838Z
// scripts: 2

// === script #1 (length=675) ===
window.fbAsyncInit = function() {
                FB.init({
                    appId            : 'GTM-KW474ZZ',
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

// === script #2 (length=549) ===
var chatbox = document.getElementById('fb-customer-chat');
chatbox.setAttribute("page_id", "353192652085579");
chatbox.setAttribute("attribution", "page_inbox");
window.fbAsyncInit = function() {
FB.init({
xfbml : true,
version : 'v10.0'
});
};
(function(d, s, id) {
var js, fjs = d.getElementsByTagName(s)[0];
if (d.getElementById(id)) return;
js = d.createElement(s); js.id = id;
js.src = 'https://connect.facebook.net/ru_RU/sdk/xfbml.customerchat.js';
fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
