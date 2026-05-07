// source: https://rebus.ua/
// extracted: 2026-05-07T21:22:28.846Z
// scripts: 4

// === script #1 (length=664) ===
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

// === script #2 (length=535) ===
(function(){
var mainPageCheck = document.querySelector('body').classList.contains('homepage');

if(mainPageCheck){
$(document).ready(function(){
$('div.productsMenu-tabs-content').addClass('hide');
$('div.productsMenu-submenu.__fluidGrid.__hasTabs.__pos_left').addClass('openCustomMenu');
});
$('div.productsMenu-tabs').mouseleave(function(){
	$('div.productsMenu-tabs-content').addClass('hide');
});
$('div.productsMenu-tabs').mouseenter(function(){
	$('div.productsMenu-tabs-content').removeClass('hide');
});
}
})();

// === script #3 (length=682) ===
if(mainPageCheck){

$(window).load(function(){
    var headerHeight = $('.header').height();
$('li.productsMenu-tabs-list__tab').mouseover(function(){

    let SubMenuTop = 0;
    SubMenuTop =
        $('li.productsMenu-tabs-list__tab.__hover')[0] === undefined ?
        SubMenuTop :
        $('li.productsMenu-tabs-list__tab.__hover')[0].getBoundingClientRect().top + window.pageYOffset - headerHeight;

    let SubMenuHeight = $('.productsMenu-tabs-content .productsMenu-submenu-w.__visible').height() + 50;
    $('div.productsMenu-tabs-content').css({
    
    'position':'relative',
    'top': SubMenuTop,
    'height': SubMenuHeight
    
    })

})
});};

// === script #4 (length=565) ===
(function(w,d){var hS=w.helpcrunchSettings;if(!hS||!hS.organization){return;}var widgetSrc='https://embed.helpcrunch.com/sdk.js';w.HelpCrunch=function(){w.HelpCrunch.q.push(arguments)};w.HelpCrunch.q=[];function r(){if (d.querySelector('script[src="' + widgetSrc + '"')) { return; }var s=d.createElement('script');s.async=1;s.type='text/javascript';s.src=widgetSrc;(d.body||d.head).appendChild(s);}if(d.readyState === 'complete'||hS.loadImmediately){r();} else if(w.attachEvent){w.attachEvent('onload',r)}else{w.addEventListener('load',r,false)}})(window, document)
