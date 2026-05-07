// source: https://binary.com.ua/
// extracted: 2026-05-07T21:19:39.905Z
// scripts: 2

// === script #1 (length=723) ===
!function(e,t){"use strict";var n="/frontend/themes/horoshop_default/layout/img/svgdefs.svg",o=1594555880;if(!t.createElementNS||!t.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect)return!0;var a,r,l="localStorage"in e&&null!==e.localStorage,i=function(){t.body.insertAdjacentHTML("afterbegin",r)},s=function(){t.body?i():t.addEventListener("DOMContentLoaded",i)};if(l&&localStorage.getItem("inlineSVGrev")==o&&(r=localStorage.getItem("inlineSVGdata")))return s(),!0;try{a=new XMLHttpRequest,a.open("GET",n,!0),a.onload=function(){a.status>=200&&a.status<400&&(r=a.responseText,s(),l&&(localStorage.setItem("inlineSVGdata",r),localStorage.setItem("inlineSVGrev",o)))},a.send()}catch(c){}}(window,document);

// === script #2 (length=824) ===
(function ($) {
        var container = $('#eb30e873757ec6401492876e75b718f0'),
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
