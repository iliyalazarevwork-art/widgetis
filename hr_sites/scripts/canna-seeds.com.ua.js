// source: https://canna-seeds.com.ua/
// extracted: 2026-05-07T21:18:57.449Z
// scripts: 21

// === script #1 (length=775) ===
// source file: /vendor/helpers/SVGCache.js
        !function(e,t){"use strict";var n="/frontend/themes/horoshop_default/layout/img/svgdefs.svg",o=1642067270;if(!t.createElementNS||!t.createElementNS("http://www.w3.org/2000/svg","svg").createSVGRect)return!0;var a,r,l="localStorage"in e&&null!==e.localStorage,i=function(){t.body.insertAdjacentHTML("afterbegin",r)},s=function(){t.body?i():t.addEventListener("DOMContentLoaded",i)};if(l&&localStorage.getItem("inlineSVGrev")==o&&(r=localStorage.getItem("inlineSVGdata")))return s(),!0;try{a=new XMLHttpRequest,a.open("GET",n,!0),a.onload=function(){a.status>=200&&a.status<400&&(r=a.responseText,s(),l&&(localStorage.setItem("inlineSVGdata",r),localStorage.setItem("inlineSVGrev",o)))},a.send()}catch(c){}}(window,document);

// === script #2 (length=1192) ===
(function ($) {
        var container = $('#7ed2f36bf5ba49fcd23e2fe2d949fe93'),
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
        var container = $('#41a78a0d76fc838cfa4350684b0f0046'),
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

// === script #4 (length=754) ===
$(function() {
        $('.j-products-menu').productsMenu({
            parent: $('.header__layout'),
            onHover: function (e, $item) {
                var $item = $item,
                    itemWidth = $item.width(),
                    $arrow = $item.find('.productsMenu-submenuArrow'),
                    $submenu = $item.find('.productsMenu-submenu');

                if (!$submenu.length) {
                    return;
                }

                if (!$arrow.length) {
                    $arrow = $('<div class="productsMenu-submenuArrow" />').appendTo($submenu);
                }
                
                $arrow.css('left', $item.offset().left - $submenu.offset().left + itemWidth / 2);
            }
        });
    });

// === script #5 (length=1761) ===
init_search_widget('#ff895378d33dd0587697e675cea46d6e');
    var $search = $('.search'),
        $container = $('.search__container'),
        $input = $('.search__input'),
        $button = $('.search__button'),
        query = '',
        focused = false,
        closeSearch = function () {
            $input.removeAttr('style');
            $container.width('100%');
            $button.css('transform', 'translate3d(0,0,0)');
            $search.removeClass('is-opened');
            $input.removeClass('is-focused');
            $button.attr('disabled', false);
            focused = false;
        };

    $button.on('click', function(e) {
        var expandedWidth = $search.offset().left - $('.j-products-menu').offset().left + $search.width();

        if (!focused) {
            $input.outerWidth(expandedWidth);
            $container.width(expandedWidth);
            $button.css('transform', 'translate3d(-' + ($search.offset().left - $('.j-products-menu').offset().left) + 'px, 0, 0)');
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

    $('body').on('click', function(e) {
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

// === script #6 (length=866) ===
$(function() {
                $('#19a903d8b25e091ddbcca480898c95da-7912').tooltip({
                    content: $('#tooltip-19a903d8b25e091ddbcca480898c95da'),
                    container: $('#tooltip-19a903d8b25e091ddbcca480898c95da').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-19a903d8b25e091ddbcca480898c95da').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #7 (length=866) ===
$(function() {
                $('#39a56871e4eb33e592d02a6a1d1d1953-6584').tooltip({
                    content: $('#tooltip-39a56871e4eb33e592d02a6a1d1d1953'),
                    container: $('#tooltip-39a56871e4eb33e592d02a6a1d1d1953').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-39a56871e4eb33e592d02a6a1d1d1953').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #8 (length=866) ===
$(function() {
                $('#85a2ada30bfeb3720d18b76fd8e5fe0d-6202').tooltip({
                    content: $('#tooltip-85a2ada30bfeb3720d18b76fd8e5fe0d'),
                    container: $('#tooltip-85a2ada30bfeb3720d18b76fd8e5fe0d').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-85a2ada30bfeb3720d18b76fd8e5fe0d').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #9 (length=866) ===
$(function() {
                $('#226726a1e901509f398a96f6c1e7a5ab-7581').tooltip({
                    content: $('#tooltip-226726a1e901509f398a96f6c1e7a5ab'),
                    container: $('#tooltip-226726a1e901509f398a96f6c1e7a5ab').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-226726a1e901509f398a96f6c1e7a5ab').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #10 (length=865) ===
$(function() {
                $('#f466ebe07c1563d7e7dc7d85de0bb81e-728').tooltip({
                    content: $('#tooltip-f466ebe07c1563d7e7dc7d85de0bb81e'),
                    container: $('#tooltip-f466ebe07c1563d7e7dc7d85de0bb81e').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-f466ebe07c1563d7e7dc7d85de0bb81e').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #11 (length=866) ===
$(function() {
                $('#7fa045adf3510711992daad4f495a662-2143').tooltip({
                    content: $('#tooltip-7fa045adf3510711992daad4f495a662'),
                    container: $('#tooltip-7fa045adf3510711992daad4f495a662').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-7fa045adf3510711992daad4f495a662').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #12 (length=866) ===
$(function() {
                $('#875a3a9dfaf997304daa58a6fbc1e74f-6014').tooltip({
                    content: $('#tooltip-875a3a9dfaf997304daa58a6fbc1e74f'),
                    container: $('#tooltip-875a3a9dfaf997304daa58a6fbc1e74f').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-875a3a9dfaf997304daa58a6fbc1e74f').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #13 (length=866) ===
$(function() {
                $('#4bb15f6038c8eb330bc6ee2341dcca1a-7388').tooltip({
                    content: $('#tooltip-4bb15f6038c8eb330bc6ee2341dcca1a'),
                    container: $('#tooltip-4bb15f6038c8eb330bc6ee2341dcca1a').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-4bb15f6038c8eb330bc6ee2341dcca1a').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #14 (length=866) ===
$(function() {
                $('#25983da8e72a371ade93efab929f0756-7926').tooltip({
                    content: $('#tooltip-25983da8e72a371ade93efab929f0756'),
                    container: $('#tooltip-25983da8e72a371ade93efab929f0756').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-25983da8e72a371ade93efab929f0756').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #15 (length=865) ===
$(function() {
                $('#6b6ad83e426fca2b9d9f820a0d04eec5-912').tooltip({
                    content: $('#tooltip-6b6ad83e426fca2b9d9f820a0d04eec5'),
                    container: $('#tooltip-6b6ad83e426fca2b9d9f820a0d04eec5').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-6b6ad83e426fca2b9d9f820a0d04eec5').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #16 (length=866) ===
$(function() {
                $('#a46a8505abd8f6135add1cc58e8da63a-7875').tooltip({
                    content: $('#tooltip-a46a8505abd8f6135add1cc58e8da63a'),
                    container: $('#tooltip-a46a8505abd8f6135add1cc58e8da63a').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-a46a8505abd8f6135add1cc58e8da63a').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #17 (length=866) ===
$(function() {
                $('#c795b7f6d9f1ade0a73726b8fceca4de-1182').tooltip({
                    content: $('#tooltip-c795b7f6d9f1ade0a73726b8fceca4de'),
                    container: $('#tooltip-c795b7f6d9f1ade0a73726b8fceca4de').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-c795b7f6d9f1ade0a73726b8fceca4de').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #18 (length=865) ===
$(function() {
                $('#4dc43b1ee7b8af5f960178e2a3ff8b37-557').tooltip({
                    content: $('#tooltip-4dc43b1ee7b8af5f960178e2a3ff8b37'),
                    container: $('#tooltip-4dc43b1ee7b8af5f960178e2a3ff8b37').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-4dc43b1ee7b8af5f960178e2a3ff8b37').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #19 (length=866) ===
$(function() {
                $('#607e6fe712e65e39039c72e5c4f88f81-7587').tooltip({
                    content: $('#tooltip-607e6fe712e65e39039c72e5c4f88f81'),
                    container: $('#tooltip-607e6fe712e65e39039c72e5c4f88f81').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-607e6fe712e65e39039c72e5c4f88f81').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #20 (length=866) ===
$(function() {
                $('#b07c786d0904b980109666382526c59e-6578').tooltip({
                    content: $('#tooltip-b07c786d0904b980109666382526c59e'),
                    container: $('#tooltip-b07c786d0904b980109666382526c59e').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-b07c786d0904b980109666382526c59e').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });

// === script #21 (length=866) ===
$(function() {
                $('#55f4b5bda7cd5630841085f5c7b483ab-2003').tooltip({
                    content: $('#tooltip-55f4b5bda7cd5630841085f5c7b483ab'),
                    container: $('#tooltip-55f4b5bda7cd5630841085f5c7b483ab').parents('.j-catalog-card-toolbar'),
                    trigger: 'hover',
                    placement: 'top',
                    hideOnClick: true,
                    popperOptions: {
                        modifiers: {
                            preventOverflow: {
                                boundariesElement: $('#tooltip-55f4b5bda7cd5630841085f5c7b483ab').parents('.j-catalog-card-toolbar')[0],
                                priority: ['left','bottom'],
                                padding: 7
                            }
                        }
                    }
                });
            });
