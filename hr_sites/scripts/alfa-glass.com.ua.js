// source: https://alfa-glass.com.ua/
// extracted: 2026-05-07T21:19:55.099Z
// scripts: 2

// === script #1 (length=1033) ===
key – ключ API індивідуальний для вашого магазину (вже проставлений на посиланні і продубльований нижче);
datefrom, dateto – дати переходів від і до (включно) відповідно. Формат - yyyy-mm-dd;
type – формат відповіді (xml, json);
page – номер сторінки (необов'язковий параметр), від 0. Якщо вам потрібна відповідь, розбита на сторінки;
pagesize – кількість товарів на сторінці (якщо відповідь розбита на сторінки).
Видача статистики доповнена такими полями:

medium
source
campaign
id
content
keyword
Ці поля заповнюються значеннями наступних GET-параметрів у посиланні переходу товарної пропозиції клієнта (якщо ці параметри встановлені):

utm_medium
utm_source
utm_campaign
utm_id
utm_content
utm_term
Якщо немає одного або декількох відповідних параметрів у посиланні або товарна пропозиція в даний момент відсутня в фіді, то ці поля містять наступну інформацію:

medium – cpc
source – hotline
campaign – назва каталогу Хотлайн
id – id каталогу Хотлайн
content – id товару клієнта
keyword – назва товару

// === script #2 (length=976) ===
window.onload = function() {
    var targetButton = document.querySelectorAll( ".banner-a[href='/ograzhdeniya-iz-stekla/']" );

    var newList = [];

    var isMobile = document.getElementById( "signup-form-mobile" ) != null;

    // Apply click event on buttons
    isMobile ?
        // if mobile
        document.querySelector( "a.banner-a[href='/ograzhdeniya-iz-stekla/']" ).onclick = function(e) {
            e.preventDefault();
            document.getElementById( 'header' ).children[0].children[0].children[0].children[0].click();
            setTimeout( function() {
                document.querySelector( ".btn[href=\"#callback-form\"]" ).click();
            }, 1000 );
        } :
        // if Desktop
        document.querySelectorAll( ".banner-a[href='/ograzhdeniya-iz-stekla/']" )[0].onclick = function(e) {
            e.preventDefault();
            document.getElementsByClassName( "phones__callback-link" )[0].click();
        };
}
