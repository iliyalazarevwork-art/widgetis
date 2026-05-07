// source: https://snamiplus.com.ua/
// extracted: 2026-05-07T21:20:30.696Z
// scripts: 3

// === script #1 (length=1139) ===
document.addEventListener("DOMContentLoaded", function () {
  const phrases = [
    "Блендер Philips",
    "Мультиварка Tefal",
    "Ваги кухонні Ardesto",
    "Тостер Philips",
    "Пральна машина Samsung",
    "Сушильна машина Beko",
    "Газова плита Indesit",
    "Пилосос для дому",
    "Техніка для кухні",
    "Мікрохвильовка Whirlpool"
  ];

  const input = document.querySelector('.search__input');
  if (!input) return;

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const currentPhrase = phrases[phraseIndex];
    const currentText = currentPhrase.substring(0, charIndex);
    input.setAttribute("placeholder", currentText);

    if (!isDeleting && charIndex < currentPhrase.length) {
      charIndex++;
      setTimeout(type, 100);
    } else if (isDeleting && charIndex > 0) {
      charIndex--;
      setTimeout(type, 50);
    } else {
      isDeleting = !isDeleting;
      if (!isDeleting) {
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
      setTimeout(type, 1200); // Пауза між словами
    }
  }

  type();
});

// === script #2 (length=519) ===
function showPopup() {
        document.getElementById("popup").style.display = "block";
    }

    function closePopup() {
        document.getElementById("popup").style.display = "none";
    }

    // Перевіряємо, чи popup вже показували в цій сесії
    const popupShown = sessionStorage.getItem("popupShown");

    if (!popupShown) {
        setTimeout(() => {
            showPopup();
            sessionStorage.setItem("popupShown", "true"); // Ставимо позначку, що показано
        }, 3000);
    }

// === script #3 (length=559) ===
(function(d) {
        d.querySelectorAll('.j-phone-item').forEach(function (el) {
            el.classList.add('binct-phone-number-' + el.getAttribute('data-index'));
        })
    })(document);
    (function(d, w, s) {
        var widgetHash = 'd08nt2vjtmsnuryj5096', ctw = d.createElement(s); ctw.type = 'text/javascript'; ctw.async = true;
        ctw.src = '//widgets.binotel.com/calltracking/widgets/'+ widgetHash +'.js';
        var sn = d.getElementsByTagName(s)[0]; sn.parentNode.insertBefore(ctw, sn);
      })(document, window, 'script');
