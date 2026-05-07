// source: https://hart-opt.in.ua/
// extracted: 2026-05-07T21:21:32.264Z
// scripts: 1

// === script #1 (length=4364) ===
emailjs.init("TnlPV3wRMPlbDkA9M");




// ПК-модалка
const modal = document.getElementById("popupModal");
const closeBtn = document.getElementById("closeModal");
const form = document.getElementById("contactForm");
const submitBtn = form.querySelector("button");
const phoneInput = document.getElementById("phone");
const successMsg = document.getElementById("success-message");

// Мобільна модалка
const mobileModal = document.getElementById("mobileModal");
const closeMobile = document.getElementById("closeMobile");
const mobileForm = document.getElementById("mobileForm");
const mobileError = document.getElementById("mobileError");
const mobilePhoneInput = document.getElementById("mobilePhone");
const mobileNameInput = document.getElementById("mobileName");
const mobileSuccess = document.getElementById("mobileSuccess");

// Показ/приховування
function showModal() { modal.classList.add("show"); }
function hideModal() { modal.classList.remove("show"); }
function showMobileModal() { mobileModal.classList.add("show"); }
function hideMobileModal() { mobileModal.classList.remove("show"); }

// Кнопка виклику
const openModalBtn = document.getElementById("openModalBtn");
openModalBtn.addEventListener("click", () => {
  if (window.innerWidth <= 768) showMobileModal();
  else showModal();
});

// Закриття
closeBtn.addEventListener("click", hideModal);
modal.addEventListener("click", e => {
  if (e.target === modal) hideModal();
});

closeMobile.addEventListener("click", hideMobileModal);
mobileModal.addEventListener("click", e => {
  if (e.target === mobileModal) hideMobileModal();
});



// Валідація ПК
phoneInput.addEventListener("focus", () => {
  if (!phoneInput.value.startsWith("+380")) phoneInput.value = "+380";
});

phoneInput.addEventListener("input", () => {
  let val = phoneInput.value.replace(/\D/g, "");
  if (val.startsWith("380")) val = val.slice(3);
  val = val.slice(0, 9);
  phoneInput.value = "+380" + val;
});

form.addEventListener("submit", e => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = "Відправляємо...";

  emailjs.send("service_tl6ykpq", "template_himotq1", {
    name: document.getElementById("name").value,
    phone: phoneInput.value,
    time: new Date().toLocaleString()
  }).then(() => {
    successMsg.style.display = "block";
    setTimeout(() => successMsg.style.opacity = 1, 50);
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = "Відправити";
    setTimeout(() => {
      successMsg.style.opacity = 0;
      hideModal();
    }, 3000);
  });
});

// Мобільна форма
mobilePhoneInput.addEventListener("focus", () => {
  if (!mobilePhoneInput.value.startsWith("+380")) mobilePhoneInput.value = "+380";
});

mobilePhoneInput.addEventListener("input", () => {
  let val = mobilePhoneInput.value.replace(/\D/g, "");
  if (val.startsWith("380")) val = val.slice(3);
  val = val.slice(0, 9);
  mobilePhoneInput.value = "+380" + val;
});

mobileForm.addEventListener("submit", e => {
  e.preventDefault();
  mobileError.style.display = "none";

  if (!/^\+380\d{9}$/.test(mobilePhoneInput.value)) {
    mobileError.textContent = "Телефон некоректний.";
    mobileError.style.display = "block";
    return;
  }

  const btn = mobileForm.querySelector("button");
  btn.disabled = true;
  btn.textContent = "Відправляємо...";

  emailjs.send("service_tl6ykpq", "template_himotq1", {
    name: mobileNameInput.value,
    phone: mobilePhoneInput.value,
    time: new Date().toLocaleString()
  }).then(() => {
    mobileForm.reset();
    mobileSuccess.style.display = "block";
    setTimeout(() => mobileSuccess.style.opacity = 1, 50);
    btn.disabled = false;
    btn.textContent = "Відправити";
    setTimeout(() => {
      mobileSuccess.style.opacity = 0;
      hideMobileModal();
    }, 3000);
  });
});

// Анімація кнопки
setInterval(() => {
  openModalBtn.style.animation = "attention 1s ease";
  setTimeout(() => openModalBtn.style.animation = "", 1000);
}, 5000);

// Відкриття через data-атрибут
document.querySelectorAll('[data-modal="open"]').forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    if (window.innerWidth <= 768) showMobileModal();
    else showModal();
  });
});
