// source: https://forbarber.com/
// extracted: 2026-05-07T21:19:15.154Z
// scripts: 1

// === script #1 (length=1361) ===
jQuery('.faq-q').click(function(){
	if (jQuery(this).siblings().find('.faq-a').is(':visible')) {
		jQuery(this).removeClass('faq-q-open');
		jQuery(this).siblings().find('.faq-a').removeClass('faq-a-open').slideUp();
} 
else {
	jQuery(this).addClass('faq-q-open');
	jQuery(this).siblings().find('.faq-a').addClass('faq-a-open').slideDown();
	}
})


  const table = document.querySelector("#my-table tbody"); 
  const seoproducts = document.querySelectorAll(".catalogCard-info");
  const regularProducts = document.querySelectorAll(".catalog-card__content");
  let count = 0;

  seoproducts.forEach(product => {
    if (count < 5) {
      const row = table.insertRow();
      const nameCell = row.insertCell(); 
      const priceCell = row.insertCell(); 
      nameCell.innerHTML = product.querySelector(".catalogCard-title").innerHTML;
      priceCell.innerHTML = product.querySelector(".catalogCard-price").innerHTML;
      count++;
    }
  });

  regularProducts.forEach(product => {
    if (count < 5) {
      const row = table.insertRow();
      const nameCell = row.insertCell(); 
      const priceCell = row.insertCell(); 
      nameCell.innerHTML = product.querySelector(".catalog-card__title").innerHTML;
      priceCell.innerHTML = product.querySelector(".catalog-card__price").innerHTML;
      count++;
    }
  });
