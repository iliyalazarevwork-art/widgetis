// source: https://brennenstuhl-ukraine.com.ua/
// extracted: 2026-05-07T21:19:18.014Z
// scripts: 1

// === script #1 (length=7186) ===
(function() {
  'use strict';

  const API_URL = 'https://brennenstuhl-ai-backend-production.up.railway.app/api/ask';

  const chatLauncher = document.getElementById('chatLauncher');
  const chatWidget = document.getElementById('chatWidget');
  const chatClose = document.getElementById('chatClose');
  const chatBody = document.getElementById('chatBody');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatMicBtn = document.getElementById('chatMicBtn');

  let conversationHistory = [];
  let isLoading = false;

  function init() {
    addBotMessage('Вітаю! Я AI консультант Brennenstuhl. Готовий відповісти на ваші питання про нашу продукцію. Чим можу допомогти?');

    chatLauncher.addEventListener('click', openChat);
    chatClose.addEventListener('click', closeChat);
    chatSendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', handleKeyPress);
    chatMicBtn.addEventListener('click', handleMicClick);
  }

  function openChat() {
    chatWidget.classList.add('chat-widget--open');
    chatLauncher.classList.add('chat-launcher--hidden');
    chatInput.focus();
  }

  function closeChat() {
    chatWidget.classList.remove('chat-widget--open');
    chatLauncher.classList.remove('chat-launcher--hidden');
  }

  function addUserMessage(text) {
    const messageRow = document.createElement('div');
    messageRow.className = 'message-row message-row-user';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble-user';
    bubble.textContent = text;

    messageRow.appendChild(bubble);
    chatBody.appendChild(messageRow);
    scrollToBottom();
  }

  function addBotMessage(text) {
    const messageRow = document.createElement('div');
    messageRow.className = 'message-row';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;

    messageRow.appendChild(bubble);
    chatBody.appendChild(messageRow);
    scrollToBottom();
  }

  function addProductCards(products) {
    if (!products || products.length === 0) return;

    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';

      const hasDiscount = product.price_regular && product.price_regular > product.price_promo;

      card.innerHTML = `
        <div class="product-card-top">
          <div class="product-card-image">
            <img src="${product.image_url || ''}" alt="${product.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2212%22%3ENo image%3C/text%3E%3C/svg%3E'">
          </div>
          <div class="product-card-info">
            <div class="product-card-header">
              <div class="product-card-title">${product.name}</div>
            </div>
            <div class="product-card-prices">
              <div class="price-current">${product.price_promo} грн</div>
              ${hasDiscount ? `<div class="price-old">${product.price_regular} грн</div>` : ''}
            </div>
          </div>
        </div>
        <div class="product-card-desc">${product.description || ''}</div>
        <div class="product-card-link">
          <a href="${product.url}">Детальніше →</a>
          <button class="product-voice-btn" data-product-id="${product.id}" aria-label="Озвучити опис">
            🔊
          </button>
        </div>
      `;

      const messageRow = document.createElement('div');
      messageRow.className = 'message-row';
      messageRow.appendChild(card);
      chatBody.appendChild(messageRow);

      const voiceBtn = card.querySelector('.product-voice-btn');
      voiceBtn.addEventListener('click', () => handleProductVoice(product));
    });

    scrollToBottom();
  }

  function showTyping() {
    const messageRow = document.createElement('div');
    messageRow.className = 'message-row';
    messageRow.id = 'typing-indicator';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const typing = document.createElement('div');
    typing.className = 'message-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';

    bubble.appendChild(typing);
    messageRow.appendChild(bubble);
    chatBody.appendChild(messageRow);
    scrollToBottom();
  }

  function hideTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
  }

  function scrollToBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  }

  async function handleSend() {
    const question = chatInput.value.trim();

    if (!question || isLoading) return;

    addUserMessage(question);
    chatInput.value = '';

    isLoading = true;
    chatInput.disabled = true;
    chatSendBtn.disabled = true;

    showTyping();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question, history: conversationHistory })
      });

      if (!response.ok) throw new Error('HTTP ' + response.status);

      const data = await response.json();

      hideTyping();
      addBotMessage(data.answer);

      if (data.products && data.products.length > 0) {
        addProductCards(data.products);
      }

      conversationHistory.push(
        { role: 'user', content: question },
        { role: 'assistant', content: data.answer }
      );

      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
      }

    } catch (error) {
      hideTyping();
      console.error('Помилка:', error);
      addBotMessage('Вибачте, виникла помилка. Спробуйте ще раз або зв\'яжіться з нашим менеджером.');
    } finally {
      isLoading = false;
      chatInput.disabled = false;
      chatSendBtn.disabled = false;
      chatInput.focus();
    }
  }

  function handleMicClick() {
    console.log('Мікрофон: функціонал буде додано пізніше');
    chatMicBtn.classList.toggle('chat-mic-btn--active');
  }

  function handleProductVoice(product) {
    console.log('Озвучити:', product.name, product.description);
  }

  const currentPath = window.location.pathname;
  const allowedPaths = ['/testova/', '/testova', '/ru/testova/', '/ru/testova'];

  if (allowedPaths.includes(currentPath)) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  } else {
    const widget = document.getElementById('brennenstuhl-ai-widget');
    if (widget) widget.style.display = 'none';
  }
})();
