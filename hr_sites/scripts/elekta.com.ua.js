// source: https://elekta.com.ua/
// extracted: 2026-05-07T21:21:16.760Z
// scripts: 1

// === script #1 (length=6662) ===
// --- ЕДИНЫЙ СКРИПТ ДЛЯ ДВУХ КНОПОК И POPUP-ОКОН ---
document.addEventListener('DOMContentLoaded', function() {

  // --- ОБЩИЕ НАСТРОЙКИ ДЛЯ TELEGRAM (используются для обеих форм) ---
  const TELEGRAM_TOKEN = '8099700541:AAHON7mAhGVUDlJ_cR2VL6U_zj8Y8YkoxLo'; // Убедитесь, что токен верный
  const TELEGRAM_CHAT_ID = '926187856'; // Убедитесь, что ID чата верный (для групп он с минусом)

  // ===================================================================
  // --- ЛОГИКА ДЛЯ КРУГЛОЙ КНОПКИ-СМАЙЛИКА (которая на всех страницах) ---
  // ===================================================================

  // Создаем HTML для кнопки и окна смайлика с помощью JavaScript
  const smileyPopupHTML = `
    <button id="showSmileyPopup" style="position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%; background-color: #007bff; color: white; font-size: 28px; border: none; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); z-index: 999;">💬</button>
    <div id="smileyPopupOverlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1000; justify-content: center; align-items: center;">
      <div style="background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 400px; position: relative;">
        <span id="closeSmileyPopup" style="position: absolute; top: 10px; right: 15px; font-size: 28px; cursor: pointer;">&times;</span>
        <h2>Задать вопрос</h2>
        <p>Мы свяжемся с вами в ближайшее время!</p>
        <form id="smileyForm">
          <input type="tel" name="phone" placeholder="Ваш номер телефона" required style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box;">
          <textarea name="question" placeholder="Кратко опишите ваш вопрос" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; resize: vertical;"></textarea>
          <button type="submit" style="width: 100%; padding: 12px; background-color: #007bff; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Отправить</button>
        </form>
      </div>
    </div>
  `;
  // Добавляем этот HTML в конец страницы
  document.body.insertAdjacentHTML('beforeend', smileyPopupHTML);
  
  // Находим элементы для смайлика
  const showSmileyBtn = document.getElementById('showSmileyPopup');
  const smileyOverlay = document.getElementById('smileyPopupOverlay');
  const closeSmileyBtn = document.getElementById('closeSmileyPopup');
  const smileyForm = document.getElementById('smileyForm');

  if (showSmileyBtn) {
    showSmileyBtn.addEventListener('click', () => smileyOverlay.style.display = 'flex');
  }
  if (closeSmileyBtn) {
    closeSmileyBtn.addEventListener('click', () => smileyOverlay.style.display = 'none');
  }
  if (smileyOverlay) {
    smileyOverlay.addEventListener('click', (e) => {
      if (e.target === smileyOverlay) smileyOverlay.style.display = 'none';
    });
  }

  // Отправка формы смайлика в Telegram
  if (smileyForm) {
    smileyForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const phone = e.target.querySelector('input[name="phone"]').value;
      const question = e.target.querySelector('textarea[name="question"]').value;
      let message = `<b>💬 Новая заявка (кнопка-смайлик)!</b>\n\n<b>Телефон:</b> ${phone}\n<b>Вопрос:</b> ${question}`;
      sendToTelegram(message, e.target);
    });
  }

  // =============================================================================
  // --- ЛОГИКА ДЛЯ КНОПКИ "ПОЛУЧИТЬ КОНСУЛЬТАЦИЮ" (которая на отдельной странице) ---
  // =============================================================================
  
  const consultModal = document.getElementById('consult-modal');
  const openConsultBtn = document.getElementById('open-modal-btn');
  const consultForm = document.getElementById('consult-form');

  // Этот код сработает, только если на странице есть кнопка 'open-modal-btn'
  if (consultModal && openConsultBtn) {
    const closeConsultBtn = consultModal.querySelector('.modal-close');

    openConsultBtn.addEventListener('click', () => consultModal.style.display = 'flex');
    closeConsultBtn.addEventListener('click', () => consultModal.style.display = 'none');
    window.addEventListener('click', (e) => {
      if (e.target === consultModal) consultModal.style.display = 'none';
    });

    // Отправка формы консультации в Telegram
    consultForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const contactMethod = e.target.querySelector('input[name="contactMethod"]:checked').value;
      const phone = e.target.querySelector('input[name="phone"]').value;
      const question = e.target.querySelector('textarea[name="question"]').value;
      let message = `<b>🔔 Новая заявка на консультацию!</b>\n\n<b>Способ связи:</b> ${contactMethod}\n<b>Телефон:</b> ${phone}\n<b>Вопрос:</b> ${question}`;
      sendToTelegram(message, e.target);
    });
  }

  // =============================================================================
  // --- ОБЩАЯ ФУНКЦИЯ ДЛЯ ОТПРАВКИ В TELEGRAM ---
  // =============================================================================
  function sendToTelegram(text, formElement) {
    const submitButton = formElement.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Отправка...';

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const params = { chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: 'HTML' };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    .then(response => response.json())
    .then(data => {
      if (data.ok) {
        alert('Спасибо! Ваша заявка отправлена. Мы скоро с вами свяжемся.');
        if (smileyOverlay) smileyOverlay.style.display = 'none';
        if (consultModal) consultModal.style.display = 'none';
        formElement.reset();
      } else {
        throw new Error(data.description);
      }
    })
    .catch(error => {
      console.error('Ошибка отправки:', error);
      alert('Произошла ошибка при отправке. Пожалуйста, попробуйте еще раз.');
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    });
  }
});
