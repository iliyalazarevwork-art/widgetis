// source: https://daske.md/
// extracted: 2026-05-07T21:21:07.525Z
// scripts: 2

// === script #1 (length=1697) ===
const slides = [
  {
    src: 'https://daske.md/content/uploads/images/1t8a5184-min_d699f804-b328-402d-9897-9062e909debb-kopija.jpg?v=1727772746&width=600',
    title: 'Știm cum să le facem deosebite',
    text: 'Cu o experiență de zece ani în prelucrarea tablei, continuăm să creăm estetica spațiului dumneavoastră.'
  },
  {
    src: 'https://daske.md/content/uploads/images/1t8a5184-min_d699f804-b328-402d-9897-9062e909debb-kopija.jpg?v=1693160579&width=600',
    title: 'Produsele noastre sunt create pentru incluziune',
    text: 'Acum trei ani am început să ne extindem capacitățile de producție pentru spațiile rezidențiale și comerciale (oțel carbon și inoxidabil, aluminiu și alte materiale pe bază de aliaje dure, precum HardOx).'
  }
];

let current = 0;
const img1 = document.getElementById('daske-img1');
const img2 = document.getElementById('daske-img2');
const textBlock = document.getElementById('daske-text');
let showingFirst = true;

// Первое фото активное
img1.classList.add('active');

setInterval(() => {
  current = (current + 1) % slides.length;
  const next = slides[current];

  // Плавная смена текста
  textBlock.classList.add('fade');
  setTimeout(() => {
    textBlock.innerHTML = `<h2>${next.title}</h2><p>${next.text}</p>`;
    textBlock.classList.remove('fade');
  }, 500);

  // Плавная смена изображений с эффектом zoom
  if (showingFirst) {
    img2.src = next.src;
    img2.classList.add('active');
    img1.classList.remove('active');
  } else {
    img1.src = next.src;
    img1.classList.add('active');
    img2.classList.remove('active');
  }

  showingFirst = !showingFirst;
}, 7000); // смена каждые 7 секунд

// === script #2 (length=1219) ===
document.addEventListener('DOMContentLoaded', function() {

  const popup = document.getElementById('popup-banner');
  const img = popup.querySelector('img');

  const userLang = navigator.language || navigator.userLanguage;
  const isRu = userLang.startsWith('ru');

  const link = isRu 
    ? 'https://daske.md/baie/' 
    : 'https://daske.md/baie/';

  let lastScrollTop = 0;

  function showPopup() {
    popup.style.display = 'block';
    popup.style.opacity = '1';
    popup.style.transform = 'translateY(0) scale(1)';
  }

  function hidePopup() {
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(-50px) scale(0.95)';
    setTimeout(() => popup.style.display = 'none', 300);
  }

  // Показ после загрузки
  window.addEventListener('load', () => {
    setTimeout(() => { showPopup(); }, 100);
  });

  // Скролл
  window.addEventListener('scroll', () => {
   const st = window.pageYOffset || document.documentElement.scrollTop;

    if (st > lastScrollTop) hidePopup();
    else if (st <= 350) showPopup();

    lastScrollTop = st <= 0 ? 0 : st;
  });

  // Клик по баннеру
  img.addEventListener('click', () => window.open(link, '_blank'));

});
