// source: https://hazardous.com.ua/
// extracted: 2026-05-07T21:20:17.339Z
// scripts: 1

// === script #1 (length=837) ===
const emailInput = document.querySelector('input[type="email"][name="user[email]"]');
if (emailInput) {
  emailInput.addEventListener('input', function (event) {
    const email = event.target.value;
    localStorage.setItem('wnUserEmail', email);
  });
}

setTimeout(() => {
  const storedEmail = localStorage.getItem('wnUserEmail');
  if (window.location.href.includes('termincin.com/checkout') && storedEmail) {
    const checkoutStepHeader = document.querySelector('.checkout-step-h');
    if (checkoutStepHeader) {
      const emailSpan = document.createElement('span');
      emailSpan.id = 'wnEmail';
      emailSpan.style.fontSize = '0';
      emailSpan.style.color = '#fff';
      emailSpan.textContent = storedEmail;
      checkoutStepHeader.insertAdjacentElement('afterend', emailSpan);
    }
  }
}, 3500)
