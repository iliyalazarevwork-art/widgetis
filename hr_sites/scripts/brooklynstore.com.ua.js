// source: https://brooklynstore.com.ua/
// extracted: 2026-05-07T21:19:10.984Z
// scripts: 1

// === script #1 (length=824) ===
(function ($) {
        var container = $('#c7fe06565e2ce0e5f58259a3058e8beb'),
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
