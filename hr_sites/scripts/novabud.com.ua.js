// source: https://novabud.com.ua/
// extracted: 2026-05-07T21:19:37.285Z
// scripts: 1

// === script #1 (length=2629) ===
setInterval(openChatPopup, 360000);

    document.getElementById('chatsChatButton').addEventListener('click', function () {
      openChatPopup();
    });

    document.getElementById('overlay').addEventListener('click', function () {
      closeChatsPopup();
    });

    var messengerButtons = document.querySelectorAll('.chats-messenger-chats');
    messengerButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var messenger = this.getAttribute('data-messenger');
        openMessenger(messenger);
      });
    });

    setInterval(changeChatIcon, 7000);

    function changeChatIcon() {
      var chatIcon = document.querySelector('.chat-icon');
      var chatIcon2 = document.querySelector('.chat-icon-2');

      if (chatIcon.style.display === 'none') {
        chatIcon.style.display = 'block';
        chatIcon2.style.display = 'none';
      } else {
        chatIcon.style.display = 'none';
        chatIcon2.style.display = 'block';
      }

      chatIcon2.classList.toggle('animate__animated');
      chatIcon2.classList.toggle('animate__bounce');
      chatIcon.classList.remove('animate__animated');
    }

    function openChatPopup() {
      var popup = document.getElementById('chatsChatPopup');
      var overlay = document.getElementById('overlay');
      popup.style.display = 'block';
      overlay.style.display = 'block';
      positionPopup();
      updateTime();
    }

    function positionPopup() {
      var popup = document.getElementById('chatsChatPopup');
      var button = document.getElementById('chatsChatButton');
      var buttonRect = button.getBoundingClientRect();

      popup.style.bottom = window.innerHeight - buttonRect.top + 15 + 'px';
      popup.style.left = buttonRect.left + 3 + 'px';
    }

    function updateTime() {
      var timeElement = document.getElementById('chatsChatTime');
      var userTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false });
      timeElement.textContent = userTime;
      setTimeout(updateTime, 1000);
    }

    function closeChatsPopup() {
      var popup = document.getElementById('chatsChatPopup');
      var overlay = document.getElementById('overlay');
      popup.style.display = 'none';
      overlay.style.display = 'none';
    }

    function openMessenger(messenger) {
      if (messenger === 'viber') {
        window.open('viber://chat?number=%2B380964046241');
      } else if (messenger === 'telegram') {
        window.open('https://t.me/uanovabud');
      }
    }
