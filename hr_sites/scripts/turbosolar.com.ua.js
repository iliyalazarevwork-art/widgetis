// source: https://turbosolar.com.ua/
// extracted: 2026-05-07T21:23:02.610Z
// scripts: 2

// === script #1 (length=522) ===
function sendMessageToTelegram(элемент) {
    const token = '7374799664:AAHRU_-JV7VWtPnw9gidqp7Ey1ZJ9FXG4RQ';
    const chatId = '-1002161562026';
    const message = элемент.getAttribute('data-message'); // Получить сообщение из пользовательского атрибута
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });
  }

// === script #2 (length=522) ===
function sendMessageToTelegram(элемент) {
    const token = '7374799664:AAHRU_-JV7VWtPnw9gidqp7Ey1ZJ9FXG4RQ';
    const chatId = '-1002161562026';
    const message = элемент.getAttribute('data-message'); // Получить сообщение из пользовательского атрибута
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });
  }
