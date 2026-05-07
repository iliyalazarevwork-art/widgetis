// source: https://geekach.com.ua/
// extracted: 2026-05-07T21:18:51.929Z
// scripts: 1

// === script #1 (length=664) ===
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
                js.src = "https://connect.facebook.net/uk_UA/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
