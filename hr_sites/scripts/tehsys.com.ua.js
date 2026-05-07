// source: https://tehsys.com.ua/
// extracted: 2026-05-07T21:20:21.154Z
// scripts: 2

// === script #1 (length=1130) ===
if (location.pathname.indexOf("/ru") === 0) {
    window.BinotelChatSettings = {
      language: "ru",
      aa_welcomText:
        "Здравствуйте! Наши операторы онлайн и готовы ответить на ваши вопросы. Напишите ваше сообщение в чат.",
      aa_welcomMessageFromEmployeeText:
        "Рады приветствовать вас на нашем сайте. Что вас интересует? Если возникли вопросы, пишите нам в чат. Мы всегда готовы помочь!",
      of_welcomText:
        "Все наши операторы сейчас оффлайн. Оставьте свои контактные данные, и мы свяжемся с вами в ближайшее время. Спасибо за обращение!",
      nwtf_welcomText:
        "Здравствуйте! В настоящее время мы не работаем и операторов нет в сети. Оставьте свои контакты, и мы свяжемся с вами в ближайшее время.",
      cf_welcomText:
        "Чтобы продолжить общение и мы могли предоставить Вам лучший сервис, заполните, пожалуйста, контактную форму:",
      qb_1_text: "Швидка відповідь відвідувача 1",
      qb_2_text: "Швидка відповідь відвідувача 2",
      qb_3_text: "Швидка відповідь відвідувача 3",
      wt_welcomeText: "Текст перед вибором групи операторів",
    };
  }

// === script #2 (length=851) ===
(function(d) {
d.querySelectorAll('.j-phone-item').forEach(function (el) {
el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
})
})(document);
(function(d, w, s) {
var widgetHash = 'dsgozxowvt7eabkk7jqh', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
})(document, window, 'script');
const waitB = setInterval(() => {if (!!window.BinotelCallTracking) {
for (let key in window.BinotelCallTracking) {
if(window.BinotelCallTracking[key]['initState']==="success"){
setTimeout(document.querySelectorAll('.j-phone-item').forEach(item => (item.dataset.fakeHref = 'tel:' + item.textContent.replace(/\D/g, ''))),0)
clearInterval(waitB)}}}},1000)
