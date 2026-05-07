// source: https://krosseller.com.ua/
// extracted: 2026-05-07T21:20:37.773Z
// scripts: 1

// === script #1 (length=4193) ===
function показатиПершіУмови() {
    var заголовок = document.getElementById("перший_заголовок");
    var блокУмов = document.getElementById("перші_умови");
    if (блокУмов.style.display === "none") {
      блокУмов.style.display = "block";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Які умови доставки?</span></strong> <span style='font-size: 12px; color: gray;'>(згорнути)</span>";
    } else {
      блокУмов.style.display = "none";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Які умови доставки?</span></strong> <span style='font-size: 12px; color: gray;'>(відкрити)</span>";
    }
  }
  
  function показатиДругіУмови() {
    var заголовок = document.getElementById("другий_заголовок");
    var блокУмов = document.getElementById("другі_умови");
    if (блокУмов.style.display === "none") {
      блокУмов.style.display = "block";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Чи можна переглянути та приміряти товар перед оплатою?</span></strong> <span style='font-size: 12px; color: gray;'>(згорнути)</span>";
    } else {
      блокУмов.style.display = "none";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Чи можна переглянути та приміряти товар перед оплатою?</span></strong> <span style='font-size: 12px; color: gray;'>(відкрити)</span>";
    }
  }

  function показатиТретіУмови() {
    var заголовок = document.getElementById("третій_заголовок");
    var блокУмов = document.getElementById("треті_умови");
    if (блокУмов.style.display === "none") {
      блокУмов.style.display = "block";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Чи можна відмовитись від товару на пошті, якщо щось не в порядку?</span></strong> <span style='font-size: 12px; color: gray;'>(згорнути)</span>";
    } else {
      блокУмов.style.display = "none";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Чи можна відмовитись від товару на пошті, якщо щось не в порядку?</span></strong> <span style='font-size: 12px; color: gray;'>(відкрити)</span>";
    }
  }

  function показатиЧетвертіУмови() {
    var заголовок = document.getElementById("четвертий_заголовок");
    var блокУмов = document.getElementById("четверті_умови");
    if (блокУмов.style.display === "none") {
      блокУмов.style.display = "block";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Чи потрібна передоплата за товар?</span></strong> <span style='font-size: 12px; color: gray;'>(згорнути)</span>";
    } else {
      блокУмов.style.display = "none";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Чи потрібна передоплата за товар?</span></strong> <span style='font-size: 12px; color: gray;'>(відкрити)</span>";
    }
  }

  function показатиПятіУмови() {
    var заголовок = document.getElementById("пяті_заголовок");
    var блокУмов = document.getElementById("пяті_умови");
    if (блокУмов.style.display === "none") {
      блокУмов.style.display = "block";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Чи існує можливість обміну або повернення товару?</span></strong> <span style='font-size: 12px; color: gray;'>(згорнути)</span>";
    } else {
      блокУмов.style.display = "none";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Чи існує можливість обміну або повернення товару?</span></strong> <span style='font-size: 12px; color: gray;'>(відкрити)</span>";
    }
  }

  function показатиШостіУмови() {
    var заголовок = document.getElementById("шостий_заголовок");
    var блокУмов = document.getElementById("шості_умови");
    if (блокУмов.style.display === "none") {
      блокУмов.style.display = "block";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Чи є можливість самовивозу товару?</span></strong> <span style='font-size: 12px; color: gray;'>(згорнути)</span>";
    } else {
      блокУмов.style.display = "none";
      заголовок.innerHTML = "<strong><span style='font-size:16px;'>Чи є можливість самовивозу товару?</span></strong> <span style='font-size: 12px; color: gray;'>(відкрити)</span>";
    }
  }
