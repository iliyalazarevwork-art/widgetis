// source: https://filmexpro.ua/
// extracted: 2026-05-07T21:18:51.461Z
// scripts: 2

// === script #1 (length=778) ===
(function(d, w, s) {
    var widgetHash = 'Glq366eagslRx54db9fW',
        bch = d.createElement(s);
    bch.type = 'text/javascript';
    bch.async = true;

    // Перед завантаженням скрипта Binotel створюємо проксі для його createIcon
    window.BinotelCreateIconOriginal = w.BinotelCreateIcon;
    w.BinotelCreateIcon = function(options) {
        // Якщо іконка Telegram — пропускаємо створення
        if (options && options.icon && options.icon.includes('telegram')) return;
        if (window.BinotelCreateIconOriginal) window.BinotelCreateIconOriginal(options);
    }

    bch.src = '//widgets.binotel.com/chat/widgets/' + widgetHash + '.js';
    var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(bch, sn);
})(document, window, 'script');

// === script #2 (length=981) ===
window.addEventListener('load', function() {
    // Шукаємо блок, під яким треба поставити лічильник (іконка мобільної версії)
    var target = document.querySelector('.footer__mobile-version') || document.querySelector('.footer__payments');
    
    if (target) {
        // Створюємо контейнер для Hotline
        var hotlineWrap = document.createElement('div');
        hotlineWrap.style.marginTop = '20px'; // Відступ під написом
        hotlineWrap.style.textAlign = 'left';
        hotlineWrap.innerHTML = '<div class="hotline-rating-informer" data-type="4" data-id="40349"></div>';
        
        // Вставляємо після цільового блоку
        target.parentNode.insertBefore(hotlineWrap, target.nextSibling);
        
        // Завантажуємо скрипт Hotline
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = "https://hotline.ua/api/widgets/widgets.min.js";
        document.body.appendChild(s);
    }
});
