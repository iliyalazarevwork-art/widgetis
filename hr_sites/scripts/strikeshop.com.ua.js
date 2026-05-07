// source: https://strikeshop.com.ua/
// extracted: 2026-05-07T21:18:59.615Z
// scripts: 4

// === script #1 (length=567) ===
(function() {
        var d = document, w = window;
        w.MgSensorData = w.MgSensorData || [];
        w.MgSensorData.push({
            cid:844034,
            project: "a.mgid.com"
        });
        var l = "a.mgid.com";
        var n = d.getElementsByTagName("script")[0];
        var s = d.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        var dt = !Date.now?new Date().valueOf():Date.now();
        s.src = "https://" + l + "/mgsensor.js?d=" + dt;
        n.parentNode.insertBefore(s, n);
    })();

// === script #2 (length=5196) ===
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
         new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
         j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
         'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-M9MNLLP2');

    document.addEventListener('DOMContentLoaded', function () {
        const currentURL = window.location.href;

        const clickElements = () => {
            const productOrderBlockElements = document.querySelectorAll('.product-order__block a');

            productOrderBlockElements.forEach((element, index) => {
                if (currentURL.includes('?add_to_cart') && index === 0) {
                    element.click(); 
                } else if (currentURL.includes('?add_to_cart_fast') && index === 1) {
                    element.click(); 
                }
            });

            clearInterval(interval);
        };

        const interval = setInterval(clickElements, 100);
    });

document.addEventListener('DOMContentLoaded', function () {
        // Стилі для контейнера кнопок
        const chatContainer = document.createElement('div');
        chatContainer.style.position = 'fixed';
        chatContainer.style.bottom = '20px';
        chatContainer.style.right = '20px';
        chatContainer.style.display = 'flex';
        chatContainer.style.flexDirection = 'column';
        chatContainer.style.gap = '10px'; // Відстань між кнопками
        chatContainer.style.zIndex = '1000';

        // Створення кнопки Telegram
        const telegramButton = document.createElement('a');
        telegramButton.href = 'https://t.me/strikeshop_comua'; // Посилання на ваш Telegram канал
        telegramButton.target = '_blank';
        telegramButton.style.display = 'flex';
        telegramButton.style.alignItems = 'center';
        telegramButton.style.justifyContent = 'center';
        telegramButton.style.width = '60px';
        telegramButton.style.height = '60px';
        telegramButton.style.backgroundColor = '#0088cc'; // Колір Telegram
        telegramButton.style.borderRadius = '50%';
        telegramButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        telegramButton.style.cursor = 'pointer';
        telegramButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M9.684 15.455 8.528 20.487c.482 0 .686-.207.93-.454l2.239-2.143 4.644 3.409c.846.467 1.44.222 1.647-.783l2.985-14.15c.268-1.197-.437-1.667-1.224-1.375L2.27 9.677c-1.16.454-1.144 1.106-.2 1.403l4.57 1.428 10.617-6.682c.5-.307.955-.137.582.198z"/>
            </svg>
        `;
        chatContainer.appendChild(telegramButton);

        // Створення кнопки Viber
        const viberButton = document.createElement('a');
        viberButton.href = 'viber://chat?number=%2B380983432441'; // Посилання на чат Viber
        viberButton.target = '_blank';
        viberButton.style.display = 'flex';
        viberButton.style.alignItems = 'center';
        viberButton.style.justifyContent = 'center';
        viberButton.style.width = '60px';
        viberButton.style.height = '60px';
        viberButton.style.backgroundColor = '#59267C'; // Колір Viber
        viberButton.style.borderRadius = '50%';
        viberButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        viberButton.style.cursor = 'pointer';
        viberButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 0H6.528C2.928 0 0 2.928 0 6.528v10.944C0 21.072 2.928 24 6.528 24h10.944C21.072 24 24 21.072 24 17.472V6.528C24 2.928 21.072 0 17.472 0zm-4.416 20.4c-.888 0-1.752-.12-2.592-.36-.408-.12-.792-.288-1.128-.48-.336-.192-.648-.432-.936-.72l-1.512-1.512c-2.376-2.376-3.84-5.304-4.248-8.784-.096-.792.504-1.488 1.32-1.488h1.824c.624 0 1.2.432 1.32 1.032.072.432.168.864.288 1.272.096.36.024.768-.216 1.08l-.792 1.104c-.048.072-.048.168.024.24.408.552.84 1.08 1.344 1.56.48.48.984.936 1.536 1.344.072.072.168.072.24.024l1.104-.792c.312-.216.72-.288 1.08-.216.408.12.84.216 1.272.288.6.12 1.032.696 1.032 1.32v1.824c0 .816-.696 1.416-1.488 1.32-1.104-.144-2.184-.432-3.216-.864-.12-.048-.24-.048-.336.024l-1.392.984c-.168.144-.192.384-.048.552 1.056 1.368 2.376 2.472 3.888 3.288.12.072.24.12.384.072.984-.288 1.872-.744 2.688-1.344 1.992-1.488 3.144-3.792 2.88-6.216-.192-2.016-1.008-3.792-2.28-5.136-1.32-1.416-3.024-2.304-4.896-2.352-2.28-.048-4.296.768-5.88 2.304-.168.168-.384.192-.552.048l-1.008-.744c-.216-.168-.264-.48-.048-.672C9.96 3.216 12.408 2.016 15.048 2.4c2.232.312 4.2 1.44 5.64 3.216 1.512 1.848 2.352 4.2 2.472 6.696.12 2.64-.96 5.136-2.88 6.96-1.104.984-2.376 1.704-3.816 2.16-.528.168-1.08.288-1.632.36-.336.048-.672.072-.984.072z"/>
            </svg>
        `;
        chatContainer.appendChild(viberButton);

        // Додаємо контейнер кнопок на сторінку
        document.body.appendChild(chatContainer);
    });

// === script #3 (length=1231) ===
'use strict';
if (document.querySelector('meta[itemprop=sku]')) {
console.log('Offer ID: '+document.querySelector('meta[itemprop=sku]').getAttribute('content'));
(function(g,h,p){function d(){try{var a=g.createElement("script"),q=(new Date).getTime();a.type="text/javascript";a.src=c;a.onerror=function(){!k&&300>(new Date).getTime()-q?(k=!0,c=r+l,setTimeout(d,10)):(b++,5>b?setTimeout(d,10):e(b+"!"+c))};a.onload=function(){window.rc_cache&&!f&&m.setItem("rc_cache",window.rc_cache);b&&e(b+"!"+c)};g.getElementsByTagName("head")[0].appendChild(a)}catch(t){n(t)}}function n(a){e(a.name+": "+a.message+"\t"+(a.stack?a.stack.replace(a.name+": "+a.message,""):""))}function e(a){console.error(a);(new Image).src="https://go.rcvlinks.com/err/?setr="+h+"&ms="+((new Date).getTime()-u)+"&ver="+v+"&text="+encodeURIComponent(a)}try{var v="240322-2103",u=(new Date).getTime(),k=!1,r=atob("aHR0cHM6Ly9iLXNpbmcuY29t"),f,m=window.localStorage,l="/setr/"+h+"/?"+p+((f=m.getItem("rc_cache"))?"&cache="+f:"")+"&rnd="+Math.floor(999*Math.random()),c="https://go.rcvlink.com"+l,b=0;d()}catch(a){n(a)}})(document,"3826","offer="+document.querySelector('meta[itemprop=sku]').getAttribute('content')+"");
console.log('Dynamic script started');
}

// === script #4 (length=567) ===
(function() {
        var d = document, w = window;
        w.MgSensorData = w.MgSensorData || [];
        w.MgSensorData.push({
            cid:844034,
            project: "a.mgid.com"
        });
        var l = "a.mgid.com";
        var n = d.getElementsByTagName("script")[0];
        var s = d.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        var dt = !Date.now?new Date().valueOf():Date.now();
        s.src = "https://" + l + "/mgsensor.js?d=" + dt;
        n.parentNode.insertBefore(s, n);
    })();
