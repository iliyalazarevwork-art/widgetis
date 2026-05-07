// source: https://zella.ua/
// extracted: 2026-05-07T21:20:24.676Z
// scripts: 2

// === script #1 (length=565) ===
(function(w,d){var hS=w.helpcrunchSettings;if(!hS||!hS.organization){return;}var widgetSrc='https://embed.helpcrunch.com/sdk.js';w.HelpCrunch=function(){w.HelpCrunch.q.push(arguments)};w.HelpCrunch.q=[];function r(){if (d.querySelector('script[src="' + widgetSrc + '"')) { return; }var s=d.createElement('script');s.async=1;s.type='text/javascript';s.src=widgetSrc;(d.body||d.head).appendChild(s);}if(d.readyState === 'complete'||hS.loadImmediately){r();} else if(w.attachEvent){w.attachEvent('onload',r)}else{w.addEventListener('load',r,false)}})(window, document)

// === script #2 (length=578) ===
$(function () {
        var sizeTitle = $('div.modification__title:contains("Розмір"), div.modification__title:contains("Размер")');

        if (sizeTitle) {
            $(document).on('change', '#j-mod-prop-size', function () {
                return sizeTitle.parents('.modification').find('.modification__list > a').toArray().sort(function (a, b) {
                    return a.innerText.localeCompare(b.innerText);
                }).forEach(function (el, i) {
                    return el.style.order = i;
                });
            });
        }
    });
