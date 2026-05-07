// source: https://agroassistance.com/
// extracted: 2026-05-07T21:19:42.016Z
// scripts: 3

// === script #1 (length=775) ===
// source file: /vendor/helpers/SVGCache.js
        !function(e,t){"use strict";var n="/frontend/themes/horoshop_default/layout/img/svgdefs.svg",o=1588840680;if(!t.createElementNS||!t.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect)return!0;var a,r,l="localStorage"in e&&null!==e.localStorage,i=function(){t.body.insertAdjacentHTML("afterbegin",r)},s=function(){t.body?i():t.addEventListener("DOMContentLoaded",i)};if(l&&localStorage.getItem("inlineSVGrev")==o&&(r=localStorage.getItem("inlineSVGdata")))return s(),!0;try{a=new XMLHttpRequest,a.open("GET",n,!0),a.onload=function(){a.status>=200&&a.status<400&&(r=a.responseText,s(),l&&(localStorage.setItem("inlineSVGdata",r),localStorage.setItem("inlineSVGrev",o)))},a.send()}catch(c){}}(window,document);

// === script #2 (length=1192) ===
(function ($) {
        var container = $('#8e34bc3ecb17de5aed938991d2ca8848'),
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
                    tooltip.show();
                } else {
                    link.removeClass('is-disabled');
                    tooltip.hide();
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

// === script #3 (length=774) ===
(function ($) {
        var container = $('#fcc5eee8ee819529b39b75dff4f60b95'),
            allow = false,
            link = container.find('.j-favorite-link'),
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
                } else {
                    link.removeClass('is-disabled');
                }
            }
        });
    })(jQuery);
