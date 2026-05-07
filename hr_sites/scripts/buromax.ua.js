// source: https://buromax.ua/
// extracted: 2026-05-07T21:19:13.854Z
// scripts: 1

// === script #1 (length=2369) ===
(function () {

  function isCheckoutPage() {
    return location.pathname.indexOf('/checkout') !== -1;
  }

  // визначення мови
  function getLang() {
    if (location.pathname.startsWith('/ru/')) return 'ru';
    return 'ua'; // все інше — українська версія
  }

  function initPickupNote() {
    if (!isCheckoutPage()) return;

    var deliverySelect = null;
    var selects = document.querySelectorAll('select');

    selects.forEach(function (sel) {
      if (deliverySelect) return;

      var name = (sel.name || '').toLowerCase();
      var label = sel.closest('div') && sel.closest('div').querySelector('label');
      var labelText = label ? label.textContent.toLowerCase() : '';

      if (
        name.indexOf('delivery') !== -1 ||
        name.indexOf('shipping') !== -1 ||
        labelText.indexOf('доставка') !== -1 ||
        labelText.indexOf('доставка') !== -1
      ) {
        deliverySelect = sel;
      }
    });

    if (!deliverySelect || deliverySelect.dataset.pickupNoteInit === '1') return;
    deliverySelect.dataset.pickupNoteInit = '1';

    // тексти для різних мов
    var lang = getLang();
    var texts = {
      ua: 'Самовивіз можливий на наступний робочий день після оплати. Дочекайтесь SMS або дзвінка менеджера про готовність замовлення до видачі.',
      ru: 'Самовывоз возможен на следующий рабочий день после оплаты. Дождитесь SMS или звонка менеджера о готовности заказа к выдаче.'
    };

    var note = document.createElement('div');
    note.className = 'pickup-note';
    note.textContent = texts[lang];
    note.style.marginTop = '8px';
    note.style.fontSize = '13px';
    note.style.color = '#555';

    deliverySelect.parentNode.appendChild(note);

    function toggleNote() {
      var opt = deliverySelect.options[deliverySelect.selectedIndex];
      var txt = (opt ? opt.textContent : '').toLowerCase();
      if (txt.indexOf('самовивіз') !== -1 || txt.indexOf('самовывоз') !== -1) {
        note.style.display = 'block';
      } else {
        note.style.display = 'none';
      }
    }

    toggleNote();
    deliverySelect.addEventListener('change', toggleNote);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPickupNote();
    setInterval(initPickupNote, 500); // перехоплюємо AJAX-перемальовку
  });

})();
