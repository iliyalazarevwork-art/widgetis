// source: https://boikovmonety.com.ua/
// extracted: 2026-05-07T21:20:57.456Z
// scripts: 2

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

// === script #2 (length=1244) ===
merchantWidgetScript.addEventListener('load', function () {
    merchantwidget.start({

<!-- This code goes into the HTML section of the Google Tag Manager Tag Configuration (Tag type: Custom HTML) -->
<script>
// General function
function appendHints(t){function e(t){var e=document.createElement("img");e.setAttribute("width","1"),e.setAttribute("height","1"),e.setAttribute("border","none"),e.setAttribute("src",t),document.body.appendChild(e)}return navigator&&navigator.userAgentData&&navigator.userAgentData.getHighEntropyValues?navigator.userAgentData.getHighEntropyValues(["architecture","bitness","fullVersionList","platformVersion","model","wow64"]).then((function(r){var n={};["architecture","bitness","fullVersionList","platform","platformVersion","model","mobile","wow64"].forEach((function(t){r&&null!==r[t]&&void 0!==r[t]&&(n[t]=r[t])}));var a=btoa(JSON.stringify(n)),i=new URL(t),o=new URLSearchParams(i.search);o.append("ch",a),i.search=o;var s=i.toString();return e(s),s})):(e(t),Promise.resolve(t))};
 // Function call which is expecting a tracker URL
appendHints("https://ads.trafficjunky.net/ct?a=1000563861&member_id=1007073402&cb=[RANDOM_NUMBER]&cti=[TRANSACTION_UNIQ_ID]&ctv=1.00&ctd=[TRANSACTION_DESCRIPTION]");
