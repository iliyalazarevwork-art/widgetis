// source: https://voge-shop.com.ua/
// extracted: 2026-05-07T21:23:09.723Z
// scripts: 3

// === script #1 (length=4375) ===
(function () {
    const CONFIG = {
        THRESHOLD: 2500, // Поріг безкоштовної доставки
        TOTAL_SELECTORS: [
            '.cart-footer-b .j-total-sum', 
            '.cart__total-price.j-total-sum', 
            '.total-sum .j-total-sum',
            '.j-total-sum',
            '.cart-total__sum'
        ],
        COLOR_MAIN: '#8B1F2F', // Бордовий колір бренду
        COLOR_BG: '#f0f0f0',
        WIDGET_ID: 'free-shipping-box'
    };

    let isRendering = false;

    // Функція витягування чистої ціни
    function getCartData() {
        for (const selector of CONFIG.TOTAL_SELECTORS) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim()) {
                // Видаляємо все крім цифр, крапок та ком
                const priceText = el.textContent.replace(/[^\d.,]/g, '').replace(',', '.');
                const price = parseFloat(priceText);
                if (!isNaN(price) && price > 0) return { price, el };
            }
        }
        return null;
    }

    function renderWidget() {
        if (isRendering) return;
        
        const data = getCartData();
        if (!data) return;

        let box = document.getElementById(CONFIG.WIDGET_ID);
        
        if (!box) {
            isRendering = true;
            box = document.createElement('div');
            box.id = CONFIG.WIDGET_ID;
            box.style.cssText = `
                width: 100%; border: 1px solid #e1e1e1; border-radius: 12px;
                padding: 16px; margin: 15px 0; background: #ffffff;
                box-sizing: border-box; font-family: Arial, sans-serif; clear: both;
            `;
            const parent = data.el.closest('div');
            if (parent && parent.parentElement) {
                parent.parentElement.appendChild(box);
            }
            isRendering = false;
        }

        const diff = Math.max(0, CONFIG.THRESHOLD - data.price);
        const percent = Math.min(100, (data.price / CONFIG.THRESHOLD) * 100);
        const isFree = diff <= 0;

        // Зберігаємо статус для додавання коментаря в замовлення
        localStorage.setItem('freeShippingStatus', isFree ? 'yes' : 'no');

        box.innerHTML = `
            <div style="text-align: center; margin-bottom: 10px; font-size: 14px; font-weight: bold; color: #333;">
                ${isFree 
                    ? 'Вітаємо! Ви отримали безкоштовну доставку 🎉' 
                    : `До безкоштовної доставки: <span style="color: ${CONFIG.COLOR_MAIN};">${diff.toLocaleString()} грн</span>`
                }
            </div>
            <div style="width: 100%; background: ${CONFIG.COLOR_BG}; height: 8px; border-radius: 10px; overflow: hidden;">
                <div style="width: ${percent}%; background: ${CONFIG.COLOR_MAIN}; height: 100%; transition: width 0.5s ease-out;"></div>
            </div>
            <div style="margin-top: 10px; color: #666; font-size: 11px; text-align: center; line-height: 1.4; border-top: 1px solid #eee; padding-top: 8px;">
                ℹ️ Безкоштовна доставка не поширюється на варіант оплати "покупка частинами" від monobank та ПриватБанк.
            </div>
        `;
    }

    // Розумний наглядач за змінами в кошику
    const observer = new MutationObserver((mutations) => {
        const isOurWidgetChange = mutations.every(m => m.target.id === CONFIG.WIDGET_ID || m.target.closest && m.target.closest('#' + CONFIG.WIDGET_ID));
        if (!isOurWidgetChange) renderWidget();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Додавання мітки в коментар при натисканні "Оформити"
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.j-submit');
        if (btn) {
            const comment = document.querySelector('textarea[name="Recipient[comment]"]');
            const status = localStorage.getItem('freeShippingStatus');
            if (comment && status === 'yes') {
                const prefix = "Безкоштовна доставка у подарунок";
                if (!comment.value.includes(prefix)) {
                    comment.value = (prefix + "\n" + comment.value).trim();
                }
            }
        }
    });

    // Стартовий запуск
    renderWidget();
})();

