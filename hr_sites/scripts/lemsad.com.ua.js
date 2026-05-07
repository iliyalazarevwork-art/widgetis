// source: https://lemsad.com.ua/
// extracted: 2026-05-07T21:21:52.045Z
// scripts: 1

// === script #1 (length=3659) ===
(function() {
    // --- НАЛАШТУВАННЯ ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwhRIzUEwkcLzPROSg3Q7ugI9qd9JBvrq4G6AfssBB96TSG5CcVgqIvTiC1oZQ2a5Tx/exec';
    
    // ДВІ РІЗНІ КАРТИНКИ
    const IMG_PC = 'https://lemsad.com.ua/content/uploads/images/lemsad-10-welcome-pc-size.jpg';
    const IMG_MOBILE = 'https://lemsad.com.ua/content/uploads/images/lemsad-10-welcome.png';
    
    const SHOW_DELAY = 7000; 
    const PRELOAD_DELAY = 3500; 

    // Елементи
    const overlay = document.getElementById('lemsad-popup-overlay');
    const closeBtn = document.getElementById('popup-close');
    const finalCloseBtn = document.getElementById('popup-close-btn-final');
    const submitBtn = document.getElementById('popup-submit-btn');
    const emailInput = document.getElementById('popup-email');
    const errorMsg = document.getElementById('popup-error');
    const imageBlock = document.getElementById('popup-image-block');

    if (localStorage.getItem('lemsad_subscribed') === 'true') return;
    if (localStorage.getItem('lemsad_popup_closed') === 'true') return;

    // --- ФУНКЦІЯ ВИБОРУ КАРТИНКИ ---
    function loadSmartImage() {
        if (imageBlock.style.backgroundImage) return;
        const isMobile = window.innerWidth <= 768;
        const imageUrl = isMobile ? IMG_MOBILE : IMG_PC;
        imageBlock.style.backgroundImage = 'url("' + imageUrl + '")';
    }

    setTimeout(loadSmartImage, PRELOAD_DELAY);

    function showPopup() {
        if (overlay.style.display === 'none') {
            loadSmartImage();
            overlay.style.display = 'flex';
        }
    }

    setTimeout(showPopup, SHOW_DELAY);

    let exitIntentTriggered = false;
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY < 0 && !exitIntentTriggered) {
             if (localStorage.getItem('lemsad_popup_closed') !== 'true') {
                loadSmartImage();
                showPopup();
                exitIntentTriggered = true;
             }
        }
    });

    function closePopup() {
        overlay.style.display = 'none';
        localStorage.setItem('lemsad_popup_closed', 'true');
    }
    closeBtn.addEventListener('click', closePopup);
    finalCloseBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });

    submitBtn.addEventListener('click', function() {
        const email = emailInput.value;
        if (!email.includes('@') || email.length < 5) {
            errorMsg.style.display = 'block'; errorMsg.innerText = 'Введіть коректний email'; return;
        }

        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'ОБРОБКА...';
        submitBtn.disabled = true;
        
        // Використовуємо mode: 'no-cors' для транзиту через GAS
        fetch(SCRIPT_URL, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        }).then(() => {
            // Успіх транзиту -> перемикаємо на інструкцію DOI
            document.getElementById('popup-form-step').style.display = 'none';
            document.getElementById('popup-success-step').style.display = 'block';
            localStorage.setItem('lemsad_subscribed', 'true');
        }).catch(err => {
            console.error(err);
            submitBtn.innerText = originalBtnText; submitBtn.disabled = false;
            errorMsg.style.display = 'block'; errorMsg.innerText = 'Помилка з\'єднання';
        });
    });
})();
