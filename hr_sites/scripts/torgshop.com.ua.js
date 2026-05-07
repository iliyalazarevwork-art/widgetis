// source: https://torgshop.com.ua/
// extracted: 2026-05-07T21:19:05.768Z
// scripts: 1

// === script #1 (length=2063) ===
// Проверяем, является ли пользователь поисковым роботом
    function isBot(userAgent) {
        var bots = [
            'googlebot', 'bingbot', 'yandex', 'slurp', 
            'duckduckbot', 'baiduspider', 'sogou', 'exabot', 
            'facebot', 'ia_archiver'
        ];
        for (var i = 0; i < bots.length; i++) {
            if (userAgent.toLowerCase().indexOf(bots[i]) !== -1) return true;
        }
        return false;
    }

     function closeLanguageModal() {
    // Устанавливаем cookie, чтобы больше не показывать попап
    document.cookie = "languageModalShown=true; path=/; max-age=31536000"; // сохраняем на год
    document.getElementById('languageModal').style.display = 'none';
     }

    // При загрузке страницы
    window.onload = function() {
        // Если это не бот и пользователь еще не видел попап
        if (!isBot(navigator.userAgent) && !document.cookie.includes("languageModalShown=true")) {
            var currentURL = window.location.href;
            var currentPath = window.location.pathname;
            

        if (currentPath.startsWith("/uk/")) {
            document.getElementById('ukrainianBtn').href = currentPath;
            document.getElementById('russianBtn').href = currentPath.replace('/uk/', '/');
        } else {
            document.getElementById('ukrainianBtn').href = '/uk' + currentPath + (currentPath.endsWith('/') ? '' : '/');
            document.getElementById('russianBtn').href = currentPath;
        }

            // Показываем модальное окно
            document.getElementById('languageModal').style.display = 'block';

          //Закрыть модалки
            document.getElementById('ukrainianBtn').addEventListener('click', closeLanguageModal);
            document.getElementById('russianBtn').addEventListener('click', closeLanguageModal);



            // Устанавливаем cookie, чтобы больше не показывать попап
         //   document.cookie = "languageModalShown=true; max-age=31536000"; // сохраняем на год

        }

    }