// === script #2 (length=5023) ===
(function() {
  function initMotoSelect() {
    const commentField = document.querySelector('textarea[name="Recipient[comment]"]');
    if (!commentField || document.querySelector("select[name='MotoModel']")) {
      return false;
    }

    // --- Десктопна структура (dt/dd) ---
    const desktopWrapper = commentField.closest("dd");
    if (desktopWrapper) {
      const label = document.createElement("dt");
      label.className = "form-head";
      label.textContent = "Оберіть вашу модель мотоцикла";

      const container = document.createElement("dd");
      container.className = "form-item";

      const select = buildSelect(commentField);
      container.appendChild(select);

      desktopWrapper.insertAdjacentElement("afterend", container);
      desktopWrapper.insertAdjacentElement("afterend", label);
      return true;
    }

    // --- Мобільна структура (.form-item) ---
    const mobileWrapper = commentField.closest(".form-item");
    if (mobileWrapper) {
      const newItem = document.createElement("div");
      newItem.className = "form-item";

      const title = document.createElement("div");
      title.className = "form-item__title";
      title.textContent = "Оберіть вашу модель мотоцикла";

      const content = document.createElement("div");
      content.className = "form-item__content";

      const select = buildSelect(commentField);
      content.appendChild(select);

      newItem.appendChild(title);
      newItem.appendChild(content);

      mobileWrapper.insertAdjacentElement("afterend", newItem);
      return true;
    }

    return false;
  }

  // Функція створення select
  function buildSelect(commentField) {
    const select = document.createElement("select");
    select.className = "input";
    select.name = "MotoModel";
    select.required = true; // ✅ обов’язкове поле

    const models = [
      "Loncin LX250-15 CR4",
      "Loncin LX250GY-3K SX2 4V",
      "Loncin LX250-15D 4V",
      "Loncin LX250GY-3G DS2",
      "Loncin LX250GY-3 SX2",
      "Loncin LX300GY SX2 Pro (Однофарний)",
      "Loncin LX300GY-A DS2 Pro (Карбюраторний Rally)",
      "Voge 300R",
      "Voge 300RR",
      "Voge 300AC (ACX)",
      "Voge 300DS",
      "Voge 300 Rally (Інжектор)",
      "Voge 500R",
      "Voge 500DS",
      "Voge 500AC",
      "Voge 525R",
      "Voge 525RR",
      "Voge 525DSX",
      "Voge 525ACX",
      "Voge 650DS",
      "Voge 900DSX",
      "Інший бренд мотоцикла"
    ];

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "— Оберіть модель —";
    select.appendChild(placeholder);

    models.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      select.appendChild(opt);
    });

    select.addEventListener("change", function() {
      removeError(select);
      updateComment(commentField, this.value);
    });

    // === Перевірка при відправці ===
    try {
      const submitBtn = document.querySelector('.j-submit');
      if (submitBtn) {
        submitBtn.addEventListener('click', function (e) {
          if (!select.value) {
            e.preventDefault(); // ❌ блокуємо відправку
            showError(select, "Заповнити поле");
            return false;
          }
          updateComment(commentField, select.value);
        });
      }
    } catch(e) {
      console.warn('Moto model insert error', e);
    }

    return select;
  }

  // Оновлення поля коментаря
  function updateComment(commentField, model) {
    const prefix = "Модель мотоцикла:";
    let lines = commentField.value.split("\n").filter(l => !l.startsWith(prefix));
    if (model) {
      lines.unshift(prefix + " " + model);
    }
    commentField.value = lines.join("\n").trim();
  }

  // Показати помилку
  function showError(select, message) {
    const wrapper = select.closest('.form-item') || select.parentElement;
    if (!wrapper) return;

    wrapper.classList.add("error");
    let errorMsg = wrapper.querySelector(".form-error");
    if (!errorMsg) {
      errorMsg = document.createElement("div");
      errorMsg.className = "form-error";
      errorMsg.style.color = "red";   // ✅ червоний колір
      errorMsg.style.fontSize = "13px";
      errorMsg.style.marginTop = "4px";
      wrapper.appendChild(errorMsg);
    }
    errorMsg.textContent = message;
  }

  // При виборі моделі прибираємо помилку
  function removeError(select) {
    const wrapper = select.closest('.form-item') || select.parentElement;
    if (!wrapper) return;

    wrapper.classList.remove("error");
    const errorMsg = wrapper.querySelector(".form-error");
    if (errorMsg) errorMsg.remove();
  }

  // Чекаємо поки форма підвантажиться (важливо для PWA)
  const timer = setInterval(() => {
    if (initMotoSelect()) {
      clearInterval(timer);
    }
  }, 500);
})();

// === script #3 (length=2154) ===
(function() {
  function initFioValidation() {
    const input = document.querySelector('input[name="Recipient[name]"]');
    if (!input) return false;

    const form = input.closest("form");
    if (!form) return false;

    const regex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ']+\s+[A-Za-zА-Яа-яІіЇїЄєҐґ']+\s+[A-Za-zА-Яа-яІіЇїЄєҐґ']+$/;

    function validate() {
      const value = input.value.trim();

      if (!value) {
        showError(input, "Вкажіть Прізвище Ім'я По-батькові");
        return false;
      }

      if (!regex.test(value)) {
        showError(input, "Для відправлення потрібно вказати Прізвище Ім'я По-батькові");
        return false;
      }

      removeError(input);
      return true;
    }

    // 🔹 М’яка перевірка
    input.addEventListener("blur", validate);

    // 🔴 ГОЛОВНЕ — перехоплюємо submit форми
    form.addEventListener("submit", function(e) {
      if (!validate()) {
        e.preventDefault();
        e.stopPropagation(); // важливо для Хорошоп
        input.focus();
        return false;
      }
    });

    return true;
  }

  // === ТІ Ж ФУНКЦІЇ (як у тебе) ===

  function showError(input, message) {
    const wrapper = input.closest('.form-item') || input.parentElement;
    if (!wrapper) return;

    wrapper.classList.add("error");

    let errorMsg = wrapper.querySelector(".form-error");
    if (!errorMsg) {
      errorMsg = document.createElement("div");
      errorMsg.className = "form-error";
      errorMsg.style.color = "red";
      errorMsg.style.fontSize = "13px";
      errorMsg.style.marginTop = "4px";
      wrapper.appendChild(errorMsg);
    }

    errorMsg.textContent = message;
  }

  function removeError(input) {
    const wrapper = input.closest('.form-item') || input.parentElement;
    if (!wrapper) return;

    wrapper.classList.remove("error");

    const errorMsg = wrapper.querySelector(".form-error");
    if (errorMsg) errorMsg.remove();
  }

  // Чекаємо рендер (як у тебе)
  const timer = setInterval(() => {
    if (initFioValidation()) {
      clearInterval(timer);
    }
  }, 500);

})();
