// source: https://gazobloki.com.ua/
// extracted: 2026-05-07T21:19:28.617Z
// scripts: 1

// === script #1 (length=1814) ===
setTimeout(openChatPopup, 360000);

    document.getElementById('gazoblokiChatButton').addEventListener('click', function () {
      openChatPopup();
    });

    // Обробник кліків для кнопок месенджерів
    var messengerButtons = document.querySelectorAll('.gazobloki-messenger-chats');
    messengerButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var messenger = this.getAttribute('data-messenger');
        openMessenger(messenger);
      });
    });

    function openChatPopup() {
      var popup = document.getElementById('gazoblokiChatPopup');
      popup.style.display = 'block';
      positionPopup();
      updateTime();
    }

    function positionPopup() {
      var popup = document.getElementById('gazoblokiChatPopup');
      var button = document.getElementById('gazoblokiChatButton');
      var buttonRect = button.getBoundingClientRect();

      popup.style.bottom = window.innerHeight - buttonRect.top + 15 + 'px';
      popup.style.left = buttonRect.left + 3 + 'px';
    }

    function updateTime() {
      var timeElement = document.getElementById('gazoblokiChatTime');
      var userTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false });
      timeElement.textContent = userTime;
      setTimeout(updateTime, 1000);
    }

    function closeGazoblokiPopup() {
      var popup = document.getElementById('gazoblokiChatPopup');
      popup.style.display = 'none';
    }

 function openMessenger(messenger) {
  if (messenger === 'viber') {
    // Використовуйте URI-схему для відкриття Viber
    window.location.href = 'viber://chat?number=%2B380964046241';
  } else if (messenger === 'telegram') {
    window.open('https://t.me/s_mexicanez');
  }
}
