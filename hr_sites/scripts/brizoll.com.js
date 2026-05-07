// source: https://brizoll.com/
// extracted: 2026-05-07T21:19:19.408Z
// scripts: 5

// === script #1 (length=748) ===
window.chat24_token = "04bc5cb2065c28393ad51640469aea19";
  window.chat24_url = "https://livechat-v2.chat24.io";
  window.chat24_socket_url ="wss://livechat-v2.chat24.io/widget_ws_new";
  window.chat24_show_new_wysiwyg = "true";
  window.chat24_static_files_domain = "https://storage.chat24.io/";
  window.lang = "ru";
  window.fetch("".concat(window.chat24_url, "/packs/manifest.json?nocache=").concat(new Date().getTime())).then(function (res) {
    return res.json();
  }).then(function (data) {
    var chat24 = document.createElement("script");
    chat24.type = "text/javascript";
    chat24.async = true;
    chat24.src = "".concat(window.chat24_url).concat(data["application.js"]);
    document.body.appendChild(chat24);
  });

// === script #2 (length=928) ===
(function(d) {
        d.querySelectorAll('.j-phone-item').forEach(function (el) {
            el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
        })
    })(document);
    (function(d, w, s) {
        var widgetHash = 'sh0nxync5y86fugej7zf', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
        ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
        var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
      })(document, window, 'script');
const waitB = setInterval(() => {if (!!window.BinotelCallTracking) {
  for (key in window.BinotelCallTracking) {
      if(window.BinotelCallTracking[key]['initState']=="success"){
        setTimeout(document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/\D/g, ''))),0)
clearInterval(waitB)}}}},1000)

// === script #3 (length=655) ===
var _protocol="https:"==document.location.protocol?" https://":" http://"
    _site_hash_code = "8ce6b0c9dc55b88dd744aa8c2df507a0",_suid=21269, plerdyScript=document.createElement("script");
    plerdyScript.setAttribute("defer",""),plerdyScript.dataset.plerdyMainScript="plerdyMainScript",
    plerdyScript.src="https://a.plerdy.com/public/js/click/main.js?v="+Math.random();
    var plerdyMainScript=document.querySelector("[data-plerdyMainScript='plerdyMainScript']");
    plerdyMainScript&&plerdyMainScript.parentNode.removeChild(plerdyMainScript);
    try{document.head.appendChild(plerdyScript)}catch(t){console.log(t,"unable add script tag")}

// === script #4 (length=656) ===
var _protocol="https:"==document.location.protocol?" https://":" http://";
    _site_hash_code = "0379485c8d6a7bc0fe10afec171b1104",_suid=27843, plerdyScript=document.createElement("script");
    plerdyScript.setAttribute("defer",""),plerdyScript.dataset.plerdymainscript="plerdymainscript",
    plerdyScript.src="https://a.plerdy.com/public/js/click/main.js?v="+Math.random();
    var plerdymainscript=document.querySelector("[data-plerdymainscript='plerdymainscript']");
    plerdymainscript&&plerdymainscript.parentNode.removeChild(plerdymainscript);
    try{document.head.appendChild(plerdyScript)}catch(t){console.log(t,"unable add script tag")}

// === script #5 (length=654) ===
var _protocol="https:"==document.location.protocol?"https://":"http://";
    _site_hash_code = "0d0871a945bb0b3702b4ebae4a42cf0b",_suid=66034, plerdyScript=document.createElement("script");
    plerdyScript.setAttribute("defer",""),plerdyScript.dataset.plerdymainscript="plerdymainscript",
    plerdyScript.src="https://a.plerdy.com/public/js/click/main.js?v="+Math.random();
    var plerdymainscript=document.querySelector("[data-plerdymainscript='plerdymainscript']");
    plerdymainscript&&plerdymainscript.parentNode.removeChild(plerdymainscript);
    try{document.head.appendChild(plerdyScript)}catch(t){console.log(t,"unable add script tag")}
