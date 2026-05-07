// source: https://artled.com.ua/
// extracted: 2026-05-07T21:19:22.101Z
// scripts: 1

// === script #1 (length=876) ===
document.addEventListener('DOMContentLoaded', function () {
    const TARGET_CORE = '0961558855';
    function normalizeDigits(str) {
        return (str || '').replace(/\D/g, '');
    }
    function isTargetNumber(num) {
        return num.endsWith(TARGET_CORE);
    }
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
        const hrefDigits = normalizeDigits(a.getAttribute('href'));
        if (isTargetNumber(hrefDigits)) {
            a.classList.add('ph-phone1');
        }
    });
    const textTags = ['a', 'strong', 'span'];
    document.querySelectorAll(textTags.join(',')).forEach(function (el) {
        if (el.classList.contains('ph-phone1')) return;
        const textDigits = normalizeDigits(el.textContent);
        if (isTargetNumber(textDigits)) {
            el.classList.add('ph-phone1');
        }
    });
});
