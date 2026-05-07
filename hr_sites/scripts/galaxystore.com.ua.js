// source: https://galaxystore.com.ua/
// extracted: 2026-05-07T21:19:16.812Z
// scripts: 19

// === script #1 (length=775) ===
// source file: /vendor/helpers/SVGCache.js
        !function(e,t){"use strict";var n="/frontend/themes/horoshop_default/layout/img/svgdefs.svg",o=1631697431;if(!t.createElementNS||!t.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect)return!0;var a,r,l="localStorage"in e&&null!==e.localStorage,i=function(){t.body.insertAdjacentHTML("afterbegin",r)},s=function(){t.body?i():t.addEventListener("DOMContentLoaded",i)};if(l&&localStorage.getItem("inlineSVGrev")==o&&(r=localStorage.getItem("inlineSVGdata")))return s(),!0;try{a=new XMLHttpRequest,a.open("GET",n,!0),a.onload=function(){a.status>=200&&a.status<400&&(r=a.responseText,s(),l&&(localStorage.setItem("inlineSVGdata",r),localStorage.setItem("inlineSVGrev",o)))},a.send()}catch(c){}}(window,document);

// === script #2 (length=2134) ===
init_search_widget('#search_3cc2f89ddb7d5912fff38147b3057e74');
    var $search = $('.search'),
        $container = $('.search__container'),
        $input = $('.search__input'),
        $button = $('.search__button'),
        $productsMenu = $('.j-products-menu'),
        $siteMenu = $('.j-site-menu'),
        $headerColumn = $('.header__column'),
        query = '',
        focused = false,
        closeSearch = function () {
            $search.attr('data-collapsed', true);
            $input.removeAttr('style');
            $container.width('100%');
            $button.css('transform', 'translate3d(0,0,0)');
            $search.removeClass('is-opened');
            $input.removeClass('is-focused');
            $button.attr('disabled', false);
            focused = false;
        };

    $button.on('click', function(e) {
        var siblingOffset = $productsMenu.length ? $productsMenu.offset()
            : ($siteMenu.length ? $siteMenu.offset()
            : $headerColumn.offset());
        var expandedWidth = $search.offset().left - siblingOffset.left + $search.width();

        $search.attr('data-collapsed', false);

        if (!focused) {
            $input.outerWidth(expandedWidth);
            $container.width(expandedWidth);
            $button.css('transform', 'translate3d(-' + ($search.offset().left - siblingOffset.left) + 'px, 0, 0)');
            $search.addClass('is-opened');
            $button.attr('disabled', true);
            setTimeout(function() {
                $input.focus();
                $input.addClass('is-focused');
            }, 200);

            focused = true;

            e.preventDefault();
        }
    });

    $('body').on('mousedown', function(e) {
        if ($(e.target).closest('.search').length ) return;

        closeSearch();
    });

    $('.j-search-close').on('click', function (e) {
        var $input = $('.j-search-input');

        if ($input.val() !== '') {
            $input.val('');
            $input.focus();
            $button.attr('disabled', true);
        } else {
            closeSearch();
        }

        e.preventDefault();
    })

