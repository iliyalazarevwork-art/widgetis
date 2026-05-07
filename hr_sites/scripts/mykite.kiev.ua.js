// source: https://mykite.kiev.ua/
// extracted: 2026-05-07T21:19:57.898Z
// scripts: 1

// === script #1 (length=1211) ===
function detectMob() {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];

    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}


function custom_social(){ 

document.querySelector('svg.icon--viber')

var socialDiv = document.createElement('div');

var viberElOrigin = document.querySelector('.main-nav a[href^="viber"]')
var tgElOrigin = document.querySelector('.main-nav a[href^="tg"]')


var viberEl = viberElOrigin.cloneNode(false);
var tgEl = tgElOrigin.cloneNode(false);


viberEl.className = ""
tgEl.className = ""


socialDiv.classList.add("custom-social-icons");
viberEl.classList.add("link","custom-social-icons__social-link");
tgEl.classList.add("link","custom-social-icons__social-link");


viberEl.append(document.querySelector('svg.icon--viber').cloneNode(true));
tgEl.append(document.querySelector('svg.icon--telegram').cloneNode(true));


socialDiv.append(viberEl,tgEl);
document.querySelector('#header .header__right').append(socialDiv);

}

if(detectMob()) custom_social()
