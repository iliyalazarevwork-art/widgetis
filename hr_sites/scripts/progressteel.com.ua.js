// source: https://progressteel.com.ua/
// extracted: 2026-05-07T21:19:29.962Z
// scripts: 2

// === script #1 (length=998) ===
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

// === script #2 (length=583) ===
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-219525750-1', 'auto');
  ga('require', 'ec');
  ga('set', '&cu', GLOBAL.currency.iso);

   // заменяется кодом инициализации события с расположением "Внутри кода инициализации маркетинговой системы"
  
  ga('send', 'pageview');
