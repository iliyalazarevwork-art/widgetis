// source: https://euroservis.com.ua/
// extracted: 2026-05-07T21:19:21.929Z
// scripts: 4

// === script #1 (length=776) ===
// source file: /vendor/helpers/SVGCache.js
        !function(e,t){"use strict";var n="/frontend/themes/horoshop_default/layout/img/svgdefs.svg",o=1542786247;if(!t.createElementNS||!t.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect)return!0;var a,r,l="localStorage"in e&&null!==e.localStorage,i=function(){t.body.insertAdjacentHTML("afterbegin",r)},s=function(){t.body?i():t.addEventListener("DOMContentLoaded",i)};if(l&&localStorage.getItem("inlineSVGrev")==o&&(r=localStorage.getItem("inlineSVGdata")))return s(),!0;try{a=new XMLHttpRequest,a.open("GET",n,!0),a.onload=function(){a.status>=200&&a.status<400&&(r=a.responseText,s(),l&&(localStorage.setItem("inlineSVGdata",r),localStorage.setItem("inlineSVGrev",o)))},a.send()}catch(c){}}(window,document);

// === script #2 (length=1192) ===
(function ($) {
        var container = $('#239931beabb559032b16d342bb633c4a'),
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
        var container = $('#745ebf8c6583f39a295ff3c0339f00a9'),
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

// === script #4 (length=911) ===
init_search_widget('#bb2f63ed899937cf90a43ae44a872875');
        var $search = $('.search'),
            $input = $('.search__input'),
            query = '',
            initialQuery = $input.val() !== '',
            focused = false;

        $search.on('click', function(e) {
            var $this = $(this);

            if ($(e.currentTarget).find('input').length) {
                $this.addClass('is-focused');
                $input.focus();

                if (query !== '') {
                    $input.val(query);
                    focused = true;
                }
            }
        });

        $('body').on('click', function(e) {
            if ($(e.target).closest('.search').length ) return;

            $search.removeClass('is-focused');
            query = $.trim($input.val());
            if (query !== '' && !initialQuery) {
                $input.val('');
            }
        });
