// source: https://appiclean.com.ua/
// extracted: 2026-05-07T21:20:09.188Z
// scripts: 2

// === script #1 (length=752) ===
function isMobile() {
    const regex = /Mobi|Android|iPhone|iPad|iPod/i;
    return regex.test(navigator.userAgent);
}
// Header
function moveElement(selectorToMove, newParentSelector, afterSelector) {
    const elementToMove = document.querySelector(selectorToMove);
    const newParent = document.querySelector(newParentSelector);
    const referenceElement = document.querySelector(afterSelector);
    if (elementToMove && newParent && referenceElement) {
        newParent.insertBefore(elementToMove, referenceElement.nextSibling);
    } else {
        console.error("One or more elements not found.");
    }
}

if(!isMobile()) {
   moveElement('.header__section--search', '.header__layout--middle', '.header__column--center');
}

// === script #2 (length=1985) ===
function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
  }
window.onload = function() {

const script = document.createElement("script");
  script.src = "https://services.adsquiz.io/adsquiz_integration/adsquizscript_intbutton.js";
  script.type = "text/javascript";
  script.setAttribute("data-vidget-popup", "");
  script.async = true;

  document.head.appendChild(script);

const wrapper = document.createElement("div");
  wrapper.className = "quiz_popup_wrapper";

  wrapper.innerHTML = `
    <button type="button" 
      id="button_open_quiz_popup" 
      class="button_open_quiz_popup" 
      value="Розпочати квіз">
      
      <div class="quiz_popup_message">
        <span class="quiz_popup_text">
          Допомогти підібрати техніку для прибирання?
        </span>
      </div>
      
      <span class="icons8-info"></span>
    </button>
  `;

  document.body.appendChild(wrapper);


createAdsquizIframe("https://n3vusuvcjv.adsquiz.io?int_q=popup&utm_source=vidget_popup");
const popupWrapper = document.querySelector('.quiz_popup_wrapper');
const popupMessage = document.querySelector('.quiz_popup_message');
const buttonPopup = document.querySelector('.button_open_quiz_popup');
const sessionMessageVisibility = sessionStorage?.getItem("quiz_popup_message_visibility");
const timeoutID = !sessionMessageVisibility ? setTimeout(() => {
   popupMessage?.classList.add('quiz_popup_message_visibility');
}, 7000) : null;

popupWrapper.addEventListener('click', () => {
    popupMessage?.classList.remove('quiz_popup_message_visibility');
});

buttonPopup.addEventListener('mouseover', () => {
    popupMessage?.classList.add('quiz_popup_message_visibility');
    sessionStorage?.setItem("quiz_popup_message_visibility", true);
});

popupMessage.addEventListener('mouseout',() => {
    popupMessage?.classList.remove('quiz_popup_message_visibility');
});
};
