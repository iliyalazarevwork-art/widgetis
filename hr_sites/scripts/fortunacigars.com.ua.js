// source: https://fortunacigars.com.ua/
// extracted: 2026-05-07T21:19:39.215Z
// scripts: 1

// === script #1 (length=1190) ===
// Get the modal
var queryModal = document.getElementById("divModal");
var stopModal  = document.getElementById("divStop");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("ageVerification")[0];
var divVerify = document.getElementsByClassName("verifyAge")[0];

var submitBtn = document.getElementById("submitBtn");

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "block";
}

function stopLoad() {
  localStorage.setItem('fortunaCigarsStopLoad', 'done');
  location.reload();   // reload the page
}

submitBtn.onclick = function() {
  stopModal.style.display  = "none";
  queryModal.style.display = "none";
  stopLoad();
}

declineBtn.onclick = function() {
  location.href = "https://www.google.com/";
}


if (!localStorage.getItem('fortunaCigarsStopLoad')) {
  queryModal.style.display = "block";

  if(window.stop !== undefined) {
    window.stop();
  } else if (document.execCommand !== undefined) {  // for IE
    document.execCommand("Stop", false);
  }
}
