// source: https://sportmarket.net.ua/
// extracted: 2026-05-07T21:19:06.644Z
// scripts: 6

// === script #1 (length=775) ===
// source file: /vendor/helpers/SVGCache.js
        !function(e,t){"use strict";var n="/frontend/themes/horoshop_default/layout/img/svgdefs.svg",o=1679484357;if(!t.createElementNS||!t.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect)return!0;var a,r,l="localStorage"in e&&null!==e.localStorage,i=function(){t.body.insertAdjacentHTML("afterbegin",r)},s=function(){t.body?i():t.addEventListener("DOMContentLoaded",i)};if(l&&localStorage.getItem("inlineSVGrev")==o&&(r=localStorage.getItem("inlineSVGdata")))return s(),!0;try{a=new XMLHttpRequest,a.open("GET",n,!0),a.onload=function(){a.status>=200&&a.status<400&&(r=a.responseText,s(),l&&(localStorage.setItem("inlineSVGdata",r),localStorage.setItem("inlineSVGrev",o)))},a.send()}catch(c){}}(window,document);

// === script #2 (length=824) ===
(function ($) {
        var container = $('#92324fcfc1852bcaa313257a887c4d4d'),
            allow = false,
            link = container.find('.j-compare-link'),
            count = container.find('.j-count');
        link.off('click').on('click', function () {
            allow && ComparisonTable.getInstance() && ComparisonTable.getInstance().openModal();

            return false;
        });
        ComparisonList.attachEventHandlers({
            onChange: function () {
                var countVal = this.count * 1;
                allow = countVal !== 0;
                if (countVal === 0) {
                    link.addClass('__disable');
                } else {
                    link.removeClass('__disable');
                }
                count.html(countVal);
            }
        });
    })(jQuery);

// === script #3 (length=866) ===
$(function() {
                $('#795f9a3e57ea34c934a9898a5cb713a0-5649').tooltip({
                    content: $('#tooltip-795f9a3e57ea34c934a9898a5cb713a0'),
                    container: $('#tooltip-795f9a3e57ea34c934a9898a5cb713a0').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-795f9a3e57ea34c934a9898a5cb713a0').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #4 (length=865) ===
$(function() {
                $('#6899037349ca91805e8f2e429bd2a0f6-644').tooltip({
                    content: $('#tooltip-6899037349ca91805e8f2e429bd2a0f6'),
                    container: $('#tooltip-6899037349ca91805e8f2e429bd2a0f6').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-6899037349ca91805e8f2e429bd2a0f6').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #5 (length=866) ===
$(function() {
                $('#ba3751a245cb096963ef430a82b66c68-4658').tooltip({
                    content: $('#tooltip-ba3751a245cb096963ef430a82b66c68'),
                    container: $('#tooltip-ba3751a245cb096963ef430a82b66c68').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-ba3751a245cb096963ef430a82b66c68').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #6 (length=582) ===
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-80577447-1', 'auto');
  ga('require', 'ec');
  ga('set', '&cu', GLOBAL.currency.iso);

   // заменяется кодом инициализации события с расположением "Внутри кода инициализации маркетинговой системы"
  
  ga('send', 'pageview');
