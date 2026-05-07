// source: https://termozona.com.ua/
// extracted: 2026-05-07T21:19:05.958Z
// scripts: 1

// === script #1 (length=950) ===
document.addEventListener('DOMContentLoaded', function () {
  if (sessionStorage.getItem('customChatNoticeShown')) return;

  setTimeout(function () {
    var notice = document.createElement('div');
    notice.id = 'custom-chat-notice';
    notice.innerHTML = `
      <button class="close-chat-notice" type="button">×</button>
      <strong>Потрібна допомога?</strong>
      Якщо маєте питання — пишіть нам у чат 💬
    `;

    document.body.appendChild(notice);

    setTimeout(function () {
      notice.classList.add('show');
    }, 100);

    sessionStorage.setItem('customChatNoticeShown', '1');

    notice.querySelector('.close-chat-notice').addEventListener('click', function (e) {
      e.stopPropagation();
      notice.remove();
    });

    setTimeout(function () {
      notice.classList.remove('show');
      setTimeout(function () {
        notice.remove();
      }, 300);
    }, 10000);
  }, 2000);
});
