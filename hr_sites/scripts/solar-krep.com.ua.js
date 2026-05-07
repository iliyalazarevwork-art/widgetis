// source: https://solar-krep.com.ua/
// extracted: 2026-05-07T21:22:41.861Z
// scripts: 2

// === script #1 (length=6842) ===
/* =====================================================
   КНОПКА "ПРОРАХУНОК"
===================================================== */
function createButton() {
    const button = document.createElement('button');
    button.id = 'openModalBtn';

    const isMobile = window.innerWidth <= 768;
    button.textContent = isMobile ? 'Прорахунок' : 'Прорахунок кріплення';

    button.style.cssText = `
        position: fixed;
        bottom: ${isMobile ? '140px' : '160px'};
        right: ${isMobile ? '14px' : '30px'};
        background-color: #e1a618;
        color: #fff;
        border: none;
        padding: ${isMobile ? '10px 14px' : '15px 20px'};
        border-radius: 50px;
        font-size: ${isMobile ? '13px' : '16px'};
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(225,166,24,.3);
        transition: all .3s ease;
        z-index: 1000;
        white-space: nowrap;
        font-family: Arial, sans-serif;
    `;

    document.body.appendChild(button);

    let lastScroll = window.pageYOffset;
    window.addEventListener('scroll', () => {
        const cur = window.pageYOffset;
        if (cur > lastScroll && cur > 200) {
            button.style.transform = 'translateY(120px)';
            button.style.opacity = '0';
        } else {
            button.style.transform = 'translateY(0)';
            button.style.opacity = '1';
        }
        lastScroll = cur;
    });

    return button;
}

/* =====================================================
   МОДАЛЬНЕ ВІКНО (MOBILE-STYLE ДЛЯ ВСІХ)
===================================================== */
function createModal() {
    const modal = document.createElement('div');
    modal.id = 'modal';

    modal.style.cssText = `
        display:none;
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.5);
        z-index:2000;
        justify-content:center;
        align-items:center;
        font-family:Arial,sans-serif;
    `;

    modal.innerHTML = `
        <div id="modalContent" style="
            background:#fff;
            border-radius:12px;
            width:100%;
            max-width:420px;
            padding:20px;
            position:relative;
            max-height:90vh;
            overflow:auto;
        ">
            <button id="closeModalBtn" style="
                position:absolute;
                top:12px;
                right:12px;
                background:none;
                border:none;
                font-size:22px;
                cursor:pointer;
            ">×</button>

            <h2 style="
                text-align:center;
                margin:10px 0 18px;
                font-size:18px;
            ">
                Прорахунок кріплення
            </h2>

            <form id="calculationForm" style="
                display:flex;
                flex-direction:column;
                gap:14px;
            ">

                <input type="text" name="name" placeholder="Імʼя">
                <input type="tel" name="phone" placeholder="Телефон *" required>
                <input type="number" name="panels_count" placeholder="Кількість панелей">
                <input type="number" name="rows_count" placeholder="Кількість рядів">

                <select name="mount_type">
                    <option value="">Тип монтажу</option>
                    <option value="roof">Дах</option>
                    <option value="ground">Земля</option>
                </select>

                <input type="text" name="city" placeholder="Місто">
                <textarea name="comment" placeholder="Коментар"></textarea>

                <button type="submit" style="
                    background:#e1a618;
                    color:#fff;
                    border:none;
                    padding:14px;
                    border-radius:10px;
                    font-size:16px;
                    font-weight:bold;
                    cursor:pointer;
                ">
                    Відправити заявку
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#modalContent')
        .addEventListener('click', e => e.stopPropagation());

    return modal;
}

/* =====================================================
   ЄДИНІ СТИЛІ INPUT (MOBILE-FIRST)
===================================================== */
const style = document.createElement('style');
style.textContent = `
#calculationForm input,
#calculationForm select,
#calculationForm textarea {
    padding:12px;
    border:2px solid #e0e0e0;
    border-radius:10px;
    font-size:15px;
    font-family:Arial,sans-serif;
    background:#fff;
}

#calculationForm input:focus,
#calculationForm select:focus,
#calculationForm textarea:focus {
    outline:none;
    border-color:#e1a618;
}

#calculationForm textarea {
    resize:vertical;
    min-height:80px;
}
`;
document.head.appendChild(style);

/* =====================================================
   ІНІЦІАЛІЗАЦІЯ + ВІДПРАВКА
===================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const button = createButton();
    const modal = createModal();

    const form = modal.querySelector('#calculationForm');
    const closeBtn = modal.querySelector('#closeModalBtn');

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        form.reset();
    }

    button.onclick = () => {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    closeBtn.onclick = closeModal;
    modal.onclick = closeModal;

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });

    form.onsubmit = async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());

        if (!data.phone) {
            alert('Введіть телефон');
            return;
        }

        try {
            const r = await fetch(
                'https://submitrequest-ka4stqaw2a-ey.a.run.app',
                {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify(data)
                }
            );
            const j = await r.json();

            if (r.ok && j.success) {
                alert('Заявка відправлена');
                closeModal();
            } else {
                alert(j.error || 'Помилка');
            }
        } catch {
            alert('Помилка зʼєднання');
        }
    };
});

// === script #2 (length=559) ===
(function(d) {
        d.querySelectorAll('.j-phone-item').forEach(function (el) {
            el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
        })
    })(document);
    (function(d, w, s) {
        var widgetHash = 'njh5obqhts1c3g44rkyi', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
        ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
        var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
      })(document, window, 'script');
