// source: https://lartek.com.ua/
// extracted: 2026-05-07T21:21:50.508Z
// scripts: 1

// === script #1 (length=1812) ===
(function () {
    function cleanupOldBreadcrumbArtifacts(nav) {
        nav.classList.remove('lartek-bc');

        nav.querySelectorAll('.breadcrumbs-i').forEach(function (item) {
            item.classList.remove('lartek-show', 'lartek-last', 'lartek-bc-item', 'lartek-ellipsis');
            item.style.display = '';
        });

        nav.querySelectorAll('[data-lartek-ellipsis="1"]').forEach(function (el) {
            el.remove();
        });
    }

    function ensureBackButton(nav) {
        if (nav.querySelector('.lartek-breadcrumb-back')) return;

        var back = document.createElement('a');
        back.href = '#';
        back.className = 'lartek-breadcrumb-back';
        back.textContent = /\/ru\//.test(location.pathname) ? 'НАЗАД' : 'ПОВЕРНУТИСЯ';

        back.addEventListener('click', function (e) {
            e.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/';
            }
        });

        nav.appendChild(back);
    }

    function initCompactBreadcrumbs() {
        document.querySelectorAll('nav.breadcrumbs').forEach(function (nav) {
            cleanupOldBreadcrumbArtifacts(nav);
            nav.classList.add('lartek-bc-compact');
            ensureBackButton(nav);
        });
    }

    function boot() {
        initCompactBreadcrumbs();

        var tries = 0;
        var timer = setInterval(function () {
            initCompactBreadcrumbs();
            tries++;
            if (tries > 20) clearInterval(timer);
        }, 400);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
