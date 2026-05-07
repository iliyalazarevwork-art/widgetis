// source: https://eniki.com.ua/
// extracted: 2026-05-07T21:19:23.319Z
// scripts: 2

// === script #1 (length=650) ===
window.fbAsyncInit = function() {
                FB.init({
                    appId            : '',
                    autoLogAppEvents : true,
                    xfbml            : true,
                    version          : 'v2.12'
                });
            };
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

// === script #2 (length=6781) ===
document.addEventListener('DOMContentLoaded', () => {
    // === 1. ИНИЦИАЛИЗАЦИЯ (ВИДЖЕТ) ===
    const toggleBtn = document.getElementById('smart-toggle-btn');
    const menuList = document.getElementById('smart-list');
    const bubble = document.getElementById('sw-welcome-bubble');
    const bubbleText = document.getElementById('sw-bubble-text');
    const closeBubble = document.getElementById('sw-close-bubble');
    const cycleIcons = document.querySelectorAll('.cycle-icon');
    const cssClose = document.getElementById('css-close');
    const iconCycler = document.getElementById('icon-cycler');
    
    // === 2. ИНИЦИАЛИЗАЦИЯ (ФОРМА И МАСКА) ===
    const overlay = document.getElementById('callback-overlay');
    const cbForm = document.getElementById('cb-form');
    const phoneInput = document.getElementById('cb-phone-input');
    const submitBtn = document.getElementById('cb-submit');
    const closeModalBtn = document.getElementById('close-modal');
    const toast = document.getElementById('sw-toast');

    // === 3. ЛОГИКА ВИДЖЕТА ===
    let isOpen = false;
    let cycleInterval;

    function initGreetings() {
        const hasSeenFirst = localStorage.getItem('sw_seen_first_greeting');
        const sessionStarted = sessionStorage.getItem('sw_session_active');

        if (!hasSeenFirst) {
            setTimeout(() => { if (!isOpen) { showBubble("👋 Є питання? Ми допоможемо з вибором!"); localStorage.setItem('sw_seen_first_greeting', 'true'); setTimeout(hideBubble, 7000); } }, 15000);
        } else if (!sessionStarted) {
            setTimeout(() => { if (!isOpen) { showBubble("😊 Раді бачити вас знову! Потрібна допомога?"); setTimeout(hideBubble, 7000); } }, 5000);
        }
        sessionStorage.setItem('sw_session_active', 'true');
    }

    function showBubble(text) { bubbleText.innerText = text; bubble.classList.add('visible'); }
    function hideBubble() { bubble.classList.remove('visible'); }

    closeBubble.addEventListener('click', (e) => { e.stopPropagation(); hideBubble(); });
    bubble.addEventListener('click', () => { toggleMenu(); hideBubble(); });

    function startCycle() {
        let i = 0;
        cycleInterval = setInterval(() => {
            cycleIcons.forEach(el => el.classList.remove('active'));
            i = (i + 1) % cycleIcons.length;
            cycleIcons[i].classList.add('active');
        }, 3000);
    }

    function toggleMenu() {
        isOpen = !isOpen;
        menuList.classList.toggle('visible', isOpen);
        cssClose.classList.toggle('visible', isOpen);
        iconCycler.classList.toggle('hidden', isOpen);
        toggleBtn.setAttribute('aria-expanded', isOpen);
        toggleBtn.style.backgroundColor = isOpen ? 'var(--sw-close)' : 'var(--sw-main)';
        if (isOpen) { clearInterval(cycleInterval); hideBubble(); } else { startCycle(); }
    }
    toggleBtn.addEventListener('click', toggleMenu);

    // === 4. ОТКРЫТИЕ ФОРМЫ (И БЛОКИРОВКА СКРОЛЛА) ===
    document.getElementById('trigger-callback').onclick = (e) => {
        e.stopPropagation();
        if(isOpen) toggleMenu();
        
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden'; 
        
        document.getElementById('page-url').value = window.location.href;
        
        setTimeout(() => {
            phoneInput.focus();
            if(!phoneInput.value) phoneInput.value = "+380 (";
        }, 300);
    };
    
    const closeModal = () => {
        overlay.classList.remove('visible');
        document.body.style.overflow = ''; 
    };
    
    closeModalBtn.onclick = closeModal;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    
    // NEW: Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('visible')) {
            closeModal();
        }
    });

    // === 5. МАСКА ТЕЛЕФОНА ===
    phoneInput.addEventListener('input', function(e) {
        let value = this.value.replace(/\D/g, '');
        if (value.length === 0) {
            this.value = '';
            submitBtn.classList.remove('ready');
            return;
        }
        if (value.substring(0, 3) !== '380') {
            if (value.startsWith('80')) value = '3' + value;
            else if (value.startsWith('0')) value = '38' + value;
            else value = '380' + value;
        }
        value = value.substring(0, 12);
        let formattedValue = '+380';
        if (value.length > 3) formattedValue += ' (' + value.substring(3, 5);
        if (value.length >= 5) formattedValue += ') ' + value.substring(5, 8);
        if (value.length >= 8) formattedValue += '-' + value.substring(8, 10);
        if (value.length >= 10) formattedValue += '-' + value.substring(10, 12);
        
        this.value = formattedValue;
        
        if (value.length === 12) {
            submitBtn.classList.add('ready');
            submitBtn.disabled = false;
        } else {
            submitBtn.classList.remove('ready');
            submitBtn.disabled = true;
        }
    });

    phoneInput.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.value.length <= 6) {
             e.preventDefault();
             this.value = '';
             submitBtn.classList.remove('ready');
        }
    });

    // === 6. ОТПРАВКА БЕЗ ПЕРЕЗАГРУЗКИ ===
    cbForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const rawNum = phoneInput.value.replace(/\D/g, '');
        if (rawNum.length < 12) return;

        submitBtn.textContent = 'Відправка...';
        submitBtn.style.opacity = '0.7';

        const formData = new FormData(cbForm);

        fetch(cbForm.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        })
        .then(response => {
            closeModal();
            toast.classList.add('visible');
            cbForm.reset();
            submitBtn.textContent = 'Чекаю на дзвінок';
            submitBtn.classList.remove('ready');
            submitBtn.style.opacity = '1';
            setTimeout(() => { toast.classList.remove('visible'); }, 2000);
        })
        .catch(error => {
            console.error('Error:', error);
            closeModal();
            toast.textContent = "Помилка з'єднання 😔";
            toast.style.background = "#ef4444";
            toast.classList.add('visible');
            setTimeout(() => toast.classList.remove('visible'), 3000);
        });
    });

    startCycle();
    initGreetings();
});
