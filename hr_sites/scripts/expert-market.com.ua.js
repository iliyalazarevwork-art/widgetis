// source: https://expert-market.com.ua/
// extracted: 2026-05-07T21:19:52.302Z
// scripts: 1

// === script #1 (length=1288) ===
(function () {
  const wrap = document.querySelector('.xo-icons');
  if (!wrap) return;

  function closeModal() {
    const oldModal = document.getElementById('xo-global-modal');
    if (oldModal) oldModal.remove();
    document.removeEventListener('keydown', escHandler);
  }

  function escHandler(e) {
    if (e.key === 'Escape') closeModal();
  }

  function openModal(src) {
    closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'xo-modal-overlay';
    overlay.id = 'xo-global-modal';

    const close = document.createElement('div');
    close.className = 'xo-modal-close';
    close.innerHTML = '&times;';

    const img = document.createElement('img');
    img.src = src;
    img.alt = '';

    overlay.appendChild(close);
    overlay.appendChild(img);

    close.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);
    document.addEventListener('keydown', escHandler);
  }

  wrap.querySelectorAll('img[data-full]').forEach(function (img) {
    img.addEventListener('click', function () {
      openModal(this.getAttribute('data-full'));
    });
  });
})();
