// source: https://frontgift.com.ua/
// extracted: 2026-05-07T21:19:53.610Z
// scripts: 2

// === script #1 (length=1304) ===
document.addEventListener("DOMContentLoaded", function() {
  let messenger = localStorage.getItem("preferredMessenger");
  
  if (messenger) {
    showMessengerLink(messenger);
  } else {
    document.getElementById("messenger-choice").style.display = "block";
  }
});

function chooseMessenger(messenger) {
  localStorage.setItem("preferredMessenger", messenger);
  showMessengerLink(messenger);
}

function showMessengerLink(messenger) {
  document.getElementById("messenger-choice").style.display = "none";
  document.getElementById("messenger-link").style.display = "block";
  
  let url = "#";
  let text = "";
  
  if (messenger === "telegram") {
    url = "https://t.me/твій_бот";
    text = "Telegram";
  } else if (messenger === "viber") {
    url = "viber://pa?chatURI=твій_viber";
    text = "Viber";
  } else if (messenger === "chat") {
    url = "https://твій_сайт/online-chat";
    text = "Чат на сайті";
  }
  
  let link = document.getElementById("messenger-url");
  link.href = url;
  link.textContent = "Перейти у " + text;
}

function resetMessenger() {
  localStorage.removeItem("preferredMessenger");
  document.getElementById("messenger-link").style.display = "none";
  document.getElementById("messenger-choice").style.display = "block";
}

// === script #2 (length=846) ===
(function(d) {
d.querySelectorAll('.j-phone-item').forEach(function (el) {
el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
})
})(document);
(function(d, w, s) {
var widgetHash = '0ryw99rf5ox56x21kliw', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
})(document, window, 'script');
const waitB = setInterval(() => {if (!!window.BinotelCallTracking) {
for (key in window.BinotelCallTracking) {
if(window.BinotelCallTracking[key]['initState']=="success"){
setTimeout(document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/\D/g, ''))),0)
clearInterval(waitB)}}}},1000)
