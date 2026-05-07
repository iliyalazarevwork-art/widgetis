// source: https://j-tail.com.ua/
// extracted: 2026-05-07T21:21:39.513Z
// scripts: 1

// === script #1 (length=1153) ===
document.addEventListener('DOMContentLoaded', function() {
  const input = document.querySelector('input[name="Recipient[delivery_name]"]');
  if (!input) return;

  const submitBtn = document.querySelector('button[type="submit"].btn.j-submit');
  if (submitBtn) submitBtn.disabled = false;

  const message = document.createElement('div');
  message.textContent = 'Будь ласка, використовуйте кирилицю для заповнення даних.';
  message.style.color = 'red';
  message.style.fontSize = '13px';
  message.style.marginTop = '5px';
  message.style.display = 'none';
  input.parentNode.appendChild(message);

  input.addEventListener('input', function() {
    let value = input.value;

    const hasLatin = /[A-Za-z]/.test(value);

    if (hasLatin) {
      message.style.display = 'block';
      input.style.borderColor = 'red';
      if (submitBtn) submitBtn.disabled = true;  
    } else {
      message.style.display = 'none';
      input.style.borderColor = '';
      if (value.trim() !== '') {
        if (submitBtn) submitBtn.disabled = false;
      }
    }

    input.value = value.replace(/[A-Za-z]/g, '');
  });
});