// === script #3 (length=1238) ===
(function ($) {
        var container = $('#f9e54a957959ca0446163c0859220954'),
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

// === script #4 (length=867) ===
$(function() {
                $('#d81aa106ba288eee5ec234c7306f62de-63445').tooltip({
                    content: $('#tooltip-d81aa106ba288eee5ec234c7306f62de'),
                    container: $('#tooltip-d81aa106ba288eee5ec234c7306f62de').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-d81aa106ba288eee5ec234c7306f62de').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #5 (length=867) ===
$(function() {
                $('#fb020775d80a65763d939a998f86df37-63478').tooltip({
                    content: $('#tooltip-fb020775d80a65763d939a998f86df37'),
                    container: $('#tooltip-fb020775d80a65763d939a998f86df37').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-fb020775d80a65763d939a998f86df37').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #6 (length=867) ===
$(function() {
                $('#e0b6deea84460c84ea4d741fc6ff6d52-63064').tooltip({
                    content: $('#tooltip-e0b6deea84460c84ea4d741fc6ff6d52'),
                    container: $('#tooltip-e0b6deea84460c84ea4d741fc6ff6d52').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-e0b6deea84460c84ea4d741fc6ff6d52').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #7 (length=867) ===
$(function() {
                $('#5b6d009fef4de9c23e924405d41f8410-63243').tooltip({
                    content: $('#tooltip-5b6d009fef4de9c23e924405d41f8410'),
                    container: $('#tooltip-5b6d009fef4de9c23e924405d41f8410').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-5b6d009fef4de9c23e924405d41f8410').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #8 (length=867) ===
$(function() {
                $('#437debd589be33b765cf6100f2efb923-63338').tooltip({
                    content: $('#tooltip-437debd589be33b765cf6100f2efb923'),
                    container: $('#tooltip-437debd589be33b765cf6100f2efb923').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-437debd589be33b765cf6100f2efb923').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #9 (length=867) ===
$(function() {
                $('#5d7d50ac836602b215facc6e84f7ecbb-63158').tooltip({
                    content: $('#tooltip-5d7d50ac836602b215facc6e84f7ecbb'),
                    container: $('#tooltip-5d7d50ac836602b215facc6e84f7ecbb').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-5d7d50ac836602b215facc6e84f7ecbb').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #10 (length=867) ===
$(function() {
                $('#add38812b4f538f5d8fec780dcb6f903-63482').tooltip({
                    content: $('#tooltip-add38812b4f538f5d8fec780dcb6f903'),
                    container: $('#tooltip-add38812b4f538f5d8fec780dcb6f903').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-add38812b4f538f5d8fec780dcb6f903').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #11 (length=867) ===
$(function() {
                $('#2461562e3f87b1b66d497e94d63e4875-63087').tooltip({
                    content: $('#tooltip-2461562e3f87b1b66d497e94d63e4875'),
                    container: $('#tooltip-2461562e3f87b1b66d497e94d63e4875').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-2461562e3f87b1b66d497e94d63e4875').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #12 (length=867) ===
$(function() {
                $('#df4dfbc284d94697b001363bc9bdc41f-63410').tooltip({
                    content: $('#tooltip-df4dfbc284d94697b001363bc9bdc41f'),
                    container: $('#tooltip-df4dfbc284d94697b001363bc9bdc41f').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-df4dfbc284d94697b001363bc9bdc41f').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #13 (length=867) ===
$(function() {
                $('#2d092b57726a91c66ea82576854e03e7-63073').tooltip({
                    content: $('#tooltip-2d092b57726a91c66ea82576854e03e7'),
                    container: $('#tooltip-2d092b57726a91c66ea82576854e03e7').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-2d092b57726a91c66ea82576854e03e7').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #14 (length=867) ===
$(function() {
                $('#b49b7fba7201a9ff7b67d186145bf8a9-63487').tooltip({
                    content: $('#tooltip-b49b7fba7201a9ff7b67d186145bf8a9'),
                    container: $('#tooltip-b49b7fba7201a9ff7b67d186145bf8a9').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-b49b7fba7201a9ff7b67d186145bf8a9').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #15 (length=867) ===
$(function() {
                $('#e7e70c0e5001212e26fe4b1340ba7510-63485').tooltip({
                    content: $('#tooltip-e7e70c0e5001212e26fe4b1340ba7510'),
                    container: $('#tooltip-e7e70c0e5001212e26fe4b1340ba7510').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-e7e70c0e5001212e26fe4b1340ba7510').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #16 (length=867) ===
$(function() {
                $('#8a4df8e1cfdc777150ba8e027db17cc6-63114').tooltip({
                    content: $('#tooltip-8a4df8e1cfdc777150ba8e027db17cc6'),
                    container: $('#tooltip-8a4df8e1cfdc777150ba8e027db17cc6').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-8a4df8e1cfdc777150ba8e027db17cc6').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #17 (length=867) ===
$(function() {
                $('#5ef8c8b01777154431bf7fdc17e97196-63122').tooltip({
                    content: $('#tooltip-5ef8c8b01777154431bf7fdc17e97196'),
                    container: $('#tooltip-5ef8c8b01777154431bf7fdc17e97196').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-5ef8c8b01777154431bf7fdc17e97196').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #18 (length=867) ===
$(function() {
                $('#56917fc394cd63443cc2a0f172d39bca-63159').tooltip({
                    content: $('#tooltip-56917fc394cd63443cc2a0f172d39bca'),
                    container: $('#tooltip-56917fc394cd63443cc2a0f172d39bca').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-56917fc394cd63443cc2a0f172d39bca').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #19 (length=867) ===
$(function() {
                $('#ca450654a893d0654adcf83d7a657116-63190').tooltip({
                    content: $('#tooltip-ca450654a893d0654adcf83d7a657116'),
                    container: $('#tooltip-ca450654a893d0654adcf83d7a657116').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-ca450654a893d0654adcf83d7a657116').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });
