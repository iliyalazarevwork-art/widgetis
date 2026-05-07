// source: https://ptashkinsad.com/
// extracted: 2026-05-07T21:18:55.909Z
// scripts: 2

// === script #1 (length=1139) ===
(function () {
  if (window.location.pathname !== '/checkout/') {
    return;
  }

  fetch('https://maluchok.lzrv.agency/checkout-allowed-status', {
    method: 'GET',
    credentials: 'include'
  })
    .then(function (response) {
      if (!response.ok) {
        return null;
      }
      return response.text();
    })
    .then(function (text) {
      if (!text) {
        return;
      }

      var value = text.trim().toLowerCase();

      if (value === 'false') {
        var ref = document.referrer;
        var hasPrev = false;

        if (ref) {
          try {
            var refUrl = new URL(ref);
            hasPrev =
              refUrl.origin === window.location.origin &&
              refUrl.pathname !== window.location.pathname;
          } catch (e) {
            hasPrev = false;
          }
        }

        if (hasPrev) {
          window.location.href = ref;
        } else {
          window.location.href = '/';
        }
      }
    })
    .catch(function (error) {
      console.error('Ошибка запроса /checkout-allowed-status:', error);
          });
})();

// === script #2 (length=2902) ===
(function () {

        var CONFIG = {
            styleId: "marquee-inline-styles",

            anchors: [
                {selector: ".header", position: "before"},
            ],

            phrases: [
                "✨Безкоштовна доставка Новою поштою у відділення/поштомат замовлень від 2500 грн (не діє під час акцій)✨",
                "✨ Обробка замовлень протягом 2 робочих днів. Відправка здійснюється у понеділок, середу та пʼятницю✨",
             
            ],
            css: `

    `
        };

        if (!document.getElementById(CONFIG.styleId)) {
            var style = document.createElement("style");
            style.id = CONFIG.styleId;
            style.appendChild(document.createTextNode(CONFIG.css));
            document.head.appendChild(style);
        }

        function insertAfter(el, node) {
            el.parentNode.insertBefore(node, el.nextSibling);
        }

        function insertBefore(el, node) {
            el.parentNode.insertBefore(node, el);
        }

        function findAnchor() {
            for (var i = 0; i < CONFIG.anchors.length; i++) {
                var item = CONFIG.anchors[i];
                var el = document.querySelector(item.selector);
                if (el) return {el: el, position: item.position};
            }
            return null;
        }

        function createMarquee() {
            if (document.querySelector(".marquee-wrapper")) return;

            var wrapper = document.createElement("div");
            wrapper.className = "marquee-wrapper";

            var track = document.createElement("div");
            track.className = "marquee-track";


            for (var blockIndex = 0; blockIndex < 2; blockIndex++) {
                var content = document.createElement("div");
                content.className = "marquee-content";


                for (var i = 0; i < 15; i++) {
                    CONFIG.phrases.forEach(function (p) {
                        var div = document.createElement("div");
                        div.className = "marquee-text";
                        div.textContent = p;
                        content.appendChild(div);
                    });
                }

                track.appendChild(content);
            }

            wrapper.appendChild(track);

            var anchor = findAnchor();

            if (anchor) {
                if (anchor.position === "after") insertAfter(anchor.el, wrapper);
                else insertBefore(anchor.el, wrapper);
            } else {
                document.body.insertBefore(wrapper, document.body.firstChild);
            }
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", createMarquee);
        } else {
            createMarquee();
        }
    })();
