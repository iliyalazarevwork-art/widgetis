// source: https://livehealthy.com.ua/
// extracted: 2026-05-07T21:19:31.763Z
// scripts: 3

// === script #1 (length=846) ===
(function(d) {
d.querySelectorAll('.j-phone-item').forEach(function (el) {
el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
})
})(document);
(function(d, w, s) {
var widgetHash = 'fs6b8az3a8ofaofgt4it', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
})(document, window, 'script');
const waitB = setInterval(() => {if (!!window.BinotelCallTracking) {
for (key in window.BinotelCallTracking) {
if(window.BinotelCallTracking[key]['initState']=="success"){
setTimeout(document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/\D/g, ''))),0)
clearInterval(waitB)}}}},1000)

// === script #2 (length=534) ===
if (location.pathname.indexOf('/ua') === 0) {
window.BinotelGetCallSettings = {
language: 'ua'
};
} else if (location.pathname.indexOf('/en') === 0) {
window.BinotelGetCallSettings = {
language: 'en'
};
}
(function(d, w, s) {
var widgetHash = 'yb4s1fwncdhwtu8m8t8x', gcw = d.createElement(s); gcw.type = 'text/javascript'; gcw.async = true;
gcw.src = '//widgets.binotel.com/getcall/widgets/'+ widgetHash +'.js';
var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(gcw, sn);
  })(document, window, 'script');

// === script #3 (length=1609) ===
if (location.pathname.includes("/en")) {window.BinotelChatSettings = {language: "en",qb_1_text: "Consultation",qb_2_text: "Help with payment",qb_3_text: "Leave contacts",aa_welcomText:"Hello! Our operators are online and ready to help you. Ask your questions in the chat.",cf_welcomText:"In order to continue communication and we could provide you with the best service, please fill out the contact form:",of_welcomText:"Welcome! Unfortunately, we are not connected at the moment. Please leave your contacts and we will contact you.",wt_welcomeText:"Please select the department of the company you would like to contact",nwtf_welcomText:"Hello! We're not online right now, but we want to help. Please leave your contacts and we will contact you during business hours.",cf_fieldNameText: "Name",of_fieldNameText: "Name",qb_1_auto_answer: "Do you need advice on prices, services or products?",qb_2_auto_answer:"Thank you for contacting us! Tell me, please, do you want to pay for the order in cash or by bank transfer?",qb_3_auto_answer: null,of_cloudWelcomeText:"Welcome! Unfortunately, we are not connected at the moment. Please leave your contacts and we will contact you.",nwtf_cloudWelcomeText:"Hello! We're not online right now, but we want to help. Please leave your contacts and we will contact you during business hours.",cf_fieldAdditionalText: "Additional field",of_fieldAdditionalText: "Additional field",aa_welcomMessageFromEmployeeText:"Hello! We are glad to welcome you on our site. Write what you are interested in and I will help you.",};} else {window.BinotelChatSettings = {language: "ua",};}
