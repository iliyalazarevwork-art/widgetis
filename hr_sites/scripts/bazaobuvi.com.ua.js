// source: https://bazaobuvi.com.ua/
// extracted: 2026-05-07T21:19:06.695Z
// scripts: 3

// === script #1 (length=775) ===
// source file: /vendor/helpers/SVGCache.js
        !function(e,t){"use strict";var n="/frontend/themes/horoshop_default/layout/img/svgdefs.svg",o=1603032582;if(!t.createElementNS||!t.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect)return!0;var a,r,l="localStorage"in e&&null!==e.localStorage,i=function(){t.body.insertAdjacentHTML("afterbegin",r)},s=function(){t.body?i():t.addEventListener("DOMContentLoaded",i)};if(l&&localStorage.getItem("inlineSVGrev")==o&&(r=localStorage.getItem("inlineSVGdata")))return s(),!0;try{a=new XMLHttpRequest,a.open("GET",n,!0),a.onload=function(){a.status>=200&&a.status<400&&(r=a.responseText,s(),l&&(localStorage.setItem("inlineSVGdata",r),localStorage.setItem("inlineSVGrev",o)))},a.send()}catch(c){}}(window,document);

// === script #2 (length=824) ===
(function ($) {
        var container = $('#4691565f5801b034f259db6cfa2c7145'),
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

// === script #3 (length=1298) ===
function onSubmit(token) {
                password_recovery_submit($('#password-recovery-form'));
                document.getElementById('close_tag').onclick = function() {
                    document.getElementById('password-recovery').style.display = "none";
                    document.getElementById('sign-in').style.display = "block";
                };
                return false;
            }
            function initPhoneMask()
            {
                if (GLOBAL.enable_phone_mask_on_input && !GLOBAL.use_countries) {
                    $('.j-phone').each(function () {
                        var me = $(this);
                        if (me.hasClass('j-phone-masked')) {
                            me.inputmask({"mask": GLOBAL.phone_mask});
                            me.addClass('j-phone-masked');
                        }
                    });
                } else {
                    $('.j-phone').each(function () {
                        var me = $(this);
                        if (!me.hasClass('j-phone-masked')) {
                            me.inputmask({regex: '[+]?[0-9 ()\\-]*'});
                            me.addClass('j-phone-masked');
                        }
                    });
                }
            }
            initPhoneMask();
