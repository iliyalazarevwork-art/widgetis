// source: https://pimoto.com.ua/
// extracted: 2026-05-07T21:20:37.910Z
// scripts: 1

// === script #1 (length=512) ===
(function(w, k) {
    // Другий скрипт (SalesDrive)
     w[k] = {
        companyId: '15187',
        widgetId: '1',
        hash: '635e291c-819b-4cbe-9759-5f820c7d388c',
        locale: 'ua',
    };

    var d = w.document,
        s = d.createElement('script');

    s.async = true;
    s.id = k + 'Script';
    s.src = 'https://static.salesdrive.me/chat-widget/assets/js/widget.js' + '?' + (Date.now() / 3600000 | 0);
    d.head && d.head.appendChild(s)

  }(window, 'salesDriveChatButton'));
