// source: https://wookie.com.ua/
// extracted: 2026-05-07T21:18:50.471Z
// scripts: 3

// === script #1 (length=775) ===
// source file: /vendor/helpers/SVGCache.js
        !function(e,t){"use strict";var n="/frontend/themes/horoshop_default/layout/img/svgdefs.svg",o=1633780865;if(!t.createElementNS||!t.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect)return!0;var a,r,l="localStorage"in e&&null!==e.localStorage,i=function(){t.body.insertAdjacentHTML("afterbegin",r)},s=function(){t.body?i():t.addEventListener("DOMContentLoaded",i)};if(l&&localStorage.getItem("inlineSVGrev")==o&&(r=localStorage.getItem("inlineSVGdata")))return s(),!0;try{a=new XMLHttpRequest,a.open("GET",n,!0),a.onload=function(){a.status>=200&&a.status<400&&(r=a.responseText,s(),l&&(localStorage.setItem("inlineSVGdata",r),localStorage.setItem("inlineSVGrev",o)))},a.send()}catch(c){}}(window,document);

// === script #2 (length=1238) ===
(function ($) {
        var container = $('#9de13d24a0d6be176286df34e3b7a81c'),
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
                    tooltip.show();
                    count.hide();
                } else {
                    link.removeClass('is-disabled');
                    tooltip.hide();
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

// === script #3 (length=729) ===
(function () {
            $('[data-carousel-id="845a6bb670c9c6464a80e2f80b2f668f"]').data('swiperParams', {
                slidesPerGroup: 3,
                breakpoints: {
                    1260: {
                        slidesPerGroup: 2,
                    }
                }
            });

            $('.j-review-item').each(function () {
                var $this = $(this),
                    $text = $('.j-review-item-text', $this),
                    $link = $('.j-review-item-link', $this);

                if ($text[0].scrollHeight > $text.innerHeight()) {
                    $text.addClass('is-overflown');
                    $link.addClass('is-visible');
                }
            })
        })();
