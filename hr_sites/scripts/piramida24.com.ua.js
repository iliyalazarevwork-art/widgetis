// source: https://piramida24.com.ua/
// extracted: 2026-05-07T21:19:00.868Z
// scripts: 7

// === script #1 (length=775) ===
// source file: /vendor/helpers/SVGCache.js
        !function(e,t){"use strict";var n="/frontend/themes/horoshop_default/layout/img/svgdefs.svg",o=1594711695;if(!t.createElementNS||!t.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect)return!0;var a,r,l="localStorage"in e&&null!==e.localStorage,i=function(){t.body.insertAdjacentHTML("afterbegin",r)},s=function(){t.body?i():t.addEventListener("DOMContentLoaded",i)};if(l&&localStorage.getItem("inlineSVGrev")==o&&(r=localStorage.getItem("inlineSVGdata")))return s(),!0;try{a=new XMLHttpRequest,a.open("GET",n,!0),a.onload=function(){a.status>=200&&a.status<400&&(r=a.responseText,s(),l&&(localStorage.setItem("inlineSVGdata",r),localStorage.setItem("inlineSVGrev",o)))},a.send()}catch(c){}}(window,document);

// === script #2 (length=1261) ===
(function ($) {
        var container = $('#7a64369cdc11721d57591477e60c77c8'),
            allow = false,
            link = container.find('.j-compare-link'),
            count = container.find('.j-count'),
            tooltip = container.find('.j-tooltip');
        link.off('click').on('click', function () {
            allow && ComparisonTable.getInstance() && ComparisonTable.getInstance().openModal();

            return false;
        });
        ComparisonList.attachEventHandlers({
            onChange: function () {
                var countVal = this.count * 1;
                allow = countVal !== 0;
                if (countVal === 0) {
                    link.addClass('is-disabled');
                    count.hide();
                    tooltip.hide();
                } else {
                    link.removeClass('is-disabled');
                    count.show();
                    tooltip.show();
                }
                count.html(countVal);
            }
        });

        $(function() {
            $('.comparison-view__tooltip').dropdown({
                trigger: '.comparison-view__button',
                visibleClass: 'is-visible',
                hoverClass: 'is-hover'
            });
        })
    })(jQuery);

// === script #3 (length=1166) ===
(function ($) {
        var container = $('#0a23cc90b877f81153be796c78d916e6'),
            allow = false,
            link = container.find('.j-favorite-link'),
            count = container.find('.j-count'),
            tooltip = container.find('.j-tooltip');

        link.off('click').on('click', function (e) {
            if ($(this).hasClass('is-disabled')) {
                e.preventDefault();
            }

        });
        FavoritesList.attachEventHandlers({
            onChange: function () {
                var countVal = this.count * 1;
                allow = countVal !== 0;
                if (countVal === 0) {
                    link.addClass('is-disabled');
                    count.hide();
                } else {
                    link.removeClass('is-disabled');
                    count.show();
                }
                count.html(countVal);
            }
        });
        $(function() {
            $('.favorites-view__tooltip').dropdown({
                trigger: '.favorites-view__button',
                visibleClass: 'is-visible',
                hoverClass: 'is-hover'
            });
        })
    })(jQuery);

// === script #4 (length=866) ===
$(function() {
                $('#877729fdcdb3e80634c1168c3e0e20af-9071').tooltip({
                    content: $('#tooltip-877729fdcdb3e80634c1168c3e0e20af'),
                    container: $('#tooltip-877729fdcdb3e80634c1168c3e0e20af').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-877729fdcdb3e80634c1168c3e0e20af').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #5 (length=866) ===
$(function() {
                $('#2c6c5aba272fde79bf1d6c54500544cb-9072').tooltip({
                    content: $('#tooltip-2c6c5aba272fde79bf1d6c54500544cb'),
                    container: $('#tooltip-2c6c5aba272fde79bf1d6c54500544cb').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-2c6c5aba272fde79bf1d6c54500544cb').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #6 (length=540) ===
var fired = false;

    window.addEventListener('scroll', () => {
        if (fired === false) {
            fired = true;

            (function(d, w, s) {
                var widgetHash = 'ogu8xrathfdhfrgj1n27', gcw = d.createElement(s); gcw.type = 'text/javascript'; gcw.async = true;
                gcw.src = '//widgets.binotel.com/getcall/widgets/'+ widgetHash +'.js';
                var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(gcw, sn);
            })(document, window, 'script');
        }
    });

// === script #7 (length=604) ===
var fired2 = false;

    window.addEventListener('scroll', () => {
        if (fired2 === false) {
            fired2 = true;
            (function(d, w, c) {
                w.ChatraID = 'Jf5ksK9wQu4DeDbf8';
                var s = d.createElement('script');
                w[c] = w[c] || function() {
                    (w[c].q = w[c].q || []).push(arguments);
                };
                s.async = true;
                s.src = 'https://call.chatra.io/chatra.js';
                if (d.head) d.head.appendChild(s);
            })(document, window, 'Chatra');
        }
    });
