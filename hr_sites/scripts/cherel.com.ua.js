// source: https://cherel.com.ua/
// extracted: 2026-05-07T21:21:02.509Z
// scripts: 1

// === script #1 (length=2054) ===
document.addEventListener('DOMContentLoaded', function() {
    const widgetHTML = `
        <div class="chat-container">
            <button class="chat-btn">💬</button>
            <div class="chat-panel">
                <div class="chat-header">
                    Зв'яжіться з нами
                    <button class="close-btn">✕</button>
                </div>
                <div class="chat-options">
                    <a href="https://t.me/cherelbot" target="_blank" class="option-btn telegram">
                        <span class="icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                        Telegram
                    </a>
                    <a href="tel:+380976079405" class="option-btn phone">
                        <span class="icon">📞</span> Зателефонувати
                    </a>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('chat-widget-container').innerHTML = widgetHTML;

    const widget = document.querySelector('.chat-container');
    const button = document.querySelector('.chat-btn');
    const closeBtn = document.querySelector('.close-btn');

    button.addEventListener('click', function(e) {
        e.preventDefault();
        widget.classList.toggle('active');
    });

    closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        widget.classList.remove('active');
    });

    document.addEventListener('click', function(e) {
        if (!widget.contains(e.target)) {
            widget.classList.remove('active');
        }
    });
});
