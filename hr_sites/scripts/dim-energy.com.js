// source: https://dim-energy.com/
// extracted: 2026-05-07T21:21:10.741Z
// scripts: 1

// === script #1 (length=534) ===
function toggleMenu(){
var menu=document.getElementById("contactMenu");

if(menu.style.display==="flex"){
menu.style.display="none";
}else{
menu.style.display="flex";
}
}

/* ховання кнопки при прокрутці */
let lastScroll = 0;

window.addEventListener("scroll", function(){

let currentScroll = window.pageYOffset;
let button = document.getElementById("contactButton");

if(currentScroll > lastScroll){
button.classList.add("hide");
}else{
button.classList.remove("hide");
}

lastScroll = currentScroll;

});
