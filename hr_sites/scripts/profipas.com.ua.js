// source: https://profipas.com.ua/
// extracted: 2026-05-07T21:20:20.018Z
// scripts: 3

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

// === script #2 (length=1129) ===
let colors = {
    color1: "rgba(255,255,255,1)",
    color2: "rgba(222,184,142,1)",
    color3: "rgba(232,248,255,1)",
    color4: "rgba(135,143,145,1)"
};
let options = {
    alphaSpeed: 10,
    alphaVariance: 1,
    color: [colors.color1, colors.color2, colors.color3, colors.color4],
    composition: "source-over",
    count: 350,
    direction: 161,
    float: 0.75,
    glow: 0,
    imageUrl: [
        "/upload/sparticles/snow-1.svg",
        "/upload/sparticles/snow-2.svg",
        "/upload/sparticles/snow-3.svg",
        "/upload/sparticles/snow-4.svg",
        "/upload/sparticles/snow-5.svg",
        "/upload/sparticles/snow-6.svg"
    ],
    maxAlpha: 2,
    maxSize: 22,
    minAlpha: -0.2,
    minSize: 4,
    parallax: 1.75,
    rotation: 0.5,
    shape: "image",
    speed: 3,
    style: "fill",
    twinkle: false,
    xVariance: 5,
    yVariance: 0,
};
window.onload = function() {
    initSparticles();
}
window.initSparticles = function() {
    var $main = document.querySelector('.falling');
    window.mySparticles = new sparticles.Sparticles($main,options);
};

// === script #3 (length=539) ===
(function(d) {
        d.querySelectorAll('.j-phone-item').forEach(function (el) {
            el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
        })
    })(document);
    (function(d, w, s) {
        var widgetHash = '', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
        ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
        var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
      })(document, window, 'script');
