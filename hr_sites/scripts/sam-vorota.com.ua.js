// source: https://sam-vorota.com.ua/
// extracted: 2026-05-07T21:22:32.917Z
// scripts: 1

// === script #1 (length=2459) ===
window.addEventListener("load", function() {
  const length = document.getElementById("mc-length");
  const height = document.getElementById("mc-height");
  const phone = document.getElementById("mc-phone");
  const lengthVal = document.getElementById("mc-lengthVal");
  const heightVal = document.getElementById("mc-heightVal");
  const wa = document.getElementById("mc-wa");
  const vb = document.getElementById("mc-vb");
  const tg = document.getElementById("mc-tg");
  const btnDrawing = document.getElementById("mc-getDrawing");

  const managerPhone = "380934760722"; 
  const managerTG = "SamVorota"; 

  // Функція для оновлення кольору доріжки (динамічний градієнт)
  function updateSliderFill(slider) {
    const min = slider.min || 0;
    const max = slider.max || 100;
    const value = slider.value;
    const percentage = (value - min) / (max - min) * 100;
    slider.style.setProperty('--value', percentage + '%');
  }

  function generateMessage(title) {
    const area = (length.value * height.value).toFixed(2);
    return `${title}:\n` +
           `📏 Довжина: ${length.value} м\n` +
           `↕️ Висота: ${height.value} м\n` +
           `📐 Площа: ${area} м²\n` +
           `📞 Тел: ${phone.value || "Не вказано"}`;
  }

  function updateLinks() {
    const msg = encodeURIComponent(generateMessage("Заявка з сайта"));
    wa.href = `https://wa.me/${managerPhone}?text=${msg}`;
    tg.href = `https://t.me/${managerTG}?text=${msg}`;
    
    vb.onclick = function(e) {
      e.preventDefault();
      navigator.clipboard.writeText(generateMessage("Заявка на креслення (Viber)"));
      window.location.href = `viber://chat?number=%2B${managerPhone}`;
      alert("Данні скопійовані! Вставте їх в чат Viber.");
    };
  }

  btnDrawing.onclick = function() {
    const msg = encodeURIComponent(generateMessage("ЗАПРОС НА КРЕСЛЕННЯ"));
    window.open(`https://t.me/${managerTG}?text=${msg}`, "_blank");
  };

  // Обробка рухів повзунків
  length.oninput = function() { 
    lengthVal.innerText = this.value + " м"; 
    updateSliderFill(this);
    updateLinks(); 
  };

  height.oninput = function() { 
    heightVal.innerText = this.value + " м"; 
    updateSliderFill(this);
    updateLinks(); 
  };

  phone.oninput = updateLinks;

  // Початкова ініціалізація кольору при завантаженні
  updateSliderFill(length);
  updateSliderFill(height);
  updateLinks();
});
