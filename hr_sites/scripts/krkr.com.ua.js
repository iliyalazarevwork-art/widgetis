// source: https://krkr.com.ua/
// extracted: 2026-05-07T21:18:58.742Z
// scripts: 2

// === script #1 (length=2590) ===
!function (t, e, c, n) {
        var s = e.createElement(c);
        s.async = 1, s.src = 'https://statics.esputnik.com/scripts/' + n + '.js';
        var r = e.scripts[0];
        r.parentNode.insertBefore(s, r);
        var f = function () {
            f.c(arguments);
        };
        f.q = [];
        f.c = function () {
            f.q.push(arguments);
        };
        t['eS'] = t['eS'] || f;
    }(window, document, 'script', '7965E99BD807406A8D50EC86F6F57A75');
var serviceOrigin="https://push.esputnik.com",currentVersion="1.2";self.addEventListener("install",function(a){self.skipWaiting()});self.addEventListener("activate",function(a){a.waitUntil(trackNewServiceWorkerActivation())});self.addEventListener("push",onPushNotification);self.addEventListener("notificationclick",function(a){var b=determineClickedLink(a);a.notification.close();b&&a.waitUntil(clients.openWindow(b))});
function onPushNotification(a){console.log("Push message",a);var b=(new Promise(function(c,d){try{var e=a.data?a.data.json():null;c(e)}catch(f){c(null)}})).then(function(c){return c?showNotification(c).then(function(){var d=JSON.stringify({id:c.id});return fetch(serviceOrigin+"/v1/notification/read",{method:"POST",headers:{"Content-Type":"application/json"},body:d})}):getNotificationContent()});a.waitUntil(b)}
function getNotificationContent(){return self.registration.pushManager.getSubscription().then(function(a){return fetch(serviceOrigin+"/v1/notification/get?token="+encodeURIComponent(a.endpoint)).then(function(b){if(200===b.status)return b.text().then(function(c){console.log(c);c=JSON.parse(c);return showNotification(c)})})})}
function showNotification(a){if(a){var b=a.content;b.data=getNotificationData(a);b.requireInteraction=a.interactionRequired?!0:!1;return self.registration.showNotification(b.title,b)}}function getNotificationData(a){var b={};b.clickReference=a.content.link;b.notificationId=a.id;b.actionLinks=collectActionLinks(a.content.actions);return b}function determineClickedLink(a){var b=a.notification.data;if(b)return a.action?b.actionLinks[a.action]:b.clickReference}
function collectActionLinks(a){var b={};a&&0<a.length&&a.forEach(function(c){b[c.action]=c.link});return b}function trackNewServiceWorkerActivation(){return self.registration.pushManager.getSubscription().then(function(a){return a?a.endpoint:null}).then(function(a){if(a)return fetch(serviceOrigin+"/v1/subscription/sw/version",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({version:currentVersion,endpoint:a})})}).catch(function(a){})};

// === script #2 (length=582) ===
document.addEventListener('spLiveChatLoaded', function () {

    // 1) Визначаємо мобільну версію
    var isMobile = window.innerWidth <= 768;

    // 2) Виставляємо різну позицію
    var chatBottom = isMobile ? '80px' : '110px';

    window.sp.liveChat.config({
      chatPosition: {
        bottom: chatBottom,
        right: '24px'
      },
      custom_img_button: {
        url: 'https://krkr.com.ua/content/uploads/images/stickers.png',
        hover_url: 'https://krkr.com.ua/content/uploads/images/stickers.png'
      },
      language: 'uk'
    });
  });
