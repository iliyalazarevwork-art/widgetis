// source: https://medtehnikalife.com.ua/
// extracted: 2026-05-07T21:18:50.728Z
// scripts: 1

// === script #1 (length=531) ===
document.addEventListener('DOMContentLoaded', function () {
  // Блок "З цим товаром купують"
  var assoc = document.querySelector('[data-view-block="associatedProducts"]');
  if (assoc) {
    var wrap = assoc.closest('.j-product-block');
    if (wrap) wrap.classList.add('ml-associated');
  }

  // Блок "Опис"
  var desc = document.querySelector('.product-description.j-product-description');
  if (desc) {
    var dWrap = desc.closest('.product__group-item');
    if (dWrap) dWrap.classList.add('ml-desc');
  }
});
